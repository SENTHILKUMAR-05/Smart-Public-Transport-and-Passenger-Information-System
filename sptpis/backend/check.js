const db = require('./config/database');
(async () => {
    try {
        const dharma = await db.all("SELECT depot_id, name FROM Depots WHERE name LIKE '%Dharmapuri%'");
        console.log('Dharmapuri Depots:', dharma);
    } catch (err) { console.error(err); }
})();
