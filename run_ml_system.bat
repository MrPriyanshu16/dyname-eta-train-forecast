@echo off
title TRACKLINE ML Inference Server
echo ========================================================
echo Starting TRACKLINE ML System API Server on http://localhost:8000
echo ========================================================
python ml_system/run_system.py --stage serve
pause
