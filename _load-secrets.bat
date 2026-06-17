@echo off
REM Doxee Marketing AI - shared secrets loader (Windows).
REM
REM Called (via CALL) by each tool's start.bat. Decrypts secrets.env.age with
REM the team age key (age-key.txt) and sets the values as environment variables
REM in the calling shell. Do NOT add setlocal here - the variables must survive
REM the return to the caller.

set "DOXEE_ROOT=%~dp0"
set "DOXEE_KEY=%DOXEE_ROOT%age-key.txt"
set "DOXEE_SEC=%DOXEE_ROOT%secrets.env.age"

REM Resolve the age binary: vendored copy in tools\ wins (no install), then PATH.
if exist "%DOXEE_ROOT%tools\age-windows-amd64.exe" (
  set "AGE=%DOXEE_ROOT%tools\age-windows-amd64.exe"
) else (
  where age >nul 2>nul
  if errorlevel 1 (
    echo [secrets] 'age' was not found.
    echo           See SECRETS.md, or drop age.exe in %DOXEE_ROOT%tools\
    exit /b 1
  )
  set "AGE=age"
)
if not exist "%DOXEE_KEY%" (
  echo [secrets] Missing age-key.txt in %DOXEE_ROOT%
  echo           Get it from the company password manager ^(ask acestari@doxee.com^).
  exit /b 1
)
if not exist "%DOXEE_SEC%" (
  echo [secrets] Missing secrets.env.age in %DOXEE_ROOT%
  exit /b 1
)

for /f "usebackq tokens=1* delims==" %%a in (`"%AGE%" -d -i "%DOXEE_KEY%" "%DOXEE_SEC%"`) do set "%%a=%%b"
echo [secrets] Loaded.
exit /b 0
