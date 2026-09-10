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
def get_evaluation_metrics():
    metrics_file = os.path.join(os.path.dirname(__file__), "..", "ml", "evaluation_metrics.json")
    if os.path.exists(metrics_file):
        with open(metrics_file, "r") as f:
            return json.load(f)
    return {"error": "Metrics not found. Please train model first."}

@app.post("/api/disruptions/inject")
def inject_disruption(req: DisruptionRequest):
    simulator.inject_disruption(req.type, req.value)
    return {"status": "success", "disruptions": simulator.disruptions}

@app.post("/api/disruptions/reset")
def reset_disruptions():
    simulator.reset_disruptions()
    return {"status": "success", "disruptions": simulator.disruptions}

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
