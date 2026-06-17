#!/usr/bin/env bash
# Mac launcher — double-click this file to start the app.

cd "$(dirname "$0")"

VENV_PY=".venv/bin/python3"
VENV_PIP=".venv/bin/pip"
VENV_STREAMLIT=".venv/bin/streamlit"

# Check that python3 is installed
if ! command -v python3 &>/dev/null; then
    echo ""
    echo "[ERROR] Python3 not found."
    echo "Go to https://www.python.org/downloads/ and install Python, then try again."
    echo ""
    read -rp "Press Enter to close..."
    exit 1
fi

# Create the virtualenv if it does not exist
if [ ! -f "$VENV_PY" ]; then
    echo "[setup] Creating virtualenv..."
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Could not create the virtualenv."
        read -rp "Press Enter to close..."
        exit 1
    fi
fi

# Install dependencies if streamlit is not present yet
if [ ! -f "$VENV_STREAMLIT" ]; then
    echo "[setup] Installing dependencies (~1 minute)..."
    "$VENV_PIP" install --upgrade pip --quiet
    "$VENV_PIP" install -r src/requirements.txt
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] Dependency installation failed. Read the message above."
        read -rp "Press Enter to close..."
        exit 1
    fi
fi

# Load shared secrets (age). Best-effort: if not set up, you can still paste the
# token in the app sidebar or use src/.env. See SECRETS.md.
if [ -f "../_load-secrets.sh" ]; then
  source "../_load-secrets.sh"
  _doxee_load_secrets || echo "[secrets] Continuing without age secrets (use the sidebar or src/.env)."
fi

echo ""
echo "[run] Starting app — opens in your browser at http://localhost:8501"
echo "      To close: come back here and press Ctrl+C"
echo ""
"$VENV_STREAMLIT" run src/app.py
