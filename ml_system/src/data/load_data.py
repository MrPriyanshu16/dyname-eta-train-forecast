import os
import random
import datetime
import numpy as np
import pandas as pd
from pathlib import Path
from ml_system.config.config import (
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    CORRIDOR_STATIONS,
    CORRIDOR_SECTIONS,
    CORRIDOR_TRAINS,
    RANDOM_SEED
)

np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

def build_station_master():
    df = pd.DataFrame(CORRIDOR_STATIONS)
    filepath = RAW_DATA_DIR / 'station_master.csv'
    df.to_csv(filepath, index=False)
    return df

def build_train_master():
    records = []
    for t in CORRIDOR_TRAINS:
        records.append({
            'train_number': t['train_number'],
            'train_name': t['train_name'],
            'train_type': t['train_type'],
            'priority_tier': t['priority_tier'],
            'zone': t['zone'],
            'origin': t['origin'],
            'destination': t['destination'],
            'mps_kmh': t['mps_kmh'],
            'scheduled_departure': t['scheduled_departure_time'],
            'num_stops': len(t['stops'])
        })
    df = pd.DataFrame(records)
    filepath = RAW_DATA_DIR / 'train_master.csv'
    df.to_csv(filepath, index=False)
    return df

def build_sections_master():
    df = pd.DataFrame(CORRIDOR_SECTIONS)
    filepath = RAW_DATA_DIR / 'sections_master.csv'
    df.to_csv(filepath, index=False)
    return df

def build_train_routes():
    station_lookup = {s['code']: s for s in CORRIDOR_STATIONS}
    routes = []
    for t in CORRIDOR_TRAINS:
        t_num = t['train_number']
        dep_str = t['scheduled_departure_time']
        dep_hour, dep_min = map(int, dep_str.split(':'))
        curr_time = datetime.datetime(2025, 1, 1, dep_hour, dep_min)
        stops = t['stops']
        for seq, code in enumerate(stops, start=1):
            sta_info = station_lookup[code]
            dist_km = sta_info['km']
            if seq == 1:
                arr_str = '--:--'
                dep_out = curr_time.strftime('%H:%M')
                dwell = 0
            else:
                prev_code = stops[seq - 2]
                prev_dist = station_lookup[prev_code]['km']
                sec_dist = dist_km - prev_dist
                speed = 100.0 if t['priority_tier'] <= 2 else 85.0
                travel_min = int(round((sec_dist / speed) * 60))
                curr_time += datetime.timedelta(minutes=travel_min)
                arr_str = curr_time.strftime('%H:%M')
                if seq == len(stops):
                    dep_out = '--:--'
                    dwell = 0
                else:
                    dwell = 2 if sta_info['tier'] > 1 else (5 if t['priority_tier'] <= 2 else 10)
                    curr_time += datetime.timedelta(minutes=dwell)
                    dep_out = curr_time.strftime('%H:%M')
            routes.append({
                'train_number': t_num,
                'station_code': code,
                'station_name': sta_info['name'],
                'station_sequence': seq,
                'distance_from_origin': dist_km,
                'scheduled_arrival': arr_str,
                'scheduled_departure': dep_out,
                'halt_duration_min': dwell
            })
    df = pd.DataFrame(routes)
    filepath = RAW_DATA_DIR / 'train_routes.csv'
    df.to_csv(filepath, index=False)
    return df

