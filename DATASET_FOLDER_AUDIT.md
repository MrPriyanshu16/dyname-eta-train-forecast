# Complete Dataset Folder Audit Report (`DATASET_FOLDER_AUDIT.md`)

**Date of Audit**: 2026-09-22  
**Audit Scope**: 100% of files located in the `datasets/` root directory and all subdirectories.  
**Auditor**: Antigravity Machine Learning Quality & Scientific Governance  
**Objective**: Determine whether any dataset in the repository contains genuine, non-synthetic historical point-in-time train running observations with actual arrival/departure timestamps suitable for supervised ETA machine learning.

---

## 1. Executive Summary

A comprehensive, row-by-row, column-by-column audit was executed across **100% of the files** present in `datasets/`.

| Total Files Audited | Master Timetable Files | Route/Station Reference Files | Auxiliary Statistics Files | Candidate / Primary Ground Truth Files |
| :---: | :---: | :---: | :---: | :---: |
| **9** | **4** (44.4%) | **2** (22.2%) | **2** (22.2%) | **0 (0.0%)** |

> [!CRITICAL]
> **Definitive Ground Truth Finding**:  
> **Zero (0) files** in the `datasets/` folder contain genuine point-in-time train running observations with service dates, actual arrival timestamps, and observation timestamps. 
> 
> In accordance with scientific integrity guidelines, **supervised regression model training is suspended (`INSUFFICIENT_GROUND_TRUTH_IN_CURRENT_AUDIT`)**, preventing the fabrication of fake training samples or synthetic accuracy. The system operates on the **Operational ETA Baseline Engine** connected to live NTES operational telemetry and verified timetable topology.

---

## 2. Dataset Classification Scheme

Every dataset is assigned one of the following canonical classifications:
- `PRIMARY_GROUND_TRUTH`: Individual real-world journey records containing verified service dates, sequence, scheduled times, actual times, and reconstructable point-in-time observation timestamps at $T$.
- `CANDIDATE_GROUND_TRUTH`: Newly discovered datasets undergoing provenance, sanity, and leakage audit before qualification.
- `MASTER_TIMETABLE`: Official or reference timetable schedule containing scheduled arrival/departure, sequence, and distances. (Valid for STA and route topology, NOT for historical delays).
- `ROUTE_STATION_REFERENCE`: Geographical coordinates, station codes, railway zones, and network connectivity.
- `AUXILIARY_HISTORICAL_STATISTICS`: Aggregated delay averages, weather data, or macro statistics lacking individual timestamped train runs.
- `LIVE_DATA_EXPORT`: Real-time streaming snapshots from NTES or GPS trackers.
- `UNUSABLE_FOR_ETA_TRAINING`: Non-railway datasets, synthetic mocks, or corrupt files.
- `UNKNOWN_PENDING_PROVENANCE`: Datasets with unverified origin or uncertain integrity.

---

## 3. Comprehensive Inventory & Schema Audit (100% of Files in `datasets/`)

| File Name | File Size | Row Count | Col Count | Unique Trains | Unique Stations | Rajasthan Trains | Rajasthan Stations | Actual Arrival? | Journey Date? | Obs Time? | Classification | Training Usage |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `Train_details_22122017.csv` | 16.7 MB | 186,124 | 12 | 11,113 | 8,151 | 558 | 590 | **No** | **No** | **No** | `MASTER_TIMETABLE` | Route topology & STA reference only |
| `Train_details_22122017 (1).csv` | 16.7 MB | 186,124 | 12 | 11,113 | 8,151 | 558 | 590 | **No** | **No** | **No** | `MASTER_TIMETABLE` | Duplicate of above; excluded |
| `isl_wise_train_detail_03082015_v1.csv` | 8.05 MB | 69,006 | 12 | 2,810 | 4,344 | 364 | 358 | **No** | **No** | **No** | `MASTER_TIMETABLE` | Reference schedule cross-check |
| `schedules.json` | 82.2 MB | 417,080 | 8 | 5,208 | 8,539 | 359 | 623 | **No** | **No** | **No** | `MASTER_TIMETABLE` | Timetable stop sequences & day numbers |
| `stations.json` | 1.86 MB | 8,990 | 5 | N/A | 8,990 | N/A | 671* | **No** | **No** | **No** | `ROUTE_STATION_REFERENCE` | Geocoding & administrative mapping |
| `trains.json` | 14.8 MB | 5,208 | 21 | 5,208 | N/A | 359 | N/A | **No** | **No** | **No** | `ROUTE_STATION_REFERENCE` | Train type, zone, endpoints |
| `india_weather_rainfall_data.xlsx` | 64.6 MB | ~500k | 15 | 0 | 0 | 0 | 0 | **No** | N/A | N/A | `UNUSABLE_FOR_ETA_TRAINING` | Weather district reference; no railway data |
| `RS_Session_262_AU_784_A_to_C.csv` | 186 B | 7 | 4 | 0 | 0 | 0 | 0 | **No** | **No** | **No** | `AUXILIARY_HISTORICAL_STATISTICS` | Parliamentary macro speed table; unusable |
| `README.md` | 2.21 KB | 88 lines | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `ROUTE_STATION_REFERENCE` | Documentation for DataMeet JSON files |

