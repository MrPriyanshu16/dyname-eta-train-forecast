"""
Operational ETA Baseline Engine for Rajasthan Railways
Strictly enforces separation between timetable schedules, observed telemetry, and predictions.
Zero fabrication of historical running times or recovery multipliers.
"""

from typing import Dict, Any, Optional
import datetime
import numpy as np
import pandas as pd


class ScheduleBasedRemainingTimeBaseline:
    """
    Baseline A: Schedule-Based Timetable Benchmark
    ETA = Scheduled Arrival Time (STA)
    predicted_remaining_time = STA_datetime - observation_datetime
    predicted_delay = 0.0

    INTERPRETATION:
    Serves as the pure nominal timetable benchmark.
    Used for comparative baseline evaluation or when train's operational delay is unknown.
    Should NOT be presented as the operational ETA for a train known to have accumulated delay.
    """
    name = "BASELINE_A_SCHEDULE_BENCHMARK"
    is_operational = False  # Benchmark only, not active operational predictor for delayed trains

    def predict_single(
        self,
        sta_datetime: datetime.datetime,
        observation_datetime: datetime.datetime
    ) -> Dict[str, Any]:
        remaining_seconds = (sta_datetime - observation_datetime).total_seconds()
        remaining_minutes = max(0.0, remaining_seconds / 60.0)
        
        return {
            "baseline_name": self.name,
            "status": "AVAILABLE",
            "is_operational_eta": False,
            "predicted_eta_datetime": sta_datetime.isoformat(),
            "predicted_remaining_minutes": round(remaining_minutes, 1),
            "predicted_delay_minutes": 0.0,
            "description": "Pure timetable schedule benchmark (ETA = STA). Assumes zero operational delay."
        }

    def predict_vector(self, df: pd.DataFrame) -> np.ndarray:
        """
        Batch prediction for evaluation pipeline.
        Calculates nominal schedule remaining minutes from scheduled arrival.
        """
        if 'scheduled_remaining_minutes' in df.columns:
            return np.maximum(0.0, df['scheduled_remaining_minutes'].values)
        elif 'distance_remaining' in df.columns:
            # Nominal timetable speed fallback strictly for shape compatibility
            nominal_speed = 75.0
            return np.maximum(0.0, (df['distance_remaining'].values / nominal_speed) * 60.0)
        return np.zeros(len(df))


class CurrentDelayPropagationBaseline:
    """
    Baseline B: Current Delay Propagation (Active Operational Baseline)
    ETA = Scheduled Arrival Time (STA) + Current Delay
    predicted_remaining_time = scheduled_remaining_time + Current Delay
    predicted_delay = Current Delay

    INTERPRETATION:
    The primary, scientifically defensible operational baseline when genuine point-in-time
    historical ground truth is unavailable.
    
    CRITICAL CAPABILITIES:
    - Supports negative / early delay values (e.g. -5 min early arrival).
    - Fully handles midnight rollovers and multi-day train journeys via datetime arithmetic.
    - Preserves observed current_delay distinctly from predicted_delay and STA.
    """
    name = "BASELINE_B_CURRENT_DELAY_PROPAGATION"
    is_operational = True  # Active operational predictor

    def predict_single(
        self,
        sta_datetime: datetime.datetime,
        observation_datetime: datetime.datetime,
        current_delay_minutes: float
    ) -> Dict[str, Any]:
        # Handle early / negative delay or positive delay
        delay_delta = datetime.timedelta(minutes=float(current_delay_minutes))
        eta_datetime = sta_datetime + delay_delta
        
        remaining_seconds = (eta_datetime - observation_datetime).total_seconds()
        remaining_minutes = max(0.0, remaining_seconds / 60.0)
        
        return {
            "baseline_name": self.name,
            "status": "AVAILABLE",
            "is_operational_eta": True,
            "predicted_eta_datetime": eta_datetime.isoformat(),
            "predicted_remaining_minutes": round(remaining_minutes, 1),
            "predicted_delay_minutes": round(float(current_delay_minutes), 1),
            "description": (
                "Operational delay propagation baseline (ETA = STA + Current Delay). "
                "Propagates currently observed section delay forward to target station."
            )
        }

    def predict_vector(self, df: pd.DataFrame) -> np.ndarray:
        """
        Batch prediction for evaluation pipeline.
        predicted_remaining = scheduled_remaining + current_delay
        """
        if 'scheduled_remaining_minutes' in df.columns:
            sched_remaining = df['scheduled_remaining_minutes'].values
        elif 'distance_remaining' in df.columns:
            nominal_speed = 75.0
            sched_remaining = (df['distance_remaining'].values / nominal_speed) * 60.0
        else:
            sched_remaining = np.zeros(len(df))
            
        current_delay = df['current_delay_min'].values if 'current_delay_min' in df.columns else np.zeros(len(df))
        return np.maximum(0.0, sched_remaining + current_delay)


class HistoricalSectionMedianBaseline:
    """
    Baseline C: Historical Section Travel Time
    STATUS: UNAVAILABLE (In Current Audit)

    SCIENTIFIC GOVERNANCE RULE:
    Zero historical point-in-time section movement observations currently exist in audited datasets.
    Calculating pseudo-traversal times from timetable schedules and calling them
    'historical median actual running times' is scientifically fraudulent.
    Therefore, this baseline remains explicitly UNAVAILABLE until genuine empirical
    section traversal datasets (PRIMARY_GROUND_TRUTH) are qualified.
    """
    name = "BASELINE_C_HISTORICAL_SECTION_MEDIAN"
    is_operational = False

    def predict_single(self, *args, **kwargs) -> Dict[str, Any]:
        return {
            "baseline_name": self.name,
            "status": "UNAVAILABLE",
            "reason": (
                "Requires empirical historical section traversal observations. "
                "Currently UNAVAILABLE to prevent fabricating running statistics from static timetable data."
            )
        }

    def predict_vector(self, df: pd.DataFrame) -> np.ndarray:
        raise NotImplementedError(
            "Baseline C is UNAVAILABLE: Genuine empirical section traversal datasets are required."
        )


class DelayRecoveryBaseline:
    """
    Baseline D: Delay Recovery Model
    STATUS: UNAVAILABLE (In Current Audit)

    SCIENTIFIC GOVERNANCE RULE:
    Empirical delay recovery factors (e.g. slack absorption speedups) cannot be assumed
    using arbitrary heuristics (such as 0.75 for express or 1.15 for passenger trains)
    without genuine historical journey training data.
    Therefore, this baseline remains explicitly UNAVAILABLE until learned recovery
    parameters can be derived from empirical historical journey observations.
    """
    name = "BASELINE_D_DELAY_RECOVERY"
    is_operational = False

    def predict_single(self, *args, **kwargs) -> Dict[str, Any]:
        return {
            "baseline_name": self.name,
            "status": "UNAVAILABLE",
            "reason": (
                "Requires empirically calibrated recovery factors from real-world train journeys. "
                "Currently UNAVAILABLE to prevent inventing ungrounded recovery multipliers."
            )
        }

    def predict_vector(self, df: pd.DataFrame) -> np.ndarray:
        raise NotImplementedError(
            "Baseline D is UNAVAILABLE: Empirically calibrated recovery factors from genuine journeys are required."
        )
