import fs from 'fs';

const files = [
    '../../dataset/bus timing and routes/salem_erode_bus_schedule.csv',
    '../../dataset/bus timing and routes/sathy_erode_bus_schedule.csv',
    '../../dataset/bus timing and routes/dharmapuri_salem_bus_schedule_v2.csv'
];

let allRoutes = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8').trim();
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim());
        if (row.length === headers.length) {
            allRoutes.push({
                id: 'mock_csv_' + Math.random().toString(36).substr(2, 9),
                bus: row[0],
                from: row[1],
                to: row[2],
                departure: row[3],
                arrival: row[4],
                service_type: row[0].includes('TN 33') ? 'TNSTC Sathy Region' : (row[0].includes('TN 29') ? 'TNSTC Dharmapuri Region' : 'TNSTC Salem Region'),
                type: 'DIRECT',
                duration: row[0].includes('TN 29') ? '1h 15m' : '1h 30m', // default based on routes
                fare: row[0].includes('TN 29') ? '₹45' : '₹55'
            });
        }
    }
});

fs.writeFileSync('src/pages/bus_schedules.json', JSON.stringify(allRoutes, null, 2));
console.log('Merged ' + allRoutes.length + ' bus routes.');
