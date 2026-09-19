import unittest
from ml_system.src.geospatial.validator import GPSLocationValidator

class TestGPSValidation(unittest.TestCase):
    def test_valid_gps_ping(self):
        validator = GPSLocationValidator()
        # Ping near New Delhi (NDLS)
        res = validator.validate_observation(
            train_number="22436",
            timestamp="2026-08-15T06:05:00",
            lat=28.6429,
            lng=77.2195,
            speed_kmh=45.0
        )
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["route_status"], "CONSISTENT")
        self.assertLess(res["distance_to_corridor_km"], 1.0)

    def test_severe_off_route_anomaly(self):
        validator = GPSLocationValidator()
        # Ping located in the Himalayas (far from corridor)
        res = validator.validate_observation(
            train_number="22436",
            timestamp="2026-08-15T06:10:00",
            lat=32.0,
            lng=76.0,
            speed_kmh=80.0
        )
        self.assertFalse(res["is_valid"])
        self.assertEqual(res["route_status"], "INCONSISTENT")
        self.assertGreater(len(res["validation_issues"]), 0)

    def test_impossible_speed_anomaly(self):
        validator = GPSLocationValidator()
        # Supersonic train speed
        res = validator.validate_observation(
            train_number="22436",
            timestamp="2026-08-15T06:15:00",
            lat=28.6679,
            lng=77.4326,
            speed_kmh=450.0
        )
        self.assertFalse(res["is_valid"])
        self.assertEqual(res["route_status"], "INCONSISTENT")
        self.assertTrue(any("impossible speed" in issue.lower() for issue in res["validation_issues"]))

if __name__ == '__main__':
    unittest.main()
