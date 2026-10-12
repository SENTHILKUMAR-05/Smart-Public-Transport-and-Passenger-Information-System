const db = require('./config/database');

async function check() {
    await db.ensureReady();
    const schedules = await db.all("SELECT DISTINCT from_city, to_city FROM BusSchedules");
    console.log("=== BusSchedules unique pairs ===");
    console.log(schedules);

    const routes = await db.all("SELECT DISTINCT source_city, destination_city FROM Routes");
    console.log("=== Routes unique pairs ===");
    console.log(routes);

    process.exit(0);
}
check().catch(console.error);
