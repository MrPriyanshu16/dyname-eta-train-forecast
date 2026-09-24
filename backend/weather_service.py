"""
Live Weather Service for Rajasthan Lifeline Corridor
Fetches real-time atmospheric telemetry from Open-Meteo API for Jaipur, Ajmer, and Jodhpur.
Includes in-memory caching (5 min TTL) and resilient offline fallback.
"""

import time
import urllib.request
import json
from typing import Dict, Any

# Corridor Weather Observation Points
STATION_COORDS = [
    {"code": "JP", "name": "Jaipur Junction", "lat": 26.9196, "lng": 75.7878},
    {"code": "AII", "name": "Ajmer Junction", "lat": 26.4525, "lng": 74.6399},
    {"code": "JU", "name": "Jodhpur Junction", "lat": 26.2842, "lng": 73.0188},
]

WMO_CODE_MAP = {
    0: ("Clear Sky", "☀️"),
    1: ("Mainly Clear", "🌤️"),
    2: ("Partly Cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Foggy", "🌫️"),
    48: ("Dense Fog / Sandstorm", "🌫️"),
    51: ("Light Drizzle", "🌦️"),
    53: ("Moderate Drizzle", "🌦️"),
    55: ("Dense Drizzle", "🌧️"),
    61: ("Slight Rain", "🌧️"),
    63: ("Moderate Rain", "🌧️"),
    65: ("Heavy Rain", "🌧️"),
    80: ("Rain Showers", "🌦️"),
    81: ("Moderate Showers", "🌧️"),
    82: ("Violent Showers", "⛈️"),
    95: ("Thunderstorm", "⛈️"),
    96: ("Thunderstorm with Hail", "⛈️"),
}

CACHE_TTL_SECONDS = 300  # 5 minutes
_cached_weather: Dict[str, Any] = {}
_cache_timestamp: float = 0.0

def get_default_weather() -> Dict[str, Any]:
    """Fallback weather when offline or external API is unavailable."""
    return {
        "status": "fallback",
        "source": "Rajasthan Climate Model (Offline Fallback)",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "summary": {
            "avg_temp_c": 34.0,
            "condition": "Mainly Clear & Dry",
            "icon": "☀️",
            "visibility_km": 15.0,
            "wind_kmh": 9.5,
            "humidity_pct": 28,
            "rail_impact": "🟢 Normal Transit (MPS 130 km/h)",
            "safety_status": "NORMAL"
        },
        "stations": [
            {
                "code": "JP",
                "name": "Jaipur Junction",
                "temp_c": 34.0,
                "condition": "Clear Sky",
                "icon": "☀️",
                "humidity": 32,
                "visibility_km": 16.0,
                "wind_kmh": 9.0
            },
            {
                "code": "AII",
                "name": "Ajmer Junction",
                "temp_c": 34.5,
                "condition": "Mainly Clear",
                "icon": "🌤️",
                "humidity": 26,
                "visibility_km": 14.0,
                "wind_kmh": 8.5
            },
            {
                "code": "JU",
                "name": "Jodhpur Junction",
                "temp_c": 38.0,
                "condition": "Hot & Dry",
                "icon": "☀️",
                "humidity": 18,
                "visibility_km": 18.0,
                "wind_kmh": 10.0
            }
        ]
    }

def fetch_live_corridor_weather() -> Dict[str, Any]:
    """
    Fetches real-time multi-station weather along the Rajasthan corridor from Open-Meteo.
    Uses in-memory cache to prevent redundant HTTP queries.
    """
    global _cached_weather, _cache_timestamp
    now = time.time()

    if _cached_weather and (now - _cache_timestamp < CACHE_TTL_SECONDS):
        return _cached_weather

    try:
        lats = ",".join(str(s["lat"]) for s in STATION_COORDS)
        lngs = ",".join(str(s["lng"]) for s in STATION_COORDS)
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lats}&longitude={lngs}&"
            f"current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility,is_day"
        )

        req = urllib.request.Request(
            url,
            headers={"User-Agent": "TracklineRailETA/1.0 (Dynamic Train Forecasting Platform)"}
        )
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode())

        if not isinstance(data, list):
            data = [data]

        station_results = []
        temps = []
        visibilities = []
        humidities = []
        winds = []
        primary_wmo = 0

        for idx, st_meta in enumerate(STATION_COORDS):
            loc_data = data[idx] if idx < len(data) else {}
            curr = loc_data.get("current", {})

            temp = float(curr.get("temperature_2m", 34.0))
            humidity = int(curr.get("relative_humidity_2m", 30))
            wmo_code = int(curr.get("weather_code", 0))
            wind = float(curr.get("wind_speed_10m", 8.0))
            vis_m = float(curr.get("visibility", 15000.0))
            vis_km = round(vis_m / 1000.0, 1)

            cond_text, icon = WMO_CODE_MAP.get(wmo_code, ("Fair", "☀️"))

            temps.append(temp)
            visibilities.append(vis_km)
            humidities.append(humidity)
            winds.append(wind)
            if idx == 0 or wmo_code > primary_wmo:
                primary_wmo = wmo_code

            station_results.append({
                "code": st_meta["code"],
                "name": st_meta["name"],
                "temp_c": round(temp, 1),
                "condition": cond_text,
                "icon": icon,
                "humidity": humidity,
                "visibility_km": vis_km,
                "wind_kmh": round(wind, 1),
                "wmo_code": wmo_code
            })

        avg_temp = round(sum(temps) / len(temps), 1) if temps else 34.0
        avg_vis = round(sum(visibilities) / len(visibilities), 1) if visibilities else 15.0
        avg_humidity = round(sum(humidities) / len(humidities)) if humidities else 30
        avg_wind = round(sum(winds) / len(winds), 1) if winds else 8.0

        summary_cond, summary_icon = WMO_CODE_MAP.get(primary_wmo, ("Clear Sky", "☀️"))

        # Determine rail operational impact based on real-time atmospheric conditions
        if avg_vis < 1.0 or primary_wmo in [45, 48]:
            rail_impact = "🟡 Fog/Dust Caution (MPS restricted to 60 km/h)"
            safety_status = "CAUTION"
        elif primary_wmo in [63, 65, 81, 82, 95]:
            rail_impact = "🟡 Heavy Rain Alert (MPS restricted to 45 km/h)"
            safety_status = "CAUTION"
        elif avg_temp >= 44.0:
            rail_impact = "🟡 Heatwave Track Patrol (MPS restricted to 50 km/h)"
            safety_status = "CAUTION"
        else:
            rail_impact = "🟢 Normal Transit (MPS 110 - 130 km/h)"
            safety_status = "NORMAL"

        result = {
            "status": "success",
            "source": "Open-Meteo Real-Time Weather API",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": {
                "avg_temp_c": avg_temp,
                "condition": summary_cond,
                "icon": summary_icon,
                "visibility_km": avg_vis,
                "wind_kmh": avg_wind,
                "humidity_pct": avg_humidity,
                "rail_impact": rail_impact,
                "safety_status": safety_status
            },
            "stations": station_results
        }

        _cached_weather = result
        _cache_timestamp = now
        return result

    except Exception as e:
        print(f"[WeatherService] Live weather fetch failed ({e}), using fallback.")
        if _cached_weather:
            return _cached_weather
        return get_default_weather()
