const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function syncDharmapuriData() {
    console.log('--- Ensuring Dharmapuri District Depot Master Data (12 Buses, 5 Drivers, 5 Conductors, Diverse Routes & History) ---');

    try {
        const passHash = await bcrypt.hash('password123', 10);

        // 1. Ensure Region & Depot Record
        await db.run(`INSERT OR IGNORE INTO Corporations (corporation_id, name, code, description) VALUES (1, 'Tamil Nadu State Transport Corporation', 'TNSTC', 'Primary state public transport')`);
        await db.run(`INSERT OR IGNORE INTO Regions (region_id, name, code, corporation_id) VALUES (1, 'Dharmapuri District', 'DPI-D', 1)`);
        await db.run(`INSERT OR REPLACE INTO Depots (depot_id, name, code, region_id, address) VALUES (1, 'Dharmapuri Depot', 'DPI', 1, 'Dharmapuri HQ Central Terminal')`);

        // 2. Ensure 5 Drivers in Users & Drivers table
        const driverProfiles = [
            { name: 'K. Murugan', email: 'murugan.driver@tnstc.in', phone: '9443210987', lic: 'TN29-DL-2018821', badge: 'TNSTC-BG-0412' },
            { name: 'S. Rajan', email: 'rajan.driver@tnstc.in', phone: '9443210988', lic: 'TN33-DL-2019104', badge: 'TNSTC-BG-0515' },
            { name: 'V. Sundaram', email: 'sundaram.driver@tnstc.in', phone: '9443210989', lic: 'TN29-DL-2020305', badge: 'TNSTC-BG-0620' },
            { name: 'P. Arumugam', email: 'arumugam.driver@tnstc.in', phone: '9443210990', lic: 'TN29-DL-2021412', badge: 'TNSTC-BG-0731' },
            { name: 'M. Suresh', email: 'suresh.driver@tnstc.in', phone: '9443210991', lic: 'TN29-DL-2022550', badge: 'TNSTC-BG-0842' }
        ];

        const driverIds = [];
        for (const drv of driverProfiles) {
            let u = await db.get(`SELECT user_id FROM Users WHERE email = ?`, [drv.email]);
            let uid;
            if (!u) {
                const res = await db.run(
                    `INSERT INTO Users (name, email, phone, password_hash, role, category) VALUES (?, ?, ?, ?, ?, ?)`,
                    [drv.name, drv.email, drv.phone, passHash, 'driver', 'General']
                );
                uid = res.lastID;
            } else {
                uid = u.user_id;
                await db.run(`UPDATE Users SET name = ?, phone = ? WHERE user_id = ?`, [drv.name, drv.phone, uid]);
            }

            let d = await db.get(`SELECT driver_id FROM Drivers WHERE user_id = ? OR license_number = ?`, [uid, drv.lic]);
            let did;
            if (!d) {
                const dRes = await db.run(
                    `INSERT INTO Drivers (user_id, license_number, badge_number, depot, experience_years, status, rating) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [uid, drv.lic, drv.badge, 'Dharmapuri Depot', 10, 'Active', 4.9]
                );
                did = dRes.lastID;
            } else {
                did = d.driver_id;
                await db.run(`UPDATE Drivers SET depot = 'Dharmapuri Depot', status = 'Active' WHERE driver_id = ?`, [did]);
            }
            driverIds.push(did);
        }

        // 3. Ensure 5 Conductors in Conductors table
        const conductorProfiles = [
            { name: 'K. SENTHILKUMAR', phone: '9842100111', emp: 'TN-CON-369' },
            { name: 'M. Periasamy', phone: '9842100222', emp: 'TN-CON-102' },
            { name: 'R. Velu', phone: '9842100333', emp: 'TN-CON-204' },
            { name: 'G. Natarajan', phone: '9842100444', emp: 'TN-CON-450' },
            { name: 'P. Elangovan', phone: '9842100555', emp: 'TN-CON-512' }
        ];

        const conductorIds = [];
        for (const cnd of conductorProfiles) {
            let c = await db.get(`SELECT conductor_id FROM Conductors WHERE employee_number = ?`, [cnd.emp]);
            let cid;
            if (!c) {
                const cRes = await db.run(
                    `INSERT INTO Conductors (name, phone, employee_number, depot_id, status) VALUES (?, ?, ?, ?, ?)`,
                    [cnd.name, cnd.phone, cnd.emp, 1, 'Available']
                );
                cid = cRes.lastID;
            } else {
                cid = c.conductor_id;
                await db.run(`UPDATE Conductors SET name = ?, phone = ?, depot_id = 1 WHERE conductor_id = ?`, [cnd.name, cnd.phone, cid]);
            }
            conductorIds.push(cid);
        }

        // 4. Ensure 12 Buses assigned to Dharmapuri Depot
        const busProfiles = [
            { reg: 'TN-29-N-1542', type: 'SETC Ultra Deluxe', seats: 54 },
            { reg: 'TN-29-N-1258', type: 'Express', seats: 54 },
            { reg: 'TN-33-N-0988', type: 'Town Bus', seats: 54 },
            { reg: 'TN-29-N-1890', type: 'Point-to-Point', seats: 54 },
            { reg: 'TN-01-N-8821', type: 'AC Sleeper', seats: 42 },
            { reg: 'TN-29-N-2044', type: 'Fast Passenger', seats: 54 },
            { reg: 'TN-29-N-2105', type: 'Super Deluxe', seats: 54 },
            { reg: 'TN-29-N-2280', type: 'Express', seats: 54 },
            { reg: 'TN-38-N-4412', type: 'Ultra Deluxe', seats: 54 },
            { reg: 'TN-45-N-3301', type: 'Town Bus Pink Scheme', seats: 54 },
            { reg: 'TN-29-N-3150', type: 'SETC Sleeper', seats: 42 },
            { reg: 'TN-29-N-3420', type: 'Intercity Air-Bus', seats: 54 }
        ];

        const busIds = [];
        for (const bus of busProfiles) {
            let b = await db.get(`SELECT bus_id FROM Buses WHERE registration_number = ?`, [bus.reg]);
            let bid;
            if (!b) {
                const bRes = await db.run(
                    `INSERT INTO Buses (registration_number, bus_type, total_seats, depot_name, status, wifi_available, gps_device_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [bus.reg, bus.type, bus.seats, 'Dharmapuri Depot', 'Active', 1, `GPS-${bus.reg}`]
                );
                bid = bRes.lastID;
            } else {
                bid = b.bus_id;
                await db.run(`UPDATE Buses SET depot_name = 'Dharmapuri Depot', status = 'Active' WHERE bus_id = ?`, [bid]);
            }
            busIds.push(bid);
        }

        // 5. Ensure Diverse Dharmapuri Routes
        const routeProfiles = [
            { code: 'DPI-101', name: 'Dharmapuri to Salem Express', from: 'Dharmapuri', to: 'Salem', dist: 68, fare: 65, duration: 90 },
            { code: 'DPI-102', name: 'Erode to Dharmapuri Line', from: 'Erode', to: 'Dharmapuri', dist: 130, fare: 110, duration: 150 },
            { code: 'DPI-103', name: 'Dharmapuri to Hosur Fast Passenger', from: 'Dharmapuri', to: 'Hosur', dist: 92, fare: 85, duration: 110 },
            { code: 'DPI-104', name: 'Dharmapuri to Sathyamangalam SETC', from: 'Dharmapuri', to: 'Sathyamangalam', dist: 185, fare: 145, duration: 215 },
            { code: 'DPI-105', name: 'Dharmapuri to Harur Town Bus', from: 'Dharmapuri', to: 'Harur', dist: 44, fare: 40, duration: 60 },
            { code: 'DPI-106', name: 'Dharmapuri to Hogenakkal Tourist Special', from: 'Dharmapuri', to: 'Hogenakkal', dist: 48, fare: 50, duration: 75 },
            { code: 'DPI-201', name: 'Dharmapuri to Chennai SETC Ultra Deluxe', from: 'Dharmapuri', to: 'Chennai', dist: 295, fare: 320, duration: 330 },
            { code: 'DPI-202', name: 'Dharmapuri to Bengaluru Intercity', from: 'Dharmapuri', to: 'Bengaluru', dist: 138, fare: 160, duration: 160 }
        ];

        const routeIds = [];
        for (const r of routeProfiles) {
            let rt = await db.get(`SELECT route_id FROM Routes WHERE route_code = ? OR name = ?`, [r.code, r.name]);
            let rtid;
            if (!rt) {
                const rRes = await db.run(
                    `INSERT INTO Routes (route_code, name, source_city, destination_city, total_distance_km, estimated_duration_mins, base_fare, route_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [r.code, r.name, r.from, r.to, r.dist, r.duration, r.fare, 'TNSTC Express']
                );
                rtid = rRes.lastID;
            } else {
                rtid = rt.route_id;
                await db.run(`UPDATE Routes SET name = ?, source_city = ?, destination_city = ? WHERE route_id = ?`, [r.name, r.from, r.to, rtid]);
            }
            routeIds.push(rtid);
        }

        // 6. Ensure Master Trips Ledger (Trip History & Today's Trips)
        const todayStr = new Date().toISOString().split('T')[0];
        const masterTrips = [
            { routeId: routeIds[0], busId: busIds[0], drvId: driverIds[0], cndId: conductorIds[0], time: `${todayStr} 05:45:00`, status: 'Scheduled' },
            { routeId: routeIds[1], busId: busIds[1], drvId: driverIds[1], cndId: conductorIds[1], time: `${todayStr} 07:15:00`, status: 'Running' },
            { routeId: routeIds[2], busId: busIds[2], drvId: driverIds[2], cndId: conductorIds[2], time: `${todayStr} 08:30:00`, status: 'Scheduled' },
            { routeId: routeIds[3], busId: busIds[3], drvId: driverIds[3], cndId: conductorIds[3], time: `${todayStr} 09:45:00`, status: 'Scheduled' },
            { routeId: routeIds[4], busId: busIds[4], drvId: driverIds[4], cndId: conductorIds[4], time: `${todayStr} 10:20:00`, status: 'Scheduled' },
            { routeId: routeIds[5], busId: busIds[5], drvId: driverIds[0], cndId: conductorIds[0], time: `${todayStr} 11:30:00`, status: 'Scheduled' },
            { routeId: routeIds[6], busId: busIds[6], drvId: driverIds[1], cndId: conductorIds[1], time: `${todayStr} 13:00:00`, status: 'Scheduled' },
            { routeId: routeIds[7], busId: busIds[7], drvId: driverIds[2], cndId: conductorIds[2], time: `${todayStr} 15:40:00`, status: 'Scheduled' },
            { routeId: routeIds[0], busId: busIds[8], drvId: driverIds[3], cndId: conductorIds[3], time: `${todayStr} 17:15:00`, status: 'Scheduled' },
            { routeId: routeIds[1], busId: busIds[9], drvId: driverIds[4], cndId: conductorIds[4], time: `${todayStr} 18:50:00`, status: 'Scheduled' }
        ];

        // Clear all legacy trips to ensure clean master ledger strictly for Dharmapuri Depot
        await db.run(`DELETE FROM Trips`);

        for (const trip of masterTrips) {
            await db.run(
                `INSERT INTO Trips (route_id, bus_id, driver_id, conductor_id, depot_id, scheduled_departure, status, delay_mins) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [trip.routeId, trip.busId, trip.drvId, trip.cndId, 1, trip.time, trip.status, 0]
            );
        }

        console.log('--- Dharmapuri Master Data Synchronization Complete! ---');
    } catch (err) {
        console.error('Error in syncDharmapuriData:', err);
    }
}

async function seedDatabase() {
    console.log('--- Checking & Seeding TNSTC / SETC Database ---');

    await syncDharmapuriData();
}

module.exports = seedDatabase;
module.exports.syncDharmapuriData = syncDharmapuriData;

if (require.main === module) {
    seedDatabase().then(() => {
        console.log('Seed completed!');
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
}
