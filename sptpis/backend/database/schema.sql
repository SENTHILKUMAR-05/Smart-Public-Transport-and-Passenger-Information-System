-- =============================================================================
-- Smart Public Transport and Passenger Information System (SPTPIS)
-- Focused on Tamil Nadu State Transport Corporation (TNSTC / SETC)
-- PostgreSQL 12-Table Schema Definition
-- =============================================================================

-- 1. USERS TABLE (Passengers, Admins)
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'passenger' CHECK (role IN ('passenger', 'admin', 'driver')),
    category VARCHAR(50) DEFAULT 'General' CHECK (category IN ('General', 'Senior Citizen', 'Student', 'Women Free Scheme')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DRIVERS TABLE (TNSTC / SETC Bus Drivers)
CREATE TABLE IF NOT EXISTS Drivers (
    driver_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    depot VARCHAR(100) DEFAULT 'Dharmapuri Depot',
    experience_years INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'On-Route', 'Off-Duty', 'Emergency')),
    rating NUMERIC(3, 2) DEFAULT 4.85,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROUTES TABLE (Tamil Nadu Major Routes)
CREATE TABLE IF NOT EXISTS Routes (
    route_id SERIAL PRIMARY KEY,
    route_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    source_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    total_distance_km NUMERIC(6, 2) NOT NULL,
    estimated_duration_mins INTEGER NOT NULL,
    base_fare NUMERIC(8, 2) NOT NULL,
    route_type VARCHAR(50) DEFAULT 'Express' CHECK (route_type IN ('Express', 'SETC Ultra Deluxe', 'Town Bus Pink', 'AC Sleeper')),
    polyline_coords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. STOPS TABLE (Waypoints along routes with distances and ETA)
CREATE TABLE IF NOT EXISTS Stops (
    stop_id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES Routes(route_id) ON DELETE CASCADE,
    stop_name VARCHAR(100) NOT NULL,
    stop_order INTEGER NOT NULL,
    distance_from_source_km NUMERIC(6, 2) DEFAULT 0,
    eta_offset_mins INTEGER DEFAULT 0,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    is_major_hub BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. BUSES TABLE (TNSTC Fleet)
CREATE TABLE IF NOT EXISTS Buses (
    bus_id SERIAL PRIMARY KEY,
    registration_number VARCHAR(30) UNIQUE NOT NULL,
    bus_type VARCHAR(50) NOT NULL,
    total_seats INTEGER DEFAULT 54,
    depot_name VARCHAR(100) DEFAULT 'Dharmapuri Depot',
    current_route_id INTEGER REFERENCES Routes(route_id) ON DELETE SET NULL,
    assigned_driver_id INTEGER REFERENCES Drivers(driver_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Delayed', 'Maintenance', 'Emergency', 'Completed')),
    wifi_available BOOLEAN DEFAULT FALSE,
    gps_device_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. BOOKINGS TABLE (Reserved Passenger Tickets & QR Tokens)
CREATE TABLE IF NOT EXISTS Bookings (
    booking_id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    bus_id INTEGER REFERENCES Buses(bus_id) ON DELETE CASCADE,
    route_id INTEGER REFERENCES Routes(route_id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    boarding_stop VARCHAR(100) NOT NULL,
    destination_stop VARCHAR(100) NOT NULL,
    travel_date DATE NOT NULL,
    fare_paid NUMERIC(8, 2) NOT NULL,
    booking_status VARCHAR(20) DEFAULT 'Confirmed' CHECK (booking_status IN ('Confirmed', 'Boarded', 'Dropped', 'Cancelled')),
    qr_code_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PASSENGER_TRACKING TABLE (Reserved vs Normal Passenger Logs)
CREATE TABLE IF NOT EXISTS Passenger_Tracking (
    tracking_id SERIAL PRIMARY KEY,
    bus_id INTEGER REFERENCES Buses(bus_id) ON DELETE CASCADE,
    route_id INTEGER REFERENCES Routes(route_id) ON DELETE CASCADE,
    reserved_passengers_count INTEGER DEFAULT 0,
    normal_passengers_count INTEGER DEFAULT 0,
    total_occupancy_count INTEGER DEFAULT 0,
    occupancy_percentage NUMERIC(5, 2) DEFAULT 0,
    current_stop_name VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. GPS_TRACKING TABLE (Real-time Lat/Lng, speed, next stop, progress)
CREATE TABLE IF NOT EXISTS GPS_Tracking (
    gps_id SERIAL PRIMARY KEY,
    bus_id INTEGER REFERENCES Buses(bus_id) ON DELETE CASCADE,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    speed_kmh NUMERIC(5, 2) DEFAULT 0,
    heading_degrees INTEGER DEFAULT 0,
    current_stop_index INTEGER DEFAULT 0,
    next_stop_name VARCHAR(100),
    distance_remaining_km NUMERIC(6, 2),
    estimated_arrival_mins INTEGER,
    route_completion_pct NUMERIC(5, 2) DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. SEAT_MANAGEMENT TABLE (Seat Level Availability per Bus/Date)
CREATE TABLE IF NOT EXISTS Seat_Management (
    seat_mgmt_id SERIAL PRIMARY KEY,
    bus_id INTEGER REFERENCES Buses(bus_id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    travel_date DATE NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    passenger_name VARCHAR(100),
    passenger_type VARCHAR(20) DEFAULT 'Normal' CHECK (passenger_type IN ('Reserved', 'Normal', 'Women Scheme', 'Empty')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. NOTIFICATIONS TABLE (Smart Notifications & Alerts)
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General' CHECK (category IN ('Arrival', 'Delay', 'Route Change', 'Seat Update', 'Emergency')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. CHATBOT_HISTORY TABLE (User & AI Interactions for Audit/RAG)
CREATE TABLE IF NOT EXISTS Chatbot_History (
    chat_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL,
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    suggested_actions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. PREDICTIONS TABLE (AI Crowd & Delay Forecast Logs)
CREATE TABLE IF NOT EXISTS Predictions (
    prediction_id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES Routes(route_id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) CHECK (prediction_type IN ('Crowd_Occupancy', 'Delay_Minutes', 'Optimal_Route')),
    predicted_value NUMERIC(8, 2) NOT NULL,
    confidence_score NUMERIC(4, 2) DEFAULT 0.92,
    influencing_factors TEXT,
    prediction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buses_route ON Buses(current_route_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON Bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bus ON Bookings(bus_id);
CREATE INDEX IF NOT EXISTS idx_gps_bus ON GPS_Tracking(bus_id);
CREATE INDEX IF NOT EXISTS idx_stops_route ON Stops(route_id);
