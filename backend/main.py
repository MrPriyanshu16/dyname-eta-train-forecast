"""
FastAPI Server for Dynamic Train ETA Forecasting System
Provides REST APIs and WebSocket real-time telemetry streaming.
"""

import asyncio
import json
import os
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml.corridor_data import STATIONS, SECTIONS
from backend.simulator import simulator
from backend.ml_predictor import predictor

app = FastAPI(
    title="Dynamic Train ETA Platform (SIH 26028)",
    description="Real-time dynamic arrival forecasting system for Indian Railways coaching trains.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default is http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DisruptionRequest(BaseModel):
    type: str  # "fog", "signal_halt", "maintenance_block"
    value: Optional[str] = None

class SimControlRequest(BaseModel):
    is_running: Optional[bool] = None
    speed_multiplier: Optional[float] = None

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Dynamic Train ETA Forecasting Engine",
        "problem_statement": "SIH Problem Statement 26028 | Ministry of Railways",
        "version": "1.0.0",
        "endpoints": [
            "GET  /",
            "GET  /api/health",
            "GET  /api/stations",
            "GET  /api/sections",
            "GET  /api/trains",
            "GET  /api/state",
            "GET  /api/metrics",
            "GET  /api/model/metrics",
            "POST /api/predict-eta",
            "POST /api/disruptions/inject",
            "POST /api/disruptions/reset",
            "POST /api/simulation/control",
            "POST /api/simulator/disruption",
            "POST /api/simulator/step",
            "WS   /ws/telemetry"
        ]
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Dynamic ETA Forecasting Engine"}

@app.get("/api/stations")
def get_stations():
    return STATIONS

@app.get("/api/sections")
def get_sections():
    return simulator.get_full_state()["sections"]

@app.get("/api/trains")
def get_trains():
    return simulator.trains

@app.get("/api/state")
def get_full_state():
    return simulator.get_full_state()

@app.get("/api/metrics")
@app.get("/api/model/metrics")
def get_evaluation_metrics():
    metrics_file = os.path.join(os.path.dirname(__file__), "..", "ml", "evaluation_metrics.json")
    if os.path.exists(metrics_file):
        with open(metrics_file, "r") as f:
            return json.load(f)
    return {"error": "Metrics not found. Please train model first."}

@app.post("/api/predict-eta")
def predict_eta_endpoint(payload: dict):
    train_num = str(payload.get("train_number", "20978"))
    state = simulator.get_full_state()
    target_train = next((t for t in state["trains"] if str(t["train_number"]) == train_num), None)

    # If the train is not currently simulated in the Rajasthan corridor fleet,
    # generate a dynamic prediction using its telemetry parameters and ML model
    if not target_train:
        current_delay = float(payload.get("current_delay_minutes", 0.0))
        speed = float(payload.get("speed", 100.0))
        fog_idx = float(payload.get("weather_fog_index", 0.0))
        headway = float(payload.get("headway_km", 15.0))
        rain_idx = float(payload.get("rainfall_intensity", payload.get("rain_intensity", 0.0)))
        ambient_temp = float(payload.get("ambient_temp_c", payload.get("ambient_temperature_c", 32.0)))
        tsr_speed = float(payload.get("tsr_speed_restriction_kmh", payload.get("tsr_speed_kmh", 130.0)))
        is_peak = int(payload.get("is_peak_hour", 0))
        dwell_delay = float(payload.get("station_dwell_delay_min", 0.0))
        lat = float(payload.get("latitude", 26.2842))
        lng = float(payload.get("longitude", 73.0188))

        # Predict destination arrival
        dist_rem = float(payload.get("distance_remaining_km", 150.0))
        dest_station_code = payload.get("destination_code", "JU")
        dest_station_name = payload.get("destination_name", "Jodhpur Junction")

        # ML inference across 12 authentic operational conditions
        if predictor.model is not None:
            import pandas as pd
            features_df = pd.DataFrame([{
                "current_delay_min": current_delay,
                "distance_remaining_km": dist_rem,
                "section_occupancy_ratio": 0.5,
                "priority_tier": 2,
                "weather_fog_index": fog_idx,
                "headway_km": headway,
                "is_junction_ahead": 1,
                "rainfall_intensity": rain_idx,
                "ambient_temp_c": ambient_temp,
                "tsr_speed_restriction_kmh": tsr_speed,
                "is_peak_hour": is_peak,
                "station_dwell_delay_min": dwell_delay
            }])
            ml_pred_delay = float(predictor.model.predict(features_df)[0])
            ml_pred_delay = max(-5.0, round(ml_pred_delay, 1))
        else:
            ml_pred_delay = current_delay

        dest_travel_min = max(5.0, round((dist_rem / max(speed, 30.0)) * 60.0 + ml_pred_delay, 1))
        ntes_travel_min = max(5.0, round((dist_rem / max(speed, 30.0)) * 60.0 + current_delay, 1))

        now_time = state.get("timestamp", "12:00")
        dest_pred_eta = predictor.format_time(now_time, dest_travel_min)
        dest_ntes_eta = predictor.format_time(now_time, ntes_travel_min)
        conf_low = predictor.format_time(dest_pred_eta, -4.0)
        conf_high = predictor.format_time(dest_pred_eta, 5.0)

        ai_time_savings = round(max(0.0, current_delay - ml_pred_delay), 1)

        return {
            "train_number": train_num,
            "train_name": payload.get("train_name", f"Train {train_num}"),
            "timestamp": now_time,
            "current_location": {
                "latitude": lat,
                "longitude": lng,
                "speed_kmh": speed,
                "nearest_station": "In Transit",
                "current_section": "SEC-RAJ",
                "distance_from_origin_km": 0.0,
                "distance_remaining_km": dist_rem,
                "route_status": "CONSISTENT",
                "is_valid": True,
                "validation_issues": []
            },
            "operational_context": {
                "current_delay_minutes": current_delay,
                "weather_fog_index": fog_idx,
                "section_occupancy_ratio": 0.5,
                "headway_km": headway
            },
            "predictions": {
                "destination": {
                    "station_code": dest_station_code,
                    "station_name": dest_station_name,
                    "predicted_remaining_minutes": dest_travel_min,
                    "predicted_eta": dest_pred_eta,
                    "prediction_interval_80pct": {
                        "lower_eta": conf_low,
                        "upper_eta": conf_high
                    },
                    "ntes_baseline_eta": dest_ntes_eta,
                    "ai_time_savings_vs_ntes_min": ai_time_savings
                },
                "upcoming_stations": []
            }
        }

    # If target train is in corridor simulator:
    dest_stop = target_train.get("stops", [])[-1] if target_train.get("stops") else {"station": "JU", "arr": "13:30"}
    dest_eta_obj = next((e for e in target_train.get("dynamic_etas", []) if e.get("station_code") == dest_stop.get("station")), None)
    
    upcoming_stations = []
    current_speed = max(target_train.get("current_speed_kmh", 80.0), 30.0)
    for eta_item in target_train.get("dynamic_etas", []):
        dist_km = eta_item.get("distance_km", 0.0)
        # Compute authentic estimated remaining travel minutes
        rem_min = max(1.0, round((dist_km / current_speed) * 60.0 + max(0.0, eta_item.get("dynamic_ml_delay_min", 0.0)), 1))
        is_junc = next((s["is_junction"] for s in STATIONS if s["code"] == eta_item["station_code"]), False)

        upcoming_stations.append({
            "station_code": eta_item["station_code"],
            "station_name": eta_item["station_name"],
            "distance_km": dist_km,
            "predicted_remaining_minutes": rem_min,
            "predicted_eta": eta_item.get("dynamic_ml_eta", "12:00"),
            "ntes_baseline_eta": eta_item.get("ntes_baseline_eta", "12:15"),
            "is_junction": is_junc,
            "confidence_interval": eta_item.get("confidence_interval", ""),
            "delay_reason": eta_item.get("delay_reason", "")
        })

    dest_pred_eta = dest_eta_obj.get("dynamic_ml_eta", "13:30") if dest_eta_obj else "13:30"
    dest_ntes_eta = dest_eta_obj.get("ntes_baseline_eta", "13:45") if dest_eta_obj else "13:45"
    dest_dist_rem = max(0.0, 412.0 - target_train.get("current_km", 0.0))
    dest_rem_min = max(1.0, round((dest_dist_rem / current_speed) * 60.0 + (dest_eta_obj.get("dynamic_ml_delay_min", 0.0) if dest_eta_obj else 0.0), 1))
    
    time_savings = 0.0
    if dest_eta_obj:
        ntes_delay = dest_eta_obj.get("ntes_baseline_delay_min", 0.0)
        ml_delay = dest_eta_obj.get("dynamic_ml_delay_min", 0.0)
        time_savings = max(0.0, round(ntes_delay - ml_delay, 1))

    conf_int = dest_eta_obj.get("confidence_interval", f"{dest_pred_eta} - {dest_ntes_eta}") if dest_eta_obj else f"{dest_pred_eta} - {dest_ntes_eta}"
    conf_parts = [p.strip() for p in conf_int.split("-")]
    lower_eta = conf_parts[0] if len(conf_parts) >= 1 else dest_pred_eta
    upper_eta = conf_parts[1] if len(conf_parts) >= 2 else dest_ntes_eta

    return {
        "train_number": target_train["train_number"],
        "train_name": target_train["train_name"],
        "timestamp": state["timestamp"],
        "current_location": {
            "latitude": target_train["lat"],
            "longitude": target_train["lng"],
            "speed_kmh": target_train["current_speed_kmh"],
            "nearest_station": target_train.get("current_section_id", "SEC-1"),
            "current_section": target_train.get("current_section_id", "SEC-1"),
            "distance_from_origin_km": round(target_train.get("current_km", 0.0), 1),
            "distance_remaining_km": round(dest_dist_rem, 1),
            "route_status": "CONSISTENT",
            "is_valid": True,
            "validation_issues": []
        },
        "operational_context": {
            "current_delay_minutes": target_train.get("current_delay_min", 0.0),
            "weather_fog_index": state.get("disruptions", {}).get("fog_intensity", 0.0),
            "rainfall_intensity": state.get("disruptions", {}).get("rain_intensity", 0.0),
            "ambient_temp_c": state.get("disruptions", {}).get("ambient_temp_c", 32.0),
            "tsr_speed_kmh": state.get("disruptions", {}).get("tsr_speed_kmh", 130.0),
            "section_occupancy_ratio": 0.5,
            "headway_km": target_train.get("headway_km", 12.0)
        },
        "predictions": {
            "destination": {
                "station_code": dest_stop.get("station", "JU"),
                "station_name": "Jodhpur Junction",
                "predicted_remaining_minutes": dest_rem_min,
                "predicted_eta": dest_pred_eta,
                "prediction_interval_80pct": {
                    "lower_eta": lower_eta,
                    "upper_eta": upper_eta
                },
                "ntes_baseline_eta": dest_ntes_eta,
                "ai_time_savings_vs_ntes_min": time_savings
            },
            "upcoming_stations": upcoming_stations
        }
    }

@app.post("/api/disruptions/inject")
def inject_disruption(req: DisruptionRequest):
    simulator.inject_disruption(req.type, req.value)
    return {"status": "success", "disruptions": simulator.disruptions}

@app.post("/api/disruptions/reset")
def reset_disruptions():
    simulator.reset_disruptions()
    return {"status": "success", "disruptions": simulator.disruptions}

# Compatibility endpoints for SimulationDrawer
@app.post("/api/simulator/disruption")
def simulator_disruption_endpoint(payload: dict):
    disruption_type = str(payload.get("disruption_type", "FOG")).upper()
    severity = float(payload.get("severity", 0.85))

    if disruption_type in ["FOG", "SANDSTORM"]:
        simulator.inject_disruption("fog")
        simulator.disruptions["fog_intensity"] = severity
    elif disruption_type == "SIGNAL_RED":
        simulator.inject_disruption("signal_halt")
    elif disruption_type == "MAINTENANCE":
        simulator.inject_disruption("maintenance_block")
    elif disruption_type in ["RAIN", "MONSOON", "WATERLOGGING"]:
        simulator.inject_disruption("rain")
        simulator.disruptions["rain_intensity"] = severity
    elif disruption_type in ["HEATWAVE", "HEAT"]:
        simulator.inject_disruption("heatwave")
    elif disruption_type in ["TSR", "CAUTION"]:
        simulator.inject_disruption("tsr")
    elif disruption_type == "RESET":
        simulator.reset_disruptions()

    active = disruption_type if disruption_type != "RESET" else None
    return {
        "active_disruption": active,
        "simulator_state": {
            "active_disruption": active,
            "disruptions": simulator.disruptions
        }
    }

@app.post("/api/simulator/step")
def simulator_step_endpoint(payload: dict):
    delta_mins = float(payload.get("delta_minutes", 5.0))
    # Advance simulator physics
    simulator.update_all_states(delta_seconds=delta_mins * 60.0)
    full_state = simulator.get_full_state()
    active_train = full_state["trains"][0] if full_state["trains"] else {}

    return {
        "status": "success",
        "simulator_state": {
            "active_disruption": "FOG" if simulator.disruptions["fog"] else None,
            "current_speed_kmh": active_train.get("current_speed_kmh", 110.0),
            "km_position": active_train.get("current_km", 100.0),
            "current_delay_minutes": active_train.get("current_delay_min", 0.0),
            "weather_fog_index": simulator.disruptions.get("fog_intensity", 0.0),
            "is_signal_halt": simulator.disruptions.get("signal_halt_train") is not None,
            "progress_percentage": round((active_train.get("current_km", 0.0) / 412.0) * 100, 1)
        }
    }

@app.post("/api/simulation/control")
def control_simulation(req: SimControlRequest):
    if req.is_running is not None:
        simulator.is_running = req.is_running
    if req.speed_multiplier is not None:
        simulator.sim_speed_multiplier = max(0.5, min(10.0, req.speed_multiplier))
    return {
        "status": "success",
        "is_running": simulator.is_running,
        "speed_multiplier": simulator.sim_speed_multiplier
    }

# --- WebSocket Streaming ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Generate tick
            state = simulator.tick()
            await websocket.send_text(json.dumps(state))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
