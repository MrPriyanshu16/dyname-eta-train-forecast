# Indian Railways Dynamic Train ETA Forecasting & Route Consistency System
## Comprehensive Data & ML Pipeline Internal Audit (Section 27 Compliance)

**Problem Statement ID**: 26028  
**Organization / Department**: Ministry of Railways, Government of India  
**Scope**: Rajasthan Railway Network Scope (Services touching $\ge 1$ verified station in Rajasthan)  
**Status**: Formal Audit Completed — Corrective Architecture Verified  
**Audit Date**: 2026-09-20  

---

### 1. Canonical Train Identification Audit
- **Canonical Key**: `train_number` (5-digit official Indian Railways numbering) is enforced as the sole canonical primary key throughout database, API, and inference layers.
- **Elimination of Fuzzy/Name-Matching**: In the legacy codebase, searches and lookups relied on partial string heuristics or frontend hardcoded mappings. This caused `14888` to map into a 2-terminal dummy record ("Barmer-Kalka Express") and `22491` to be missing.
- **Authoritative Resolution**:
  - **`22491`**: Authoritatively resolved as **`Mandore Superfast Express`** operating between Jodhpur Junction (`JU`) and Old Delhi (`DLI`) with its 17 verified stops (`JU`, `GOTN`, `MTD`, `DNA`, `MKN`, `KMNC`, `NAC`, `JP`, `DO`, `BKI`, `AWR`, `KRH`, `RE`, `PTRD`, `GHH`, `GGN`, `DLI`), departing at 20:30 and arriving at 06:45 (620.0 km).
  - **`22492`**: Authoritatively resolved as the reverse service **`Mandore Superfast Express`** (`DLI` $\to$ `JU`), departing at 21:20 and arriving at 07:30 with 17 verified reverse stops.
  - **`14888`**: Verified as **`Barmer - Rishikesh Express`** (`BME` $\to$ `RKSH`), with all 43 verified stops spanning Rajasthan, Haryana, Punjab, and Uttarakhand.
  - **Exclusion of Non-Rajasthan Trains**: Non-Rajasthan services (e.g. `12301` Howrah Rajdhani, which runs Howrah to New Delhi via Bihar and UP) are strictly excluded from the Rajasthan scope.

---

### 2. Geographic Scope & Rajasthan Boundary Definition
- **Dynamic Derivation**: The system scope is defined dynamically: *"All verified train services whose route contains at least one verified railway station located in Rajasthan."*
- **Hierarchical Station Resolution**: Stations are classified using a 4-tier hierarchy:
  1. *Explicit State*: DataMeet records with `state = 'Rajasthan'` (451 stations).
  2. *Verified Cities & Junctions*: Stations with blank state entries in DataMeet that match verified Rajasthan districts, tehsils, and junctions (e.g. `JP` Jaipur, `JU` Jodhpur, `KOTA` Kota, `BKN` Bikaner, `BKI` Bandikui, `BTE` Bharatpur, `SWM` Sawai Madhopur, `FL` Phulera, `DNA` Degana, `MTD` Merta Road, `GOTN` Gotan) located within verified Rajasthan geographic coordinates.
  3. *Administrative Boundary Exclusion*: Crude bounding boxes ($23.0^\circ-30.5^\circ\text{ N}, 69.5^\circ-78.5^\circ\text{ E}$) were audited and found to incorrectly catch stations in Gujarat (e.g. `SIOB` Samakhiali Jn), Haryana (e.g. `PNP` Panipat Jn, `RE` Rewari), and Delhi (`NDAZ`, `ANDI`, `BHD`, `NUR`). These non-Rajasthan stations were strictly excluded.
  4. *Flagged Ambiguous Stations*: Border sliver stations (422 stations) outside verified Rajasthan territory were excluded.
- **Resulting Network Scope**:
  - **671** Authoritative Rajasthan Stations.
  - **882** Active Coaching Trains touching at least one Rajasthan station.

---

