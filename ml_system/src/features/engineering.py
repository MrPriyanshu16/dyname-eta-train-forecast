"""
Feature Engineering & Point-in-Time Feature Extractor for Rajasthan Railway ETA
Maintains clean interface for Stage 2 Supervised ML models while preventing future leakage.
"""

from typing import Dict, Any, Optional
import datetime
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from ml_system.config.config import PROCESSED_DATA_DIR

FEATURE_COLUMNS = [
    'current_delay_min',
    'distance_from_origin',
    'distance_remaining',
    'journey_progress_ratio',
    'priority_tier',
    'section_occupancy_ratio',
    'headway_km',
    'weather_fog_index',
    'is_junction_ahead',
    'hour_sin',
    'hour_cos',
    'day_of_week',
    'is_weekend',
    'hist_train_avg_delay',
    'hist_station_avg_delay'
]

TARGET_COLUMN_DEST = 'target_remaining_time_to_destination'
TARGET_COLUMN_STATION = 'target_remaining_time_to_station'


class PointInTimeFeatureExtractor:
    """
    Constructs a leak-free point-in-time feature representation anchored at observation timestamp T.
    Ensures that every ETA prediction is reproducible from:
    observation_timestamp + current_station + current_delay + timetable.
    
    This preserves the Stage 2 ML interface so future trained models (XGBoost/LightGBM)
    can consume live features directly without requiring an API redesign.
    """
    def __init__(self, pipeline_path: Optional[Path] = None):
        self.pipeline = None
        if pipeline_path and pipeline_path.exists():
            try:
                self.pipeline = RailwayFeaturePipeline.load(pipeline_path)
            except Exception:
                self.pipeline = None

    def extract_features(
        self,
        train_number: str,
        observation_timestamp: str,
        current_station_code: str,
        target_station_code: str,
        current_delay_minutes: float,
        distance_from_origin_km: float = 0.0,
        distance_remaining_km: float = 100.0,
        priority_tier: int = 2,
        speed_kmh: Optional[float] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        weather_fog_index: float = 0.0
    ) -> Dict[str, Any]:
        try:
            obs_dt = datetime.datetime.fromisoformat(observation_timestamp.replace('Z', '+00:00'))
        except Exception:
            obs_dt = datetime.datetime.now()

        hour = obs_dt.hour + obs_dt.minute / 60.0
        dow = obs_dt.weekday()
        is_weekend = 1 if dow in (5, 6) else 0

        total_dist = max(1.0, distance_from_origin_km + distance_remaining_km)
        journey_progress = min(1.0, max(0.0, distance_from_origin_km / total_dist))

        feature_dict = {
            'train_number': str(train_number),
            'observation_timestamp': obs_dt.isoformat(),
            'current_station_code': current_station_code,
            'target_station_code': target_station_code,
            'current_delay_min': float(current_delay_minutes),
            'distance_from_origin': float(distance_from_origin_km),
            'distance_remaining': float(distance_remaining_km),
            'journey_progress_ratio': float(journey_progress),
            'priority_tier': int(priority_tier),
            'section_occupancy_ratio': 0.5,
            'headway_km': 15.0,
            'weather_fog_index': float(weather_fog_index),
            'is_junction_ahead': 1 if current_station_code.endswith(('JN', 'C')) else 0,
            'hour_sin': float(np.sin(2 * np.pi * hour / 24.0)),
            'hour_cos': float(np.cos(2 * np.pi * hour / 24.0)),
            'day_of_week': int(dow),
            'is_weekend': int(is_weekend),
            'speed_kmh': speed_kmh,  # Null if unavailable, never fabricated
            'latitude': latitude,    # Null if unavailable
            'longitude': longitude,  # Null if unavailable
            'hist_train_avg_delay': 0.0,
            'hist_station_avg_delay': 0.0
        }

        if self.pipeline:
            feature_dict['hist_train_avg_delay'] = self.pipeline.train_stats.get(
                str(train_number), {}
            ).get('avg_delay', self.pipeline.global_avg_delay)
            feature_dict['hist_station_avg_delay'] = self.pipeline.station_stats.get(
                current_station_code, {}
            ).get('avg_delay', self.pipeline.global_avg_delay)

        return feature_dict


class RailwayFeaturePipeline:
    def __init__(self):
        self.train_stats = {}
        self.station_stats = {}
        self.global_avg_delay = 0.0

    def fit(self, train_df: pd.DataFrame):
        """
        Compute historical statistics strictly from the training dataset.
        Guarantees zero future leakage into validation/test periods.
        """
        self.global_avg_delay = float(train_df['current_delay_min'].mean()) if 'current_delay_min' in train_df.columns else 0.0
        
        # Train-level delay behavior
        if 'train_number' in train_df.columns and 'current_delay_min' in train_df.columns:
            t_grp = train_df.groupby('train_number')['current_delay_min'].agg(['mean', 'std']).reset_index()
            for _, row in t_grp.iterrows():
                self.train_stats[str(row['train_number'])] = {
                    'avg_delay': float(row['mean']),
                    'std_delay': float(0.0 if np.isnan(row['std']) else row['std'])
                }
            
        # Station-level delay behavior
        if 'station_code' in train_df.columns and 'current_delay_min' in train_df.columns:
            s_grp = train_df.groupby('station_code')['current_delay_min'].agg(['mean', 'std']).reset_index()
            for _, row in s_grp.iterrows():
                self.station_stats[str(row['station_code'])] = {
                    'avg_delay': float(row['mean']),
                    'std_delay': float(0.0 if np.isnan(row['std']) else row['std'])
                }
            
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        # Cyclical temporal encodings
        hour = df['hour_of_day'] if 'hour_of_day' in df.columns else 12.0
        df['hour_sin'] = np.sin(2 * np.pi * hour / 24.0)
        df['hour_cos'] = np.cos(2 * np.pi * hour / 24.0)
        
        # Journey progress: robust calculation without hardcoding NDLS-CNB distance
        dist_orig = df['distance_from_origin'] if 'distance_from_origin' in df.columns else 0.0
        dist_rem = df['distance_remaining'] if 'distance_remaining' in df.columns else 100.0
        total_dist = np.maximum(1.0, dist_orig + dist_rem)
        df['journey_progress_ratio'] = np.clip(dist_orig / total_dist, 0.0, 1.0)
        
        # Map historical statistics fitted strictly from training set
        df['hist_train_avg_delay'] = df['train_number'].astype(str).map(
            lambda x: self.train_stats.get(x, {}).get('avg_delay', self.global_avg_delay)
        )
        df['hist_station_avg_delay'] = df['station_code'].astype(str).map(
            lambda x: self.station_stats.get(x, {}).get('avg_delay', self.global_avg_delay)
        )
        
        return df

    def save(self, filepath: Path):
        joblib.dump({
            'train_stats': self.train_stats,
            'station_stats': self.station_stats,
            'global_avg_delay': self.global_avg_delay,
            'feature_columns': FEATURE_COLUMNS
        }, filepath)

    @classmethod
    def load(cls, filepath: Path):
        data = joblib.load(filepath)
        obj = cls()
        obj.train_stats = data.get('train_stats', {})
        obj.station_stats = data.get('station_stats', {})
        obj.global_avg_delay = data.get('global_avg_delay', 0.0)
        return obj
