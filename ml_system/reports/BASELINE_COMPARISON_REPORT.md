# Indian Railways Dynamic ETA: Operational Baseline Comparison Report

## Executive Summary
This report evaluates the Machine Learning Dynamic ETA model against four domain-standard operational baselines across a strictly chronological, non-overlapping test partition of coaching train movements.

## Evaluation Results Table (Chronological Test Partition, N = 5,501)

| Model / Baseline | MAE (min) | RMSE (min) | MedAE (min) | R² Score | ±10m Punctuality (%) | ±15m Punctuality (%) | ±30m Punctuality (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline 1: Schedule-Based Remaining Time** | 61.89 | 86.32 | 49.27 | 0.7122 | 26.6% | 29.47% | 39.03% |
| **Baseline 2: Current Delay Propagation** | 74.53 | 94.02 | 63.76 | 0.6586 | 9.38% | 13.71% | 26.61% |
| **Baseline 3: Historical Section Median** | 44.58 | 65.32 | 29.27 | 0.8352 | 32.7% | 37.97% | 50.86% |
| **Baseline 4: Delay Recovery Model** | 78.24 | 100.0 | 64.23 | 0.6138 | 9.2% | 13.98% | 27.1% |
| **Model 1: Random Forest Regressor** | 17.81 | 26.05 | 13.16 | 0.9738 | 43.39% | 54.24% | 78.44% |
| **Model 2: HistGradientBoosting (LightGBM)** | 17.85 | 25.91 | 13.17 | 0.9741 | 43.65% | 54.08% | 78.71% |
| **Model 3: XGBoost Regressor (Primary)** | **17.86** | **25.92** | **13.22** | **0.9741** | **42.76%** | **53.63%** | **78.53%** |

## Key Findings
1. **Error Reduction over Current NTES Delay Propagation**:
   - Baseline 2 (Current Delay Propagation) yields an MAE of **74.53 min**.
   - Primary XGBoost achieves an MAE of **17.86 min**, delivering an absolute error reduction of **56.67 min** (**76.0% improvement**).
2. **Failure Modes of Baselines**:
   - **Baseline 1 (Schedule)** fails because delay accumulation is not reflected in scheduled remaining duration.
   - **Baseline 2 (Propagation)** assumes linear invariance: it cannot model section recovery or non-linear delay cascading at junction choke points.
   - **Baseline 3 (Historical Median)** fails to incorporate real-time headways, current accumulated delay, and seasonal fog.
3. **Punctuality Tolerance Gain**:
   - Trains predicted within ±15 minutes jumped from **13.71%** under Baseline 2 to **53.63%** under XGBoost.
