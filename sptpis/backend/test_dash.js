const express = require('express');
const db = require('./config/database');
(async () => {
    try {
        const dId = 47;
        const depotInfo = await db.get(`
            SELECT d.*, r.name as region_name, c.name as corporation_name 
            FROM Depots d 
            JOIN Regions r ON d.region_id = r.region_id
            JOIN Corporations c ON r.corporation_id = c.corporation_id
            WHERE d.depot_id = ?
        `, [dId]);

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

        console.log({
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
        console.error("Dashboard ERROR:", e.message);
    }
})();
