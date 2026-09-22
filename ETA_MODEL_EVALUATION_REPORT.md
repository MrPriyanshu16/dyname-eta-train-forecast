# Operational ETA Baseline Engine & ML Readiness Evaluation Report (`ETA_MODEL_EVALUATION_REPORT.md`)

**Date of Report**: 2026-09-22  
**Evaluation Scope**: Rajasthan Railway Network Scope (Services touching $\ge 1$ station in Rajasthan)  
**System Architecture**: Layered Timetable + Live Telemetry + Operational Baseline Engine (Stage 1) with Stage 2 Supervised ML Interface  
**Author**: Antigravity Machine Learning Quality & Scientific Governance  

---

## 1. Executive Summary & Scientific Charter

This report documents the architectural verification and operational evaluation of the **Rajasthan Train ETA Prediction System** for SIH Problem Statement 26028.

### Fundamental Scientific Integrity Rules Enforced:
1. **Timetable Data is Not Actual Running Data**: Static timetables define **Scheduled Arrival Time (STA)** and route topology. They cannot be treated as actual arrival ground truth.
2. **Scheduled Arrival (STA) is Not an ML Prediction**: STA is established directly by the official timetable. The prediction objective is estimating the actual expected arrival time (ETA) based on observed operational progress.
3. **Strict Separation of Operational Signals**:
   - $\text{STA}$: Official Timetable Arrival Time.
   - $\text{Current Delay}$: Observed real-time telemetry from Indian Railways NTES.
   - $\text{ETA}$: Output of the Operational Baseline Engine (Baseline B: Current Delay Propagation).
   - $\text{Predicted Delay}$: Mathematically defined as $\text{ETA} - \text{STA}$. Observed current delay is never overwritten with predicted delay.
4. **Suspension of Pseudo-Historical Baselines**:
   - **Baseline C (Historical Section Travel Time)** is marked **`UNAVAILABLE`** because calculating pseudo-traversal times from timetable schedules and calling them "historical actual running times" is scientifically dishonest.
   - **Baseline D (Delay Recovery Model)** is marked **`UNAVAILABLE`** because ungrounded heuristic recovery multipliers (e.g. 0.75 for express trains) must not be presented as learned models without empirical journey data.
5. **Critical Stop Condition (`INSUFFICIENT_GROUND_TRUTH_IN_CURRENT_AUDIT`)**:
   Because 100% of currently audited open datasets are timetables, aggregate averages, or synthetic mocks, supervised regression model training is suspended. No fake journeys, fake GPS tracks, or manufactured accuracy figures are reported.

---

## 2. Dynamic Rajasthan Network Scope

The operational domain is dynamically derived from the verified SQLite master database (`railway_master.db`). Counts represent currently discovered entries rather than rigid hardcoded requirements:

```text
Current Discovered Ingestion:
- 671 Verified Rajasthan Stations
- 882 Verified Trains Touching the Rajasthan Network
- 136,734 Timetable Route Stops
```

### Strict Geographic Hierarchy:
1. **Explicit Station State**: DataMeet records where `state = 'Rajasthan'` (e.g. `BDHL`, `JP`, `JU`, `AII`, `BKN`, `KOTA`).
2. **Verified Administrative District Mapping**: Known Rajasthan district headquarters and junction coordinates.
3. **Coordinate Boundary Polygon**: Core Rajasthan coordinates (24.0°N to 29.5°N, 70.0°E to 77.0°E) to exclude border slivers belonging to Haryana, Punjab, MP, or Gujarat.
4. **Railway Zone / Division**: North Western Railway (NWR) and West Central Railway (WCR Kota division) used strictly as secondary corroborating context (never sole inclusion criteria, as railway divisions cross state lines).

### Canonical Train Identity Verification:
- **Train 22491 / 22492**: Mandore Superfast Express (Jodhpur $\leftrightarrow$ Old Delhi). Verified with 17 canonical stops.
- **Train 14888 / 14887**: Barmer - Rishikesh Express (Barmer $\leftrightarrow$ Rishikesh). Verified with 43 canonical stops spanning 2 calendar days.
- **Non-Rajasthan Train Exclusion**: Trains not touching verified Rajasthan territory (e.g. Train 12138 Punjab Mail) are excluded from the Rajasthan scope.

---

## 3. Operational Baselines Evaluation

