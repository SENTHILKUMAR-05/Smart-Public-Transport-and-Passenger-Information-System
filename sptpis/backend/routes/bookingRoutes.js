const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 1. Create New Ticket Booking
router.post('/', async (req, res) => {
    try {
        const { user_id, bus_id, route_id, seat_number, boarding_stop, destination_stop, travel_date, fare_paid } = req.body;

        if (!bus_id || !seat_number || !boarding_stop || !destination_stop) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        // Check if seat is already booked
        const seat = await db.get(`SELECT * FROM Seat_Management WHERE bus_id = ? AND seat_number = ?`, [bus_id, seat_number]);
        if (seat && seat.is_booked === 1) {
            return res.status(400).json({ error: `Seat ${seat_number} is already booked!` });
        }

        const bookingRef = `TNSTC-BK-${Math.floor(100000 + Math.random() * 900000)}`;
        const qrToken = `QR-${uuidv4().substring(0, 12).toUpperCase()}`;

        // Insert booking record
        const result = await db.run(
            `INSERT INTO Bookings (booking_reference, user_id, bus_id, route_id, seat_number, boarding_stop, destination_stop, travel_date, fare_paid, booking_status, qr_code_token)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [bookingRef, user_id || 1, bus_id, route_id || 1, seat_number, boarding_stop, destination_stop, travel_date || new Date().toISOString().split('T')[0], fare_paid || 145.0, 'Confirmed', qrToken]
        );

        // Update Seat_Management
        await db.run(
            `UPDATE Seat_Management SET is_booked = 1, passenger_name = ?, passenger_type = 'Reserved' WHERE bus_id = ? AND seat_number = ?`,
            ['S. Karthik', bus_id, seat_number]
        );

        // Update Passenger_Tracking count
        await db.run(
            `UPDATE Passenger_Tracking SET 
                reserved_passengers_count = reserved_passengers_count + 1,
                total_occupancy_count = reserved_passengers_count + normal_passengers_count + 1,
                occupancy_percentage = ROUND((reserved_passengers_count + normal_passengers_count + 1) * 100.0 / 54.0, 1)
             WHERE bus_id = ?`,
            [bus_id]
        );

        // Get newly created booking
        const booking = await db.get(`
            SELECT b.*, bus.registration_number, r.name as route_name, r.source_city, r.destination_city
            FROM Bookings b
            LEFT JOIN Buses bus ON b.bus_id = bus.bus_id
            LEFT JOIN Routes r ON b.route_id = r.route_id
            WHERE b.booking_id = ?
        `, [result.lastID]);

        res.status(201).json({
            message: 'Ticket booked successfully!',
            booking
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get User's Booked Tickets
router.get('/my-tickets', async (req, res) => {
    try {
        const userId = req.query.user_id || 1;
        const bookings = await db.all(`
            SELECT b.*, bus.registration_number, bus.bus_type, r.name as route_name, r.source_city, r.destination_city
            FROM Bookings b
            LEFT JOIN Buses bus ON b.bus_id = bus.bus_id
            LEFT JOIN Routes r ON b.route_id = r.route_id
            WHERE b.user_id = ?
            ORDER BY b.booking_id DESC
        `, [userId]);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Booking by Reference Code
router.get('/:ref', async (req, res) => {
    try {
        const { ref } = req.params;
        const booking = await db.get(`
            SELECT b.*, bus.registration_number, bus.bus_type, r.name as route_name, r.source_city, r.destination_city
            FROM Bookings b
            LEFT JOIN Buses bus ON b.bus_id = bus.bus_id
            LEFT JOIN Routes r ON b.route_id = r.route_id
            WHERE b.booking_reference = ? OR b.booking_id = ?
        `, [ref, ref]);
        if (!booking) return res.status(404).json({ error: 'Ticket not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
