# AI-Driven Spatio-Temporal Drift Detection (Astro-Biochemical)

Production-style multi-domain platform for live drift detection across:
- Space physics
- Environmental chemistry
- Biological proxies

## Architecture

- `backend/` FastAPI data + drift engine
- `frontend/` React + MapLibre Windy-style monitoring UI
- `data/` raw and processed artifacts
- `infra/` Docker Compose runtime
- `scripts/` bootstrap scripts

## Live Data Sources Wired

- Geomagnetic Kp index: NOAA SWPC
- Solar wind speed: NOAA SWPC
- Solar radiation intensity (X-ray flux): NOAA SWPC GOES
- Cosmic ray flux proxy (proton flux): NOAA SWPC GOES
- Ozone concentration: Open-Meteo Air Quality
- Temperature and humidity: Open-Meteo Forecast
- Atmospheric CO2: NOAA GML Mauna Loa trend CSV
- Plant growth index: NASA/ORNL MODIS NDVI subset API
- Animal movement proxy: GBIF occurrence search
- Human circadian activity proxy: day-night thermal delta from hourly weather
- Microbial activity proxy: NOAA ERDDAP chlorophyll-a (dataset availability dependent)

## Drift Detection

- Per-feature z-score vs baseline window
- PSI-like normalized distribution shift score
- Online ADWIN change detection (river)
- Global drift score + severity (`low`, `moderate`, `high`, `critical`)

## Run Locally

1. Copy `.env.example` to `.env` and fill API keys when needed.
2. Fastest way (recommended):
   - `powershell -ExecutionPolicy Bypass -File scripts\run-dev.ps1`
   - New execution controller (better):
   - `powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action start`
   - `powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action status`
   - `powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action logs`
   - `powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action restart`
   - `powershell -ExecutionPolicy Bypass -File scripts\devctl.ps1 -Action stop`
3. Manual mode if needed:
   - Backend:
   - `python -m venv .venv`
   - `. .\.venv\Scripts\Activate.ps1`
   - `pip install -r backend\requirements.txt`
   - `uvicorn app.main:app --app-dir backend --reload`
   - Frontend:
   - `cd frontend`
   - `Copy-Item .env.example .env -Force`
   - `npm install`
   - `npm run dev`

Frontend opens at `http://localhost:5173`, backend at `http://localhost:8000`.

## API Endpoints

- `GET /health`
- `GET /api/v1/live/snapshot?lat=..&lon=..`
- `GET /api/v1/drift/report?lat=..&lon=..`
- `POST /api/v1/models/train?hours=2160`

## Important Notes

- This stack only uses real online endpoints; no hardcoded demo values are injected.
- Some biology signals are proxies where direct open real-time bio telemetry is not universally available without private data contracts.
- To make biological channels fully direct (not proxy-based), connect authenticated datasets (e.g., Movebank studies, wearable APIs, lab sensor feeds) in `backend/app/services/providers.py`.
