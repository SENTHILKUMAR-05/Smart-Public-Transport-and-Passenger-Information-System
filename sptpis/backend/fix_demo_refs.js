const db = require('./config/database');
(async () => {
    try {
        const dharma = await db.get("SELECT depot_id FROM Depots WHERE name LIKE '%Dharmapuri%' LIMIT 1");
        if (dharma && dharma.depot_id !== 1) {
            console.log('Migrating depot 1 references to', dharma.depot_id);
            await db.run('UPDATE Trips SET depot_id = ? WHERE depot_id = 1', [dharma.depot_id]);
            await db.run('UPDATE Conductors SET depot_id = ? WHERE depot_id = 1', [dharma.depot_id]);
            await db.run('UPDATE Maintenance SET depot_id = ? WHERE depot_id = 1', [dharma.depot_id]);
            await db.run('UPDATE Incidents SET depot_id = ? WHERE depot_id = 1', [dharma.depot_id]);

            // Also update Buses depot_name
            const dharmaDepot = await db.get("SELECT name FROM Depots WHERE depot_id = ?", [dharma.depot_id]);
            if (dharmaDepot) {
                await db.run("UPDATE Buses SET depot_name = ? WHERE depot_name = 'Dharmapuri Depot'", [dharmaDepot.name]);
                await db.run("UPDATE Drivers SET depot = ? WHERE depot = 'Dharmapuri Depot'", [dharmaDepot.name]);
            }
        }

        const salem = await db.get("SELECT region_id FROM Regions WHERE name LIKE '%Salem%' LIMIT 1");
        if (salem && salem.region_id !== 1) {
            console.log('Migrating region 1 references to', salem.region_id);
            await db.run('UPDATE Incidents SET region_id = ? WHERE region_id = 1', [salem.region_id]);
        }
        console.log('Fix complete.');
    } catch (err) { console.error(err); }
})();
