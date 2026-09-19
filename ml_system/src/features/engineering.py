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
        self.global_avg_delay = float(train_df['current_delay_min'].mean())
        
        # Train-level delay behavior
        t_grp = train_df.groupby('train_number')['current_delay_min'].agg(['mean', 'std']).reset_index()
        for _, row in t_grp.iterrows():
            self.train_stats[str(row['train_number'])] = {
                'avg_delay': float(row['mean']),
                'std_delay': float(0.0 if np.isnan(row['std']) else row['std'])
            }
            
        # Station-level delay behavior
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
        
        # Journey progress
        dist_orig = df['distance_from_origin']
        df['journey_progress_ratio'] = np.clip(dist_orig / 440.3, 0.0, 1.0)
        
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
        obj.train_stats = data['train_stats']
        obj.station_stats = data['station_stats']
        obj.global_avg_delay = data['global_avg_delay']
        return obj

def build_features():
    train_df = pd.read_csv(PROCESSED_DATA_DIR / 'train.csv')
    val_df = pd.read_csv(PROCESSED_DATA_DIR / 'val.csv')
    test_df = pd.read_csv(PROCESSED_DATA_DIR / 'test.csv')
    
    pipeline = RailwayFeaturePipeline()
    pipeline.fit(train_df)
    
    train_feats = pipeline.transform(train_df)
    val_feats = pipeline.transform(val_df)
    test_feats = pipeline.transform(test_df)
    
    pipeline_path = PROCESSED_DATA_DIR / 'feature_pipeline.joblib'
    pipeline.save(pipeline_path)
    
    train_feats.to_csv(PROCESSED_DATA_DIR / 'train_features.csv', index=False)
    val_feats.to_csv(PROCESSED_DATA_DIR / 'val_features.csv', index=False)
    test_feats.to_csv(PROCESSED_DATA_DIR / 'test_features.csv', index=False)
    
    print(f'Feature engineering complete. Saved pipeline to {pipeline_path}')
    print(f'Features extracted ({len(FEATURE_COLUMNS)}): {FEATURE_COLUMNS}')

if __name__ == '__main__':
    build_features()
