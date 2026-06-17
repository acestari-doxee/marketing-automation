#!/bin/bash
# LeadCleaner — double-click to launch the app.

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check Node.js
if ! command -v node &>/dev/null; then
  osascript -e 'display alert "Node.js not found" message "Install Node.js from https://nodejs.org and try again."'
  exit 1
fi

cd "$APP_DIR"

# Load shared secrets (age). Best-effort: if age/key are not set up, the app
# falls back to a local .env. See SECRETS.md.
if [ -f "$APP_DIR/../_load-secrets.sh" ]; then
  source "$APP_DIR/../_load-secrets.sh"
  _doxee_load_secrets || echo "[secrets] Continuing without age secrets (will use local .env)."
fi

# Require a key only if age didn't already provide it
if [ -z "$APOLLO_API_KEY" ] && [ ! -f ".env" ]; then
  echo "[setup] No APOLLO_API_KEY from age and no .env — copying from .env.example"
  cp .env.example .env
  echo ""
  echo "  Either set up age (see SECRETS.md) or open .env and add your APOLLO_API_KEY,"
  echo "  then run this file again."
  echo ""
  read -rp "Press Enter to close..."
  exit 1
fi

# Install dependencies if missing
if [ ! -d "node_modules/express" ]; then
  echo "[setup] Installing dependencies..."
  npm install --silent
fi

# Free port 3000 if in use
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

echo ""
echo "Starting LeadCleaner..."
node server.js &
SERVER_PID=$!

# Wait for server to be ready
for i in {1..15}; do
  sleep 1
  if curl -s http://localhost:3000 > /dev/null; then
    break
  fi
done

# Open browser
open http://localhost:3000

echo ""
echo "LeadCleaner is running → http://localhost:3000"
echo "Close this window to stop the server."
echo ""

wait $SERVER_PID
