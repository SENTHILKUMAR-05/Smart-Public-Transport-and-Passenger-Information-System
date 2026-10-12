/**
 * seed_schedules.js
 * Seeds the BusSchedules table from bus_schedules.json (all existing CSV-derived routes).
 * Uses INSERT OR IGNORE so it is safe to re-run at every server startup.
 */
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

async function seedSchedules() {
    try {
        const jsonPath = path.join(__dirname, '../../frontend/src/pages/bus_schedules.json');
        if (!fs.existsSync(jsonPath)) {
            console.warn('[BusSchedules] bus_schedules.json not found. Skipping seed.');
            return;
        }

        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        let inserted = 0;

        for (const item of data) {
            if (!item.bus || !item.from || !item.to) continue;
            try {
                // Check if this schedule entry already exists
                const row = await db.get(
                    `SELECT schedule_id FROM BusSchedules WHERE bus_number = ? AND from_city = ? AND to_city = ? AND departure = ?`,
                    [item.bus, item.from, item.to, item.departure || '06:00 AM']
                );
                if (row) continue;

                await db.run(
                    `INSERT INTO BusSchedules 
                        (bus_number, from_city, to_city, departure, arrival, duration, fare, service_type, status, depot_name)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'Dharmapuri Depot')`,
                    [
                        item.bus,
                        item.from,
                        item.to,
                        item.departure || '06:00 AM',
                        item.arrival || '08:00 AM',
                        item.duration || '1h 30m',
                        item.fare || '₹55',
                        item.service_type || 'TNSTC Express'
                    ]
                );
                inserted++;
            } catch (e) {
                // Skip errors silently
            }
        }

        if (inserted > 0) {
            console.log(`[BusSchedules] Seeded ${inserted} new schedule entries from bus_schedules.json`);
        } else {
            console.log(`[BusSchedules] All schedule entries are up to date.`);
        }
    } catch (err) {
        console.error('[BusSchedules] Seed error:', err.message);
    }
}

module.exports = seedSchedules;
