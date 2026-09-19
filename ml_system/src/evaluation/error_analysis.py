import json
import joblib
import numpy as np
import pandas as pd
from ml_system.config.config import PROCESSED_DATA_DIR, MODELS_DIR
from ml_system.src.features.engineering import FEATURE_COLUMNS, TARGET_COLUMN_DEST
from ml_system.src.models.baselines import (
    ScheduleBasedRemainingTimeBaseline,
    CurrentDelayPropagationBaseline,
    HistoricalSectionMedianBaseline,
    DelayRecoveryBaseline
)
from ml_system.src.evaluation.metrics import compute_all_metrics

def run_comprehensive_evaluation():
    print("Loading test features for strict chronological evaluation...")
    test_df = pd.read_csv(PROCESSED_DATA_DIR / "test_features.csv")
    X_test = test_df[FEATURE_COLUMNS]
    y_true = test_df[TARGET_COLUMN_DEST].values
    
    # 1. Evaluate Baselines
    b1 = ScheduleBasedRemainingTimeBaseline()
    y_pred_b1 = b1.predict(test_df)
    metrics_b1 = compute_all_metrics(y_true, y_pred_b1)
    
    b2 = CurrentDelayPropagationBaseline()
    y_pred_b2 = b2.predict(test_df)
    metrics_b2 = compute_all_metrics(y_true, y_pred_b2)

    b3 = HistoricalSectionMedianBaseline()
    y_pred_b3 = b3.predict(test_df)
    metrics_b3 = compute_all_metrics(y_true, y_pred_b3)

    b4 = DelayRecoveryBaseline()
    y_pred_b4 = b4.predict(test_df)
    metrics_b4 = compute_all_metrics(y_true, y_pred_b4)
    
    # 2. Evaluate ML Models
    rf_model = joblib.load(MODELS_DIR / "eta_rf.joblib")
    y_pred_rf = rf_model.predict(X_test)
    metrics_rf = compute_all_metrics(y_true, y_pred_rf)
    
    hgbr_model = joblib.load(MODELS_DIR / "eta_hgbr.joblib")
    y_pred_hgbr = hgbr_model.predict(X_test)
    metrics_hgbr = compute_all_metrics(y_true, y_pred_hgbr)
    
    xgb_model = joblib.load(MODELS_DIR / "eta_xgboost.joblib")
    y_pred_xgb = xgb_model.predict(X_test)
    metrics_xgb = compute_all_metrics(y_true, y_pred_xgb)
    
    overall_comparison = {
        "Baseline_1_Schedule_Based": metrics_b1,
        "Baseline_2_Current_Delay_Propagation": metrics_b2,
        "Baseline_3_Historical_Section_Median": metrics_b3,
        "Baseline_4_Delay_Recovery": metrics_b4,
        "Model_1_Random_Forest": metrics_rf,
        "Model_2_HistGradientBoosting": metrics_hgbr,
        "Model_3_XGBoost": metrics_xgb
    }
    
    # Sliced Error Analysis using the Best Model (XGBoost)
    test_df['pred_xgb'] = y_pred_xgb
    test_df['error_xgb'] = np.abs(y_pred_xgb - y_true)
    test_df['pred_dp'] = y_pred_b2
    test_df['error_dp'] = np.abs(y_pred_b2 - y_true)
    
    # Slices:
    # 1. By Train Priority Tier
    tier_names = {
        1: "Tier 1: Vande Bharat / Rajdhani",
        2: "Tier 2: Shatabdi",
        3: "Tier 3: Superfast",
        4: "Tier 4: Express",
        5: "Tier 5: Passenger / MEMU / Suburban"
    }
    by_tier = {}
    for tier, grp in test_df.groupby('priority_tier'):
        name = tier_names.get(tier, f"Tier {tier}")
        by_tier[name] = {
            "sample_count": len(grp),
            "mae_ntes": round(float(grp['error_dp'].mean()), 2),
            "mae_ml": round(float(grp['error_xgb'].mean()), 2),
            "improvement_pct": round(float((1 - grp['error_xgb'].mean() / max(0.01, grp['error_dp'].mean())) * 100), 1)
        }
        
    # 2. By Distance Remaining Horizon
    test_df['dist_bracket'] = pd.cut(
        test_df['distance_remaining'],
        bins=[-1, 50, 150, 300, 9999],
        labels=["Immediate (< 50 km)", "Short (50-150 km)", "Medium (150-300 km)", "Long (> 300 km)"]
    )
    by_horizon = {}
    for b_name, grp in test_df.groupby('dist_bracket', observed=True):
        by_horizon[str(b_name)] = {
            "sample_count": len(grp),
            "mae_ntes": round(float(grp['error_dp'].mean()), 2),
            "mae_ml": round(float(grp['error_xgb'].mean()), 2),
            "improvement_pct": round(float((1 - grp['error_xgb'].mean() / max(0.01, grp['error_dp'].mean())) * 100), 1)
        }
        
    # 3. By Delay Level
    test_df['delay_bracket'] = pd.cut(
        test_df['current_delay_min'],
        bins=[-1, 5, 15, 30, 60, 9999],
        labels=["0-5m (On-time/Near)", "5-15m (Minor delay)", "15-30m (Moderate delay)", "30-60m (High delay)", "> 60m (Severe delay)"]
    )
    by_delay = {}
    for d_name, grp in test_df.groupby('delay_bracket', observed=True):
        by_delay[str(d_name)] = {
            "sample_count": len(grp),
            "mae_ntes": round(float(grp['error_dp'].mean()), 2),
            "mae_ml": round(float(grp['error_xgb'].mean()), 2),
            "improvement_pct": round(float((1 - grp['error_xgb'].mean() / max(0.01, grp['error_dp'].mean())) * 100), 1)
        }
        
    # 4. By Fog / Weather Condition
    test_df['is_foggy'] = np.where(test_df['weather_fog_index'] > 0.2, "Foggy (Visibility Restricted)", "Clear Weather")
    by_weather = {}
    for w_name, grp in test_df.groupby('is_foggy'):
        by_weather[str(w_name)] = {
            "sample_count": len(grp),
            "mae_ntes": round(float(grp['error_dp'].mean()), 2),
            "mae_ml": round(float(grp['error_xgb'].mean()), 2),
            "improvement_pct": round(float((1 - grp['error_xgb'].mean() / max(0.01, grp['error_dp'].mean())) * 100), 1)
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
    print(f"{'Model / Baseline':<36s} | {'MAE (m)':<8s} | {'RMSE (m)':<8s} | {'±15m (%)':<8s} | {'R^2':<6s}")
    print(f"--------------------------------------------------------------------------")
    for m_name, m_res in overall_comparison.items():
        print(f"{m_name:<36s} | {m_res['mae_minutes']:<8.2f} | {m_res['rmse_minutes']:<8.2f} | {m_res['within_15_min_pct']:<8.1f} | {m_res['r2_score']:<6.3f}")
    print(f"==========================================================================")
    print(f"Full sliced evaluation report saved to {out_path}")
    return evaluation_report

if __name__ == "__main__":
    run_comprehensive_evaluation()
