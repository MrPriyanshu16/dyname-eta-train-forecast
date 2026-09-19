import math
from typing import Dict, Any, List, Optional
from ml_system.config.config import (
    CORRIDOR_STATIONS,
    GPS_MAX_DISTANCE_FROM_CORRIDOR_KM,
    GPS_MAX_FEASIBLE_SPEED_KMH,
    GPS_MAX_TIME_GAP_MINUTES
)

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class GPSLocationValidator:
    """
    Validates incoming raw GPS telemetry pings before passing them to the ML ETA pipeline.
    Prevents corrupt, jumped, or spoofed location data from breaking the forecast.
    """
    def __init__(self, stations: Optional[List[Dict[str, Any]]] = None):
        self.stations = stations or CORRIDOR_STATIONS
        self.last_valid_state: Dict[str, Any] = {}

    def find_nearest_corridor_point(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Finds the closest station or interpolated route segment along the corridor.
        """
        best_dist = float('inf')
        best_station = self.stations[0]
        
        for sta in self.stations:
            dist = haversine_km(lat, lng, sta['lat'], sta['lng'])
            if dist < best_dist:
                best_dist = dist
                best_station = sta
                
        return {
            "nearest_station": best_station['code'],
            "distance_to_corridor_km": round(best_dist, 2),
            "station_km": best_station['km']
        }

    def validate_observation(
        self,
        train_number: str,
        timestamp: str,
        lat: float,
        lng: float,
        speed_kmh: float,
        heading_deg: Optional[float] = None
    ) -> Dict[str, Any]:
        issues = []
        status = "CONSISTENT"
        
        # 1. Geographic check: Proximity to railway corridor
        corridor_info = self.find_nearest_corridor_point(lat, lng)
        dist_to_corridor = corridor_info['distance_to_corridor_km']
        
        if dist_to_corridor > GPS_MAX_DISTANCE_FROM_CORRIDOR_KM:
            if dist_to_corridor > 20.0:
                issues.append(f"Severe off-route GPS fix: {dist_to_corridor} km from corridor")
                status = "INCONSISTENT"
            else:
                issues.append(f"Minor GPS lateral deviation: {dist_to_corridor} km from centerline")
                status = "UNCERTAIN"

        # 2. Speed sanity check
        if speed_kmh < 0.0 or speed_kmh > GPS_MAX_FEASIBLE_SPEED_KMH:
            issues.append(f"Physically impossible speed: {speed_kmh} km/h (max {GPS_MAX_FEASIBLE_SPEED_KMH} km/h)")
            status = "INCONSISTENT"

        # 3. Continuity and Sequence check with respect to last valid state
        last_state = self.last_valid_state.get(train_number)
        if last_state:
            prev_lat = last_state['lat']
            prev_lng = last_state['lng']
            spatial_jump_km = haversine_km(prev_lat, prev_lng, lat, lng)
            
            # If distance jumped > 50km in short time
            if spatial_jump_km > 60.0:
                issues.append(f"Sudden teleportation/GPS jump: {round(spatial_jump_km, 1)} km since last fix")
                status = "INCONSISTENT"
                
            # Sequence progression check (train along corridor should advance from NDLS (km 0) to CNB (km 440))
            curr_km = corridor_info['station_km']
            prev_km = last_state['corridor_km']
            if curr_km < prev_km - 15.0:  # significant backward jump
                issues.append(f"Backward station sequence anomaly: was at km {prev_km}, now at km {curr_km}")
                status = "INCONSISTENT"

        is_valid = (status != "INCONSISTENT")
        if is_valid:
            self.last_valid_state[train_number] = {
                'lat': lat,
                'lng': lng,
                'corridor_km': corridor_info['station_km'],
                'timestamp': timestamp,
                'speed': speed_kmh
            }

        return {
            "is_valid": is_valid,
            "route_status": status,
            "distance_to_corridor_km": dist_to_corridor,
            "nearest_station": corridor_info['nearest_station'],
            "corridor_progress_km": corridor_info['station_km'],
            "validation_issues": issues
        }
