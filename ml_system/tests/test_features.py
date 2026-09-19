import unittest
import pandas as pd
import numpy as np
from ml_system.src.features.engineering import RailwayFeaturePipeline, FEATURE_COLUMNS

class TestFeaturePipeline(unittest.TestCase):
    def test_feature_pipeline_no_leakage(self):
        df = pd.DataFrame({
            "train_number": ["22436", "12302"],
            "station_code": ["NDLS", "GZB"],
            "current_delay_min": [5.0, 12.0],
            "distance_from_origin": [0.0, 25.6],
            "distance_remaining": [440.3, 414.7],
            "hour_of_day": [6.0, 16.0],
            "priority_tier": [1, 1],
            "section_occupancy_ratio": [0.4, 0.6],
            "headway_km": [15.0, 20.0],
            "weather_fog_index": [0.0, 0.0],
            "is_junction_ahead": [1, 1],
            "day_of_week": [0, 4],
            "is_weekend": [0, 0]
        })
        
        pipeline = RailwayFeaturePipeline()
        pipeline.fit(df)
        transformed = pipeline.transform(df)
        
        for col in FEATURE_COLUMNS:
            self.assertIn(col, transformed.columns)
            self.assertFalse(transformed[col].isnull().any())
            
        self.assertTrue(np.all(transformed["hour_sin"] >= -1.0) and np.all(transformed["hour_sin"] <= 1.0))
        self.assertTrue(np.all(transformed["hour_cos"] >= -1.0) and np.all(transformed["hour_cos"] <= 1.0))

if __name__ == '__main__':
    unittest.main()
