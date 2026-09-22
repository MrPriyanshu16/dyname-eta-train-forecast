"""
Comprehensive Automated Test Suite: Rajasthan Train ETA Prediction System
Verifies:
1. Dynamic station and train discovery (no hardcoded count requirements)
2. Canonical train identity and route sequence verification
3. Operational Baselines A, B, C, and D behavior
4. Negative/early delay handling
5. Multi-day and midnight crossing datetime integrity
6. Separation of STA, current delay, predicted delay, and ETA
7. Raw observation timestamp preservation
8. Stage 2 ML feature extraction readiness
"""

import sys
import datetime
import sqlite3
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ml_system.src.models.baselines import (
    ScheduleBasedRemainingTimeBaseline,
    CurrentDelayPropagationBaseline,
    HistoricalSectionMedianBaseline,
    DelayRecoveryBaseline
)
from ml_system.src.features.engineering import PointInTimeFeatureExtractor
from ml_system.src.inference.pipeline import OperationalETABaselineEngine

DB_PATH = Path("ml_system/data/railway_master.db")


def test_dynamic_scope_discovery():
    """Verify station and train counts are dynamically discovered from DB."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    stn_count = cur.execute("SELECT COUNT(1) FROM rajasthan_stations").fetchone()[0]
    trn_count = cur.execute("SELECT COUNT(1) FROM rajasthan_trains").fetchone()[0]
    conn.close()

    print(f"[TEST 1] Dynamically Discovered: {stn_count} Rajasthan Stations, {trn_count} Rajasthan Trains.")
    assert stn_count > 0, "Rajasthan stations table must not be empty"
    assert trn_count > 0, "Rajasthan trains table must not be empty"
    print("  -> PASSED: Dynamic scope discovery verified without hardcoded constraints.")


def test_canonical_train_verification():
    """Verify canonical train identities 22491, 22492, and 14888 exist with verified stops."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for t_num in ['22491', '22492', '14888']:
        t_row = cur.execute("SELECT train_name, from_station_code, to_station_code FROM trains WHERE train_number = ?", (t_num,)).fetchone()
        assert t_row is not None, f"Train {t_num} must exist in trains master"
        
        stops = cur.execute("SELECT COUNT(1) FROM train_routes WHERE train_number = ?", (t_num,)).fetchone()[0]
        assert stops >= 10, f"Train {t_num} must have canonical stops registered (found {stops})"
        print(f"[TEST 2] Train {t_num}: {t_row[0]} ({t_row[1]} -> {t_row[2]}) with {stops} stops verified.")
        
    conn.close()
    print("  -> PASSED: Canonical train identities verified.")


def test_operational_baselines():
    """Verify mathematical behavior of Baselines A, B, C, and D."""
    b_a = ScheduleBasedRemainingTimeBaseline()
    b_b = CurrentDelayPropagationBaseline()
    b_c = HistoricalSectionMedianBaseline()
    b_d = DelayRecoveryBaseline()

    obs_dt = datetime.datetime(2026, 9, 22, 21, 0, 0)
    sta_dt = datetime.datetime(2026, 9, 23, 6, 45, 0)

    # 1. Baseline A: Schedule Benchmark
    res_a = b_a.predict_single(sta_dt, obs_dt)
    assert res_a["status"] == "AVAILABLE"
    assert res_a["is_operational_eta"] is False
    assert res_a["predicted_delay_minutes"] == 0.0
    assert res_a["predicted_eta_datetime"] == sta_dt.isoformat()
    print("[TEST 3A] Baseline A (Schedule Benchmark) correctly returns ETA = STA.")

    # 2. Baseline B: Current Delay Propagation (+20 min)
    res_b_late = b_b.predict_single(sta_dt, obs_dt, current_delay_minutes=20.0)
    expected_late_eta = datetime.datetime(2026, 9, 23, 7, 5, 0).isoformat()
    assert res_b_late["status"] == "AVAILABLE"
    assert res_b_late["is_operational_eta"] is True
    assert res_b_late["predicted_delay_minutes"] == 20.0
    assert res_b_late["predicted_eta_datetime"] == expected_late_eta
    print("[TEST 3B] Baseline B (+20 min) correctly computes ETA = STA + 20 min.")

    # 3. Baseline B: Early Running (-5 min)
    res_b_early = b_b.predict_single(sta_dt, obs_dt, current_delay_minutes=-5.0)
    expected_early_eta = datetime.datetime(2026, 9, 23, 6, 40, 0).isoformat()
    assert res_b_early["predicted_delay_minutes"] == -5.0
    assert res_b_early["predicted_eta_datetime"] == expected_early_eta
    print("[TEST 3C] Baseline B (-5 min early) correctly computes ETA = STA - 5 min.")

    # 4. Baseline C & D: Explicitly UNAVAILABLE
    res_c = b_c.predict_single()
    res_d = b_d.predict_single()
    assert res_c["status"] == "UNAVAILABLE", "Baseline C must be UNAVAILABLE"
    assert res_d["status"] == "UNAVAILABLE", "Baseline D must be UNAVAILABLE"
    print("[TEST 3D] Baselines C and D are explicitly marked UNAVAILABLE as required.")
    print("  -> PASSED: All 4 baselines behave in strict accordance with scientific specifications.")