*\*Note: Station and train counts represent dynamically discovered overlaps with the current database ingestion.*

---

## 4. Detailed File-by-File Analysis

### 4.1 `Train_details_22122017.csv`
- **Source / Provenance**: Indian Railways static timetable dump scraped/exported as of 22 December 2017. Publicly shared across GitHub/Kaggle repositories.
- **Columns**: `Train No`, `Train Name`, `SEQ`, `Station Code`, `Station Name`, `Arrival time`, `Departure Time`, `Distance`, `Source Station`, `Source Station Name`, `Destination Station`, `Destination Station Name`.
- **Data Types**: String identifiers, integer sequence/distance, formatted `HH:MM:SS` schedule strings.
- **Coverage**: 11,113 trains, 8,151 stations nationwide. Overlaps with 558 Rajasthan trains and 590 Rajasthan stations in current master database.
- **Suitability for Actual Arrival / ETA Training**:
  - `actual_arrival`: **ABSENT**.
  - `actual_departure`: **ABSENT**.
  - `journey_date`: **ABSENT**.
  - `observation_timestamp`: **ABSENT**.
  - `delay`: **ABSENT**.
- **Classification**: `MASTER_TIMETABLE`.
- **Verdict**: Strictly restricted to timetable validation (STA) and intermediate sequence mapping. Cannot be used as training ground truth.

---

### 4.2 `Train_details_22122017 (1).csv`
- **Source / Provenance**: Byte-for-byte exact duplicate of `Train_details_22122017.csv` (`filecmp.cmp == True`).
- **Classification**: `MASTER_TIMETABLE` (Redundant Duplicate).
- **Verdict**: Excluded from pipeline to prevent redundant processing.

---

### 4.3 `isl_wise_train_detail_03082015_v1.csv`
- **Source / Provenance**: Official Open Government Data (data.gov.in) timetable release dated 03 August 2015, published under Government of India Open Data license.
- **Columns**: `Train No.`, `train Name`, `islno`, `station Code`, `Station Name`, `Arrival time`, `Departure time`, `Distance`, `Source Station Code`, `source Station Name`, `Destination station Code`, `Destination Station Name`.
- **Coverage**: 2,810 trains, 4,344 stations. 364 Rajasthan trains, 358 Rajasthan stations.
- **Suitability for Actual Arrival / ETA Training**:
  - Contains scheduled timetable entries only.
  - Zero date-specific actual arrival or departure records.
- **Classification**: `MASTER_TIMETABLE`.
- **Verdict**: Authoritative historical baseline for timetable scheduling. Unusable for supervised delay/ETA training.

---

### 4.4 `schedules.json`
- **Source / Provenance**: DataMeet Indian Railways open repository curated by Sanjay Bhangar and Sajjad Anwar. Released under Creative Commons Zero (CC0).
- **Columns / Structure**: JSON array of 417,080 objects: `id`, `train_number`, `train_name`, `station_code`, `station_name`, `arrival`, `departure`, `day`.
- **Coverage**: 5,208 trains, 8,539 stations. Overlaps with 359 Rajasthan trains and 623 Rajasthan stations.
- **Suitability for Actual Arrival / ETA Training**:
  - Documents scheduled times and multi-day journey indices (`day` 1, 2, 3).
  - No actual running logs or telemetry.
- **Classification**: `MASTER_TIMETABLE`.
- **Verdict**: Primary source for stop day offsets and multi-day scheduled arrival dates.

