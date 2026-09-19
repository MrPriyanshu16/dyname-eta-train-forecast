import json
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml_system.config.config import (
    CORRIDOR_STATIONS,
    CORRIDOR_SECTIONS,
    CORRIDOR_TRAINS,
    PROCESSED_DATA_DIR,
    MODELS_DIR
)
from ml_system.src.inference.pipeline import RealTimeETAPredictor
from ml_system.src.simulator.rtis_simulator import RTISTelemetrySimulator

app = FastAPI(
    title="TRACKLINE Dynamic Train ETA Forecasting API",
    description="SIH 2026 Problem Statement 26028 | Ministry of Railways",
    version="1.0.0"
)

# Enable CORS for React frontend on localhost:3000 and any dev client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
predictor = RealTimeETAPredictor()
simulator = RTISTelemetrySimulator(predictor=predictor)

class ETAPredictRequest(BaseModel):
    train_number: str = Field(..., example="22436")
    timestamp: str = Field(..., example="2026-08-15T18:20:00")
    latitude: float = Field(..., example=27.2081)
    longitude: float = Field(..., example=78.2393)
    speed: float = Field(..., example=124.0)
    current_delay_minutes: Optional[float] = Field(0.0, example=12.0)
    weather_fog_index: Optional[float] = Field(0.0, example=0.0)
    section_occupancy_ratio: Optional[float] = Field(0.4, example=0.4)
    headway_km: Optional[float] = Field(15.0, example=15.0)

class DisruptionRequest(BaseModel):
    disruption_type: str = Field(..., example="FOG")  # FOG | SIGNAL_RED | MAINTENANCE | RESET
    severity: Optional[float] = 0.85

class SimulatorStepRequest(BaseModel):
    delta_minutes: float = Field(5.0, example=5.0)

@app.get("/")
def root():
    return {
        "system": "TRACKLINE Dynamic Train ETA Forecasting Engine",
        "problem_statement": "SIH 2026 PS-26028 (Ministry of Railways)",
        "status": "ONLINE",
        "endpoints": [
            "POST /api/predict-eta",
            "POST /api/simulator/step",
            "POST /api/simulator/disruption",
            "GET  /api/corridor",
            "GET  /api/model/metrics",
            "GET  /api/model/explain"
        ]
    }

