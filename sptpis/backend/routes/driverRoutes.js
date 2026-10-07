const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Mock Authentication Middleware
const verifyDriver = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    if (authHeader.includes('demo-driver-token') || authHeader.includes('demo-jwt-token')) {
        // Fallback for our mock setup, binding driver_id to 1 (K. Murugan)
        req.user = { role: 'driver', driver_id: 1, user_id: 2 };
        return next();
    }

    return res.status(403).json({ error: 'Unauthorized. Invalid driver token.' });
};

router.use(verifyDriver);

// Profile
router.get('/profile', async (req, res) => {
    try {
        const driver = await db.get(`
            SELECT d.*, u.name, u.phone, u.email 
            FROM Drivers d 
            JOIN Users u ON d.user_id = u.user_id 
            WHERE d.driver_id = ?
        `, [req.user.driver_id]);
        res.json(driver);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Dashboard Today's Trips
router.get('/trips/today', async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const trips = await db.all(`
            SELECT t.*, r.name as route_name, r.source_city, r.destination_city, b.registration_number
            FROM Trips t
            JOIN Routes r ON t.route_id = r.route_id
            JOIN Buses b ON t.bus_id = b.bus_id
            WHERE t.driver_id = ? AND t.scheduled_departure LIKE ?
            ORDER BY t.scheduled_departure ASC
        `, [req.user.driver_id, `${todayStr}%`]);
        res.json({ date: todayStr, trips });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Trip Details
router.get('/trips/:id', async (req, res) => {
    try {
        const trip = await db.get(`
            SELECT t.*, r.name as route_name, r.source_city, r.destination_city, 
                   b.registration_number, c.name as conductor_name
            FROM Trips t
            JOIN Routes r ON t.route_id = r.route_id
            JOIN Buses b ON t.bus_id = b.bus_id
            JOIN Conductors c ON t.conductor_id = c.conductor_id
            WHERE t.trip_id = ? AND t.driver_id = ?
        `, [req.params.id, req.user.driver_id]);

        if (!trip) return res.status(404).json({ error: 'Trip not found or unauthorized' });

        const stops = await db.all(`
            SELECT * FROM Stops WHERE route_id = ? ORDER BY stop_order ASC
        `, [trip.route_id]);

        const events = await db.all(`
            SELECT * FROM Trip_Events WHERE trip_id = ? ORDER BY timestamp DESC
        `, [req.params.id]);

        res.json({ trip, stops, events });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start Trip (Verify checklist and start)
router.post('/trips/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        const { checklist } = req.body;

        if (!checklist || checklist.some(item => !item.ok)) {
            return res.status(400).json({ error: 'Pre-trip checklist failed.' });
        }

        const trip = await db.get(`SELECT * FROM Trips WHERE trip_id = ? AND driver_id = ?`, [id, req.user.driver_id]);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const now = new Date().toISOString();

        // Update Trip
        await db.run(`UPDATE Trips SET status = 'Running', actual_departure = ? WHERE trip_id = ?`, [now.replace('T', ' ').split('.')[0], id]);

        // Update Bus Status
        await db.run(`UPDATE Buses SET status = 'Running' WHERE bus_id = ?`, [trip.bus_id]);

        // Insert Event
        await db.run(`
            INSERT INTO Trip_Events (trip_id, driver_id, bus_id, event_type, metadata)
            VALUES (?, ?, ?, ?, ?)
        `, [id, req.user.driver_id, trip.bus_id, 'TRIP_STARTED', JSON.stringify({ checklist_passed: true })]);

        res.json({ success: true, message: 'Trip Started Successfully', status: 'Running' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// End Trip
router.post('/trips/:id/end', async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await db.get(`SELECT * FROM Trips WHERE trip_id = ? AND driver_id = ?`, [id, req.user.driver_id]);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const now = new Date().toISOString();

        // Update Trip
        await db.run(`UPDATE Trips SET status = 'Completed', actual_arrival = ? WHERE trip_id = ?`, [now.replace('T', ' ').split('.')[0], id]);

        // Update Bus Status
        await db.run(`UPDATE Buses SET status = 'Available' WHERE bus_id = ?`, [trip.bus_id]);

        // Insert Event
        await db.run(`
            INSERT INTO Trip_Events (trip_id, driver_id, bus_id, event_type)
            VALUES (?, ?, ?, ?)
        `, [id, req.user.driver_id, trip.bus_id, 'TRIP_COMPLETED']);

        res.json({ success: true, message: 'Trip Completed Successfully', status: 'Completed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Stop Arrival / Departure
router.post('/trips/:id/stops/:stopId/arrival', async (req, res) => {
    try {
        const { id, stopId } = req.params;
        const trip = await db.get(`SELECT * FROM Trips WHERE trip_id = ? AND driver_id = ?`, [id, req.user.driver_id]);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        await db.run(`
            INSERT INTO Trip_Events (trip_id, driver_id, bus_id, event_type, metadata)
            VALUES (?, ?, ?, ?, ?)
        `, [id, req.user.driver_id, trip.bus_id, 'STOP_ARRIVED', JSON.stringify({ stop_id: stopId })]);

        res.json({ success: true, message: 'Stop Arrival Confirmed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/trips/:id/stops/:stopId/departure', async (req, res) => {
    try {
        const { id, stopId } = req.params;
        const trip = await db.get(`SELECT * FROM Trips WHERE trip_id = ? AND driver_id = ?`, [id, req.user.driver_id]);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        await db.run(`
            INSERT INTO Trip_Events (trip_id, driver_id, bus_id, event_type, metadata)
            VALUES (?, ?, ?, ?, ?)
        `, [id, req.user.driver_id, trip.bus_id, 'STOP_DEPARTED', JSON.stringify({ stop_id: stopId })]);

        // Logic here for ETA calculation / delays can be added asynchronously.

        res.json({ success: true, message: 'Stop Departure Confirmed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Reporter (Delay, Breakdown, Emergency)
router.post('/report', async (req, res) => {
    try {
        const { type, trip_id, message, location, severity, external_reason } = req.body;

        let bus_id = null;
        if (trip_id) {
            const trip = await db.get(`SELECT * FROM Trips WHERE trip_id = ? AND driver_id = ?`, [trip_id, req.user.driver_id]);
            if (!trip) return res.status(404).json({ error: 'Trip not found' });
            bus_id = trip.bus_id;

            if (type === 'Delay') {
                await db.run(`UPDATE Trips SET status = 'Delayed' WHERE trip_id = ?`, [trip_id]);
            } else if (type === 'Breakdown') {
                await db.run(`UPDATE Trips SET status = 'Breakdown' WHERE trip_id = ?`, [trip_id]);
                await db.run(`UPDATE Buses SET status = 'Breakdown' WHERE bus_id = ?`, [bus_id]);
            }
        }

        const eventType = type === 'Emergency' ? 'EMERGENCY_REPORTED' : (type === 'Breakdown' ? 'BREAKDOWN_REPORTED' : 'DELAY_REPORTED');

        await db.run(`
            INSERT INTO Trip_Events (trip_id, driver_id, bus_id, event_type, metadata)
            VALUES (?, ?, ?, ?, ?)
        `, [trip_id, req.user.driver_id, bus_id, eventType, JSON.stringify({ message, location, severity, external_reason })]);

        res.json({ success: true, message: `${type} reported successfully` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GPS Location Stream Emulation Post
router.post('/location', async (req, res) => {
    const io = req.app.get('io');
    if (io) {
        io.emit('driver_gps_update', {
            driver_id: req.user.driver_id,
            ...req.body,
            timestamp: new Date().toISOString()
        });
    }
    res.json({ success: true });
});

// Validate QR Ticket / Pass
router.post('/verify-qr', async (req, res) => {
    try {
        const { qr_code, trip_id } = req.body;
        if (!qr_code) return res.status(400).json({ error: 'QR Code is required' });

        // Simulate or lookup ticket verification logic
        const isValid = qr_code.startsWith('PASS-') || qr_code.startsWith('TICKET-') || qr_code.length > 5;
        
        if (isValid) {
            return res.json({
                valid: true,
                ticket_id: qr_code,
                passenger_name: 'S. Ramkumar',
                category: qr_code.includes('SENIOR') ? 'Senior Citizen' : 'Standard Passenger',
                status: 'VERIFIED & BOARDED',
                timestamp: new Date().toLocaleTimeString()
            });
        } else {
            return res.status(400).json({
                valid: false,
                error: 'Invalid or Expired QR Ticket Code'
            });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Onboard Passenger Count
router.post('/passengers/update', async (req, res) => {
    try {
        const { trip_id, passenger_count, capacity = 50 } = req.body;
        const isFull = passenger_count >= capacity;
        
        const io = req.app.get('io');
        if (io) {
            io.emit('occupancy_update', {
                trip_id,
                passenger_count,
                capacity,
                is_full: isFull,
                available_seats: Math.max(0, capacity - passenger_count),
                timestamp: new Date().toISOString()
            });
        }
        res.json({ success: true, passenger_count, available_seats: Math.max(0, capacity - passenger_count), is_full: isFull });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

