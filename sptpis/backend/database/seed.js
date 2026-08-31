const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    console.log('--- Checking & Seeding TNSTC / SETC Database ---');

    // Check if Routes already seeded
    const existingRoutes = await db.all("SELECT * FROM Routes");
    if (existingRoutes && existingRoutes.length > 0) {
        console.log('Database already seeded. Existing routes:', existingRoutes.length);
        return;
    }

    console.log('Seeding fresh Tamil Nadu State Transport data...');

    // 1. Users (Passenger, Driver, Admin)
    const passHash = await bcrypt.hash('password123', 10);

    await db.run(
        `INSERT INTO Users (name, email, phone, password_hash, role, category) VALUES (?, ?, ?, ?, ?, ?)`,
        ['S. Karthik', 'passenger@tnstc.in', '9840123456', passHash, 'passenger', 'General']
    );
    await db.run(
        `INSERT INTO Users (name, email, phone, password_hash, role, category) VALUES (?, ?, ?, ?, ?, ?)`,
        ['K. Murugan (Driver)', 'driver@tnstc.in', '9443210987', passHash, 'driver', 'General']
    );
    await db.run(
        `INSERT INTO Users (name, email, phone, password_hash, role, category) VALUES (?, ?, ?, ?, ?, ?)`,
        ['TNSTC Control Center', 'admin@tnstc.in', '0442345678', passHash, 'admin', 'General']
    );
    await db.run(
        `INSERT INTO Users (name, email, phone, password_hash, role, category) VALUES (?, ?, ?, ?, ?, ?)`,
        ['M. Lakshmi (Pink Card)', 'lakshmi@tnstc.in', '9789012345', passHash, 'passenger', 'Women Free Scheme']
    );

    // 2. Drivers
    await db.run(
        `INSERT INTO Drivers (user_id, license_number, badge_number, depot, experience_years, status, rating) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [2, 'TN29-DL-2018821', 'TNSTC-BG-0412', 'Dharmapuri Depot', 12, 'Active', 4.92]
    );
    await db.run(
        `INSERT INTO Drivers (user_id, license_number, badge_number, depot, experience_years, status, rating) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [2, 'TN01-DL-2015004', 'SETC-BG-0188', 'Chennai Koyambedu', 8, 'Active', 4.88]
    );

    // 3. Routes
    // Route 1: Dharmapuri -> Salem -> Erode -> Sathyamangalam
    await db.run(
        `INSERT INTO Routes (route_code, name, source_city, destination_city, total_distance_km, estimated_duration_mins, base_fare, route_type, polyline_coords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            'TNSTC-101',
            'Dharmapuri - Sathyamangalam',
            'Dharmapuri',
            'Sathyamangalam',
            185.0,
            215,
            145.0,
            'SETC Ultra Deluxe',
            JSON.stringify([
                [12.1211, 78.1582], // Dharmapuri
                [11.9015, 78.1400], // Thoppur
                [11.6643, 78.1460], // Salem
                [11.5020, 77.9250], // Bhavani
                [11.3410, 77.7172], // Erode
                [11.5034, 77.2444]  // Sathyamangalam
            ])
        ]
    );

    // Route 2: Chennai -> Madurai
    await db.run(
        `INSERT INTO Routes (route_code, name, source_city, destination_city, total_distance_km, estimated_duration_mins, base_fare, route_type, polyline_coords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            'SETC-201',
            'Chennai - Villupuram - Trichy - Madurai',
            'Chennai',
            'Madurai',
            460.0,
            480,
            550.0,
            'AC Sleeper',
            JSON.stringify([
                [13.0674, 80.2086],
                [11.9401, 79.4988],
                [10.7905, 78.6918],
                [9.9252, 78.1198]
            ])
        ]
    );

    // Route 3: Coimbatore -> Salem
    await db.run(
        `INSERT INTO Routes (route_code, name, source_city, destination_city, total_distance_km, estimated_duration_mins, base_fare, route_type, polyline_coords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            'TNSTC-301',
            'Coimbatore - Tiruppur - Erode - Salem',
            'Coimbatore',
            'Salem',
            160.0,
            210,
            135.0,
            'Town Bus Pink',
            JSON.stringify([
                [11.0168, 76.9558],
                [11.1085, 77.3411],
                [11.3410, 77.7172],
                [11.6643, 78.1460]
            ])
        ]
    );

    // 4. Stops for Route 1 (Dharmapuri -> Sathyamangalam)
    await db.run(`INSERT INTO Stops (route_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude, is_major_hub) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Dharmapuri Bus Stand', 1, 0, 0, 12.1211, 78.1582, 1]);
    await db.run(`INSERT INTO Stops (route_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude, is_major_hub) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Salem Central Bus Stand', 2, 68, 85, 11.6643, 78.1460, 1]);
    await db.run(`INSERT INTO Stops (route_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude, is_major_hub) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Erode Junction Bus Stand', 3, 130, 155, 11.3410, 77.7172, 1]);
    await db.run(`INSERT INTO Stops (route_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude, is_major_hub) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Sathyamangalam Bus Stand', 4, 185, 215, 11.5034, 77.2444, 1]);

    // Stops for Route 2 (Chennai -> Madurai)
    await db.run(`INSERT INTO Stops (route_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude, is_major_hub) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [2, 'Chennai CMBT Koyambedu', 1, 0, 0, 13.0674, 80.2086, 1]);
    await db.run(`INSERT INTO Stops (route_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude, is_major_hub) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [2, 'Villupuram Bus Stand', 2, 160, 175, 11.9401, 79.4988, 1]);
    await db.run(`INSERT INTO Stops (route_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude, is_major_hub) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [2, 'Trichy Central Bus Stand', 3, 330, 340, 10.7905, 78.6918, 1]);
    await db.run(`INSERT INTO Stops (route_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude, is_major_hub) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [2, 'Madurai Arapalayam Bus Stand', 4, 460, 480, 9.9252, 78.1198, 1]);

    // 5. Buses
    await db.run(
        `INSERT INTO Buses (registration_number, bus_type, total_seats, depot_name, current_route_id, assigned_driver_id, status, wifi_available, gps_device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['TN-29-N-1542', 'SETC Ultra Deluxe', 54, 'Dharmapuri Depot', 1, 1, 'Active', 1, 'TN-GPS-101']
    );
    await db.run(
        `INSERT INTO Buses (registration_number, bus_type, total_seats, depot_name, current_route_id, assigned_driver_id, status, wifi_available, gps_device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['TN-38-N-4412', 'TNSTC Fast Express', 54, 'Salem Depot', 1, 1, 'Active', 0, 'TN-GPS-102']
    );
    await db.run(
        `INSERT INTO Buses (registration_number, bus_type, total_seats, depot_name, current_route_id, assigned_driver_id, status, wifi_available, gps_device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['TN-01-N-8821', 'AC Sleeper', 42, 'Chennai Depot', 2, 2, 'Active', 1, 'TN-GPS-103']
    );
    await db.run(
        `INSERT INTO Buses (registration_number, bus_type, total_seats, depot_name, current_route_id, assigned_driver_id, status, wifi_available, gps_device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['TN-45-N-3301', 'Town Bus Pink Scheme', 54, 'Coimbatore Depot', 3, 2, 'Active', 0, 'TN-GPS-104']
    );

    // 6. Bookings (Reserved Passengers for Bus 1: TN-29-N-1542)
    const reservedNames = [
        "R. Anitha", "M. Suresh", "V. Pradeep", "P. Meena", "K. Dinesh", "S. Priya",
        "A. Venkatesh", "G. Divya", "R. Baskar", "T. Gowri", "S. Karthik", "N. Ramesh",
        "P. Kamaraj", "V. Selvi", "D. Arun", "S. Radhika", "M. Rajesh", "K. Soundarya"
    ];
    for (let i = 0; i < reservedNames.length; i++) {
        await db.run(
            `INSERT INTO Bookings (booking_reference, user_id, bus_id, route_id, seat_number, boarding_stop, destination_stop, travel_date, fare_paid, booking_status, qr_code_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                `TNSTC-BK-${1000 + i}`,
                1,
                1,
                1,
                `S${i + 1}`,
                'Dharmapuri Bus Stand',
                'Sathyamangalam Bus Stand',
                new Date().toISOString().split('T')[0],
                145.0,
                i < 12 ? 'Boarded' : 'Confirmed',
                `QR-TOKEN-TNSTC-${1000 + i}`
            ]
        );
    }

    // 7. Passenger_Tracking
    await db.run(
        `INSERT INTO Passenger_Tracking (bus_id, route_id, reserved_passengers_count, normal_passengers_count, total_occupancy_count, occupancy_percentage, current_stop_name) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [1, 1, 18, 13, 31, 57.41, 'Salem Central Bus Stand']
    );

    // 8. GPS_Tracking (Bus 1 is at 65% completion: around Erode)
    await db.run(
        `INSERT INTO GPS_Tracking (bus_id, latitude, longitude, speed_kmh, heading_degrees, current_stop_index, next_stop_name, distance_remaining_km, estimated_arrival_mins, route_completion_pct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 11.4100, 77.8500, 58.0, 210, 3, 'Sathyamangalam Bus Stand', 55.0, 48, 65.0]
    );

    // 9. Seat_Management (54 Seats for Bus 1: 31 Booked, 23 Available)
    for (let i = 1; i <= 54; i++) {
        const isBooked = i <= 31 ? 1 : 0;
        const pName = i <= 18 ? reservedNames[i - 1] : (i <= 31 ? `Counter Normal Passenger #${i - 18}` : null);
        const pType = i <= 18 ? 'Reserved' : (i <= 31 ? 'Normal' : 'Empty');
        await db.run(
            `INSERT INTO Seat_Management (bus_id, seat_number, travel_date, is_booked, passenger_name, passenger_type) VALUES (?, ?, ?, ?, ?, ?)`,
            [1, `S${i}`, new Date().toISOString().split('T')[0], isBooked, pName, pType]
        );
    }

    // 10. Notifications
    await db.run(
        `INSERT INTO Notifications (recipient_user_id, title, message, category, is_read) VALUES (?, ?, ?, ?, ?)`,
        [1, 'Bus Arriving Soon', 'Bus TN-29-N-1542 (Dharmapuri -> Sathyamangalam) will reach Salem in 15 minutes.', 'Arrival', 0]
    );
    await db.run(
        `INSERT INTO Notifications (recipient_user_id, title, message, category, is_read) VALUES (?, ?, ?, ?, ?)`,
        [1, 'Optimal Route Recommendation Available', 'AI suggests Route B via bypass road to save 30 minutes due to low traffic.', 'Route Change', 0]
    );

    // 11. Predictions
    await db.run(
        `INSERT INTO Predictions (route_id, prediction_type, predicted_value, confidence_score, influencing_factors) VALUES (?, ?, ?, ?, ?)`,
        [1, 'Crowd_Occupancy', 87.0, 0.94, 'Morning peak hours (8 AM - 10 AM) + Festive Weekend']
    );
    // 12. NEW STATE ADMIN MODULE SEEDING
    await db.run(
        `INSERT INTO Corporations (name, code, description) VALUES (?, ?, ?)`,
        ['Tamil Nadu State Transport Corporation', 'TNSTC', 'Primary state public transport']
    );
    await db.run(
        `INSERT INTO Corporations (name, code, description) VALUES (?, ?, ?)`,
        ['State Express Transport Corporation', 'SETC', 'Long distance travel services']
    );

    // Regions
    await db.run(`INSERT INTO Regions (name, code, corporation_id) VALUES (?, ?, ?)`, ['Salem Region', 'SLM', 1]);
    await db.run(`INSERT INTO Regions (name, code, corporation_id) VALUES (?, ?, ?)`, ['Coimbatore Region', 'CBE', 1]);
    await db.run(`INSERT INTO Regions (name, code, corporation_id) VALUES (?, ?, ?)`, ['Madurai Region', 'MDU', 1]);
    await db.run(`INSERT INTO Regions (name, code, corporation_id) VALUES (?, ?, ?)`, ['Chennai Region', 'CHN', 2]);

    // Depots
    await db.run(`INSERT INTO Depots (name, code, region_id, address) VALUES (?, ?, ?, ?)`, ['Dharmapuri Depot', 'DPI', 1, 'Dharmapuri HQ']);
    await db.run(`INSERT INTO Depots (name, code, region_id, address) VALUES (?, ?, ?, ?)`, ['Salem Depot', 'SLMD', 1, 'Salem Main']);
    await db.run(`INSERT INTO Depots (name, code, region_id, address) VALUES (?, ?, ?, ?)`, ['Chennai Depot', 'CND', 4, 'Koyambedu']);

    // Districts
    await db.run(`INSERT INTO Districts (name, code) VALUES (?, ?)`, ['Dharmapuri', 'DPI-D']);
    await db.run(`INSERT INTO Districts (name, code) VALUES (?, ?)`, ['Salem', 'SLM-D']);
    await db.run(`INSERT INTO Districts (name, code) VALUES (?, ?)`, ['Erode', 'ERD-D']);
    await db.run(`INSERT INTO Districts (name, code) VALUES (?, ?)`, ['Chennai', 'CHN-D']);

    // Route Proposals
    await db.run(
        `INSERT INTO Route_Proposals (source, destination, distance_km, regions_covered, estimated_demand, requested_by) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Krishnagiri', 'Tiruvannamalai', 110.5, 'Salem, Villupuram', 'High', 'Dharmapuri Depot Admin']
    );

    // Alerts
    await db.run(
        `INSERT INTO Alerts (title, message, alert_type, priority, target_scope) VALUES (?, ?, ?, ?, ?)`,
        ['Pongal Special Buses', '1000 special buses to be operated from Chennai.', 'Festival Special Service', 'Medium', 'Entire State']
    );

    // Emergency Alerts
    await db.run(
        `INSERT INTO Emergency_Alerts (title, message, severity, affected_areas) VALUES (?, ?, ?, ?)`,
        ['Cyclone Warning', 'Heavy rainfall warning. Drive safely and expect delays.', 'Critical', 'Chennai, Cuddalore']
    );

    // Complaints
    await db.run(
        `INSERT INTO Complaints (category, route_id, bus_id, location, reported_by, severity, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Delay', 1, 1, 'Thoppur Toll', 'Passenger A', 'Low', 'Open']
    );
    await db.run(
        `INSERT INTO Complaints (category, route_id, bus_id, location, reported_by, severity, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Driver Behaviour', 2, 3, 'Villupuram', 'Passenger B', 'High', 'Escalated']
    );

    // Incidents
    await db.run(
        `INSERT INTO Incidents (incident_type, bus_id, route_id, location, region_id, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Breakdown', 2, 1, 'Omalur Bypass', 1, 'Medium', 'Engine overheating, replacement requested.']
    );

    // 13. NEW DEPOT MODULE SEEDING (Dharmapuri Depot ID = 1)
    await db.run(`INSERT INTO Conductors (name, phone, employee_number, depot_id) VALUES (?, ?, ?, ?)`, ['V. Sankar', '9876543210', 'COND-001', 1]);
    await db.run(`INSERT INTO Conductors (name, phone, employee_number, depot_id) VALUES (?, ?, ?, ?)`, ['M. Raj', '9876543211', 'COND-002', 1]);

    const todayStr = new Date().toISOString().split('T')[0];
    await db.run(
        `INSERT INTO Trips (route_id, bus_id, driver_id, conductor_id, depot_id, scheduled_departure, actual_departure, status, delay_mins) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 1, 1, 1, 1, `${todayStr} 08:00:00`, `${todayStr} 08:05:00`, 'Running', 5]
    );
    await db.run(
        `INSERT INTO Trips (route_id, bus_id, driver_id, conductor_id, depot_id, scheduled_departure, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [1, 2, 2, 2, 1, `${todayStr} 14:00:00`, 'Scheduled']
    );

    await db.run(
        `INSERT INTO Maintenance (bus_id, depot_id, maintenance_type, mechanic, status, start_date) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 1, 'Routine Service', 'Kannan Auto', 'Scheduled', `${todayStr} 20:00:00`]
    );

    console.log('--- Database successfully seeded with Tamil Nadu State Transport data! ---');
}

module.exports = seedDatabase;
