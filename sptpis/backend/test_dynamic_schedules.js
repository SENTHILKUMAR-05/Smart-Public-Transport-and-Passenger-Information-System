const db = require('./config/database');

async function testDynamicSchedules() {
    try {
        await db.ensureReady();

        console.log("=== 1. Checking BusSchedules Count ===");
        const count = await db.get("SELECT COUNT(*) as c FROM BusSchedules");
        console.log("Total BusSchedules in DB:", count.c);

        console.log("\n=== 2. Testing Query for Salem -> Erode ===");
        const salemErode = await db.all(
            `SELECT schedule_id, bus_number, from_city, to_city, departure, arrival 
             FROM BusSchedules 
             WHERE LOWER(from_city) = 'salem' AND LOWER(to_city) = 'erode'
             LIMIT 3`
        );
        console.log("Found:", salemErode.length, "trips. Sample:", salemErode);

        console.log("\n=== 3. Testing Adding a New Dynamic Route (Namakkal -> Salem) ===");
        const insertRes = await db.run(
            `INSERT INTO BusSchedules (bus_number, from_city, to_city, departure, arrival, duration, fare, service_type, status, depot_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
            ['TN 28 N 9999', 'Namakkal', 'Salem', '07:00 AM', '08:30 AM', '1h 30m', '₹45', 'Express', 'Dharmapuri Depot']
        );
        console.log("Inserted test schedule ID:", insertRes.lastID);

        const checkNew = await db.all(
            `SELECT * FROM BusSchedules WHERE LOWER(from_city) = 'namakkal' AND LOWER(to_city) = 'salem'`
        );
        console.log("Queried new route (Namakkal -> Salem):", checkNew);

        console.log("\n=== 4. Cleaning up test record ===");
        await db.run("DELETE FROM BusSchedules WHERE schedule_id = ?", [insertRes.lastID]);
        console.log("Cleaned up test record successfully.");

        console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<");
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

testDynamicSchedules();
