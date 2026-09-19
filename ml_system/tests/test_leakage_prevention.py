import unittest
import pandas as pd
from ml_system.config.config import PROCESSED_DATA_DIR
from ml_system.src.features.engineering import FEATURE_COLUMNS, TARGET_COLUMN_DEST, TARGET_COLUMN_STATION

class TestLeakagePrevention(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.train_df = pd.read_csv(PROCESSED_DATA_DIR / 'train_features.csv')
        cls.val_df = pd.read_csv(PROCESSED_DATA_DIR / 'val_features.csv')
        cls.test_df = pd.read_csv(PROCESSED_DATA_DIR / 'test_features.csv')

    def test_forbidden_columns_not_in_feature_columns(self):
        forbidden = [
            'actual_arrival',
            'actual_departure',
            'target_remaining_time_to_destination',
            'target_remaining_time_to_station',
            'journey_date',
            'scheduled_arrival',
            'scheduled_departure'
        ]
        for col in forbidden:
            self.assertNotIn(col, FEATURE_COLUMNS, f'Forbidden future column {col} found in FEATURE_COLUMNS!')

    def test_observation_timestamp_exists_and_valid(self):
        for name, df in [('train', self.train_df), ('val', self.val_df), ('test', self.test_df)]:
            self.assertIn('observation_timestamp', df.columns, f'observation_timestamp missing in {name}')
            self.assertTrue(df['observation_timestamp'].notna().all(), f'Null observation_timestamp in {name}')
            parsed = pd.to_datetime(df['observation_timestamp'], format='ISO8601')
            self.assertFalse(parsed.isna().any(), f'Unparseable observation_timestamp in {name}')

    def test_temporal_split_integrity(self):
        max_train_time = pd.to_datetime(self.train_df['observation_timestamp'], format='ISO8601').max()
        min_val_time = pd.to_datetime(self.val_df['observation_timestamp'], format='ISO8601').min()
        max_val_time = pd.to_datetime(self.val_df['observation_timestamp'], format='ISO8601').max()
        min_test_time = pd.to_datetime(self.test_df['observation_timestamp'], format='ISO8601').min()

        self.assertLessEqual(max_train_time, min_val_time, f'Temporal leakage: Train ({max_train_time}) > Val ({min_val_time})')
        self.assertLessEqual(max_val_time, min_test_time, f'Temporal leakage: Val ({max_val_time}) > Test ({min_test_time})')

    def test_target_values_non_negative(self):
        for name, df in [('train', self.train_df), ('val', self.val_df), ('test', self.test_df)]:
            self.assertTrue((df[TARGET_COLUMN_DEST] >= 0).all(), f'Negative destination targets found in {name}')
            self.assertTrue((df[TARGET_COLUMN_STATION] >= 0).all(), f'Negative station targets found in {name}')

if __name__ == '__main__':
    unittest.main()
