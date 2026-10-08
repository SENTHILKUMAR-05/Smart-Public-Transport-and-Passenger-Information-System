const db = require('./config/database');

async function seedIncidentsAndComplaints() {
    console.log('Seeding 5 detailed Incidents & 5 detailed Passenger Complaints...');
    try {
        await db.ensureReady();

        // 1. Incidents Table Data (5 records)
        await db.run(`DELETE FROM Incidents`);

        const incidentsData = [
            {
                incident_type: 'Engine Overheating & Coolant Leak',
                bus_id: 1,
                route_id: 1,
                location: 'Thoppur Ghat Road (KM 42)',
                region_id: 1,
                depot_id: 1,
                severity: 'Critical',
                description: 'Engine temperature exceeded 110°C on steep incline. Radiator hose puncture reported by Driver K. Murugan. Rescue bus TN-29-N-1890 dispatched.',
                status: 'Backup Bus Dispatched',
                reported_time: '2026-10-08 09:15:00'
            },
            {
                incident_type: 'Rear Tire Blowout & Rim Damage',
                bus_id: 2,
                route_id: 1,
                location: 'Omalur Bypass Toll Plaza',
                region_id: 1,
                depot_id: 1,
                severity: 'High',
                description: 'Rear left dual tire blowout at 65 km/h. Driver S. Rajan safely steered to highway shoulder. Mobile repair unit en-route with spare rim.',
                status: 'Mechanic En-Route',
                reported_time: '2026-10-08 08:30:00'
            },
            {
                incident_type: 'Brake Air Pressure Drop Alarm',
                bus_id: 3,
                route_id: 2,
                location: 'Morappur Junction Stop',
                region_id: 1,
                depot_id: 1,
                severity: 'High',
                description: 'Pneumatic air pressure gauge dropped below 4.5 bar. Vehicle grounded at Morappur terminal for valve inspection by Depot Garage.',
                status: 'Under Repair',
                reported_time: '2026-10-07 16:45:00'
            },
            {
                incident_type: 'AC Compressor Belt Failure',
                bus_id: 4,
                route_id: 2,
                location: 'Krishnagiri Highway (NH-44)',
                region_id: 1,
                depot_id: 1,
                severity: 'Medium',
                description: 'AC cooling failure reported on SETC Deluxe bus. Auxiliary belt replaced at Krishnagiri workshop. Service resumed.',
                status: 'Resolved',
                reported_time: '2026-10-07 11:20:00'
            },
            {
                incident_type: 'Side Mirror Damage in Traffic',
                bus_id: 1,
                route_id: 3,
                location: 'Dharmapuri Old Bus Stand',
                region_id: 1,
                depot_id: 1,
                severity: 'Low',
                description: 'Left side convex rearview mirror knocked by auto-rickshaw during peak hour congestion. Replaced with spare unit at depot.',
                status: 'Resolved',
                reported_time: '2026-10-06 17:10:00'
            }
        ];

        for (const inc of incidentsData) {
            await db.run(`
                INSERT INTO Incidents (incident_type, bus_id, route_id, location, region_id, depot_id, severity, description, status, reported_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [inc.incident_type, inc.bus_id, inc.route_id, inc.location, inc.region_id, inc.depot_id, inc.severity, inc.description, inc.status, inc.reported_time]);
        }

        // 2. Complaints Table Data (5 records)
        await db.run(`DELETE FROM Complaints`);

        const complaintsData = [
            {
                category: 'Route Violation / Stop Skipping',
                route_id: 1,
                bus_id: 1,
                location: 'Salem Junction Hub',
                reported_by: 'R. Anitha (PNR: TNSTC-BK-1002)',
                severity: 'High',
                status: 'Under Investigation',
                description: 'Express bus bypassed Salem Bay 4 without stopping for reserved passengers. Driver claims bay overcrowding.',
                created_date: '2026-10-08 10:20:00'
            },
            {
                category: 'Fare & Luggage Overcharging',
                route_id: 1,
                bus_id: 2,
                location: 'Dharmapuri Central Bus Stand',
                reported_by: 'M. Suresh (PNR: TNSTC-BK-1005)',
                severity: 'Medium',
                status: 'Pending Review',
                description: 'Conductor collected ₹20 extra for 15kg hand baggage without generating official electronic receipt ticket.',
                created_date: '2026-10-08 09:05:00'
            },
            {
                category: 'Amenities & AC Water Leak',
                route_id: 2,
                bus_id: 3,
                location: 'Krishnagiri Toll Plaza',
                reported_by: 'K. Dinesh (PNR: TNSTC-BK-1010)',
                severity: 'Low',
                status: 'Refund Processed',
                description: 'AC vent overhead dripped water onto seat S12. Conductor re-seated passenger and 20% fare refund issued via app.',
                created_date: '2026-10-07 14:30:00'
            },
            {
                category: 'Safety & Overspeeding',
                route_id: 1,
                bus_id: 1,
                location: 'Thoppur Ghat Downhill Pass',
                reported_by: 'G. Divya (PNR: TNSTC-BK-0982)',
                severity: 'Critical',
                status: 'Warning Issued',
                description: 'Driver exceeded 70 km/h speed governor limit on downhill ghat curves. Telematics speed log verified; driver summoned for safety review.',
                created_date: '2026-10-07 08:45:00'
            },
            {
                category: 'Scheme & Pink Card Refusal',
                route_id: 3,
                bus_id: 4,
                location: 'Pennagaram Town Stop',
                reported_by: 'M. Lakshmi (Pink Card Holder)',
                severity: 'High',
                status: 'Resolved',
                description: 'Conductor initially refused zero-fare pink ticket claiming bus was express type (verified as ordinary town bus). Depot Manager conducted briefing.',
                created_date: '2026-10-05 16:00:00'
            }
        ];

        for (const cmp of complaintsData) {
            await db.run(`
                INSERT INTO Complaints (category, route_id, bus_id, location, reported_by, severity, status, created_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [cmp.category, cmp.route_id, cmp.bus_id, cmp.location, cmp.reported_by, cmp.severity, cmp.status, cmp.created_date]);
        }

        console.log('Successfully seeded 5 Incidents & 5 Complaints!');
    } catch (e) {
        console.error('Error seeding incidents/complaints:', e);
    }
    process.exit(0);
}

seedIncidentsAndComplaints();
