#!/usr/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export QORGAN_PROFILE=centers

ENV_FILE="$REPO_ROOT/apps/backend/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

cd "$REPO_ROOT/apps/backend"
exec python3 app.py
