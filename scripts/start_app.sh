#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting School Safety App..."
echo "(Repo: $REPO_ROOT)"
echo ""

if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "Backend is already running on port 5001"
else
    echo "Starting Backend Server..."
    cd "$REPO_ROOT/apps/backend"
    python3 app.py &
    BACKEND_PID=$!
    echo "Backend started (PID: $BACKEND_PID)"
    cd "$REPO_ROOT"
fi

echo ""
echo "Starting React Native app (Expo web)..."
cd "$REPO_ROOT/apps/mobile"
npm run web

echo ""
echo "Shutting down..."
