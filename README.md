# Smart Public Transport and Passenger Information System (SPTPIS)

An intelligent public transit information platform for TNSTC / SETC featuring real-time bus tracking, passenger services, depot dashboards, and a dynamic AI passenger assistant.

---

## 🚀 Quick Setup Guide

### 1. Clone Repository
```bash
git clone https://github.com/SENTHILKUMAR-05/Smart-Public-Transport-and-Passenger-Information-System.git
cd Smart-Public-Transport-and-Passenger-Information-System
```

---

### 2. Configure Environment Variables (Gemini AI Key)

> **Important**: Secret `.env` files are ignored by git to protect API keys. You need to create a `.env` file in `sptpis/backend/`.

1. Go to `sptpis/backend/`:
   ```bash
   cd sptpis/backend
   ```
2. Copy `.env.example` to `.env`:
   - **Linux / macOS**: `cp .env.example .env`
   - **Windows PowerShell**: `Copy-Item .env.example .env`
   - **Windows Command Prompt**: `copy .env.example .env`
3. Edit `sptpis/backend/.env` and paste your Gemini API key:
   ```env
   PORT=5000
   AI_SERVICE_URL=http://127.0.0.1:5001/api/ai
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

*(Optional)* If running the Python AI microservice, also copy `sptpis/ai_service/.env.example` to `sptpis/ai_service/.env` and add the same key.

---

### 3. Start Backend (Node.js)
```bash
cd sptpis/backend
npm install
npm start
```
> Backend runs at: `http://localhost:5000`

---

### 4. Start Frontend (React + Vite)
In a new terminal window:
```bash
cd sptpis/frontend
npm install
npm run dev
```
> Passenger & Admin Portal runs at: `http://localhost:3000`

---

### 5. (Optional) Start Python AI Microservice
In a separate terminal (for crowd and delay ML model predictions):
```bash
cd sptpis/ai_service
pip install -r requirements.txt
python app.py
```
> AI Analytics Service runs at: `http://127.0.0.1:5001`

---

## 🤖 Dynamic Passenger Chatbot (Gemini AI + Fleet RAG)
The passenger chatbot uses Google Gemini with dynamic live fleet RAG:
- **Live Schedules & Fares**: Queries SQLite `BusSchedules` for exact timings, stops, and fares.
- **State Policy Intelligence**: Vidiyal Payanam (free travel for women on ordinary town buses), student and senior concessions, and 3-tier grievance SLA.
- **Multi-Model Fallback**: Automatically switches across `gemini-3.5-flash-lite`, `gemini-3.5-flash`, and `gemini-3.8-flash`.
- **Offline DB Fallback**: If no internet or API key is set, the chatbot automatically falls back to live local SQLite database responses.
