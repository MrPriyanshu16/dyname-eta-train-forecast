"""
Comprehensive End-to-End Test Suite for Dynamic Rail ETA Forecasting Platform
Tests all 12 operational conditions, ML inference, physics digital twin, disruption sandbox, and API endpoints.
"""

import unittest
import os
import json
import numpy as np
import pandas as pd

from backend.ml_predictor import predictor, MODEL_PATH
from backend.simulator import simulator
from backend.main import (
    root,
    health_check,
    get_stations,
    get_sections,
    get_trains,
    get_full_state,
    get_evaluation_metrics,
    predict_eta_endpoint,
    inject_disruption,
    reset_disruptions,
    simulator_disruption_endpoint,
    simulator_step_endpoint,
    control_simulation,
    DisruptionRequest,
    SimControlRequest
)
from ml.corridor_data import STATIONS, SECTIONS, TRAINS_SCHEDULE


class TestMLModelAndConditions(unittest.TestCase):
    """Tests the trained Gradient Boosting model, features, and metric criteria."""

    def test_01_model_loaded_and_valid(self):
        """Verifies that model.pkl exists, loads properly, and is a valid regressor."""
        self.assertTrue(os.path.exists(MODEL_PATH), "model.pkl must exist in ml/ directory")
        self.assertIsNotNone(predictor.model, "Predictor model instance should not be None")
        self.assertTrue(hasattr(predictor.model, "predict"), "Model must have predict method")

    def test_02_model_handles_all_12_features(self):
        """Verifies that the model accepts all 12 operational features and outputs sensible delays."""
        sample_input = pd.DataFrame([{
            "current_delay_min": 10.0,
            "distance_remaining_km": 150.0,
            "section_occupancy_ratio": 0.5,
            "priority_tier": 2,
            "weather_fog_index": 0.0,
            "headway_km": 15.0,
            "is_junction_ahead": 1,
            "rainfall_intensity": 0.0,
            "ambient_temp_c": 32.0,
            "tsr_speed_restriction_kmh": 130.0,
            "is_peak_hour": 0,
            "station_dwell_delay_min": 0.0
        }])
        pred = predictor.model.predict(sample_input)
        self.assertEqual(len(pred), 1)
        self.assertIsInstance(float(pred[0]), float)
        self.assertGreater(float(pred[0]), -15.0, "Predicted delay should not be unrealistic negative")

    def test_03_adverse_conditions_increase_delay(self):
        """Tests that adverse conditions (rain, fog, heatwave, TSR, congestion) logically increase predicted delay."""
        base_input = {
            "current_delay_min": 10.0,
            "distance_remaining_km": 180.0,
            "section_occupancy_ratio": 0.35,
            "priority_tier": 2,
            "weather_fog_index": 0.0,
            "headway_km": 20.0,
            "is_junction_ahead": 0,
            "rainfall_intensity": 0.0,
            "ambient_temp_c": 30.0,
            "tsr_speed_restriction_kmh": 130.0,
            "is_peak_hour": 0,
            "station_dwell_delay_min": 0.0
        }
        base_df = pd.DataFrame([base_input])
        base_pred = float(predictor.model.predict(base_df)[0])

        # Test Monsoon Rain condition
        rain_input = dict(base_input, rainfall_intensity=0.9)
        rain_pred = float(predictor.model.predict(pd.DataFrame([rain_input]))[0])
        self.assertGreater(rain_pred, base_pred, "Monsoon waterlogging must increase delay")

        # Test Fog/Sandstorm condition
        fog_input = dict(base_input, weather_fog_index=0.85)
        fog_pred = float(predictor.model.predict(pd.DataFrame([fog_input]))[0])
        self.assertGreater(fog_pred, base_pred, "Fog/sandstorm visibility reduction must increase delay")

        # Test Extreme Heatwave condition (>42°C)
        heat_input = dict(base_input, ambient_temp_c=48.0)
        heat_pred = float(predictor.model.predict(pd.DataFrame([heat_input]))[0])
        self.assertGreater(heat_pred, base_pred, "Extreme heat rail buckling risk must increase delay")

        # Test Temporary Speed Restriction (TSR 30 km/h)
        tsr_input = dict(base_input, tsr_speed_restriction_kmh=30.0)
        tsr_pred = float(predictor.model.predict(pd.DataFrame([tsr_input]))[0])
        self.assertGreater(tsr_pred, base_pred, "TSR caution order must increase delay")

        # Test Track Congestion condition
        congest_input = dict(base_input, section_occupancy_ratio=1.4)
        congest_pred = float(predictor.model.predict(pd.DataFrame([congest_input]))[0])
        self.assertGreater(congest_pred, base_pred, "Heavy block congestion must increase delay")

    def test_04_evaluation_metrics_benchmarks(self):
        """Verifies evaluation_metrics.json has high precision (R² > 0.95, MAE < 10 mins)."""
        metrics = get_evaluation_metrics()
        self.assertNotIn("error", metrics)
        self.assertIn("ml_model", metrics)
        self.assertIn("baseline", metrics)
        self.assertIn("feature_importance", metrics)

        ml_mae = metrics["ml_model"]["mae_minutes"]
        baseline_mae = metrics["baseline"]["mae_minutes"]
        r2 = metrics["ml_model"]["r2_score"]

        self.assertLess(ml_mae, 10.0, f"ML MAE must be < 10 min (got {ml_mae})")
        self.assertGreater(baseline_mae, 50.0, f"NTES Baseline MAE should be > 50 min (got {baseline_mae})")
        self.assertGreater(r2, 0.95, f"ML model R2 score should be > 0.95 (got {r2})")
        self.assertGreater(metrics["ml_model"]["accuracy_gain_pct"], 85.0)

        # Confirm all 12 conditions are present in feature importance
        feat_imp = metrics["feature_importance"]
        self.assertEqual(len(feat_imp), 12, "All 12 conditions must be listed in feature_importance")
        expected_keys = [
            "current_delay_min", "distance_remaining_km", "section_occupancy_ratio",
            "priority_tier", "weather_fog_index", "headway_km", "is_junction_ahead",
            "rainfall_intensity", "ambient_temp_c", "tsr_speed_restriction_kmh",
            "is_peak_hour", "station_dwell_delay_min"
        ]
        for k in expected_keys:
            self.assertIn(k, feat_imp, f"Feature importance missing {k}")


