const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    complaint_id: { type: Number },
    category: { type: String, required: true },
    busNumber: { type: String },
    location: { type: String },
    text: { type: String },
    description: { type: String },
    reported_by: { type: String, default: 'Passenger1' },
    statusStr: { type: String },
    status: { type: String, default: 'Open' },
    severity: { type: String, default: 'High' },
    photoUrl: { type: String },
    created_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
