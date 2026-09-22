# Indian Railways Dynamic Train ETA Forecasting System
## Historical Data Coverage & Granularity Report

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network  
**Report Date**: 2026-09-20  

---

### 1. Rajasthan Network Scope Summary

The verified Rajasthan scope was dynamically computed from `railway_master.db` by matching station topologies against train routes:

| Scope Dimension | Authoritative Count | Source & Verification |
|:---|:---|:---|
| **Verified Rajasthan Stations** | **671 stations** | Hierarchical resolution (`rajasthan_stations` table) |
| **Active Trains Serving Rajasthan** | **882 trains** | Trains whose verified route touches $\ge 1$ Rajasthan station |
| **Total Route Stops in Rajasthan Scope** | **18,492 stops** | Station stops along the 882 Rajasthan train services |
| **Intermediate Stops Located Inside Rajasthan** | **8,124 stops** | Stoppages occurring physically within Rajasthan boundaries |
| **Auxiliary Historical Delay Records** | **133,481 records** | Stored in `train_station_delay_stats` table |
| **Auxiliary Delay Records in Rajasthan Scope** | **28,740 records** | Delay records matching verified Rajasthan trains & stations |

---

### 2. Category Distribution of Rajasthan Services

The 882 trains touching Rajasthan span all primary coaching classes operated by Indian Railways:

```text
┌─────────────────────────────────────────────────────────────┐
│ Express / Mail               ██████████████████  412 trains │
│ Superfast Express            ████████████        278 trains │
│ Passenger / Ordinary         ██████              134 trains │
│ Vande Bharat Express         █                    18 trains │
│ Rajdhani Express             █                    14 trains │
│ Shatabdi / Garib Rath        █                    16 trains │
│ Special / Seasonal           █                    10 trains │
└─────────────────────────────────────────────────────────────┘
Total Verified Rajasthan Services: 882 trains
```

- **Core Rajasthan Origin/Destination Trains**: E.g. `22491/22492` Mandore Superfast Express (`JU` $\leftrightarrow$ `DLI`), `12461/12462` Vande Bharat (`JU` $\leftrightarrow$ `MSH`), `14888` Barmer - Rishikesh (`BME` $\to$ `RKSH`), `12991` Udaipur - Jaipur Intercity (`UDZ` $\to$ `JP`).
- **Trans-Rajasthan Long-Distance Services**: E.g. `12951/12952` Mumbai Rajdhani (touching Kota Junction `KOTA` and Bharatpur `BTE` in Rajasthan), `12903` Golden Temple Mail (touching Bharatpur).

---

### 3. Temporal Granularity & Ground Truth Classification

| Granularity Level | Availability in Repository | Classification | Operational Role in Dynamic ETA |
|:---|:---|:---|:---|
| **Timetable Scheduled Times (STA / STD)** | Complete (100% of route stops) | `MASTER_DATA` | Establishes published timetable baseline (Baseline 1) |
| **Station Aggregate Delay Means** | 133,481 records | `AUXILIARY_HISTORICAL_STATISTICS` | Layer B priors for section medians (Baseline 3) and recovery models (Baseline 4) |
| **Point-in-Time Trajectory Timestamps ($T$)** | Not available in open repositories | `INSUFFICIENT_GROUND_TRUTH` | Supervised regression models suspended; zero synthetic runs manufactured |
| **Live Telemetry (RTIS GPS/Speed)** | Optional / When authorized | `LIVE_DATA` | Dynamic map-matching when available; reports `UNAVAILABLE` when offline |

---

### 4. Official System Coverage Statement

In strict compliance with Section 24 of the system specifications:
> **"The system supports all trains present in the verified Rajasthan master dataset."**
> *(It does not claim to contain every conceivable train across all zones of India, but guarantees 100% verified route and timetable fidelity for the 882 coaching trains serving the Rajasthan network).*
