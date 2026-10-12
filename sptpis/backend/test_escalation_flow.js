const axios = require('axios');

async function testComplaintEscalation() {
    const baseURL = 'http://localhost:5000';
    const depotHeaders = { headers: { Authorization: 'Bearer demo-depot-admin-token' } };
    const regHeaders = { headers: { Authorization: 'Bearer demo-regional-admin-token' } };

    console.log('--- 1. Submitting new passenger complaint ---');
    const createRes = await axios.post(`${baseURL}/api/passenger/complaints`, {
        user_id: 'Passenger1',
        booking_id: 101,
        busNumber: 'TN 27 N 2001',
        category: 'Punctuality',
        description: 'Bus was delayed by over 2 hours without prior notification to passengers.',
        severity: 'High'
    });
    console.log('Submission Response:', createRes.data);
    const complaintId = createRes.data.complaint_id || createRes.data.id;
    if (!complaintId) throw new Error('No complaint ID returned');

    console.log(`\n--- 2. Depot Admin reviewing complaint #${complaintId} ---`);
    const depotComplaints = await axios.get(`${baseURL}/api/depot/complaints`, depotHeaders);
    const depotItem = depotComplaints.data.find(c => c.complaint_id === complaintId);
    console.log('Depot found complaint:', depotItem?.complaint_id, 'Status:', depotItem?.status, 'Level:', depotItem?.escalation_level);

    console.log(`\n--- 3. Depot Admin escalating complaint #${complaintId} to Regional Admin ---`);
    const depotEscRes = await axios.put(`${baseURL}/api/depot/complaints/${complaintId}/escalate`, {
        reason: 'Schedule delay was due to regional route traffic gridlock. Forwarding for Salem division investigation.'
    }, depotHeaders);
    console.log('Depot Escalation Result:', depotEscRes.data);

    console.log(`\n--- 4. Regional Admin reviewing complaint #${complaintId} ---`);
    const regComplaints = await axios.get(`${baseURL}/api/regional/complaints`, regHeaders);
    const regItem = regComplaints.data.find(c => c.complaint_id === complaintId);
    console.log('Regional found complaint:', regItem?.complaint_id, 'Status:', regItem?.status, 'Level:', regItem?.escalation_level);

    console.log(`\n--- 5. Regional Admin escalating complaint #${complaintId} to State Admin HQ ---`);
    const regEscRes = await axios.put(`${baseURL}/api/regional/complaints/${complaintId}/escalate`, {
        reason: 'Regional review requests state-level refund/compensation authorization for delayed passengers.'
    }, regHeaders);
    console.log('Regional Escalation Result:', regEscRes.data);

    console.log(`\n--- 6. State Admin reviewing complaint #${complaintId} ---`);
    const stateComplaints = await axios.get(`${baseURL}/api/state-admin/complaints`);
    const stateItem = stateComplaints.data.find(c => c.complaint_id === complaintId);
    console.log('State found complaint:', stateItem?.complaint_id, 'Status:', stateItem?.status, 'Level:', stateItem?.escalation_level);

    console.log(`\n--- 7. State Admin resolving complaint #${complaintId} with compensation ---`);
    const stateResRes = await axios.put(`${baseURL}/api/state-admin/complaints/${complaintId}/resolve`, {
        remarks: 'Approved 100% fare refund and issued operational reprimand to depot schedule coordinator.'
    });
    console.log('State Resolution Result:', stateResRes.data);

    console.log(`\n--- 8. Passenger checking final complaint status ---`);
    const passComplaints = await axios.get(`${baseURL}/api/passenger/complaints?user_id=Passenger1`);
    const passItem = passComplaints.data.find(c => c.complaint_id === complaintId);
    console.log('Passenger View:', {
        id: passItem?.complaint_id,
        status: passItem?.status,
        level: passItem?.escalation_level,
        escalated_to: passItem?.escalated_to,
        remarks: passItem?.resolution_remarks
    });

    if (passItem?.status === 'Resolved' && passItem?.escalation_level === 3) {
        console.log('\n>>> SUCCESS: Full 3-tier escalation and resolution lifecycle verified flawlessly! <<<');
    } else {
        throw new Error('Lifecycle status verification failed!');
    }
}

testComplaintEscalation().catch(err => {
    console.error('Test Failed:', err.response?.data || err.message);
    process.exit(1);
});
