#!/usr/bin/env python3
"""
Rajasthan Real-Time Train Live Locator (CLI)
Queries Indian Railways NTES live telemetry to report the authentic live position
and actual delay of trains operating across Rajasthan.

Usage:
    python rajasthan_live_tracker/track_live_train.py <train_number>
"""

import sys
import os

# Ensure parent directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from rajasthan_live_tracker.live_locator import locate_train_live


def main():
    if len(sys.argv) < 2:
        print("Usage: python rajasthan_live_tracker/track_live_train.py <train_number>")
        print("Example: python rajasthan_live_tracker/track_live_train.py 14888")
        print("         python rajasthan_live_tracker/track_live_train.py 19720")
        sys.exit(1)

    train_no = sys.argv[1].strip()

    print("\n" + "=" * 76)
    print("      RAJASTHAN REAL-TIME TRAIN LOCATOR (LIVE TELEMETRY)")
    print("=" * 76)
    print(f"Connecting to Indian Railways NTES for Train {train_no}...")

    res = locate_train_live(train_no)

    if not res.get('success'):
        print(f"\n[ERROR] {res.get('error', 'Unable to fetch live status')}")
        print("=" * 76 + "\n")
        sys.exit(1)

    stn = res['current_station']
    delay = res['live_delay']
    in_rj = "YES (Rajasthan)" if res['is_currently_in_rajasthan'] else "OUTSIDE RAJASTHAN"

    print("-" * 76)
    print(f"TRAIN INFORMATION:")
    print(f"  Train Number:      {res['train_number']}")
    print(f"  Train Name:        {res['train_name']}")
    print(f"  Journey Date:      {res.get('start_date') or 'Today'}")
    print(f"  Operational State: {res['status']}")
    print(f"  Rajasthan Route:   {'Yes (Verified Rajasthan Service)' if res['touches_rajasthan_network'] else 'No'}")
    print("-" * 76)
    print(f"CURRENT LIVE LOCATION:")
    print(f"  Raw Telemetry:     {res['raw_position_text']}")
    print(f"  Current Station:   {stn['name']} ({stn['code'] or 'N/A'})")
    print(f"  Movement Event:    {res['action']}")
    print(f"  Live Event Date:   {res.get('event_date') or res.get('start_date') or 'Today'}")
    print(f"  Event Timestamp:   {res.get('event_time') or 'Live'}")
    
    if stn.get('latitude') and stn.get('longitude'):
        print(f"  GPS Coordinates:   {stn['latitude']:.5f} deg N, {stn['longitude']:.5f} deg E")
    else:
        print(f"  GPS Coordinates:   [Station coordinates not mapped]")

    print(f"  Inside Rajasthan:  {in_rj}")
    print("-" * 76)
    print(f"REAL-TIME DELAY:")
    print(f"  Actual Delay:      {delay['display']} ({delay['delay_minutes']} minutes)")
    print(f"  Last Update Time:  {res.get('last_updated') or 'Just now'}")
    print("-" * 76)
    print(f"Data Ground Truth:   {res['data_source']}")
    print("=" * 76 + "\n")


if __name__ == '__main__':
    main()
