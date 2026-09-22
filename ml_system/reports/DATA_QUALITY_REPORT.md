# Indian Railways Dynamic Train ETA Forecasting System
## Data Quality & Integrity Audit Report

**Problem Statement ID**: 26028 | Ministry of Railways  
**Scope**: Rajasthan Railway Network Scope  
**Audit Date**: 2026-09-20  

---

### 1. Data Quality Audit Metrics

A comprehensive integrity scan was executed across `railway_master.db`, master timetables, and auxiliary delay records. The results are summarized below:

| Integrity Check Category | Records Scanned | Anomalies Found | Resolution / Action Taken | Status |
|:---|:---|:---|:---|:---|
| **Duplicate Station Codes** | 8,990 | 0 | Enforced `station_code TEXT PRIMARY KEY` | **PASS** |
| **Duplicate Train Numbers** | 9,435 | 0 | Enforced `train_number TEXT PRIMARY KEY` | **PASS** |
| **Missing Train Numbers** | 9,435 | 0 | All trains have verified 5-digit primary keys | **PASS** |
| **Missing Station Codes** | 136,700 (route stops) | 0 | All route stops have valid station codes | **PASS** |
| **Invalid Station Sequences** | 136,700 (route stops) | 0 | Sequences strictly monotonic ($1, 2, \dots, N$) | **PASS** |
| **Inconsistent Train Names** | 9,435 trains | 12 | Canonical name mapped by latest timetable revision | **RESOLVED** |
| **Unmatched Route Stations** | 136,700 (route stops) | 184 | Minor halts without GPS mapped to parent junction | **RESOLVED** |
| **Impossible Negative Distances** | 136,700 (route stops) | 0 | Distance strictly monotonically increasing | **PASS** |
| **Blank State Entries** | 8,990 stations | 4,593 | Hierarchically resolved for Rajasthan via GPS + NWR/WCR | **RESOLVED** |
| **Border Ambiguity Stations** | 974 stations in box | 422 | Flagged & excluded (e.g. Panipat, Rewari, Samakhiali) | **RESOLVED** |
| **Missing Telemetry Rate** | Production queries | 100% (when offline) | Explicitly represented as `null` / `UNAVAILABLE` | **PASS** |
| **Manufactured Point-in-Time Data** | Historical delays | 0 manufactured | Zero fake runs created from monthly aggregates | **PASS** |

---

### 2. Deep-Dive Quality Findings

#### A. Resolution of Station Classification Ambiguities
- **Root Cause**: DataMeet `stations.json` contained null or empty `state` strings for 51.1% of Indian railway stations, including major district headquarters in Rajasthan.
- **Vulnerability**: A simple SQL query `WHERE state = 'Rajasthan'` dropped Jaipur (`JP`), Jodhpur (`JU`), Kota (`KOTA`), and Bikaner (`BKN`).
- **Correction Applied**:
  - Implemented multi-tier hierarchical resolution in `ml_system/src/data/build_rajasthan_scope.py`.
  - Identified 451 stations with explicit `state = 'Rajasthan'`.
  - Identified 220 additional stations matching verified Rajasthan cities/junctions and located within core Rajasthan coordinates ($24.0^\circ-29.5^\circ\text{ N}, 70.0^\circ-77.0^\circ\text{ E}$).
  - Result: **671 verified Rajasthan stations** with high classification confidence (`EXPLICIT_STATE`, `VERIFIED_CITY`, `COORDINATE_INTERIOR`).

#### B. Canonical Train Route Verification
- **Train 22491 / 22492 (Mandore Superfast Express)**:
  - Verified 17 scheduled halts between Jodhpur Junction (`JU`) and Old Delhi (`DLI`).
  - Total journey distance: 620.0 km.
  - Departure: 20:30, Arrival: 06:45 (22491); Departure: 21:20, Arrival: 07:30 (22492).
  - All 17 halts verified with monotonic distances and valid 24-hour scheduled times.
- **Train 14888 (Barmer - Rishikesh Express)**:
  - Verified complete 43-stop itinerary from Barmer (`BME`) across Rajasthan, Punjab, Haryana, and Uttarakhand to Rishikesh (`RKSH`).
  - Distance: 1,441.6 km.
  - Corrected legacy erroneous 2-station dummy record ("Barmer-Kalka Express").

---

### 3. Hard Validation Gates Implemented

In accordance with Section 22 of the system specifications, the following hard validation gates are enforced:

```python
# Validation Gate 1: Zero Manufactured Data
if not source_contains_point_in_time_timestamps:
    MODEL_STATUS = "INSUFFICIENT_GROUND_TRUTH"
    # Do NOT train supervised tree model on manufactured run rows

# Validation Gate 2: Honest Telemetry Gate
if latitude is None or longitude is None or speed_kmh is None:
    telemetry["telemetry_status"] = "UNAVAILABLE"
    telemetry["latitude"] = None
    telemetry["longitude"] = None
    telemetry["speed_kmh"] = None

# Validation Gate 3: Station Geographic Boundary Check
if station_code in EXCLUDED_STATES:
    reject_from_rajasthan_stations(station_code)
```
