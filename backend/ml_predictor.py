"""
Dynamic ETA Inference Engine and Explainable AI (XAI) Reason Generator
"""

import os
import datetime
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "model.pkl")

class DynamicETAPredictor:
    def __init__(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
            print("Loaded trained ML model from:", MODEL_PATH)
        else:
            print("Warning: model.pkl not found, running with fallback heuristic.")
            self.model = None

    def format_time(self, time_str: str, add_minutes: float) -> str:
        """Adds minutes to HH:MM format string."""
        try:
            h, m = map(int, time_str.split(":"))
            total_minutes = h * 60 + m + int(round(add_minutes))
            total_minutes = total_minutes % (24 * 60)
            new_h = total_minutes // 60
            new_m = total_minutes % 60
            return f"{new_h:02d}:{new_m:02d}"
        except Exception:
            return time_str

    def generate_delay_explanation(
        self,
        predicted_delay: float,
        current_delay: float,
        fog_index: float,
        occupancy_ratio: float,
        priority_tier: int,
        headway_km: float,
        is_junction: bool
    ) -> str:
        """
        Generates clear, human-understandable Explainable AI (XAI) delay attribution.
        """
        delta = predicted_delay - current_delay
        reasons = []

        if fog_index > 0.3:
            reasons.append(f"Severe fog visibility restriction (MPS reduced to 60 km/h)")
        
        if occupancy_ratio > 0.85:
            reasons.append(f"Section congestion (track capacity utilized at {int(occupancy_ratio*100)}%)")
        
        if headway_km < 4.0:
            reasons.append(f"Cautionary signal headway behind preceding train ({round(headway_km, 1)} km gap)")
        
        if is_junction and priority_tier >= 3:
            reasons.append(f"Junction route clearance priority for Superfast/Rajdhani corridor")

        if delta > 15 and not reasons:
            reasons.append("Downstream bottleneck queuing and speed restrictions")
        elif delta <= -3:
            return "Clear downstream tracks; train is recovering scheduled slack time."

        if not reasons:
            if predicted_delay <= 5:
                return "Normal operations; running near scheduled timetable."
            else:
                return f"Carrying steady delay of {int(current_delay)} min from previous section."

        return " + ".join(reasons)

    def predict_downstream_etas(
        self,
        train_state: dict,
        upcoming_stops: list,
        section_occupancy_map: dict,
        fog_index: float,
        headway_km: float
    ) -> list:
        """
        Computes Dynamic ML ETA and Static NTES Baseline for all upcoming stations.
        """
        results = []
        current_km = train_state.get("current_km", 0.0)
        current_delay = train_state.get("current_delay_min", 0.0)
        priority_tier = train_state.get("priority_tier", 3)

        for stop in upcoming_stops:
            station_km = stop["km"]
            distance_remaining = max(1.0, station_km - current_km)
            is_junction = stop.get("is_junction", False)
            sec_id = stop.get("section_id", "SEC-1")
            occupancy_ratio = section_occupancy_map.get(sec_id, 0.4)

            # 1. Static NTES Baseline: Timetable arrival + current delay
            baseline_delay = max(0.0, current_delay)
            baseline_eta = self.format_time(stop["arr"], baseline_delay)

            # 2. Dynamic Machine Learning Model Prediction
            if self.model is not None:
                import pandas as pd
                features_df = pd.DataFrame([{
                    "current_delay_min": current_delay,
                    "distance_remaining_km": distance_remaining,
                    "section_occupancy_ratio": occupancy_ratio,
                    "priority_tier": priority_tier,
                    "weather_fog_index": fog_index,
                    "headway_km": headway_km,
                    "is_junction_ahead": 1 if is_junction else 0
                }])
                predicted_delay = float(self.model.predict(features_df)[0])
                predicted_delay = max(-5.0, round(predicted_delay, 1))
            else:
                # Fallback rule
                predicted_delay = current_delay + (distance_remaining * 0.05 * occupancy_ratio)

            dynamic_eta = self.format_time(stop["arr"], predicted_delay)
            conf_low = self.format_time(stop["arr"], max(0, predicted_delay - 4))
            conf_high = self.format_time(stop["arr"], predicted_delay + 5)

            reason = self.generate_delay_explanation(
                predicted_delay,
                current_delay,
                fog_index,
                occupancy_ratio,
                priority_tier,
                headway_km,
                is_junction
            )

            results.append({
                "station_code": stop["station"],
                "station_name": stop.get("name", stop["station"]),
                "scheduled_arr": stop["arr"],
                "scheduled_dep": stop["dep"],
                "platform": stop.get("platform", 1),
                "distance_km": round(distance_remaining, 1),
                "ntes_baseline_delay_min": round(baseline_delay, 1),
                "ntes_baseline_eta": baseline_eta,
                "dynamic_ml_delay_min": round(predicted_delay, 1),
                "dynamic_ml_eta": dynamic_eta,
                "confidence_interval": f"{conf_low} - {conf_high}",
                "delay_reason": reason
            })

        return results

# Singleton instance
predictor = DynamicETAPredictor()
