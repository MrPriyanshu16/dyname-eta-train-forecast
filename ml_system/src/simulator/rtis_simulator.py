import math
import datetime
from typing import Dict, Any, List, Optional
from ml_system.config.config import CORRIDOR_STATIONS, CORRIDOR_SECTIONS, CORRIDOR_TRAINS
from ml_system.src.inference.pipeline import RealTimeETAPredictor

class RTISTelemetrySimulator:
    """
    Simulates a live locomotive-mounted RTIS unit broadcasting timestamped telemetry pings.
    Replays journey progression chronologically along the Golden Quadrilateral corridor.
    Includes disruption injection sandbox for demonstrations and viva evaluations.
    """
    def __init__(self, predictor: Optional[RealTimeETAPredictor] = None):
        self.predictor = predictor or RealTimeETAPredictor()
        self.stations = CORRIDOR_STATIONS
        self.train = CORRIDOR_TRAINS[0] # Default to 22436 Vande Bharat
        self.reset()

    def reset(self):
        self.current_time = datetime.datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
        self.km_position = 0.0 # Starts at NDLS
        self.current_delay_min = 0.0
        self.base_speed = 125.0
        self.current_speed = 125.0
        self.fog_index = 0.0
        self.active_disruption = None
        self.signal_halt = False
        self.section_occupancy = 0.4
        self.headway_km = 18.0

    def inject_fog(self, fog_index: float = 0.85):
        """Reduces max permissible speed to 60 km/h due to visibility restrictions"""
        self.fog_index = fog_index
        self.active_disruption = "DENSE_FOG_WARNING"
        self.current_speed = min(self.current_speed, 60.0)

    def inject_signal_stop(self):
        """Simulates train held at red automatic block signal"""
        self.signal_halt = True
        self.current_speed = 0.0
        self.active_disruption = "AUTOMATIC_SIGNAL_RED_ASPECT"

    def inject_maintenance_block(self):
        """Simulates single line operation / track maintenance restriction"""
        self.section_occupancy = 1.4
        self.active_disruption = "SINGLE_LINE_TRACK_MAINTENANCE"
        self.current_speed = min(self.current_speed, 45.0)

    def reset_disruptions(self):
        """Restores normal clear corridor conditions"""
        self.fog_index = 0.0
        self.signal_halt = False
        self.section_occupancy = 0.4
        self.headway_km = 18.0
        self.current_speed = self.base_speed
        self.active_disruption = None

    def step(self, delta_minutes: float = 5.0) -> Dict[str, Any]:
        """
        Advances the simulated clock by delta_minutes.
        Updates physical train position, calculates delay increment, and triggers ETA inference.
        """
        self.current_time += datetime.timedelta(minutes=delta_minutes)
        
        # If train is halted at red signal
        if self.signal_halt:
            self.current_speed = 0.0
            self.current_delay_min += delta_minutes
        else:
            # Calculate distance covered: d = v * t
            effective_speed = 60.0 if self.fog_index > 0.3 else (45.0 if self.section_occupancy > 1.2 else self.base_speed)
            self.current_speed = effective_speed
            dist_km = (effective_speed / 60.0) * delta_minutes
            self.km_position = min(440.3, self.km_position + dist_km)
            
            # Delay accumulation if running slower than scheduled 110 km/h
            sched_dist_km = (110.0 / 60.0) * delta_minutes
            if dist_km < sched_dist_km:
                lost_min = (sched_dist_km - dist_km) / (110.0 / 60.0)
                self.current_delay_min += lost_min
            elif self.current_delay_min > 0:
                # Recovery margin
                rec_min = (dist_km - sched_dist_km) / (110.0 / 60.0)
                self.current_delay_min = max(0.0, self.current_delay_min - rec_min)

        # Interpolate coordinates based on corridor km
        lat, lng = self._interpolate_coordinates(self.km_position)

        # Invoke Real-Time ETA Prediction
        prediction_result = self.predictor.predict_eta(
            train_number=self.train['train_number'],
            timestamp_str=self.current_time.isoformat(),
            latitude=lat,
            longitude=lng,
            speed_kmh=self.current_speed,
            current_delay_min=self.current_delay_min,
            weather_fog_index=self.fog_index,
            section_occupancy_ratio=self.section_occupancy,
            headway_km=self.headway_km
        )

        return {
            "simulator_state": {
                "active_disruption": self.active_disruption,
                "current_speed_kmh": round(self.current_speed, 1),
                "km_position": round(self.km_position, 1),
                "current_delay_minutes": round(self.current_delay_min, 1),
                "weather_fog_index": self.fog_index,
                "is_signal_halt": self.signal_halt,
                "progress_percentage": round((self.km_position / 440.3) * 100, 1)
            },
            "telemetry_ping": {
                "timestamp": self.current_time.isoformat(),
                "train_number": self.train['train_number'],
                "latitude": round(lat, 5),
                "longitude": round(lng, 5),
                "speed_kmh": round(self.current_speed, 1)
            },
            "eta_forecast": prediction_result
        }

    def _interpolate_coordinates(self, km: float):
        for i in range(len(self.stations) - 1):
            s1 = self.stations[i]
            s2 = self.stations[i + 1]
            if s1['km'] <= km <= s2['km']:
                ratio = (km - s1['km']) / (s2['km'] - s1['km']) if s2['km'] > s1['km'] else 0.0
                lat = s1['lat'] + (s2['lat'] - s1['lat']) * ratio
                lng = s1['lng'] + (s2['lng'] - s1['lng']) * ratio
                return lat, lng
        # If at destination
        last = self.stations[-1]
        return last['lat'], last['lng']
