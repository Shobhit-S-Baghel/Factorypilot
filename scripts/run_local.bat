@echo off
setlocal enabledelayedexpansion
title FactoryPilot Universal Local Runner

echo =======================================================================
echo          FACTORYPILOT - INDUSTRIAL AI TELEMETRY PLATFORM
echo               Universal One-Command Local Bootstrapper
echo =======================================================================
echo.

:: 1. Navigate to repository root
cd /d "%~dp0\.."
set "REPO_ROOT=%CD%"
echo [*] Working Directory: %REPO_ROOT%
echo.

:: 2. Check Prerequisites
echo [*] Checking System Prerequisites...

:: Python Check
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    py --version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Python 3.10+ is required but was not found in PATH.
        echo Please install Python 3.11 from https://www.python.org/
        pause
        exit /b 1
    ) else (
        set "PYTHON_CMD=py"
    )
) else (
    set "PYTHON_CMD=python"
)
for /f "tokens=*" %%i in ('%PYTHON_CMD% --version') do set "PY_VER=%%i"
echo  [+] Python Detected: %PY_VER%

:: Node.js Check
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js 18+ is required but was not found in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set "NODE_VER=%%i"
echo  [+] Node.js Detected: %NODE_VER%

:: npm Check
call npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm was not found in PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('call npm --version') do set "NPM_VER=%%i"
echo  [+] npm Detected: v%NPM_VER%

:: Docker Check (Optional)
docker --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('docker --version') do set "DOCKER_VER=%%i"
    echo  [+] Docker Detected: !DOCKER_VER! (Optional container engine ready)
) else (
    echo  [!] Docker not detected (Running in standalone bare-metal mode)
)
echo.

:: 3. Setup Backend Virtual Environment & Dependencies
echo [*] Preparing Python Backend Environment...
if not exist "backend\.venv" (
    echo  [+] Creating Python virtual environment in backend\.venv...
    %PYTHON_CMD% -m venv backend\.venv
)

call backend\.venv\Scripts\activate.bat
echo  [+] Virtual environment activated.

echo  [+] Verifying backend dependencies...
pip install -q -r backend\requirements.txt

:: 4. Seed Technical Manual Vector Embeddings & RAG Chunks
echo.
echo [*] Seeding Technical Manuals & Semantic Vector Store...
set "PYTHONPATH=%REPO_ROOT%\backend"
python -c "from app.services.rag_service import rag_service; n = rag_service.load_and_chunk_manuals(); print(f' [+] Successfully indexed {n} technical manual chapters for RAG copilot.')"
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Warning: Vector seeding encountered an issue, proceeding with fallback knowledge engine.
)

:: 5. Setup Frontend Dependencies
echo.
echo [*] Preparing Next.js Frontend Environment...
if not exist "frontend\node_modules" (
    echo  [+] Installing frontend npm packages (this may take a minute on first run)...
    cd frontend
    call npm install --prefer-offline --no-audit
    cd ..
) else (
    echo  [+] Frontend packages already installed.
)

:: 6. Launch Backend and Frontend Concurrently
echo.
echo =======================================================================
echo  [+] All systems prepared. Launching FactoryPilot Core Services...
echo  - Backend API:    http://localhost:8000  (Docs: http://localhost:8000/docs)
echo  - Telemetry WS:   ws://localhost:8000/api/v1/telemetry/ws/stream
echo  - Frontend Web:   http://localhost:3000
echo =======================================================================
echo [*] Press Ctrl+C in this window to terminate both services gracefully.
echo.

:: Launch FastAPI backend in background window
start "FactoryPilot - Backend Service (Port 8000)" cmd /k "cd /d %REPO_ROOT%\backend && call .venv\Scripts\activate.bat && set PYTHONPATH=%REPO_ROOT%\backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Launch Next.js frontend in current process
cd "%REPO_ROOT%\frontend"
call npm run dev

:: Termination cleanup when npm exits
echo.
echo [*] Shutting down FactoryPilot background services...
taskkill /FI "WINDOWTITLE eq FactoryPilot - Backend Service*" /T /F >nul 2>&1
echo [✓] Shutdown complete.
