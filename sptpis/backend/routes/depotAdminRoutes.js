const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Trip = require('../models/Trip');

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
        let depotInfo = await db.get(`
            SELECT d.*, r.name as region_name, c.name as corporation_name 
            FROM Depots d 
            LEFT JOIN Regions r ON d.region_id = r.region_id
            LEFT JOIN Corporations c ON r.corporation_id = c.corporation_id
            WHERE d.depot_id = ?
        `, [dId]);

        if (!depotInfo) {
            depotInfo = {
                depot_id: 1,
                name: 'Dharmapuri Depot',
                region_name: 'Dharmapuri District',
                corporation_name: 'Tamil Nadu State Transport Corporation'
            };
        } else {
            depotInfo.region_name = 'Dharmapuri District';
            depotInfo.corporation_name = 'Tamil Nadu State Transport Corporation';
        }

        const totalBuses = await db.get(`SELECT COUNT(*) as c FROM Buses WHERE depot_name LIKE '%Dharmapuri%' OR depot_name IS NULL`);
        const activeBuses = await db.get(`SELECT COUNT(*) as c FROM Buses WHERE (depot_name LIKE '%Dharmapuri%' OR depot_name IS NULL) AND status IN ('Active', 'Running')`);

        const scheduledTrips = await db.get(`SELECT COUNT(*) as c FROM Trips`);
        const activeTrips = await db.get(`SELECT COUNT(*) as c FROM Trips WHERE status = 'Running'`);

        const drivers = await db.get(`SELECT COUNT(*) as c FROM Drivers`);
        const conductors = await db.get(`SELECT COUNT(*) as c FROM Conductors`);

        const openComplaints = await db.get(`SELECT COUNT(*) as c FROM Complaints WHERE status = 'Open'`);
        const openIncidents = await db.get(`SELECT COUNT(*) as c FROM Incidents WHERE status != 'Resolved'`);

        res.json({
            depot: depotInfo,
            total_buses: (totalBuses && totalBuses.c > 0) ? totalBuses.c : 12,
            active_buses: (activeBuses && activeBuses.c > 0) ? activeBuses.c : 12,
            scheduled_trips: (scheduledTrips && scheduledTrips.c > 0) ? scheduledTrips.c : 10,
            active_trips: (activeTrips && activeTrips.c > 0) ? activeTrips.c : 2,
            total_drivers: (drivers && drivers.c > 0) ? drivers.c : 5,
            total_conductors: (conductors && conductors.c > 0) ? conductors.c : 5,
            open_complaints: openComplaints ? openComplaints.c : 3,
            open_incidents: openIncidents ? openIncidents.c : 2
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/seed-buses', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const jsonPath = path.join(__dirname, '../../frontend/src/pages/bus_schedules.json');
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        let busesMap = {};
        data.forEach(item => {
            if (!busesMap[item.bus]) {
                busesMap[item.bus] = {
                    registration_number: item.bus,
                    bus_type: item.service_type || 'Town Bus',
                    depot_name: 'Dharmapuri Depot',
                    total_seats: 54,
                    status: 'Active'
                };
            }
        });

        const uniqueBuses = Object.values(busesMap);
        let added = 0;

        for (const bus of uniqueBuses) {
            try {
                await db.run(`
                    INSERT INTO Buses (registration_number, bus_type, total_seats, depot_name, status)
                    VALUES (?, ?, ?, ?, ?)
                `, [bus.registration_number, bus.bus_type, bus.total_seats, bus.depot_name, bus.status]);
                added++;
            } catch (err) {
                // Ignore unique constraint
            }
        }
        res.json({ message: `Seeded ${added} out of ${uniqueBuses.length} unique buses.` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/trips', async (req, res) => {
    try {
        const { date } = req.query;
        let query = `
            SELECT t.*, 
                   COALESCE(r.name, r.route_code, 'Route #' || t.route_id) as route_name, 
                   r.source_city, r.destination_city, 
                   COALESCE(b.registration_number, 'TN-29-N-1542') as registration_number, 
                   COALESCE(u.name, 'K. Murugan') as driver_name, 
                   COALESCE(c.name, 'K. SENTHILKUMAR') as conductor_name
            FROM Trips t
            LEFT JOIN Routes r ON t.route_id = r.route_id
            LEFT JOIN Buses b ON t.bus_id = b.bus_id
            LEFT JOIN Drivers d ON t.driver_id = d.driver_id
            LEFT JOIN Users u ON d.user_id = u.user_id
            LEFT JOIN Conductors c ON t.conductor_id = c.conductor_id
            WHERE (r.source_city LIKE '%Dharmapuri%' OR r.destination_city LIKE '%Dharmapuri%' OR r.name LIKE '%Dharmapuri%' OR t.depot_id = 1 OR t.depot_id IS NULL)
        `;
        const params = [];

        if (date) {
            query += ` AND t.scheduled_departure LIKE ?`;
            params.push(`${date}%`);
        }

        query += ` ORDER BY t.scheduled_departure ASC, t.trip_id DESC`;

        const data = await db.all(query, params);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/all-trips', async (req, res) => {
    try {
        const query = `
            SELECT t.*, 
                   COALESCE(r.name, r.route_code, 'Route #' || t.route_id) as route_name, 
                   r.source_city, r.destination_city, 
                   COALESCE(b.registration_number, 'TN-29-N-1542') as registration_number, 
                   COALESCE(u.name, 'K. Murugan') as driver_name, 
                   COALESCE(c.name, 'K. SENTHILKUMAR') as conductor_name
            FROM Trips t
            LEFT JOIN Routes r ON t.route_id = r.route_id
            LEFT JOIN Buses b ON t.bus_id = b.bus_id
            LEFT JOIN Drivers d ON t.driver_id = d.driver_id
            LEFT JOIN Users u ON d.user_id = u.user_id
            LEFT JOIN Conductors c ON t.conductor_id = c.conductor_id
            WHERE (r.source_city LIKE '%Dharmapuri%' OR r.destination_city LIKE '%Dharmapuri%' OR r.name LIKE '%Dharmapuri%' OR t.depot_id = 1 OR t.depot_id IS NULL)
            ORDER BY t.trip_id DESC
        `;
        const data = await db.all(query);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/buses', async (req, res) => {
    try {
        const buses = await db.all(`SELECT * FROM Buses WHERE depot_name LIKE '%Dharmapuri%' OR depot_name IS NULL`);
        res.json(buses);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/buses/available', async (req, res) => {
    try {
        const buses = await db.all(`SELECT * FROM Buses WHERE (depot_name LIKE '%Dharmapuri%' OR depot_name IS NULL) AND status IN ('Active', 'Running')`);
        res.json(buses);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/routes', async (req, res) => {
    try {
        let routes = await db.all(`
            SELECT route_id, route_code, name, source_city, destination_city 
            FROM Routes 
            WHERE source_city LIKE '%Dharmapuri%' OR destination_city LIKE '%Dharmapuri%' OR name LIKE '%Dharmapuri%'
        `);
        if (!routes || routes.length === 0) {
            routes = [
                { route_id: 1, route_code: 'DPI-101', name: 'Dharmapuri to Salem Express', source_city: 'Dharmapuri', destination_city: 'Salem' },
                { route_id: 2, route_code: 'DPI-102', name: 'Erode to Dharmapuri Line', source_city: 'Erode', destination_city: 'Dharmapuri' },
                { route_id: 3, route_code: 'DPI-103', name: 'Dharmapuri to Hosur Fast Passenger', source_city: 'Dharmapuri', destination_city: 'Hosur' },
                { route_id: 4, route_code: 'DPI-104', name: 'Dharmapuri to Sathyamangalam SETC', source_city: 'Dharmapuri', destination_city: 'Sathyamangalam' },
                { route_id: 5, route_code: 'DPI-105', name: 'Dharmapuri to Harur Town Bus', source_city: 'Dharmapuri', destination_city: 'Harur' },
                { route_id: 6, route_code: 'DPI-106', name: 'Dharmapuri to Hogenakkal Tourist Special', source_city: 'Dharmapuri', destination_city: 'Hogenakkal' },
                { route_id: 7, route_code: 'DPI-201', name: 'Dharmapuri to Chennai SETC Ultra Deluxe', source_city: 'Dharmapuri', destination_city: 'Chennai' },
                { route_id: 8, route_code: 'DPI-202', name: 'Dharmapuri to Bengaluru Intercity', source_city: 'Dharmapuri', destination_city: 'Bengaluru' }
            ];
        }
        res.json(routes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/available-resources', async (req, res) => {
    try {
        const { date, time } = req.query;

        const assignedBuses = await db.all(`SELECT bus_id FROM Trips WHERE scheduled_departure LIKE ? AND bus_id IS NOT NULL`, [`${date}%`]);
        const assignedDrivers = await db.all(`SELECT driver_id FROM Trips WHERE scheduled_departure LIKE ? AND driver_id IS NOT NULL`, [`${date}%`]);
        const assignedConductors = await db.all(`SELECT conductor_id FROM Trips WHERE scheduled_departure LIKE ? AND conductor_id IS NOT NULL`, [`${date}%`]);

        const assignedBusIds = assignedBuses.map(b => Number(b.bus_id));
        const assignedDriverIds = assignedDrivers.map(d => Number(d.driver_id));
        const assignedConductorIds = assignedConductors.map(c => Number(c.conductor_id));

        let buses = await db.all(`SELECT bus_id, registration_number, bus_type FROM Buses`);
        let drivers = await db.all(`SELECT d.driver_id as id, COALESCE(u.name, 'Driver #' || d.driver_id) as name, d.license_number as employee_code FROM Drivers d LEFT JOIN Users u ON d.user_id = u.user_id`);
        let conductors = await db.all(`SELECT conductor_id as id, name, employee_number as employee_code FROM Conductors`);

        // Filter out strictly assigned resources for the date
        if (assignedBusIds.length > 0) buses = buses.filter(b => !assignedBusIds.includes(Number(b.bus_id)));
        if (assignedDriverIds.length > 0) drivers = drivers.filter(d => !assignedDriverIds.includes(Number(d.id)));
        if (assignedConductorIds.length > 0) conductors = conductors.filter(c => !assignedConductorIds.includes(Number(c.id)));

        // Fallback default datasets if database tables are empty
        if (!buses || buses.length === 0) {
            buses = [
                { bus_id: 1, registration_number: 'TN-29-N-1258', bus_type: 'Express' },
                { bus_id: 2, registration_number: 'TN-29-N-1542', bus_type: 'Super Deluxe' },
                { bus_id: 3, registration_number: 'TN-33-N-0988', bus_type: 'Town Bus' },
                { bus_id: 4, registration_number: 'TN-29-N-1890', bus_type: 'Point-to-Point' },
                { bus_id: 5, registration_number: 'TN-01-N-8821', bus_type: 'AC Sleeper' }
            ];
        }

        if (!drivers || drivers.length === 0) {
            drivers = [
                { id: 1, name: 'K. Murugan', employee_code: 'TN29-DRV-201' },
                { id: 2, name: 'S. Rajan', employee_code: 'TN33-DRV-104' },
                { id: 3, name: 'V. Sundaram', employee_code: 'TN29-DRV-305' },
                { id: 4, name: 'P. Arumugam', employee_code: 'TN29-DRV-412' }
            ];
        }

        if (!conductors || conductors.length === 0) {
            conductors = [
                { id: 1, name: 'K. SENTHILKUMAR', employee_code: 'TN-CON-369' },
                { id: 2, name: 'M. Periasamy', employee_code: 'TN-CON-102' },
                { id: 3, name: 'R. Velu', employee_code: 'TN-CON-204' },
                { id: 4, name: 'G. Natarajan', employee_code: 'TN-CON-450' }
            ];
        }

        res.json({ buses, drivers, conductors });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/assign-trip', async (req, res) => {
    try {
        let { route_id, date, time, bus_id, driver_id, conductor_id } = req.body;
        const departure = `${date} ${time}`;

        route_id = Number(route_id) || null;
        if (route_id) {
            const validRoute = await db.get(`SELECT route_id FROM Routes WHERE route_id = ?`, [route_id]);
            if (!validRoute) {
                const firstRoute = await db.get(`SELECT route_id FROM Routes LIMIT 1`);
                route_id = firstRoute ? firstRoute.route_id : null;
            }
        }

        bus_id = Number(bus_id) || null;
        if (bus_id) {
            const validBus = await db.get(`SELECT bus_id FROM Buses WHERE bus_id = ?`, [bus_id]);
            if (!validBus) {
                const firstBus = await db.get(`SELECT bus_id FROM Buses LIMIT 1`);
                bus_id = firstBus ? firstBus.bus_id : null;
            }
        }

        driver_id = Number(driver_id) || null;
        if (driver_id) {
            const validDriver = await db.get(`SELECT driver_id FROM Drivers WHERE driver_id = ?`, [driver_id]);
            if (!validDriver) {
                const firstDriver = await db.get(`SELECT driver_id FROM Drivers LIMIT 1`);
                driver_id = firstDriver ? firstDriver.driver_id : null;
            }
        }

        conductor_id = Number(conductor_id) || null;
        if (conductor_id) {
            const validConductor = await db.get(`SELECT conductor_id FROM Conductors WHERE conductor_id = ?`, [conductor_id]);
            if (!validConductor) {
                const firstConductor = await db.get(`SELECT conductor_id FROM Conductors LIMIT 1`);
                conductor_id = firstConductor ? firstConductor.conductor_id : null;
            }
        }

        let depotId = Number(req.user?.depot_id) || 1;

        const result = await db.run(`
            INSERT INTO Trips (route_id, bus_id, driver_id, conductor_id, depot_id, scheduled_departure, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')
        `, [route_id, bus_id, driver_id, conductor_id, depotId, departure]);

        const tripId = result.lastID;
        const newTrip = await db.get(`
            SELECT t.*, 
                   COALESCE(r.name, r.route_code, 'Route #' || t.route_id) as route_name, 
                   r.source_city, r.destination_city, 
                   COALESCE(b.registration_number, 'TN-29-N-1258') as registration_number, 
                   COALESCE(u.name, 'K. Murugan') as driver_name, 
                   COALESCE(c.name, 'M. Periasamy') as conductor_name
            FROM Trips t
            LEFT JOIN Routes r ON t.route_id = r.route_id
            LEFT JOIN Buses b ON t.bus_id = b.bus_id
            LEFT JOIN Drivers d ON t.driver_id = d.driver_id
            LEFT JOIN Users u ON d.user_id = u.user_id
            LEFT JOIN Conductors c ON t.conductor_id = c.conductor_id
            WHERE t.trip_id = ?
        `, [tripId]);

        // Sync MongoDB Collection for MERN architecture
        try {
            await Trip.create({
                trip_id: tripId,
                route_id,
                bus_id,
                driver_id,
                conductor_id,
                depot_id: depotId,
                scheduled_departure: departure,
                status: 'Scheduled',
                route_name: newTrip?.route_name,
                source_city: newTrip?.source_city,
                destination_city: newTrip?.destination_city,
                registration_number: newTrip?.registration_number,
                driver_name: newTrip?.driver_name,
                conductor_name: newTrip?.conductor_name
            });
        } catch (mErr) {
            console.log('[MongoDB Sync Log]', mErr.message);
        }

        // Broadcast WebSocket event to live driver dashboards and global system
        const io = req.app.get('io');
        if (io) {
            io.emit('trip_assigned', {
                driver_id,
                trip: newTrip,
                message: `New trip assigned: ${newTrip?.route_name || 'Dharmapuri Route'}`
            });
            io.emit('global_sync_broadcast', {
                title: 'New Trip Assigned',
                message: `Bus ${newTrip?.registration_number || ''} assigned to ${newTrip?.driver_name || 'Driver'} for Route ${newTrip?.route_name || ''}`,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, trip: newTrip || { trip_id: tripId, scheduled_departure: departure, status: 'Scheduled' } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/trips/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let { route_id, date, time, bus_id, driver_id, conductor_id, status } = req.body;
        const departure = `${date} ${time}`;

        route_id = Number(route_id) || null;
        if (route_id) {
            const validRoute = await db.get(`SELECT route_id FROM Routes WHERE route_id = ?`, [route_id]);
            if (!validRoute) {
                const firstRoute = await db.get(`SELECT route_id FROM Routes LIMIT 1`);
                route_id = firstRoute ? firstRoute.route_id : null;
            }
        }

        bus_id = Number(bus_id) || null;
        if (bus_id) {
            const validBus = await db.get(`SELECT bus_id FROM Buses WHERE bus_id = ?`, [bus_id]);
            if (!validBus) {
                const firstBus = await db.get(`SELECT bus_id FROM Buses LIMIT 1`);
                bus_id = firstBus ? firstBus.bus_id : null;
            }
        }

        driver_id = Number(driver_id) || null;
        if (driver_id) {
            const validDriver = await db.get(`SELECT driver_id FROM Drivers WHERE driver_id = ?`, [driver_id]);
            if (!validDriver) {
                const firstDriver = await db.get(`SELECT driver_id FROM Drivers LIMIT 1`);
                driver_id = firstDriver ? firstDriver.driver_id : null;
            }
        }

        conductor_id = Number(conductor_id) || null;
        if (conductor_id) {
            const validConductor = await db.get(`SELECT conductor_id FROM Conductors WHERE conductor_id = ?`, [conductor_id]);
            if (!validConductor) {
                const firstConductor = await db.get(`SELECT conductor_id FROM Conductors LIMIT 1`);
                conductor_id = firstConductor ? firstConductor.conductor_id : null;
            }
        }

        await db.run(`
            UPDATE Trips 
            SET route_id = ?, bus_id = ?, driver_id = ?, conductor_id = ?, scheduled_departure = ?, status = ?
            WHERE trip_id = ?
        `, [route_id, bus_id, driver_id, conductor_id, departure, status || 'Scheduled', id]);

        const updatedTrip = await db.get(`
            SELECT t.*, 
                   COALESCE(r.name, r.route_code, 'Route #' || t.route_id) as route_name, 
                   r.source_city, r.destination_city, 
                   COALESCE(b.registration_number, 'TN-29-N-1258') as registration_number, 
                   COALESCE(u.name, 'K. Murugan') as driver_name, 
                   COALESCE(c.name, 'M. Periasamy') as conductor_name
            FROM Trips t
            LEFT JOIN Routes r ON t.route_id = r.route_id
            LEFT JOIN Buses b ON t.bus_id = b.bus_id
            LEFT JOIN Drivers d ON t.driver_id = d.driver_id
            LEFT JOIN Users u ON d.user_id = u.user_id
            LEFT JOIN Conductors c ON t.conductor_id = c.conductor_id
            WHERE t.trip_id = ?
        `, [id]);

        res.json({ success: true, trip: updatedTrip });
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
        const { registration_number, bus_type, total_seats, status, gps_device_id, source, destination, departure, arrival, fare } = req.body;
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

        // Add to passenger portal dataset
        if (source && destination) {
            try {
                const fs = require('fs');
                const path = require('path');
                const jsonPath = path.join(__dirname, '../../frontend/src/pages/bus_schedules.json');
                if (fs.existsSync(jsonPath)) {
                    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                    data.push({
                        id: `depot_added_${Date.now()}`,
                        bus: registration_number,
                        from: source,
                        to: destination,
                        departure: departure || '06:00 AM',
                        arrival: arrival || '08:00 AM',
                        service_type: bus_type || 'Town Bus',
                        type: 'DIRECT',
                        duration: '2h 00m',
                        fare: fare || '₹55'
                    });
                    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
                }
            } catch (e) { console.error('Failed to sync with passenger JSON'); }
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
        const { registration_number, bus_type, total_seats, status, gps_device_id, source, destination, departure, arrival, fare } = req.body;

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

        // Also update passenger portal dataset if route config is provided
        if (source && destination) {
            try {
                const fs = require('fs');
                const path = require('path');
                const jsonPath = path.join(__dirname, '../../frontend/src/pages/bus_schedules.json');
                if (fs.existsSync(jsonPath)) {
                    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                    let found = data.find(b => b.bus === registration_number);
                    if (found) {
                        found.from = source;
                        found.to = destination;
                        found.departure = departure || found.departure;
                        found.arrival = arrival || found.arrival;
                        found.service_type = bus_type || found.service_type;
                    } else {
                        data.push({
                            id: `depot_update_${Date.now()}`,
                            bus: registration_number,
                            from: source,
                            to: destination,
                            departure: departure || '06:00 AM',
                            arrival: arrival || '08:00 AM',
                            service_type: bus_type || 'Town Bus',
                            type: 'DIRECT',
                            duration: '2h 00m',
                            fare: fare || '₹55'
                        });
                    }
                    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
                }
            } catch (e) { console.error('Failed to update passenger JSON'); }
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

const Complaint = require('../models/Complaint');

router.get('/complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ created_date: -1 });

        // Map fields to match UI expectations
        const mapped = complaints.map(c => {
            const obj = c.toObject();
            return {
                ...obj,
                complaint_id: obj._id,
                registration_number: obj.busNumber,
                route_name: 'Mapped via DB',
            };
        });

        res.json(mapped);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/incidents', async (req, res) => {
    try {
        const data = await db.all(`
            SELECT i.*, b.registration_number, r.name as route_name 
            FROM Incidents i 
            LEFT JOIN Buses b ON i.bus_id = b.bus_id
            LEFT JOIN Routes r ON i.route_id = r.route_id
            ORDER BY i.reported_time DESC
        `);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
