const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sptpis_mern';
        await mongoose.connect(mongoURI);
        console.log(`[MongoDB] Successfully connected to Database: MERN Stack initialized`);
    } catch (error) {
        console.error(`[MongoDB] Connection Failed`, error.message);
        // process.exit(1);
    }
};

module.exports = connectDB;
