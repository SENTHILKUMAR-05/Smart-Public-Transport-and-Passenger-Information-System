const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    route_id: { type: Number },
    route_code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    source_city: { type: String, required: true },
    destination_city: { type: String, required: true },
    total_distance_km: { type: Number, default: 100 },
    estimated_duration_mins: { type: Number, default: 120 },
    base_fare: { type: Number, default: 100 },
    route_type: { type: String, default: 'Express' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', routeSchema);
