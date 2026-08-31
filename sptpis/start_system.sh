#!/usr/bin/env bash
set -e

echo "==============================================================================="
echo "  TNSTC Smart Public Transport & Passenger Information System (SPTPIS)"
echo "  Starting 3-Tier Full-Stack Microservices Architecture..."
echo "==============================================================================="

# 1. Start Python AI Analytics Microservice (Port 5001)
echo "[1/3] Launching Python AI Analytics & RAG Service (Port 5001)..."
/home/user/.venv/bin/python3 /home/user/sptpis/ai_service/app.py > /tmp/ai_service.log 2>&1 &
AI_PID=$!
sleep 2
if ps -p $AI_PID > /dev/null; then
  echo "      => AI Microservice running (PID $AI_PID)"
else
  echo "      => Warning: AI Microservice check log /tmp/ai_service.log"
fi

# 2. Start Node.js Express Backend & Real-time Simulator (Port 5000)
echo "[2/3] Launching Node.js Backend & Real-Time Bus Simulation Engine (Port 5000)..."
node /home/user/sptpis/backend/server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2
if ps -p $BACKEND_PID > /dev/null; then
  echo "      => Node.js Backend running (PID $BACKEND_PID)"
else
  echo "      => Warning: Backend check log /tmp/backend.log"
fi

# 3. Start React + Vite Frontend (Port 3000)
echo "[3/3] Launching React Vite Frontend (Port 3000)..."
cd /home/user/sptpis/frontend
npm run dev

# Cleanup background processes on exit
trap "kill $AI_PID $BACKEND_PID 2>/dev/null || true" EXIT
