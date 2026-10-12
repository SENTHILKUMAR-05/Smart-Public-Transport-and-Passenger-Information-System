const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================================
// LIVE SCHEDULE SEARCH — queries the BusSchedules DB table
// ============================================================

// GET all schedules (used by frontend multi-hop engine)
router.get('/all-schedules', async (req, res) => {
    try {
        const schedules = await db.all(
            `SELECT schedule_id as id, bus_number as bus, from_city as "from", to_city as "to",
                    departure, arrival, duration, fare, service_type, status
             FROM BusSchedules
             WHERE status = 'Active'
             ORDER BY from_city, departure`
        );
        res.json(schedules);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET schedules for a specific from/to pair
router.get('/schedules', async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ error: 'from and to query params are required' });
        }
        const schedules = await db.all(
            `SELECT schedule_id as id, bus_number as bus, from_city as "from", to_city as "to",
                    departure, arrival, duration, fare, service_type, status
             FROM BusSchedules
             WHERE LOWER(from_city) = LOWER(?) AND LOWER(to_city) = LOWER(?) AND status = 'Active'
             ORDER BY departure`,
            [from.trim(), to.trim()]
        );
        res.json(schedules);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});



// Mock passenger journey planning logic
router.get('/journeys/plan', async (req, res) => {
    try {
        const { origin, destination, date } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }

        // Extremely simplified graph mapping for demo
        const directBus = await db.get(`
            SELECT b.bus_id, b.registration_number, r.route_id, r.name as route_name, r.source_city, r.destination_city, b.speed_kmh
            FROM Buses b JOIN Routes r ON b.current_route_id = r.route_id
            WHERE r.source_city LIKE ? AND r.destination_city LIKE ?
        `, [`%${origin}%`, `%${destination}%`]);

        const journeys = [];

        if (directBus) {
            journeys.push({
                type: 'BEST',
                label: 'Recommended',
                duration: '2h',
                transfers: 0,
                legs: [
                    {
                        from: origin,
                        to: destination,
                        departure: '08:00 AM',
                        arrival: '10:00 AM',
                        bus: directBus.registration_number,
                        bus_id: directBus.bus_id,
                        service_type: 'Express'
                    }
                ]
            });
        }

        // Mock a transfer route if no direct bus or as an alternative
        journeys.push({
            type: 'Fastest',
            label: '1 Transfer',
            duration: '2h 15m',
            transfers: 1,
            legs: [
                {
                    from: origin,
                    to: 'Salem',
                    departure: '08:00 AM',
                    arrival: '09:00 AM',
                    bus: 'TN-30-1111',
                    bus_id: 2,
                    service_type: 'Local'
                },
                {
                    from: 'Salem',
                    to: destination,
                    departure: '09:30 AM',
                    arrival: '10:15 AM',
                    bus: 'TN-29-2222',
                    bus_id: 3,
                    service_type: 'Live - Express'
                }
            ]
        });

        res.json({ journeys });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Complaints Routes
router.get('/complaints', async (req, res) => {
    try {
        const { user_id } = req.query;
        const targetUser = user_id || 'Passenger1';

        const complaints = await db.all(`
            SELECT c.*, 
                   COALESCE(b.registration_number, c.bus_number, c.registration_number) as bus_reg,
                   COALESCE(r.name, 'Express Route') as route_name
            FROM Complaints c
            LEFT JOIN Buses b ON c.bus_id = b.bus_id
            LEFT JOIN Routes r ON c.route_id = r.route_id
            WHERE c.reported_by = ? OR c.reported_by LIKE ?
            ORDER BY c.created_date DESC
        `, [targetUser, `%${targetUser}%`]);

        // Add statusStr based on standard, ensure field names match UI expectations
        const enriched = complaints.map(c => ({
            ...c,
            id: c.complaint_id,
            statusStr: c.status,
            busNumber: c.bus_reg || c.bus_number || c.location || 'N/A',
            text: c.description,
            photoUrl: c.photo_url,
            escalation_level: c.escalation_level || 1,
            escalated_to: c.escalated_to || 'Depot Admin',
            resolutionNote: c.resolution_remarks || (c.status === 'Resolved' ? 'Resolved by administration.' : 'Complaint logged and routed to depot manager.')
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/complaints', async (req, res) => {
    try {
        const categoryVal = req.body.category;
        const busNumVal = req.body.busNumber || req.body.registration_number || req.body.bus_number;
        const textVal = req.body.text || req.body.description;
        const photoUrlVal = req.body.photoUrl || req.body.photo_url || '';
        const userVal = req.body.user_id || req.body.userId || 'Passenger1';

        if (!busNumVal || !categoryVal || !textVal) {
            return res.status(400).json({ error: 'Category, bus registration number, and description are required.' });
        }

        // Find bus in SQLite to validate it's real, tolerant of hyphens and spaces
        const cleanReg = busNumVal.trim().replace(/[-\s]/g, '');
        const bus = await db.get(`
            SELECT bus_id, depot_name, current_route_id, registration_number 
            FROM Buses 
            WHERE REPLACE(REPLACE(registration_number, '-', ''), ' ', '') = ? COLLATE NOCASE
            LIMIT 1
        `, [cleanReg]);
        if (!bus) {
            return res.status(400).json({ error: `The Bus registration number "${busNumVal}" does not exist in any Depot Fleet Database.` });
        }

        // Save into SQLite Complaints table
        const result = await db.run(`
            INSERT INTO Complaints (
                category, bus_id, route_id, bus_number, registration_number,
                location, description, photo_url, reported_by, severity,
                status, escalation_level, escalated_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', 1, 'Depot Admin')
        `, [
            categoryVal,
            bus.bus_id,
            bus.current_route_id || 1,
            busNumVal.trim(),
            busNumVal.trim(),
            bus.depot_name || busNumVal.trim(),
            textVal,
            photoUrlVal || null,
            userVal || 'Passenger1',
            'High'
        ]);

        const complaint_id = result.lastID;

        // Alert the Depot Admin system immediately via socket
        const io = req.app.get('io');
        if (io) {
            const complaintPayload = {
                complaint_id,
                category: categoryVal,
                busNumber: busNumVal.trim(),
                registration_number: busNumVal.trim(),
                location: bus.depot_name || busNumVal.trim(),
                description: textVal,
                reported_by: userVal || 'Passenger1',
                status: 'Open',
                escalation_level: 1,
                escalated_to: 'Depot Admin',
                created_date: new Date().toISOString()
            };
            io.emit('new_depot_complaint', complaintPayload);
            io.emit('new_complaint', complaintPayload);
            io.emit('complaint_updated', complaintPayload);
        }

        res.json({ success: true, complaint_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
