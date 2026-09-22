# Model Card: Rajasthan Train ETA Prediction System
## Problem Statement 26028 | Ministry of Railways (Smart Automation)

**Version**: 2.1.0 (Rajasthan Network Scope)  
**Release Date**: 2026-09-22  
**System Status**: `INSUFFICIENT_GROUND_TRUTH_IN_CURRENT_AUDIT` (Supervised ML Gated)  
**Active Production Engine**: Operational ETA Baseline Engine (Baseline B: Current Delay Propagation Active; Baseline A: Timetable Benchmark; Baselines C & D: UNAVAILABLE pending empirical actual movement data)  
**Stage 2 Readiness**: Fully pre-engineered with `PointInTimeFeatureExtractor` ready for immediate XGBoost/LightGBM training upon acquisition of `PRIMARY_GROUND_TRUTH`.

---

### 1. System Overview & Layered Architecture

The system provides dynamic, leak-free ETA predictions across the Rajasthan railway network through a scientifically grounded multi-layer architecture:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: MASTER TIMETABLE (Verified DataMeet / IR Data)                 │
│ • Canonical train numbers, station sequences, scheduled times (STA/STD) │
│ • Powers: Scheduled Arrival Time (STA) and Schedule Benchmark           │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 2: LIVE OPERATIONAL STATE (Live NTES Tracker Telemetry)           │
│ • Real-time locomotive section position, observed delay, timestamp T    │
│ • Powers: Current Delay and live journey context                        │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 3: OPERATIONAL ETA BASELINE ENGINE (Active Forecasting Engine)   │
│ • Baseline A: Schedule-Based Remaining Time (Pure Timetable Benchmark)  │
│ • Baseline B: Current Delay Propagation (ACTIVE OPERATIONAL PREDICTOR)  │
│ • Baseline C: Historical Section Median (UNAVAILABLE in Current Audit)  │
│ • Baseline D: Delay Recovery Model (UNAVAILABLE in Current Audit)       │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 4: STAGE 2 SUPERVISED ML PIPELINE (Pre-Engineered & Ingress-Ready)│
│ • PointInTimeFeatureExtractor constructs 15-dim leak-free feature vector│
│ • GATED: Supervised regression suspended until verified                 │
│   PRIMARY_GROUND_TRUTH (point-in-time actual movement logs) is ingested │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Intended Use & Boundaries
- **Primary Use**: Passenger enquiry displays, operational decision-support dashboards, station manager boards, and journey planning tools across the Rajasthan railway network.
- **Out-of-Scope Uses**: Automatic train protection (ATP), signal interlocking, physical track circuit switching, or safety-critical collision avoidance.
- **Authoritative Scope Statement**:
  > *"The system supports all trains present in the verified Rajasthan master dataset."*

---

### 3. Data Inputs & Telemetry Protocol

| Input Field | Type | Unit | Telemetry Requirement |
|:---|:---:|:---:|:---|
| `train_number` | String | — | **Mandatory** (5-digit canonical primary key) |
| `observation_timestamp` | String | ISO 8601 | **Preserved Raw** (anchors observation point $T$) |
| `journey_start_date` | String | YYYY-MM-DD | Optional (defaults to live NTES start date or today) |
| `latitude` | Float | Degrees N | **Optional** (reports `null` when offline; zero fake coordinates) |
| `longitude` | Float | Degrees E | **Optional** (reports `null` when offline; zero fake coordinates) |
| `speed_kmh` | Float | km/h | **Optional** (reports `null` when offline; zero fake speeds) |
| `current_delay_min` | Float | Minutes | Live observed accumulated delay (supports early/negative values) |
| `current_station_code` | String | IR Code | Anchors journey progression in canonical route sequence |

---

### 4. Output Schema & Signal Separation

The system maintains strict mathematical separation between timetable, observed state, and prediction:

- **`scheduled_arrival_sta`**: Scheduled arrival time from verified timetable (STA).
- **`observed_current_delay_minutes`**: Live observed accumulated delay from NTES.
- **`estimated_arrival_eta`**: Calculated expected arrival time from Baseline B ($\text{STA} + \text{current\_delay}$).
- **`predicted_delay_minutes`**: Mathematically defined as $\text{ETA} - \text{STA}$.
- **`observation_timestamp`**: Preserved timestamp anchoring prediction point $T$.
- **`telemetry`**: Honest telemetry status (`AUTHENTIC_NTES_TELEMETRY` or `TIMETABLE_OFFLINE`).
- **`stage_2_ml_interface`**: Point-in-time feature vector prepared for future supervised regressors.

---

### 5. Quantitative Performance Statement

In strict adherence to academic and scientific honesty:
- **No speculative or synthetic accuracy figures (e.g. MAE, RMSE) are reported.**
- Quantitative error metrics require unseen test sets composed of genuine historical actual arrival timestamps. None exist in audited open datasets.
- The project explicitly refuses to manufacture synthetic arrival observations to claim artificial accuracy.
- When an authorized railway archive containing recorded arrival timestamps is connected, the pre-engineered evaluation pipeline can immediately compute real-world errors.

---

### 6. Scope & Ethical Commitments
- **Zero Fabricated Observations**: No random delays or fake timestamps are added to static timetables.
- **Honest Telemetry Policy**: When live sensors are offline, coordinates and speed are explicitly reported as `null` rather than using fabricated fallbacks.
- **Unambiguous Ground Truth Limitations**: The system transparently informs users and evaluators that predictions are derived from verified operational delay propagation pending genuine historical movement data.
