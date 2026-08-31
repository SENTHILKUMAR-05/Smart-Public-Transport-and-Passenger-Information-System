const db = require('./config/database');
(async () => {
    try {
        await db.run("UPDATE Buses SET depot_name = 'Dharmapuri Depot' WHERE depot_name = 'Dharmapuri Taluk'");
        await db.run("UPDATE Drivers SET depot = 'Dharmapuri Depot' WHERE depot = 'Dharmapuri Taluk'");
        console.log('updated names to Dharmapuri Depot');
    } catch (err) { console.error("Error: ", err); }
})();
