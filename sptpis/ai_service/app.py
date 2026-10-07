import os
import sqlite3
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "database", "sptpis.sqlite"))

# Initialize Gemini if key exists
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    llm_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    llm_model = None

app = Flask(__name__)
CORS(app)

# Load Trained Scikit-Learn Models
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
crowd_model = None
delay_model = None

try:
    crowd_model = joblib.load(os.path.join(MODEL_DIR, "crowd_model.pkl"))
    delay_model = joblib.load(os.path.join(MODEL_DIR, "delay_model.pkl"))
    print("AI Models Loaded Successfully.")
except Exception as e:
    print(f"Error loading models: {e}")

@app.route("/api/ai/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "TNSTC AI Analytics Microservice",
        "models_loaded": {
            "crowd_model": crowd_model is not None,
            "delay_model": delay_model is not None
        }
    })

@app.route("/api/ai/predict-crowd", methods=["POST"])
def predict_crowd():
    """
    Predict bus occupancy % based on route, day of week, hour, holidays, and season.
    """
    data = request.json or {}
    try:
        route_id = int(data.get("route_id", 101))
        day_of_week = int(data.get("day_of_week", 2)) # 0-6
        hour_of_day = int(data.get("hour_of_day", 8)) # 5-23
        is_holiday = int(data.get("is_holiday", 0))
        season_code = int(data.get("season_code", 0))
        
        input_df = pd.DataFrame([{
            "route_id": route_id,
            "day_of_week": day_of_week,
            "hour_of_day": hour_of_day,
            "is_holiday": is_holiday,
            "season_code": season_code
        }])
        
        if crowd_model:
            prediction = float(crowd_model.predict(input_df)[0])
        else:
            # Fallback heuristic if model unloaded
            prediction = 75.0 if (hour_of_day in [7,8,9,17,18,19] or is_holiday) else 45.0
            
        prediction = min(100.0, max(5.0, round(prediction, 1)))
        
        # Categorize crowding level
        status = "Normal"
        if prediction > 80.0:
            status = "High Crowding"
        elif prediction < 40.0:
            status = "Low Crowding"
            
        return jsonify({
            "status": "success",
            "prediction": {
                "route_id": route_id,
                "expected_occupancy": prediction,
                "crowding_status": status,
                "factors": {
                    "hour_of_day": f"{hour_of_day}:00",
                    "is_holiday": "Yes" if is_holiday else "No",
                    "day_of_week": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][day_of_week]
                }
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/ai/predict-delay", methods=["POST"])
def predict_delay():
    """
    Predict bus delay in minutes based on traffic, weather, route length, and time of day.
    """
    data = request.json or {}
    try:
        route_id = int(data.get("route_id", 101))
        base_distance = float(data.get("base_distance", 135.0))
        hour_of_day = int(data.get("hour_of_day", 14))
        weather_condition = int(data.get("weather_condition", 0)) # 0=Clear, 1=Rain, 2=Heavy Rain/Fog
        traffic_density = int(data.get("traffic_density", 1)) # 0=Low, 1=Mod, 2=Heavy, 3=Severe
        is_holiday = int(data.get("is_holiday", 0))
        
        input_df = pd.DataFrame([{
            "route_id": route_id,
            "base_distance": base_distance,
            "hour_of_day": hour_of_day,
            "weather_condition": weather_condition,
            "traffic_density": traffic_density,
            "is_holiday": is_holiday
        }])
        
        if delay_model:
            delay_pred = float(delay_model.predict(input_df)[0])
        else:
            delay_pred = 12.0
            
        delay_pred = max(0.0, round(delay_pred, 1))
        
        weather_labels = ["Clear & Sunny", "Light Rain", "Heavy Rain / Fog"]
        traffic_labels = ["Low Traffic", "Moderate Traffic", "Heavy Congestion", "Severe Gridlock"]
        
        return jsonify({
            "status": "success",
            "prediction": {
                "route_id": route_id,
                "expected_delay_minutes": delay_pred,
                "factors": {
                    "traffic_density": traffic_labels[traffic_density],
                    "weather_condition": weather_labels[weather_condition],
                    "base_distance_km": base_distance
                }
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/ai/recommend-route", methods=["POST"])
def recommend_route():
    """
    Evaluates multiple route options and suggests the optimal route with an explanation.
    """
    data = request.json or {}
    routes_to_compare = data.get("routes", [
        {
            "route_id": "Route A",
            "stops_count": 3,
            "duration_minutes": 225, # 3 hr 45 min
            "distance_km": 140,
            "traffic_density": 2, # Heavy
            "occupancy_pct": 88.0,
            "waiting_time_mins": 25
        },
        {
            "route_id": "Route B",
            "stops_count": 4,
            "duration_minutes": 195, # 3 hr 15 min
            "distance_km": 138,
            "traffic_density": 0, # Low
            "occupancy_pct": 52.0,
            "waiting_time_mins": 10
        }
    ])
    
    scored_routes = []
    for r in routes_to_compare:
        # Score calculation: lower score is better
        # We weigh duration, traffic, occupancy, waiting time
        dur = r.get("duration_minutes", 180)
        traf = r.get("traffic_density", 1) * 15 # penalty per traffic level
        occ = r.get("occupancy_pct", 60) * 0.4
        wait = r.get("waiting_time_mins", 15) * 1.5
        
        composite_score = dur + traf + occ + wait
        scored_routes.append({
            "route": r,
            "score": round(composite_score, 2)
        })
        
    # Sort by score ascending
    scored_routes.sort(key=lambda x: x["score"])
    best = scored_routes[0]["route"]
    runner_up = scored_routes[1]["route"] if len(scored_routes) > 1 else None
    
    # Formulate natural explanation
    reasons = []
    if best.get("duration_minutes", 0) < (runner_up.get("duration_minutes", 999) if runner_up else 999):
        diff = (runner_up["duration_minutes"] - best["duration_minutes"]) if runner_up else 30
        reasons.append(f"{diff} minutes faster travel time")
    if best.get("traffic_density", 1) < (runner_up.get("traffic_density", 2) if runner_up else 2):
        reasons.append("significantly less traffic congestion")
    if best.get("occupancy_pct", 50) < (runner_up.get("occupancy_pct", 80) if runner_up else 80):
        reasons.append(f"lower passenger density ({best.get('occupancy_pct')}% vs {runner_up.get('occupancy_pct') if runner_up else 85}%)")
    if best.get("waiting_time_mins", 10) < (runner_up.get("waiting_time_mins", 20) if runner_up else 20):
        reasons.append("shorter waiting time at source bus stand")
        
    reason_str = ", ".join(reasons) if reasons else "optimal combination of distance, travel time, and occupancy."
    reason_str = reason_str[0].upper() + reason_str[1:] + "."
    
    return jsonify({
        "status": "success",
        "recommended_route": best["route_id"],
        "reason": f"Less traffic and lower passenger density. ({reason_str})",
        "comparison": [
            {
                "route_id": item["route"]["route_id"],
                "stops": item["route"]["stops_count"],
                "duration": f"{item['route']['duration_minutes'] // 60} hr {item['route']['duration_minutes'] % 60} min",
                "traffic_status": ["Low", "Moderate", "Heavy", "Severe"][item["route"].get("traffic_density", 1)],
                "occupancy": f"{item['route'].get('occupancy_pct')}%",
                "score": item["score"]
            }
            for item in scored_routes
        ]
    })

@app.route("/api/ai/chatbot", methods=["POST"])
def chatbot():
    """
    True RAG AI Chat Assistant. 
    Pulls live data from SQLite and passes it as context to Gemini for natural reasoning.
    """
    data = request.json or {}
    message = (data.get("message") or "").strip()
    
    # 1. Retrieve Current Live Context from DB
    context_str = "CURRENT SYSTEM DATA UNAVAILABLE"
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        buses = cur.execute("SELECT registration_number, current_route_id, status FROM Buses").fetchall()
        routes = cur.execute("SELECT route_id, name, source_city, destination_city FROM Routes").fetchall()
        trips = cur.execute("SELECT trip_id, bus_id, route_id, scheduled_departure, status FROM Trips WHERE status != 'Completed'").fetchall()
        
        bus_str = ", ".join([f"{b['registration_number']} (Route {b['current_route_id']}, Stat: {b['status']})" for b in buses[:5]])
        route_str = ", ".join([f"R{r['route_id']}: {r['source_city']} to {r['destination_city']}" for r in routes[:5]])
        trip_str = ", ".join([f"Trip {t['trip_id']} departs at {t['scheduled_departure']} (Stat: {t['status']})" for t in trips[:5]])
        
        context_str = f"Live Buses: {bus_str}. Routes: {route_str}. Active Trips: {trip_str}."
        conn.close()
    except Exception as e:
        print("DB Access error for RAG:", e)

    response_text = ""
    suggested_actions = ["Check Bus Timing", "Live Tracking", "Book a ticket"]

    # 2. Use Gemini API if configured
    if llm_model:
        prompt = f"""You are the Tamil Nadu Smart Public Transport (TNSTC) AI Assistant. 
Answer the passenger's query dynamically using ONLY the following Live Database Context (do not invent data, if you lack info just say so kindly):
Live Context: {context_str}

Passenger Query: {message}

Provide a helpful, realistic, short and conversational response."""
        try:
            resp = llm_model.generate_content(prompt)
            response_text = resp.text.strip()
        except Exception as e:
            response_text = f"[AI API Error - Fallback] Our live data shows: {context_str}. How else can I help?"
    else:
        # 3. Dynamic Rule Fallback if no API key is provided
        message_low = message.lower()
        if "bus" in message_low or "route" in message_low or "time" in message_low:
            response_text = f"Here is the real-time data I found on our servers:\n{context_str}\n\n(Note: Define GEMINI_API_KEY environment variable to enable natural language parsing of this data!)"
        else:
            response_text = "I am connected to the live TNSTC database! Please ask me about buses, routes, or trips. (Set GEMINI_API_KEY to unlock advanced conversational RAG capabilities)."

    return jsonify({
        "status": "success",
        "response": response_text,
        "suggested_actions": suggested_actions,
        "timestamp": pd.Timestamp.now().strftime("%I:%M %p"),
        "ai_model": "Gemini-1.5 RAG Integration" if llm_model else "Live DB Fetcher (No LLM Key)"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting TNSTC AI Analytics Microservice on Port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
