"""
Corridor Telemetry Simulator and Dynamic Digital Twin Engine
Models authentic train movements, section occupancies, signal aspects, and disruptions.
Supports 12 real-world operational and environmental conditions.
"""

import math
import time
from typing import Dict, List, Optional
from ml.corridor_data import STATIONS, SECTIONS, TRAINS_SCHEDULE, SIGNALS, NATIONWIDE_ROUTES, NATIONWIDE_STATIONS
from backend.ml_predictor import predictor
from backend.weather_service import fetch_live_corridor_weather

def interpolate_coordinates(km: float) -> tuple[float, float, str]:
    """
    Interpolates latitude and longitude for any kilometer mark along the Rajasthan corridor.
    Also returns the current section ID.
    """
    km = max(0.0, min(km, STATIONS[-1]["km"]))
    
    for i in range(len(STATIONS) - 1):
        s1 = STATIONS[i]
        s2 = STATIONS[i + 1]
        if s1["km"] <= km <= s2["km"]:
            span = s2["km"] - s1["km"]
            ratio = (km - s1["km"]) / span if span > 0 else 0.0
            lat = s1["lat"] + ratio * (s2["lat"] - s1["lat"])
            lng = s1["lng"] + ratio * (s2["lng"] - s1["lng"])
            sec_id = SECTIONS[i]["id"]
            return lat, lng, sec_id

    # Fallback to last station
    last = STATIONS[-1]
    return last["lat"], last["lng"], SECTIONS[-1]["id"]

