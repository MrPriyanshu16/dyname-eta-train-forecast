# Indian Railways Dynamic Train ETA Forecasting System
## Heuristic Uncertainty Bounds & Variance Spread Formulation

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network Scope  
**Report Date**: 2026-09-20  
**Model Status**: `INSUFFICIENT_GROUND_TRUTH` (Supervised ML Gated)  

---

### 1. The Uncertainty Formulation

Rather than presenting a brittle single-point prediction, the system estimates **Heuristic 80%-target uncertainty bounds** (uncalibrated P10/P90-style uncertainty estimates, $[P_{10}, P_{90}]$) to inform passengers and controllers of operational dispersion:

```text
Optimistic Bound (P10) ────── Expected ETA (P50) ────── Pessimistic Bound (P90)
     │                                │                                │
Green aspects, full recovery     Baseline 4 Heuristic         Signal halts, siding dwell
```

- **Lower Bound ($P_{10}$)**:
  $$P_{10} = \max\left(0, \text{ETA} - 0.50 \times \sigma_{\text{tier}}\right)$$
- **Point Forecast ($P_{50}$)**:
  $$P_{50} = \text{ETA}_{\text{Baseline 4}}$$
- **Upper Bound ($P_{90}$)**:
  $$P_{90} = \text{ETA} + 1.00 \times \sigma_{\text{tier}}$$
- **Monotonicity Rule**:
  $$P_{10} \le \text{ETA} \le P_{90} \quad \text{for 100\% of queries.}$$

---

### 2. Empirical Variance Distributions by Coaching Tier

The historical delay spread ($\sigma_{\text{tier}}$) is derived from Layer 2 auxiliary historical delay statistics (`train_station_delay_stats`):

| Coaching Category | Priority Tier | Historical Delay Variance ($\sigma_{\text{tier}}$) | Indicative Interval Width | Operational Driver |
|:---|:---:|:---:|:---:|:---|
| **Vande Bharat / Rajdhani** | Tier 1 | $\approx 12.0\text{ min}$ | $\approx 18\text{ min}$ | Strict line clear; tight speed adherence |
| **Shatabdi / Garib Rath** | Tier 2 | $\approx 16.0\text{ min}$ | $\approx 24\text{ min}$ | High priority; occasional terminal congestion |
| **Superfast Express** | Tier 3 | $\approx 22.0\text{ min}$ | $\approx 33\text{ min}$ | Moderate dispersion on single-track bottlenecks |
| **Express / Mail** | Tier 4 | $\approx 28.0\text{ min}$ | $\approx 42\text{ min}$ | Sectional overtaking halts; intermediate dwell |
| **Passenger / Ordinary** | Tier 5 | $\approx 38.0\text{ min}$ | $\approx 57\text{ min}$ | High variance caused by siding loop precedence |

---

### 3. Scientific Statement on Empirical Coverage Probability (ECP)

#### Why ECP is NOT reported:
Calculating Empirical Coverage Probability requires:
$$\text{ECP} = \frac{1}{N}\sum_{i=1}^N \mathbb{I}\left(P_{10}^{(i)} \le \text{Actual Arrival}^{(i)} \le P_{90}^{(i)}\right)$$
Because open Indian Railways datasets contain only scheduled timetables and aggregate station averages—and **do not contain recorded actual arrival timestamps for individual journeys**—ECP cannot be calculated without manufacturing synthetic actuals.

In adherence to strict scientific honesty:
- **Uncalibrated P10/P90-style heuristic bounds; Empirical Coverage Probability (ECP) is NOT reported because point-in-time actuals do not exist in open datasets.**
- **No speculative coverage percentages (e.g. 78.2% or 82.4%) are claimed.**
- The intervals represent heuristic bounds parameterized by historical variance distributions.
- When an authorized live or historical feed with actual arrival timestamps is ingested, ECP can be quantitatively computed using the validation scripts provided in this repository.
