# Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains
### Smart India Hackathon (Problem Statement ID: 26028)
**Ministry of Railways | Smart Automation**

**Project Authors:**
- Priyanshu Prajapat (23EJICS125)
- Keshav Solanki (23EJICS075)

**Project Guides:**
- Ms. Harshita Khangarot
- Mr. Dushyant Sharma

---

## 1. Project Overview

Accurate forecasting of the Expected Time of Arrival (ETA) for coaching trains is critical for passenger satisfaction and operational efficiency in Indian Railways. 

The existing production system (**NTES** - National Train Enquiry System at `enquiry.indianrail.gov.in`) uses static timetable heuristics:
$$\text{ETA}_{\text{NTES}} = \text{Scheduled Arrival} + \text{Current Delay}$$

This static method completely fails to account for:
- Track section congestion and line capacity bottlenecks.
- Preceding train headway and cautionary yellow/red signals.
- Train priority clearance rules (e.g. Vande Bharat and Rajdhani getting priority over standard Express trains).
- Severe weather events (e.g. North Indian winter fog/sandstorms restricting speeds to $60\text{ km/h}$).
- Torrential monsoon downpours and track waterlogging (restricting speeds to $30\text{ km/h}$).
- Extreme ambient heatwaves ($>42^\circ\text{C}$) causing continuous welded rail (CWR) buckling cautions.
- Temporary Speed Restrictions (TSR Caution Orders for track/bridge work).
- Downstream junction conflicts and platform clashes.
- Peak hour timetable bunching and intermediate station passenger boarding crowd surges.

This project delivers an **intelligent, data-driven dynamic ETA forecasting platform** tested and deployed on high-density trunk rail corridors.

---

## 2. Benchmark Results (Scientific Proof)

Trained on 9,000 corridor trip runs across 12 operational conditions and validated on 1,800 test trips:

| Evaluation Metric | Static NTES Baseline | Dynamic ML Model (Our System) | Improvement |
|---|---|---|---|
| **Mean Absolute Error (MAE)** | **73.60 minutes** | **6.34 minutes** | **91.4% Error Reduction** 🎯 |
| **Root Mean Squared Error (RMSE)** | **97.14 minutes** | **9.04 minutes** | **90.7% Outlier Reduction** |
| **Model Explained Variance ($R^2$)** | -0.852 | **0.978** | High Precision |

### Primary Drivers of Rail Delays (12 Evaluated Operational Conditions):
1. **Distance Remaining to Station:** 26.34%
2. **Monsoon Rain & Track Waterlogging:** 17.39%
3. **Track Section Congestion Ratio:** 13.67%
4. **Weather Visibility / Fog Index:** 10.12%
5. **Temporary Speed Restriction (TSR Caution):** 9.91%
6. **Current Accumulated Delay:** 8.38%
7. **Ambient Temperature / Rail Buckling Alert:** 5.82%
8. **Train Priority Precedence Tier:** 5.20%
9. **Junction Bottleneck Ahead:** 1.64%
10. **Preceding Train Headway Spacing:** 1.29%
11. **Intermediate Station Dwell Delay:** 0.14%
12. **Peak Traffic Hour Bunching:** 0.10%

---

## 3. System Architecture & Components

```
                          ┌──────────────────────────────────────────────┐
                          │    Corridor Network (NDLS-CNB 440 km)        │
                          └──────────────────────┬───────────────────────┘
                                                 │
                  ┌──────────────────────────────┴──────────────────────────────┐
                  ▼                                                             ▼
     ┌────────────────────────────┐                                ┌────────────────────────────┐
     │   AI & ML Engine (ml/)     │                                │  Backend Engine (backend/) │
     ├────────────────────────────┤                                ├────────────────────────────┤
     │ • train_model.py           │                                │ • main.py (FastAPI)        │
     │ • corridor_data.py         │ ──── exports model.pkl ──────► │ • simulator.py (Telemetry) │
     │ • evaluation_metrics.json  │                                │ • ml_predictor.py (Inference)
     └────────────────────────────┘                                └─────────────┬──────────────┘
                                                                                 │
                                                      REST APIs & WebSockets ────┤
                                                                                 ▼
                                                                   ┌────────────────────────────┐
                                                                   │   Frontend UI (frontend/)  │
                                                                   ├────────────────────────────┤
                                                                   │ • React 19 + Vite          │
                                                                   │ • Tailwind CSS Theme       │
                                                                   │ • Leaflet Geospatial Map   │
                                                                   │ • 4 Interactive Views      │
                                                                   └────────────────────────────┘
```

---

## 4. Key Features & Screens

1. **👤 Passenger Portal:**
   - Real-time train search (by number or name).
   - Dynamic ETA comparison: Scheduled Timetable vs. NTES Baseline vs. **Dynamic AI ETA** (with $90\%$ confidence range).
   - **Explainable AI (XAI) Attribution:** Informs passengers *why* their train is delayed (e.g., *"Severe fog visibility restriction (MPS reduced to 60 km/h)"*).
2. **🚉 Control Room Hub (Station Master View):**
   - Section congestion heatmap across all 6 block sections.
   - **Platform Allocation Advisor:** Real-time detection of platform schedule clashes at Kanpur Central with 1-click auto-reassignment.
   - Signaling priority matrix (Tier 1 Vande Bharat down to Tier 4 Mail/Express).
3. **🛠️ The "What-If" Disruption Sandbox (Viva Demo Tool):**
   - **`[ 🌪️ Desert Sandstorm ]`:** Simulates low visibility & caps speed to $60\text{ km/h}$.
   - **`[ 🔴 Signal Halt at Phulera ]`:** Simulates interlocking red aspect and cascading delay.
   - **`[ 🚧 Track Maintenance Block ]`:** Simulates single-line working & capacity halving.
   - **`[ 🌧️ Monsoon Rain & Waterlogging ]`:** Simulates submerged track caution ($30\text{ km/h}$).
   - **`[ ☀️ Extreme Heatwave Alert ]`:** Simulates rail temperature $>45^\circ\text{C}$ expansion alert ($50\text{ km/h}$).
   - **`[ ⚠️ TSR Caution Order ]`:** Simulates Temporary Speed Restriction ($40\text{ km/h}$) for track works.
   - **`[ Reset All Disruptions ]`:** Instantly restores normal operation.
4. **📊 Model Analytics & Viva Tab:**
   - Accuracy cards, error distribution histogram, and feature importance bar charts ready for inclusion in project reports.
5. **ℹ️ About & Architecture Tab:**
   - Full documentation of SIH 26028 problem background, student authors, and guides.

---

## 5. How to Run the Project Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup on a New System
After cloning the repository:
```bash
# 1. Install Python ML & Backend dependencies
pip install -r requirements.txt

# 2. Install Frontend dependencies
cd frontend
npm install
cd ..
```

### 1-Click Launch (Windows)
1. **Start Backend Server:** Double-click `run_backend.bat` (Starts on `http://localhost:8000`).
2. **Start Frontend Dashboard:** Double-click `run_frontend.bat` (Starts on `http://localhost:5173`).
3. Open `http://localhost:5173` in your browser.

### Manual Terminal Commands
**Terminal 1 (Backend):**
```bash
python -m uvicorn backend.main:app --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev -- --host
```

**To Retrain the Machine Learning Model:**
```bash
python ml/train_model.py
```

