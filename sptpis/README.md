# Smart Public Transport and Passenger Information System (SPTPIS)
### Focused on Tamil Nadu State Transport Corporation (TNSTC & SETC) Services

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()
[![AI Models](https://img.shields.io/badge/AI%20Models-Scikit--Learn%20v1.6-blue)]()
[![Real-Time Engine](https://img.shields.io/badge/Real--Time-Socket.IO%20v4.8-purple)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-emerald)]()
[![License](https://img.shields.io/badge/License-MIT-orange)]()

---

## 📌 Project Overview
The **Smart Public Transport and Passenger Information System (SPTPIS)** is a modern, full-stack, AI-driven transportation web application tailored specifically for **Tamil Nadu State Transport Corporation (TNSTC)** and **State Express Transport Corporation (SETC)** services.

Designed to resemble modern smart-city platforms like **Google Maps, RedBus, and Transit App**, this project combines **real-time Socket.IO live bus tracking**, **animated step-by-step route progression**, **Scikit-learn machine learning prediction models**, **live seat availability monitoring**, **driver boarding management**, and an **integrated RAG/NLP AI Chatbot**.

---

## 🚀 Technology Stack
| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Leaflet.js (CartoDB Dark Theme), Lucide Icons, Socket.IO Client |
| **Backend** | Node.js (v20+), Express.js, Socket.IO (WebSockets), JWT Authentication, Bcrypt, UUID |
| **Database** | PostgreSQL 12-Table Schema (`database/schema.sql`) with Embedded SQLite Runtime (`database/sptpis.sqlite`) |
| **AI & ML Microservice** | Python 3.13, Scikit-learn (RandomForest & GradientBoosting), Pandas, NumPy, Flask, RAG NLP Engine |

---

## 🌟 Unique Research Contributions (Why this is not a basic tracking app)
This system introduces **10 novel research contributions** suitable for final-year AIML project presentation, placement portfolio, and IEEE / Springer research publication:

1. **AI-Based Crowd Prediction**: RandomForest Regressor trained on historical TNSTC data to forecast bus occupancy % based on day of week, hour, holidays, and seasonal trends.
2. **AI Delay Prediction**: Gradient Boosting Machine estimating delay in minutes by evaluating traffic density, weather conditions, and route distance.
3. **Smart Route Recommendation**: Multi-objective decision engine comparing travel duration, historical traffic, and occupancy, outputting an optimal route with natural-language explanations (e.g., *"Less traffic and lower passenger density"*).
4. **Interactive Journey Timeline Visualization**: Google Maps-style animated vertical/horizontal journey timeline showing completed stops (`✓`), glowing current location badge, upcoming stops, distance/time between stops, and journey completion % bar.
5. **Live Seat Occupancy Monitoring**: Visual 54-seat bus layout monitoring in real-time (`Total: 54 | Booked: 31 | Available: 23`).
6. **Reserved vs. Normal Passenger Classification**: Distinguishes between online reserved ticket holders and normal direct-boarding/Women Free Scheme passengers.
7. **Real-Time Fleet Monitoring**: Full-screen interactive Leaflet map rendering all statewide buses with live speed, route progress, and status alerts.
8. **Integrated AI Chatbot**: Domain-expert RAG assistant floating on every page to answer natural-language transport queries.
9. **Tamil Nadu Public Transport Focus**: Authentic modeling of major Tamil Nadu routes (Dharmapuri → Salem → Erode → Sathyamangalam, Chennai → Madurai, Coimbatore → Salem Pink Bus).
10. **Smart City Transportation Analytics**: Production-grade full-stack architecture with automated simulation engines and analytical visual charts.

---

## 👥 User Roles & Features

### 1. 🧑‍🤝‍🧑 Passenger Module
- **Bus Search**: Source, Destination, Date filtering.
- **Advanced Route Visualization (Novel Feature)**:
  - Example Route: **Dharmapuri → Salem → Erode → Sathyamangalam**
  - Animated route polyline, moving bus marker, distance/time between stops, current bus location, and **Journey Completed percentage (65%)**.
- **Optimal Route Recommendation**: Compares Route A (3 Stops, 3 hr 45 min) vs. Route B (4 Stops, 3 hr 15 min) and highlights Route B with clear reasoning.
- **Live Bus Tracking**: Real-time speed (58 km/h), Next Stop, ETA (18 mins), Remaining Distance (55 km) via Socket.IO.
- **Seat Availability & Interactive Layout**: 54-seat layout selector allowing passengers to select a seat and generate a confirmed QR token ticket.
- **Passenger Categories**: Reserved Passengers card (Name, Seat #, Boarding, Destination) & Normal Passengers card.
- **Smart Notifications & QR E-Ticket**: Instant alert toast & printable PDF ticket view.

### 2. 🚌 Driver Module (`K. Murugan`, Bus `TN-29-N-1542`)
- **Driver Dashboard**: Assigned bus info, route details, and today's schedule.
- **Passenger Information**:
  - **Reserved Passengers Table**: Mark passenger **Boarded ✓** or **Dropped** with instant Socket.IO broadcast.
  - **Normal Passenger Counter**: **+ / -** buttons for conductors to adjust occupancy load in real-time.
- **Live Route Monitoring**: Current stop, next stop, distance remaining, ETA, speed, and route progress bar.
- **Emergency Reporting**: Instant alert buttons for **🚨 Accident**, **🔧 Breakdown**, or **🏥 Medical Emergency** that trigger urgent alerts on the Admin Control Center.

### 3. 🛡️ Admin Control Center
- **Transport Management**: Manage Buses, Drivers, Routes, and Passenger Bookings.
- **Live Fleet Monitoring**: Statewide CartoDB Dark Leaflet Map tracking all buses simultaneously.
- **Analytics Dashboard**: Interactive SVG bar charts and progress charts for:
  - Daily passengers & revenue trend (Weekly total: ₹48.57 Lakhs)
  - Route popularity & average occupancy
  - Peak hour time-of-day profile (6 AM to 8 PM)
  - Passenger classification breakdown (Reserved 58%, Normal 32%, Women Free Scheme 10%).

---

## 🗄️ Database Schema (12 Tables)
The complete DDL schema is located in `backend/database/schema.sql` and includes:
1. `Users` — Passenger, Driver, and Admin accounts.
2. `Drivers` — License, badge numbers, depot, and ratings.
3. `Routes` — Polyline GPS waypoints, distance, duration, and fare.
4. `Stops` — Ordered waypoints with ETA offset and major hub flags.
5. `Buses` — TNSTC/SETC registration numbers, seat counts, and live status.
6. `Bookings` — Reserved tickets, seat numbers, fare paid, and QR tokens.
7. `Passenger_Tracking` — Real-time reserved vs. normal passenger counters.
8. `GPS_Tracking` — Latitude, longitude, speed, heading, and completion %.
9. `Seat_Management` — Seat-level booking records for 54-seat buses.
10. `Notifications` — Smart alerts for arrivals, route recommendations, and emergencies.
11. `Chatbot_History` — User queries and AI responses for RAG audit logs.
12. `Predictions` — Scikit-learn occupancy and delay forecast records.

---

## 🤖 AI & RAG Chatbot Knowledge Base
The floating **TNSTC AI Assistant** is accessible from the bottom-right corner on every page and natively answers queries such as:
- *"When is the next bus to Salem?"*
- *"Show buses from Dharmapuri to Erode"*
- *"How many seats are available?"*
- *"Where is my bus currently?"*
- *"Suggest the fastest route"*

---

## ⚡ How to Run Locally

### Option 1: One-Command Start (Recommended)
Use the included launch script to start the Python AI Microservice, Node.js Backend, and React Vite Frontend simultaneously:
```bash
chmod +x start_system.sh
./start_system.sh
```

### Option 2: Run Microservices Individually
1. **Python AI Microservice** (Port 5001):
   ```bash
   /home/user/.venv/bin/python3 ai_service/app.py
   ```
2. **Node.js Express + Socket.IO Backend** (Port 5000):
   ```bash
   node backend/server.js
   ```
3. **React Vite Frontend** (Port 3000):
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🧪 Testing Role Switching & Simulation
1. **Quick Role Switcher**: In the top navigation bar, click the role badge (`Passenger / Driver / Admin`) to open the **Demo Role Switcher** and switch roles instantly.
2. **Simulation Control Bar**: Use the top bar to change simulation speed (**1x, 2x, 5x**) or click **"Simulate Delay Alert"** to test real-time WebSocket broadcasts across all connected dashboards.

---

## 📄 Research Publication & Citation
For AIML final-year project documentation or IEEE/Springer conference paper submission:
- **Title**: *An AI-Driven Smart Public Transport and Passenger Information System with Multi-Objective Route Optimization and Live Occupancy Prediction for Tamil Nadu State Transport*
- **Authors**: Smart City Transportation Research Team
- **Keywords**: *Public Transport System, Real-Time GPS Tracking, Scikit-Learn Occupancy Prediction, Delay Forecasting, RAG Chatbot, Tamil Nadu State Transport (TNSTC).*
