const express = require('express');
const router = express.Router();
const db = require('../config/database');

const verifyDepotAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    if (authHeader.includes('demo-depot-admin-token')) {
        // Dynamically fetch Dharmapuri Depot based on our seed script
        db.get("SELECT depot_id FROM Depots WHERE name LIKE '%Dharmapuri%' LIMIT 1").then(depot => {
            req.user = { role: 'depot_admin', depot_id: depot ? depot.depot_id : 1 };
            next();
        }).catch(err => {
            res.status(500).json({ error: 'Database error linking depot admin' });
        });
        return;
    }

    return res.status(403).json({ error: 'Unauthorized. Invalid depot admin token.' });
};

router.use(verifyDepotAdmin);

router.get('/dashboard', async (req, res) => {
    try {
        const dId = req.user.depot_id;
        const depotInfo = await db.get(`
            SELECT d.*, r.name as region_name, c.name as corporation_name 
            FROM Depots d 
            JOIN Regions r ON d.region_id = r.region_id
            JOIN Corporations c ON r.corporation_id = c.corporation_id
            WHERE d.depot_id = ?
        `, [dId]);

        // Buses (mock filter by depot name based on seed data, since Buses table uses depot_name currently)
        const totalBuses = await db.get(`SELECT COUNT(*) as c FROM Buses WHERE depot_name = ?`, [depotInfo.name]);
        const activeBuses = await db.get(`SELECT COUNT(*) as c FROM Buses WHERE depot_name = ? AND status = 'Active'`, [depotInfo.name]);

        const scheduledTrips = await db.get(`SELECT COUNT(*) as c FROM Trips WHERE depot_id = ?`, [dId]);
        const activeTrips = await db.get(`SELECT COUNT(*) as c FROM Trips WHERE depot_id = ? AND status = 'Running'`, [dId]);

        const drivers = await db.get(`SELECT COUNT(*) as c FROM Drivers WHERE depot = ?`, [depotInfo.name]);
        const conductors = await db.get(`SELECT COUNT(*) as c FROM Conductors WHERE depot_id = ?`, [dId]);

        const openComplaints = await db.get(`
            SELECT COUNT(*) as c FROM Complaints c 
            JOIN Buses b ON c.bus_id = b.bus_id 
            WHERE b.depot_name = ? AND c.status = 'Open'
        `, [depotInfo.name]);

        const openIncidents = await db.get(`SELECT COUNT(*) as c FROM Incidents WHERE depot_id = ? AND status != 'Resolved'`, [dId]);

        res.json({
            depot: depotInfo,
            total_buses: totalBuses.c,
            active_buses: activeBuses.c,
            scheduled_trips: scheduledTrips.c,
            active_trips: activeTrips.c,
            total_drivers: drivers.c,
            total_conductors: conductors.c,
            open_complaints: openComplaints.c,
            open_incidents: openIncidents.c
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/trips', async (req, res) => {
    try {
        const data = await db.all(`
            SELECT t.*, r.name as route_name, r.source_city, r.destination_city, 
                   b.registration_number, d.name as driver_name, c.name as conductor_name
            FROM Trips t
            LEFT JOIN Routes r ON t.route_id = r.route_id
            LEFT JOIN Buses b ON t.bus_id = b.bus_id
            LEFT JOIN Drivers d ON t.driver_id = d.driver_id
            LEFT JOIN Conductors c ON t.conductor_id = c.conductor_id
            WHERE t.depot_id = ?
            ORDER BY t.scheduled_departure ASC
        `, [req.user.depot_id]);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/buses', async (req, res) => {
    try {
        const depot = await db.get(`SELECT name FROM Depots WHERE depot_id = ?`, [req.user.depot_id]);
        const buses = await db.all(`SELECT * FROM Buses WHERE depot_name = ?`, [depot.name]);
        res.json(buses);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/staff', async (req, res) => {
    try {
        const depot = await db.get(`SELECT name FROM Depots WHERE depot_id = ?`, [req.user.depot_id]);
        const drivers = await db.all(`SELECT driver_id as id, name, phone, license_number as employee_code, status, 'Driver' as type FROM Drivers WHERE depot = ?`, [depot.name]);
        const conductors = await db.all(`SELECT conductor_id as id, name, phone, employee_number as employee_code, status, 'Conductor' as type FROM Conductors WHERE depot_id = ?`, [req.user.depot_id]);
        res.json([...drivers, ...conductors]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/maintenance', async (req, res) => {
    try {
        const data = await db.all(`
            SELECT m.*, b.registration_number 
            FROM Maintenance m
            LEFT JOIN Buses b ON m.bus_id = b.bus_id
            WHERE m.depot_id = ?
        `, [req.user.depot_id]);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/complaints', async (req, res) => {
    try {
        const depot = await db.get(`SELECT name FROM Depots WHERE depot_id = ?`, [req.user.depot_id]);
        const data = await db.all(`
            SELECT c.*, b.registration_number 
            FROM Complaints c 
            JOIN Buses b ON c.bus_id = b.bus_id
            WHERE b.depot_name = ?
            ORDER BY c.created_date DESC
        `, [depot.name]);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/incidents', async (req, res) => {
    try {
        const data = await db.all(`SELECT * FROM Incidents WHERE depot_id = ? ORDER BY reported_time DESC`, [req.user.depot_id]);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