### 3. Data Source Provenance & Licensing
- **Timetable & Master Data**:
  - *Source*: DataMeet Open Indian Railways Repository (`trains.json`, `stations.json`).
  - *License*: Creative Commons Attribution-ShareAlike (CC-BY-SA 2.5) / ODbL.
  - *Classification*: `MASTER_DATA`.
  - *Verification*: Cross-referenced against official Indian Railways published schedules.
- **Historical Delay Records**:
  - *Source*: `Master_Monthly_Delay.csv` and `Master_Weekly_Delay.csv` (133,481 records derived from adityaazad79 / open NTES delay crawl).
  - *Classification*: `AUXILIARY_HISTORICAL_STATISTICS`.
  - *Limitation*: Contains monthly and weekly mean delay averages per station; does NOT contain individual timestamped train runs or point-in-time trajectory ground truth.
- **External Research Repositories Investigated**:
  - *`train-delay-estimation` by R-Gaurav (IEEE ITSC 2018)*: Audited. The repository code trains Markov/Ridge models on 52 trains, but raw 2-year `.tar` data (`Train_Delay_Estimation_Data_March_2016_February_2018.tar`) is restricted and requires a manual Google Form / email application to researchers (`my.better.rail@gmail.com`).
  - *`railpull` (shwetankg07)*: Audited. Tooling for crawling current NTES timetable schedules; does not provide historical station-level run timestamps.

---

### 4. Timetable vs Ground Truth Separation
- **Fundamental Principle**: Timetable data ($\text{STA}/\text{STD}$) represents the static scheduled intention of Indian Railways, NOT observed reality.
- **Strict Classification**:
  - Aggregate statistics (`Master_Monthly_Delay.csv`) are classified as `AUXILIARY_HISTORICAL_STATISTICS`.
  - Under no circumstances are monthly averages converted into synthetic timestamped "runs" with manufactured journey dates or fabricated arrival times.
- **Policy on Missing Ground Truth**:
  - If no genuine station-level timestamped trajectory dataset is legally available, the system reports `MODEL_STATUS = INSUFFICIENT_GROUND_TRUTH`.
  - The system serves transparent, mathematically sound domain baselines rather than pretending synthetic model weights represent real-world ML.

---

### 5. Point-in-Time Prediction & Leakage Prevention
- **Cutoff Formulation**: All features for prediction at station $S_i$ or timestamp $T$ must be constructed strictly using information available at $t \le T$.
- **Target Formulation**:
  $$\text{target\_remaining\_time} = \text{actual\_arrival\_destination} - T$$
- **Leakage Prevention**:
  - Rolling/expanding delay statistics must only aggregate journeys completed strictly prior to $T$.
  - Future section delays, downstream signal stops, or actual arrival times are never present in the feature vector.
  - Automated tests in `ml_system/tests/test_leakage_prevention.py` enforce this invariant.

---

### 6. Missing Telemetry & Honesty Audit
- **Previous Vulnerabilities Identified**:
  - Defaulting missing GPS coordinates to Tundla Junction (`lat: 27.2081, lon: 78.2393`) in Uttar Pradesh.
  - Defaulting missing speed to `85.0 km/h` or `110.0 km/h`.
- **Enforced Correction**:
  - When real locomotive RTIS / GPS sensors are absent, the system explicitly returns:
    ```json
    {
      "telemetry": {
        "telemetry_status": "UNAVAILABLE",
        "latitude": null,
        "longitude": null,
        "speed_kmh": null
      }
    }
    ```
  - Zero fabricated coordinates or synthetic speeds are generated or served.
  - The frontend UI displays `Telemetry: Offline (Timetable Mode)` and disables fake speed dials.

---

### 7. Corridor Fallback Removal
- **Audit Finding**: In `ml_system/config/config.py` and `ml_system/src/inference/pipeline.py`, a legacy hardcoded trunk corridor existed: New Delhi (`NDLS`) to Kanpur Central (`CNB`) with 10 UP stations. If a Rajasthan train fell through, it was projected onto UP tracks!
- **Correction**:
  - Completely removed `CORRIDOR_STATIONS`, `CORRIDOR_SECTIONS`, and `CORRIDOR_TRAINS` from inference logic.
  - All train routes and itineraries are dynamically resolved from `train_routes` in `railway_master.db`.

