import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import xgboost as xgb
from ml_system.config.config import PROCESSED_DATA_DIR, MODELS_DIR, RANDOM_SEED
from ml_system.src.features.engineering import FEATURE_COLUMNS, TARGET_COLUMN_DEST
from ml_system.src.models.baselines import TimetableBaseline, DelayPropagationBaseline

def train_all_models():
    print("Loading engineered features...")
    train_df = pd.read_csv(PROCESSED_DATA_DIR / "train_features.csv")
    val_df = pd.read_csv(PROCESSED_DATA_DIR / "val_features.csv")
    test_df = pd.read_csv(PROCESSED_DATA_DIR / "test_features.csv")
    
    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN_DEST]
    
    X_val = val_df[FEATURE_COLUMNS]
    y_val = val_df[TARGET_COLUMN_DEST]
    
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df[TARGET_COLUMN_DEST]
    
    print(f"Training set: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
    
    # 1. Random Forest
    print("\n--- Training Model 1: Random Forest Regressor ---")
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        n_jobs=-1,
        random_state=RANDOM_SEED
    )
    rf_model.fit(X_train, y_train)
    rf_path = MODELS_DIR / "eta_rf.joblib"
    joblib.dump(rf_model, rf_path)
    print(f"Random Forest saved to {rf_path}")
    
    # 2. Gradient Boosting Regressor (LightGBM equivalent in scikit-learn)
    print("\n--- Training Model 2: Gradient Boosting Regressor ---")
    gbr_model = GradientBoostingRegressor(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        random_state=RANDOM_SEED
    )
    gbr_model.fit(X_train, y_train)
    gbr_path = MODELS_DIR / "eta_gbr.joblib"
    joblib.dump(gbr_model, gbr_path)
    print(f"Gradient Boosting saved to {gbr_path}")
    
    # 3. XGBoost Regressor
    print("\n--- Training Model 3: XGBoost Regressor ---")
    xgb_model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.07,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=RANDOM_SEED,
        n_jobs=-1
    )
    xgb_model.fit(X_train, y_train)
    xgb_path = MODELS_DIR / "eta_xgboost.joblib"
    joblib.dump(xgb_model, xgb_path)
    print(f"XGBoost saved to {xgb_path}")
    
    # 4. Train Uncertainty Quantile Models (10th percentile and 90th percentile for 80% Prediction Interval)
    print("\n--- Training Quantile Models for 80% Prediction Intervals ---")
    q_low_model = GradientBoostingRegressor(
        loss='quantile',
        alpha=0.10,
        n_estimators=80,
        max_depth=4,
        learning_rate=0.08,
        random_state=RANDOM_SEED
    )
    q_low_model.fit(X_train, y_train)
    joblib.dump(q_low_model, MODELS_DIR / "eta_q_low.joblib")
    
    q_high_model = GradientBoostingRegressor(
        loss='quantile',
        alpha=0.90,
        n_estimators=80,
        max_depth=4,
        learning_rate=0.08,
        random_state=RANDOM_SEED
    )
    q_high_model.fit(X_train, y_train)
    joblib.dump(q_high_model, MODELS_DIR / "eta_q_high.joblib")
    print("Quantile models saved.")
    
    # Extract Feature Importance from XGBoost
    importances = xgb_model.feature_importances_
    feat_imp = {
        col: round(float(imp), 4)
        for col, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
    }
    
    metadata = {
        "model_version": "1.0.0",
        "primary_model": "XGBoostRegressor",
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN_DEST,
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "feature_importances": feat_imp
    }
    
    meta_path = MODELS_DIR / "model_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to {meta_path}")
    print("\nFeature Importances:")
    for f_name, imp in feat_imp.items():
        print(f"  • {f_name:25s}: {imp * 100:.2f}%")

if __name__ == "__main__":
    train_all_models()
