@echo off
title InvoiceFlow - Setup
cd /d "%~dp0"
echo ==========================================
echo        InvoiceFlow - One Click Setup
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js nahi mila. https://nodejs.org se LTS install karein.
  pause
  exit /b
)

findstr /c:"USERNAME:PASSWORD" backend\.env >nul 2>nul
if not errorlevel 1 (
  echo [X] backend\.env mein abhi MongoDB Atlas ki connection string nahi daali gayi.
  echo     MONGO_URI wali line mein apni Atlas string paste karein, phir dobara chalayein.
  pause
  exit /b
)

echo [..] Backend packages install ho rahe hain...
pushd backend & call npm install & popd
echo [..] Frontend packages install ho rahe hain...
pushd frontend & call npm install & popd
echo [OK] Packages tayyar.
echo.
echo ==========================================
echo   Setup mukammal! App start ho rahi hai...
echo ==========================================
call "%~dp0start.bat"
