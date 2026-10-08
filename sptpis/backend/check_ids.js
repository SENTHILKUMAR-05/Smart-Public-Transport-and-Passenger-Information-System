const db = require('./config/database');

async function check() {
    await db.ensureReady();
    console.log('--- ROUTES ---');
    console.log(await db.all('SELECT route_id, route_code, name FROM Routes'));

    console.log('--- BUSES ---');
    console.log(await db.all('SELECT bus_id, registration_number FROM Buses'));

    console.log('--- DRIVERS ---');
    console.log(await db.all('SELECT driver_id, name, license_number FROM Drivers d LEFT JOIN Users u ON d.user_id = u.user_id'));

    console.log('--- CONDUCTORS ---');
    console.log(await db.all('SELECT conductor_id, name, employee_number FROM Conductors'));

    console.log('--- DEPOTS ---');
    console.log(await db.all('SELECT depot_id, name FROM Depots'));

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
