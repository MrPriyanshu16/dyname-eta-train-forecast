import math
import datetime
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from ml_system.config.config import (
    MODELS_DIR,
    PROCESSED_DATA_DIR,
    CORRIDOR_STATIONS,
    CORRIDOR_TRAINS,
    CORRIDOR_SECTIONS
)
from ml_system.src.features.engineering import RailwayFeaturePipeline, FEATURE_COLUMNS
from ml_system.src.geospatial.validator import GPSLocationValidator

class RealTimeETAPredictor:
    def __init__(self):
        print("Initializing Real-Time ETA Predictor...")
        self.feature_pipeline = RailwayFeaturePipeline.load(PROCESSED_DATA_DIR / "feature_pipeline.joblib")
        self.model = joblib.load(MODELS_DIR / "eta_xgboost.joblib")
        self.q_low = joblib.load(MODELS_DIR / "eta_q_low.joblib")
        self.q_high = joblib.load(MODELS_DIR / "eta_q_high.joblib")
        self.validator = GPSLocationValidator(CORRIDOR_STATIONS)
        self.station_map = {s['code']: s for s in CORRIDOR_STATIONS}
        self.train_map = {t['train_number']: t for t in CORRIDOR_TRAINS}

    def predict_eta(
        self,
        train_number: str,
        timestamp_str: str,
        latitude: float,
        longitude: float,
        speed_kmh: float,
        current_delay_min: float = 0.0,
        weather_fog_index: float = 0.0,
        section_occupancy_ratio: float = 0.5,
        headway_km: float = 15.0
    ) -> Dict[str, Any]:
        # 1. Validate location
        val_result = self.validator.validate_observation(
            train_number=train_number,
            timestamp=timestamp_str,
            lat=latitude,
            lng=longitude,
            speed_kmh=speed_kmh
        )

        train_info = self.train_map.get(train_number, {
            'train_name': f'Train {train_number}',
            'priority_tier': 3,
            'stops': [s['code'] for s in CORRIDOR_STATIONS]
        })

        # 2. Parse current timestamp
        try:
            curr_time = datetime.datetime.fromisoformat(timestamp_str.replace('Z', ''))
        except Exception:
            curr_time = datetime.datetime.now()

        current_km = val_result['corridor_progress_km']
        dist_remaining_total = max(0.0, 440.3 - current_km)

        # Determine current section
        curr_section_name = "OUT_OF_CORRIDOR"
        for sec in CORRIDOR_SECTIONS:
            from_sta = self.station_map[sec['from']]
            to_sta = self.station_map[sec['to']]
            if from_sta['km'] <= current_km <= to_sta['km']:
                curr_section_name = f"{sec['from']}-{sec['to']}"
                break
        if curr_section_name == "OUT_OF_CORRIDOR":
            curr_section_name = f"{val_result['nearest_station']}-ENROUTE"

        # 3. Build features for Destination ETA
        feat_dict = {
            'train_number': [train_number],
            'station_code': [val_result['nearest_station']],
            'current_delay_min': [current_delay_min],
            'distance_from_origin': [current_km],
            'distance_remaining': [dist_remaining_total],
            'journey_progress_ratio': [current_km / 440.3],
            'priority_tier': [train_info['priority_tier']],
            'section_occupancy_ratio': [section_occupancy_ratio],
            'headway_km': [headway_km],
            'weather_fog_index': [weather_fog_index],
            'is_junction_ahead': [1 if self.station_map.get(val_result['nearest_station'], {}).get('is_junction', False) else 0],
            'hour_of_day': [curr_time.hour],
            'day_of_week': [curr_time.weekday()],
            'is_weekend': [1 if curr_time.weekday() >= 5 else 0]
        }

        df_feat = pd.DataFrame(feat_dict)
        df_trans = self.feature_pipeline.transform(df_feat)
        X_vec = df_trans[FEATURE_COLUMNS]

        # ML predictions for Destination
        pred_dest_rem_min = float(self.model.predict(X_vec)[0])
        pred_dest_rem_min = max(0.0, pred_dest_rem_min)
        raw_low = float(self.q_low.predict(X_vec)[0])
        raw_high = float(self.q_high.predict(X_vec)[0])
        q_low_min = max(0.0, min(raw_low, raw_high, pred_dest_rem_min * 0.90))
        q_high_min = max(pred_dest_rem_min, max(raw_low, raw_high, pred_dest_rem_min * 1.10))

        dest_eta = curr_time + datetime.timedelta(minutes=pred_dest_rem_min)
        dest_low = curr_time + datetime.timedelta(minutes=q_low_min)
        dest_high = curr_time + datetime.timedelta(minutes=q_high_min)

        # Baseline comparisons for destination
        nominal_speed = 100.0 if train_info['priority_tier'] <= 2 else 85.0
        tt_baseline_rem_min = (dist_remaining_total / nominal_speed) * 60.0
        dp_baseline_rem_min = tt_baseline_rem_min + current_delay_min
        dp_dest_eta = curr_time + datetime.timedelta(minutes=dp_baseline_rem_min)

        # 4. Multi-Horizon: Predict upcoming station ETAs
        upcoming_stations = []
        stops = train_info.get('stops', [s['code'] for s in CORRIDOR_STATIONS])

        for code in stops:
            sta = self.station_map[code]
            if sta['km'] > current_km + 1.0: # Ahead of current location
                sta_dist_rem = sta['km'] - current_km
                fraction_of_journey = sta_dist_rem / dist_remaining_total if dist_remaining_total > 0 else 1.0
                
                # Dynamic section-scaled travel time
                sta_rem_min = pred_dest_rem_min * fraction_of_journey
                sta_eta = curr_time + datetime.timedelta(minutes=sta_rem_min)
                
                # Baseline comparison for station
                sta_sched_min = (sta_dist_rem / nominal_speed) * 60.0
                sta_dp_min = sta_sched_min + current_delay_min
                sta_dp_eta = curr_time + datetime.timedelta(minutes=sta_dp_min)

                upcoming_stations.append({
                    "station_code": code,
                    "station_name": sta['name'],
                    "distance_km": round(sta_dist_rem, 1),
                    "predicted_remaining_minutes": round(sta_rem_min, 1),
                    "predicted_eta": sta_eta.strftime("%H:%M"),
                    "ntes_baseline_eta": sta_dp_eta.strftime("%H:%M"),
                    "is_junction": sta['is_junction']
                })

        return {
            "train_number": train_number,
            "train_name": train_info.get('train_name', f'Train {train_number}'),
            "timestamp": curr_time.strftime("%Y-%m-%d %H:%M:%S"),
            "current_location": {
                "latitude": latitude,
                "longitude": longitude,
                "speed_kmh": speed_kmh,
                "nearest_station": val_result['nearest_station'],
                "current_section": curr_section_name,
                "distance_from_origin_km": round(current_km, 1),
                "distance_remaining_km": round(dist_remaining_total, 1),
                "route_status": val_result['route_status'],
                "is_valid": val_result['is_valid'],
                "validation_issues": val_result['validation_issues']
            },
            "operational_context": {
                "current_delay_minutes": round(current_delay_min, 1),
                "weather_fog_index": weather_fog_index,
                "section_occupancy_ratio": section_occupancy_ratio,
                "headway_km": headway_km
            },
            "predictions": {
                "destination": {
                    "station_code": "CNB",
                    "station_name": "Kanpur Central",
                    "predicted_remaining_minutes": round(pred_dest_rem_min, 1),
                    "predicted_eta": dest_eta.strftime("%H:%M"),
                    "prediction_interval_80pct": {
                        "lower_eta": dest_low.strftime("%H:%M"),
                        "upper_eta": dest_high.strftime("%H:%M")
                    },
                    "ntes_baseline_eta": dp_dest_eta.strftime("%H:%M"),
                    "ai_time_savings_vs_ntes_min": round(dp_baseline_rem_min - pred_dest_rem_min, 1)
                },
                "upcoming_stations": upcoming_stations
            }
        }
