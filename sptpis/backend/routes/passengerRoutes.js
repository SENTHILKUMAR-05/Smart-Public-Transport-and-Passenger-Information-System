const express = require('express');
const router = express.Router();
const db = require('../config/database');

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

const Complaint = require('../models/Complaint');

// Complaints Routes
router.get('/complaints', async (req, res) => {
    try {
        const { user_id } = req.query;
        const complaints = await Complaint.find({ reported_by: user_id || 'Passenger1' }).sort({ created_date: -1 });

        // Add statusStr based on standard, ensure field names match UI expectations
        const enriched = complaints.map(c => ({
            ...c.toObject(),
            statusStr: c.status,
            busNumber: c.busNumber
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/complaints', async (req, res) => {
    try {
        const { category, busNumber, text, user_id } = req.body;

        // Find bus in SQLite to validate it's real
        const bus = await db.get(`SELECT bus_id, depot_name FROM Buses WHERE registration_number = ? COLLATE NOCASE`, [busNumber.trim()]);
        if (!bus) {
            return res.status(400).json({ error: `The Bus registration number "${busNumber}" does not exist in any Depot Fleet Database.` });
        }

        // Save into MongoDB
        const newComplaint = new Complaint({
            category,
            busNumber,
            location: bus.depot_name || busNumber,
            description: text,
            reported_by: user_id || 'Passenger1',
            status: 'Open',
            statusStr: 'Open',
            severity: 'High'
        });
        await newComplaint.save();

        // Alert the Depot Admin system immediately via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('new_depot_complaint', {
                complaint_id: newComplaint._id,
                category,
                busNumber,
                text
            });
        }

        res.json({ success: true, complaint_id: newComplaint._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
