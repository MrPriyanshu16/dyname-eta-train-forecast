"""
ml_system/src/models/train_rajasthan_eta_model.py

Production Training Pipeline for the Rajasthan Section Delay Propagation / ETA Model.
SIH 2026 Problem Statement 26028 | Ministry of Railways (Rajasthan Network Scope)

Strictly obeys chronological splitting:
- Train: 2024-09-01 to 2024-09-20 (59,202 rows)
- Validation: 2024-09-21 to 2024-09-25 (15,045 rows)
- Test: 2024-09-26 to 2024-09-30 (15,124 rows) (HELD-OUT UNSEEN)

Predicts Target B: delta_delay = arrival_delay_next - departure_delay_current
Then computes: predicted_delay = current_delay + delta_delay
               estimated_arrival = scheduled_arrival + predicted_delay
"""

import os
import sys
import time
import json
import numpy as np
import pandas as pd
import joblib

import xgboost as xgb
import lightgbm as lgb
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, median_absolute_error

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA_PATH = os.path.join(ROOT_DIR, "Datasets", "rajasthan", "rajasthan_section_training_observations.csv")
MODELS_DIR = os.path.join(ROOT_DIR, "ml_system", "models")
REPORTS_DIR = os.path.join(ROOT_DIR, "ml_system", "reports")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

