# Feature Store Readiness Report: Section Training Observations

**Project**: SIH 26028 — Dynamic Train ETA & Delay Propagation System (Rajasthan Scope)  
**Date of Audit**: September 24, 2026  
**Auditor**: Antigravity AI Engineering Team  
**Artifact Path**: `ml_system/reports/FEATURE_STORE_READINESS_REPORT.md`  

---

## 1. Overview and Artifact Specification

To bridge the gap between raw historical records and production machine learning models, a standardized, normalized tabular feature store has been constructed:
- **Primary Feature Store File**: `Datasets/rajasthan/rajasthan_section_training_observations.csv`
- **Builder Implementation**: `ml_system/src/data/build_section_feature_store.py`
- **Validation Test Suite**: `ml_system/tests/test_section_feature_store.py`
- **Record Count**: **89,371** rows
- **File Size**: **19.2 MB**
- **Completeness**: **0% missing values** across all required feature columns

---

## 2. Feature Schema and Attribute Dictionary

The feature store contains 40 attributes organized into strictly isolated temporal categories:

### A. Journey & Topological Identifiers
| Field Name | Data Type | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `journey_id` | String | `17020_2024-09-07` | Composite primary key `(train_number + '_' + journey_date)` |
| `train_number` | String | `17020` | Standard 5-digit Indian Railways train number |
| `train_name` | String | `Hyb Hsr Express` | Official train designation |
| `journey_date` | Date (ISO) | `2024-09-07` | Calendar run date (YYYY-MM-DD) |
| `day_of_week` | Integer (0..6) | `5` | Day index (0=Monday, 6=Sunday) |
| `is_weekend` | Binary (0/1) | `1` | Weekend flag (Saturday/Sunday) |
| `from_station_code`| String | `NBH` | Origin station code of the section |
| `from_station_name`| String | `Nimbahera` | Origin station name |
| `from_sequence` | Integer | `29` | Route stop sequence of origin station |
| `to_station_code` | String | `COR` | Next downstream arrival station code |
| `to_station_name` | String | `Chittaurgarh` | Next downstream arrival station name |
| `to_sequence` | Integer | `30` | Route stop sequence of destination station |
| `is_consecutive_stops`| Binary (0/1) | `1` | 1 if `to_sequence == from_sequence + 1`, else 0 |
| `is_from_in_rajasthan`| Binary (0/1) | `1` | 1 if origin station is within Rajasthan |
| `is_to_in_rajasthan` | Binary (0/1) | `1` | 1 if next station is within Rajasthan |
| `scope_tag` | Categorical | `intra_rj` | `intra_rj`, `enters_rj`, `exits_rj`, `external` |

### B. Observed State Features at Timestamp $T$ (Departure from Origin Station)
All features below represent observations **strictly completed at or before** the train leaves `from_station`:
| Field Name | Data Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `from_sched_arr_min` | Integer | Minutes of day | Scheduled arrival time in minutes from midnight (0..1439) |
| `from_act_arr_min` | Integer | Minutes of day | Actual observed arrival time at origin station |
| `from_arr_delay_min` | Float | Minutes | Arrival delay at origin station |
| `from_sched_dep_min` | Integer | Minutes of day | Scheduled departure time from origin station |
| `from_act_dep_min` | Integer | Minutes of day | Actual observed departure time (Prediction instant $T$) |
| `from_dep_delay_min` | Float | Minutes | Departure delay leaving origin station (**Primary initial state**) |
| `from_sched_dwell_min`| Integer | Minutes | Scheduled platform halt duration |
| `from_act_dwell_min` | Integer | Minutes | Actual observed platform halt duration |
| `from_dwell_delay_change_min`| Float| Minutes | Dwell delay change ($\text{dep\_delay} - \text{arr\_delay}$) |
| `departure_hour` | Integer (0..23)| Hours | Departure hour |
| `departure_time_sin` | Float | [-1.0, 1.0] | $\sin(2\pi \cdot \text{hour} / 24)$ cyclic encoding |
| `departure_time_cos` | Float | [-1.0, 1.0] | $\cos(2\pi \cdot \text{hour} / 24)$ cyclic encoding |

### C. Physical Infrastructure & Progress Features
| Field Name | Data Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `section_distance_km`| Float | Kilometers | Inter-station track distance |
| `sched_section_runtime_min`| Integer | Minutes | Timetable allotted running time for this section |
| `sched_speed_kmh` | Float | km/h | Timetable planned average section speed |
| `route_total_distance_km`| Float | Kilometers | Full journey planned track distance |
| `cum_distance_km` | Float | Kilometers | Distance traveled from origin up to current station |
| `fraction_route_completed`| Float | [0.0, 1.0] | Relative progress through journey |
| `stops_remaining` | Integer | Count | Number of remaining scheduled stations to terminus |
| `edge_daily_train_count` | Integer | Trains/day | Daily traffic volume across this edge (from network edges) |

### D. Ground Truth Supervised Targets (Strictly for training / loss calculation)
| Field Name | Target Role | Formula / Description |
| :--- | :--- | :--- |
| `target_next_actual_runtime_min` | Regression Target | Actual block running time: $\text{sched\_runtime} + \Delta D$ |
| `target_next_arr_delay_min` | Target A (Delay) | Observed arrival delay at $S_{i+1}$ |
| `target_section_delay_change_min` | Target B (Delta) | Section delay change: $\Delta D = \text{arr\_delay}_{i+1} - \text{dep\_delay}_i$ |
| `target_propagation_category` | Classification Target | `recovered` ($< -2$), `stable` ($-2 \dots 2$), `increased` ($> +2$) |

---

## 3. Data Integrity and Sanity Tests

The feature store was validated against the automated unit test suite `ml_system/tests/test_section_feature_store.py`:
1. **Target Math Verification**:
   $$\text{target\_section\_delay\_change\_min} = \text{target\_next\_arr\_delay\_min} - \text{from\_dep\_delay\_min}$$
   Verified with 100% exact numerical agreement.
2. **Category Alignment**:
   `target_propagation_category` strictly reflects the specified $-2.0$ and $+2.0$ thresholds.
3. **No Downstream Telemetry in Input Columns**:
   Automated column name checks verified that downstream arrival times (`to_act_arr`, `next_act_arr`) appear **only** under `target_*` prefixes.

---

## 4. Recommended Train / Validation / Test Splitting Strategy

Because train movements exhibit strong temporal correlations (e.g. weather patterns, seasonal congestion, maintenance blocks), **random K-fold cross-validation is strictly discouraged**. Random splitting would cause future train states to leak into training folds.

### Recommended Point-in-Time Temporal Split:
- **Training Set (Days 1 to 21)**: `2024-09-01` to `2024-09-21` (~70% of observations, ~62,500 rows)
- **Validation Set (Days 22 to 25)**: `2024-09-22` to `2024-09-25` (~13% of observations, ~12,000 rows)
- **Test / Benchmark Set (Days 26 to 30)**: `2024-09-26` to `2024-09-30` (~17% of observations, ~14,800 rows)

This chronological split accurately simulates production deployment, where a model trained on past weeks is evaluated on unseen future days.
