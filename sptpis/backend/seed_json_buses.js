const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function seedBuses() {
    try {
        fs.writeFileSync('seed_log.txt', 'Started\\n');
        const jsonPath = path.join(__dirname, '../frontend/src/pages/bus_schedules.json');
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        fs.appendFileSync('seed_log.txt', 'Parsed json\\n');

        let busesMap = {};
        data.forEach(item => {
            if (!busesMap[item.bus]) {
                busesMap[item.bus] = {
                    registration_number: item.bus,
                    bus_type: item.service_type || 'Town Bus',
                    depot_name: 'Dharmapuri Depot',
                    total_seats: 54,
                    status: 'Active'
                };
            }
        });

        const uniqueBuses = Object.values(busesMap);
        fs.appendFileSync('seed_log.txt', `Found ${uniqueBuses.length} unique buses.\\n`);

        await db.ensureReady();

        for (const bus of uniqueBuses) {
            try {
                await db.run(`
                    INSERT INTO Buses (registration_number, bus_type, total_seats, depot_name, status)
                    VALUES (?, ?, ?, ?, ?)
                `, [bus.registration_number, bus.bus_type, bus.total_seats, bus.depot_name, bus.status]);
                fs.appendFileSync('seed_log.txt', `Added ${bus.registration_number}\\n`);
            } catch (err) {
                if (err.message.includes('UNIQUE')) {
                    fs.appendFileSync('seed_log.txt', `Skipped existing ${bus.registration_number}\\n`);
                } else {
                    fs.appendFileSync('seed_log.txt', `Error ${bus.registration_number}: ${err.message}\\n`);
                }
            }
        }
        fs.appendFileSync('seed_log.txt', 'Done.\\n');
    } catch (e) {
        fs.appendFileSync('seed_log.txt', `Crash: ${e.message}\\n`);
    }
    process.exit(0);
}

seedBuses();
