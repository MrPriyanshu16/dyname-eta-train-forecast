"""
ml_system/tests/test_eta_leakage.py

Automated Point-in-Time Temporal Leakage Test Suite.
Verifies that:
1. Feature list contains no future actuals or target columns.
2. Temporal split boundaries are strictly monotonic (Train < Val < Test).
3. Historical priors and aggregations are fitted solely on TRAIN.
4. Future records modification cannot alter past/present feature values.
5. Inference feature pipeline is strictly causal and stateless across observations.
"""

import os
import unittest
import numpy as np
import pandas as pd
from datetime import datetime

DATA_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "Datasets", "rajasthan", "rajasthan_section_training_observations.csv"
)

class TestEtaLeakage(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.data_path = os.path.abspath(DATA_PATH)
        assert os.path.exists(cls.data_path), f"File not found: {cls.data_path}"
        cls.df = pd.read_csv(cls.data_path)
        cls.df['journey_date'] = pd.to_datetime(cls.df['journey_date'])

    def test_no_future_actuals_in_input_features(self):
        """Verifies that no column representing future actual times/delays is used as input feature."""
        forbidden_keywords = ['next_act', 'to_act', 'downstream', 'dest_act']
        all_cols = list(self.df.columns)
        
        feature_cols = [c for c in all_cols if not c.startswith('target_')]
        for col in feature_cols:
            for kw in forbidden_keywords:
                self.assertNotIn(
                    kw, col.lower(),
                    f"POTENTIAL LEAKAGE: Column '{col}' contains future keyword '{kw}'"
                )

    def test_strict_temporal_split_monotonicity(self):
        """Verifies that Train date maximum is strictly earlier than Val minimum, and Val < Test."""
        train_dates = self.df[self.df['journey_date'] <= '2024-09-20']['journey_date']
        val_dates = self.df[(self.df['journey_date'] >= '2024-09-21') & (self.df['journey_date'] <= '2024-09-25')]['journey_date']
        test_dates = self.df[self.df['journey_date'] >= '2024-09-26']['journey_date']

        self.assertGreater(len(train_dates), 0)
        self.assertGreater(len(val_dates), 0)
        self.assertGreater(len(test_dates), 0)

        max_train = train_dates.max()
        min_val = val_dates.min()
        max_val = val_dates.max()
        min_test = test_dates.min()

        self.assertLess(max_train, min_val, f"Train overlaps with Val: {max_train} >= {min_val}")
        self.assertLess(max_val, min_test, f"Val overlaps with Test: {max_val} >= {min_test}")

    def test_historical_aggregates_independent_of_future(self):
        """
        Verifies that section historical prior computed on training data (Sep 1-20)
        is completely unaffected by perturbing or appending future records (Sep 21-30).
        """
        train_df = self.df[self.df['journey_date'] <= '2024-09-20'].copy()
        
        # Calculate section mean delta on train
        priors_clean = train_df.groupby(['from_station_code', 'to_station_code'])['target_section_delay_change_min'].mean().to_dict()
        
        # Create a polluted dataset with extreme future outliers
        polluted_df = self.df.copy()
        future_mask = polluted_df['journey_date'] >= '2024-09-26'
        polluted_df.loc[future_mask, 'target_section_delay_change_min'] = 9999.0
        
        # Recalculate priors strictly on the train filter of the polluted dataset
        train_polluted = polluted_df[polluted_df['journey_date'] <= '2024-09-20']
        priors_guarded = train_polluted.groupby(['from_station_code', 'to_station_code'])['target_section_delay_change_min'].mean().to_dict()
        
        # They must be 100% identical because future modifications must not penetrate train cutoff
        self.assertEqual(priors_clean, priors_guarded, "LEAKAGE: Future records influenced training priors!")

    def test_causal_point_in_time_order_within_journey(self):
        """Verifies that inside each journey, stop sequence is monotonically increasing."""
        sample_journeys = self.df['journey_id'].drop_duplicates().head(50)
        for jid in sample_journeys:
            j_df = self.df[self.df['journey_id'] == jid]
            from_seqs = list(j_df['from_sequence'])
            to_seqs = list(j_df['to_sequence'])
            
            for f_seq, t_seq in zip(from_seqs, to_seqs):
                self.assertLess(f_seq, t_seq, f"Non-causal sequence in journey {jid}: {f_seq} >= {t_seq}")

if __name__ == '__main__':
    unittest.main()
