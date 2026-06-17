@echo off
REM Windows launcher — double-click this file to start the app.
REM Creates the virtualenv on first run, then launches Streamlit in the browser.

cd /d %~dp0

if not exist .venv (
    echo [setup] Creating virtualenv (one-time, ~1 minute)...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip >nul
    pip install -r src\requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

REM Load shared secrets (age). Best-effort: falls back to the sidebar or src\.env. See docs/SECRETS.md.
if exist "%~dp0..\secrets\load-secrets.bat" call "%~dp0..\secrets\load-secrets.bat"

echo [run] Starting app — opens in your browser at http://localhost:8501
streamlit run src\app.py
pause
