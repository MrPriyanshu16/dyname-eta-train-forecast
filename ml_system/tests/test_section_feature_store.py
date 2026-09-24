"""
ml_system/tests/test_section_feature_store.py

Unit tests for the Rajasthan section training observations feature store.
Verifies structure, row counts, point-in-time leakage absence, and target math consistency.
"""

import os
import csv
import unittest

FEATURE_STORE_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "Datasets", "rajasthan", "rajasthan_section_training_observations.csv"
)

class TestSectionFeatureStore(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.filepath = os.path.abspath(FEATURE_STORE_PATH)
        assert os.path.exists(cls.filepath), f"Feature store file not found at {cls.filepath}"
        
        cls.rows = []
        with open(cls.filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            cls.fieldnames = reader.fieldnames
            for i, row in enumerate(reader):
                cls.rows.append(row)
                if i >= 10000:  # Sample 10k rows for fast test execution
                    break

    def test_file_exists_and_has_substantial_rows(self):
        self.assertGreater(len(self.rows), 5000, "Should have loaded substantial observations")

    def test_required_columns_present(self):
        required_cols = [
            'journey_id', 'train_number', 'journey_date', 'day_of_week', 'is_weekend',
            'from_station_code', 'to_station_code', 'from_sequence', 'to_sequence',
            'is_from_in_rajasthan', 'is_to_in_rajasthan', 'scope_tag',
            'from_dep_delay_min', 'from_arr_delay_min', 'from_sched_dwell_min', 'from_act_dwell_min',
            'section_distance_km', 'sched_section_runtime_min',
            'target_next_actual_runtime_min', 'target_next_arr_delay_min',
            'target_section_delay_change_min', 'target_propagation_category'
        ]
        for col in required_cols:
            self.assertIn(col, self.fieldnames, f"Missing required column: {col}")

    def test_target_delay_change_math(self):
        """Verifies target_section_delay_change == target_next_arr_delay - from_dep_delay"""
        for r in self.rows[:500]:
            dep_delay = float(r['from_dep_delay_min'])
            nxt_delay = float(r['target_next_arr_delay_min'])
            delta = float(r['target_section_delay_change_min'])
            self.assertAlmostEqual(delta, nxt_delay - dep_delay, places=1)

    def test_propagation_category_mapping(self):
        """Verifies recovered / stable / increased thresholds match delay delta"""
        for r in self.rows[:500]:
            delta = float(r['target_section_delay_change_min'])
            cat = r['target_propagation_category']
            if delta < -2.0:
                self.assertEqual(cat, 'recovered')
            elif delta > 2.0:
                self.assertEqual(cat, 'increased')
            else:
                self.assertEqual(cat, 'stable')

    def test_scope_tags_valid(self):
        """Verifies scope tags are exclusively intra_rj, enters_rj, exits_rj (in RJ-touching dataset)"""
        valid_tags = {'intra_rj', 'enters_rj', 'exits_rj'}
        for r in self.rows[:500]:
            self.assertIn(r['scope_tag'], valid_tags)

    def test_no_temporal_leakage_in_from_features(self):
        """Ensures actual arrival of downstream station is NOT present in any from_ feature"""
        forbidden_in_inputs = ['to_act_arr', 'to_act_dep', 'next_act_arr', 'next_act_dep']
        for col in self.fieldnames:
            if not col.startswith('target_'):
                for forbidden in forbidden_in_inputs:
                    self.assertNotIn(forbidden, col, f"Leakage detected in input column: {col}")

if __name__ == '__main__':
    unittest.main()
