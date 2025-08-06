@echo off
cd /d "%~dp0"
echo Starting Duitku Frontend (React with Vite)...
echo.
npm run dev
echo.
echo Frontend stopped. Press any key to exit...
pause > nul