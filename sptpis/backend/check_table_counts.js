const db = require('./config/database');

async function main() {
    await db.ensureReady();
    console.log('=== DB CONTENTS ===');
    const routes = await db.all('SELECT route_id, route_code FROM Routes');
    console.log('Routes:', routes);
    const buses = await db.all('SELECT bus_id, registration_number FROM Buses');
    console.log('Buses:', buses);
    const drivers = await db.all('SELECT driver_id, user_id FROM Drivers');
    console.log('Drivers:', drivers);
    const conductors = await db.all('SELECT conductor_id, name FROM Conductors');
    console.log('Conductors:', conductors);
    const depots = await db.all('SELECT depot_id, name FROM Depots');
    console.log('Depots:', depots);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
