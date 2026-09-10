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
- Track section congestion and bottleneck delays.
- Preceding train headway and cautionary yellow/red signals.
- Train priority clearance rules (e.g. Vande Bharat and Rajdhani getting priority over standard Express trains).
- Severe weather events (e.g. North Indian winter fog restricting speeds to $60\text{ km/h}$).
- Downstream junction conflicts and platform clashes.

This project delivers an **intelligent, data-driven dynamic ETA forecasting platform** tested and deployed on the high-density **New Delhi (NDLS) to Kanpur Central (CNB)** trunk corridor ($440\text{ km}$).

---

## 2. Benchmark Results (Scientific Proof)

Trained on 8,000 corridor trip runs and validated on 1,600 test trips:

| Evaluation Metric | Static NTES Baseline | Dynamic ML Model (Our System) | Improvement |
|---|---|---|---|
| **Mean Absolute Error (MAE)** | **50.57 minutes** | **4.65 minutes** | **90.8% Error Reduction** 🎯 |
| **Root Mean Squared Error (RMSE)** | **68.26 minutes** | **6.16 minutes** | **91.0% Outlier Reduction** |
| **Model Explained Variance ($R^2$)** | -0.819 | **0.985** | High Precision |

### Primary Drivers of Rail Delays (Feature Importance):
1. **Track Section Congestion Ratio:** 25.78%
2. **Distance Remaining to Station:** 20.97%
3. **Weather Visibility / Fog Index:** 20.57%
4. **Current Accumulated Delay:** 13.94%
5. **Train Priority Tier:** 11.68%
6. **Junction Bottleneck Ahead:** 4.09%
7. **Preceding Train Headway:** 2.97%

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
   - **`[ Inject Fog ]`:** Dynamically drops corridor speed limit to $60\text{ km/h}$.
   - **`[ Signal Failure ]`:** Simulates red aspect halt and cascading delay.
   - **`[ Track Maintenance Block ]`:** Simulates single-line restriction.
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

