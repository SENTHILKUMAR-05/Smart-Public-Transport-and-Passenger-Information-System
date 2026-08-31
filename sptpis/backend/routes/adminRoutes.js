const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 1. Live Fleet Monitoring Dashboard Data (All Buses, GPS, Status summary)
router.get('/fleet', async (req, res) => {
    try {
        const buses = await db.all(`
            SELECT b.*, r.name as route_name, r.source_city, r.destination_city,
                   gps.latitude, gps.longitude, gps.speed_kmh, gps.next_stop_name, 
                   gps.distance_remaining_km, gps.estimated_arrival_mins, gps.route_completion_pct,
                   pt.reserved_passengers_count, pt.normal_passengers_count, pt.total_occupancy_count,
                   pt.occupancy_percentage
            FROM Buses b
            LEFT JOIN Routes r ON b.current_route_id = r.route_id
            LEFT JOIN GPS_Tracking gps ON b.bus_id = gps.bus_id
            LEFT JOIN Passenger_Tracking pt ON b.bus_id = pt.bus_id
            ORDER BY b.bus_id ASC
        `);

        const summary = {
            total_buses: buses.length,
            active_buses: buses.filter(b => b.status === 'Active').length,
            delayed_buses: buses.filter(b => b.status === 'Delayed').length,
            emergency_buses: buses.filter(b => b.status === 'Emergency').length,
            average_occupancy_pct: buses.length > 0 ? parseFloat((buses.reduce((acc, b) => acc + (b.occupancy_percentage || 0), 0) / buses.length).toFixed(1)) : 0
        };

        res.json({ summary, buses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Analytics Dashboard Statistics (Daily passengers, Route popularity, Peak hour analysis, Revenue)
router.get('/analytics', async (req, res) => {
    try {
        // Daily passengers chart data
        const daily_passengers = [
            { day: 'Mon', passengers: 4200, revenue: 609000 },
            { day: 'Tue', passengers: 3890, revenue: 564050 },
            { day: 'Wed', passengers: 4120, revenue: 597400 },
            { day: 'Thu', passengers: 4500, revenue: 652500 },
            { day: 'Fri', passengers: 5800, revenue: 841000 },
            { day: 'Sat', passengers: 6450, revenue: 935250 },
            { day: 'Sun', passengers: 5920, revenue: 858400 }
        ];

        // Route popularity
        const route_popularity = [
            { route: 'Dharmapuri - Sathyamangalam (Route 101)', trips: 42, avg_occupancy: 86.4, revenue: 328000 },
            { route: 'Chennai - Madurai AC Sleeper (Route 201)', trips: 36, avg_occupancy: 91.2, revenue: 792000 },
            { route: 'Coimbatore - Salem Town Bus (Route 301)', trips: 54, avg_occupancy: 78.5, revenue: 388800 },
            { route: 'Madurai - Kanyakumari Express (Route 401)', trips: 28, avg_occupancy: 82.0, revenue: 308000 },
            { route: 'Chennai - Hosur Deluxe (Route 501)', trips: 30, avg_occupancy: 84.1, revenue: 450000 }
        ];

        // Peak hour analysis
        const peak_hours = [
            { hour: '06:00', occupancy: 52 },
            { hour: '08:00', occupancy: 88 },
            { hour: '10:00', occupancy: 74 },
            { hour: '12:00', occupancy: 61 },
            { hour: '14:00', occupancy: 58 },
            { hour: '16:00', occupancy: 79 },
            { hour: '18:00', occupancy: 93 },
            { hour: '20:00', occupancy: 82 }
        ];

        // Occupancy category breakdown
        const occupancy_statistics = {
            reserved_share: 58, // %
            normal_share: 32, // %
            women_free_scheme_share: 10, // %
            overall_fleet_occupancy: 78.4
        };

        // Total revenue stats
        const total_revenue_inr = daily_passengers.reduce((sum, d) => sum + d.revenue, 0);
        const total_passengers_week = daily_passengers.reduce((sum, d) => sum + d.passengers, 0);

        res.json({
            summary: {
                total_revenue_inr,
                total_passengers_week,
                avg_fleet_occupancy: 78.4,
                on_time_performance_pct: 92.6
            },
            daily_passengers,
            route_popularity,
            peak_hours,
            occupancy_statistics
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Transport Management - Get all Buses
router.get('/buses', async (req, res) => {
    try {
        const buses = await db.all(`
            SELECT b.*, r.name as route_name, d.license_number, u.name as driver_name
            FROM Buses b
            LEFT JOIN Routes r ON b.current_route_id = r.route_id
            LEFT JOIN Drivers d ON b.assigned_driver_id = d.driver_id
            LEFT JOIN Users u ON d.user_id = u.user_id
            ORDER BY b.bus_id ASC
        `);
        res.json(buses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Transport Management - Get all Drivers
router.get('/drivers', async (req, res) => {
    try {
        const drivers = await db.all(`
            SELECT d.*, u.name, u.email, u.phone 
            FROM Drivers d
            JOIN Users u ON d.user_id = u.user_id
            ORDER BY d.driver_id ASC
        `);
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Transport Management - Get all Routes
router.get('/routes', async (req, res) => {
    try {
        const routes = await db.all(`SELECT * FROM Routes ORDER BY route_id ASC`);
        res.json(routes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Transport Management - Get all Passenger Bookings
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await db.all(`
            SELECT b.*, bus.registration_number, r.name as route_name, u.name as passenger_name
            FROM Bookings b
            LEFT JOIN Buses bus ON b.bus_id = bus.bus_id
            LEFT JOIN Routes r ON b.route_id = r.route_id
            LEFT JOIN Users u ON b.user_id = u.user_id
            ORDER BY b.booking_id DESC
            LIMIT 100
        `);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
