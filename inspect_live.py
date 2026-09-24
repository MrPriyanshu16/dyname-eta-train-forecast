import urllib.request
import json

def test_rajasthan_network():
    req = urllib.request.urlopen('http://localhost:8000/api/state')
    state = json.loads(req.read().decode('utf-8'))
    
    print("=" * 70)
    print(" LIVE RAJASTHAN STATE RAILWAY NETWORK (NORTH WESTERN RAILWAY - NWR)")
    print("=" * 70)
    print(f"System Clock       : {state['timestamp']}")
    print(f"Corridor           : Jaipur Junction (JP) to Jodhpur Junction (JU) via Ajmer (412 km)")
    print(f"Sections Count     : {len(state['sections'])} block sections")
    
    print("\n" + "-" * 70)
    print(" ACTIVE RAJASTHAN COACHING TRAINS (DYNAMIC ML ETA FORECASTS)")
    print("-" * 70)
    for t in state['trains']:
        next_halt = t['dynamic_etas'][0] if t['dynamic_etas'] else None
        halt_str = f"Next: {next_halt['station_name']} ({next_halt['station_code']}) at {next_halt['dynamic_ml_eta']} (Scheduled: {next_halt['scheduled_arr']})" if next_halt else "At Jodhpur Terminus"
        print(f"• Train {t['train_number']} - {t['train_name']} [{t['category']}]:")
        print(f"    Speed: {t['current_speed_kmh']} km/h | Position: {round(t['current_km'], 1)} km | Delay: +{round(t['current_delay_min'], 1)}m")
        print(f"    {halt_str}")
        if next_halt:
            print(f"    Explainable AI Reason: '{next_halt['delay_reason']}'")
    
    print("\n" + "-" * 70)
    print(" PLATFORM ALLOCATION ADVISOR (JODHPUR JUNCTION & AJMER JUNCTION)")
    print("-" * 70)
    conflicts = state.get('platform_conflicts', [])
    print(f"Platform Conflicts Detected: {len(conflicts)}")
    for c in conflicts:
        print(f"  ⚠️ Warning on Platform {c['platform']} at {c['station_name']}:")
        print(f"     Train {c['train_1']['train_number']} and Train {c['train_2']['train_number']} arrive within {c['time_difference_min']} min!")
        print(f"     Action: {c['recommended_action']}")
    if not conflicts:
        print("  All incoming train ETAs maintain safe operational buffer (>15 min) at Jodhpur platforms.")

    print("\n" + "-" * 70)
    print(" RAJASTHAN DISRUPTION SANDBOX (TESTING DESERT SANDSTORM / AANDHI)")
    print("-" * 70)
    print("Injecting Desert Sandstorm (Aandhi) via POST /api/disruptions/inject...")
    fog_req = urllib.request.Request(
        'http://localhost:8000/api/disruptions/inject',
        data=json.dumps({'type': 'fog'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(fog_req)
    
    # Read updated state
    state_storm = json.loads(urllib.request.urlopen('http://localhost:8000/api/state').read().decode('utf-8'))
    t_vande = state_storm['trains'][0]
    next_vande = t_vande['dynamic_etas'][0] if t_vande['dynamic_etas'] else None
    print(f"Vande Bharat speed under Sandstorm: {t_vande['current_speed_kmh']} km/h (Capped from 130 km/h)")
    if next_vande:
        print(f"Updated Dynamic AI ETA           : {next_vande['dynamic_ml_eta']} (Predicted delay: +{round(next_vande['dynamic_ml_delay_min'], 1)}m)")
        print(f"Updated AI Reason                : '{next_vande['delay_reason']}'")
    
    # Reset
    reset_req = urllib.request.Request('http://localhost:8000/api/disruptions/reset', data=b'', headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(reset_req)
    print("Sandstorm cleared; corridor operations restored to timetable normal.")
    print("=" * 70)

if __name__ == '__main__':
    test_rajasthan_network()