def train_and_evaluate():
    print(f"Loading feature store from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    df['journey_date'] = pd.to_datetime(df['journey_date'])
    df = df.sort_values(by=['journey_date', 'train_number', 'from_sequence']).reset_index(drop=True)

    # 1. Strict Temporal Splitting
    train_mask = df['journey_date'] <= '2024-09-20'
    val_mask = (df['journey_date'] >= '2024-09-21') & (df['journey_date'] <= '2024-09-25')
    test_mask = df['journey_date'] >= '2024-09-26'

    train_df = df[train_mask].copy()
    val_df = df[val_mask].copy()
    test_df = df[test_mask].copy()

    print(f"Train split: {train_df['journey_date'].min().strftime('%Y-%m-%d')} to {train_df['journey_date'].max().strftime('%Y-%m-%d')} ({len(train_df)} rows, {train_df['train_number'].nunique()} trains)")
    print(f"Val split:   {val_df['journey_date'].min().strftime('%Y-%m-%d')} to {val_df['journey_date'].max().strftime('%Y-%m-%d')} ({len(val_df)} rows, {val_df['train_number'].nunique()} trains)")
    print(f"Test split:  {test_df['journey_date'].min().strftime('%Y-%m-%d')} to {test_df['journey_date'].max().strftime('%Y-%m-%d')} ({len(test_df)} rows, {test_df['train_number'].nunique()} trains)")

    # 2. Compute Historical Priors Strictly on the Training Set
    global_mean_delta = float(train_df['target_section_delay_change_min'].mean())
    global_median_runtime = float(train_df['target_next_actual_runtime_min'].median())

    section_stats = train_df.groupby(['from_station_code', 'to_station_code']).agg(
        section_hist_delta_mean=('target_section_delay_change_min', 'mean'),
        section_hist_delta_std=('target_section_delay_change_min', 'std'),
        section_hist_runtime_median=('target_next_actual_runtime_min', 'median'),
        section_obs_count=('journey_id', 'count')
    ).reset_index()

    train_stats = train_df.groupby('train_number').agg(
        train_hist_mean_delay=('from_dep_delay_min', 'mean'),
        train_hist_delta_mean=('target_section_delay_change_min', 'mean'),
        train_obs_count=('journey_id', 'count')
    ).reset_index()

    station_stats = train_df.groupby('from_station_code').agg(
        station_hist_dwell_mean=('from_act_dwell_min', 'mean')
    ).reset_index()

    priors = {
        'global_mean_delta': global_mean_delta,
        'global_median_runtime': global_median_runtime,
        'section_stats': section_stats.to_dict(orient='records'),
        'train_stats': train_stats.to_dict(orient='records'),
        'station_stats': station_stats.to_dict(orient='records')
    }
    joblib.dump(priors, os.path.join(MODELS_DIR, "training_priors.joblib"))

    def merge_features(dataset):
        m = dataset.merge(section_stats, on=['from_station_code', 'to_station_code'], how='left')
        m = m.merge(train_stats, on='train_number', how='left')
        m = m.merge(station_stats, on='from_station_code', how='left')
        m['section_hist_delta_mean'] = m['section_hist_delta_mean'].fillna(global_mean_delta)
        m['section_hist_delta_std'] = m['section_hist_delta_std'].fillna(0.0)
        m['section_hist_runtime_median'] = m['section_hist_runtime_median'].fillna(m['sched_section_runtime_min'])
        m['section_obs_count'] = m['section_obs_count'].fillna(0)
        m['train_hist_mean_delay'] = m['train_hist_mean_delay'].fillna(m['from_dep_delay_min'])
        m['train_hist_delta_mean'] = m['train_hist_delta_mean'].fillna(global_mean_delta)
        m['train_obs_count'] = m['train_obs_count'].fillna(0)
        m['station_hist_dwell_mean'] = m['station_hist_dwell_mean'].fillna(m['from_sched_dwell_min'])
        m['sched_buffer_min'] = m['sched_section_runtime_min'] - m['section_hist_runtime_median']
        return m

    train_feat = merge_features(train_df)
    val_feat = merge_features(val_df)
    test_feat = merge_features(test_df)

    feature_cols = [
        'from_dep_delay_min',
        'from_arr_delay_min',
        'from_dwell_delay_change_min',
        'from_sched_dwell_min',
        'from_act_dwell_min',
        'departure_hour',
        'departure_time_sin',
        'departure_time_cos',
        'day_of_week',
        'is_weekend',
        'section_distance_km',
        'sched_section_runtime_min',
        'sched_speed_kmh',
        'route_total_distance_km',
        'cum_distance_km',
        'fraction_route_completed',
        'stops_remaining',
        'edge_daily_train_count',
        'is_consecutive_stops',
        'is_from_in_rajasthan',
        'is_to_in_rajasthan',
        'section_hist_delta_mean',
        'section_hist_delta_std',
        'section_hist_runtime_median',
        'section_obs_count',
        'train_hist_mean_delay',
        'train_hist_delta_mean',
        'train_obs_count',
        'station_hist_dwell_mean',
        'sched_buffer_min'
    ]

    X_train = train_feat[feature_cols].values
    y_train_delta = train_feat['target_section_delay_change_min'].values

    X_val = val_feat[feature_cols].values
    y_val_delta = val_feat['target_section_delay_change_min'].values

    X_test = test_feat[feature_cols].values
    y_test_delta = test_feat['target_section_delay_change_min'].values
    y_test_arr_delay = test_feat['target_next_arr_delay_min'].values
    test_cur_delay = test_feat['from_dep_delay_min'].values

    # 3. Baseline Evaluation on Held-Out Test Set
    pred_arr_delay_base_a = np.zeros_like(y_test_arr_delay)
    pred_arr_delay_base_b = test_cur_delay

    def calc_metrics(y_pred, y_true):
        err = np.abs(y_pred - y_true)
        return {
            'mae': round(float(mean_absolute_error(y_true, y_pred)), 2),
            'rmse': round(float(root_mean_squared_error(y_true, y_pred)), 2),
            'medae': round(float(median_absolute_error(y_true, y_pred)), 2),
            'p5': round(float(np.mean(err <= 5.0) * 100.0), 1),
            'p10': round(float(np.mean(err <= 10.0) * 100.0), 1),
            'p15': round(float(np.mean(err <= 15.0) * 100.0), 1),
            'p30': round(float(np.mean(err <= 30.0) * 100.0), 1)
        }

    m_base_a = calc_metrics(pred_arr_delay_base_a, y_test_arr_delay)
    m_base_b = calc_metrics(pred_arr_delay_base_b, y_test_arr_delay)

    # 4. Train Primary Model: XGBoost Regressor
    print("\n--- Training XGBoost Regressor ---")
    t0 = time.time()
    xgb_model = xgb.XGBRegressor(
        n_estimators=250,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    xgb_model.fit(
        X_train, y_train_delta,
        eval_set=[(X_val, y_val_delta)],
        verbose=False
    )
    dur_xgb = time.time() - t0
    pred_delta_xgb = xgb_model.predict(X_test)
    pred_arr_delay_xgb = np.maximum(0.0, test_cur_delay + pred_delta_xgb)
    m_xgb = calc_metrics(pred_arr_delay_xgb, y_test_arr_delay)
    m_xgb['training_duration_s'] = round(dur_xgb, 2)
    joblib.dump(xgb_model, os.path.join(MODELS_DIR, "rajasthan_xgboost_eta_model.joblib"))

    # 5. Train Secondary Model: LightGBM Regressor
    print("\n--- Training LightGBM Regressor ---")
    t0 = time.time()
    lgb_model = lgb.LGBMRegressor(
        n_estimators=250,
        learning_rate=0.05,
        max_depth=7,
        num_leaves=31,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        verbose=-1
    )
    lgb_model.fit(
        X_train, y_train_delta,
        eval_set=[(X_val, y_val_delta)]
    )
    dur_lgb = time.time() - t0
    pred_delta_lgb = lgb_model.predict(X_test)
    pred_arr_delay_lgb = np.maximum(0.0, test_cur_delay + pred_delta_lgb)
    m_lgb = calc_metrics(pred_arr_delay_lgb, y_test_arr_delay)
    m_lgb['training_duration_s'] = round(dur_lgb, 2)
    joblib.dump(lgb_model, os.path.join(MODELS_DIR, "rajasthan_lightgbm_eta_model.joblib"))

    # 6. Train Quantile Models (P10, P90) for Data-Derived Prediction Intervals
    print("\n--- Training Quantile Models for Uncertainty (P10, P90) ---")
    lgb_p10 = lgb.LGBMRegressor(
        objective='quantile', alpha=0.1, n_estimators=150,
        learning_rate=0.05, max_depth=6, random_state=42, n_jobs=-1, verbose=-1
    )
    lgb_p10.fit(X_train, y_train_delta)
    joblib.dump(lgb_p10, os.path.join(MODELS_DIR, "rajasthan_lightgbm_p10.joblib"))

    lgb_p90 = lgb.LGBMRegressor(
        objective='quantile', alpha=0.9, n_estimators=150,
        learning_rate=0.05, max_depth=6, random_state=42, n_jobs=-1, verbose=-1
    )
    lgb_p90.fit(X_train, y_train_delta)
    joblib.dump(lgb_p90, os.path.join(MODELS_DIR, "rajasthan_lightgbm_p90.joblib"))

    pred_delta_p10 = lgb_p10.predict(X_test)
    pred_delta_p90 = lgb_p90.predict(X_test)
    pred_delay_p10 = np.maximum(0.0, test_cur_delay + pred_delta_p10)
    pred_delay_p90 = np.maximum(0.0, test_cur_delay + pred_delta_p90)
    coverage_80 = float(np.mean((y_test_arr_delay >= pred_delay_p10) & (y_test_arr_delay <= pred_delay_p90)) * 100.0)

    # 7. Compile Final Evaluation Metrics Object (For API & UI consumption)
    metrics_payload = {
        "status": "EVALUATED_ON_UNSEEN_TEST_SET",
        "active_model": "XGBoost Regressor (Active Operational)",
        "model_version": "2.1.0-rajasthan",
        "target_definition": "target_section_delay_change_min (delta = next_arr_delay - dep_delay)",
        "evaluation_period": "26 Sep – 30 Sep 2024",
        "test_observations": len(test_df),
        "mae_minutes": m_xgb['mae'],
        "rmse_minutes": m_xgb['rmse'],
        "median_absolute_error_minutes": m_xgb['medae'],
        "within_5_minutes_percent": m_xgb['p5'],
        "within_10_minutes_percent": m_xgb['p10'],
        "within_15_minutes_percent": m_xgb['p15'],
        "within_30_minutes_percent": m_xgb['p30'],
        "uncertainty_interval_80_coverage": round(coverage_80, 1),
        "baseline_comparison": [
            {
                "model": "Schedule Baseline (ETA=STA)",
                "mae": m_base_a['mae'],
                "rmse": m_base_a['rmse'],
                "medae": m_base_a['medae'],
                "within_5m": m_base_a['p5'],
                "within_10m": m_base_a['p10']
            },
            {
                "model": "Current Delay (ETA=STA+Delay)",
                "mae": m_base_b['mae'],
                "rmse": m_base_b['rmse'],
                "medae": m_base_b['medae'],
                "within_5m": m_base_b['p5'],
                "within_10m": m_base_b['p10']
            },
            {
                "model": "XGBoost Regressor (Active)",
                "mae": m_xgb['mae'],
                "rmse": m_xgb['rmse'],
                "medae": m_xgb['medae'],
                "within_5m": m_xgb['p5'],
                "within_10m": m_xgb['p10']
            },
            {
                "model": "LightGBM Regressor",
                "mae": m_lgb['mae'],
                "rmse": m_lgb['rmse'],
                "medae": m_lgb['medae'],
                "within_5m": m_lgb['p5'],
                "within_10m": m_lgb['p10']
            }
        ],
        "training_data": {
            "training_period": "01 Sep – 20 Sep 2024",
            "validation_period": "21 Sep – 25 Sep 2024",
            "test_period": "26 Sep – 30 Sep 2024",
            "train_observations": len(train_df),
            "val_observations": len(val_df),
            "test_observations": len(test_df),
            "feature_count": len(feature_cols),
            "unique_trains_test": int(test_df['train_number'].nunique()),
            "unique_stations_test": int(len(set(test_df['from_station_code']).union(set(test_df['to_station_code']))))
        }
    }

    # Save to JSON for backend and frontend
    metrics_path = os.path.join(MODELS_DIR, "test_evaluation_metrics.json")
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Metrics saved to {metrics_path}")

    # Metadata
    metadata_payload = {
        "model_name": "Rajasthan Section Delay Propagation XGBoost Regressor",
        "version": "2.1.0-rajasthan",
        "target": "target_section_delay_change_min",
        "features": feature_cols,
        "feature_count": len(feature_cols),
        "split_protocol": "Chronological (Sep 1-20 train, Sep 21-25 val, Sep 26-30 test)",
        "train_rows": len(train_df),
        "val_rows": len(val_df),
        "test_rows": len(test_df),
        "test_mae": m_xgb['mae'],
        "test_rmse": m_xgb['rmse'],
        "baseline_b_mae": m_base_b['mae'],
        "mae_improvement_percent": round(((m_base_b['mae'] - m_xgb['mae']) / m_base_b['mae']) * 100.0, 1),
        "artifacts": {
            "xgboost": "rajasthan_xgboost_eta_model.joblib",
            "lightgbm": "rajasthan_lightgbm_eta_model.joblib",
            "quantile_p10": "rajasthan_lightgbm_p10.joblib",
            "quantile_p90": "rajasthan_lightgbm_p90.joblib",
            "training_priors": "training_priors.joblib"
        }
    }
    with open(os.path.join(MODELS_DIR, "model_metadata.json"), 'w', encoding='utf-8') as f:
        json.dump(metadata_payload, f, indent=2)
    print("Model metadata saved.")

    print("\n=== FINAL TEST METRICS SUMMARY ===")
    print(f"Schedule Baseline:   MAE = {m_base_a['mae']}m, RMSE = {m_base_a['rmse']}m")
    print(f"Current Delay Base:  MAE = {m_base_b['mae']}m, RMSE = {m_base_b['rmse']}m")
    print(f"XGBoost Regressor:   MAE = {m_xgb['mae']}m, RMSE = {m_xgb['rmse']}m (Reduction: {metadata_payload['mae_improvement_percent']}%)")
    print(f"LightGBM Regressor:  MAE = {m_lgb['mae']}m, RMSE = {m_lgb['rmse']}m")

if __name__ == '__main__':
    train_and_evaluate()
