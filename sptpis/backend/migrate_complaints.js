const db = require('./config/database');
async function run() {
    try {
        await db.run('ALTER TABLE Complaints ADD COLUMN description TEXT');
        console.log('Added description');
    } catch (e) { console.log(e.message); }
    try {
        await db.run('ALTER TABLE Complaints ADD COLUMN photo_url TEXT');
        console.log('Added photo');
    } catch (e) { console.log(e.message); }
}
run();
