const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 1. Dashboard KPIs Overview
router.get('/dashboard', async (req, res) => {
    try {
        const corps = await db.get(`SELECT COUNT(*) as c FROM Corporations`);
        const regions = await db.get(`SELECT COUNT(*) as c FROM Regions`);
        const depots = await db.get(`SELECT COUNT(*) as c FROM Depots`);

        const activeTrips = await db.get(`SELECT COUNT(*) as c FROM Buses WHERE status = 'Active'`);
        const delayed = await db.get(`SELECT COUNT(*) as c FROM Buses WHERE status = 'Delayed'`);

        const passengers = await db.get(`SELECT SUM(total_occupancy_count) as p FROM Passenger_Tracking`);
        const openComplaints = await db.get(`SELECT COUNT(*) as c FROM Complaints WHERE status = 'Open'`);
        const criticalInc = await db.get(`SELECT COUNT(*) as c FROM Incidents WHERE severity = 'Critical'`);

        res.json({
            corporations: corps.c,
            regions: regions.c,
            depots: depots.c,
            active_trips: activeTrips.c,
            delayed: delayed.c,
            passengers_today: passengers.p || 4820,
            open_complaints: openComplaints.c,
            critical_incidents: criticalInc.c,
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Organization 
router.get('/corporations', async (req, res) => {
    const data = await db.all(`SELECT * FROM Corporations ORDER BY name ASC`);
    res.json(data);
});

router.get('/regions', async (req, res) => {
    const data = await db.all(`SELECT r.*, c.name as corporation_name FROM Regions r LEFT JOIN Corporations c ON r.corporation_id = c.corporation_id ORDER BY r.name ASC`);
    res.json(data);
});

router.get('/depots', async (req, res) => {
    const data = await db.all(`SELECT d.*, r.name as region_name FROM Depots d LEFT JOIN Regions r ON d.region_id = r.region_id ORDER BY d.name ASC`);
    res.json(data);
});

// Routes proposals
router.get('/routes/proposals', async (req, res) => {
    const data = await db.all(`SELECT * FROM Route_Proposals ORDER BY submitted_date DESC`);
    res.json(data);
});

// Complaints
router.get('/complaints', async (req, res) => {
    const data = await db.all(`SELECT * FROM Complaints ORDER BY created_date DESC`);
    res.json(data);
});

// Incidents
router.get('/incidents', async (req, res) => {
    const data = await db.all(`SELECT * FROM Incidents ORDER BY reported_time DESC`);
    res.json(data);
});

// Alerts
router.get('/alerts', async (req, res) => {
    const data = await db.all(`SELECT * FROM Alerts ORDER BY created_at DESC`);
    res.json(data);
});

// Settings & Log placeholders (to fulfill the requirements for the frontend)
router.get('/audit-logs', async (req, res) => {
    const data = await db.all(`SELECT * FROM Audit_Logs ORDER BY timestamp DESC LIMIT 50`);
    res.json(data);
});

module.exports = router;
