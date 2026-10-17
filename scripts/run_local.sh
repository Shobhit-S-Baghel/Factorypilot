#!/usr/bin/env bash
# =======================================================================
#          FACTORYPILOT - INDUSTRIAL AI TELEMETRY PLATFORM
#               Universal One-Command Local Bootstrapper
# =======================================================================

set -e

# Resolve repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "======================================================================="
echo "         FACTORYPILOT - INDUSTRIAL AI TELEMETRY PLATFORM"
echo "              Universal One-Command Local Bootstrapper"
echo "======================================================================="
echo ""
echo "[*] Working Directory: $REPO_ROOT"
echo ""

# Process IDs for graceful shutdown
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "[!] Termination signal caught. Initiating graceful shutdown..."
    if [ -n "$BACKEND_PID" ]; then
        echo "    - Stopping Backend Uvicorn Engine (PID: $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        echo "    - Stopping Frontend Next.js Server (PID: $FRONTEND_PID)..."
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "[✓] FactoryPilot services halted cleanly."
    exit 0
}

# Trap termination signals
trap cleanup SIGINT SIGTERM EXIT

# 1. Check System Prerequisites
echo "[*] Checking System Prerequisites..."

# Check Python 3
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "[ERROR] Python 3.10+ is required but was not found in PATH."
    exit 1
fi
PY_VER=$($PYTHON_CMD --version 2>&1)
echo " [+] Python Detected: $PY_VER"

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js 18+ is required but was not found in PATH."
    exit 1
fi
NODE_VER=$(node --version)
echo " [+] Node.js Detected: $NODE_VER"

# Check npm
if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm was not found in PATH."
    exit 1
fi
NPM_VER=$(npm --version)
echo " [+] npm Detected: v$NPM_VER"

# Check Docker (Optional)
if command -v docker >/dev/null 2>&1; then
    DOCKER_VER=$(docker --version)
    echo " [+] Docker Detected: $DOCKER_VER (Optional container runtime available)"
else
    echo " [!] Docker not detected (Running in standalone bare-metal mode)"
fi
echo ""

# 2. Setup Python Backend Environment
echo "[*] Preparing Python Backend Environment..."
if [ ! -d "backend/.venv" ]; then
    echo " [+] Creating Python virtual environment in backend/.venv..."
    $PYTHON_CMD -m venv backend/.venv
fi

# Activate virtualenv
source backend/.venv/bin/activate
echo " [+] Virtual environment activated."

echo " [+] Verifying backend dependencies..."
pip install -q -r backend/requirements.txt

# 3. Seed Technical Manual Vector Embeddings & RAG Chunks
echo ""
echo "[*] Seeding Technical Manuals & Semantic Vector Store..."
export PYTHONPATH="$REPO_ROOT/backend"
python -c "from app.services.rag_service import rag_service; n = rag_service.load_and_chunk_manuals(); print(f' [+] Successfully indexed {n} technical manual chapters for RAG copilot.')" || {
    echo " [!] Warning: Vector seeding encountered an issue, proceeding with fallback knowledge engine."
}

# 4. Setup Frontend Dependencies
echo ""
echo "[*] Preparing Next.js Frontend Environment..."
if [ ! -d "frontend/node_modules" ]; then
    echo " [+] Installing frontend npm packages..."
    (cd frontend && npm install --prefer-offline --no-audit)
else
    echo " [+] Frontend packages already installed."
fi

# 5. Launch Services Concurrently
echo ""
echo "======================================================================="
echo " [+] All systems prepared. Launching FactoryPilot Core Services..."
echo " - Backend API:    http://localhost:8000  (Docs: http://localhost:8000/docs)"
echo " - Telemetry WS:   ws://localhost:8000/api/v1/telemetry/ws/stream"
echo " - Frontend Web:   http://localhost:3000"
echo "======================================================================="
echo "[*] Press Ctrl+C in this terminal to terminate all services."
echo ""

# Start FastAPI backend
(
    cd "$REPO_ROOT/backend"
    export PYTHONPATH="$REPO_ROOT/backend"
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) &
BACKEND_PID=$!

# Start Next.js frontend
(
    cd "$REPO_ROOT/frontend"
    exec npm run dev
) &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
