import unittest
from ml_system.src.inference.pipeline import RealTimeETAPredictor
from ml_system.src.simulator.rtis_simulator import RTISTelemetrySimulator

class TestInferenceAndSimulator(unittest.TestCase):
    def test_inference_pipeline(self):
        predictor = RealTimeETAPredictor()
        res = predictor.predict_eta(
            train_number="22436",
            timestamp_str="2026-08-15T07:30:00",
            latitude=27.8974,
            longitude=78.0880,
            speed_kmh=118.0,
            current_delay_min=8.0
        )
        self.assertEqual(res["train_number"], "22436")
        self.assertTrue(res["current_location"]["is_valid"])
        self.assertEqual(res["current_location"]["nearest_station"], "ALJN")
        
        dest_pred = res["predictions"]["destination"]
        self.assertEqual(dest_pred["station_code"], "CNB")
        self.assertGreater(dest_pred["predicted_remaining_minutes"], 0)
        self.assertNotEqual(dest_pred["predicted_eta"], "")

    def test_simulator_step_and_disruption(self):
        sim = RTISTelemetrySimulator()
        step_normal = sim.step(10.0)
        self.assertGreater(step_normal["simulator_state"]["km_position"], 0)
        self.assertGreater(step_normal["simulator_state"]["current_speed_kmh"], 100.0)
        
        sim.inject_fog(0.85)
        step_fog = sim.step(10.0)
        self.assertEqual(step_fog["simulator_state"]["active_disruption"], "DENSE_FOG_WARNING")
        self.assertLessEqual(step_fog["simulator_state"]["current_speed_kmh"], 60.0)

if __name__ == '__main__':
    unittest.main()