---

### 8. Operational Baseline Models Formulation
To provide measurable value and benchmark any future ML models, four operational domain baselines are implemented:
1. **Baseline 1 (Schedule-Based Remaining Time)**:
   $$\text{ETA}_{B1} = \text{STA}_{\text{dest}}$$
   $$\text{Remaining Time}_{B1} = \max(0, \text{STA}_{\text{dest}} - T)$$
2. **Baseline 2 (Current Delay Propagation — NTES Standard)**:
   $$\text{ETA}_{B2} = \text{STA}_{\text{dest}} + \text{Delay}_{\text{current}}$$
3. **Baseline 3 (Historical Section Median)**:
   $$\text{ETA}_{B3} = T + \sum_{k \in \text{remaining sections}} \text{Median\_Run\_Time}_k$$
4. **Baseline 4 (Delay Recovery Model)**:
   $$\text{ETA}_{B4} = \text{STA}_{\text{dest}} + \text{Delay}_{\text{current}} - \text{Expected\_Recovery}(\text{tier}, \text{dist})$$
   (Accounting for commercial priority: Rajdhani/Vande Bharat recover up to 20–25% of delay; lower-priority passenger trains lose additional time).

---

### 9. ML Model Architecture & Uncertainty Calibration
- **Model Status**: `INSUFFICIENT_GROUND_TRUTH` (honest declaration).
- **Heuristic Uncertainty Bounds**:
  - Heuristic 80%-target uncertainty bounds ($P_{10}$ to $P_{90}$) calculated from empirical historical section delay variance by priority tier.
  - Uncalibrated P10/P90-style heuristic bounds; Empirical Coverage Probability (ECP) is NOT reported because point-in-time actuals do not exist in open datasets.
  - Monotonicity enforced: $P_{10} \le \text{ETA} \le P_{90}$ for all queries.

---

### 10. Sliced Validation & Generalization Testing
- Slicing protocol designed across:
  - **Prediction Horizons**: Next Station, $\le 30$ min, $30-60$ min, $1-2$ hr, $2-3$ hr, $3+$ hr, Destination.
  - **Coaching Categories**: Rajdhani, Vande Bharat, Superfast, Express, Mail, Passenger.
  - **Generalization Categories**:
    - Seen Train / Seen Route
    - Unseen Train / Seen Route (Case Study: Mandore Superfast Express `22491`)
    - Slices with $< 30$ observations are explicitly flagged as `INSUFFICIENT_SAMPLE`.

---

### 11. Punctuality & Evaluation Metric Standardization
- **Metric Definitions**:
  - $\text{MAE} = \frac{1}{N}\sum |y_i - \hat{y}_i|$
  - $\text{RMSE} = \sqrt{\frac{1}{N}\sum (y_i - \hat{y}_i)^2}$
  - $\text{MedAE} = \text{median}(|y_i - \hat{y}_i|)$
  - Punctuality tolerance thresholds: % predictions within $\pm 5, \pm 10, \pm 15, \pm 30$ minutes.
- **Strict 24-Hour Time Format**: All timestamps throughout database, API responses, reports, and UI strictly adhere to `HH:MM` 24-hour format (e.g. `06:00`, `20:30`, `23:45`).

---

### 12. Operational Limitations & Deployment Readiness
- **Official System Scope Statement**:
  > *"The system supports all trains present in the verified Rajasthan master dataset."*
- **Track Distinguishability Limitation**: Ordinary GPS / cellular positioning cannot distinguish adjacent parallel tracks in multi-track corridors. The system reports `Route Status: CONSISTENT` or `TIMETABLE_ESTIMATED`.
- **Telemetry Dependency**: In absence of an authorized live RTIS locomotive feed, the system relies on timetable progression and auxiliary delay statistics with complete transparency.
