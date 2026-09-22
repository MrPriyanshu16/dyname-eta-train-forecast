# Indian Railways Dynamic Train ETA Forecasting System
## Architectural Generalization Framework & Scenario Evaluation

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network Scope  
**Report Date**: 2026-09-20  
**Model Status**: `INSUFFICIENT_GROUND_TRUTH` (Supervised ML Gated)  

---

### 1. Generalization Slicing Framework (Architectural Design)

When genuine point-in-time ground truth becomes available, the evaluation framework is structured to benchmark model behavior across distinct operational familiarity slices:

```text
                                GENERALIZATION TAXONOMY
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
   TRAIN IDENTITY                                                     ROUTE TOPOLOGY
   ├── Slice A: Seen Train (in training)                             ├── Slice C: Seen Route (known sections)
   └── Slice B: Unseen Train (held-out)                              ├── Slice D: Partially Unseen Route (new branches)
                                                                     └── Slice E: Fully Unseen Route (new zones)
```

- **Current Evaluation Status**: In the absence of an open point-in-time ground-truth dataset with recorded actual arrivals, **quantitative error metrics (MAE/RMSE) are not reported** for these slices. Reporting numerical errors without actual targets would be scientifically fraudulent.

---

### 2. Operational Scenario Simulation: Train 22491 (Mandore Superfast Express)

#### Important Clarification:
This section provides a **Scenario Simulation / Heuristic Demonstration** showing how the Delay Recovery Model (Baseline 4) responds to an initial delay under timetable assumptions. It is **NOT an empirical accuracy validation**, because actual recorded arrival times for this run are not present in open datasets.

#### Scenario Setup:
- **Service**: Train `22491` (Mandore Superfast Express, Jodhpur Jn `JU` $\to$ Old Delhi `DLI`)
- **Distance**: 620.0 km across 17 halts (12 within Rajasthan).
- **Hypothetical Scenario**: Train departs Jodhpur (`JU`) at 20:45 with a **+15 minute initial departure delay**.

#### Simulated Trajectory: Static NTES Propagation (B2) vs Dynamic Recovery Heuristic (B4)

| Halts Along Route | Scheduled Arrival (STA) | Static NTES Baseline (B2) | Dynamic Recovery Heuristic (B4) | Estimated Recovery | Operational Factor |
|:---|:---:|:---:|:---:|:---:|:---|
| **Jodhpur Jn (JU)** | 20:30 (Dep) | 20:45 | 20:45 | 0 min | Initial terminal delay |
| **Gotan (GOTN)** | 21:26 | 21:41 | 21:39 | 2 min | Open section speedup |
| **Merta Road Jn (MTD)** | 21:43 | 21:58 | 21:55 | 3 min | Major junction approach |
| **Degana Jn (DNA)** | 22:22 | 22:37 | 22:33 | 4 min | Intermediate section |
| **Makrana Jn (MKN)** | 22:56 | 23:11 | 23:06 | 5 min | Marble corridor |
| **Jaipur Jn (JP)** | 01:05 | 01:20 | 01:13 | 7 min | Divisional headquarters |
| **Dausa (DO)** | 01:59 | 02:14 | 02:06 | 8 min | Double line corridor |
| **Bandikui Jn (BKI)** | 02:23 | 02:38 | 02:29 | 9 min | Junction convergence |
| **Alwar Jn (AWR)** | 03:10 | 03:25 | 03:15 | 10 min | Electrified trunk section |
| **Rewari Jn (RE)** | 04:38 | 04:53 | 04:42 | 11 min | Haryana border transition |
| **Gurgaon (GGN)** | 05:30 | 05:45 | 05:33 | 12 min | NCR suburban approach |
| **Old Delhi (DLI)** | 06:45 | 07:00 | **06:48** | **12 min** | **Terminal timetable padding** |

#### Scenario Takeaway:
- Under **Baseline 2 (Static NTES Propagation)**, the +15 min delay is projected constantly across all 620 km, estimating an arrival of 07:00.
- Under **Baseline 4 (Delay Recovery Heuristic)**, the formula applies the Superfast priority recovery rate ($\alpha = 2.5$) over the 620 km run, calculating an estimated 12 minutes of recovery by Old Delhi (estimated ETA 06:48).
- **Crucial Distinction**: 06:48 is a *deterministic heuristic output*, not an observed ground-truth arrival. It demonstrates the behavioral design of the heuristic, not a proven empirical error metric.
