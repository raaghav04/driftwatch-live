param(
    [ValidateSet("start", "stop", "restart", "status", "logs")]
    [string]$Action = "start",
    [string]$ProjectRoot = "C:\Users\L H Avinassh\Documents\proj"
)

$ErrorActionPreference = "Stop"
$RuntimeDir = Join-Path $ProjectRoot ".runtime"
$BackendPidFile = Join-Path $RuntimeDir "backend.pid"
$FrontendPidFile = Join-Path $RuntimeDir "frontend.pid"
$BackendLog = Join-Path $RuntimeDir "backend.log"
$BackendErr = Join-Path $RuntimeDir "backend.err.log"
$FrontendLog = Join-Path $RuntimeDir "frontend.log"
$FrontendErr = Join-Path $RuntimeDir "frontend.err.log"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Get-PidFromFile([string]$path) {
    if (-not (Test-Path $path)) { return $null }
    $raw = (Get-Content -Raw $path).Trim()
    if (-not $raw) { return $null }
    try { return [int]$raw } catch { return $null }
}

function Test-Alive([int]$procId) {
    if (-not $procId) { return $false }
    return [bool](Get-Process -Id $procId -ErrorAction SilentlyContinue)
}

function Wait-HttpOk([string]$url, [int]$seconds = 30) {
    $deadline = (Get-Date).AddSeconds($seconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 3
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
        } catch {}
        Start-Sleep -Milliseconds 700
    }
    return $false
}

function Stop-PortOwner([int]$port) {
    $owners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($owner in $owners) {
        if ($owner) {
            Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
        }
    }
}

function Get-PortOwner([int]$port) {
    $owner = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty OwningProcess
    if ($owner) { return [int]$owner }
    return $null
}

function Start-Backend {
    $python = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
    if (-not (Test-Path $python)) {
        throw "Missing backend runtime. Run scripts\bootstrap.ps1 first."
    }
    $p = Start-Process -FilePath $python `
        -ArgumentList "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000" `
        -WorkingDirectory $ProjectRoot `
        -RedirectStandardOutput $BackendLog `
        -RedirectStandardError $BackendErr `
        -PassThru
    Set-Content -Path $BackendPidFile -Value $p.Id
}

function Start-Frontend {
    $npm = "C:\Program Files\nodejs\npm.cmd"
    $node = "C:\Program Files\nodejs\node.exe"
    if (-not (Test-Path $npm) -or -not (Test-Path $node)) {
        throw "Node.js is missing. Install Node LTS first."
    }
    $frontendDir = Join-Path $ProjectRoot "frontend"
    if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
        Push-Location $frontendDir
        try { & $npm install | Out-Null } finally { Pop-Location }
    }
    $cmd = "set `"PATH=C:\Program Files\nodejs;%PATH%`" && `"$node`" node_modules/vite/bin/vite.js --configLoader runner --host 0.0.0.0 --port 5173 --strictPort"
    $p = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", $cmd `
        -WorkingDirectory $frontendDir `
        -RedirectStandardOutput $FrontendLog `
        -RedirectStandardError $FrontendErr `
        -PassThru
    Set-Content -Path $FrontendPidFile -Value $p.Id
}

function Stop-ServiceByPidFile([string]$pidFile) {
    $procId = Get-PidFromFile $pidFile
    if ($procId -and (Test-Alive $procId)) {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $pidFile) { Remove-Item $pidFile -Force }
}

function Show-Status {
    $bPid = Get-PidFromFile $BackendPidFile
    $fPid = Get-PidFromFile $FrontendPidFile
    $bPortOwner = Get-PortOwner 8000
    $fPortOwner = Get-PortOwner 5173
    if (-not $bPid -and $bPortOwner) { $bPid = $bPortOwner; Set-Content -Path $BackendPidFile -Value $bPid }
    if (-not $fPid -and $fPortOwner) { $fPid = $fPortOwner; Set-Content -Path $FrontendPidFile -Value $fPid }
    $bAlive = if ($bPid) { Test-Alive $bPid } else { $false }
    $fAlive = if ($fPid) { Test-Alive $fPid } else { $false }
    $bHttp = Wait-HttpOk "http://127.0.0.1:8000/health" 2
    $fHttp = Wait-HttpOk "http://127.0.0.1:5173" 2
    $bPidText = if ($bPid) { "$bPid" } else { "none" }
    $fPidText = if ($fPid) { "$fPid" } else { "none" }
    $bPortText = if ($bPortOwner) { "$bPortOwner" } else { "none" }
    $fPortText = if ($fPortOwner) { "$fPortOwner" } else { "none" }
    Write-Host "Backend PID: $bPidText Alive: $bAlive HTTP: $bHttp PortOwner: $bPortText"
    Write-Host "Frontend PID: $fPidText Alive: $fAlive HTTP: $fHttp PortOwner: $fPortText"
}

switch ($Action) {
    "start" {
        $bPid = Get-PidFromFile $BackendPidFile
        $fPid = Get-PidFromFile $FrontendPidFile
        if (-not (Test-Alive $bPid)) { if (Test-Path $BackendPidFile) { Remove-Item $BackendPidFile -Force } }
        if (-not (Test-Alive $fPid)) { if (Test-Path $FrontendPidFile) { Remove-Item $FrontendPidFile -Force } }
        $existingBackend = Get-PortOwner 8000
        $existingFrontend = Get-PortOwner 5173
        if ($existingBackend) {
            Set-Content -Path $BackendPidFile -Value $existingBackend
        } elseif (-not (Test-Alive $bPid)) {
            Start-Backend
        }
        if ($existingFrontend) {
            Set-Content -Path $FrontendPidFile -Value $existingFrontend
        } elseif (-not (Test-Alive $fPid)) {
            Start-Frontend
        }
        $bReady = Wait-HttpOk "http://127.0.0.1:8000/health" 40
        $fReady = Wait-HttpOk "http://127.0.0.1:5173" 40
        $finalBackend = Get-PortOwner 8000
        $finalFrontend = Get-PortOwner 5173
        if ($finalBackend) { Set-Content -Path $BackendPidFile -Value $finalBackend }
        if ($finalFrontend) { Set-Content -Path $FrontendPidFile -Value $finalFrontend }
        Write-Host "Backend ready: $bReady - http://127.0.0.1:8000"
        Write-Host "Frontend ready: $fReady - http://127.0.0.1:5173"
    }
    "stop" {
        Stop-ServiceByPidFile $BackendPidFile
        Stop-ServiceByPidFile $FrontendPidFile
        Write-Host "Stopped backend and frontend."
    }
    "restart" {
        Stop-ServiceByPidFile $BackendPidFile
        Stop-ServiceByPidFile $FrontendPidFile
        Start-Sleep -Milliseconds 500
        & $PSCommandPath -Action start -ProjectRoot $ProjectRoot
    }
    "status" {
        Show-Status
    }
    "logs" {
        Write-Host "== Backend (out) =="
        if (Test-Path $BackendLog) { Get-Content -Tail 60 $BackendLog }
        Write-Host "== Backend (err) =="
        if (Test-Path $BackendErr) { Get-Content -Tail 60 $BackendErr }
        Write-Host "== Frontend (out) =="
        if (Test-Path $FrontendLog) { Get-Content -Tail 60 $FrontendLog }
        Write-Host "== Frontend (err) =="
        if (Test-Path $FrontendErr) { Get-Content -Tail 60 $FrontendErr }
    }
}
