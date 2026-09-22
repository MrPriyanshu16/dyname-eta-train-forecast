# Historical ETA Data & External Candidates Audit (`HISTORICAL_ETA_DATA_AUDIT.md`)

**Date of Audit**: 2026-09-22  
**Auditor**: Antigravity Machine Learning Quality & Scientific Governance  
**Scope**: Systematic evaluation of investigated external railway datasets, repository archives, and candidate ground-truth sources.

---

## 1. Executive Summary

To determine whether supervised machine learning for train ETA prediction can be trained on real-world historical observations, an extensive audit was performed across candidate datasets from Kaggle, GitHub, data.gov.in, and open railway research repositories.

### Overall Finding
**No qualified historical ground truth was found in the current audit.**
- Available open datasets fall into either:
  1. **Timetable / Master Schedules** (e.g. `rohan26x`, data.gov.in, DataMeet) — contain planned timings, zero actual running observations.
  2. **Station / Monthly Delay Aggregates** (e.g. `adityaazad79`, DA323) — contain average delays across months, zero date-specific journey runs or observation timestamps.
  3. **Synthetic / Mock Datasets** (e.g. `kamaleshpanda/train-delays`) — synthetically generated using random distributions or simulation; strictly prohibited from use as ground truth.

In accordance with scientific standards, the current system activates:
```text
MODEL_STATUS = INSUFFICIENT_GROUND_TRUTH_IN_CURRENT_AUDIT
```
The architecture operates on the **Operational ETA Baseline Engine** while keeping the **Stage 2 Supervised ML pipeline pre-engineered and ready for ingress** as soon as genuine historical movement data is acquired.

---

## 2. Formal Ground Truth Qualification Criteria

To prevent fake data contamination, a dataset is admitted into the supervised training pipeline if and only if it satisfies all of the following non-negotiable criteria:

```text
A dataset qualifies as PRIMARY_GROUND_TRUTH if and only if it contains,
for individual real-world train journeys:

1. Canonical train number (e.g., 22491, 14888)
2. Journey / service start date (e.g., 2026-09-21)
3. Station sequence number along the physical route
4. Station identifier (official IR station code and name)
5. Scheduled arrival and scheduled departure timestamps
6. Actual arrival and actual departure timestamps
7. Reconstructable observation timestamp T without using future journey information
8. Repeated observations across multiple calendar days/runs for each train
```

Datasets undergoing evaluation are marked `CANDIDATE_GROUND_TRUTH`. Datasets lacking actual timestamps or containing synthetic entries are strictly rejected.

---

## 3. Detailed Audit of External Candidate Datasets

| Dataset Identifier | Platform / Source | Author / Publisher | License | Rows | Actual Arrival? | Journey Date? | Observation Timestamp? | Primary Content | Classification | Verdict |
| :--- | :--- | :--- | :--- | ---: | :---: | :---: | :---: | :--- | :--- | :--- |
| `rohan26x/indian-express-train-dataset` | Kaggle | Rohan Patel | Open / Community | ~350,000 stops | **No** | **No** | **No** | Train numbers, routes, scheduled arrives, departs, distance, journey days | `MASTER_TIMETABLE` | **Excluded for ML Training**. Used only for timetable enrichment. |
| `adityaazad79/Indian-Railway-Delay-Visualization` | GitHub | Aditya Azad | MIT | ~133,000 records | **No** | **No** | **No** | Monthly/weekly average delay per train per station (`Master_Monthly_Delay.csv`) | `AUXILIARY_HISTORICAL_STATISTICS` | **Excluded for ML Training**. Aggregate stats only. |
| `kamaleshpanda/train-delays` | Kaggle | Kamalesh Panda | Open | ~50,000 | Simulated | Simulated | Simulated | `Train_Name`, `Route`, `Scheduled_Arrival`, `Actual_Arrival`, `Delay_Minutes` | `UNUSABLE_FOR_ETA_TRAINING` (Synthetic) | **Excluded**. Explicitly documented on Kaggle as synthetic data. |
| Ministry of Railways Timetables | data.gov.in | Government of India | Open Data (GODL) | ~180,000 stops | **No** | **No** | **No** | Official Indian Railways schedules (`isl_wise_train_detail`) | `MASTER_TIMETABLE` | **Excluded for ML Training**. Authoritative timetable reference only. |
| DataMeet Indian Railways | GitHub / DataMeet | Sanjay Bhangar & Sajjad Anwar | CC0 | 417,080 stops | **No** | **No** | **No** | National stations, train routes, schedules in GeoJSON/JSON format | `MASTER_TIMETABLE` / `ROUTE_STATION_REFERENCE` | **Excluded for ML Training**. Core spatial & schedule reference. |
| DA323 Railway Delay Dataset | Academic / GitHub | DA323 Course Archive | Academic / Open | ~25,000 | **No** | **No** | **No** | Station-level punctuality summaries and zonal averages | `AUXILIARY_HISTORICAL_STATISTICS` | **Excluded for ML Training**. No journey timestamps. |

