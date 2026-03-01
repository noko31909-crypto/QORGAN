#!/bin/bash
set -e

# Resolve repo root regardless of current working directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Starting School Safety App..."
echo "(Repo: $REPO_ROOT)"
echo ""

# Check if backend is already running
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Backend is already running on port 5001"
else
    echo "📡 Starting Backend Server..."
    cd "$REPO_ROOT/apps/backend"
    python3 app.py &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
    cd "$REPO_ROOT"
fi

echo ""
echo "📱 Starting Flutter App..."
cd "$REPO_ROOT/apps/mobile"
flutter run

echo ""
echo "👋 Shutting down..."
