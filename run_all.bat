@echo off
title LAUNCH ALL SERVICES
echo Starting Backend, Frontend, and Admin Panel...
start "BACKEND (Port 8000)" cmd /k "%~dp0start_backend.bat"
start "FRONTEND (Port 5173)" cmd /k "%~dp0start_frontend.bat"
start "ADMIN PANEL (Port 5174)" cmd /k "%~dp0start_admin.bat"
timeout /t 5 /nobreak >nul
start "" "chrome.exe" "http://localhost:5173" "http://localhost:5174"
echo All services launched!
