import numpy as np
import pandas as pd
from typing import Dict, Any

def compute_all_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
    """
    Computes all standard regression and railway punctuality tolerance metrics:
    - MAE (Mean Absolute Error in minutes)
    - RMSE (Root Mean Squared Error in minutes)
    - Median Absolute Error (robust to extreme outliers)
    - Punctuality Tolerance:
        * within ±5 minutes
        * within ±10 minutes
        * within ±15 minutes
        * within ±30 minutes
    - Explained Variance (R^2)
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    
    errors = y_pred - y_true
    abs_errors = np.abs(errors)
    
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    med_ae = float(np.median(abs_errors))
    
    total = len(y_true)
    pct_5 = float(np.sum(abs_errors <= 5.0) / total * 100.0)
    pct_10 = float(np.sum(abs_errors <= 10.0) / total * 100.0)
    pct_15 = float(np.sum(abs_errors <= 15.0) / total * 100.0)
    pct_30 = float(np.sum(abs_errors <= 30.0) / total * 100.0)
    
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 0 else 0.0
    
    return {
        "mae_minutes": round(mae, 2),
        "rmse_minutes": round(rmse, 2),
        "median_ae_minutes": round(med_ae, 2),
        "r2_score": round(r2, 4),
        "within_5_min_pct": round(pct_5, 2),
        "within_10_min_pct": round(pct_10, 2),
        "within_15_min_pct": round(pct_15, 2),
        "within_30_min_pct": round(pct_30, 2),
        "sample_count": total
    }
