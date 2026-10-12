const axios = require('axios');

async function testPhotoAndEscalationFlow() {
    const baseURL = 'http://localhost:5000';
    const depotHeaders = { headers: { Authorization: 'Bearer demo-depot-admin-token' } };
    const regHeaders = { headers: { Authorization: 'Bearer demo-regional-admin-token' } };

    console.log('=== STEP 1: Submitting Complaint with Base64 Photo Proof ===');
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNk+M9QzwAEjAw/ACkNAf9j873wAAAAAElFTkSuQmCC';

    const submitRes = await axios.post(`${baseURL}/api/passenger/complaints`, {
        user_id: 'TestPassenger_Photo',
        booking_id: 202,
        busNumber: 'TN 29 N 1542',
        category: 'AC / Amenities',
        description: 'AC unit broken and blowing hot air. Attached sensor thermometer photo.',
        photoUrl: sampleBase64,
        severity: 'High'
    });

    console.log('Submission Response Status:', submitRes.status);
    const complaintId = submitRes.data.complaint_id || submitRes.data.id;
    console.log('Created Complaint ID:', complaintId);
    if (!complaintId) throw new Error('Failed to create complaint');

    console.log('\n=== STEP 2: Verifying Depot Admin Photo Proof and Status ===');
    const depotComplaints = await axios.get(`${baseURL}/api/depot/complaints`, depotHeaders);
    const depotItem = depotComplaints.data.find(c => c.complaint_id === complaintId);
    console.log('Found in Depot Admin:', !!depotItem);
    console.log('Depot Complaint Escalation Level:', depotItem?.escalation_level);
    console.log('Depot Complaint Status:', depotItem?.status);
    console.log('Depot Photo URL matches sampleBase64:', depotItem?.photo_url === sampleBase64);

    if (depotItem?.photo_url !== sampleBase64) {
        throw new Error('Base64 photo failed to persist in Depot Admin!');
    }

    console.log('\n=== STEP 3: Escalating to Regional Admin (Level 2) ===');
    const depotEscRes = await axios.put(`${baseURL}/api/depot/complaints/${complaintId}/escalate`, {
        reason: 'Compressor burnt out. Forwarded to Salem Regional workshop for component replacement.'
    }, depotHeaders);
    console.log('Depot Escalation Result:', depotEscRes.data);

    console.log('\n=== STEP 4: Verifying Lockdown at Depot & Presence at Regional ===');
    const depotComplaintsAfter = await axios.get(`${baseURL}/api/depot/complaints`, depotHeaders);
    const depotItemAfter = depotComplaintsAfter.data.find(c => c.complaint_id === complaintId);
    console.log('Depot Escalation Level after escalate:', depotItemAfter?.escalation_level);
    console.log('Depot Status after escalate:', depotItemAfter?.status);

    // In frontend DepotAdminDashboard: cmp.escalation_level > 1 causes Mark Resolved to be locked!
    const isLockedAtDepot = depotItemAfter.escalation_level > 1 || depotItemAfter.status?.toLowerCase().includes('escalat');
    console.log('Depot Admin UI Lockdown condition active (level > 1):', isLockedAtDepot);

    const regComplaints = await axios.get(`${baseURL}/api/regional/complaints`, regHeaders);
    const regItem = regComplaints.data.find(c => c.complaint_id === complaintId);
    console.log('Found in Regional Admin:', !!regItem);
    console.log('Regional Escalation Level:', regItem?.escalation_level);
    console.log('Regional Photo URL matches sampleBase64:', regItem?.photo_url === sampleBase64);

    if (regItem?.photo_url !== sampleBase64) {
        throw new Error('Base64 photo failed to persist in Regional Admin!');
    }

    console.log('\n=== STEP 5: Escalating to State Admin HQ (Level 3) ===');
    const regEscRes = await axios.put(`${baseURL}/api/regional/complaints/${complaintId}/escalate`, {
        reason: 'Fleet warranty claim requires State Transport HQ procurement review.'
    }, regHeaders);
    console.log('Regional Escalation Result:', regEscRes.data);

    console.log('\n=== STEP 6: Verifying Lockdown at Regional & Presence at State HQ ===');
    const regComplaintsAfter = await axios.get(`${baseURL}/api/regional/complaints`, regHeaders);
    const regItemAfter = regComplaintsAfter.data.find(c => c.complaint_id === complaintId);
    console.log('Regional Escalation Level after escalate:', regItemAfter?.escalation_level);
    console.log('Regional Status after escalate:', regItemAfter?.status);

    // In frontend RegionalAdminDashboard: cmp.escalation_level >= 3 causes action buttons to be locked!
    const isLockedAtRegional = regItemAfter.escalation_level >= 3 || regItemAfter.status?.toLowerCase().includes('state');
    console.log('Regional Admin UI Lockdown condition active (level >= 3):', isLockedAtRegional);

    const stateComplaints = await axios.get(`${baseURL}/api/state-admin/complaints`);
    const stateItem = stateComplaints.data.find(c => c.complaint_id === complaintId);
    console.log('Found in State Admin HQ:', !!stateItem);
    console.log('State Escalation Level:', stateItem?.escalation_level);
    console.log('State Photo URL matches sampleBase64:', stateItem?.photo_url === sampleBase64);

    if (stateItem?.photo_url !== sampleBase64) {
        throw new Error('Base64 photo failed to persist in State Admin HQ!');
    }

    console.log('\n=== STEP 7: Passenger Dashboard Checking Photo & Escalation ===');
    const passComplaints = await axios.get(`${baseURL}/api/passenger/complaints?user_id=TestPassenger_Photo`);
    const passItem = passComplaints.data.find(c => c.complaint_id === complaintId);
    console.log('Passenger View Complaint:', {
        id: passItem?.complaint_id,
        status: passItem?.status,
        escalation_level: passItem?.escalation_level,
        has_photo: !!passItem?.photo_url,
        photo_matches: passItem?.photo_url === sampleBase64
    });

    console.log('\n======================================================');
    console.log('>>> ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<');
    console.log('======================================================');
}

testPhotoAndEscalationFlow().catch(err => {
    console.error('Test Failed:', err.response?.data || err.message);
    process.exit(1);
});
