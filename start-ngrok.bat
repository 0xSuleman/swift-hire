@echo off
REM Swift Hire — ngrok startup script (Windows)
REM Usage: Double-click or run from Command Prompt
REM Requires: ngrok installed and authenticated, Python in PATH

echo ╔══════════════════════════════════════╗
echo ║     Swift Hire — ngrok Launcher      ║
echo ╚══════════════════════════════════════╝

REM Check ngrok is installed
where ngrok >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ngrok not found. Download from https://ngrok.com/download
    echo         Then run: ngrok config add-authtoken ^<your-token^>
    pause
    exit /b 1
)

REM Kill any existing ngrok process
taskkill /f /im ngrok.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo.
echo [*] Starting ngrok tunnel on port 5173...
start "" /min ngrok http 5173
timeout /t 3 /nobreak >nul

REM Fetch the public URL from ngrok's local API
for /f "delims=" %%i in ('python -c "import urllib.request,json; data=json.load(urllib.request.urlopen(\"http://localhost:4040/api/tunnels\")); tunnels=data[\"tunnels\"]; https=[t for t in tunnels if t[\"proto\"]==\"https\"]; print(https[0][\"public_url\"] if https else tunnels[0][\"public_url\"])" 2^>nul') do set NGROK_URL=%%i

if "%NGROK_URL%"=="" (
    echo [ERROR] Could not get ngrok URL. Make sure ngrok is authenticated.
    pause
    exit /b 1
)

echo [OK] Ngrok tunnel active: %NGROK_URL%
echo.
echo [INFO] Verification emails will link to: %NGROK_URL%/verify-email?token=...
echo.
echo [*] Starting backend...
echo     (Close this window to stop)
echo.

set FRONTEND_URL=%NGROK_URL%
set JAVA_HOME=C:\Program Files\Java\jdk-17
cd /d "%~dp0backend"
mvn spring-boot:run
pause
