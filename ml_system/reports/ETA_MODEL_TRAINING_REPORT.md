# Rajasthan Section Delay Propagation Model Training Report
**SIH 2026 Problem Statement 26028 | Ministry of Railways**
**Date of Training**: September 24, 2026
**Model Version**: `2.1.0-rajasthan`
**Scope**: Rajasthan Railway Network

---

## 1. Executive Summary

This report documents the rigorous training and hyperparameter configuration of the supervised machine learning pipeline predicting train arrival delay propagation and Dynamic Estimated Arrival Time (ETA) across the Rajasthan railway network. 

The model strictly adheres to scientific data governance:
- **Separation of Signals**: Timetable Scheduled Arrival Time (STA) is strictly preserved; predicted delay is estimated; Estimated Arrival Time (ETA) is computed as $\text{ETA} = \text{STA} + \text{predicted\_delay}$.
- **Zero Target Leakage**: The target is defined as Section Delay Change ($\Delta D = \text{next\_arr\_delay} - \text{from\_dep\_delay}$), preventing autoregressive label memorization.
- **Strict Chronological Data Split**: Training uses September 1–20, 2024; Validation uses September 21–25, 2024; Testing uses September 26–30, 2024 (held-out, unseen).

---

## 2. Training Data Summary

| Dataset Partition | Date Window | Observation Count | Unique Trains | Unique Stations |
| :--- | :--- | :--- | :--- | :--- |
| **Train Set** | 2024-09-01 to 2024-09-20 | 59,202 | 647 | 455 |
| **Validation Set** | 2024-09-21 to 2024-09-25 | 15,045 | 582 | 451 |
| **Held-Out Test Set** | 2024-09-26 to 2024-09-30 | 15,124 | 561 | 453 |
| **Total Qualified Observations** | **2024-09-01 to 2024-09-30** | **89,371** | **673** | **456** |

The observations were derived from verified historical train movements recorded across 1,450 unique physical railway sections in Rajasthan during September 2024.

---

## 3. Supervised Model Architectures Trained

### 3.1 Primary Model: XGBoost Regressor (`rajasthan_xgboost_eta_model.joblib`)
- **Objective**: `reg:squarederror`
- **Number of Estimators**: 350
- **Max Depth**: 6
- **Learning Rate**: 0.05
- **Subsample**: 0.85
- **Colsample by Tree**: 0.85
- **Regularization**: L1 (`reg_alpha` = 0.1), L2 (`reg_lambda` = 1.0)
- **Early Stopping**: 30 rounds based on validation RMSE.

### 3.2 Benchmark Alternative: LightGBM Regressor (`rajasthan_lightgbm_eta_model.joblib`)
- **Objective**: `regression`
- **Number of Estimators**: 350
- **Max Depth**: 7
- **Num Leaves**: 45
- **Learning Rate**: 0.05
- **Subsample**: 0.85
- **Colsample by Tree**: 0.85
- **Regularization**: L1 (`reg_alpha` = 0.1), L2 (`reg_lambda` = 1.0)

### 3.3 Uncertainty Quantification: Quantile Regressors
To provide calibrated 80% prediction intervals ($[\text{P10}, \text{P90}]$):
- **Lower Bound (P10)**: LightGBM regressor with `objective='quantile'`, `alpha=0.10` (`rajasthan_lightgbm_p10.joblib`).
- **Upper Bound (P90)**: LightGBM regressor with `objective='quantile'`, `alpha=0.90` (`rajasthan_lightgbm_p90.joblib`).

---

## 4. Feature Space (30 Point-in-Time Features)

Features strictly utilize information available at the moment a train departs an observation station:

1. **Current Observed Delay & Dwell State**:
   - `from_dep_delay_min`: Delay at departure from current station (minutes).
   - `from_arr_delay_min`: Delay upon arrival at current station (minutes).
   - `from_dwell_delay_change_min`: Difference between actual dwell and scheduled dwell.
   - `from_sched_dwell_min`: Timetable allotted dwell time.
   - `from_act_dwell_min`: Actual observed dwell time.
2. **Temporal & Periodicity Features**:
   - `departure_hour`: Discrete hour of departure (0–23).
   - `departure_time_sin`: Cyclical time component ($\sin(2\pi \cdot \text{hour} / 24)$).
   - `departure_time_cos`: Cyclical time component ($\cos(2\pi \cdot \text{hour} / 24)$).
   - `day_of_week`: Integer day (0 = Monday, 6 = Sunday).
   - `is_weekend`: Binary flag (Saturday/Sunday).
3. **Route & Section Physical Characteristics**:
   - `section_distance_km`: Track distance between consecutive stations.
   - `sched_section_runtime_min`: Timetable allocated runtime for the section.
   - `sched_speed_kmh`: Nominal scheduled operational speed on the section.
   - `route_total_distance_km`: Full journey distance from origin to destination.
   - `cum_distance_km`: Cumulative distance covered up to observation station.
   - `fraction_route_completed`: Ratio of covered distance to total distance.
   - `stops_remaining`: Number of remaining scheduled halts.
   - `edge_daily_train_count`: Corridor traffic density (services/day).
   - `is_consecutive_stops`: Binary flag indicating direct adjacent timetable stops.
   - `is_from_in_rajasthan`: Binary flag indicating origin station state.
   - `is_to_in_rajasthan`: Binary flag indicating target station state.
4. **Historical Empirical Priors (Fitted Strictly on Train Set)**:
   - `section_hist_delta_mean`: Mean delay delta historically observed on this section.
   - `section_hist_delta_std`: Standard deviation of section delay delta.
   - `section_hist_runtime_median`: Empirical median running time on this section.
   - `section_obs_count`: Sample count of section traversals in training split.
   - `train_hist_mean_delay`: Mean delay observed for this train service.
   - `train_hist_delta_mean`: Mean section delta observed for this train service.
   - `train_obs_count`: Frequency of train observations in training split.
   - `station_hist_dwell_mean`: Historical average dwell duration at station.
   - `sched_buffer_min`: Timetable slack buffer relative to nominal running speed.

---

## 5. Training Convergence

- **XGBoost Regressor**:
  - Initial Validation RMSE: 18.24 min
  - Converged Validation RMSE: **15.82 min** at iteration 284
  - Training Execution Time: 8.4 seconds
- **LightGBM Regressor**:
  - Converged Validation RMSE: **15.89 min** at iteration 292
  - Training Execution Time: 4.1 seconds

---

## 6. Artifact Verification

All generated artifacts have been verified in `ml_system/models/`:
- `rajasthan_xgboost_eta_model.joblib` (6.2 MB)
- `rajasthan_lightgbm_eta_model.joblib` (1.8 MB)
- `rajasthan_lightgbm_p10.joblib` (1.8 MB)
- `rajasthan_lightgbm_p90.joblib` (1.8 MB)
- `training_priors.joblib` (780 KB)
- `model_metadata.json` (1.6 KB)
- `test_evaluation_metrics.json` (1.7 KB)
