@echo off
title Tactical Range Simulator - Starter
echo ==========================================
echo   TACTICAL RANGE SIMULATOR v1.0.4
echo ==========================================
echo.
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed! 
    echo Please install it from https://nodejs.org/
    pause
    exit
)

echo.
echo Initializing simulation environment (npm install)...
echo This may take a minute on the first run...
call npm install

echo.
echo Starting Simulation...
echo Once started, open http://localhost:3000 in your browser.
echo.
call npm run dev
pause
