#!/usr/bin/env bash
# Starts the Parlance website on this computer and opens it in the browser.
#
#   ./start.sh              the website at http://localhost:4173
#   ./start.sh community    ...and open a page directly (here: /app/community)
#
# It runs the website (Vite) and the local Python service (sign recognition and
# Community) together. The first run installs what is missing; later runs start
# in a few seconds. Press Ctrl+C to stop everything.
#
# The phone app (Flutter + Serverpod) is not started here; it talks to
# Serverpod Cloud.

set -euo pipefail
cd "$(dirname "$0")"

PORT="${PARLANCE_PORT:-4173}"
URL="http://localhost:${PORT}"
PAGE="/${1:-}"
case "${1:-}" in
  community) PAGE="/app/community" ;;
  app) PAGE="/app" ;;
esac

say() { printf '\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

open_browser() {
  if command -v open >/dev/null 2>&1; then open "$1"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$1" >/dev/null 2>&1 &
  else say "Open $1 in your browser."
  fi
}

responds() { curl -fsS -o /dev/null --max-time 2 "$URL/" 2>/dev/null; }

# Already running (another terminal)? Just open it.
if responds; then
  say "Parlance is already running at $URL"
  open_browser "$URL$PAGE"
  exit 0
fi

# --- Node.js (the website) -------------------------------------------------
command -v node >/dev/null 2>&1 || fail "Node.js is not installed. Install Node 22.18 or newer from https://nodejs.org and run this again."
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=18)?0:1)' \
  || fail "Node $(node -v) is too old. Install Node 22.18 or newer from https://nodejs.org."

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  say "Installing website packages (first run only)…"
  npm ci --no-audit --no-fund
fi

# --- Python (sign recognition + Community) ---------------------------------
PYTHON=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null; then
    PYTHON="$candidate"; break
  fi
done
[ -n "$PYTHON" ] || [ -x .venv/bin/python ] || fail "Python 3.11 or newer is not installed. Install it from https://www.python.org and run this again."

if [ ! -x .venv/bin/python ]; then
  say "Creating the Python environment (first run only)…"
  "$PYTHON" -m venv .venv
fi
stamp=".venv/.requirements"
if ! cmp -s backend/requirements.txt "$stamp" 2>/dev/null; then
  say "Installing the Python packages (first run only)…"
  if .venv/bin/python -m pip install --disable-pip-version-check -q -r backend/requirements.txt; then
    cp backend/requirements.txt "$stamp"
  else
    say "Could not install every Python package. The website still opens; Sign → Text and Community may not work."
  fi
fi
export PARLANCE_PYTHON="$PWD/.venv/bin/python"

# --- Run ---------------------------------------------------------------------
say "Starting Parlance at $URL (Ctrl+C to stop)…"
node scripts/copy-assets.mjs
# The same as `npm run dev`, without npm in between, so Ctrl+C stops it cleanly.
node --env-file-if-exists=.env scripts/dev.mjs &
DEV_PID=$!

cleanup() {
  trap - INT TERM EXIT
  kill "$DEV_PID" 2>/dev/null || true
  wait "$DEV_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

for _ in $(seq 1 120); do
  if responds; then
    say "Opening $URL$PAGE"
    open_browser "$URL$PAGE"
    break
  fi
  kill -0 "$DEV_PID" 2>/dev/null || fail "Parlance stopped while starting. Read the messages above."
  sleep 1
done
responds || say "Still starting. Open $URL$PAGE when it is ready."

wait "$DEV_PID"
