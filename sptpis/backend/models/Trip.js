const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    trip_id: { type: Number },
    route_id: { type: Number },
    bus_id: { type: Number },
    driver_id: { type: Number },
    conductor_id: { type: Number },
    depot_id: { type: Number, default: 1 },
    scheduled_departure: { type: String, required: true },
    actual_departure: { type: String },
    scheduled_arrival: { type: String },
    actual_arrival: { type: String },
    status: { type: String, default: 'Scheduled' },
    delay_mins: { type: Number, default: 0 },
    route_name: { type: String },
    source_city: { type: String },
    destination_city: { type: String },
    registration_number: { type: String },
    driver_name: { type: String },
    conductor_name: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trip', tripSchema);