class TestExplainableAI(unittest.TestCase):
    """Tests the domain-accurate Explainable AI (XAI) reason generator."""

    def test_01_clear_track_recovery(self):
        reason = predictor.generate_delay_explanation(
            predicted_delay=2.0,
            current_delay=15.0,
            fog_index=0.0,
            occupancy_ratio=0.3,
            priority_tier=1,
            headway_km=25.0
        )
        self.assertIn("recovering scheduled slack time", reason)

    def test_02_monsoon_rain_attribution(self):
        reason = predictor.generate_delay_explanation(
            predicted_delay=60.0,
            current_delay=10.0,
            rainfall_intensity=0.85
        )
        self.assertIn("Monsoon", reason)
        self.assertIn("waterlogging", reason)

    def test_03_heatwave_attribution(self):
        reason = predictor.generate_delay_explanation(
            predicted_delay=45.0,
            current_delay=10.0,
            ambient_temp_c=46.5
        )
        self.assertIn("heatwave", reason)
        self.assertIn("buckling", reason)

    def test_04_tsr_caution_attribution(self):
        reason = predictor.generate_delay_explanation(
            predicted_delay=50.0,
            current_delay=10.0,
            tsr_speed_restriction_kmh=40.0
        )
        self.assertIn("Temporary Speed Restriction", reason)
        self.assertIn("40 km/h", reason)

    def test_05_sandstorm_fog_attribution(self):
        reason = predictor.generate_delay_explanation(
            predicted_delay=55.0,
            current_delay=10.0,
            fog_index=0.85
        )
        self.assertTrue("sandstorm" in reason.lower() or "fog" in reason.lower())

    def test_06_headway_and_congestion_attribution(self):
        reason = predictor.generate_delay_explanation(
            predicted_delay=80.0,
            current_delay=10.0,
            occupancy_ratio=1.2,
            headway_km=2.1,
            is_junction=True,
            priority_tier=4
        )
        self.assertIn("congestion", reason.lower())
        self.assertIn("headway", reason.lower())
        self.assertIn("junction", reason.lower())


