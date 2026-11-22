@echo off
rem Starts the Parlance website on this computer and opens it in the browser.
rem
rem   start.bat              the website at http://localhost:4173
rem   start.bat community    ...and open a page directly (here: /app/community)
rem
rem It runs the website (Vite) and the local Python service (sign recognition
rem and Community) together. The first run installs what is missing; later runs
rem start in a few seconds. Close this window or press Ctrl+C to stop.
rem
rem The phone app (Flutter + Serverpod) is not started here; it talks to
rem Serverpod Cloud.

setlocal EnableExtensions
cd /d "%~dp0"

if "%PARLANCE_PORT%"=="" (set "PORT=4173") else (set "PORT=%PARLANCE_PORT%")
set "URL=http://localhost:%PORT%"
set "PAGE=/%~1"
if /i "%~1"=="community" set "PAGE=/app/community"
if /i "%~1"=="app" set "PAGE=/app"
if "%~1"=="" set "PAGE=/"

rem Already running (another window)? Just open it.
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%URL%/' | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  echo Parlance is already running at %URL%
  start "" "%URL%%PAGE%"
  exit /b 0
)

rem --- Node.js (the website) ---------------------------------------------------
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install Node 22.18 or newer from https://nodejs.org and run this again.
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>22||(a===22&&b>=18)?0:1)"
if errorlevel 1 (
  echo Your Node.js is too old. Install Node 22.18 or newer from https://nodejs.org.
  pause
  exit /b 1
)
if not exist "node_modules\.package-lock.json" (
  echo Installing website packages ^(first run only^)...
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    echo Could not install the website packages. Check your internet connection and run this again.
    pause
    exit /b 1
  )
)

rem --- Python (sign recognition + Community) -----------------------------------
if not exist ".venv\Scripts\python.exe" (
  set "PY="
  py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)" >nul 2>&1 && set "PY=py -3"
  if not defined PY (
    python -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)" >nul 2>&1 && set "PY=python"
  )
  call :make_venv
  if errorlevel 1 exit /b 1
)
fc /b "backend\requirements.txt" ".venv\.requirements" >nul 2>&1
if errorlevel 1 (
  echo Installing the Python packages ^(first run only^)...
  ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r backend\requirements.txt
  if errorlevel 1 (
    echo Could not install every Python package. The website still opens; Sign to Text and Community may not work.
  ) else (
    copy /y "backend\requirements.txt" ".venv\.requirements" >nul
  )
)
set "PARLANCE_PYTHON=%CD%\.venv\Scripts\python.exe"

rem --- Run ---------------------------------------------------------------------
echo Starting Parlance at %URL% (press Ctrl+C to stop)...
call node scripts\copy-assets.mjs

rem Opens the browser as soon as the website answers (in the background).
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 120; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%URL%/' | Out-Null; Start-Process '%URL%%PAGE%'; break } catch { Start-Sleep -Seconds 1 } }"

node --env-file-if-exists=.env scripts\dev.mjs
exit /b %errorlevel%

:make_venv
if not defined PY (
  echo Python 3.11 or newer is not installed. Install it from https://www.python.org ^(tick "Add python.exe to PATH"^) and run this again.
  pause
  exit /b 1
)
echo Creating the Python environment ^(first run only^)...
%PY% -m venv .venv
if errorlevel 1 (
  echo Could not create the Python environment.
  pause
  exit /b 1
)
exit /b 0
