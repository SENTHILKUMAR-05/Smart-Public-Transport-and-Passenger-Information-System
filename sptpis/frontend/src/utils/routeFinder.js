/**
 * routeFinder.js
 * 
 * Generalized multi-leg graph traversal and route-finding engine for SPTPIS.
 * Uses Breadth-First Search (BFS) with cycle detection, transfer buffer timing,
 * and layover constraints to find valid journeys of arbitrary leg depth (1 to N legs)
 * across connected districts and bus stands.
 */

export const convertAmPmToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const clean = String(timeStr).trim();
    if (!/am|pm/i.test(clean)) {
        const [h, m] = clean.split(':').map(Number);
        return ((h || 0) * 60) + (m || 0);
    }
    const parts = clean.split(/\s+/);
    const timePart = parts[0] || '0:0';
    const modifier = (parts[1] || '').toUpperCase();
    let [h, m] = timePart.split(':').map(Number);
    h = h || 0;
    m = m || 0;
    if (modifier === 'PM' && h < 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    return (h * 60) + m;
};

export const convert24hToMinutes = (time24) => {
    if (!time24) return 0;
    const [h, m] = String(time24).split(':').map(Number);
    return ((h || 0) * 60) + (m || 0);
};

export const normalizeCity = (city) => {
    if (!city) return '';
    let str = String(city)
        .replace(/\s+Bus\s+Stand$/i, '')
        .replace(/\s+New\s+Bus\s+Stand$/i, '')
        .replace(/\s+Central\s+Bus\s+Stand$/i, '')
        .trim()
        .toLowerCase();

    // Known TNSTC regional abbreviations and synonyms
    if (str === 'sathyamangalam') str = 'sathy';
    if (str === 'trichy') str = 'tiruchirappalli';
    if (str === 'tiruchirappalli') str = 'trichy';
    return str;
};

