# Indian Railways Dynamic Train ETA Forecasting System
## Operational Baselines Formulation & Architectural Comparison

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network Scope  
**Report Date**: 2026-09-20  
**Model Status**: `INSUFFICIENT_GROUND_TRUTH` (Supervised ML Gated)  

---

### 1. The Critical Distinction: Timetable vs Delay Stats vs Ground Truth

In strict accordance with scientific integrity, the project separates three distinct data layers:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: MASTER TIMETABLE (DataMeet / IR Official Timetable)             │
│ • Canonical train numbers, routes, station sequences, scheduled times   │
│ • Powers: Schedule-Based ETA (Baseline 1)                               │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 2: AGGREGATE HISTORICAL DELAY STATISTICS (Auxiliary Data)          │
│ • Monthly and weekly station-level delay averages from NTES crawls      │
│ • Powers: Delay priors, section medians (Baseline 3), recovery slack    │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 3: OPERATIONAL DOMAIN BASELINES (Deterministic Heuristics)        │
│ • Formulations for Schedule, Delay Propagation, Median, and Recovery    │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 4: SUPERVISED ML PIPELINE (Prepared & Gated)                      │
│ • XGBoost / LightGBM architecture exists in codebase                    │
│ • GATED: Cannot be trained or validated without Point-in-Time Actuals   │
└─────────────────────────────────────────────────────────────────────────┘
```

Because public railway repositories contain only published timetables and aggregate station averages (not point-in-time run trajectories with actual arrival timestamps), **quantitative prediction error (MAE / RMSE) cannot be calculated without manufacturing synthetic actuals.** The system refuses to manufacture fake ground truth.

---

### 2. Operational Baselines Mathematical Formulations

To deliver transparent ETA predictions under available data, four domain baselines are implemented:

#### Baseline 1: Schedule-Based Remaining Time (Timetable Baseline)
$$\text{ETA}_{B1} = \text{STA}_{\text{destination}}$$
$$\text{Remaining Time}_{B1} = \max\left(0, \frac{\text{Distance Remaining}}{\text{Nominal Speed}} \times 60\right)$$
- **Operational Logic**: Assumes the train runs strictly according to its published timetable.
- **Limitation**: Completely ignores accumulated real-time delays. If a train is running 45 minutes late, Baseline 1 still shows the scheduled timetable arrival time.

#### Baseline 2: Current Delay Propagation (NTES Standard Baseline)
$$\text{ETA}_{B2} = \text{STA}_{\text{destination}} + \text{Delay}_{\text{current}}$$
$$\text{Remaining Time}_{B2} = \text{Remaining Time}_{B1} + \text{Delay}_{\text{current}}$$
- **Operational Logic**: The default method used by the National Train Enquiry System (NTES) and commercial enquiry apps. Assumes that delay observed at the last station remains static for all downstream stations.
- **Limitation**: Ignores timetable recovery slack on open double/triple lines and underestimates delays on congested single-track bottlenecks.

#### Baseline 3: Historical Section Median
$$\text{ETA}_{B3} = T + \sum_{k \in \text{remaining sections}} \text{Median Section Run Time}_k$$
- **Operational Logic**: Replaces nominal timetable section run-times with empirical median traversal times computed from Layer 2 auxiliary delay statistics (`train_station_delay_stats`).
- **Advantage**: Automatically captures systemic section bottlenecks (e.g. junction congestion approaching Jaipur `JP` or Phulera `FL`).

#### Baseline 4: Delay Recovery Heuristic (Dynamic Operational Recovery)
$$\text{ETA}_{B4} = \text{STA}_{\text{destination}} + \text{Delay}_{\text{current}} - \text{Expected Recovery}(\text{tier}, \text{dist})$$
$$\text{Expected Recovery} = \min\left(0.40 \times \text{Delay}_{\text{current}}, \frac{\text{Distance Remaining}}{100.0} \times \alpha_{\text{tier}}\right)$$
- **Operational Logic**: Operational priority rules reflect Indian Railways operating practice:
  - **Tier 1 (Vande Bharat / Rajdhani)**: $\alpha = 5.0$ (High timetable padding + absolute signaling precedence allows recovery of up to 20–25 minutes over 300+ km).
  - **Tier 2 (Shatabdi / Garib Rath)**: $\alpha = 3.5$
  - **Tier 3 (Superfast Express)**: $\alpha = 2.5$ (Moderate recovery capability).
  - **Tier 4 (Express / Mail)**: $\alpha = 1.0$ (Standard running; limited recovery).
  - **Tier 5 (Passenger / Ordinary)**: $\alpha = -1.5$ (Negative recovery factor: looped into sidings for higher-tier trains, accumulating further delays).

---

### 3. Comparison of Baseline Operational Properties

| Property / Feature | Baseline 1 (Schedule) | Baseline 2 (NTES Propagation) | Baseline 3 (Section Median) | Baseline 4 (Delay Recovery) |
|:---|:---:|:---:|:---:|:---:|
| **Requires Live Delay** | No | Yes | Optional | Yes |
| **Considers Priority Tier** | No | No | Indirectly | Yes |
| **Accounts for Timetable Padding** | No | No | Yes | Yes |
| **Adapts Downstream by Section** | No | No | Yes | Yes |
| **Quantitative Validation Status** | Unvalidated (No ground truth) | Unvalidated (No ground truth) | Unvalidated (No ground truth) | Unvalidated (No ground truth) |
| **Current Operational Role** | Schedule Anchor | Standard Reference | Historical Prior | Active Dynamic Heuristic |

---

### 4. Statement on Performance Metrics
In adherence to academic and scientific honesty:
- **No MAE or RMSE numbers are reported** because no point-in-time ground-truth actual arrival dataset is available.
- Presenting numerical MAE figures without independently verified ground-truth actuals is scientifically invalid.
- When an authorized CRIS/RTIS feed with historical station-level timestamps is integrated, the automated evaluation scripts in this repository can immediately compute empirical MAE, RMSE, and MedAE against these four baselines.
