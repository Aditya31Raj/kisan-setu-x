@echo off
setlocal enabledelayedexpansion
title Kisan Setu - Unified Launcher

echo ===================================================
echo           Kisan Setu - Unified Launcher            
echo ===================================================

set "PATH=C:\Program Files\nodejs;%PATH%"
set "ROOT_DIR=%~dp0"
set "PG_BIN=C:\Users\ADITYA RAJ\.kisan-postgres\pgsql\bin"
set "PG_DATA=C:\Users\ADITYA RAJ\.kisan-postgres\data"
set "PG_LOG=C:\Users\ADITYA RAJ\.kisan-postgres\server.log"

echo [1/3] Checking PostgreSQL Database Server...
"%PG_BIN%\pg_isready.exe" -h 127.0.0.1 -p 5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting local PostgreSQL server on port 5432...
    "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" start
    timeout /t 2 /nobreak >nul
) else (
    echo PostgreSQL is already running on port 5432.
)

echo [2/3] Starting Backend API Server (Port 5000)...
start "Kisan Setu - Backend API" cmd /k "cd /d "%ROOT_DIR%kisan-setu-backend" && set "PATH=C:\Program Files\nodejs;!PATH!" && node src/server.js"

echo [3/3] Starting Frontend Web Server (Port 5173)...
start "Kisan Setu - Frontend Web" cmd /k "cd /d "%ROOT_DIR%kisan setu" && set "PATH=C:\Program Files\nodejs;!PATH!" && node server.js"

timeout /t 3 /nobreak >nul
echo.
echo ===================================================
echo Kisan Setu is successfully launched!
echo - Frontend:  http://localhost:5173
echo - Backend:   http://localhost:5000/health
echo - API Docs:  http://localhost:5000/api-docs
echo.
echo Demo Credentials:
echo - Farmer: demo.farmer@kisansetu.local     / ChangeMeFarmer123!
echo - Buyer:  demo.buyer@kisansetu.local      / ChangeMeBuyer123!
echo - Admin:  demo.admin@kisansetu.local      / ChangeMeAdmin123!
echo ===================================================
start http://localhost:5173/
pause
