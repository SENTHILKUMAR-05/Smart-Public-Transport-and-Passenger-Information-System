const db = require('./config/database');
const seedSchedules = require('./database/seed_schedules');

async function main() {
    try {
        console.log("Checking database...");
        await db.ensureReady();

        let count = await db.get("SELECT COUNT(*) as c FROM BusSchedules");
        console.log("Current BusSchedules count:", count ? count.c : 0);

        if (!count || count.c === 0) {
            console.log("Seeding now...");
            await seedSchedules();
            count = await db.get("SELECT COUNT(*) as c FROM BusSchedules");
            console.log("New BusSchedules count:", count ? count.c : 0);
        }

        const sample = await db.all("SELECT schedule_id, bus_number, from_city, to_city, departure, arrival FROM BusSchedules LIMIT 5");
        console.log("Sample schedules:", JSON.stringify(sample, null, 2));
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