def generate_historical_runs(n_trips=8000):
    station_lookup = {s['code']: s for s in CORRIDOR_STATIONS}
    train_lookup = {t['train_number']: t for t in CORRIDOR_TRAINS}
    start_date = datetime.date(2025, 1, 1)
    end_date = datetime.date(2025, 6, 30)
    total_days = (end_date - start_date).days
    all_observations = []
    train_keys = list(train_lookup.keys())

    for trip_idx in range(n_trips):
        day_offset = int((trip_idx / n_trips) * total_days)
        journey_date = start_date + datetime.timedelta(days=day_offset)
        train_num = train_keys[trip_idx % len(train_keys)]
        train = train_lookup[train_num]
        stops = train['stops']
        p_tier = train['priority_tier']
        is_winter = journey_date.month in [1, 2]
        fog_index = float(np.random.uniform(0.3, 1.0)) if (is_winter and random.random() < 0.35) else 0.0
        origin_delay = float(np.clip(np.random.exponential(scale=10.0) - 2.0, 0.0, 90.0))
        current_delay = origin_delay
        dep_h, dep_m = map(int, train['scheduled_departure_time'].split(':'))
        sched_clock = datetime.datetime.combine(journey_date, datetime.time(dep_h, dep_m))
        actual_clock = sched_clock + datetime.timedelta(minutes=current_delay)
        d_str = str(journey_date).replace('-', '')
        journey_id = f'JRN-{d_str}-{train_num}-{trip_idx:05d}'
        trip_records = []

        origin_km = station_lookup[stops[0]]['km']
        dest_km = station_lookup[stops[-1]]['km']

        for seq, code in enumerate(stops, start=1):
            sta = station_lookup[code]
            dist = sta['km']
            dist_from_orig = max(0.0, round(dist - origin_km, 1))
            dist_rem = max(0.0, round(dest_km - dist, 1))
            if seq == 1:
                trip_records.append({
                    'journey_id': journey_id,
                    'journey_date': journey_date.isoformat(),
                    'train_number': train_num,
                    'train_type': train['train_type'],
                    'priority_tier': p_tier,
                    'station_code': code,
                    'station_sequence': seq,
                    'distance_from_origin': dist_from_orig,
                    'distance_remaining': dist_rem,
                    'sched_clock': sched_clock,
                    'actual_clock': actual_clock,
                    'scheduled_arrival': '--:--',
                    'scheduled_departure': sched_clock.strftime('%H:%M'),
                    'actual_arrival': '--:--',
                    'actual_departure': actual_clock.strftime('%H:%M'),
                    'current_delay_min': round(current_delay, 2),
                    'section_occupancy_ratio': 0.2,
                    'headway_km': 25.0,
                    'weather_fog_index': round(fog_index, 2),
                    'is_junction_ahead': int(sta['is_junction']),
                    'hour_of_day': actual_clock.hour,
                    'day_of_week': journey_date.weekday(),
                    'month': journey_date.month,
                    'is_weekend': int(journey_date.weekday() >= 5)
                })
            else:
                prev_code = stops[seq - 2]
                prev_dist = station_lookup[prev_code]['km']
                sec_dist = dist - prev_dist
                occupancy = float(np.clip(np.random.beta(a=2, b=3) * 1.4, 0.1, 1.6))
                headway = float(np.clip(np.random.exponential(scale=9.0) + 1.2, 1.0, 30.0))
                base_speed = 100.0 if p_tier <= 2 else 85.0
                sched_run_min = (sec_dist / base_speed) * 60.0
                sched_clock += datetime.timedelta(minutes=int(round(sched_run_min)))

                cong_delay = (occupancy ** 2) * (sec_dist / 40.0) * (p_tier * 2.8)
                signal_delay = max(0.0, (4.5 - headway) * 3.8 * (p_tier * 0.7)) if headway < 4.5 else 0.0
                fog_delay = fog_index * (sec_dist / 35.0) * 14.0
                junction_delay = (occupancy * 6.5 * (p_tier * 1.2)) if sta['is_junction'] else 0.0
                recovery = 0.0
                if p_tier <= 2 and occupancy < 0.6 and fog_index < 0.1 and current_delay > 5:
                    recovery = min(current_delay * 0.4, (sec_dist / 50.0) * 4.5)
                noise = float(np.random.normal(0.0, 1.5))
                section_delay_added = cong_delay + signal_delay + fog_delay + junction_delay - recovery + noise
                section_actual_run_min = max(sec_dist / 135.0 * 60.0, sched_run_min + section_delay_added)

                actual_clock += datetime.timedelta(minutes=int(round(section_actual_run_min)))
                arrival_delay = (actual_clock - sched_clock).total_seconds() / 60.0
                current_delay = arrival_delay

                if seq == len(stops):
                    dwell = 0
                    dep_sched_str = '--:--'
                    dep_act_str = '--:--'
                else:
                    dwell = 2 if sta['tier'] > 1 else (5 if p_tier <= 2 else 8)
                    dwell_delay = max(0.0, np.random.normal(0, 1.0)) if arrival_delay > 15 else 0.0
                    act_dwell = dwell + dwell_delay
                    sched_clock += datetime.timedelta(minutes=dwell)
                    actual_clock += datetime.timedelta(minutes=int(round(act_dwell)))
                    dep_sched_str = sched_clock.strftime('%H:%M')
                    dep_act_str = actual_clock.strftime('%H:%M')
                    current_delay = (actual_clock - sched_clock).total_seconds() / 60.0

                trip_records.append({
                    'journey_id': journey_id,
                    'journey_date': journey_date.isoformat(),
                    'train_number': train_num,
                    'train_type': train['train_type'],
                    'priority_tier': p_tier,
                    'station_code': code,
                    'station_sequence': seq,
                    'distance_from_origin': dist_from_orig,
                    'distance_remaining': dist_rem,
                    'sched_clock': sched_clock,
                    'actual_clock': actual_clock,
                    'scheduled_arrival': sched_clock.strftime('%H:%M'),
                    'scheduled_departure': dep_sched_str,
                    'actual_arrival': actual_clock.strftime('%H:%M'),
                    'actual_departure': dep_act_str,
                    'current_delay_min': round(arrival_delay, 2),
                    'section_occupancy_ratio': round(occupancy, 2),
                    'headway_km': round(headway, 2),
                    'weather_fog_index': round(fog_index, 2),
                    'is_junction_ahead': int(sta['is_junction']),
                    'hour_of_day': actual_clock.hour,
                    'day_of_week': journey_date.weekday(),
                    'month': journey_date.month,
                    'is_weekend': int(journey_date.weekday() >= 5)
                })

        dest_actual_time = trip_records[-1]['actual_clock']
        for i, rec in enumerate(trip_records):
            curr_actual = rec['actual_clock']
            rec['observation_timestamp'] = curr_actual.isoformat()
            rec['target_remaining_time_to_destination'] = max(0.0, round((dest_actual_time - curr_actual).total_seconds() / 60.0, 2))
            if i < len(trip_records) - 1:
                next_actual = trip_records[i + 1]['actual_clock']
                rec['target_remaining_time_to_station'] = max(0.0, round((next_actual - curr_actual).total_seconds() / 60.0, 2))
                rec['next_station_code'] = trip_records[i + 1]['station_code']
                rec['next_station_dist_km'] = trip_records[i + 1]['distance_from_origin'] - rec['distance_from_origin']
            else:
                rec['target_remaining_time_to_station'] = 0.0
                rec['next_station_code'] = rec['station_code']
                rec['next_station_dist_km'] = 0.0
            del rec['sched_clock']
            del rec['actual_clock']
            all_observations.append(rec)

    df = pd.DataFrame(all_observations)
    filepath = RAW_DATA_DIR / 'historical_runs.csv'
    df.to_csv(filepath, index=False)
    print('Generated ' + str(len(df)) + ' historical observation records across ' + str(n_trips) + ' trips.')
    return df

