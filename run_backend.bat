@echo off
title Dynamic Rail ETA - Backend Server
echo ========================================================
echo Starting FastAPI Telemetry Server on http://localhost:8000
echo ========================================================
python -m uvicorn backend.main:app --port 8000 --reload
pause
