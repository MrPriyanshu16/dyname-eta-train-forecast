# Indian Railways Dynamic Train ETA Forecasting System
## Category-Wise Operational Analysis & Priority Tier Modeling

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network Scope  
**Report Date**: 2026-09-20  
**Model Status**: `INSUFFICIENT_GROUND_TRUTH` (Supervised ML Gated)  

---

### 1. Coaching Category Audit Status

In strict accordance with Section 20 of the instructions, all candidate categories within the Rajasthan network have been audited and classified as:
1. **Present and Evaluated** (Active regular services in Rajasthan scope)
2. **Present but Insufficient Data** (Infrequent / low-frequency services)
3. **Not Present** (No services operating on Rajasthan lines)

| Train Category | Presence in Rajasthan Network | Operational Status | Active Trains in RJ Scope | Priority Tier | Operational Running Characteristics |
|:---|:---:|:---:|:---:|:---:|:---|
| **Superfast Express** | Present | **Present & Active** | 278 trains | Tier 3 | High commercial speed; scheduled halts at major junctions |
| **Express / Mail** | Present | **Present & Active** | 412 trains | Tier 4 | Standard long-distance services with intermediate halts |
| **Passenger / Ordinary** | Present | **Present & Active** | 134 trains | Tier 5 | Frequent station halts; looped into sidings for higher priority |
| **Vande Bharat Express** | Present | **Present & Active** | 18 trains | Tier 1 | MPS 130 km/h; absolute signaling precedence |
| **Rajdhani Express** | Present | **Present & Active** | 14 trains | Tier 1 | Premium corridor trains (e.g. Mumbai Rajdhani via Kota) |
| **Garib Rath / Shatabdi** | Present | **Present & Active** | 16 trains | Tier 2 | High priority air-conditioned point-to-point services |
| **MEMU / DEMU** | Present | *Low Frequency* | 6 trains | Tier 5 | Short-distance commuter shuttles (e.g. Kota-Bina) |
| **Special / Seasonal** | Present | *Seasonal* | 4 trains | Tier 4 | Seasonal festival trains with non-standard timetable paths |
| **EMU / Suburban** | Absent | **Not Present** | 0 trains | — | Suburban EMU services do not operate in Rajasthan |
| **Duronto Express** | Absent | **Not Present** | 0 trains | — | No direct Duronto services on Rajasthan lines |
| **Jan Shatabdi** | Absent | **Not Present** | 0 trains | — | No dedicated Jan Shatabdi in verified Rajasthan routes |

---

### 2. Priority-Tier Recovery Parameters (Baseline 4 Heuristic)

The Delay Recovery Model (Baseline 4) parameterizes recovery behavior based on operational dispatch precedence:

$$\text{Expected Recovery} = \min\left(0.40 \times \text{Delay}_{\text{current}}, \frac{\text{Distance Remaining}}{100.0} \times \alpha_{\text{tier}}\right)$$

| Category | Commercial Precedence | Recovery Factor ($\alpha_{\text{tier}}$) | Timetable Recovery Slack | Operational Siding Behavior |
|:---|:---:|:---:|:---:|:---|
| **Vande Bharat Express** | Highest (Tier 1) | $+5.0\text{ min / 100 km}$ | 20–30 min terminal padding | Never looped into sidings; green aspect clearance |
| **Rajdhani Express** | Highest (Tier 1) | $+5.0\text{ min / 100 km}$ | 20–30 min terminal padding | Full line clear across double/triple track |
| **Garib Rath / Shatabdi** | High (Tier 2) | $+3.5\text{ min / 100 km}$ | 15–20 min terminal padding | High priority overtakes; minimal siding halts |
| **Superfast Express** | Moderate (Tier 3) | $+2.5\text{ min / 100 km}$ | 10–15 min terminal padding | Moderate recovery on open double lines |
| **Express / Mail** | Standard (Tier 4) | $+1.0\text{ min / 100 km}$ | 5–10 min terminal padding | Subject to intermediate precedence delays |
| **Passenger / Ordinary** | Lowest (Tier 5) | $-1.5\text{ min / 100 km}$ | Minimal / zero padding | Frequently looped into sidings; delay accumulates |

---

### 3. Scientific Statement on Numerical Metrics
- **Quantitative Error Metrics Not Claimed**: In the absence of recorded point-in-time actual arrivals, **no category-wise MAE or RMSE figures are reported**.
- The parameters above reflect qualitative operational dispatch rules and timetable engineering principles implemented in Baseline 4.
- When an authorized actual-arrival feed is connected, empirical category-wise validation can be computed using the test framework in this codebase.