class TestCorridorSimulatorAndDisruptions(unittest.TestCase):
    """Tests digital twin physics, speed restrictions, and disruption sandbox injections."""

    def setUp(self):
        simulator.reset_disruptions()
        simulator.sim_speed_multiplier = 1.0

    def tearDown(self):
        simulator.reset_disruptions()

    def test_01_simulator_initial_fleet(self):
        self.assertEqual(len(simulator.trains), len(TRAINS_SCHEDULE))
        for t_num, t in simulator.trains.items():
            self.assertIn(t["current_status"], ["RUNNING", "CAUTION", "APPROACH"])
            self.assertGreater(t["current_speed_kmh"], 0.0)
            self.assertGreaterEqual(t["current_km"], 0.0)
            self.assertLessEqual(t["current_km"], STATIONS[-1]["km"])

    def test_02_rain_disruption_speed_capping(self):
        """Rain disruption must throttle speed to 30 km/h across active running trains."""
        simulator.inject_disruption("rain")
        self.assertTrue(simulator.disruptions["rain"])
        self.assertGreater(simulator.disruptions["rain_intensity"], 0.5)

        for t in simulator.trains.values():
            self.assertLessEqual(t["current_speed_kmh"], 30.0, "Rain must cap speed to 30 km/h")
            self.assertIn("Waterlogging", t["current_status"])

    def test_03_heatwave_disruption_speed_capping(self):
        """Heatwave disruption must throttle speed to 50 km/h."""
        simulator.inject_disruption("heatwave")
        self.assertTrue(simulator.disruptions["heatwave"])
        self.assertGreater(simulator.disruptions["ambient_temp_c"], 42.0)

        for t in simulator.trains.values():
            self.assertLessEqual(t["current_speed_kmh"], 50.0, "Heatwave must cap speed to 50 km/h")
            self.assertIn("Heat Patrol", t["current_status"])

    def test_04_tsr_disruption_speed_capping(self):
        """TSR on section SEC-4 must throttle trains currently in that section to 40 km/h."""
        simulator.inject_disruption("tsr", "SEC-4")
        self.assertEqual(simulator.disruptions["tsr_section"], "SEC-4")
        self.assertEqual(simulator.disruptions["tsr_speed_kmh"], 40.0)

        for t in simulator.trains.values():
            if t["current_section_id"] == "SEC-4":
                self.assertLessEqual(t["current_speed_kmh"], 40.0, "TSR must cap speed to 40 km/h on SEC-4")

    def test_05_fog_disruption_speed_capping(self):
        """Fog disruption must cap speed to 60 km/h."""
        simulator.inject_disruption("fog")
        self.assertTrue(simulator.disruptions["fog"])

        for t in simulator.trains.values():
            self.assertLessEqual(t["current_speed_kmh"], 60.0, "Fog must cap speed to 60 km/h")

    def test_06_signal_halt_disruption(self):
        """Signal halt must halt targeted train with speed 0 km/h."""
        target_train = "12461"
        simulator.inject_disruption("signal_halt", target_train)
        self.assertEqual(simulator.disruptions["signal_halt_train"], target_train)
        self.assertEqual(simulator.trains[target_train]["current_speed_kmh"], 0.0)
        self.assertIn("HALTED", simulator.trains[target_train]["current_status"])

    def test_07_reset_disruptions(self):
        """Reset clears all disruptions and restores normal operations."""
        simulator.inject_disruption("rain")
        simulator.inject_disruption("heatwave")
        simulator.inject_disruption("tsr", "SEC-3")
        self.assertTrue(simulator.disruptions["rain"])

        simulator.reset_disruptions()
        self.assertFalse(simulator.disruptions["rain"])
        self.assertFalse(simulator.disruptions["heatwave"])
        self.assertIsNone(simulator.disruptions["tsr_section"])
        self.assertFalse(simulator.disruptions["fog"])
        self.assertIsNone(simulator.disruptions["signal_halt_train"])

    def test_08_simulator_tick_advances_positions(self):
        """Simulating a time step advances trains along the corridor."""
        train = list(simulator.trains.values())[0]
        initial_km = train["current_km"]

        # Advance simulator by 30 seconds
        simulator.update_all_states(delta_seconds=30.0)
        new_km = train["current_km"]
        self.assertGreater(new_km, initial_km, "Train km must advance forward when running")

    def test_09_signal_aspect_calculations(self):
        """Automatic block signals return valid aspects (GREEN, YELLOW, RED)."""
        signals = simulator.get_signal_states()
        self.assertGreater(len(signals), 0)
        valid_aspects = {"GREEN", "YELLOW", "RED"}
        for s in signals:
            self.assertIn(s["aspect"], valid_aspects)


