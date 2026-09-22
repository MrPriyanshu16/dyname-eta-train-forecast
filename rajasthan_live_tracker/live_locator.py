"""
Rajasthan Live Train Locator
Provides real-time train location tracking specifically across Rajasthan.
Integrates live NTES telemetry with GIS station coordinates in Rajasthan.
"""

import sqlite3
import os
from typing import Optional, Dict, Any
from .ntes_live_fetcher import fetch_live_ntes_status

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml_system', 'data', 'railway_master.db')


def _get_db_connection() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)


def get_station_geo(station_code: str) -> Optional[Dict[str, Any]]:
    """Fetches GIS coordinates and state info for a station."""
    if not station_code or not os.path.exists(DB_PATH):
        return None
    try:
        conn = _get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT station_code, station_name, latitude, longitude, state FROM stations WHERE station_code = ?",
            (station_code.strip().upper(),)
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return {
                'code': row[0],
                'name': row[1],
                'latitude': float(row[2]) if row[2] else None,
                'longitude': float(row[3]) if row[3] else None,
                'state': row[4] or 'Unknown'
            }
    except Exception:
        pass
    return None


def is_rajasthan_train(train_number: str | int) -> Dict[str, Any]:
    """Checks if a train operates in Rajasthan based on verified stops."""
    train_str = str(train_number).strip()
    if not os.path.exists(DB_PATH):
        return {'valid': True, 'touches_rajasthan': True, 'name': None, 'rajasthan_stop_count': 0}
    
    try:
        conn = _get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT train_name, from_station_code, to_station_code, stops_in_rajasthan FROM rajasthan_trains WHERE train_number = ?",
            (train_str,)
        )
        t_row = cursor.fetchone()
        if t_row:
            conn.close()
            return {
                'valid': True,
                'train_name': t_row[0],
                'origin': t_row[1],
                'destination': t_row[2],
                'touches_rajasthan': t_row[3] > 0,
                'rajasthan_stop_count': t_row[3]
            }

        # Fallback to general trains table
        cursor.execute("SELECT train_name, from_station_code, to_station_code FROM trains WHERE train_number = ?", (train_str,))
        t_row2 = cursor.fetchone()
        conn.close()
        if not t_row2:
            return {'valid': False, 'touches_rajasthan': False, 'name': None, 'rajasthan_stop_count': 0}

        return {
            'valid': True,
            'train_name': t_row2[0],
            'origin': t_row2[1],
            'destination': t_row2[2],
            'touches_rajasthan': False,
            'rajasthan_stop_count': 0
        }
    except Exception as e:
        return {'valid': True, 'touches_rajasthan': True, 'train_name': None, 'rajasthan_stop_count': 0, 'error': str(e)}


def locate_train_live(train_number: str | int, journey_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Locates a train in real-time.
    
    Returns ONLY live location details:
      - train_number
      - train_name
      - live_status (IN_TRANSIT / YET_TO_START / TERMINATED / UNKNOWN)
      - live_position_summary
      - current_station (code, name, lat, lon, state)
      - is_currently_in_rajasthan (bool)
      - live_delay (minutes, display string)
      - last_updated
      - data_source
    """
    train_str = str(train_number).strip()

    # Verify train information
    check = is_rajasthan_train(train_str)
    
    # Query live NTES feed
    ntes_res = fetch_live_ntes_status(train_str, journey_date=journey_date)

    if not ntes_res.get('success'):
        return {
            'success': False,
            'train_number': train_str,
            'train_name': check.get('train_name') or f'Train {train_str}',
            'error': ntes_res.get('error', 'Live tracking data unavailable')
        }

    stn_code = ntes_res.get('current_station_code') or ''
    geo = get_station_geo(stn_code)

    # Determine whether current live location is inside Rajasthan
    is_in_rj = False
    if geo:
        if geo.get('state') == 'Rajasthan':
            is_in_rj = True
        elif geo.get('latitude') and geo.get('longitude'):
            lat, lon = geo['latitude'], geo['longitude']
            # Core Rajasthan coordinates bounding check
            if 23.0 <= lat <= 30.2 and 69.5 <= lon <= 78.5:
                is_in_rj = True

    return {
        'success': True,
        'train_number': train_str,
        'train_name': check.get('train_name') or ntes_res.get('train_name') or f'Train {train_str}',
        'touches_rajasthan_network': check.get('touches_rajasthan', True),
        'status': ntes_res['status'],
        'action': ntes_res['action'],
        'raw_position_text': ntes_res['raw_position'],
        'current_station': {
            'code': stn_code,
            'name': ntes_res.get('current_station_name') or (geo['name'] if geo else 'En Route'),
            'state': geo['state'] if geo else 'Unknown',
            'latitude': geo['latitude'] if geo else None,
            'longitude': geo['longitude'] if geo else None,
        },
        'is_currently_in_rajasthan': is_in_rj,
        'live_delay': {
            'delay_minutes': ntes_res['delay_minutes'],
            'display': ntes_res['delay_display']
        },
        'start_date': ntes_res.get('start_date'),
        'event_date': ntes_res.get('event_date'),
        'event_time': ntes_res.get('event_time'),
        'last_updated': ntes_res.get('last_updated'),
        'stations_data': ntes_res.get('stations_data', {}),
        'data_source': 'National Train Enquiry System (NTES) - Real-time Locomotive Telemetry'
    }
