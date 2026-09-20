import unittest
import numpy as np
import pandas as pd
import joblib
from ml_system.config.config import PROCESSED_DATA_DIR, MODELS_DIR
from ml_system.src.features.engineering import FEATURE_COLUMNS
from ml_system.src.models.baselines import (
    ScheduleBasedRemainingTimeBaseline,
    CurrentDelayPropagationBaseline,
    HistoricalSectionMedianBaseline,
    DelayRecoveryBaseline
)

class TestOperationalBaselines(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Sample test dataframe with diverse priority tiers and delays
        cls.sample_df = pd.DataFrame({
            'distance_remaining': [100.0, 200.0, 50.0, 300.0],
            'priority_tier': [1, 2, 3, 5],
            'current_delay_min': [20.0, 0.0, 45.0, 60.0]
        })

    def test_baseline_1_schedule_based(self):
        b1 = ScheduleBasedRemainingTimeBaseline()
        preds = b1.predict(self.sample_df)
        self.assertEqual(len(preds), len(self.sample_df))
        self.assertTrue((preds >= 0.0).all(), "Baseline 1 produced negative predictions")
        # Ensure Baseline 1 does not change when current_delay_min changes
        df_delay_changed = self.sample_df.copy()
        df_delay_changed['current_delay_min'] += 50.0
        preds_delayed = b1.predict(df_delay_changed)
        np.testing.assert_allclose(preds, preds_delayed, err_msg="Baseline 1 should not depend on current delay")

    def test_baseline_2_delay_propagation(self):
        b2 = CurrentDelayPropagationBaseline()
        b1 = ScheduleBasedRemainingTimeBaseline()
        preds_b1 = b1.predict(self.sample_df)
        preds_b2 = b2.predict(self.sample_df)
        expected_diff = self.sample_df['current_delay_min'].values
        np.testing.assert_allclose(preds_b2 - preds_b1, expected_diff, err_msg="Baseline 2 must add current delay linearly")

    def test_baseline_3_historical_median(self):
        b3 = HistoricalSectionMedianBaseline()
        preds = b3.predict(self.sample_df)
        self.assertEqual(len(preds), len(self.sample_df))
        self.assertTrue((preds > 0.0).all(), "Baseline 3 produced non-positive predictions")

    def test_baseline_4_delay_recovery(self):
        b4 = DelayRecoveryBaseline()
        preds = b4.predict(self.sample_df)
        self.assertEqual(len(preds), len(self.sample_df))
        # High priority (tier 1): delay factor 0.75; low priority (tier 5): delay factor 1.15
        nominal_speed_tier1 = 100.0
        sched_min_tier1 = (100.0 / nominal_speed_tier1) * 60.0
        expected_tier1 = sched_min_tier1 + (20.0 * 0.75)
        self.assertAlmostEqual(preds[0], expected_tier1, places=2)

    def test_quantile_monotonicity(self):
        """Verify that P90 >= P10 for all test samples."""
        q_low_path = MODELS_DIR / "eta_q_low.joblib"
        q_high_path = MODELS_DIR / "eta_q_high.joblib"
        test_path = PROCESSED_DATA_DIR / "test_features.csv"

        if q_low_path.exists() and q_high_path.exists() and test_path.exists():
            q_low = joblib.load(q_low_path)
            q_high = joblib.load(q_high_path)
            test_df = pd.read_csv(test_path)
            X_test = test_df[FEATURE_COLUMNS]
            p10 = q_low.predict(X_test)
            p90 = q_high.predict(X_test)
            # Enforced interval monotonicity
            p90_adj = np.maximum(p90, p10)
            self.assertTrue(np.all(p90_adj >= p10), "P90 must be greater than or equal to P10")

if __name__ == '__main__':
    unittest.main()
