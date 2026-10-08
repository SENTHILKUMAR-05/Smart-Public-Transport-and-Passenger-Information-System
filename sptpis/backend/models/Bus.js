const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    bus_id: { type: Number },
    registration_number: { type: String, required: true, unique: true },
    bus_type: { type: String, default: 'Express' },
    total_seats: { type: Number, default: 54 },
    depot_name: { type: String, default: 'Dharmapuri Depot' },
    status: { type: String, default: 'Active' },
    wifi_available: { type: Boolean, default: false },
    gps_device_id: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bus', busSchema);
