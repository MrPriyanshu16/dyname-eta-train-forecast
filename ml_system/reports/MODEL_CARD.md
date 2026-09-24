# Model Card: Rajasthan Train ETA & Delay Propagation System
## Problem Statement 26028 | Ministry of Railways (Smart Automation)

**Model Version**: `2.1.0-rajasthan`  
**Release Date**: September 24, 2026  
**System Status**: `TRAINED_AND_EVALUATED_ON_UNSEEN_TEST_SET`  
**Active Production Model**: `XGBoost Regressor (Active Operational)` (`rajasthan_xgboost_eta_model.joblib`)  
**Active Operational Baseline (Fallback)**: Baseline B: Current Delay Propagation  
**Pure Timetable Benchmark**: Baseline A: Schedule-Based Remaining Time ($\text{ETA} = \text{STA}$)  
**Uncertainty Quantification**: Calibrated LightGBM Quantile Regressors (P10 / P90, 81.5% test coverage)  

---

### 1. System Overview & Layered Architecture

The system provides dynamic, scientifically validated ETA predictions across the Rajasthan railway network through a clean four-tier architecture:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: MASTER CANONICAL TIMETABLE (Verified Railway Database)         │
│ • Canonical train numbers, station sequences, scheduled times (STA/STD) │
│ • Preserved strictly unchanged: scheduled_arrival is never overwritten  │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 2: LIVE OPERATIONAL TELEMETRY (NTES Tracker & RTIS GPS)           │
│ • Real-time train section position, observed delay, timestamp T         │
│ • Ground truth for completed stations: actual_arrival / actual_departure│
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 3: SUPERVISED ML DELAY PROPAGATION ENGINE (Active Operational)    │
│ • Trained XGBoost Regressor fitted on pre-Sep 21, 2024 section data     │
│ • Predicts section delay delta (ΔD = next_arr_delay - dep_delay)        │
│ • Slashes MAE to 5.11 min (25.1% improvement over Baseline B)           │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 4: OPERATIONAL BASELINE FALLBACK ENGINE                           │
│ • Baseline B (Current Delay Propagation) operates as fail-safe fallback │
│ • Baseline A provides pure schedule comparison benchmark                │
│ • Automated failover if features or sensors are offline                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Intended Use & Boundaries
- **Primary Use**: Passenger arrival forecasting, dynamic delay propagation, station platform management, passenger information displays, and decision support for railway operations across Rajasthan.
- **Out-of-Scope Uses**: Automated Train Protection (ATP), safety-critical interlocking, signal switching, or collision avoidance.
- **Authoritative Scope Statement**:
  > *"The system supports all trains present in the verified Rajasthan master dataset."*

---

### 3. Data Inputs & Signal Separation Protocol

The system strictly enforces the separation of four distinct operational signals:

1. `scheduled_arrival`: Official published timetable Scheduled Arrival Time (STA). Preserved immutable.
2. `actual_arrival`: Verified ground truth arrival timestamp recorded for crossed/completed stations.
3. `predicted_delay_minutes`: Model-estimated delay propagation forward from the current observation point.
4. `estimated_arrival`: Estimated Arrival Time ($\text{ETA} = \text{STA} + \text{predicted\_delay}$).

| Input Field | Type | Unit | Telemetry Requirement |
|:---|:---:|:---:|:---|
| `train_number` | String | — | **Mandatory** (5-digit canonical primary key) |
| `observation_timestamp` | String | ISO 8601 | **Preserved Raw** (anchors observation point $T$) |
| `journey_start_date` | String | YYYY-MM-DD | Optional (defaults to live NTES start date or today) |
| `latitude` | Float | Degrees N | **Optional** (`null` when offline; zero fake coordinates) |
| `longitude` | Float | Degrees E | **Optional** (`null` when offline; zero fake coordinates) |
| `speed_kmh` | Float | km/h | **Optional** (`null` when offline; zero fake speeds) |
| `current_delay_min` | Float | Minutes | Live observed accumulated delay (supports early/negative values) |
| `current_station_code` | String | IR Code | Anchors journey progression in canonical route sequence |

---

### 4. Training & Evaluation Methodology

- **Training Split**: September 1–20, 2024 ($N = 59,202$ observations).
- **Validation Split**: September 21–25, 2024 ($N = 15,045$ observations).
- **Held-Out Test Split**: September 26–30, 2024 ($N = 15,124$ observations).
- **Target Formulation**: Section Delay Change:
  $$\Delta D = \text{arrival\_delay}_{i+1} - \text{departure\_delay}_i$$
  Prevents label leakage and autoregressive memorization.

---

### 5. Quantitative Test Set Performance ($N = 15,124$)

| Evaluation Metric | Baseline A (Schedule) | Baseline B (Current Delay) | XGBoost (Active Model) | LightGBM |
|:---|:---:|:---:|:---:|:---:|
| **Mean Absolute Error (MAE)** | 19.87 min | 6.82 min | **5.11 min** (-25.1%) | 5.13 min |
| **Root Mean Squared Error (RMSE)** | 51.33 min | 19.95 min | **16.60 min** (-16.8%) | 16.49 min |
| **Median Absolute Error (MedAE)** | 7.00 min | 2.00 min | **2.12 min** | 2.17 min |
| **$\le$5-Minute Accuracy** | 46.3% | 68.4% | **75.4%** | 75.4% |
| **$\le$10-Minute Accuracy** | 57.1% | 82.1% | **89.6%** | 89.5% |
| **$\le$15-Minute Accuracy** | 64.2% | 88.3% | **94.1%** | 94.0% |
| **$\le$30-Minute Accuracy** | 76.5% | 94.6% | **97.9%** | 97.9% |
| **80% Prediction Interval Coverage** | — | — | **81.5%** ($[\text{P10}, \text{P90}]$) | 81.5% |

---

### 6. Ethical & Governance Considerations
- **No Hallucinated Telemetry**: Speed and GPS coordinates report `null` when live sensors are unreachable.
- **Fairness Across Categories**: Model is evaluated separately across premium (Rajdhani/Vande Bharat), express, and local passenger services, maintaining $>24\%$ error reduction across all tiers.
- **Full Transparency**: Both scheduled timetable STA and model ETA are explicitly presented to users alongside active model metadata and confidence intervals.
