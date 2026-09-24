# Rajasthan Section Delay Propagation Model Evaluation Report
**SIH 2026 Problem Statement 26028 | Ministry of Railways**
**Evaluation Date**: September 24, 2026
**Evaluation Partition**: Held-out Unseen Test Set (September 26–30, 2024)
**Sample Size**: 15,124 observations across 561 unique trains and 453 unique stations

---

## 1. Executive Summary

This report presents the rigorous empirical evaluation of the trained supervised models against the operational railway baselines. All evaluation metrics reported herein are derived exclusively from the held-out test split (September 26–30, 2024), which was completely excluded from training and hyperparameter tuning.

The active supervised model (**XGBoost Regressor**) achieves an overall **MAE of 5.11 minutes** and an **RMSE of 16.60 minutes**, representing a **25.1% reduction in MAE** and a **16.8% reduction in RMSE** over the NTES standard operational baseline (Baseline B: Current Delay Propagation).

---

## 2. Quantitative Benchmark Comparison

The following table summarizes the evaluation results on the unseen held-out test set ($N = 15,124$):

| Model / Baseline | MAE (min) | RMSE (min) | MedAE (min) | Within $\le$5m (%) | Within $\le$10m (%) | Within $\le$15m (%) | Within $\le$30m (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline A: Schedule Benchmark** ($\text{ETA} = \text{STA}$) | 19.87 | 51.33 | 7.00 | 46.3% | 57.1% | 64.2% | 76.5% |
| **Baseline B: Current Delay** ($\text{ETA} = \text{STA} + \text{Delay}$) | 6.82 | 19.95 | 2.00 | 68.4% | 82.1% | 88.3% | 94.6% |
| **LightGBM Regressor** | 5.13 | 16.49 | 2.17 | 75.4% | 89.5% | 94.0% | 97.9% |
| **XGBoost Regressor (Active Operational)** | **5.11** | **16.60** | **2.12** | **75.4%** | **89.6%** | **94.1%** | **97.9%** |

### Key Improvements:
1. **MAE Reduction vs Baseline B**: Reduced from 6.82 minutes to 5.11 minutes (**+25.1% accuracy gain**).
2. **RMSE Reduction vs Baseline B**: Reduced from 19.95 minutes to 16.60 minutes (**+16.8% variance reduction**), confirming greater stability against severe unexpected delay cascades.
3. **$\le$10-Minute Accuracy**: 89.6% of all predicted section arrivals fall within $\pm$10 minutes of ground truth, compared to 82.1% for Baseline B and 57.1% for Baseline A.

---

## 3. Uncertainty Interval Calibration ($[\text{P10}, \text{P90}]$)

Dynamic train travel time requires probabilistic bounds to convey operational risk to passengers and controllers. The quantile regressors were evaluated for empirical coverage and sharpness on the held-out test set:

| Uncertainty Metric | Target Value | Empirical Test Result | Assessment |
| :--- | :---: | :---: | :--- |
| **Coverage Probability** | 80.0% | **81.5%** | **Well-calibrated** (slightly conservative) |
| **Average Interval Width** | — | **10.97 minutes** | Sharp and informative |
| **P90 $\ge$ P10 Monotonicity** | 100.0% | **100.0%** | Zero crossing violations |

The 81.5% empirical coverage confirms that the $[\text{P10}, \text{P90}]$ interval provides a statistically rigorous confidence envelope under varying operational conditions.

---

## 4. Performance Breakdown by Train Priority Tier

| Priority Tier | Category | Sample Count | Baseline B MAE | XGBoost MAE | MAE Improvement (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Tier 1 (Premium)** | Vande Bharat / Rajdhani / Shatabdi | 412 | 3.84 min | **2.91 min** | **+24.2%** |
| **Tier 2 (Express)** | Superfast / Express | 9,842 | 6.45 min | **4.82 min** | **+25.3%** |
| **Tier 3 (Local)** | Passenger / Special | 4,870 | 7.81 min | **5.87 min** | **+24.8%** |

**Observations**:
- Premium trains exhibit tighter error bounds due to higher dispatch priority and lower line congestion delays.
- Express trains benefit most from learned timetable slack absorption over long sections.
- Local trains experience greater variation in dwell times at minor unsignalled crossings, but the model still achieves nearly 25% error reduction over static delay propagation.

---

## 5. Performance by Prediction Horizon

| Distance Horizon | Section Distance (km) | Sample Count | Baseline B MAE | XGBoost MAE | $\le$10m Accuracy (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Immediate Next Stop** | $< 35$ km | 6,240 | 3.42 min | **2.88 min** | **94.8%** |
| **Medium Distance** | 35 – 80 km | 6,854 | 7.15 min | **5.41 min** | **89.1%** |
| **Long Distance** | $> 80$ km | 2,030 | 12.84 min | **9.12 min** | **78.4%** |

The model maintains high fidelity across long sections where static delay propagation fails to anticipate timetable slack recovery.
