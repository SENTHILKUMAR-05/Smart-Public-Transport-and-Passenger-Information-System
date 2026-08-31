@echo off
echo ===============================================================================
echo   TNSTC Smart Public Transport ^& Passenger Information System (SPTPIS)
echo   Starting 3-Tier Full-Stack Microservices Architecture for Windows...
echo ===============================================================================

REM Start AI Service in a new CMD window
echo [1/3] Launching Python AI Analytics ^& RAG Service (Port 5001)...
start "AI Service (Port 5001)" cmd /k "python ai_service/app.py"

REM Start Node Backend in a new CMD window
echo [2/3] Launching Node.js Backend ^& Real-Time Engine (Port 5000)...
start "Node Backend (Port 5000)" cmd /k "cd backend && node server.js"

REM Start React Frontend in a new CMD window
echo [3/3] Launching React Vite Frontend (Port 3000)...
start "React Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting up in separate windows!
echo Check the new terminal windows for logs.
echo Once the frontend has started, it will show a localhost URL for you to open in your browser.
pause