---

## 4. Deep-Dive Evaluations

### 4.1 Kaggle: `rohan26x/indian-express-train-dataset`
- **Investigation**: Inspected Kaggle schema and documentation.
- **Fields**: `trainNumber`, `trainName`, `trainRoute` (`stationName`, `stationCode`, `arrives`, `departs`, `distance`, `day`).
- **Findings**:
  - The dataset provides a clean JSON representation of official IR schedules.
  - It does **not** contain telemetry, actual arrival times, delays, or dates of operation.
  - Feeding `arrives` and `departs` into an ML model would simply train a regressor to memorize the timetable.
- **Classification**: `MASTER_TIMETABLE`.

---

### 4.2 GitHub: `adityaazad79/Indian-Railway-Delay-Visualization`
- **Investigation**: Inspected repository files (`Master_Monthly_Delay.csv`, `Master_Weekly_Delay.csv`, `Local_Monthly_Delay.csv`).
- **Fields**: `Train_No`, `Train_Name`, `Station_Name`, `Station_Code`, `Delay`, `Zone`.
- **Findings**:
  - Contains monthly aggregated delay values. For example, a train has `Delay: 67` at a specific station, representing the average delay across an entire month.
  - It does **not** contain specific dates, actual timestamps, or individual journey trajectories.
  - Converting these monthly averages into point-in-time train runs is scientifically fraudulent.
- **Classification**: `AUXILIARY_HISTORICAL_STATISTICS`.

---

### 4.3 Kaggle: `kamaleshpanda/train-delays` (Actual-vs-Scheduled Candidate)
- **Investigation**: Provenance and consistency audit of publicly available actual-vs-scheduled delay datasets.
- **Fields**: `Train_Name`, `Route`, `Scheduled_Arrival`, `Actual_Arrival`, `Delay_Minutes`, `Date`.
- **Findings**:
  - The publisher's documentation explicitly designates this as a **synthetic dataset** designed for SQL/Tableau student practice.
  - Analysis of delays shows uniform and normal synthetic random distributions without real-world dispatching physics, signaling constraints, or realistic corridor propagation.
  - Training on synthetic data violates Section 1.2, 1.4, and 8 of the project charter.
- **Classification**: `UNUSABLE_FOR_ETA_TRAINING` (Synthetic).

---

### 4.4 data.gov.in: Ministry of Railways Datasets
- **Investigation**: Searched data.gov.in for historical GPS or actual arrival logs.
- **Findings**:
  - The Ministry of Railways publishes timetables, passenger amenities, freight volumes, and station lists.
  - Indian Railways **does not publicly publish open historical point-in-time locomotive event logs** (COA / FOIS movement logs are internal operational systems; NTES exposes only real-time ephemeral queries).
  - Therefore, data.gov.in serves as a premier reference for timetable topology, but cannot provide historical training targets.
- **Classification**: `MASTER_TIMETABLE`.

---

## 5. Architectural Decision & Future Ingress Pathway

Because no qualified `PRIMARY_GROUND_TRUTH` was discovered in the current audit:

1. **Active Engine**: The system implements the **Operational ETA Baseline Engine**:
   - **Baseline A (Schedule Benchmark)**: $\text{ETA} = \text{STA}$ (tested as nominal timetable benchmark).
   - **Baseline B (Current Delay Propagation)**: $\text{ETA} = \text{STA} + \text{current\_delay}$ (active operational prediction incorporating live NTES section delay).
   - **Baseline C & D**: Explicitly flagged **`UNAVAILABLE`** until empirical traversal and recovery data are obtained.
2. **Scientific Honesty**: The system states:
   > *"No qualified historical ground truth found in current audit. Supervised regression training is suspended to protect scientific integrity. Live ETA is served via the Operational Delay Propagation Baseline Engine."*
3. **Stage 2 ML Readiness**:
   - The feature extraction pipeline (`PointInTimeFeatureExtractor`) is fully constructed.
   - If an official railway research archive or scraping repository meeting the `PRIMARY_GROUND_TRUTH` criteria is ingested into `datasets/`, the pipeline will automatically trigger feature extraction, chronological train/validation/test splitting, and supervised model training (XGBoost / LightGBM) without requiring any architectural changes.
