"""
TRACKLINE CLI Test Tool - Train Running Status & ETA Forecast
Test any train directly from Python terminal.

Usage:
    python test_train.py 14888
    python test_train.py 22491
    python test_train.py 19720
    python test_train.py 12951
"""

import sys
import datetime
from pathlib import Path
from ml_system.src.inference.pipeline import RealTimeETAPredictor
from ml_system.src.api.main import get_train_details

def test_train(train_number: str = "14888", delay_minutes: float = 15.0):
    db_path = Path("ml_system/data/railway_master.db")
    if not db_path.exists():
        print(f"Error: Master database not found at {db_path}")
        return

    predictor = RealTimeETAPredictor(str(db_path))

    print("=" * 78)
    print(" TRACKLINE DYNAMIC TRAIN STATUS & ETA FORECAST (PS-26028)")
    print("=" * 78)

    try:
        details = get_train_details(train_number)
    except Exception as e:
        print(f"Error fetching train {train_number}: {e}")
        return

    t_num = details["number"]
    t_name = details["name"]
    t_type = details["type"]
    from_name = details["origin"]["name"]
    from_code = details["origin"]["code"]
    to_name = details["destination"]["name"]
    to_code = details["destination"]["code"]
    dist_km = details["distanceKm"]
    curr_status = details["currentStatus"]
    curr_station = curr_status["currentStationName"]
    curr_code = curr_status["currentStationCode"]
    stops = details["stops"]

    # Run ML/baseline dynamic ETA forecast
    try:
        prediction = predictor.predict_eta(
            train_number=t_num,
            current_delay_min=delay_minutes,
            current_station_code=curr_code
        )
        dest_pred = prediction["predictions"]["destination"]
        dest_eta = dest_pred["predicted_eta"]
        p10 = dest_pred["prediction_interval_80pct"]["lower_eta"]
        p90 = dest_pred["prediction_interval_80pct"]["upper_eta"]
        ntes_dest_eta = dest_pred["ntes_baseline_eta"]
        upcoming_map = {s["station_code"]: s for s in prediction["predictions"]["upcoming_stations"]}
    except Exception as e:
        dest_pred = None
        dest_eta = details["arrivalTime"]
        p10 = "--"
        p90 = "--"
        ntes_dest_eta = "--"
        upcoming_map = {}

    print(f"Train:       {t_num} - {t_name}")
    print(f"Route:       {from_name} ({from_code}) -> {to_name} ({to_code})")
    print(f"Category:    {t_type} | Total Distance: {dist_km} km | Total Stops: {len(stops)}")
    print(f"Departure:   {details['departureTime']} (STA) | Scheduled Arrival: {details['arrivalTime']} (STA)")
    print("-" * 78)
    print("CURRENT LIVE POSITION & DELAY:")
    print(f"  Current Station:   {curr_station} ({curr_code})")
    print(f"  Movement State:    {curr_status['state']} ({curr_status['statusExplanation']})")
    delay_str = f"Late by {int(delay_minutes)} mins" if delay_minutes > 0 else "Right Time (On Time)"
    print(f"  Delay Status:      [ {delay_str} ]")
    print("-" * 78)

    print("DESTINATION ARRIVAL FORECAST (NTES vs DYNAMIC ETA):")
    dest_sched = details["arrivalTime"]
    print(f"  White (Scheduled Arrival - STA):    {dest_sched}")
    if delay_minutes > 0:
        print(f"  Red   (Actual / Expected Arrival):  {dest_eta}  (Delay: +{int(delay_minutes)}m)")
        print(f"  Red   (Delay Block):                [ LATE BY {int(delay_minutes)} MINS ]")
    else:
        print(f"  Green (Actual / Expected Arrival):  {dest_sched}  (On Time)")
        print(f"  Green (Delay Block):                [ RIGHT TIME / ON TIME ]")

    print(f"  Static NTES Propagation:            {ntes_dest_eta}")
    print(f"  Heuristic 80% Window [P10, P90]:    {p10} - {p90}")

    print("=" * 78)
    print(f"{'Seq':<4} {'Code':<6} {'Station Name':<22} {'Scheduled':<12} {'Expected':<12} {'Status / Delay':<18}")
    print("-" * 78)

    for idx, stop in enumerate(stops, start=1):
        scode = stop["stationCode"]
        sname = stop["stationName"][:20]
        sched_arr = stop["scheduledArrival"]
        sched_dep = stop["scheduledDeparture"]
        sched_display = sched_arr if sched_arr != "--" else f"Dep {sched_dep}"

        # Expected time
        pred = upcoming_map.get(scode)
        if pred:
            exp_time = pred["predicted_eta"]
        elif stop["status"] == "COMPLETED":
            exp_time = sched_display
        else:
            exp_time = sched_display

        # Status text
        if stop["status"] == "COMPLETED":
            st_text = "Departed"
        elif stop["status"] == "CURRENT":
            st_text = ">> AT STATION"
        elif stop["status"] == "NEXT":
            st_text = "Next Stop"
        else:
            st_text = f"+{int(delay_minutes)}m delay" if delay_minutes > 0 else "On Time"

        print(f"{idx:<4} {scode:<6} {sname:<22} {sched_display:<12} {exp_time:<12} {st_text:<18}")

    print("=" * 78)

if __name__ == "__main__":
    train_arg = sys.argv[1] if len(sys.argv) > 1 else "14888"
    delay_arg = float(sys.argv[2]) if len(sys.argv) > 2 else 15.0
    test_train(train_arg, delay_arg)