---

### 4.5 `stations.json`
- **Source / Provenance**: DataMeet GeoJSON FeatureCollection. CC0 license.
- **Structure**: 8,990 Point features with properties: `code`, `name`, `state`, `zone`, `address`, and `geometry.coordinates` `[lon, lat]`.
- **Coverage**: 8,990 railway stations across India, including 671 verified Rajasthan stations.
- **Suitability for Actual Arrival / ETA Training**: Static geospatial metadata only.
- **Classification**: `ROUTE_STATION_REFERENCE`.
- **Verdict**: Used for station geocoding, boundary validation, and coordinate resolution.

---

### 4.6 `trains.json`
- **Source / Provenance**: DataMeet GeoJSON FeatureCollection. CC0 license.
- **Structure**: 5,208 LineString features with properties: `number`, `name`, `type`, `zone`, `from_station_code`, `to_station_code`, `duration_h`, `duration_m`, `distance`, coach classes.
- **Coverage**: 5,208 train services. Overlaps with 359 Rajasthan trains.
- **Suitability for Actual Arrival / ETA Training**: Static train profile and route geometry only.
- **Classification**: `ROUTE_STATION_REFERENCE`.
- **Verdict**: Authoritative reference for train identity, train type, and operational zone.

---

### 4.7 `india_weather_rainfall_data.xlsx`
- **Source / Provenance**: Indian Meteorological Department (IMD) / Kaggle climate observation compilation.
- **Columns**: `date_of_record`, `month`, `season`, `station_name`, `state`, `district`, `avg_temp`, `min_temp`, `max_temp`, `wind_speed`, `air_pressure`, `elevation`, `latitude`, `longitude`, `rainfall`.
- **Coverage**: Meteorological observation stations across Indian states and districts.
- **Suitability for Actual Arrival / ETA Training**:
  - Contains weather station observations, NOT railway station or train run observations.
  - Zero train numbers, zero train delays, zero railway network topology.
- **Classification**: `UNUSABLE_FOR_ETA_TRAINING`.
- **Verdict**: Rejected for direct ETA training. May only be cross-referenced for macro weather features if train timestamped data existed.

---

### 4.8 `RS_Session_262_AU_784_A_to_C.csv`
- **Source / Provenance**: Rajya Sabha Parliamentary Unstarred Question No. 784 answered in Session 262 (Ministry of Railways).
- **Columns**: `Type of Train`, `Mail Express`, `Ordinary`, `Goods` across years 2017-18 to 2023-24.
- **Content**: 7 rows containing national average train speeds in km/h.
- **Suitability for Actual Arrival / ETA Training**: Macroeconomic aggregate speed statistics only.
- **Classification**: `AUXILIARY_HISTORICAL_STATISTICS`.
- **Verdict**: Useful solely as a macro baseline benchmark for nominal corridor speed checks. Unusable for ETA training.

---

### 4.9 `README.md`
- **Content**: Documentation and usage instructions for DataMeet JSON files.
- **Classification**: `ROUTE_STATION_REFERENCE`.

---

## 5. Duplicate and Conflicting-Record Analysis

1. **Exact File Duplication**: `Train_details_22122017 (1).csv` is an exact duplicate of `Train_details_22122017.csv` (16,704,995 bytes). Only the canonical unnumbered file will be indexed.
2. **Timetable Epoch Consistency**:
   - `isl_wise_train_detail_03082015_v1.csv` represents 2015 IRCTC schedules.
   - `schedules.json` represents 2016-2017 DataMeet schedules.
   - `Train_details_22122017.csv` represents December 2017 schedules.
   - Timings for long-standing express trains (e.g. 14888, 22491) show slight minor minute adjustments across epochs. The unified SQLite master database (`railway_master.db`) reconciles these by prioritizing the verified current master route topology.

---

## 6. Formal Audit Conclusion

1. **No Historical Ground Truth in `datasets/`**: None of the 9 files present in `datasets/` contains genuine historical actual arrivals/departures with service dates and observation timestamps.
2. **Prohibition of Synthetic Generation**: Timetable files will not be converted into fake historical journeys using random delays or perturbed schedules.
3. **Operational Architecture**: The system maintains the **Operational ETA Baseline Engine** powered by verified timetable schedules and live NTES telemetry until qualified `PRIMARY_GROUND_TRUTH` is ingested.
