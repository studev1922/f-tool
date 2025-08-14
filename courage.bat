@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"

echo Checking Node.js...
where node >nul 2>&1 || (
  echo [x] Node.js not found. Download: https://nodejs.org
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
echo Node.js version: %NODE_VER%

echo Checking npm...
where npm >nul 2>&1 || (
  echo [x] npm not found. Check your Node.js installation.
  exit /b 1
)

echo Checking for package.json...
if not exist package.json (
  echo [x] package.json not found in: %cd%
  echo [→] Opening folder in File Explorer...
  start "" explorer "%cd%"
  exit /b 2
)
echo Found: %cd%\package.json

echo.
echo Running: npm install
call npm install || (
  echo [x] npm install failed.
  exit /b 3
)

echo.
echo Running: npm start
call npm start
set "EXITCODE=%errorlevel%"
if not "%EXITCODE%"=="0" (
  echo [x] npm start failed (exit code %EXITCODE%).
)
exit /b %EXITCODE%
