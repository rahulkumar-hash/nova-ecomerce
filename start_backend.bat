@echo off
title BACKEND SERVER (Port 8000)
color 0B
echo ====================================================
echo Starting Backend Server on http://localhost:8000
echo ====================================================
cd /d "%~dp0backend"
npm run dev
pause
