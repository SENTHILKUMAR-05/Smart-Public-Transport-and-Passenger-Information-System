const dbMap = require('./config/database');

async function testInsert() {
    await dbMap.ensureReady();
    
    const db = require('sqlite3');
    const sqliteDb = dbMap.instance; // assuming instance is exposed
    
    // We can also just use dbMap
    const routes = await dbMap.all('SELECT route_id FROM Routes');
    const buses = await dbMap.all('SELECT bus_id FROM Buses');
    const drivers = await dbMap.all('SELECT driver_id FROM Drivers');
    const conductors = await dbMap.all('SELECT conductor_id FROM Conductors');
    const depots = await dbMap.all('SELECT depot_id FROM Depots');
    
    console.log('Routes:', routes.length, routes);
    console.log('Buses:', buses.length, buses);
    console.log('Drivers:', drivers.length, drivers);
    console.log('Conductors:', conductors.length, conductors);
    console.log('Depots:', depots.length, depots);
    
    // Try to insert a trip exactly like the failing one in UI:
    // Route 102, Bus 1258, Driver 129, Conductor 102
    
    try {
        await dbMap.run(`
            INSERT INTO Trips (route_id, bus_id, driver_id, conductor_id, depot_id, scheduled_departure, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')
        `, [2, 1, 1, 1, 1, '2026-10-08 11:45']);
        console.log("Insert Success!");
    } catch(e) {
        console.error("Insert Failed!", e.message);
    }
    
    // Try with the fallback logic values
    let route_id = 2, bus_id = 1, driver_id = 1, conductor_id = 1, depot_id = null;
    try {
        await dbMap.run(`
            INSERT INTO Trips (route_id, bus_id, driver_id, conductor_id, depot_id, scheduled_departure, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')
        `, [route_id, bus_id, driver_id, conductor_id, depot_id, '2026-10-08 11:45']);
        console.log("Insert Success with NULL depot!");
    } catch(e) {
        console.error("Insert Failed with NULL depot!", e.message);
    }
}

testInsert().catch(console.error);
