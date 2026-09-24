"""
ml_system/tests/test_trained_eta_pipeline.py

Unit tests for the trained Rajasthan ETA prediction pipeline, API handlers,
signal separation, multi-day datetime arithmetic, and model artifact loading.
"""

import os
import unittest
import datetime
from pathlib import Path

from ml_system.src.inference.pipeline import TrainedRajasthanETAPredictor
from ml_system.src.api.main import get_eta_performance, predict_eta, get_train_details, ETAPredictRequest

class TestTrainedETAPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.predictor = TrainedRajasthanETAPredictor()
        cls.sample_routes = [
            (1, 'JU', 'Jodhpur', '06:00', '06:05', 0.0, 1),
            (2, 'GOTN', 'Gotan', '07:00', '07:02', 80.0, 1),
            (3, 'MTD', 'Merta Road', '07:25', '07:30', 103.0, 1),
            (4, 'JP', 'Jaipur', '10:30', '10:40', 310.0, 1),
            (5, 'DLI', 'Delhi', '23:45', '23:55', 620.0, 1)
        ]

    def test_model_artifact_loaded(self):
        """1. Verifies model artifact loads correctly."""
        self.assertTrue(self.predictor.is_model_loaded(), "XGBoost and priors must be loaded")
        self.assertIsNotNone(self.predictor.model)
        self.assertIsNotNone(self.predictor.priors)

    def test_sta_remains_unchanged(self):
        """2. Verifies timetable STA is never overwritten by ML."""
        stops = self.predictor.predict_journey_stops(
            train_number='12462',
            routes=self.sample_routes,
            current_idx=1,
            current_delay_min=20.0
        )
        self.assertEqual(stops[0]['scheduled_arrival'], '06:00')
        self.assertEqual(stops[1]['scheduled_arrival'], '07:00')
        self.assertEqual(stops[2]['scheduled_arrival'], '07:25')
        self.assertEqual(stops[3]['scheduled_arrival'], '10:30')

    def test_past_stations_show_actual_arrival(self):
        """3. Verifies past stations display actual historical arrival."""
        actual_data = {
            'JU': {'actual_arr': '06:02', 'actual_dep': '06:08', 'arr_delay_min': 2}
        }
        stops = self.predictor.predict_journey_stops(
            train_number='12462',
            routes=self.sample_routes,
            current_idx=1,
            current_delay_min=10.0,
            stations_actual_data=actual_data
        )
        ju_stop = stops[0]
        self.assertEqual(ju_stop['status'], 'COMPLETED')
        self.assertEqual(ju_stop['actual_arrival'], '06:02')
        self.assertEqual(ju_stop['actual_departure'], '06:08')

    def test_future_stations_use_eta_not_actual(self):
        """4. Verifies future stations have null actual arrival and compute ETA."""
        stops = self.predictor.predict_journey_stops(
            train_number='12462',
            routes=self.sample_routes,
            current_idx=1,
            current_delay_min=15.0
        )
        future_stop = stops[2] # MTD
        self.assertIn(future_stop['status'], ['NEXT', 'UPCOMING'])
        self.assertIsNone(future_stop['actual_arrival'])
        self.assertIsNotNone(future_stop['estimated_arrival'])
        self.assertEqual(future_stop['model_status'], 'TRAINED_RAJASTHAN_ETA_MODEL')

    def test_signal_separation_identity(self):
        """5. Verifies ETA = STA + predicted_delay with proper 24h arithmetic."""
        stops = self.predictor.predict_journey_stops(
            train_number='12462',
            routes=self.sample_routes,
            current_idx=1,
            current_delay_min=15.0
        )
        for s in stops[2:]:
            sta_str = s['scheduled_arrival']
            eta_str = s['estimated_arrival']
            pred_d = s['predicted_delay_minutes']
            
            sh, sm = map(int, sta_str.split(':'))
            eh, em = map(int, eta_str.split(':'))
            sta_total = sh * 60 + sm
            eta_total = eh * 60 + em
            diff = (eta_total - sta_total) % 1440
            self.assertEqual(diff, int(round(pred_d)) % 1440)

    def test_midnight_rollover(self):
        """6. Verifies rollover past midnight on late train."""
        late_routes = [
            (1, 'JP', 'Jaipur', '23:30', '23:35', 300.0, 1),
            (2, 'GADJ', 'Gandhinagar', '23:50', '23:55', 306.0, 1)
        ]
        stops = self.predictor.predict_journey_stops(
            train_number='12462',
            routes=late_routes,
            current_idx=0,
            current_delay_min=20.0,
            start_date_str="2026-09-24"
        )
        gadj_stop = stops[1]
        self.assertEqual(gadj_stop['scheduled_arrival'], '23:50')
        # Check that ETA is computed into next morning
        eh, em = map(int, gadj_stop['estimated_arrival'].split(':'))
        self.assertLess(eh, 2) # Rolls over past midnight to 00:xx

    def test_api_predict_eta_response_fields(self):
        """7. Verifies POST /api/predict-eta returns required fields."""
        req = ETAPredictRequest(
            train_number='12462',
            current_delay_minutes=15.0,
            current_station_code='JU'
        )
        res = predict_eta(req)
        required_fields = [
            'train_number', 'station_code', 'scheduled_arrival',
            'actual_arrival', 'current_delay_minutes',
            'predicted_delay_minutes', 'estimated_arrival', 'model_status'
        ]
        for field in required_fields:
            self.assertIn(field, res, f"Missing required response field: {field}")
        self.assertEqual(res['model_status'], 'TRAINED_RAJASTHAN_ETA_MODEL')

    def test_api_performance_metrics_endpoint(self):
        """8. Verifies GET /api/eta/performance returns genuine evaluation metrics."""
        metrics = get_eta_performance()
        self.assertIn('active_model', metrics)
        self.assertIn('mae_minutes', metrics)
        self.assertIn('rmse_minutes', metrics)
        self.assertIn('baseline_comparison', metrics)
        self.assertEqual(metrics['status'], 'EVALUATED_ON_UNSEEN_TEST_SET')
        self.assertLess(metrics['mae_minutes'], 6.0)

    def test_missing_telemetry_remains_null(self):
        """9. Verifies absent telemetry is represented as None/null."""
        details = get_train_details('12462')
        telem = details['telemetry']
        # When live speed is uninstrumented, speed must remain None
        self.assertIsNone(telem['currentSpeedKmph'])

if __name__ == '__main__':
    unittest.main()
