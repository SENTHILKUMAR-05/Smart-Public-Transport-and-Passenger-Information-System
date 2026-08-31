import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

# Set seed for reproducibility
np.random.seed(42)

print("--- Generating Synthetic TNSTC Historical Transportation Dataset ---")

# Routes in Tamil Nadu
routes = [
    {"route_id": 101, "name": "Dharmapuri - Sathyamangalam", "base_distance": 135.0, "base_duration": 195},
    {"route_id": 102, "name": "Chennai (CMBT) - Madurai (Arapalayam)", "base_distance": 460.0, "base_duration": 480},
    {"route_id": 103, "name": "Coimbatore - Salem", "base_distance": 160.0, "base_duration": 210},
    {"route_id": 104, "name": "Chennai - Hosur - Bangalore", "base_distance": 345.0, "base_duration": 360},
    {"route_id": 105, "name": "Madurai - Tirunelveli - Kanyakumari", "base_distance": 245.0, "base_duration": 270},
]

# Generate 5000 historical trip records
data = []
for _ in range(5000):
    route = np.random.choice(routes)
    day_of_week = np.random.randint(0, 7) # 0=Monday, 6=Sunday
    hour_of_day = np.random.randint(5, 23) # 5 AM to 10 PM
    is_holiday = 1 if np.random.random() < 0.15 or day_of_week in [5, 6] else 0
    season_code = np.random.randint(0, 4) # 0=Summer, 1=Monsoon, 2=Festive(Pongal/Diwali), 3=Winter
    
    # Weather: 0=Clear, 1=Rain, 2=Heavy Rain/Fog
    weather_condition = np.random.choice([0, 1, 2], p=[0.75, 0.20, 0.05])
    # Traffic: 0=Low, 1=Moderate, 2=Heavy, 3=Severe Congestion
    traffic_density = np.random.choice([0, 1, 2, 3], p=[0.30, 0.45, 0.20, 0.05])
    
    # Occupancy calculation logic (with realistic peak hours & festive boosts)
    base_occ = 45.0
    if hour_of_day in [7, 8, 9, 17, 18, 19]:
        base_occ += 25.0 # Morning/evening peak
    if is_holiday == 1:
        base_occ += 15.0
    if season_code == 2: # Festive (Pongal/Diwali)
        base_occ += 12.0
    
    # Random noise
    occupancy_pct = min(100.0, max(15.0, base_occ + np.random.normal(0, 8.0)))
    
    # Delay calculation (in minutes)
    base_delay = 2.0
    if traffic_density == 1:
        base_delay += 8.0
    elif traffic_density == 2:
        base_delay += 18.0
    elif traffic_density == 3:
        base_delay += 35.0
        
    if weather_condition == 1:
        base_delay += 7.0
    elif weather_condition == 2:
        base_delay += 20.0
        
    if is_holiday == 1:
        base_delay += 5.0
        
    delay_minutes = max(0.0, base_delay + np.random.normal(0, 3.0))
    
    data.append({
        "route_id": route["route_id"],
        "base_distance": route["base_distance"],
        "day_of_week": day_of_week,
        "hour_of_day": hour_of_day,
        "is_holiday": is_holiday,
        "season_code": season_code,
        "weather_condition": weather_condition,
        "traffic_density": traffic_density,
        "occupancy_pct": round(occupancy_pct, 1),
        "delay_minutes": round(delay_minutes, 1)
    })

df = pd.DataFrame(data)

# Save historical dataset
os.makedirs("/home/user/sptpis/ai_service/data", exist_ok=True)
csv_path = "/home/user/sptpis/ai_service/data/tnstc_historical_data.csv"
df.to_csv(csv_path, index=False)
print(f"Saved dataset to {csv_path} with {len(df)} rows.")

# Train Crowd Prediction Model (Occupancy %)
print("--- Training AI Crowd Prediction Model (Random Forest) ---")
X_crowd = df[["route_id", "day_of_week", "hour_of_day", "is_holiday", "season_code"]]
y_crowd = df["occupancy_pct"]

X_c_train, X_c_test, y_c_train, y_c_test = train_test_split(X_crowd, y_crowd, test_size=0.2, random_state=42)
crowd_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
crowd_model.fit(X_c_train, y_c_train)
c_preds = crowd_model.predict(X_c_test)
print(f"Crowd Model MAE: {mean_absolute_error(y_c_test, c_preds):.2f}%")

# Train Delay Prediction Model (Delay Minutes)
print("--- Training AI Delay Prediction Model (Gradient Boosting) ---")
X_delay = df[["route_id", "base_distance", "hour_of_day", "weather_condition", "traffic_density", "is_holiday"]]
y_delay = df["delay_minutes"]

X_d_train, X_d_test, y_d_train, y_d_test = train_test_split(X_delay, y_delay, test_size=0.2, random_state=42)
delay_model = GradientBoostingRegressor(n_estimators=120, max_depth=5, random_state=42)
delay_model.fit(X_d_train, y_d_train)
d_preds = delay_model.predict(X_d_test)
print(f"Delay Model MAE: {mean_absolute_error(y_d_test, d_preds):.2f} mins")

# Save Models
os.makedirs("/home/user/sptpis/ai_service/models", exist_ok=True)
joblib.dump(crowd_model, "/home/user/sptpis/ai_service/models/crowd_model.pkl")
joblib.dump(delay_model, "/home/user/sptpis/ai_service/models/delay_model.pkl")
print("Models saved successfully to /home/user/sptpis/ai_service/models/")
