# Indian Railways Dynamic Train ETA Forecasting System
## Technical Limitations & Operational Constraints Report

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network  
**Report Date**: 2026-09-20  

---

### 1. Executive Summary of Operational Constraints

In strict alignment with academic integrity and railway systems engineering principles, this report outlines the physical, operational, and data limitations of the dynamic ETA system.

---

### 2. Physical & Telemetry Limitations

#### A. Locomotive RTIS Authorization & Public Data Access
- **Reality**: The Real-Time Train Information System (RTIS), developed jointly by CRIS and ISRO using MSS transceivers on locomotive roofs, is an internal operational asset of Indian Railways. Raw RTIS telemetry is not accessible via unauthenticated public APIs.
- **System Policy**: The proposed architecture separates ingestion from forecasting. The ETA engine accepts a standard train state schema regardless of whether the feed originates from an authorized CRIS/RTIS connection, an NTES enquiry poll, or an offline timetable fallback.
- **Honest Handling**: When real telemetry is absent, the system does not invent coordinates (e.g. Tundla `27.2081, 78.2393`) or fake speeds (e.g. `85 km/h` / `110 km/h`). It reports `telemetry_status: "UNAVAILABLE"` and estimates progress along the canonical route timetable.

#### B. Multi-Track Corridor Resolution (Track Number Distinguishability)
- **Reality**: Standard commercial GNSS / smartphone GPS has a horizontal accuracy of approximately $5 - 15$ meters. On multi-track trunk lines (e.g. Delhi–Jaipur or Kota–Delhi), parallel tracks are separated by only $4.0 - 5.3$ meters.
- **System Policy**: The system does NOT claim to identify the exact physical track number (e.g. Up Main, Down Main, or Siding) from GPS coordinates alone. It reports `Route Status: CONSISTENT with route corridor` unless signaling/axle-counter block occupancy data is provided.

---

### 3. Data & Ground Truth Limitations

#### A. Aggregate Statistics vs Point-in-Time Trajectories
- **Reality**: Open railway datasets (e.g. Kaggle / DataMeet) contain monthly and weekly station delay averages. They do NOT contain dense, second-by-second timestamped trajectories for millions of individual train runs.
- **Scientific Stand**: The project explicitly declines to fabricate synthetic point-in-time train runs. The system operates on **Layer A (Master Timetable) + Layer B (Empirical Delay Priors) + Operational Domain Baselines (Schedule, NTES Propagation, Section Median, and Delay Recovery)**.
- **Status Gate**: Officially recorded as `MODEL_STATUS = INSUFFICIENT_GROUND_TRUTH` for supervised tree regression until authorized locomotive trajectory data is ingested.

#### B. Weather & Speed Restrictions
- **Reality**: Winter fog across northern and eastern Rajasthan (Alwar, Bharatpur, Hanumangarh, Sri Ganganagar) severely impacts running times by imposing mandatory $60\text{ km/h}$ maximum permissible speed (MPS) limits for trains not equipped with Fog PASS devices. Live micro-weather feeds are incorporated as optional modifiers when available.

---

### 4. System Scope Commitment

In accordance with Section 24 of the system specifications:
> **"The system supports all trains present in the verified Rajasthan master dataset."**  
> *(It does not claim to contain every conceivable train across all of India, but guarantees 100% verified route and timetable fidelity for the 882 coaching trains serving the Rajasthan network).*