export const formatCityName = (city) => {
    if (!city) return '';
    const clean = String(city).replace(/\s+Bus\s+Stand$/i, '').trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/**
 * Calculates elapsed travel time between departure and arrival,
 * safely handling crossings over midnight.
 */
export const calculateElapsedMinutes = (departureStr, arrivalStr) => {
    const dep = convertAmPmToMinutes(departureStr);
    const arr = convertAmPmToMinutes(arrivalStr);
    return arr >= dep ? arr - dep : (arr + 24 * 60) - dep;
};

/**
 * Formats minutes into a readable 'Xh Ym' string.
 */
export const formatDuration = (totalMinutes) => {
    const mins = Math.max(0, totalMinutes);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
};

/**
 * Finds arbitrary multi-leg journeys connecting source to destination.
 * 
 * @param {Array} schedules - Full active bus schedules dataset
 * @param {string} rawSource - Boarding point entered by user
 * @param {string} rawDestination - Dropping point entered by user
 * @param {number} selectedTimeMins - Earliest departure time in minutes from midnight
 * @param {Object} options - Search configuration
 * @returns {Array} Array of formatted journey objects (Direct and Multi-Leg)
 */
export function findMultiLegJourneys(
    schedules = [],
    rawSource = '',
    rawDestination = '',
    selectedTimeMins = 0,
    options = {}
) {
    const {
        minTransferBufferMins = 5,
        maxWaitTimeMins = 360,     // Max 6 hours layover between legs
        maxLegs = 8,              // Max hops across districts
        maxResults = 40,
        maxDeparturesPerEdge = 4   // Take earliest departing buses per connection for branch diversity
    } = options;

    const cleanSrc = normalizeCity(rawSource);
    const cleanDest = normalizeCity(rawDestination);

    if (!cleanSrc || !cleanDest || cleanSrc === cleanDest) {
        return [];
    }

    // Filter active schedules
    const activeSchedules = schedules.filter(s => {
        if (!s || !s.from || !s.to) return false;
        const status = (s.status || 'Active').toLowerCase();
        return status === 'active';
    });

    // 1. Direct Routes Search
    const directRoutes = activeSchedules.filter(route =>
        normalizeCity(route.from) === cleanSrc &&
        normalizeCity(route.to) === cleanDest &&
        convertAmPmToMinutes(route.departure) >= selectedTimeMins
    );

    directRoutes.sort((a, b) => convertAmPmToMinutes(a.departure) - convertAmPmToMinutes(b.departure));

    // 2. Build Adjacency Graph by normalized source city
    const schedulesByOrigin = new Map();
    for (const s of activeSchedules) {
        const origin = normalizeCity(s.from);
        if (!schedulesByOrigin.has(origin)) {
            schedulesByOrigin.set(origin, []);
        }
        schedulesByOrigin.get(origin).push(s);
    }

    // Pre-sort all edge schedules by departure time for fast binary/linear lookup
    for (const [, list] of schedulesByOrigin.entries()) {
        list.sort((a, b) => convertAmPmToMinutes(a.departure) - convertAmPmToMinutes(b.departure));
    }

    // 3. Multi-Leg BFS Graph Traversal
    const validConnectingPaths = [];
    const queue = [];

    // Seed queue with first legs leaving source on or after selectedTimeMins
    const firstLegCandidates = (schedulesByOrigin.get(cleanSrc) || []).filter(
        s => convertAmPmToMinutes(s.departure) >= selectedTimeMins
    );

    for (const leg1 of firstLegCandidates) {
        const nextCity = normalizeCity(leg1.to);
        // If it's a direct route, it's already captured in directRoutes
        if (nextCity === cleanDest) continue;

        queue.push({
            path: [leg1],
            currentCity: nextCity,
            arrTimeMins: convertAmPmToMinutes(leg1.arrival),
            visited: new Set([cleanSrc, nextCity])
        });
    }

    // Process queue to discover 2, 3, 4, ... N leg journeys
    while (queue.length > 0 && validConnectingPaths.length < maxResults * 3) {
        const current = queue.shift();
        const { path, currentCity, arrTimeMins, visited } = current;

        // Check outgoing edges from current city
        const outgoing = schedulesByOrigin.get(currentCity) || [];

        // Group outgoing by target city to pick earliest candidate departures
        const byTarget = new Map();
        for (const nextLeg of outgoing) {
            const targetCity = normalizeCity(nextLeg.to);
            if (visited.has(targetCity)) continue; // Cycle prevention

            const legDepMins = convertAmPmToMinutes(nextLeg.departure);
            const waitMins = legDepMins - arrTimeMins;

            // Transfer timing validation
            if (waitMins < minTransferBufferMins) continue;
            if (waitMins > maxWaitTimeMins) continue;

            if (!byTarget.has(targetCity)) {
                byTarget.set(targetCity, []);
            }
            if (byTarget.get(targetCity).length < maxDeparturesPerEdge) {
                byTarget.get(targetCity).push(nextLeg);
            }
        }

        // Expand search into target cities
        for (const [targetCity, candidateLegs] of byTarget.entries()) {
            for (const nextLeg of candidateLegs) {
                const newPath = [...path, nextLeg];

                if (targetCity === cleanDest) {
                    // Reached destination!
                    validConnectingPaths.push(newPath);
                } else if (newPath.length < maxLegs) {
                    // Continue deeper traversal
                    const newVisited = new Set(visited);
                    newVisited.add(targetCity);
                    queue.push({
                        path: newPath,
                        currentCity: targetCity,
                        arrTimeMins: convertAmPmToMinutes(nextLeg.arrival),
                        visited: newVisited
                    });
                }
            }
        }
    }

    // 4. Score and Rank Connecting Journeys
    // Rank by: (fewest transfers, then shortest total duration, then earliest departure)
    validConnectingPaths.sort((pathA, pathB) => {
        // 1. Prefer fewer transfers if there's a big gap
        if (pathA.length !== pathB.length) {
            return pathA.length - pathB.length;
        }
        // 2. Departure time of first leg
        const depA = convertAmPmToMinutes(pathA[0].departure);
        const depB = convertAmPmToMinutes(pathB[0].departure);
        if (depA !== depB) {
            return depA - depB;
        }
        // 3. Arrival time of final leg
        const arrA = convertAmPmToMinutes(pathA[pathA.length - 1].arrival);
        const arrB = convertAmPmToMinutes(pathB[pathB.length - 1].arrival);
        return arrA - arrB;
    });

    // 5. Assemble formatted journeys
    const formattedJourneys = [];

    // Helper to format path into standard journey object
    const formatPathToJourney = (path, isDirect, index) => {
        const firstLeg = path[0];
        const lastLeg = path[path.length - 1];
        const transfers = path.length - 1;

        // Calculate total duration across all legs
        const totalDurationMins = calculateElapsedMinutes(firstLeg.departure, lastLeg.arrival);
        const durationStr = formatDuration(totalDurationMins);

        // Sum total fare
        const totalFare = path.reduce((sum, leg) => {
            const num = parseInt(String(leg.fare || '55').replace(/[^0-9]/g, ''), 10);
            return sum + (isNaN(num) ? 55 : num);
        }, 0);

        // Hop stopovers string
        const hopCities = path.slice(0, -1).map(leg => formatCityName(leg.to));
        const hopAt = hopCities.join(', ');

        // Type and Label
        let type = 'CONNECTING';
        let label = transfers === 1 ? 'Alternative Hop (1 Transfer)' : `Alternative Hop (${transfers} Transfers)`;

        if (isDirect) {
            type = index === 0 ? 'OPTIMAL' : 'DIRECT';
            label = index === 0 ? 'AI Recommended (Fastest)' : 'Standard Route';
        } else if (index === 0) {
            type = 'OPTIMAL';
            label = transfers === 1
                ? 'AI Recommended Connecting Route (1 Transfer)'
                : `AI Recommended Connecting Route (${transfers} Transfers)`;
        }

        const uniformLegs = path.map((leg, i) => ({
            from: i === 0 ? rawSource : (formatCityName(leg.from) + ' Bus Stand'),
            to: i === path.length - 1 ? rawDestination : (formatCityName(leg.to) + ' Bus Stand'),
            departure: leg.departure,
            arrival: leg.arrival,
            bus: leg.bus,
            service_type: leg.service_type || 'TNSTC Bus',
            fare: leg.fare || '₹55'
        }));

        return {
            id: 'journey_' + Math.random().toString(36).substr(2, 9),
            type,
            label,
            duration: durationStr,
            transfers,
            hopAt,
            legs: uniformLegs,
            fare: isDirect ? (firstLeg.fare || '₹55') : `₹${totalFare} (Total)`,
            crowdingScore: Math.floor(Math.random() * 60) + 20,
            crowdingMessage: index === 0 ? 'Seats Available' : 'Moderate',
            status: isDirect ? 'On Time' : 'Connecting',
            statusColor: isDirect ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'
        };
    };

    if (directRoutes.length > 0) {
        // If direct routes exist, output direct routes
        directRoutes.slice(0, maxResults).forEach((route, idx) => {
            formattedJourneys.push(formatPathToJourney([route], true, idx));
        });
    } else {
        // Output connecting multi-leg routes
        validConnectingPaths.slice(0, maxResults).forEach((path, idx) => {
            formattedJourneys.push(formatPathToJourney(path, false, idx));
        });
    }

    return formattedJourneys;
}

export default findMultiLegJourneys;
