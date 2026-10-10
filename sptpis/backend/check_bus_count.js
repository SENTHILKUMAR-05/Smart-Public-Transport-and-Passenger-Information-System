const db = require('./config/database');

async function checkBuses() {
    try {
        const rows = await db.all("SELECT * FROM Buses");
        const fs = require('fs');
        fs.writeFileSync('bus_count.txt', `Total buses: ${rows.length}`);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
checkBuses();
