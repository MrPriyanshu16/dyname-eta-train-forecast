import json
import joblib
import numpy as np
import pandas as pd
from ml_system.config.config import PROCESSED_DATA_DIR, MODELS_DIR
from ml_system.src.features.engineering import FEATURE_COLUMNS, TARGET_COLUMN_DEST
from ml_system.src.models.baselines import TimetableBaseline, DelayPropagationBaseline
from ml_system.src.evaluation.metrics import compute_all_metrics

def run_comprehensive_evaluation():
    print("Loading test features for strict chronological evaluation...")
    test_df = pd.read_csv(PROCESSED_DATA_DIR / "test_features.csv")
    X_test = test_df[FEATURE_COLUMNS]
    y_true = test_df[TARGET_COLUMN_DEST].values
    
    # 1. Evaluate Baselines
    tt_baseline = TimetableBaseline()
    y_pred_tt = tt_baseline.predict(test_df)
    metrics_tt = compute_all_metrics(y_true, y_pred_tt)
    
    dp_baseline = DelayPropagationBaseline()
    y_pred_dp = dp_baseline.predict(test_df)
    metrics_dp = compute_all_metrics(y_true, y_pred_dp)
    
    # 2. Evaluate ML Models
    rf_model = joblib.load(MODELS_DIR / "eta_rf.joblib")
    y_pred_rf = rf_model.predict(X_test)
    metrics_rf = compute_all_metrics(y_true, y_pred_rf)
    
    gbr_model = joblib.load(MODELS_DIR / "eta_gbr.joblib")
    y_pred_gbr = gbr_model.predict(X_test)
    metrics_gbr = compute_all_metrics(y_true, y_pred_gbr)
    
    xgb_model = joblib.load(MODELS_DIR / "eta_xgboost.joblib")
    y_pred_xgb = xgb_model.predict(X_test)
    metrics_xgb = compute_all_metrics(y_true, y_pred_xgb)
    
    overall_comparison = {
        "Baseline_1_Timetable": metrics_tt,
        "Baseline_2_Delay_Propagation_NTES": metrics_dp,
        "Model_1_Random_Forest": metrics_rf,
        "Model_2_Gradient_Boosting": metrics_gbr,
        "Model_3_XGBoost": metrics_xgb
    }
    
    # Sliced Error Analysis using the Best Model (XGBoost)
    test_df['pred_xgb'] = y_pred_xgb
    test_df['error_xgb'] = np.abs(y_pred_xgb - y_true)
    test_df['pred_dp'] = y_pred_dp
    test_df['error_dp'] = np.abs(y_pred_dp - y_true)
    
    # Slices:
    # 1. By Train Priority Tier
    tier_names = {1: "Tier 1: Vande Bharat / Rajdhani", 2: "Tier 2: Shatabdi", 3: "Tier 3: Superfast", 4: "Tier 4: Express"}
    by_tier = {}
    for tier, grp in test_df.groupby('priority_tier'):
        name = tier_names.get(tier, f"Tier {tier}")
        by_tier[name] = {
            "sample_count": len(grp),
            "mae_ntes": round(float(grp['error_dp'].mean()), 2),
            "mae_ml": round(float(grp['error_xgb'].mean()), 2),
            "improvement_pct": round(float((1 - grp['error_xgb'].mean() / grp['error_dp'].mean()) * 100), 1)
        }
        
    # 2. By Distance Remaining Horizon
    test_df['dist_bracket'] = pd.cut(
        test_df['distance_remaining'],
        bins=[-1, 100, 250, 500],
        labels=["< 100 km (Short horizon)", "100-250 km (Mid horizon)", "> 250 km (Long horizon)"]
    )
    by_horizon = {}
    for b_name, grp in test_df.groupby('dist_bracket', observed=True):
        by_horizon[str(b_name)] = {
            "sample_count": len(grp),
            "mae_ntes": round(float(grp['error_dp'].mean()), 2),
            "mae_ml": round(float(grp['error_xgb'].mean()), 2),
            "improvement_pct": round(float((1 - grp['error_xgb'].mean() / grp['error_dp'].mean()) * 100), 1)
        }
        
    # 3. By Delay Level
    test_df['delay_bracket'] = pd.cut(
        test_df['current_delay_min'],
        bins=[-20, 15, 45, 300],
        labels=["On-time to Small (<= 15m)", "Moderate delay (15-45m)", "Severe delay (> 45m)"]
    )
    by_delay = {}
    for d_name, grp in test_df.groupby('delay_bracket', observed=True):
        by_delay[str(d_name)] = {
            "sample_count": len(grp),
            "mae_ntes": round(float(grp['error_dp'].mean()), 2),
            "mae_ml": round(float(grp['error_xgb'].mean()), 2),
            "improvement_pct": round(float((1 - grp['error_xgb'].mean() / grp['error_dp'].mean()) * 100), 1)
        }
        
    # 4. By Fog / Weather Condition
    test_df['is_foggy'] = np.where(test_df['weather_fog_index'] > 0.2, "Foggy (Visibility Restricted)", "Clear Weather")
    by_weather = {}
    for w_name, grp in test_df.groupby('is_foggy'):
        by_weather[str(w_name)] = {
            "sample_count": len(grp),
            "mae_ntes": round(float(grp['error_dp'].mean()), 2),
            "mae_ml": round(float(grp['error_xgb'].mean()), 2),
            "improvement_pct": round(float((1 - grp['error_xgb'].mean() / grp['error_dp'].mean()) * 100), 1)
        }
        
    evaluation_report = {
        "overall_model_comparison": overall_comparison,
        "error_analysis_by_priority_tier": by_tier,
        "error_analysis_by_prediction_horizon": by_horizon,
        "error_analysis_by_current_delay": by_delay,
        "error_analysis_by_weather": by_weather
    }
    
    out_path = PROCESSED_DATA_DIR / "evaluation_report.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_report, f, indent=2)
        
    print(f"\n==========================================================================")
    print(f"               OFFLINE CHRONOLOGICAL EVALUATION RESULTS                   ")
    print(f"==========================================================================")
    print(f"{'Model / Baseline':<35s} | {'MAE (m)':<8s} | {'RMSE (m)':<8s} | {'±15m (%)':<8s} | {'R^2':<6s}")
    print(f"--------------------------------------------------------------------------")
    for m_name, m_res in overall_comparison.items():
        print(f"{m_name:<35s} | {m_res['mae_minutes']:<8.2f} | {m_res['rmse_minutes']:<8.2f} | {m_res['within_15_min_pct']:<8.1f} | {m_res['r2_score']:<6.3f}")
    print(f"==========================================================================")
    print(f"Full sliced evaluation report saved to {out_path}")
    return evaluation_report

if __name__ == "__main__":
    run_comprehensive_evaluation()
