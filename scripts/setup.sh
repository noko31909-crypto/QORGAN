#!/bin/bash
set -e

# Resolve repo root regardless of current working directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔧 Setting up School Safety App..."
echo "(Repo: $REPO_ROOT)"
echo ""

echo "📦 Installing Backend dependencies..."
cd "$REPO_ROOT/apps/backend"
pip3 install -r requirements.txt
echo "✅ Backend dependencies installed"
cd "$REPO_ROOT"

echo ""
echo "📦 Installing Flutter dependencies..."
cd "$REPO_ROOT/apps/mobile"
flutter pub get
echo "✅ Flutter dependencies installed"
cd "$REPO_ROOT"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the app:"
echo "  ./scripts/start_app.sh"
echo ""
echo "Or manually:"
echo "  1. Backend: cd apps/backend && python3 app.py"
echo "  2. Mobile: cd apps/mobile && flutter run"