| Baseline Identifier | Formal Mathematical Definition | Status | Operational Role | Scientific Limitations & Governance Notes |
| :--- | :--- | :---: | :--- | :--- |
| **Baseline A: Schedule Baseline** | $\text{ETA} = \text{STA}$<br>$\text{predicted\_delay} = 0.0$ | **AVAILABLE** | **Pure Timetable Benchmark Only** | Valid for comparative benchmarking or when train delay is completely unknown. **Prohibited from being presented as operational ETA** for a train already known to have accumulated delay. |
| **Baseline B: Current Delay Propagation** | $\text{ETA} = \text{STA} + \text{current\_delay}$<br>$\text{predicted\_delay} = \text{current\_delay}$ | **ACTIVE OPERATIONAL** | **Primary Active Operational Predictor** | Propagates live section delay across remaining route stops. Fully supports negative/early delays (e.g. -5 min), midnight crossings, and multi-day date rollovers. |
| **Baseline C: Historical Section Travel Time** | $\text{ETA} = T + \sum \text{median\_traversal} + \sum \text{dwell}$ | **UNAVAILABLE** | None | **Suspended in Current State**. Requires genuine empirical section traversal logs (`PRIMARY_GROUND_TRUTH`). Deriving median times from timetable schedules is prohibited. |
| **Baseline D: Delay Recovery Model** | $\text{predicted\_delay} = \text{current\_delay} \times \text{factor}$ | **UNAVAILABLE** | None | **Suspended in Current State**. Arbitrary recovery multipliers cannot be claimed as empirical or learned without real journey training data. |

---

## 4. Multi-Day & Midnight Crossing Arithmetic

For long-distance services spanning multiple calendar days (e.g. Train 14888 Barmer to Rishikesh):

1. **Journey Base Date**: Parsed from live NTES start date or observation date (e.g. `2026-09-22`).
2. **Scheduled Arrival Datetime ($\text{STA}_{\text{dt}}$)**:
   $$\text{STA}_{\text{dt}} = \text{base\_date} + (\text{day\_index} - 1)\text{ days} + \text{scheduled\_time}$$
3. **Estimated Arrival Datetime ($\text{ETA}_{\text{dt}}$)**:
   $$\text{ETA}_{\text{dt}} = \text{STA}_{\text{dt}} + \text{current\_delay}$$
4. **Midnight Rollover Handling**:
   If an evening departure or section delay pushes arrival across $00:00$, the datetime arithmetic increments the calendar day automatically.
   - Example (Train 14888):
     - Barmer (Stop 1, Day 1): STA = 06:00, Date = `Tue, 22 Sep`.
     - Rishikesh (Stop 43, Day 2): STA = 09:54, Date = `Wed, 23 Sep`.
     - With live delay $+20$ min: ETA = 10:14, Date = `Wed, 23 Sep`.

---

## 5. Stage 2 Supervised ML Readiness

Although supervised regression training is currently gated by `INSUFFICIENT_GROUND_TRUTH_IN_CURRENT_AUDIT`, the architecture is pre-engineered for immediate model training upon acquisition of `PRIMARY_GROUND_TRUTH`:

### Pre-Engineered Pipeline Components:
1. **`PointInTimeFeatureExtractor`**:
   Extracts a standardized 15-dimensional point-in-time feature vector from:
   $$\text{observation\_timestamp} + \text{current\_station} + \text{current\_delay} + \text{timetable}$$
   Feature columns:
   - `current_delay_min`
   - `distance_from_origin`
   - `distance_remaining`
   - `journey_progress_ratio`
   - `priority_tier`
   - `section_occupancy_ratio`
   - `headway_km`
   - `weather_fog_index`
   - `is_junction_ahead`
   - `hour_sin`, `hour_cos`
   - `day_of_week`, `is_weekend`
   - `hist_train_avg_delay`, `hist_station_avg_delay`
2. **Leak-Free Prediction Target**:
   $$\text{target} = \text{remaining\_travel\_time\_minutes} = \text{actual\_arrival\_timestamp} - \text{observation\_timestamp}$$
3. **Zero API Redesign Required**:
   When genuine historical runs are ingested, XGBoost / LightGBM regressors can be trained and loaded into `OperationalETABaselineEngine` without modifying backend API routes or frontend components.

---

## 6. Formal Verification Results

### Test Case 1: Train 22491 (Mandore Superfast Express)
- **Live State**: JU (Jodhpur) $\to$ DLI (Old Delhi), current section delay $+20$ min.
- **Results**:
  - `Scheduled Arrival (STA)`: `06:45` (`Thu, 24 Sep`, Day 2).
  - `Estimated Arrival (ETA)`: `07:05` (`Thu, 24 Sep`, Day 2).
  - `Observed Current Delay`: `20.0 min`.
  - `Predicted Delay`: `20.0 min`.
  - `Engine`: `OPERATIONAL_BASELINE_ENGINE (BASELINE_B_CURRENT_DELAY_PROPAGATION)`.

### Test Case 2: Early Running Handling
- **Input**: Train 22491 running $-5.0$ minutes early.
- **Results**:
  - `STA`: `06:45`.
  - `ETA`: `06:40`.
  - `Predicted Delay`: `-5.0 min`.

### Test Case 3: Station Sequence Canonical Verification
- Before calculating ETA, the engine verifies the requested station exists on the canonical route topology. Unlisted stations return a clear validation error rather than calculating nonsensical interpolations.
