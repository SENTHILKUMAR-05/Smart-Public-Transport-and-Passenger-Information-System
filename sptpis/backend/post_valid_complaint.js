const db = require('./config/database');
async function run() {
    const bus = await db.get('SELECT registration_number FROM Buses LIMIT 1');
    console.log('First bus:', bus.registration_number);

    const http = require('http');
    const data = JSON.stringify({
        category: 'Driver Behavior',
        busNumber: bus.registration_number,
        text: 'Reckless driving near Salem bypass.'
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/passenger/complaints',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => console.log('Response:', body));
    });

    req.write(data);
    req.end();
}
run();
