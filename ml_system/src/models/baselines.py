import numpy as np
import pandas as pd

class TimetableBaseline:
    """
    Baseline 1: Static Timetable
    Assumes train will arrive exactly according to the scheduled duration.
    Does not account for any current delay, congestion, or weather.
    """
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        # Scheduled duration based on nominal corridor speed
        nominal_speed = np.where(df['priority_tier'] <= 2, 100.0, 85.0)
        sched_remaining_min = (df['distance_remaining'] / nominal_speed) * 60.0
        return np.maximum(0.0, sched_remaining_min)

class DelayPropagationBaseline:
    """
    Baseline 2: Static Delay Propagation (NTES Heuristic)
    ETA = Scheduled Arrival + Current Delay
    Assumes current delay remains perfectly constant throughout the remaining journey.
    Completely fails to account for recovery, congestion bottlenecks, fog, or signal delays.
    """
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        nominal_speed = np.where(df['priority_tier'] <= 2, 100.0, 85.0)
        sched_remaining_min = (df['distance_remaining'] / nominal_speed) * 60.0
        # Propagates current accumulated delay forward
        predicted_remaining = sched_remaining_min + df['current_delay_min']
        return np.maximum(0.0, predicted_remaining)
