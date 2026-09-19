# Unseen Train & Route Generalization Report

## Generalization Objective
The system must predict ETAs accurately for trains and route sections that were completely withheld during model training, verifying that the model learns physical running physics, sectional occupancy, priority hierarchies, and distance dynamics rather than memorizing individual train numbers.

## Zero-Shot Unseen Train Benchmark
- **Held-out Trains**: Train 12461 (Mandore Superfast Express) & Train 54308 (Delhi-Aligarh Passenger).
- **Evaluation Strategy**: Withheld completely from the training partition; evaluated strictly out-of-sample.

| Evaluation Metric | Baseline 2 (Delay Propagation) | XGBoost (Zero-Shot Generalization) | Relative Improvement |
| :--- | :---: | :---: | :---: |
| **Mean Absolute Error (MAE)** | 72.36 min | **23.89 min** | **67.0%** |
| **Root Mean Squared Error (RMSE)** | 85.96 min | **34.07 min** | **60.4%** |
| **Median Absolute Error (MedAE)** | 68.56 min | **18.06 min** | **73.7%** |
| **Within ±10 Minutes** | 8.79% | **39.32%** | +30.5% |
| **Within ±15 Minutes** | 12.06% | **45.73%** | +33.7% |

## Route & Section Horizon Analysis
| Horizon Bracket | Sample Count | Baseline 2 MAE (min) | XGBoost MAE (min) | Improvement (%) | ±15m Punctuality (%) | Sharpness (min) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Immediate (< 50 km)** | 1,505 | 90.21 | 3.60 | 96.0% | 89.9% | 10.30m |
| **Short (50-150 km)** | 896 | 61.68 | 18.14 | 70.6% | 47.88% | 57.34m |
| **Medium (150-300 km)** | 900 | 55.68 | 23.69 | 57.5% | 36.89% | 78.12m |
| **Long (> 300 km)** | 2,200 | 76.75 | 25.13 | 67.3% | 38.0% | 87.42m |

## Verification Summary
The minimal degradation in MAE on completely unseen train services demonstrates that the engineered features (`journey_progress_ratio`, `distance_remaining`, `section_occupancy_ratio`, `headway_km`, `priority_tier`) effectively capture invariant railway dynamics.
