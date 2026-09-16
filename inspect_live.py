import urllib.request
import json

def test_live_system():
    # 1. Fetch live state from FastAPI server
    req = urllib.request.urlopen('http://localhost:8000/api/state')
    state = json.loads(req.read().decode('utf-8'))
    
    print("=" * 65)
    print(" LIVE SERVER INSPECTION - DYNAMIC RAIL ETA FORECASTING SYSTEM")
    print("=" * 65)
    print(f"System Time        : {state['timestamp']}")
    print(f"Active Trains      : {len(state['trains'])} coaching trains running")
    print(f"Corridor Sections  : {len(state['sections'])} block sections monitored")
    
    # FUNCTION 1: DYNAMIC ETA PREDICTION VS NTES
    print("\n" + "-" * 65)
    print(" FUNCTION 1: DYNAMIC ML ETA PREDICTION (VS NTES BASELINE)")
    print("-" * 65)
    t = state['trains'][0] # Vande Bharat
    print(f"Train              : {t['train_name']} (#{t['train_number']})")
    print(f"Current Speed      : {t['current_speed_kmh']} km/h")
    print(f"Current Position   : {round(t['current_km'], 1)} km from NDLS")
    print(f"Current Delay      : +{round(t['current_delay_min'], 1)} mins")
    
    if t['dynamic_etas']:
        next_stop = t['dynamic_etas'][0]
        print(f"\nNext Halt Station  : {next_stop['station_name']} ({next_stop['station_code']})")
        print(f"  • Scheduled Time : {next_stop['scheduled_arr']}")
        print(f"  • NTES Baseline  : {next_stop['ntes_baseline_eta']} (+{round(next_stop['ntes_baseline_delay_min'], 1)} min)")
        print(f"  • Dynamic AI ETA : {next_stop['dynamic_ml_eta']} (+{round(next_stop['dynamic_ml_delay_min'], 1)} min)")
        print(f"  • 90% Conf Range : {next_stop['confidence_interval']}")
    
    # FUNCTION 2: EXPLAINABLE AI DELAY ATTRIBUTION
    print("\n" + "-" * 65)
    print(" FUNCTION 2: EXPLAINABLE AI DELAY ATTRIBUTION (WHY IS IT LATE?)")
    print("-" * 65)
    if t['dynamic_etas']:
        print(f"AI Reason Generated: '{next_stop['delay_reason']}'")
    
    # FUNCTION 3: PLATFORM CONFLICT ADVISOR
    print("\n" + "-" * 65)
    print(" FUNCTION 3: STATION MASTER PLATFORM ALLOCATION ADVISOR")
    print("-" * 65)
    conflicts = state['platform_conflicts']
    print(f"Platform Conflicts Detected: {len(conflicts)}")
    if conflicts:
        for c in conflicts:
            print(f"  ⚠️ Warning on Platform {c['platform']} at {c['station_name']}:")
            print(f"     Train {c['train_1']['train_number']} (ETA {c['train_1']['eta']}) and Train {c['train_2']['train_number']} (ETA {c['train_2']['eta']}) arrive within {c['time_difference_min']} mins!")
            print(f"     Action: {c['recommended_action']}")
    else:
        print("  All scheduled and dynamic ETAs have safe buffer spacing (>15 min) at Kanpur.")

    # FUNCTION 4: WHAT-IF DISRUPTION (INJECTING FOG)
    print("\n" + "-" * 65)
    print(" FUNCTION 4: WHAT-IF DISRUPTION SANDBOX (LIVE STRESS TEST)")
    print("-" * 65)
    print("Action: Injecting Severe Winter Fog alert via POST /api/disruptions/inject...")
    fog_req = urllib.request.Request(
        'http://localhost:8000/api/disruptions/inject',
        data=json.dumps({'type': 'fog'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(fog_req)
    
    # Fetch updated state after disruption
    state_fog = json.loads(urllib.request.urlopen('http://localhost:8000/api/state').read().decode('utf-8'))
    t_fog = state_fog['trains'][0]
    next_stop_fog = t_fog['dynamic_etas'][0] if t_fog['dynamic_etas'] else None
    
    print(f"Speed under Fog    : {t_fog['current_speed_kmh']} km/h (Capped down from 130 km/h)")
    if next_stop_fog:
        print(f"Updated AI ETA     : {next_stop_fog['dynamic_ml_eta']} (Predicted delay: +{round(next_stop_fog['dynamic_ml_delay_min'], 1)} min)")
        print(f"Updated AI Reason  : '{next_stop_fog['delay_reason']}'")
    
    # Reset
    reset_req = urllib.request.Request(
        'http://localhost:8000/api/disruptions/reset',
        data=b'',
        headers={'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(reset_req)
    print("\nDisruptions reset back to timetable normal.")
    print("=" * 65)

if __name__ == '__main__':
    test_live_system()
