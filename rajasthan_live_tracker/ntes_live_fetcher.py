"""
Indian Railways NTES Live Telemetry Fetcher
Fetches authentic real-time running status directly from Indian Railways National Train Enquiry System (NTES).
"""

import requests
import re
import datetime
import html
from typing import Optional, Dict, Any

BASE_URL = 'https://enquiry.indianrail.gov.in/mntes'

DEFAULT_HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': f'{BASE_URL}/',
    'Origin': 'https://enquiry.indianrail.gov.in',
    'X-Requested-With': 'XMLHttpRequest',
}


def _parse_delay_minutes(delay_str: str) -> int:
    """Parses delay string like '00:28' or '01:15' or '28' into total minutes."""
    if not delay_str:
        return 0
    clean = delay_str.replace('Delay', '').replace('-', '').replace(':', ' ').strip()
    parts = clean.split()
    if len(parts) == 2:
        try:
            return int(parts[0]) * 60 + int(parts[1])
        except ValueError:
            return 0
    elif len(parts) == 1:
        try:
            return int(parts[0])
        except ValueError:
            return 0
    return 0


def _parse_station_delay_minutes(delay_str: str) -> int:
    """Parses station delay strings from NTES table like '1 Min', '11 Min', '1 Hr 15 Min', 'On Time'."""
    if not delay_str:
        return 0
    clean = delay_str.lower().strip()
    if 'on time' in clean or 'right time' in clean or 'src' in clean or 'dstn' in clean:
        return 0
    hrs = 0
    mins = 0
    m_hr = re.search(r'(\d+)\s*(?:hr|hour)', clean)
    if m_hr:
        hrs = int(m_hr.group(1))
    m_min = re.search(r'(\d+)\s*min', clean)
    if m_min:
        mins = int(m_min.group(1))
    if not m_hr and not m_min:
        parts = clean.replace(':', ' ').split()
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 1 and parts[0].isdigit():
            return int(parts[0])
    total = hrs * 60 + mins
    if 'before' in clean or 'early' in clean:
        return -total
    return total