class TestFastAPIEndpoints(unittest.TestCase):
    """Tests FastAPI REST endpoints and payload responses."""

    def setUp(self):
        reset_disruptions()

    def test_01_root_and_health(self):
        r = root()
        self.assertEqual(r["status"], "ok")
        self.assertIn("service", r)

        h = health_check()
        self.assertEqual(h["status"], "ok")

    def test_02_stations_and_sections(self):
        st = get_stations()
        self.assertEqual(len(st), len(STATIONS))

        sec = get_sections()
        self.assertEqual(len(sec), len(SECTIONS))
        for s in sec:
            self.assertIn("occupancy_ratio", s)
            self.assertIn("status", s)

    def test_03_full_state(self):
        state = get_full_state()
        self.assertIn("trains", state)
        self.assertIn("sections", state)
        self.assertIn("signals", state)
        self.assertIn("disruptions", state)
        self.assertIn("platform_conflicts", state)
        self.assertIn("rain", state["disruptions"])
        self.assertIn("heatwave", state["disruptions"])
        self.assertIn("tsr_section", state["disruptions"])

    def test_04_predict_eta_endpoint_simulated_train(self):
        """Predicts ETA for simulated train in corridor."""
        payload = {"train_number": "20978"}
        res = predict_eta_endpoint(payload)
        self.assertEqual(res["train_number"], "20978")
        self.assertIn("predictions", res)
        self.assertIn("destination", res["predictions"])
        self.assertIn("predicted_eta", res["predictions"]["destination"])
        self.assertIn("ntes_baseline_eta", res["predictions"]["destination"])
        self.assertIn("upcoming_stations", res["predictions"])

    def test_05_predict_eta_endpoint_arbitrary_train_with_12_conditions(self):
        """Predicts ETA for non-simulated arbitrary train with weather & TSR inputs."""
        payload = {
            "train_number": "99999",
            "train_name": "Test Special",
            "latitude": 26.50,
            "longitude": 74.50,
            "speed": 85.0,
            "current_delay_minutes": 18.0,
            "distance_remaining_km": 120.0,
            "rainfall_intensity": 0.8,
            "ambient_temp_c": 46.0,
            "tsr_speed_restriction_kmh": 40.0,
            "weather_fog_index": 0.0,
            "is_peak_hour": 1
        }
        res = predict_eta_endpoint(payload)
        self.assertEqual(res["train_number"], "99999")
        self.assertIn("predictions", res)
        dest = res["predictions"]["destination"]
        self.assertIn("predicted_eta", dest)
        self.assertIn("ntes_baseline_eta", dest)

    def test_06_disruption_injection_endpoints(self):
        """Tests injection of rain, heatwave, and TSR via REST endpoints."""
        res_rain = inject_disruption(DisruptionRequest(type="rain"))
        self.assertEqual(res_rain["status"], "success")
        self.assertTrue(res_rain["disruptions"]["rain"])

        res_heat = inject_disruption(DisruptionRequest(type="heatwave"))
        self.assertEqual(res_heat["status"], "success")
        self.assertTrue(res_heat["disruptions"]["heatwave"])

        res_tsr = inject_disruption(DisruptionRequest(type="tsr", value="SEC-5"))
        self.assertEqual(res_tsr["status"], "success")
        self.assertEqual(res_tsr["disruptions"]["tsr_section"], "SEC-5")

        # Reset
        res_reset = reset_disruptions()
        self.assertEqual(res_reset["status"], "success")
        self.assertFalse(res_reset["disruptions"]["rain"])
        self.assertFalse(res_reset["disruptions"]["heatwave"])

    def test_07_simulation_control(self):
        """Tests simulation pause, play, and speed multipliers."""
        res_pause = control_simulation(SimControlRequest(is_running=False))
        self.assertFalse(res_pause["is_running"])

        res_speed = control_simulation(SimControlRequest(is_running=True, speed_multiplier=5.0))
        self.assertTrue(res_speed["is_running"])
        self.assertEqual(res_speed["speed_multiplier"], 5.0)

        # Restore
        control_simulation(SimControlRequest(is_running=True, speed_multiplier=1.0))


if __name__ == "__main__":
    unittest.main()
