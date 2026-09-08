@echo off
title ADMIN PANEL (Port 5174)
color 0E
echo ====================================================
echo Starting Admin Panel on http://localhost:5174
echo ====================================================
cd /d "%~dp0admin"
npm run dev
pause
