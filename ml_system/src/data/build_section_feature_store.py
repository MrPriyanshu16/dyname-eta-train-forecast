"""
ml_system/src/data/build_section_feature_store.py

Reconstructs point-in-time railway section traversal observations and targets
from September 2024 historical actual-vs-scheduled train delay records.

Strictly preserves temporal causality: features are evaluated at timestamp T
(train departure from from_station). No future actuals leak into input features.
"""

import os
import csv
import math
import argparse
from datetime import datetime
from collections import defaultdict

def parse_time_minutes(t_str):
    if not t_str or t_str in ('None', 'null', '--', ''):
        return None
    t_str = t_str.strip()
    try:
        dt = datetime.strptime(t_str, "%I:%M %p")
        return dt.hour * 60 + dt.minute
    except Exception:
        pass
    try:
        parts = t_str.split(':')
        if len(parts) >= 2:
            return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        pass
    return None

def build_section_feature_store(
    delays_path,
    routes_path,
    edges_path,
    output_path,
    rajasthan_touching_only=True
):
    print(f"Loading routes from: {routes_path}")
    routes_by_train = defaultdict(dict)
    train_metadata = {}
    
    with open(routes_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tn = row['train_number']
            sc = row['station_code']
            seq = int(row['station_sequence'])
            dist = float(row.get('distance_km', 0.0) or 0.0)
            sch_arr_m = parse_time_minutes(row.get('scheduled_arrival_24h') or row.get('scheduled_arrival'))
            sch_dep_m = parse_time_minutes(row.get('scheduled_departure_24h') or row.get('scheduled_departure'))
            
            routes_by_train[tn][sc] = {
                'sequence': seq,
                'station_name': row.get('station_name', ''),
                'distance_km': dist,
                'sched_arr_min': sch_arr_m,
                'sched_dep_min': sch_dep_m,
                'is_rajasthan': int(row.get('is_rajasthan_station', '0') or 0)
            }
            if tn not in train_metadata:
                train_metadata[tn] = row.get('train_name', '')
                
    # Precompute total route distances and stops
    train_route_stats = {}
    for tn, stops in routes_by_train.items():
        sorted_stops = sorted(stops.values(), key=lambda s: s['sequence'])
        max_dist = max((s['distance_km'] for s in sorted_stops), default=0.0)
        max_seq = max((s['sequence'] for s in sorted_stops), default=1)
        train_route_stats[tn] = {
            'total_distance_km': max_dist,
            'total_stops': max_seq
        }

    print(f"Loading network edges from: {edges_path}")
    edge_traffic = {}
    if os.path.exists(edges_path):
        with open(edges_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                u = row['from_station']
                v = row['to_station']
                cnt = int(row.get('daily_train_count', 0) or 0)
                edge_traffic[(u, v)] = cnt
                edge_traffic[(v, u)] = cnt

    print(f"Loading historical delays from: {delays_path}")
    delays_by_journey = defaultdict(list)
    with open(delays_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tn = row['train_number']
            jd = row['journey_date']
            delays_by_journey[(tn, jd)].append(row)

    print(f"Reconstructing sections across {len(delays_by_journey)} journeys...")
    section_rows = []
    
    for (tn, jd), obs_list in delays_by_journey.items():
        if tn not in routes_by_train:
            continue
            
        route_stops = routes_by_train[tn]
        r_stats = train_route_stats[tn]
        
        # Journey date day of week
        try:
            jdt = datetime.strptime(jd, "%Y-%m-%d")
            day_of_week = jdt.weekday()
            is_weekend = 1 if day_of_week in (5, 6) else 0
        except Exception:
            day_of_week = 0
            is_weekend = 0
            
        # Match observations to route sequences
        matched_obs = []
        for o in obs_list:
            sc = o['station_code']
            if sc in route_stops:
                matched_obs.append({
                    'obs': o,
                    'stop_meta': route_stops[sc]
                })
                
        # Sort strictly by route sequence
        matched_obs.sort(key=lambda item: item['stop_meta']['sequence'])
        
        # Traverse consecutive stations
        for i in range(len(matched_obs) - 1):
            curr_item = matched_obs[i]
            nxt_item = matched_obs[i+1]
            
            curr_o = curr_item['obs']
            curr_meta = curr_item['stop_meta']
            nxt_o = nxt_item['obs']
            nxt_meta = nxt_item['stop_meta']
            
            curr_sc = curr_o['station_code']
            nxt_sc = nxt_o['station_code']
            curr_seq = curr_meta['sequence']
            nxt_seq = nxt_meta['sequence']
            
            is_consec = 1 if nxt_seq == curr_seq + 1 else 0
            from_in_rj = curr_meta['is_rajasthan']
            to_in_rj = nxt_meta['is_rajasthan']
            
            # Determine scope tag
            if from_in_rj == 1 and to_in_rj == 1:
                scope_tag = 'intra_rj'
            elif from_in_rj == 1 and to_in_rj == 0:
                scope_tag = 'exits_rj'
            elif from_in_rj == 0 and to_in_rj == 1:
                scope_tag = 'enters_rj'
            else:
                scope_tag = 'external'
                
            if rajasthan_touching_only and scope_tag == 'external':
                continue
                
            # Point-in-time features at current station departure (T)
            curr_sch_arr = curr_meta['sched_arr_min']
            curr_sch_dep = curr_meta['sched_dep_min']
            curr_act_arr = parse_time_minutes(curr_o.get('actual_arrival'))
            curr_act_dep = parse_time_minutes(curr_o.get('actual_departure'))
            
            try:
                curr_arr_delay = float(curr_o.get('arrival_delay_minutes', 0.0) or 0.0)
            except Exception:
                curr_arr_delay = 0.0
                
            try:
                curr_dep_delay = float(curr_o.get('departure_delay_minutes', 0.0) or 0.0)
            except Exception:
                curr_dep_delay = 0.0
                
            # Dwell calculations at from_station
            if curr_sch_arr is not None and curr_sch_dep is not None:
                sched_dwell = (curr_sch_dep - curr_sch_arr) % 1440
            else:
                sched_dwell = 0
                
            if curr_act_arr is not None and curr_act_dep is not None:
                act_dwell = (curr_act_dep - curr_act_arr) % 1440
            else:
                act_dwell = sched_dwell
                
            dwell_delay_change = curr_dep_delay - curr_arr_delay
            
            # Section distance and scheduled runtime
            section_dist = max(0.0, nxt_meta['distance_km'] - curr_meta['distance_km'])
            nxt_sch_arr = nxt_meta['sched_arr_min']
            if curr_sch_dep is not None and nxt_sch_arr is not None:
                sched_runtime = (nxt_sch_arr - curr_sch_dep) % 1440
            else:
                sched_runtime = 0
                
            sched_speed = (section_dist / (sched_runtime / 60.0)) if sched_runtime > 0 else 0.0
            
            # Temporal departure features
            dep_hour = (curr_act_dep // 60) if curr_act_dep is not None else (curr_sch_dep // 60 if curr_sch_dep is not None else 12)
            dep_hour_float = (curr_act_dep / 60.0) if curr_act_dep is not None else (curr_sch_dep / 60.0 if curr_sch_dep is not None else 12.0)
            dep_sin = math.sin(2 * math.pi * dep_hour_float / 24.0)
            dep_cos = math.cos(2 * math.pi * dep_hour_float / 24.0)
            
            # Journey progress features
            tot_dist = r_stats['total_distance_km']
            cum_dist = curr_meta['distance_km']
            frac_done = (cum_dist / tot_dist) if tot_dist > 0 else 0.0
            stops_rem = max(0, r_stats['total_stops'] - curr_seq)
            
            # Edge traffic density
            daily_trains = edge_traffic.get((curr_sc, nxt_sc), 0)
            
            # Targets at next station arrival (Strictly for training evaluation)
            nxt_act_arr = parse_time_minutes(nxt_o.get('actual_arrival'))
            try:
                nxt_arr_delay = float(nxt_o.get('arrival_delay_minutes', 0.0) or 0.0)
            except Exception:
                nxt_arr_delay = 0.0
                
            sec_delay_change = nxt_arr_delay - curr_dep_delay
            actual_runtime = sched_runtime + sec_delay_change
            
            if sec_delay_change < -2.0:
                prop_cat = 'recovered'
            elif sec_delay_change > 2.0:
                prop_cat = 'increased'
            else:
                prop_cat = 'stable'
                
            row_dict = {
                'journey_id': f"{tn}_{jd}",
                'train_number': tn,
                'train_name': train_metadata.get(tn, ''),
                'journey_date': jd,
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'from_station_code': curr_sc,
                'from_station_name': curr_meta['station_name'],
                'from_sequence': curr_seq,
                'to_station_code': nxt_sc,
                'to_station_name': nxt_meta['station_name'],
                'to_sequence': nxt_seq,
                'is_consecutive_stops': is_consec,
                'is_from_in_rajasthan': from_in_rj,
                'is_to_in_rajasthan': to_in_rj,
                'scope_tag': scope_tag,
                # Features known at T (Departure from from_station)
                'from_sched_arr_min': curr_sch_arr if curr_sch_arr is not None else '',
                'from_act_arr_min': curr_act_arr if curr_act_arr is not None else '',
                'from_arr_delay_min': round(curr_arr_delay, 1),
                'from_sched_dep_min': curr_sch_dep if curr_sch_dep is not None else '',
                'from_act_dep_min': curr_act_dep if curr_act_dep is not None else '',
                'from_dep_delay_min': round(curr_dep_delay, 1),
                'from_sched_dwell_min': sched_dwell,
                'from_act_dwell_min': act_dwell,
                'from_dwell_delay_change_min': round(dwell_delay_change, 1),
                'departure_hour': dep_hour,
                'departure_time_sin': round(dep_sin, 4),
                'departure_time_cos': round(dep_cos, 4),
                'section_distance_km': round(section_dist, 1),
                'sched_section_runtime_min': sched_runtime,
                'sched_speed_kmh': round(sched_speed, 1),
                'route_total_distance_km': round(tot_dist, 1),
                'cum_distance_km': round(cum_dist, 1),
                'fraction_route_completed': round(frac_done, 4),
                'stops_remaining': stops_rem,
                'edge_daily_train_count': daily_trains,
                # Ground Truth Targets (supervised labels)
                'target_next_actual_runtime_min': round(actual_runtime, 1),
                'target_next_arr_delay_min': round(nxt_arr_delay, 1),
                'target_section_delay_change_min': round(sec_delay_change, 1),
                'target_propagation_category': prop_cat
            }
            section_rows.append(row_dict)

    print(f"Writing {len(section_rows)} section training records to {output_path}...")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    if section_rows:
        fieldnames = list(section_rows[0].keys())
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(section_rows)
            
    print("Section feature store build complete.")
    return len(section_rows)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Build section-level training observations feature store.")
    parser.add_argument('--delays', default=r"Datasets\rajasthan\rajasthan_historical_delays_Sep2024.csv")
    parser.add_argument('--routes', default=r"Datasets\rajasthan\rajasthan_train_routes_Sep2024.csv")
    parser.add_argument('--edges', default=r"Datasets\rajasthan\rajasthan_network_edges.csv")
    parser.add_argument('--output', default=r"Datasets\rajasthan\rajasthan_section_training_observations.csv")
    parser.add_argument('--all-sections', action='store_true', help="Include external non-Rajasthan sections too")
    args = parser.parse_args()

    build_section_feature_store(
        delays_path=args.delays,
        routes_path=args.routes,
        edges_path=args.edges,
        output_path=args.output,
        rajasthan_touching_only=not args.all_sections
    )
