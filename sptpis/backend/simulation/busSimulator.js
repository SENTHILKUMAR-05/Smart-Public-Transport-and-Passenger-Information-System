const db = require('../config/database');

class BusSimulator {
    constructor(io) {
        this.io = io;
        this.interval = null;
        this.simSpeed = 1; // 1x, 2x, 5x
        this.isRunning = false;
        this.busesState = new Map();
    }

    async init() {
        console.log('--- Initializing Real-Time TNSTC Bus Simulation Engine ---');
        // Load active buses and their routes
        const buses = await db.all(`
            SELECT b.*, r.polyline_coords, r.total_distance_km, r.name as route_name 
            FROM Buses b
            LEFT JOIN Routes r ON b.current_route_id = r.route_id
            WHERE b.status = 'Active'
        `);

        for (const bus of buses) {
            let coords = [];
            try {
                coords = JSON.parse(bus.polyline_coords || '[]');
            } catch (e) {
                coords = [];
            }
            if (coords.length < 2) continue;

            // Load current GPS position
            const gps = await db.get(`SELECT * FROM GPS_Tracking WHERE bus_id = ? ORDER BY gps_id DESC LIMIT 1`, [bus.bus_id]);

            // Interpolate points between waypoints so movement looks silky smooth
            const smoothPath = this.generateSmoothPath(coords, 40); // 40 points between each major stop

            this.busesState.set(bus.bus_id, {
                bus_id: bus.bus_id,
                registration_number: bus.registration_number,
                route_id: bus.current_route_id,
                route_name: bus.route_name,
                path: smoothPath,
                currentIndex: Math.floor((gps?.route_completion_pct || 50) / 100 * smoothPath.length) % smoothPath.length,
                speed: 55 + Math.floor(Math.random() * 15), // 55 - 70 km/h
                total_distance_km: bus.total_distance_km || 150,
                status: 'Active'
            });
        }

        this.start();
    }

    generateSmoothPath(coords, stepsPerSegment) {
        const path = [];
        for (let i = 0; i < coords.length - 1; i++) {
            const start = coords[i];
            const end = coords[i + 1];
            for (let s = 0; s < stepsPerSegment; s++) {
                const fraction = s / stepsPerSegment;
                const lat = start[0] + (end[0] - start[0]) * fraction;
                const lng = start[1] + (end[1] - start[1]) * fraction;
                path.push([lat, lng]);
            }
        }
        path.push(coords[coords.length - 1]);
        return path;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[BusSimulator] Real-Time Simulation Engine Started (${this.simSpeed}x speed)`);

        this.interval = setInterval(async () => {
            await this.step();
        }, 3000 / this.simSpeed);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        this.isRunning = false;
        console.log('[BusSimulator] Real-Time Simulation Engine Paused');
    }

    setSpeed(speedMultiplier) {
        this.simSpeed = Math.max(0.5, Math.min(10, speedMultiplier));
        if (this.isRunning) {
            this.stop();
            this.start();
        }
        this.io.emit('sim_speed_change', { speed: this.simSpeed });
        console.log(`[BusSimulator] Speed adjusted to ${this.simSpeed}x`);
    }

    async step() {
        const updates = [];

        for (const [busId, state] of this.busesState.entries()) {
            state.currentIndex = (state.currentIndex + 1) % state.path.length;
            const currentCoord = state.path[state.currentIndex];
            const pct = parseFloat(((state.currentIndex / (state.path.length - 1)) * 100).toFixed(1));
            
            // Calculate distance remaining & ETA
            const distanceRemaining = parseFloat(((100 - pct) / 100 * state.total_distance_km).toFixed(1));
            const etaMinutes = Math.max(2, Math.floor((distanceRemaining / state.speed) * 60));

            // Determine next major stop based on pct
            let nextStop = "Salem Central Bus Stand";
            let completedStops = [];
            let upcomingStops = [];
            
            if (pct < 30) {
                nextStop = "Salem Central Bus Stand";
                completedStops = ["Dharmapuri"];
                upcomingStops = ["Salem", "Erode", "Sathyamangalam"];
            } else if (pct < 65) {
                nextStop = "Erode Junction Bus Stand";
                completedStops = ["Dharmapuri", "Salem"];
                upcomingStops = ["Erode", "Sathyamangalam"];
            } else if (pct < 95) {
                nextStop = "Sathyamangalam Bus Stand";
                completedStops = ["Dharmapuri", "Salem", "Erode"];
                upcomingStops = ["Sathyamangalam"];
            } else {
                nextStop = "Sathyamangalam (Destination Reached)";
                completedStops = ["Dharmapuri", "Salem", "Erode", "Sathyamangalam"];
                upcomingStops = [];
            }

            // Small chance of normal passenger boarding/dropping simulation
            let normalDelta = 0;
            if (Math.random() < 0.25) {
                normalDelta = Math.random() < 0.5 ? 1 : -1;
            }

            // Persist GPS Update in DB
            try {
                await db.run(
                    `UPDATE GPS_Tracking SET 
                        latitude = ?, longitude = ?, speed_kmh = ?, 
                        next_stop_name = ?, distance_remaining_km = ?, 
                        estimated_arrival_mins = ?, route_completion_pct = ?, recorded_at = CURRENT_TIMESTAMP
                     WHERE bus_id = ?`,
                    [currentCoord[0], currentCoord[1], state.speed, nextStop, distanceRemaining, etaMinutes, pct, busId]
                );

                if (normalDelta !== 0) {
                    await db.run(
                        `UPDATE Passenger_Tracking SET 
                            normal_passengers_count = MAX(0, normal_passengers_count + ?),
                            total_occupancy_count = MAX(0, reserved_passengers_count + normal_passengers_count + ?),
                            occupancy_percentage = ROUND((reserved_passengers_count + normal_passengers_count + ?) * 100.0 / 54.0, 1),
                            current_stop_name = ?
                         WHERE bus_id = ?`,
                        [normalDelta, normalDelta, normalDelta, nextStop, busId]
                    );
                }
            } catch (err) {
                // Ignore transient write collisions
            }

            // Prepare Socket.IO payload
            const updatePayload = {
                bus_id: busId,
                registration_number: state.registration_number,
                route_id: state.route_id,
                route_name: state.route_name,
                location: {
                    latitude: currentCoord[0],
                    longitude: currentCoord[1],
                },
                speed_kmh: state.speed,
                next_stop: nextStop,
                distance_remaining_km: distanceRemaining,
                estimated_arrival_mins: etaMinutes,
                route_completion_pct: pct,
                journey_progress: {
                    completed_stops: completedStops,
                    next_stop: nextStop,
                    upcoming_stops: upcomingStops
                },
                timestamp: new Date().toISOString()
            };

            updates.push(updatePayload);
            this.io.emit('bus_location_update', updatePayload);
        }

        this.io.emit('fleet_live_sync', updates);
    }
}

module.exports = BusSimulator;
