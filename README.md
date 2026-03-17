# AI-Driven Spatio-Temporal Drift Detection

A full-stack monitoring platform for detecting live drift across space, environmental, and biological proxy signals.

The project combines a FastAPI backend, a React frontend, and real-world data feeds to surface anomaly signals, severity scoring, and location-aware drift reports.

## What This Project Does

- Collects live multi-domain signals from public data providers
- Detects drift using rolling baselines and change-detection methods
- Exposes API endpoints for health, snapshots, reports, and training
- Visualizes signals and anomalies in a React + MapLibre dashboard

## Tech Stack

- Backend: FastAPI, Python
- Frontend: React, Vite, MapLibre
- Drift logic: z-score, PSI-style shift scoring, ADWIN
- Infra: Docker Compose, PowerShell dev scripts

## Project Structure

- `backend/` API, schemas, services, tests
- `frontend/` UI application
- `data/` raw and processed data artifacts
- `infra/` local runtime configuration
- `scripts/` development and bootstrap scripts

## Live Data Sources

This project is wired to public live or regularly updated sources, including:

- NOAA SWPC for geomagnetic and solar activity signals
- Open-Meteo for air quality and weather signals
- NOAA GML for atmospheric CO2 trend data
- NASA/ORNL MODIS NDVI subset API for vegetation proxy signals
- GBIF occurrence search for animal movement proxy data
- NOAA ERDDAP chlorophyll-a where dataset availability allows

## Drift Detection Approach

- Rolling baseline comparisons
- Per-feature z-score evaluation
- PSI-like normalized distribution shift scoring
- ADWIN online change detection
- Global severity classification: `low`, `moderate`, `high`, `critical`

## Run Locally

### Quick Start

1. Create your local environment file from `.env.example`.
2. Start the app with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action start
```

Useful commands:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action status
powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action logs
powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action restart
powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action stop
```

### Manual Setup

Backend:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn app.main:app --app-dir backend --reload
```

Frontend:

```powershell
cd frontend
Copy-Item .env.example .env -Force
npm install
npm run dev
```

## Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## API Endpoints

- `GET /health`
- `GET /api/v1/live/snapshot?lat=..&lon=..`
- `GET /api/v1/drift/report?lat=..&lon=..`
- `POST /api/v1/models/train?hours=2160`

## Notes

- Real online data sources are used instead of hardcoded demo values.
- Some biology-related signals are proxy-based because direct real-time bio telemetry is rarely public.
- Sensitive local files such as `.env` are intentionally excluded from version control.
