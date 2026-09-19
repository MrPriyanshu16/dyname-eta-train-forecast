# Model Card: All-India Dynamic Coaching Train ETA Predictor

## Model Details
- **Developer**: Machine Learning Systems Engineering Team
- **Model Version**: 1.1.0
- **Model Date**: September 2026
- **Architecture**: Gradient Boosted Decision Trees (XGBoost Regressor) + Dual Quantile Regressors ($P_{10}$, $P_{90}$)
- **License**: Ministry of Railways Problem Statement ID: 26028

## Intended Use
- **Primary Use Case**: Dynamic, real-time forecast of Expected Time of Arrival (ETA) for coaching trains across Indian Railways.
- **Out of Scope**: Freight train scheduling, crew rostering, automatic signalling interlock control.

## Feature Importances (Top Predictive Drivers)
| Feature Name | Description | Relative Importance |
| :--- | :--- | :---: |
| `distance_remaining` | Feature driver | **53.23%** |
| `hist_station_avg_delay` | Feature driver | **35.07%** |
| `priority_tier` | Feature driver | **4.82%** |
| `distance_from_origin` | Feature driver | **2.56%** |
| `weather_fog_index` | Feature driver | **1.06%** |
| `journey_progress_ratio` | Feature driver | **1.05%** |
| `hour_sin` | Feature driver | **0.99%** |
| `is_junction_ahead` | Feature driver | **0.73%** |
| `hour_cos` | Feature driver | **0.31%** |
| `current_delay_min` | Feature driver | **0.07%** |
| `headway_km` | Feature driver | **0.03%** |
| `section_occupancy_ratio` | Feature driver | **0.03%** |
| `day_of_week` | Feature driver | **0.02%** |
| `is_weekend` | Feature driver | **0.02%** |
| `hist_train_avg_delay` | Feature driver | **0.00%** |

## Training Data & Generalization Universe
- Sourced from open-source railway reference master (`datameet/railways`) dynamically computing entity counts (~5,208 trains, ~8,990 stations).
- Empirical historical running delay distributions calibrated from audited national running records.
- Includes Passenger, MEMU, Suburban Local, Express, Superfast, Shatabdi, Rajdhani, and Vande Bharat coaching services.