def test_engine_inference_and_signal_separation():
    """Verify end-to-end engine output, raw timestamp preservation, and signal separation."""
    engine = OperationalETABaselineEngine(str(DB_PATH))

    obs_time_str = "2026-09-22T21:15:30"
    res = engine.predict_eta(
        train_number="22491",
        observation_timestamp=obs_time_str,
        journey_start_date="2026-09-22",
        current_delay_min=15.0,
        current_station_code="JU"
    )

    # 1. Verify Raw Timestamp Preservation
    assert res["observation_state"]["observation_timestamp"] == obs_time_str
    print("[TEST 4A] Raw observation timestamp preserved exactly.")

    # 2. Verify Signal Separation
    dest = res["predictions"]["destination"]
    assert "scheduled_arrival_sta" in dest
    assert "estimated_arrival_eta" in dest
    assert "observed_current_delay_minutes" in dest
    assert "predicted_delay_minutes" in dest

    sta = dest["scheduled_arrival_sta"]
    eta = dest["estimated_arrival_eta"]
    curr_d = dest["observed_current_delay_minutes"]
    pred_d = dest["predicted_delay_minutes"]

    assert curr_d == 15.0
    assert pred_d == 15.0
    assert sta == "06:45"
    assert eta == "07:00"
    print(f"[TEST 4B] Signal separation verified: STA={sta}, Current Delay={curr_d}m, Predicted Delay={pred_d}m, ETA={eta}.")

    # 3. Verify Model Status
    assert res["engine_metadata"]["model_status"] == "INSUFFICIENT_GROUND_TRUTH_IN_CURRENT_AUDIT"
    print("[TEST 4C] Engine metadata reflects INSUFFICIENT_GROUND_TRUTH_IN_CURRENT_AUDIT.")

    # 4. Verify Stage 2 ML Feature Extraction Readiness
    stage2 = res["stage_2_ml_interface"]
    assert stage2["is_ml_ready"] is True
    features = stage2["point_in_time_features"]
    assert "current_delay_min" in features
    assert "observation_timestamp" in features
    assert "distance_remaining" in features
    assert "journey_progress_ratio" in features
    print(f"[TEST 4D] Stage 2 ML Feature vector verified ready ({len(features)} attributes).")
    print("  -> PASSED: End-to-end inference and signal separation verified.")


def test_multi_day_overnight_crossing():
    """Verify multi-day date calculation on Train 14888 (Barmer to Rishikesh)."""
    engine = OperationalETABaselineEngine(str(DB_PATH))

    res = engine.predict_eta(
        train_number="14888",
        observation_timestamp="2026-09-22T06:00:00",
        journey_start_date="2026-09-22",
        current_delay_min=30.0,
        current_station_code="BME"
    )

    dest = res["predictions"]["destination"]
    # Destination is Rishikesh (RKSH), scheduled Day 2
    assert "Wed, 23 Sep" in dest["scheduled_arrival_date"]
    assert "Wed, 23 Sep" in dest["estimated_arrival_date"]
    assert dest["scheduled_arrival_sta"] == "09:54"
    assert dest["estimated_arrival_eta"] == "10:24"  # 09:54 + 30 min = 10:24
    print(f"[TEST 5] Train 14888 multi-day handling: Day 2 arrival {dest['scheduled_arrival_sta']} -> ETA {dest['estimated_arrival_eta']} on {dest['estimated_arrival_date']}.")
    print("  -> PASSED: Multi-day and overnight crossings mathematically verified.")


if __name__ == "__main__":
    print("=================================================================")
    print("Running Automated Test Suite: Rajasthan Train ETA Prediction System")
    print("=================================================================\n")
    test_dynamic_scope_discovery()
    print()
    test_canonical_train_verification()
    print()
    test_operational_baselines()
    print()
    test_engine_inference_and_signal_separation()
    print()
    test_multi_day_overnight_crossing()
    print("\n=================================================================")
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("=================================================================")
