@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

REM ==== Di chuyển tới thư mục chứa file .bat ====
cd /d "%~dp0"

echo [•] Kiểm tra Node.js...
where node >nul 2>&1
if errorlevel 1 (
  echo [x] Chua cai Node.js hoac khong co trong PATH.
  echo     Tai Node.js tai: https://nodejs.org
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
echo [✓] Node.js phien ban: %NODE_VER%

REM ==== Kiểm tra npm ====
where npm >nul 2>&1
if errorlevel 1 (
  echo [x] Khong tim thay npm. Kiem tra lai cai dat Node.js.
  exit /b 1
)

REM ==== Kiểm tra Node.js project (package.json) ====
if exist "package.json" (
  echo [✓] Da phat hien project Node.js: "%cd%\package.json"
) else (
  echo [x] Khong tim thay "package.json" trong thu muc:
  echo     %cd%
  echo [→] Mo thu muc trong File Explorer...
  start "" explorer.exe "%cd%"
  exit /b 2
)

REM ==== Cai dat phu thuoc va chay ung dung ====
echo.
echo [•] Chay: npm install
call npm install
if errorlevel 1 (
  echo [x] npm install that bai.
  exit /b 3
)

echo.
echo [•] Chay: npm start
call npm start
set "EXITCODE=%errorlevel%"

if not "%EXITCODE%"=="0" (
  echo [x] npm start that bai (ma loi %EXITCODE%).
)
exit /b %EXITCODE%
