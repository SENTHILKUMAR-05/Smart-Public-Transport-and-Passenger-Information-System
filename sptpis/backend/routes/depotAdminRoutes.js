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
        const { date } = req.query; // Add dynamic date filtering
        let query = `
            SELECT t.*, r.name as route_name, r.source_city, r.destination_city, 
                   b.registration_number, d.name as driver_name, c.name as conductor_name
            FROM Trips t
            LEFT JOIN Routes r ON t.route_id = r.route_id
            LEFT JOIN Buses b ON t.bus_id = b.bus_id
            LEFT JOIN Drivers d ON t.driver_id = d.driver_id
            LEFT JOIN Conductors c ON t.conductor_id = c.conductor_id
            WHERE t.depot_id = ?
        `;
        const params = [req.user.depot_id];

        if (date) {
            query += ` AND t.scheduled_departure LIKE ?`;
            params.push(`${date}%`);
        }

        query += ` ORDER BY t.scheduled_departure ASC`;

        const data = await db.all(query, params);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/all-trips', async (req, res) => {
    try {
        const query = `
            SELECT t.*, r.name as route_name, r.source_city, r.destination_city, 
                   b.registration_number, d.name as driver_name, c.name as conductor_name
            FROM Trips t
            LEFT JOIN Routes r ON t.route_id = r.route_id
            LEFT JOIN Buses b ON t.bus_id = b.bus_id
            LEFT JOIN Drivers d ON t.driver_id = d.driver_id
            LEFT JOIN Conductors c ON t.conductor_id = c.conductor_id
            WHERE t.depot_id = ?
            ORDER BY t.trip_id DESC
        `;
        const data = await db.all(query, [req.user.depot_id]);
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

router.get('/buses/available', async (req, res) => {
    try {
        const depot = await db.get(`SELECT name FROM Depots WHERE depot_id = ?`, [req.user.depot_id]);
        const buses = await db.all(`SELECT * FROM Buses WHERE depot_name = ? AND status IN ('Active', 'Running')`, [depot.name]);
        res.json(buses);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/routes', async (req, res) => {
    try {
        const routes = await db.all(`SELECT route_id, route_code, source_city, destination_city FROM Routes`);
        res.json(routes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/available-resources', async (req, res) => {
    try {
        const { date, time } = req.query;
        // Simplified exclusion logic: Exclude any resource strictly assigned on this EXACT date string for now.
        // In a full production system, this would calculate overlapping hours. We just filter by date.

        const depot = await db.get(`SELECT name FROM Depots WHERE depot_id = ?`, [req.user.depot_id]);

        const assignedBuses = await db.all(`SELECT bus_id FROM Trips WHERE scheduled_departure LIKE ?`, [`${date}%`]);
        const assignedDrivers = await db.all(`SELECT driver_id FROM Trips WHERE scheduled_departure LIKE ?`, [`${date}%`]);
        const assignedConductors = await db.all(`SELECT conductor_id FROM Trips WHERE scheduled_departure LIKE ?`, [`${date}%`]);

        const assignedBusIds = assignedBuses.map(b => b.bus_id);
        const assignedDriverIds = assignedDrivers.map(d => d.driver_id);
        const assignedConductorIds = assignedConductors.map(c => c.conductor_id);

        let buses = await db.all(`SELECT bus_id, registration_number, bus_type FROM Buses WHERE depot_name = ? AND status IN ('Active', 'Available', 'Running')`, [depot.name]);
        let drivers = await db.all(`SELECT d.driver_id as id, u.name, d.license_number as employee_code FROM Drivers d LEFT JOIN Users u ON d.user_id = u.user_id WHERE d.depot = ? AND d.status IN ('Active', 'Available')`, [depot.name]);
        let conductors = await db.all(`SELECT conductor_id as id, name, employee_number as employee_code FROM Conductors WHERE depot_id = ? AND status IN ('Available', 'Active')`, [req.user.depot_id]);

        buses = buses.filter(b => !assignedBusIds.includes(b.bus_id));
        drivers = drivers.filter(d => !assignedDriverIds.includes(d.id));
        conductors = conductors.filter(c => !assignedConductorIds.includes(c.id));

        res.json({ buses, drivers, conductors });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/assign-trip', async (req, res) => {
    try {
        const { route_id, date, time, bus_id, driver_id, conductor_id } = req.body;
        const departure = `${date} ${time}`;

        await db.run(`
            INSERT INTO Trips (route_id, bus_id, driver_id, conductor_id, depot_id, scheduled_departure, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')
        `, [route_id, bus_id, driver_id, conductor_id, req.user.depot_id, departure]);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/trips/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { route_id, date, time, bus_id, driver_id, conductor_id, status } = req.body;
        const departure = `${date} ${time}`;

        await db.run(`
            UPDATE Trips 
            SET route_id = ?, bus_id = ?, driver_id = ?, conductor_id = ?, scheduled_departure = ?, status = ?
            WHERE trip_id = ?
        `, [route_id, bus_id, driver_id, conductor_id, departure, status || 'Scheduled', id]);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/trips/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM Trips WHERE trip_id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/buses', async (req, res) => {
    try {
        const { registration_number, bus_type, total_seats, status, gps_device_id } = req.body;
        const depot = await db.get(`SELECT name FROM Depots WHERE depot_id = ?`, [req.user.depot_id]);

        const busRes = await db.run(`
            INSERT INTO Buses (registration_number, bus_type, total_seats, depot_name, status, gps_device_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [registration_number, bus_type || 'Town Bus', total_seats || 54, depot.name, status || 'Active', gps_device_id]);

        if (status === 'Maintenance') {
            await db.run(`
                INSERT INTO Maintenance (bus_id, depot_id, maintenance_type, mechanic, start_date, status)
                VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)
            `, [busRes.lastID, req.user.depot_id, 'General Repair', 'Unassigned', 'Open']);
        }
        res.json({ success: true });
    } catch (e) {
        if (e.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Bus with this Registration Number already exists.' });
        }
        res.status(500).json({ error: e.message });
    }
});

router.put('/buses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { registration_number, bus_type, total_seats, status, gps_device_id } = req.body;

        const oldBus = await db.get(`SELECT status FROM Buses WHERE bus_id = ?`, [id]);

        await db.run(`
            UPDATE Buses SET registration_number = ?, bus_type = ?, total_seats = ?, status = ?, gps_device_id = ? 
            WHERE bus_id = ?
        `, [registration_number, bus_type, total_seats, status, gps_device_id, id]);

        if (oldBus) {
            if (status === 'Maintenance' && oldBus.status !== 'Maintenance') {
                await db.run(`
                    INSERT INTO Maintenance (bus_id, depot_id, maintenance_type, mechanic, start_date, status)
                    VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)
                `, [id, req.user.depot_id, 'Routine Check', 'Unassigned', 'Open']);
            } else if (status !== 'Maintenance' && oldBus.status === 'Maintenance') {
                await db.run(`
                    UPDATE Maintenance SET status = 'Resolved' WHERE bus_id = ? AND status = 'Open'
                `, [id]);
            }
        }

        res.json({ success: true });
    } catch (e) {
        if (e.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Bus with this Registration Number already exists.' });
        }
        res.status(500).json({ error: e.message });
    }
});

router.delete('/buses/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM Buses WHERE bus_id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/staff', async (req, res) => {
    try {
        const depot = await db.get(`SELECT name FROM Depots WHERE depot_id = ?`, [req.user.depot_id]);
        const drivers = await db.all(`
            SELECT d.driver_id as id, u.name, u.phone, d.license_number as employee_code, d.status, 'Driver' as type 
            FROM Drivers d 
            LEFT JOIN Users u ON d.user_id = u.user_id 
            WHERE d.depot = ?`, [depot.name]);
        const conductors = await db.all(`SELECT conductor_id as id, name, phone, employee_number as employee_code, status, 'Conductor' as type FROM Conductors WHERE depot_id = ?`, [req.user.depot_id]);
        res.json([...drivers, ...conductors]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/staff', async (req, res) => {
    try {
        const { type, name, phone, employee_code, status } = req.body;
        const depot = await db.get(`SELECT name FROM Depots WHERE depot_id = ?`, [req.user.depot_id]);

        if (type === 'Driver') {
            const email = `${employee_code || Date.now()}@tnstc.in`;
            let userId;

            // 1. Try to create or find user
            try {
                const userRes = await db.run(`INSERT INTO Users (name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
                    [name, phone, email, 'mockhash', 'driver']);
                userId = userRes.lastID;
            } catch (err) {
                if (err.message.includes('UNIQUE')) {
                    const existing = await db.get(`SELECT user_id FROM Users WHERE email = ?`, [email]);
                    userId = existing.user_id;
                    // Update latest details
                    await db.run(`UPDATE Users SET name = ?, phone = ? WHERE user_id = ?`, [name, phone, userId]);
                } else {
                    throw err;
                }
            }

            // 2. Try to create driver
            try {
                await db.run(`
                    INSERT INTO Drivers (user_id, license_number, badge_number, depot, status)
                    VALUES (?, ?, ?, ?, ?)
                `, [userId, employee_code, `B-${Date.now()}`, depot.name, status || 'Active']);
            } catch (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Driver profile with this Employee Code already exists.' });
                }
                throw err;
            }
        } else {
            // Conductor
            try {
                await db.run(`
                    INSERT INTO Conductors (name, phone, employee_number, depot_id, status)
                    VALUES (?, ?, ?, ?, ?)
                `, [name, phone, employee_code, req.user.depot_id, status || 'Available']);
            } catch (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Conductor with this Employee Number already exists.' });
                }
                throw err;
            }
        }
        res.json({ success: true });
    } catch (e) {
        require('fs').appendFileSync('error_500.txt', e.stack + '\n');
        res.status(500).json({ error: e.message });
    }
});

router.put('/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, name, phone, employee_code, status } = req.body;
        if (type === 'Driver') {
            const drv = await db.get(`SELECT user_id FROM Drivers WHERE driver_id = ?`, [id]);
            if (drv && drv.user_id) {
                await db.run(`UPDATE Users SET name = ?, phone = ? WHERE user_id = ?`, [name, phone, drv.user_id]);
            }
            await db.run(`UPDATE Drivers SET license_number = ?, status = ? WHERE driver_id = ?`, [employee_code, status, id]);
        } else {
            await db.run(`UPDATE Conductors SET name = ?, phone = ?, employee_number = ?, status = ? WHERE conductor_id = ?`, [name, phone, employee_code, status, id]);
        }
        res.json({ success: true });
    } catch (e) {
        require('fs').appendFileSync('error_500.txt', e.stack + '\\n');
        res.status(500).json({ error: e.message });
    }
});

router.delete('/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;
        if (type === 'Driver') {
            const drv = await db.get(`SELECT user_id FROM Drivers WHERE driver_id = ?`, [id]);
            await db.run(`DELETE FROM Drivers WHERE driver_id = ?`, [id]);
            if (drv && drv.user_id) {
                await db.run(`DELETE FROM Users WHERE user_id = ?`, [drv.user_id]);
            }
        } else {
            await db.run(`DELETE FROM Conductors WHERE conductor_id = ?`, [id]);
        }
        res.json({ success: true });
    } catch (e) {
        require('fs').appendFileSync('error_500.txt', e.stack + '\\n');
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
