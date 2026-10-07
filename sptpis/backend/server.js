const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const path = require('path');

const db = require('./config/database');
const connectMongoDB = require('./config/mongodb');
const seedDatabase = require('./database/seed');
const BusSimulator = require('./simulation/busSimulator');

// Routes
const authRoutes = require('./routes/authRoutes');
const busRoutes = require('./routes/busRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const stateAdminRoutes = require('./routes/stateAdminRoutes');
const regionalAdminRoutes = require('./routes/regionalAdminRoutes');
const depotAdminRoutes = require('./routes/depotAdminRoutes');
const passengerRoutes = require('./routes/passengerRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/state-admin', stateAdminRoutes);
app.use('/api/regional', regionalAdminRoutes);
app.use('/api/depot', depotAdminRoutes);
app.use('/api/passenger', passengerRoutes);
app.use('/api/ai', aiRoutes);

// Simulation control endpoints
let busSimulator = null;

app.post('/api/simulation/speed', (req, res) => {
    const { speed } = req.body;
    if (busSimulator) {
        busSimulator.setSpeed(Number(speed) || 1);
        res.json({ message: `Simulation speed changed to ${busSimulator.simSpeed}x`, speed: busSimulator.simSpeed });
    } else {
        res.status(400).json({ error: 'Simulation engine not running' });
    }
});

app.post('/api/simulation/event', (req, res) => {
    const { type, bus_id, message } = req.body;
    io.emit('simulation_event_broadcast', { type, bus_id, message, timestamp: new Date().toISOString() });
    res.json({ message: 'Event broadcasted to all clients' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        system: 'Smart Public Transport and Passenger Information System (TNSTC/SETC)',
        timestamp: new Date().toISOString()
    });
});

// Socket.IO Listeners
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client Connected: ${socket.id}`);

    socket.on('join_bus_room', (busId) => {
        socket.join(`bus_${busId}`);
        console.log(`Socket ${socket.id} joined bus_${busId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client Disconnected: ${socket.id}`);
    });

    socket.on('trigger_global_sync', (data) => {
        io.emit('global_sync_broadcast', data);
        console.log(`[Socket.IO] System alert broadcasted: ${data.title}`);
    });
});

const PORT = process.env.PORT || 5000;

// Initialize Database, Seed, and Start Server
async function startServer() {
    try {
        // Init original SQLite DB & Mock data
        await seedDatabase();

        // Init MERN MongoDB backend
        await connectMongoDB();

        busSimulator = new BusSimulator(io);
        await busSimulator.init();

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`======================================================================`);
            console.log(`  TNSTC SPTPIS Backend running on: http://localhost:${PORT}`);
            console.log(`  Socket.IO Real-time Engine: Active (${PORT})`);
            console.log(`======================================================================`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
    }
}

startServer();
