@echo off
REM LeadCleaner - double-click to launch the app (Windows).
setlocal

cd /d "%~dp0"

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found.
  echo Install Node.js from https://nodejs.org and try again.
  echo.
  pause
  exit /b 1
)

REM Load shared secrets (age). Best-effort: falls back to local .env. See SECRETS.md.
if exist "%~dp0..\_load-secrets.bat" call "%~dp0..\_load-secrets.bat"

REM Require a key only if age didn't already provide it
if not defined APOLLO_API_KEY if not exist ".env" (
  echo [setup] No APOLLO_API_KEY from age and no .env - copying from .env.example
  copy ".env.example" ".env" >nul
  echo.
  echo   Either set up age ^(see SECRETS.md^) or open .env and add your APOLLO_API_KEY,
  echo   then run this file again.
  echo.
  pause
  exit /b 1
)

REM Install dependencies if missing
if not exist "node_modules\express" (
  echo [setup] Installing dependencies...
  call npm install --silent
)

REM Free port 3000 if in use
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
  taskkill /F /PID %%P >nul 2>nul
)

echo.
echo Starting LeadCleaner...
start "" /b node server.js

REM Wait for server to be ready, then open browser
for /l %%i in (1,1,15) do (
  timeout /t 1 /nobreak >nul
  curl -s http://localhost:3000 >nul 2>nul && goto :ready
)
:ready

start "" http://localhost:3000

echo.
echo LeadCleaner is running - http://localhost:3000
echo Close this window to stop the server.
echo.
pause