def _parse_ntes_station_table(html_text: str, start_date: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
    """
    Parses authentic station-level schedule, actual times, and delays from NTES running instance HTML.
    Returns mapping: station_code -> station details dict.
    """
    results: Dict[str, Dict[str, Any]] = {}
    if not html_text:
        return results

    tab_html = None
    # Priority 1: Check active tab pane in NTES HTML
    m_active = re.search(
        r'<div[^>]*class=[\'"][^\'"]*tab-pane\s+active[^\'"]*[\'"][^>]*id=[\'"](train[^\'"]+)[\'"][^>]*>(.*?)(?=<div[^>]*class=[\'"][^\'"]*tab-pane|\Z)',
        html_text,
        re.DOTALL | re.I
    )
    if not m_active:
        m_active = re.search(
            r'<div[^>]*id=[\'"](train[^\'"]+)[\'"][^>]*class=[\'"][^\'"]*tab-pane\s+active[^\'"]*[\'"][^>]*>(.*?)(?=<div[^>]*class=[\'"][^\'"]*tab-pane|\Z)',
            html_text,
            re.DOTALL | re.I
        )
    if m_active:
        tab_html = m_active.group(2)

    # Priority 2: Match explicitly requested start_date
    if not tab_html and start_date:
        clean_sd = start_date.lower().replace(' ', '-')
        m_sd = re.search(
            rf'<div[^>]*class=[\'"][^\'"]*tab-pane[^\'"]*[\'"][^>]*id=[\'"](train[^\'"]*{clean_sd}[^\'"]*)[\'"][^>]*>(.*?)(?=<div[^>]*class=[\'"][^\'"]*tab-pane|\Z)',
            html_text,
            re.DOTALL | re.I
        )
        if m_sd:
            tab_html = m_sd.group(2)

    if not tab_html:
        tab_html = html_text

    stop_rows = re.findall(
        r'<div[^>]*class=[\'"][^\'"]*\bstopRow\b[^\'"]*[\'"][^>]*>(.*?)(?=<div[^>]*class=[\'"][^\'"]*(?:\bstopRow\b|\bnonStopRow\b)[^\'"]*[\'"]|\Z)',
        tab_html,
        re.DOTALL | re.I
    )

    for sr in stop_rows:
        m_code = re.search(r'<div style=[\'"]float:left;padding:\s*0px;[\'"]>\s*<b>\s*([A-Z0-9]+)\b', sr)
        if not m_code:
            m_code = re.search(r'<b>([A-Z0-9]{2,6})\s*(?:<span|\s*</b>|\s*<)', sr)
        if not m_code:
            continue
        code = m_code.group(1).strip().upper()

        m_name = re.search(r'<span><font[^>]*><b>([A-Za-z0-9\s\.\-]+)</b>', sr)
        name = m_name.group(1).strip() if m_name else code

        left_m = re.search(r'<div class=[\'"]w3-container[\'"][^>]*style=[\'"][^\'"]*float:left;width:100px;[^\'"]*[\'"][^>]*>(.*?)</div>', sr, re.DOTALL)
        right_m = re.search(r'<div class=[\'"]w3-container[\'"][^>]*style=[\'"][^\'"]*float:right;text-align:right;[^\'"]*[\'"][^>]*>(.*?)</div>', sr, re.DOTALL)

        def parse_container(c_html: str):
            if not c_html:
                return {'sched': '--', 'sched_date': '', 'actual': '--', 'actual_date': '', 'delay_min': 0, 'dynamic': False, 'is_special': True}
            if 'SRC' in c_html:
                return {'sched': '--', 'sched_date': '', 'actual': '--', 'actual_date': '', 'delay_min': 0, 'dynamic': False, 'is_special': True}
            if 'DSTN' in c_html:
                return {'sched': '--', 'sched_date': '', 'actual': '--', 'actual_date': '', 'delay_min': 0, 'dynamic': False, 'is_special': True}

            times = re.findall(r'(\d{1,2}:\d{2})\s*(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)?(\*)?', c_html)
            delays = re.findall(r'([0-9]+\s*(?:Min|Hr|Hour)[^<]*|On\s*Time|Right\s*Time)', c_html, re.I)

            sched_time = times[0][0] if len(times) > 0 else '--'
            sched_date = times[0][1] if len(times) > 0 and times[0][1] else ''

            act_time = times[1][0] if len(times) > 1 else sched_time
            act_date = times[1][1] if len(times) > 1 and times[1][1] else sched_date
            is_dynamic = bool(times[1][2]) if len(times) > 1 else (bool(times[0][2]) if len(times) > 0 else False)

            delay_str = delays[0] if delays else ''
            delay_min = _parse_station_delay_minutes(delay_str)

            return {
                'sched': sched_time,
                'sched_date': sched_date,
                'actual': act_time,
                'actual_date': act_date,
                'delay_min': delay_min,
                'dynamic': is_dynamic,
                'is_special': False
            }

        arr_parsed = parse_container(left_m.group(1) if left_m else '')
        dep_parsed = parse_container(right_m.group(1) if right_m else '')

        is_crossed = False
        if not dep_parsed['is_special'] and not dep_parsed['dynamic'] and dep_parsed['actual'] != '--':
            is_crossed = True
        elif not arr_parsed['is_special'] and not arr_parsed['dynamic'] and arr_parsed['actual'] != '--':
            is_crossed = True
        elif dep_parsed['is_special'] and not arr_parsed['dynamic'] and arr_parsed['actual'] != '--':
            is_crossed = True
        elif arr_parsed['is_special'] and not dep_parsed['dynamic'] and dep_parsed['actual'] != '--':
            is_crossed = True

        results[code] = {
            'station_code': code,
            'station_name': name,
            'sched_arr': arr_parsed['sched'],
            'sched_arr_date': arr_parsed['sched_date'],
            'actual_arr': arr_parsed['actual'],
            'actual_arr_date': arr_parsed['actual_date'],
            'arr_delay_min': arr_parsed['delay_min'],
            'arr_dynamic': arr_parsed['dynamic'],
            'sched_dep': dep_parsed['sched'],
            'sched_dep_date': dep_parsed['sched_date'],
            'actual_dep': dep_parsed['actual'],
            'actual_dep_date': dep_parsed['actual_date'],
            'dep_delay_min': dep_parsed['delay_min'],
            'dep_dynamic': dep_parsed['dynamic'],
            'is_crossed': is_crossed
        }

    return results


def fetch_live_ntes_status(train_number: str | int, journey_date: Optional[str] = None, timeout: float = 12.0) -> Dict[str, Any]:
    """
    Connects to NTES and retrieves the actual live position and delay of the specified train.
    
    Returns structured dictionary with:
      - success: bool
      - train_number: str
      - train_name: Optional[str]
      - status: 'IN_TRANSIT' | 'YET_TO_START' | 'TERMINATED' | 'NOT_RUNNING' | 'UNKNOWN'
      - raw_position: str
      - current_station_name: Optional[str]
      - current_station_code: Optional[str]
      - action: 'Departed' | 'Arrived' | 'Approaching' | 'Source'
      - event_time: Optional[str]
      - delay_minutes: int
      - delay_display: str
      - last_updated: Optional[str]
      - error: Optional[str]
    """
    train_str = str(train_number).strip()
    date_str = journey_date or datetime.datetime.now().strftime('%d-%b-%Y')

    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    try:
        # Step 1: Bootstrap session
        r_init = session.get(f'{BASE_URL}/', timeout=timeout)
        r_init.raise_for_status()

        # Step 2: Get dynamic CSRF token
        params = {'t': int(datetime.datetime.now().timestamp() * 1000)}
        r_csrf = session.get(f'{BASE_URL}/GetCSRFToken', params=params, timeout=timeout)
        r_csrf.raise_for_status()

        match = re.search(r"name='([^']+)' value='([^']+)'", r_csrf.text)
        if not match:
            return {
                'success': False,
                'train_number': train_str,
                'error': 'Could not obtain NTES authentication token.'
            }

        csrf_key, csrf_val = match.group(1), match.group(2)

        # Step 3: Query Train Running Instance
        q_params = {
            'opt': 'TrainRunning',
            'subOpt': 'FindRunningInstance',
            'refDate': date_str,
        }
        q_data = {
            'lan': 'en',
            'jDate': date_str,
            'trainNo': train_str,
            csrf_key: csrf_val,
        }
        r_query = session.post(f'{BASE_URL}/tr', params=q_params, data=q_data, timeout=timeout)
        r_query.raise_for_status()

        html_text = r_query.text

        # Clean HTML tags and extract lines
        clean_text = re.sub(r'(?is)<script.*?>.*?</script>', '', html_text)
        clean_text = re.sub(r'(?is)<style.*?>.*?</style>', '', clean_text)
        clean_text = re.sub(r'<[^>]+>', '\n', clean_text)
        lines = [html.unescape(ln.strip()) for ln in clean_text.splitlines() if ln.strip()]

        # Extract Train Name if available
        train_name = None
        for i, line in enumerate(lines[:120]):
            m_name = re.search(rf'{train_str}\s+([A-Z0-9\s\-]+)', line)
            if m_name:
                train_name = m_name.group(1).strip()
                break

        # Extract Start / Journey Date
        start_date = date_str
        m_active_tab = re.search(r'class=[\'"][^\'"]*tab-pane\s+active[^\'"]*[\'"][^>]*id=[\'"]train(\d{1,2}-[a-z]{3}(?:-\d{4})?)[\'"]', html_text, re.I)
        if not m_active_tab:
            m_active_tab = re.search(r'id=[\'"]train(\d{1,2}-[a-z]{3}(?:-\d{4})?)[\'"][^>]*class=[\'"][^\'"]*tab-pane\s+active[^\'"]*', html_text, re.I)
        if m_active_tab:
            start_date = m_active_tab.group(1).strip()
        else:
            for line in lines[:100]:
                m_sd = re.search(r'Start Date\s*:\s*(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)', line, re.I)
                if m_sd:
                    start_date = m_sd.group(1).strip()
                    break

        # Parse authentic station-level schedule, actual times, and delays from NTES running instance
        stations_data = _parse_ntes_station_table(html_text, start_date)

        # Check for Yet to start
        is_yet_to_start = any('Yet to start from its source' in ln for ln in lines[:100])
        is_terminated = any('Reached Destination' in ln or 'Terminated' in ln for ln in lines[:100])

        pos_line = None
        last_updated = None

        for i, line in enumerate(lines):
            if 'Current Position' in line and i + 1 < len(lines):
                pos_line = lines[i + 1]
            if 'Last Updates On' in line and i + 1 < len(lines):
                last_updated = lines[i + 1]

        if is_yet_to_start and not pos_line:
            # Train is at origin station
            src_station_name = None
            src_station_code = None
            for i, line in enumerate(lines[:120]):
                if 'SRC' in line:
                    idx = i + 1
                    while idx < len(lines) and 'SRC' in lines[idx]:
                        idx += 1
                    if idx + 1 < len(lines):
                        src_station_name = re.sub(r'[^A-Za-z0-9\s]', '', lines[idx]).strip()
                        src_station_code = re.sub(r'[^A-Z0-9]', '', lines[idx + 1]).strip()
                        break

            return {
                'success': True,
                'train_number': train_str,
                'train_name': train_name or f'Train {train_str}',
                'start_date': start_date,
                'event_date': start_date,
                'status': 'YET_TO_START',
                'raw_position': 'Yet to start from its source',
                'current_station_name': src_station_name or 'Source Station',
                'current_station_code': src_station_code or '',
                'action': 'At Source',
                'event_time': 'Scheduled departure today',
                'delay_minutes': 0,
                'delay_display': 'On Time (Not Started)',
                'last_updated': last_updated or 'Live Timetable',
                'stations_data': stations_data,
                'error': None
            }

        if is_terminated and not pos_line:
            return {
                'success': True,
                'train_number': train_str,
                'train_name': train_name or f'Train {train_str}',
                'start_date': start_date,
                'event_date': start_date,
                'status': 'TERMINATED',
                'raw_position': 'Reached Destination / Terminated',
                'current_station_name': 'Destination Station',
                'current_station_code': '',
                'action': 'Arrived',
                'event_time': 'Journey Completed',
                'delay_minutes': 0,
                'delay_display': 'Completed',
                'last_updated': last_updated or 'Live Timetable',
                'stations_data': stations_data,
                'error': None
            }

        if not pos_line:
            # Could not find current position line
            return {
                'success': False,
                'train_number': train_str,
                'train_name': train_name,
                'status': 'UNKNOWN',
                'raw_position': None,
                'stations_data': stations_data,
                'error': f'Train {train_str} running instance not active on NTES for date {date_str}.'
            }

        # Parse position line:
        # Example 1: "Departed from CHILO(CLO) at 14:21 21-Sep (Delay: 00:39)"
        # Example 2: "Arrived at NAGAUR(NGO) at 14:28 21-Sep (Delay: 00:28)"
        action = 'In Transit'
        station_name = None
        station_code = None
        event_time = None
        delay_minutes = 0
        delay_display = 'On Time'

        if 'Departed' in pos_line:
            action = 'Departed'
        elif 'Arrived' in pos_line:
            action = 'Arrived'
        elif 'Approaching' in pos_line:
            action = 'Approaching'

        # Match Station and Code: e.g. CHILO(CLO) or NAGAUR(NGO)
        m_stn = re.search(r'([A-Za-z0-9\s]+?)\s*\(\s*([A-Z0-9]+)\s*\)', pos_line)
        if m_stn:
            station_name = m_stn.group(1).strip()
            # Clean leading action words and prepositions like "Departed from " or "Arrived at "
            station_name = re.sub(r'^(departed\s+from|arrived\s+at|approaching\s+at|approaching|from|at)\s+', '', station_name, flags=re.I).strip()
            station_code = m_stn.group(2).strip()

        # Match Event Time: e.g. "at 14:21"
        m_time = re.search(r'at\s+(\d{1,2}:\d{2})', pos_line)
        if m_time:
            event_time = m_time.group(1)

        # Match Delay: e.g. "(Delay: 00:39)" or "(On Time)"
        m_delay = re.search(r'Delay[:\s]+([0-9:]+)', pos_line, re.I)
        if m_delay:
            delay_minutes = _parse_delay_minutes(m_delay.group(1))
            delay_display = f"Late by {delay_minutes} mins"
        # Match Event Date: e.g. "21-Sep"
        m_date = re.search(r'(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)', pos_line)
        event_date = m_date.group(1) if m_date else start_date

        return {
            'success': True,
            'train_number': train_str,
            'train_name': train_name or f'Train {train_str}',
            'start_date': start_date,
            'event_date': event_date,
            'status': 'IN_TRANSIT',
            'raw_position': pos_line,
            'current_station_name': station_name or 'En Route',
            'current_station_code': station_code or '',
            'action': action,
            'event_time': event_time,
            'delay_minutes': delay_minutes,
            'delay_display': delay_display,
            'last_updated': last_updated or 'Just now',
            'stations_data': stations_data,
            'error': None
        }

    except Exception as e:
        return {
            'success': False,
            'train_number': train_str,
            'error': f'Failed to query NTES: {str(e)}'
        }
