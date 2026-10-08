const db = require('./config/database');

async function test() {
    try {
        await db.ensureReady();
        const trips = await db.all(`
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
            ORDER BY t.trip_id DESC
        `);
        console.log('Successfully fetched trips count:', trips.length);
        console.log('Sample Trip:', trips[0]);
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

test();
