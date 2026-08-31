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

// Notifications
router.get('/notifications', async (req, res) => {
    // Return dummy notifications to passenger
    res.json({
        notifications: [
            { id: 1, type: 'DELAY', title: 'Bus Delayed', message: 'Your tracked bus to Salem is delayed by 20 minutes due to traffic.', time: '10 mins ago' },
            { id: 2, type: 'ALERT', title: 'Service Change', message: 'The 09:00 service from Dharmapuri operates via alternate route today.', time: '1 hour ago' }
        ]
    });
});

module.exports = router;
