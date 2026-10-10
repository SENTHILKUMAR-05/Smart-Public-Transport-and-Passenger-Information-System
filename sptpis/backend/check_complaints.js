const db = require('./config/database');
async function run() {
    try {
        const res = await db.all('SELECT * FROM Complaints');
        console.log(res);
    } catch (e) { console.error(e); }
}
run();
