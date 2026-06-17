#!/bin/bash
# Event Mailer — double-click to start.
# Keep this Terminal window open while you use the dashboard.
# Close it (or press Ctrl+C) to stop the server.

cd "$(dirname "$0")" || exit 1

# Find Python 3
if command -v python3 >/dev/null 2>&1; then
    PY=python3
elif command -v python >/dev/null 2>&1; then
    PY=python
else
    echo "[ERROR] Python 3 not found."
    echo "Install it from https://www.python.org/downloads/ and try again."
    read -n 1 -p "Press any key to close..."
    exit 1
fi

# Install dependencies only if missing
if ! "$PY" -c "import requests, openpyxl, keyring" >/dev/null 2>&1; then
    echo "[setup] Installing dependencies (requests, openpyxl, keyring)..."
    "$PY" -m pip install --user --quiet -r automation/requirements.txt
    if [ $? -ne 0 ]; then
        echo "[ERROR] Dependency installation failed."
        echo "Try manually: $PY -m pip install --user -r automation/requirements.txt"
        read -n 1 -p "Press any key to close..."
        exit 1
    fi
fi

# Load shared secrets (age). Best-effort: if not set up, the first-run wizard
# and the OS keychain are still used. See SECRETS.md.
if [ -f "../_load-secrets.sh" ]; then
    source "../_load-secrets.sh"
    _doxee_load_secrets || echo "[secrets] Continuing without age secrets (using setup wizard / keychain)."
fi

"$PY" automation/server.py

# If the server exited with an error, keep the window open so you can read it.
if [ $? -ne 0 ]; then
    echo ""
    read -n 1 -p "Press any key to close..."
fi
