const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 1. Search Buses by Source & Destination
router.get('/search', async (req, res) => {
    try {
        const { source, destination, date } = req.query;
        let sql = `
            SELECT b.*, r.route_code, r.name as route_name, r.source_city, r.destination_city,
                   r.total_distance_km, r.estimated_duration_mins, r.base_fare, r.route_type,
                   r.polyline_coords,
                   d.license_number, u.name as driver_name,
                   pt.reserved_passengers_count, pt.normal_passengers_count, pt.total_occupancy_count,
                   pt.occupancy_percentage,
                   gps.latitude, gps.longitude, gps.speed_kmh, gps.next_stop_name, 
                   gps.distance_remaining_km, gps.estimated_arrival_mins, gps.route_completion_pct
            FROM Buses b
            JOIN Routes r ON b.current_route_id = r.route_id
            LEFT JOIN Drivers d ON b.assigned_driver_id = d.driver_id
            LEFT JOIN Users u ON d.user_id = u.user_id
            LEFT JOIN Passenger_Tracking pt ON b.bus_id = pt.bus_id
            LEFT JOIN GPS_Tracking gps ON b.bus_id = gps.bus_id
            WHERE 1=1
        `;
        const params = [];

        if (source && source.trim() !== '') {
            sql += ` AND LOWER(r.source_city) LIKE ?`;
            params.push(`%${source.trim().toLowerCase()}%`);
        }
        if (destination && destination.trim() !== '') {
            sql += ` AND LOWER(r.destination_city) LIKE ?`;
            params.push(`%${destination.trim().toLowerCase()}%`);
        }

        const buses = await db.all(sql, params);

        // Enhance with stops array for each route
        for (let bus of buses) {
            const stops = await db.all(
                `SELECT stop_id, stop_name, stop_order, distance_from_source_km, eta_offset_mins, latitude, longitude 
                 FROM Stops WHERE route_id = ? ORDER BY stop_order ASC`,
                [bus.current_route_id]
            );
            bus.stops = stops;
            try {
                bus.polyline_coords = JSON.parse(bus.polyline_coords || '[]');
            } catch (e) {
                bus.polyline_coords = [];
            }
        }

        res.json({ count: buses.length, buses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get All Buses with Route & Live Tracking Info
router.get('/', async (req, res) => {
    try {
        const buses = await db.all(`
            SELECT b.*, r.name as route_name, r.source_city, r.destination_city, r.base_fare, r.route_type,
                   gps.latitude, gps.longitude, gps.speed_kmh, gps.next_stop_name, 
                   gps.distance_remaining_km, gps.estimated_arrival_mins, gps.route_completion_pct,
                   pt.total_occupancy_count, pt.occupancy_percentage
            FROM Buses b
            LEFT JOIN Routes r ON b.current_route_id = r.route_id
            LEFT JOIN GPS_Tracking gps ON b.bus_id = gps.bus_id
            LEFT JOIN Passenger_Tracking pt ON b.bus_id = pt.bus_id
            ORDER BY b.bus_id ASC
        `);
        res.json(buses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Route Stops & Polyline
router.get('/routes/:id/stops', async (req, res) => {
    try {
        const { id } = req.params;
        const route = await db.get(`SELECT * FROM Routes WHERE route_id = ?`, [id]);
        if (!route) return res.status(404).json({ error: 'Route not found' });
        const stops = await db.all(
            `SELECT * FROM Stops WHERE route_id = ? ORDER BY stop_order ASC`,
            [id]
        );
        try {
            route.polyline_coords = JSON.parse(route.polyline_coords || '[]');
        } catch (e) {
            route.polyline_coords = [];
        }
        res.json({ route, stops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get Live Bus Tracking Detail
router.get('/:id/tracking', async (req, res) => {
    try {
        const { id } = req.params;
        const bus = await db.get(`
            SELECT b.*, r.name as route_name, r.source_city, r.destination_city,
                   gps.latitude, gps.longitude, gps.speed_kmh, gps.next_stop_name, 
                   gps.distance_remaining_km, gps.estimated_arrival_mins, gps.route_completion_pct,
                   pt.reserved_passengers_count, pt.normal_passengers_count, pt.total_occupancy_count,
                   pt.occupancy_percentage
            FROM Buses b
            LEFT JOIN Routes r ON b.current_route_id = r.route_id
            LEFT JOIN GPS_Tracking gps ON b.bus_id = gps.bus_id
            LEFT JOIN Passenger_Tracking pt ON b.bus_id = pt.bus_id
            WHERE b.bus_id = ?
        `, [id]);

        if (!bus) return res.status(404).json({ error: 'Bus not found' });
        res.json(bus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Get 54-Seat Management Layout for a Bus
router.get('/:id/seats', async (req, res) => {
    try {
        const { id } = req.params;
        const seats = await db.all(`
            SELECT * FROM Seat_Management 
            WHERE bus_id = ? 
            ORDER BY CAST(SUBSTR(seat_number, 2) AS INTEGER) ASC
        `, [id]);

        const totalSeats = 54;
        const bookedCount = seats.filter(s => s.is_booked === 1).length;
        const availableCount = totalSeats - bookedCount;

        res.json({
            bus_id: Number(id),
            total_seats: totalSeats,
            booked_seats: bookedCount,
            available_seats: availableCount,
            seats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