class CorridorSimulator:
    def __init__(self):
        self.stations = STATIONS
        self.sections = {s["id"]: s for s in SECTIONS}
        self.is_running = True
        self.sim_speed_multiplier = 1.0  # 1x, 2x, 5x
        
        # Operational and environmental disruption flags
        self.disruptions = {
            "fog": False,
            "fog_intensity": 0.0,        # 0.0 to 1.0 (Desert sandstorm / fog)
            "signal_halt_train": None,   # train_number if halted
            "signal_halt_section": None, # section_id if red signal
            "maintenance_section": None, # section_id under maintenance block
            "rain": False,
            "rain_intensity": 0.0,       # 0.0 to 1.0 (Monsoon torrential waterlogging)
            "heatwave": False,
            "ambient_temp_c": 32.0,      # Normal 32°C; heatwave ~47°C
            "tsr_section": None,         # section_id under Temporary Speed Restriction
            "tsr_speed_kmh": 130.0       # 30-50 km/h when active
        }

        # Initialize trains with realistic staggered positions along Rajasthan corridor (0 to 412 km)
        initial_staggers = [335.0, 245.0, 130.0, 52.0, 10.0]
        initial_delays = [2.0, 0.0, 8.0, 22.0, 5.0]

        self.trains: Dict[str, dict] = {}
        for idx, sched in enumerate(TRAINS_SCHEDULE):
            t_num = sched["train_number"]
            init_km = initial_staggers[idx % len(initial_staggers)]
            lat, lng, sec_id = interpolate_coordinates(init_km)
            
            self.trains[t_num] = {
                "train_number": t_num,
                "train_name": sched["train_name"],
                "category": sched["category"],
                "priority_tier": sched["priority_tier"],
                "color": sched["color"],
                "current_km": init_km,
                "lat": lat,
                "lng": lng,
                "current_speed_kmh": 110.0,
                "current_delay_min": initial_delays[idx % len(initial_delays)],
                "current_status": "RUNNING",
                "current_section_id": sec_id,
                "loco": sched.get("loco", "WAP-7"),
                "heading": sched.get("heading", "118° SE"),
                "stops": sched["stops"],
                "dynamic_etas": []
            }

        self.last_tick_time = time.time()
        self.update_all_states(delta_seconds=0.0)

    def get_section_occupancies(self) -> Dict[str, float]:
        """Calculates ratio of trains currently inside each block section."""
        counts = {s_id: 0 for s_id in self.sections}
        for t in self.trains.values():
            sec = t.get("current_section_id")
            if sec in counts:
                counts[sec] += 1
        
        # Calculate ratio: count / capacity
        ratios = {}
        for s_id, count in counts.items():
            cap = self.sections[s_id]["capacity_trains"]
            # If maintenance block, capacity is halved
            if self.disruptions["maintenance_section"] == s_id:
                cap = max(1, cap // 2)
            ratios[s_id] = round(min(1.5, count / cap), 2)
        return ratios

    def calculate_headway(self, train_num: str) -> float:
        """Returns distance in km to the train immediately ahead."""
        target_km = self.trains[train_num]["current_km"]
        ahead_distances = []
        for other_num, other in self.trains.items():
            if other_num != train_num and other["current_km"] > target_km:
                ahead_distances.append(other["current_km"] - target_km)
        
        return min(ahead_distances) if ahead_distances else 40.0

    def detect_platform_conflicts(self, station_code: str = "JU") -> List[dict]:
        """
        Detects if two arriving trains have clashing dynamic ETAs on the same platform at Jodhpur Junction.
        """
        station = next((s for s in self.stations if s["code"] == station_code), None)
        if not station:
            return []

        arrivals_on_platform: Dict[int, List[dict]] = {}
        for t in self.trains.values():
            for eta_info in t.get("dynamic_etas", []):
                if eta_info["station_code"] == station_code:
                    p = eta_info["platform"]
                    if p not in arrivals_on_platform:
                        arrivals_on_platform[p] = []
                    arrivals_on_platform[p].append({
                        "train_number": t["train_number"],
                        "train_name": t["train_name"],
                        "eta": eta_info["dynamic_ml_eta"],
                        "platform": p
                    })

        conflicts = []
        for platform_num, arrivals in arrivals_on_platform.items():
            if len(arrivals) > 1:
                # Compare arrival times
                for i in range(len(arrivals)):
                    for j in range(i + 1, len(arrivals)):
                        t1 = arrivals[i]
                        t2 = arrivals[j]
                        try:
                            h1, m1 = map(int, t1["eta"].split(":"))
                            h2, m2 = map(int, t2["eta"].split(":"))
                            time_diff_min = abs((h1 * 60 + m1) - (h2 * 60 + m2))
                            if time_diff_min <= 15:
                                conflicts.append({
                                    "station": station_code,
                                    "station_name": station["name"],
                                    "platform": platform_num,
                                    "train_1": t1,
                                    "train_2": t2,
                                    "time_difference_min": time_diff_min,
                                    "recommended_action": f"Reassign Train {t2['train_number']} to Platform 4 to prevent delay cascade."
                                })
                        except Exception:
                            pass
        return conflicts

    def update_all_states(self, delta_seconds: float):
        """Advances physics, updates speeds, calculates dynamic ETAs across all 12 conditions."""
        occupancy_map = self.get_section_occupancies()
        fog_idx = self.disruptions["fog_intensity"] if self.disruptions["fog"] else 0.0
        rain_idx = self.disruptions["rain_intensity"] if self.disruptions["rain"] else 0.0
        ambient_temp = self.disruptions.get("ambient_temp_c", 32.0)
        tsr_sec = self.disruptions.get("tsr_section")
        tsr_speed = self.disruptions.get("tsr_speed_kmh", 130.0)

        # Check peak hour
        current_hour = time.localtime().tm_hour
        is_peak = 1 if current_hour in [8, 9, 10, 17, 18, 19] else 0

        for t_num, train in self.trains.items():
            # Check halt conditions
            is_halted = False
            if self.disruptions["signal_halt_train"] == t_num:
                is_halted = True
            if self.disruptions["signal_halt_section"] == train["current_section_id"]:
                is_halted = True

            # Calculate target speed based on conditions
            nominal_mps = self.sections[train["current_section_id"]]["mps_kmh"]
            headway = self.calculate_headway(t_num)

            if is_halted:
                target_speed = 0.0
                train["current_status"] = "HALTED (Signal/Disruption)"
            else:
                target_speed = nominal_mps

                # Weather effect 1: Fog / Sandstorm
                if fog_idx > 0.3:
                    target_speed = min(target_speed, 60.0)
                    train["current_status"] = "CAUTION (Sandstorm MPS 60 km/h)"

                # Weather effect 2: Monsoon Torrential Rain / Waterlogging
                if rain_idx > 0.3:
                    target_speed = min(target_speed, 30.0)
                    train["current_status"] = "CAUTION (Track Waterlogging 30 km/h)"

                # Weather effect 3: Extreme Heatwave / Rail Expansion Caution
                if self.disruptions.get("heatwave") or ambient_temp > 42.0:
                    target_speed = min(target_speed, 50.0)
                    train["current_status"] = f"CAUTION (Rail Heat Patrol {int(ambient_temp)}°C)"

                # Infrastructure effect 1: TSR Caution Order on train's section
                if tsr_sec == train["current_section_id"]:
                    target_speed = min(target_speed, tsr_speed)
                    train["current_status"] = f"TSR CAUTION (Speed Order {int(tsr_speed)} km/h)"

                # Infrastructure effect 2: Maintenance block effect
                if self.disruptions["maintenance_section"] == train["current_section_id"]:
                    target_speed = min(target_speed, 45.0)
                    train["current_status"] = "CAUTION (Track Maintenance 45 km/h)"

                # Signaling effect: Headway signal deceleration
                if headway < 3.0:
                    target_speed = min(target_speed, 30.0)
                    train["current_status"] = "CAUTION (Cautionary Aspect Ahead)"
                elif headway < 6.0:
                    target_speed = min(target_speed, 75.0)
                    if not (train["current_status"].startswith("CAUTION") or train["current_status"].startswith("TSR")):
                        train["current_status"] = "APPROACH (Yellow Signal)"
                elif not (train["current_status"].startswith("CAUTION") or train["current_status"].startswith("TSR")):
                    train["current_status"] = "RUNNING"

                # Priority boost / throttle
                if train["priority_tier"] == 1:
                    target_speed = min(130.0, target_speed)
                elif train["priority_tier"] >= 4:
                    target_speed = min(90.0, target_speed)

            train["current_speed_kmh"] = round(target_speed, 1)

            # Advance position if running
            if self.is_running and delta_seconds > 0:
                # Effective speed scaled with multiplier
                effective_speed = target_speed * self.sim_speed_multiplier
                km_advanced = (effective_speed * (delta_seconds / 3600.0))
                train["current_km"] += km_advanced

                # Accumulate delay if crawling below schedule
                if target_speed < 60.0 and delta_seconds > 0:
                    train["current_delay_min"] += (delta_seconds / 60.0) * 0.8
                elif target_speed >= 110.0 and train["current_delay_min"] > 0:
                    # Time recovery
                    train["current_delay_min"] = max(0.0, train["current_delay_min"] - (delta_seconds / 60.0) * 0.2)

                # Loop back if reaching terminal station (Jodhpur 412 km)
                if train["current_km"] >= STATIONS[-1]["km"]:
                    train["current_km"] = 0.0
                    train["current_delay_min"] = 0.0

            # Update coordinates
            lat, lng, sec_id = interpolate_coordinates(train["current_km"])
            train["lat"] = lat
            train["lng"] = lng
            train["current_section_id"] = sec_id

            # Determine upcoming stops along the corridor
            upcoming_stops = []
            for st in self.stations:
                if st["km"] >= train["current_km"]:
                    # Find scheduled stop or default timetable pass
                    matching_stop = next((s for s in train["stops"] if s["station"] == st["code"]), None)
                    if matching_stop:
                        arr = matching_stop["arr"]
                        dep = matching_stop["dep"]
                        plt = matching_stop["platform"]
                    else:
                        # Calculated pass-through time
                        arr = "18:00"
                        dep = "18:00"
                        plt = 1

                    sec_for_stop = next((sec["id"] for sec in SECTIONS if sec["to"] == st["code"]), "SEC-1")
                    upcoming_stops.append({
                        "station": st["code"],
                        "name": st["name"],
                        "km": st["km"],
                        "arr": arr,
                        "dep": dep,
                        "platform": plt,
                        "is_junction": st["is_junction"],
                        "section_id": sec_for_stop
                    })

            # Calculate Dynamic ML ETAs across all 12 operational parameters
            train["dynamic_etas"] = predictor.predict_downstream_etas(
                train_state=train,
                upcoming_stops=upcoming_stops,
                section_occupancy_map=occupancy_map,
                fog_index=fog_idx,
                headway_km=headway,
                rainfall_intensity=rain_idx,
                ambient_temp_c=ambient_temp,
                tsr_speed_restriction_kmh=tsr_speed if tsr_sec == train["current_section_id"] else 130.0,
                is_peak_hour=is_peak,
                station_dwell_delay_min=0.0
            )

    def tick(self) -> dict:
        """Called every second by the WebSocket or timer."""
        now = time.time()
        delta = now - self.last_tick_time
        self.last_tick_time = now
        delta = min(delta, 2.0)  # cap spike

        self.update_all_states(delta_seconds=delta)
        
        return self.get_full_state()

    def get_signal_states(self) -> List[dict]:
        """
        Dynamically computes Automatic Block Signal aspects (GREEN, YELLOW, RED)
        based on live train proximity and disruptions along the corridor.
        """
        result = []
        for sig in SIGNALS:
            sig_km = sig["km"]
            aspect = "GREEN"
            
            # Check if any train is currently in the block immediately ahead
            for t in self.trains.values():
                t_km = t.get("current_km", 0.0)
                if sig_km <= t_km <= sig_km + 6.0:
                    dist = t_km - sig_km
                    if dist <= 2.5:
                        aspect = "RED"
                        break
                    elif dist <= 6.0 and aspect != "RED":
                        aspect = "YELLOW"
            
            # Injected disruptions
            if self.disruptions.get("maintenance_section") == sig.get("section_id") or self.disruptions.get("tsr_section") == sig.get("section_id"):
                aspect = "YELLOW"
            if self.disruptions.get("signal_halt_section") == sig.get("section_id"):
                aspect = "RED"

            result.append({
                **sig,
                "aspect": aspect
            })
        return result

    def get_full_state(self) -> dict:
        """Returns the full corridor telemetry state."""
        return {
            "timestamp": time.strftime("%H:%M:%S"),
            "is_running": self.is_running,
            "sim_speed": self.sim_speed_multiplier,
            "disruptions": self.disruptions,
            "sections": [
                {
                    **sec,
                    "occupancy_ratio": self.get_section_occupancies()[sec["id"]],
                    "status": "CONGESTED" if self.get_section_occupancies()[sec["id"]] > 0.85 else (
                        "CAUTION" if self.get_section_occupancies()[sec["id"]] > 0.60 else "CLEAR"
                    )
                }
                for sec in SECTIONS
            ],
            "signals": self.get_signal_states(),
            "nationwide_routes": NATIONWIDE_ROUTES,
            "nationwide_stations": NATIONWIDE_STATIONS,
            "trains": list(self.trains.values()),
            "platform_conflicts": self.detect_platform_conflicts("JU")
        }

    def inject_disruption(self, disruption_type: str, value: Optional[str] = None):
        """Triggered by user or viva examiner."""
        dtype = disruption_type.lower()
        if dtype in ["fog", "sandstorm"]:
            self.disruptions["fog"] = True
            self.disruptions["fog_intensity"] = 0.85
        elif dtype == "signal_halt":
            # Halts the first running train or specified train
            self.disruptions["signal_halt_train"] = value if value else "12461"
        elif dtype == "maintenance_block":
            self.disruptions["maintenance_section"] = value if value else "SEC-3"
        elif dtype in ["rain", "waterlogging", "monsoon"]:
            self.disruptions["rain"] = True
            self.disruptions["rain_intensity"] = 0.90
        elif dtype in ["heatwave", "extreme_heat"]:
            self.disruptions["heatwave"] = True
            self.disruptions["ambient_temp_c"] = 47.5
        elif dtype in ["tsr", "caution_order"]:
            self.disruptions["tsr_section"] = value if value else "SEC-4"
            self.disruptions["tsr_speed_kmh"] = 40.0
        self.update_all_states(delta_seconds=0.0)

    def reset_disruptions(self):
        """Clears all injected disruptions."""
        self.disruptions = {
            "fog": False,
            "fog_intensity": 0.0,
            "signal_halt_train": None,
            "signal_halt_section": None,
            "maintenance_section": None,
            "rain": False,
            "rain_intensity": 0.0,
            "heatwave": False,
            "ambient_temp_c": 32.0,
            "tsr_section": None,
            "tsr_speed_kmh": 130.0
        }
        self.update_all_states(delta_seconds=0.0)

# Global simulator singleton
simulator = CorridorSimulator()
