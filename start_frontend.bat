@echo off
title FRONTEND STOREFRONT (Port 5173)
color 0A
echo ====================================================
echo Starting Frontend Storefront on http://localhost:5173
echo ====================================================
cd /d "%~dp0frontend"
npm run dev
pause
