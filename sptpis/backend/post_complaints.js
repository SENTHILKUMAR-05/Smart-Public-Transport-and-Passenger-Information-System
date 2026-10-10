const http = require('http');

const data = JSON.stringify({
    category: 'Driver Behavior',
    busNumber: 'TN-30-C-1234',
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

req.on('error', e => console.error(e));
req.write(data);
req.end();
