const db = require('./config/database');

async function forceSeed() {
    console.log('Forcing seed of missing admin tables...');
    try {
        await db.run("INSERT OR IGNORE INTO Corporations (name, code, description) VALUES ('Tamil Nadu State Transport Corporation', 'TNSTC', 'Primary state public transport')");
        await db.run("INSERT OR IGNORE INTO Corporations (name, code, description) VALUES ('State Express Transport Corporation', 'SETC', 'Long distance travel services')");

        await db.run("INSERT OR IGNORE INTO Regions (name, code, corporation_id) VALUES ('Salem Region', 'SLM', 1)");
        await db.run("INSERT OR IGNORE INTO Regions (name, code, corporation_id) VALUES ('Coimbatore Region', 'CBE', 1)");
        await db.run("INSERT OR IGNORE INTO Regions (name, code, corporation_id) VALUES ('Madurai Region', 'MDU', 1)");
        await db.run("INSERT OR IGNORE INTO Regions (name, code, corporation_id) VALUES ('Chennai Region', 'CHN', 2)");

        await db.run("INSERT OR IGNORE INTO Depots (name, code, region_id, address) VALUES ('Dharmapuri Depot', 'DPI', 1, 'Dharmapuri HQ')");
        await db.run("INSERT OR IGNORE INTO Depots (name, code, region_id, address) VALUES ('Salem Depot', 'SLMD', 1, 'Salem Main')");
        await db.run("INSERT OR IGNORE INTO Depots (name, code, region_id, address) VALUES ('Chennai Depot', 'CND', 4, 'Koyambedu')");

        await db.run("INSERT OR IGNORE INTO Route_Proposals (source, destination, distance_km, regions_covered, estimated_demand, requested_by) VALUES ('Krishnagiri', 'Tiruvannamalai', 110.5, 'Salem, Villupuram', 'High', 'Dharmapuri Depot Admin')");

        await db.run("INSERT OR IGNORE INTO Alerts (title, message, alert_type, priority, target_scope) VALUES ('Pongal Special Buses', '1000 special buses to be operated from Chennai.', 'Festival Special Service', 'Medium', 'Entire State')");

        await db.run("INSERT OR IGNORE INTO Emergency_Alerts (title, message, severity, affected_areas) VALUES ('Cyclone Warning', 'Heavy rainfall warning. Drive safely and expect delays.', 'Critical', 'Chennai, Cuddalore')");

        await db.run("INSERT OR IGNORE INTO Complaints (category, route_id, bus_id, location, reported_by, severity, status) VALUES ('Delay', 1, 1, 'Thoppur Toll', 'Passenger A', 'Low', 'Open')");
        await db.run("INSERT OR IGNORE INTO Complaints (category, route_id, bus_id, location, reported_by, severity, status) VALUES ('Driver Behaviour', 2, 3, 'Villupuram', 'Passenger B', 'High', 'Escalated')");

        await db.run("INSERT OR IGNORE INTO Incidents (incident_type, bus_id, route_id, location, region_id, severity, description) VALUES ('Breakdown', 2, 1, 'Omalur Bypass', 1, 'Medium', 'Engine overheating, replacement requested.')");

        console.log('Seed completed.');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

forceSeed();

