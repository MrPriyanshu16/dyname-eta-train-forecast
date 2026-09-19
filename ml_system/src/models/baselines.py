import numpy as np
import pandas as pd

class ScheduleBasedRemainingTimeBaseline:
    """
    Baseline 1: Schedule-Based Remaining Time
    predicted_remaining_time = scheduled_target_arrival - observation_timestamp
    Defined strictly relative to the observation point to prevent ambiguity when delays have accumulated.
    """
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        nominal_speed = np.where(df['priority_tier'] <= 2, 100.0, 85.0)
        sched_remaining_min = (df['distance_remaining'] / nominal_speed) * 60.0
        # Scheduled arrival relative to current observation point without current delay adjustment
        return np.maximum(0.0, sched_remaining_min)

class CurrentDelayPropagationBaseline:
    """
    Baseline 2: Current Delay Propagation
    ETA = Scheduled Arrival + Current Delay
    predicted_remaining_time = scheduled_remaining_time + current_delay
    Assumes current accumulated delay remains constant throughout all remaining sections.
    """
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        nominal_speed = np.where(df['priority_tier'] <= 2, 100.0, 85.0)
        sched_remaining_min = (df['distance_remaining'] / nominal_speed) * 60.0
        predicted_remaining = sched_remaining_min + df['current_delay_min']
        return np.maximum(0.0, predicted_remaining)

class HistoricalSectionMedianBaseline:
    """
    Baseline 3: Historical Section Median Running Times
    predicted_remaining_time = sum of historical median traversal times for remaining sections.
    """
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        nominal_speed = np.where(df['priority_tier'] <= 2, 95.0, 80.0)
        median_remaining_min = (df['distance_remaining'] / nominal_speed) * 60.0
        # Adjust slightly for average historical dwell times
        stations_remaining = np.maximum(1, np.round(df['distance_remaining'] / 65.0))
        return np.maximum(0.0, median_remaining_min + (stations_remaining * 3.5))

class DelayRecoveryBaseline:
    """
    Baseline 4: Delay Recovery Model
    predicted_remaining_time = scheduled_remaining + current_delay + expected_delay_change
    Accounts for average recovery speedups on open corridors.
    """
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        nominal_speed = np.where(df['priority_tier'] <= 2, 100.0, 85.0)
        sched_remaining_min = (df['distance_remaining'] / nominal_speed) * 60.0
        # High priority trains recover up to 25% of delay; lower priority accumulate further delay
        delay_factor = np.where(df['priority_tier'] <= 2, 0.75, 1.15)
        adjusted_delay = df['current_delay_min'] * delay_factor
        return np.maximum(0.0, sched_remaining_min + adjusted_delay)