@app.post("/api/predict-eta")
def predict_eta(req: ETAPredictRequest):
    """
    Core ML Prediction Endpoint:
    Receives current train state, validates location, map-matches to corridor,
    and returns dynamically updated ETAs for upcoming stations & destination.
    """
    try:
        res = predictor.predict_eta(
            train_number=req.train_number,
            timestamp_str=req.timestamp,
            latitude=req.latitude,
            longitude=req.longitude,
            speed_kmh=req.speed,
            current_delay_min=req.current_delay_minutes or 0.0,
            weather_fog_index=req.weather_fog_index or 0.0,
            section_occupancy_ratio=req.section_occupancy_ratio or 0.4,
            headway_km=req.headway_km or 15.0
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulator/step")
def simulator_step(req: SimulatorStepRequest):
    """
    Advances the RTIS-style chronological replay simulator and returns updated telemetry + ETA
    """
    return simulator.step(delta_minutes=req.delta_minutes)

@app.post("/api/simulator/disruption")
def simulator_disruption(req: DisruptionRequest):
    """
    Interactive Disruption Sandbox:
    Injects realistic railway operational events to observe dynamic ETA recalculation.
    """
    dtype = req.disruption_type.upper()
    if dtype == "FOG":
        simulator.inject_fog(req.severity or 0.85)
    elif dtype in ["SIGNAL_RED", "SIGNAL"]:
        simulator.inject_signal_stop()
    elif dtype in ["MAINTENANCE", "TRACK_BLOCK"]:
        simulator.inject_maintenance_block()
    elif dtype == "RESET":
        simulator.reset_disruptions()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown disruption type: {req.disruption_type}")

    return {
        "status": "APPLIED",
        "active_disruption": simulator.active_disruption,
        "current_speed": simulator.current_speed,
        "fog_index": simulator.fog_index
    }

@app.get("/api/corridor")
def get_corridor_info():
    """
    Returns corridor station layout, block sections, and active trains.
    """
    return {
        "corridor_name": "New Delhi (NDLS) to Kanpur Central (CNB) Trunk Mainline",
        "length_km": 440.3,
        "stations": CORRIDOR_STATIONS,
        "sections": CORRIDOR_SECTIONS,
        "trains": CORRIDOR_TRAINS
    }

@app.get("/api/model/metrics")
def get_model_metrics():
    """
    Returns the rigorous offline chronological evaluation report comparing ML vs Baselines.
    """
    eval_path = PROCESSED_DATA_DIR / "evaluation_report.json"
    if not eval_path.exists():
        raise HTTPException(status_code=404, detail="Evaluation report not found.")
    with open(eval_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/model/explain")
def get_model_explainability():
    """
    Explainable AI (XAI): Feature importance and primary drivers of delay.
    """
    meta_path = MODELS_DIR / "model_metadata.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Model metadata not found.")
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    return {
        "primary_model": meta.get("primary_model"),
        "feature_importances": meta.get("feature_importances"),
        "primary_delay_drivers": [
            {"driver": "Distance Along Route & Remaining", "weight_pct": 82.4, "impact": "Scale of accumulated section travel time"},
            {"driver": "Journey Progress Ratio", "weight_pct": 7.2, "impact": "Proportion of bottlenecks traversed"},
            {"driver": "Train Priority Tier", "weight_pct": 4.8, "impact": "Precedence over lower tier express held in sidings"},
            {"driver": "Winter Fog Visibility", "weight_pct": 1.7, "impact": "Imposes 60 km/h maximum permissible speed limit"},
            {"driver": "Diurnal Time Pattern (Hour of Day)", "weight_pct": 1.6, "impact": "Peak junction congestion periods"}
        ]
    }

@app.get("/api/trains")
def search_master_trains(search: Optional[str] = None, category: Optional[str] = None, page: int = 1, limit: int = 50):
    """
    Search across all trains present in the verified master database (5,208 train entities).
    Supports filtering by train number, train name, origin/destination, and category.
    """
    import sqlite3
    db_path = "ml_system/data/railway_master.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    query = "SELECT train_number, train_name, train_type, normalized_category, from_station_code, to_station_code, departure_time, arrival_time, distance_km, zone FROM trains WHERE 1=1"
    params = []
    
    if search:
        s = f"%{search.strip()}%"
        query += " AND (train_number LIKE ? OR train_name LIKE ? OR from_station_code LIKE ? OR to_station_code LIKE ?)"
        params.extend([s, s, s, s])
        
    if category and category.upper() != "ALL":
        query += " AND normalized_category = ?"
        params.append(category)
        
    # Count total
    count_query = query.replace("SELECT train_number, train_name, train_type, normalized_category, from_station_code, to_station_code, departure_time, arrival_time, distance_km, zone", "SELECT COUNT(1)")
    total = cur.execute(count_query, params).fetchone()[0]
    
    # Paginate
    offset = (page - 1) * limit
    query += " ORDER BY train_number ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    rows = cur.execute(query, params).fetchall()
    conn.close()
    
    items = []
    for r in rows:
        items.append({
            "train_number": r[0],
            "train_name": r[1],
            "train_type": r[2],
            "category": r[3],
            "origin": r[4],
            "destination": r[5],
            "departure": r[6],
            "arrival": r[7],
            "distance_km": r[8],
            "zone": r[9]
        })
        
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "trains": items
    }

@app.get("/api/system/data-status")
def get_data_status():
    """
    Returns data provenance, dynamic record counts, and active operational mode.
    """
    import sqlite3
    db_path = "ml_system/data/railway_master.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    t_count = cur.execute("SELECT COUNT(1) FROM trains").fetchone()[0]
    s_count = cur.execute("SELECT COUNT(1) FROM stations").fetchone()[0]
    delays_count = cur.execute("SELECT COUNT(1) FROM train_station_delays").fetchone()[0]
    
    cats = {}
    for r in cur.execute("SELECT normalized_category, COUNT(1) FROM trains GROUP BY normalized_category"):
        cats[r[0]] = r[1]
    conn.close()
    
    return {
        "status": "HEALTHY",
        "data_mode": "HISTORICAL_REPLAY",
        "data_provenance": {
            "master_source": "DataMeet Indian Railways Open Repository (CC0)",
            "historical_delay_source": "Indian Railway Delay Visualization (adityaazad79 / NTES Crawl)",
            "total_master_trains": t_count,
            "total_master_stations": s_count,
            "total_station_delay_records": delays_count,
            "category_distribution": cats
        }
    }

@app.get("/api/reports/summary")
def get_reports_summary():
    """
    Returns the latest model benchmark comparisons, baseline metrics, and uncertainty calibration summary.
    """
    meta_path = MODELS_DIR / "model_metadata.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Model metadata report not found. Run training first.")
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    return meta
