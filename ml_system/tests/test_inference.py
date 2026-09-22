import unittest
from ml_system.src.inference.pipeline import RealTimeETAPredictor

class TestInferencePipeline(unittest.TestCase):
    def setUp(self):
        self.predictor = RealTimeETAPredictor()

    def test_rajasthan_train_22491_canonical_itinerary(self):
        """Test Mandore Superfast Express (22491) JU -> DLI"""
        res = self.predictor.predict_eta(
            train_number="22491",
            current_delay_min=12.0
        )
        self.assertEqual(res["train_number"], "22491")
        self.assertEqual(res["train_name"], "Mandore Superfast Express")
        self.assertEqual(res["category"], "Superfast")
        self.assertEqual(res["predictions"]["destination"]["station_code"], "DLI")
        self.assertEqual(res["telemetry"]["telemetry_status"], "UNAVAILABLE")
        self.assertIsNone(res["current_location"]["latitude"])
        self.assertIsNone(res["current_location"]["longitude"])
        self.assertGreater(res["predictions"]["destination"]["predicted_remaining_minutes"], 0)

    def test_rajasthan_train_14888_barmer_rishikesh(self):
        """Test Barmer - Rishikesh Express (14888) BME -> RKSH"""
        res = self.predictor.predict_eta(
            train_number="14888",
            current_delay_min=20.0
        )
        self.assertEqual(res["train_number"], "14888")
        self.assertEqual(res["train_name"], "Barmer - Rishikesh Express")
        self.assertEqual(res["predictions"]["destination"]["station_code"], "RKSH")

    def test_honest_telemetry_gps_mapping(self):
        """Test that real coordinates within Rajasthan match correctly to nearest station"""
        # Jaipur coordinates: lat 26.9202, lon 75.7869
        res = self.predictor.predict_eta(
            train_number="22491",
            latitude=26.9202,
            longitude=75.7869,
            speed_kmh=90.0,
            current_delay_min=5.0
        )
        self.assertEqual(res["telemetry"]["telemetry_status"], "AVAILABLE")
        self.assertEqual(res["current_location"]["nearest_station"], "JP")
        self.assertEqual(res["current_location"]["route_status"], "CONSISTENT")

    def test_nonexistent_train_raises_error(self):
        """Non-existent train raises error"""
        with self.assertRaises(ValueError):
            self.predictor.predict_eta(train_number="999999")

if __name__ == '__main__':
    unittest.main()
