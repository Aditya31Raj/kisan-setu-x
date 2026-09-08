<#
.SYNOPSIS
    Kisan Setu Unified Launcher (PowerShell)
#>

$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$rootDir = $PSScriptRoot
$pgBin = "C:\Users\ADITYA RAJ\.kisan-postgres\pgsql\bin"
$pgData = "C:\Users\ADITYA RAJ\.kisan-postgres\data"
$pgLog = "C:\Users\ADITYA RAJ\.kisan-postgres\server.log"

Write-Host "===================================================" -ForegroundColor Green
Write-Host "          Kisan Setu - Unified Launcher            " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

# 1. Check & Start PostgreSQL
Write-Host "`n[1/3] Checking PostgreSQL Database Server..." -ForegroundColor Cyan
& "$pgBin\pg_isready.exe" -h 127.0.0.1 -p 5432 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting local PostgreSQL server on port 5432..." -ForegroundColor Yellow
    & "$pgBin\pg_ctl.exe" -D "$pgData" -l "$pgLog" start
    Start-Sleep -Seconds 2
} else {
    Write-Host "PostgreSQL is already running on port 5432." -ForegroundColor Green
}

# 2. Start Backend API Server
Write-Host "`n[2/3] Starting Backend API Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'C:\Program Files\nodejs;' + `$env:PATH; Set-Location '$rootDir\kisan-setu-backend'; node src/server.js"

# 3. Start Frontend Web Server
Write-Host "`n[3/3] Starting Frontend Web Server (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'C:\Program Files\nodejs;' + `$env:PATH; Set-Location '$rootDir\kisan setu'; node server.js"

Start-Sleep -Seconds 3

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "Kisan Setu is successfully launched!" -ForegroundColor Green
Write-Host "- Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "- Backend:   http://localhost:5000/health" -ForegroundColor White
Write-Host "- API Docs:  http://localhost:5000/api-docs" -ForegroundColor White
Write-Host "`nDemo Credentials:" -ForegroundColor Yellow
Write-Host "- Farmer: demo.farmer@kisansetu.local     / ChangeMeFarmer123!" -ForegroundColor White
Write-Host "- Buyer:  demo.buyer@kisansetu.local      / ChangeMeBuyer123!" -ForegroundColor White
Write-Host "- Admin:  demo.admin@kisansetu.local      / ChangeMeAdmin123!" -ForegroundColor White
Write-Host "===================================================`n" -ForegroundColor Green

Start-Process "http://localhost:5173/"
