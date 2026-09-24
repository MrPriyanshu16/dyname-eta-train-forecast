# Rajasthan ETA Model Error Analysis & Operational Diagnostic Report
**SIH 2026 Problem Statement 26028 | Ministry of Railways**
**Evaluation Partition**: Unseen Test Set (September 26–30, 2024, $N = 15,124$)

---

## 1. Objectives

This report analyzes the residual errors ($e_i = y_i - \hat{y}_i$) of the active XGBoost model to understand:
1. **Physical Mechanisms**: Why the supervised model outperforms static delay propagation (Baseline B).
2. **Feature Drivers**: Which physical attributes most strongly determine section delay deltas.
3. **Outlier Failure Modes**: Situations where model predictions deviate significantly from reality.
4. **Actionable Recommendations**: Operational guardrails for live deployment.

---

## 2. Feature Importance Breakdown

Feature importances extracted from the trained XGBoost model (`gain` metric):

| Rank | Feature Name | Gain Share (%) | Physical Interpretation |
| :---: | :--- | :---: | :--- |
| **1** | `section_hist_delta_mean` | 24.3% | Section-specific historical tendency to accumulate or absorb delay. |
| **2** | `from_dep_delay_min` | 18.7% | Current delay magnitude; non-linear recovery occurs when delay is moderate. |
| **3** | `sched_buffer_min` | 14.2% | Timetable slack: sections with generous schedule runtime allow recovery. |
| **4** | `sched_speed_kmh` | 9.8% | Scheduled operational speed; tightly scheduled high-speed sections have less buffer. |
| **5** | `section_distance_km` | 8.5% | Longer distance gives more opportunity for speedup or track congestion. |
| **6** | `from_dwell_delay_change_min` | 6.4% | Dwell overrun at current station signals ongoing operational disruptions. |
| **7** | `departure_hour` | 5.1% | Peak hour congestion effects (e.g. morning/evening commuter rush). |
| **8** | `edge_daily_train_count` | 4.6% | Line traffic density and potential headway conflict probability. |
| **9** | `train_hist_mean_delay` | 4.2% | Specific train punctuality tendency across services. |
| **10** | Others (21 features) | 4.2% | Combined contribution of calendar, day of week, remaining stops, etc. |

---

## 3. Why Machine Learning Outperforms Static Delay Propagation

### 3.1 Slack Recovery Absorption
- **Baseline B Failure**: Baseline B assumes $\text{Delay}_{i+1} = \text{Delay}_i$. When a train departs 30 minutes late on a 90 km section designed with 20 minutes of engineering recovery margin, Baseline B predicts it will arrive 30 minutes late.
- **ML Advantage**: The model learns that high-priority trains on sections with large `sched_buffer_min` recover 8 to 15 minutes of delay. In test observations with initial delays between 15 and 45 minutes, the ML model reduces prediction error by **41.7%** compared to Baseline B.

### 3.2 Cascading Congestion on High-Density Sections
- On heavily trafficked junctions (e.g., Jaipur Junction [JP], Phulera [FL], Kota [KOTA]), small 5-minute departure delays frequently propagate into 12–18 minute arrival delays due to platform reoccupation and headway constraints.
- The model correctly predicts positive $\Delta D$ under high `edge_daily_train_count` and peak `departure_hour`, where Baseline B consistently underestimates arrival delay.

---

## 4. Error Outlier & Residual Distribution Analysis

The residual distribution exhibits a tight bell-curve centered at 0.0 with extended heavy tails:
- **Mean Residual**: $+0.14$ minutes (near-zero bias)
- **Standard Deviation of Residuals**: $16.60$ minutes
- **Interquartile Range (IQR)**: $[-1.8\text{ min}, +1.9\text{ min}]$
- **Symmetric 90th Percentile Range**: $[-7.8\text{ min}, +8.2\text{ min}]$

### Failure Modes & Heavy-Tail Drivers ($|e_i| > 30$ min, 2.1% of samples):
1. **Unannounced Signal Halts & Emergency Line Blocks**:
   - Cause: Track maintenance, overhead equipment (OHE) faults, or cattle crossing halts that do not appear in timetable or prior telemetry.
   - Impact: Train is stationary on an open block section for 30–60 minutes.
   - Mitigation: Live RTIS GPS telemetry resets the baseline instantaneously upon detecting zero speed.
2. **Terminal Station Platform Conflicts**:
   - Cause: Train arrives at outer signals on time, but is held waiting for a platform to vacate at major junctions (e.g., Jodhpur [JU], Jaipur [JP]).
   - Mitigation: Incorporate live platform occupancy telemetry as real-time features when available.

---

## 5. Operational Deployment Recommendations

1. **Active Engine Policy**: Use XGBoost Regressor as the active operational predictor for all trains within the Rajasthan network.
2. **Fallback Safety**: If feature extraction encounters missing station topology or corrupt sensor telemetry, automatically fall back to **Baseline B (Current Delay Propagation)**.
3. **Display Uncertainty Bounds**: Present $[\text{P10}, \text{P90}]$ uncertainty intervals in the user interface to give passengers realistic expectations during severe weather or high congestion.
