"""
Dynamic ETA Inference Engine and Explainable AI (XAI) Reason Generator
Predicts arrival delays across 12 authentic railway operational and environmental conditions.
"""

import os
import datetime
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "model.pkl")

class DynamicETAPredictor:
    def __init__(self):
        self.reload_model()

    def reload_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
            print("Loaded trained ML model from:", MODEL_PATH)
        else:
            print("Warning: model.pkl not found, running with fallback heuristic.")
            self.model = None

    def format_time(self, time_str: str, add_minutes: float) -> str:
        """Adds minutes to HH:MM or HH:MM:SS format string."""
        try:
            parts = [int(p) for p in time_str.split(":")[:2]]
            h, m = parts[0], parts[1]
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
        fog_index: float = 0.0,
        occupancy_ratio: float = 0.4,
        priority_tier: int = 3,
        headway_km: float = 15.0,
        is_junction: bool = False,
        rainfall_intensity: float = 0.0,
        ambient_temp_c: float = 32.0,
        tsr_speed_restriction_kmh: float = 130.0,
        is_peak_hour: int = 0,
        station_dwell_delay_min: float = 0.0
    ) -> str:
        """
        Generates clear, human-understandable Explainable AI (XAI) delay attribution
        accounting for all 12 operational and environmental conditions.
        """
        delta = predicted_delay - current_delay
        reasons = []

        # 1. Weather: Monsoon Rain & Waterlogging
        if rainfall_intensity > 0.3:
            reasons.append(f"Monsoon torrential rain & track waterlogging (Caution order: MPS reduced to 30 km/h)")

        # 2. Weather: Fog & Desert Sandstorm
        if fog_index > 0.3:
            reasons.append("Desert sandstorm (Aandhi) / dense fog visibility restriction (MPS reduced to 60 km/h)")
        
        # 3. Weather: Extreme Heatwave
        if ambient_temp_c > 42.0:
            reasons.append(f"High ambient heatwave ({round(ambient_temp_c, 1)}°C / {round(ambient_temp_c * 9/5 + 32, 1)}°F) - CWR track buckling caution & patrol order")

        # 4. Infrastructure: Temporary Speed Restriction (TSR)
        if tsr_speed_restriction_kmh < 100.0:
            reasons.append(f"Temporary Speed Restriction (TSR Caution Order {int(tsr_speed_restriction_kmh)} km/h for track/bridge work)")

        # 5. Infrastructure: Section Congestion
        if occupancy_ratio > 0.85:
            reasons.append(f"Section congestion across block (track capacity utilized at {int(occupancy_ratio*100)}%)")
        
        # 6. Signaling: Headway spacing
        if headway_km < 4.0:
            reasons.append(f"Cautionary yellow/red signal headway behind preceding train ({round(headway_km, 1)} km gap)")
        
        # 7. Signaling: Junction Precedence
        if is_junction and priority_tier >= 3:
            reasons.append("Junction loop-line wait at Phulera/Marwar for Vande Bharat 20978 route clearance")

        # 8. Scheduling: Peak hour bunching
        if is_peak_hour and delta > 5:
            reasons.append("Peak rush hour timetable bunching across trunk corridor")

        # 9. Dwell delay
        if station_dwell_delay_min > 4.0:
            reasons.append(f"Extended passenger boarding crowd dwell (+{int(station_dwell_delay_min)}m)")

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
        fog_index: float = 0.0,
        headway_km: float = 15.0,
        rainfall_intensity: float = 0.0,
        ambient_temp_c: float = 32.0,
        tsr_speed_restriction_kmh: float = 130.0,
        is_peak_hour: int = 0,
        station_dwell_delay_min: float = 0.0
    ) -> list:
        """
        Computes Dynamic ML ETA and Static NTES Baseline for all upcoming stations
        incorporating all 12 operational parameters.
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

            # 2. Dynamic Machine Learning Model Prediction across 12 conditions
            if self.model is not None:
                features_df = pd.DataFrame([{
                    "current_delay_min": current_delay,
                    "distance_remaining_km": distance_remaining,
                    "section_occupancy_ratio": occupancy_ratio,
                    "priority_tier": priority_tier,
                    "weather_fog_index": fog_index,
                    "headway_km": headway_km,
                    "is_junction_ahead": 1 if is_junction else 0,
                    "rainfall_intensity": rainfall_intensity,
                    "ambient_temp_c": ambient_temp_c,
                    "tsr_speed_restriction_kmh": tsr_speed_restriction_kmh,
                    "is_peak_hour": is_peak_hour,
                    "station_dwell_delay_min": station_dwell_delay_min
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
                predicted_delay=predicted_delay,
                current_delay=current_delay,
                fog_index=fog_index,
                occupancy_ratio=occupancy_ratio,
                priority_tier=priority_tier,
                headway_km=headway_km,
                is_junction=is_junction,
                rainfall_intensity=rainfall_intensity,
                ambient_temp_c=ambient_temp_c,
                tsr_speed_restriction_kmh=tsr_speed_restriction_kmh,
                is_peak_hour=is_peak_hour,
                station_dwell_delay_min=station_dwell_delay_min
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
