@echo off
cd /d "%~dp0"
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found.
    echo Install it from https://www.python.org/downloads/
    echo IMPORTANT: during installation, tick "Add Python to PATH".
    pause
    exit /b 1
)
python -c "import requests, openpyxl, keyring" >nul 2>&1
if %errorlevel% neq 0 (
    echo [setup] Installing dependencies...
    python -m pip install --user -q -r automation\requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed.
        echo Try manually: python -m pip install --user -r automation\requirements.txt
        pause
        exit /b 1
    )
)

REM Load shared secrets (age). Best-effort: falls back to the setup wizard / keychain. See docs/SECRETS.md.
if exist "%~dp0..\secrets\load-secrets.bat" call "%~dp0..\secrets\load-secrets.bat"

python automation\server.py
if %errorlevel% neq 0 (
    echo.
    pause
)
