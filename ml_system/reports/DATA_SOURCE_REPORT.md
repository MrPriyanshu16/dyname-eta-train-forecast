# Indian Railways Dynamic Train ETA Forecasting System
## Data Source Audit & Provenance Report

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network  
**Report Date**: 2026-09-20  

---

### 1. Source Classification Matrix

Every source considered or used in this project has been rigorously audited and assigned an authoritative classification according to Section 3 of the system specification:

| Source Identifier | Source File / URL | Classification | Provenance & Collector | Time Period | Geographic Coverage | Rajasthan Usability |
|:---|:---|:---|:---|:---|:---|:---|
| **DS-01** | `stations.json` | `MASTER_DATA` | DataMeet Indian Railways (CC-BY-SA 2.5) | Static Snapshot (~2016-2020) | All India (8,990 stations) | Authoritative station codes, names, and GPS coordinates |
| **DS-02** | `trains.json` | `MASTER_DATA` | DataMeet Indian Railways (CC-BY-SA 2.5) | Static Snapshot (~2016-2020) | All India (9,435 trains) | Canonical train numbers, routes, scheduled arrival/departures |
| **DS-03** | `Master_Monthly_Delay.csv` | `AUXILIARY_HISTORICAL_STATISTICS` | Kaggle / adityaazad79 (NTES Delay Crawl) | 2017-2018 Monthly Aggregates | Indian Railways Network (133,481 records) | Empirical monthly station delay distributions; **NOT point-in-time ground truth** |
| **DS-04** | `Master_Weekly_Delay.csv` | `AUXILIARY_HISTORICAL_STATISTICS` | Kaggle / adityaazad79 (NTES Delay Crawl) | 2017-2018 Weekly Aggregates | Indian Railways Network (133,481 records) | Empirical weekly delay variance; **NOT point-in-time ground truth** |
| **DS-05** | `Local_Monthly_Delay.csv` | `AUXILIARY_HISTORICAL_STATISTICS` | Kaggle / adityaazad79 (NTES Delay Crawl) | 2017-2018 Monthly Aggregates | Suburban / Local Sections (52,430 records) | Dwell and halt duration empirical priors |
| **DS-06** | `train-delay-estimation` | `RESTRICTED_RESEARCH / VALIDATION_ONLY` | Ramashish Gaurav et al. (IEEE ITSC 2018) | 2016-2018 | 135 Trains (52 training, 83 testing) | Code public on GitHub; raw 2-year `.tar` archive restricted to academic email request |
| **DS-07** | `railpull` | `TIMETABLE_CRAWLER_TOOL` | Shwetank Gopal (GitHub `shwetankg07/railpull`) | Current Timetables (2025-2026) | All India NTES Timetables | Live timetable scraping toolkit; not a historical movement archive |
| **DS-08** | `historical_runs.csv` (Legacy) | `REJECTED / SIMULATED` | Legacy in-house simulator (NDLS-CNB corridor) | Synthetic (2025) | New Delhi to Kanpur (UP) | **REJECTED**: Manufactured synthetic runs along UP corridor. Excluded from Rajasthan rebuild. |

---

### 2. Deep-Dive Provenance & Audit Findings

#### Source DS-01 & DS-02: DataMeet Master Datasets
- **Strengths**: Contains 8,990 stations with exact geospatial coordinates and 9,435 train itineraries with station sequence, distance in kilometers, scheduled arrival, and scheduled departure.
- **Audited Limitations**:
  - 4,593 stations had `state = ''` (blank), which previously caused major Rajasthan junction stations (`JP`, `JU`, `KOTA`, `BKN`, `BKI`, `BTE`, `SWM`, `FL`, `DNA`, `MTD`, `GOTN`) to be omitted when filtered purely by `state = 'Rajasthan'`.
  - Resolved via hierarchical geospatial and administrative mapping.
  - Numbering update: Train `22491` / `22492` (Mandore Superfast Express) and `14888` (Barmer - Rishikesh Express) were cross-referenced against current official Indian Railways timetables and registered authoritatively.

#### Source DS-03, DS-04, DS-05: Aggregate Delay Datasets
- **Columns Available**:
  ```text
  Train_No, Train_Name, Station_Name, Station_Code, Delay, Zone
  ```
- **Audited Limitations**:
  - Does **NOT** contain individual journey dates, observation timestamps, actual arrival timestamps, or train speeds.
  - **Scientific Decision**: Strictly preserved as `AUXILIARY_HISTORICAL_STATISTICS`. No fake journey dates or fabricated run observations are manufactured from these aggregates.
  - Used for computing Layer B historical priors: station-level mean delay, section delay variance, and priority-tier delay recovery factors.

#### Source DS-06: `train-delay-estimation` (R-Gaurav / ITSC 2018)
- **Investigation Result**: The repository (`github.com/R-Gaurav/train-delay-estimation`) publishes Markov and regression modeling code. However, the underlying dataset `Train_Delay_Estimation_Data_March_2016_February_2018.tar` is not stored in the repository. Access requires filling out an academic request form and emailing `my.better.rail@gmail.com`.
- **Classification**: `RESTRICTED_RESEARCH`.

---

### 3. Scientific Fallback Activation
In accordance with Section 4 of the instructions:
> *"If no adequate point-in-time historical dataset can be obtained, DO NOT manufacture the missing data just to make XGBoost work. Instead implement the following scientifically honest architecture: Layer A (Master Timetable) + Layer B (Historical Statistics) + Transparent Operational Baselines."*

The system status is officially recorded as:
```text
MODEL_STATUS = INSUFFICIENT_GROUND_TRUTH
ENGINE_MODE  = OPERATIONAL_BASELINES_AND_HISTORICAL_PRIORS
```
Predictions are generated using the four domain baselines (Schedule, Current Delay Propagation, Historical Section Median, Delay Recovery) without pretending synthetic weights represent trained ML models.
