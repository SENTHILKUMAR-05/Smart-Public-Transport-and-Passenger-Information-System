const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../database/sptpis.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

// Initialize 12-table schema in SQLite format
let isReady = false;
let readyPromise = new Promise((resolve, reject) => {
    db.serialize(() => {
        // 1. Users
        db.run(`CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'passenger',
            category TEXT DEFAULT 'General',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Drivers
        db.run(`CREATE TABLE IF NOT EXISTS Drivers (
            driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
            license_number TEXT UNIQUE NOT NULL,
            badge_number TEXT UNIQUE NOT NULL,
            depot TEXT DEFAULT 'Dharmapuri Depot',
            experience_years INTEGER DEFAULT 5,
            status TEXT DEFAULT 'Active',
            rating REAL DEFAULT 4.85,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. Routes
        db.run(`CREATE TABLE IF NOT EXISTS Routes (
            route_id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            source_city TEXT NOT NULL,
            destination_city TEXT NOT NULL,
            total_distance_km REAL NOT NULL,
            estimated_duration_mins INTEGER NOT NULL,
            base_fare REAL NOT NULL,
            route_type TEXT DEFAULT 'Express',
            polyline_coords TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 4. Stops
        db.run(`CREATE TABLE IF NOT EXISTS Stops (
            stop_id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_id INTEGER REFERENCES Routes(route_id) ON DELETE CASCADE,
            stop_name TEXT NOT NULL,
            stop_order INTEGER NOT NULL,
            distance_from_source_km REAL DEFAULT 0,
            eta_offset_mins INTEGER DEFAULT 0,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            is_major_hub INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 5. Buses
        db.run(`CREATE TABLE IF NOT EXISTS Buses (
            bus_id INTEGER PRIMARY KEY AUTOINCREMENT,
            registration_number TEXT UNIQUE NOT NULL,
            bus_type TEXT NOT NULL,
            total_seats INTEGER DEFAULT 54,
            depot_name TEXT DEFAULT 'Dharmapuri Depot',
            current_route_id INTEGER REFERENCES Routes(route_id) ON DELETE SET NULL,
            assigned_driver_id INTEGER REFERENCES Drivers(driver_id) ON DELETE SET NULL,
            status TEXT DEFAULT 'Active',
            wifi_available INTEGER DEFAULT 0,
            gps_device_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 6. Bookings
        db.run(`CREATE TABLE IF NOT EXISTS Bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_reference TEXT UNIQUE NOT NULL,
            user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
            bus_id INTEGER REFERENCES Buses(bus_id) ON DELETE CASCADE,
            route_id INTEGER REFERENCES Routes(route_id) ON DELETE CASCADE,
            seat_number TEXT NOT NULL,
            boarding_stop TEXT NOT NULL,
            destination_stop TEXT NOT NULL,
            travel_date TEXT NOT NULL,
            fare_paid REAL NOT NULL,
            booking_status TEXT DEFAULT 'Confirmed',
            qr_code_token TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 7. Passenger_Tracking
        db.run(`CREATE TABLE IF NOT EXISTS Passenger_Tracking (
            tracking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_id INTEGER REFERENCES Buses(bus_id) ON DELETE CASCADE,
            route_id INTEGER REFERENCES Routes(route_id) ON DELETE CASCADE,
            reserved_passengers_count INTEGER DEFAULT 0,
            normal_passengers_count INTEGER DEFAULT 0,
            total_occupancy_count INTEGER DEFAULT 0,
            occupancy_percentage REAL DEFAULT 0,
            current_stop_name TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 8. GPS_Tracking
        db.run(`CREATE TABLE IF NOT EXISTS GPS_Tracking (
            gps_id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_id INTEGER REFERENCES Buses(bus_id) ON DELETE CASCADE,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            speed_kmh REAL DEFAULT 0,
            heading_degrees INTEGER DEFAULT 0,
            current_stop_index INTEGER DEFAULT 0,
            next_stop_name TEXT,
            distance_remaining_km REAL,
            estimated_arrival_mins INTEGER,
            route_completion_pct REAL DEFAULT 0,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 9. Seat_Management
        db.run(`CREATE TABLE IF NOT EXISTS Seat_Management (
            seat_mgmt_id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_id INTEGER REFERENCES Buses(bus_id) ON DELETE CASCADE,
            seat_number TEXT NOT NULL,
            travel_date TEXT NOT NULL,
            is_booked INTEGER DEFAULT 0,
            passenger_name TEXT,
            passenger_type TEXT DEFAULT 'Normal',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 10. Notifications
        db.run(`CREATE TABLE IF NOT EXISTS Notifications (
            notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient_user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 11. Chatbot_History
        db.run(`CREATE TABLE IF NOT EXISTS Chatbot_History (
            chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL,
            user_query TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            suggested_actions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 12. Predictions
        db.run(`CREATE TABLE IF NOT EXISTS Predictions (
            prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_id INTEGER REFERENCES Routes(route_id) ON DELETE CASCADE,
            prediction_type TEXT,
            predicted_value REAL NOT NULL,
            confidence_score REAL DEFAULT 0.92,
            influencing_factors TEXT,
            prediction_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // NEW MODULES FOR STATE ADMIN DASHBOARD
        db.run(`CREATE TABLE IF NOT EXISTS Corporations (
            corporation_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            code TEXT UNIQUE NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Regions (
            region_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            corporation_id INTEGER REFERENCES Corporations(corporation_id) ON DELETE CASCADE,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Depots (
            depot_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            region_id INTEGER REFERENCES Regions(region_id) ON DELETE CASCADE,
            address TEXT,
            latitude REAL,
            longitude REAL,
            contact_info TEXT,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Districts (
            district_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            code TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'Active'
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Route_Proposals (
            proposal_id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            distance_km REAL,
            regions_covered TEXT,
            estimated_demand TEXT,
            requested_by TEXT,
            status TEXT DEFAULT 'Pending Review',
            submitted_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Alerts (
            alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            alert_type TEXT,
            priority TEXT DEFAULT 'Medium',
            target_scope TEXT,
            start_time DATETIME,
            end_time DATETIME,
            created_by TEXT,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Emergency_Alerts (
            emergency_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT DEFAULT 'Critical',
            affected_areas TEXT,
            status TEXT DEFAULT 'Active',
            activated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Complaints (
            complaint_id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            route_id INTEGER REFERENCES Routes(route_id),
            bus_id INTEGER REFERENCES Buses(bus_id),
            location TEXT,
            reported_by TEXT,
            severity TEXT DEFAULT 'Medium',
            status TEXT DEFAULT 'Open',
            escalation_level INTEGER DEFAULT 1,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Incidents (
            incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_type TEXT,
            bus_id INTEGER REFERENCES Buses(bus_id),
            route_id INTEGER REFERENCES Routes(route_id),
            location TEXT,
            region_id INTEGER REFERENCES Regions(region_id),
            depot_id INTEGER REFERENCES Depots(depot_id),
            severity TEXT DEFAULT 'High',
            description TEXT,
            status TEXT DEFAULT 'Reported',
            reported_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_time DATETIME
        )`);

        // NEW DRILLDOWN DEPOT TABLES
        db.run(`CREATE TABLE IF NOT EXISTS Conductors (
            conductor_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            employee_number TEXT UNIQUE NOT NULL,
            depot_id INTEGER REFERENCES Depots(depot_id),
            status TEXT DEFAULT 'Available'
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Trips (
            trip_id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_id INTEGER REFERENCES Routes(route_id),
            bus_id INTEGER REFERENCES Buses(bus_id),
            driver_id INTEGER REFERENCES Drivers(driver_id),
            conductor_id INTEGER REFERENCES Conductors(conductor_id),
            depot_id INTEGER REFERENCES Depots(depot_id),
            scheduled_departure DATETIME,
            actual_departure DATETIME,
            scheduled_arrival DATETIME,
            actual_arrival DATETIME,
            status TEXT DEFAULT 'Scheduled',
            delay_mins INTEGER DEFAULT 0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Maintenance (
            maintenance_id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_id INTEGER REFERENCES Buses(bus_id),
            depot_id INTEGER REFERENCES Depots(depot_id),
            maintenance_type TEXT,
            mechanic TEXT,
            status TEXT DEFAULT 'Scheduled',
            start_date DATETIME,
            end_date DATETIME
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Trip_Events (
            event_id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER REFERENCES Trips(trip_id),
            driver_id INTEGER REFERENCES Drivers(driver_id),
            bus_id INTEGER REFERENCES Buses(bus_id),
            event_type TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            metadata TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Audit_Logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER,
            action TEXT NOT NULL,
            module TEXT,
            record_id TEXT,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) reject(err);
            else {
                isReady = true;
                resolve();
            }
        });
    });
});

// Promise wrapper for database methods
const dbWrapper = {
    ensureReady: () => readyPromise,
    all: async (sql, params = []) => {
        await readyPromise;
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },
    get: async (sql, params = []) => {
        await readyPromise;
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    run: async (sql, params = []) => {
        await readyPromise;
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    },
    instance: db
};

module.exports = dbWrapper;
