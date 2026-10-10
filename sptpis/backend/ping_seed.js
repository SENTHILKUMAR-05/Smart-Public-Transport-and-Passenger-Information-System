const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/depot/seed-buses',
    method: 'GET',
    headers: {
        'Authorization': 'demo-depot-admin-token'
    }
};

const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        require('fs').writeFileSync('req_out.txt', data);
        process.exit(0);
    });
});

req.on('error', error => {
    require('fs').writeFileSync('req_out.txt', 'Error: ' + error.message);
    process.exit(1);
});

req.end();
