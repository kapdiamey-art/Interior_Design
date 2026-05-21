@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title InteriorAI Platform - One Click Launcher

cls
echo.
echo ============================================================
echo   InteriorAI Platform  -  One Click Launcher
echo   AI-Based Modular Interior Design Platform
echo ============================================================
echo.

:: ---- Detect project root (folder where this script is located) ----
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

:: ============================================================
:: [1/5] Check Python
:: ============================================================
echo [1/5] Checking Python...
where python >nul 2>&1
if errorlevel 1 goto python_error
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo   %%v found. OK.
echo.
goto check_node

:python_error
echo.
echo   ERROR: Python not found.
echo   Install Python 3.10+ from https://python.org
echo   Make sure to check "Add Python to PATH" during install.
echo.
pause
exit /b 1

:check_node
:: ============================================================
:: [2/5] Check Node.js
:: ============================================================
echo [2/5] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 goto node_error
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo   Node %%v found. OK.
echo.
goto setup_backend

:node_error
echo.
echo   ERROR: Node.js not found.
echo   Install Node 18+ from https://nodejs.org
echo.
pause
exit /b 1

:setup_backend
:: ============================================================
:: [3/5] Backend - Python virtual env + dependencies
:: ============================================================
echo [3/5] Setting up backend...
cd /d "%BACKEND%"

if exist ".venv" goto venv_exists
echo   Creating Python virtual environment...
python -m venv .venv
if errorlevel 1 goto venv_fail
:venv_exists

call ".venv\Scripts\activate.bat"

if exist ".venv\installed.flag" goto deps_exists
echo   Installing Python dependencies (first time only - takes ~1 min)...
python -m pip install --upgrade pip -q --disable-pip-version-check
pip install -r requirements.txt -q --disable-pip-version-check
if errorlevel 1 goto pip_fail
echo.> ".venv\installed.flag"
echo   Dependencies installed successfully.
goto backend_ready

:deps_exists
echo   Dependencies already installed. Skipping.
goto backend_ready

:venv_fail
echo.
echo   ERROR: Failed to create virtual environment.
pause
exit /b 1

:pip_fail
echo.
echo   ERROR: pip install failed. Check requirements.txt
pause
exit /b 1

:backend_ready
echo   Backend ready.
cd /d "%ROOT%"
echo.

:: ============================================================
:: [4/5] Frontend - npm install
:: ============================================================
echo [4/5] Setting up frontend...
cd /d "%FRONTEND%"

if exist "node_modules" goto node_modules_exists
echo   Installing frontend dependencies (first time only - takes ~2-3 min)...
call npm install --no-audit --no-fund
if errorlevel 1 goto npm_fail
echo   Frontend dependencies installed.
goto frontend_ready

:node_modules_exists
echo   node_modules found. Skipping npm install.
goto frontend_ready

:npm_fail
echo.
echo   ERROR: npm install failed. Make sure Node.js 18+ is installed.
pause
exit /b 1

:frontend_ready
echo   Frontend ready.
cd /d "%ROOT%"
echo.

:: ============================================================
:: [5/5] Launch Backend + Frontend in separate windows
:: ============================================================
echo [5/5] Launching services...
echo.
echo   Backend API : http://localhost:8000
echo   Frontend    : http://localhost:3000
echo   API Docs    : http://localhost:8000/docs
echo.
echo   Two new windows will open (Backend and Frontend).
echo   Close those windows to stop the servers.
echo.

:: Launch Backend - Using /d parameter of START for robust path handling
start "InteriorAI - Backend (port 8000)" /d "%BACKEND%" cmd /k "chcp 65001 >nul && set PYTHONIOENCODING=utf-8 && call .venv\Scripts\activate.bat && echo Backend starting... && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend - use timeout if possible, else skip
timeout /t 4 /nobreak >nul 2>&1

:: Launch Frontend - Using /d parameter of START for robust path handling
start "InteriorAI - Frontend (port 3000)" /d "%FRONTEND%" cmd /k "chcp 65001 >nul && echo Frontend starting... && npm run dev"

:: Wait for frontend
timeout /t 6 /nobreak >nul 2>&1

:: Open browser
start http://localhost:3000

echo ============================================================
echo   InteriorAI is now running!
echo.
echo   Open: http://localhost:3000
echo ============================================================
echo.
echo   This launcher window can be closed.
echo   The Backend and Frontend windows must stay open.
echo.
pause
