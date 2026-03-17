Write-Host "Setting up backend..."
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt

Write-Host "Setting up frontend..."
Set-Location frontend
npm install
Set-Location ..

Write-Host "Done. Run backend: uvicorn app.main:app --app-dir backend --reload"
Write-Host "Run frontend: cd frontend; npm run dev"