def generate_telemetry_stream():
    stations = CORRIDOR_STATIONS
    pings = []
    start_time = datetime.datetime(2025, 5, 15, 6, 0, 0)
    current_time = start_time
    train_num = '22436'

    for i in range(len(stations) - 1):
        s1 = stations[i]
        s2 = stations[i + 1]
        dist_sec = s2['km'] - s1['km']
        steps = max(2, int(dist_sec / 3.0))
        for step in range(steps):
            ratio = step / steps
            lat = s1['lat'] + (s2['lat'] - s1['lat']) * ratio
            lng = s1['lng'] + (s2['lng'] - s1['lng']) * ratio
            km_pos = s1['km'] + dist_sec * ratio
            speed = random.uniform(115.0, 130.0)
            heading = 125.0
            pings.append({
                'timestamp': current_time.isoformat(),
                'train_number': train_num,
                'latitude': round(lat, 5),
                'longitude': round(lng, 5),
                'speed_kmh': round(speed, 1),
                'heading_deg': heading,
                'distance_along_route_km': round(km_pos, 1)
            })
            current_time += datetime.timedelta(seconds=90)

    pings.append({
        'timestamp': current_time.isoformat(),
        'train_number': train_num,
        'latitude': 29.5,
        'longitude': 78.5,
        'speed_kmh': 120.0,
        'heading_deg': 125.0,
        'distance_along_route_km': 450.0
    })
    current_time += datetime.timedelta(seconds=30)
    pings.append({
        'timestamp': current_time.isoformat(),
        'train_number': train_num,
        'latitude': 26.45,
        'longitude': 80.35,
        'speed_kmh': 350.0,
        'heading_deg': 125.0,
        'distance_along_route_km': 440.0
    })

    df = pd.DataFrame(pings)
    filepath = RAW_DATA_DIR / 'telemetry_stream.csv'
    df.to_csv(filepath, index=False)
    print('Generated ' + str(len(df)) + ' telemetry stream pings.')
    return df

if __name__ == '__main__':
    build_station_master()
    build_train_master()
    build_sections_master()
    build_train_routes()
    generate_historical_runs(n_trips=8000)
    generate_telemetry_stream()
    print('Master datasets and historical runs generated successfully.')
