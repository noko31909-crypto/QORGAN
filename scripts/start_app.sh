#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
STARTED_BACKEND=0

cleanup() {
    if [[ $STARTED_BACKEND -eq 1 && -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
        kill "$BACKEND_PID" >/dev/null 2>&1 || true
        wait "$BACKEND_PID" >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

echo "Starting School Safety App..."
echo "(Repo: $REPO_ROOT)"
echo ""

if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "Backend is already running on port 5001"
else
    echo "Starting Backend Server..."
    cd "$REPO_ROOT/apps/backend"
    ENABLE_DETECTION=1 DEMO_SEED=1 python3 app.py &
    BACKEND_PID=$!
    STARTED_BACKEND=1
    echo "Backend started (PID: $BACKEND_PID)"
    cd "$REPO_ROOT"
fi

echo ""
echo "Starting Web app..."
cd "$REPO_ROOT/apps/web"
npm run dev -- --host 0.0.0.0
