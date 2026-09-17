import sys
import argparse
import subprocess
import uvicorn
from pathlib import Path

def run_pipeline(stage: str):
    print(f"\n=======================================================")
    print(f"  TRACKLINE ML SYSTEM ORCHESTRATOR | STAGE: {stage.upper()}")
    print(f"=======================================================\n")
    
    if stage in ['all', 'data']:
        print("[1/5] Ingesting and building raw master datasets...")
        from ml_system.src.data.load_data import (
            build_station_master,
            build_train_master,
            build_sections_master,
            build_train_routes,
            generate_historical_runs,
            generate_telemetry_stream
        )
        build_station_master()
        build_train_master()
        build_sections_master()
        build_train_routes()
        generate_historical_runs(n_trips=8000)
        generate_telemetry_stream()

    if stage in ['all', 'clean']:
        print("\n[2/5] Cleaning and creating strict chronological splits...")
        from ml_system.src.preprocessing.cleaner import clean_and_profile_data
        clean_and_profile_data()

    if stage in ['all', 'features']:
        print("\n[3/5] Engineering anti-leakage features...")
        from ml_system.src.features.engineering import build_features
        build_features()

    if stage in ['all', 'train']:
        print("\n[4/5] Training Random Forest, GBR, XGBoost, and Quantile Regressors...")
        from ml_system.src.models.train import train_all_models
        train_all_models()

    if stage in ['all', 'eval']:
        print("\n[5/5] Running offline chronological evaluation against baselines...")
        from ml_system.src.evaluation.error_analysis import run_comprehensive_evaluation
        run_comprehensive_evaluation()

    if stage in ['all', 'test']:
        print("\nRunning automated unit tests...")
        res = subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "ml_system/tests", "-p", "test_*.py", "-v"])
        if res.returncode != 0:
            sys.exit(res.returncode)

    if stage == 'serve':
        print("\nStarting TRACKLINE FastAPI Inference Server on http://127.0.0.1:8000 ...")
        # Ensure root workspace is in sys.path
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from ml_system.src.api.main import app
        uvicorn.run(app, host="127.0.0.1", port=8000)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="TRACKLINE ML System Orchestrator")
    parser.add_argument("--stage", type=str, default="all", choices=["all", "data", "clean", "features", "train", "eval", "test", "serve"])
    args = parser.parse_args()
    run_pipeline(args.stage)
