 const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema({
    conductor_id: { type: Number },
    name: { type: String, required: true },
    phone: { type: String },
    employee_number: { type: String, required: true, unique: true },
    depot_id: { type: Number, default: 1 },
    status: { type: String, default: 'Available' }
});

module.exports = mongoose.model('Conductor', conductorSchema);
