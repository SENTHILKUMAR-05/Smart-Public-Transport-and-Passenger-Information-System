const db = require('./config/database');

async function check() {
    await db.ensureReady();
    const info = await db.all('PRAGMA table_info(Complaints)');
    console.log('Complaints table columns:', info.map(c => `${c.name} (${c.type})`));
    const sample = await db.all('SELECT * FROM Complaints LIMIT 3');
    console.log('Sample rows:', sample);
    process.exit(0);
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
