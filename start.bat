@echo off
cd /d "%~dp0"
start "InvoiceFlow Backend (band na karein)" cmd /k "cd backend && npm run dev"
start "InvoiceFlow Frontend (band na karein)" cmd /k "cd frontend && npm run dev"
echo Browser 8 second mein khul raha hai...
timeout /t 8 >nul
start "" http://localhost:5173
