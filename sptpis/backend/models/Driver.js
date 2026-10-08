const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    driver_id: { type: Number },
    user_id: { type: Number },
    name: { type: String, required: true },
    license_number: { type: String, required: true },
    badge_number: { type: String, required: true },
    depot: { type: String, default: 'Dharmapuri Depot' },
    experience_years: { type: Number, default: 5 },
    status: { type: String, default: 'Active' },
    rating: { type: Number, default: 4.85 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', driverSchema);
