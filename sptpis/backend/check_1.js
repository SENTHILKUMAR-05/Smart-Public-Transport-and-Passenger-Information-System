const db = require('./config/database');
(async () => {
    try {
        const dId = 1;
        const depotInfo = await db.get('SELECT d.*, r.name as region_name, c.name as corporation_name FROM Depots d JOIN Regions r ON d.region_id = r.region_id JOIN Corporations c ON r.corporation_id = c.corporation_id WHERE d.depot_id = ?', [dId]);
        console.log("DepotInfo 1: ", depotInfo);
    } catch (err) { console.error("Error: ", err); }
})();
