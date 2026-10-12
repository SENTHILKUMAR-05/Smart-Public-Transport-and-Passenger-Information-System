const db = require('./config/database');

async function testLifecycle() {
    try {
        console.log('--- 1. Testing Ticket Creation ---');
        const testId = 'MNT-TEST-99';
        await db.run(`
            INSERT INTO Driver_Garage_Tickets (ticket_id, driver_id, driver_name, bus_number, depot_name, issue, severity, status, mechanic)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', 'Unassigned')
        `, [testId, 'TN29-DRV-201', 'K. Murugan', 'TN-29-N-1542', 'Dharmapuri Depot', 'Air compressor governor valve cycling rapidly', 'High']);

        let created = await db.get("SELECT * FROM Driver_Garage_Tickets WHERE ticket_id = ?", [testId]);
        console.log('Created Ticket:', created.ticket_id, '| Status:', created.status, '| Issue:', created.issue);

        console.log('--- 2. Testing Depot Admin Resolution Update ---');
        await db.run(`
            UPDATE Driver_Garage_Tickets
            SET status = 'Resolved', mechanic = 'R. Periasamy (Mechanic)', resolution_notes = 'Replaced unloader valve cartridge and reset cut-out pressure to 8.5 bar.'
            WHERE ticket_id = ?
        `, [testId]);

        let resolved = await db.get("SELECT * FROM Driver_Garage_Tickets WHERE ticket_id = ?", [testId]);
        console.log('Resolved Ticket:', resolved.ticket_id, '| Status:', resolved.status, '| Mech:', resolved.mechanic, '| Notes:', resolved.resolution_notes);

        console.log('--- 3. Verifying Ticket Remains in Database and is Retained in History ---');
        let allTickets = await db.all("SELECT * FROM Driver_Garage_Tickets ORDER BY ticket_id ASC");
        console.log('Total tickets retained in database:', allTickets.length);
        const exists = allTickets.some(t => t.ticket_id === testId && t.status === 'Resolved');
        console.log('Verified resolved ticket is permanently retained in database history:', exists);

        // Clean up test ticket
        await db.run("DELETE FROM Driver_Garage_Tickets WHERE ticket_id = ?", [testId]);
        console.log('Test record cleaned up successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Lifecycle test failed:', e);
        process.exit(1);
    }
}

setTimeout(testLifecycle, 500);
