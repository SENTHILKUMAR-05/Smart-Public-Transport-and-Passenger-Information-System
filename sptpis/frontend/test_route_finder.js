/**
 * test_route_finder.js
 * Comprehensive automated verification for generalized multi-leg route search.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findMultiLegJourneys, convertAmPmToMinutes } from './src/utils/routeFinder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schedulesPath = path.join(__dirname, 'src/pages/bus_schedules.json');
const allSchedules = JSON.parse(fs.readFileSync(schedulesPath, 'utf8'));

console.log('====================================================');
console.log(`Loaded ${allSchedules.length} schedules from bus_schedules.json`);
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`✅ [PASS] ${message}`);
        passedTests++;
    } else {
        console.error(`❌ [FAIL] ${message}`);
    }
}

// TEST 1: Direct route (1 leg / 0 transfers)
console.log('--- TEST 1: Direct Route (Dharmapuri -> Salem) ---');
const directResults = findMultiLegJourneys(allSchedules, 'Dharmapuri', 'Salem', 0);
assert(directResults.length > 0, `Found ${directResults.length} direct journeys`);
assert(directResults[0].transfers === 0, `Direct route has 0 transfers (got ${directResults[0]?.transfers})`);
assert(directResults[0].legs.length === 1, `Direct route has 1 leg (got ${directResults[0]?.legs.length})`);
assert(directResults[0].type === 'OPTIMAL', `First journey marked as OPTIMAL`);

// TEST 2: 2-leg route (1 transfer)
console.log('\n--- TEST 2: 2-Leg Route (Dharmapuri -> Erode) ---');
const twoLegResults = findMultiLegJourneys(allSchedules, 'Dharmapuri', 'Erode', convertAmPmToMinutes('06:00 AM'));
assert(twoLegResults.length > 0, `Found ${twoLegResults.length} 2-leg connecting journeys`);
assert(twoLegResults[0].transfers === 1, `Connecting route has 1 transfer (got ${twoLegResults[0]?.transfers})`);
assert(twoLegResults[0].legs.length === 2, `Connecting route has 2 legs (got ${twoLegResults[0]?.legs.length})`);
assert(twoLegResults[0].hopAt.toLowerCase().includes('salem'), `Hop at Salem (got ${twoLegResults[0]?.hopAt})`);
console.log(`   Sample: Depart ${twoLegResults[0].legs[0].departure} (${twoLegResults[0].legs[0].from}) -> Transfer at ${twoLegResults[0].hopAt} -> Arrive ${twoLegResults[0].legs[1].arrival} (${twoLegResults[0].legs[1].to}) | Fare: ${twoLegResults[0].fare}`);

// TEST 3: 3-leg route (2 transfers)
console.log('\n--- TEST 3: 3-Leg Route (Dharmapuri -> Sathy) ---');
const threeLegResults = findMultiLegJourneys(allSchedules, 'Dharmapuri', 'Sathy', convertAmPmToMinutes('06:00 AM'));
assert(threeLegResults.length > 0, `Found ${threeLegResults.length} 3-leg connecting journeys`);
assert(threeLegResults[0].transfers === 2, `Connecting route has 2 transfers (got ${threeLegResults[0]?.transfers})`);
assert(threeLegResults[0].legs.length === 3, `Connecting route has 3 legs (got ${threeLegResults[0]?.legs.length})`);
assert(threeLegResults[0].hopAt.toLowerCase().includes('salem') && threeLegResults[0].hopAt.toLowerCase().includes('erode'), `Hop through Salem and Erode (got ${threeLegResults[0]?.hopAt})`);
console.log(`   Sample: ${threeLegResults[0].legs.map(l => `${l.from} -> ${l.to} (${l.departure}-${l.arrival})`).join(' | ')} | Total Fare: ${threeLegResults[0].fare}`);

// TEST 4: 4-leg route (3 transfers)
console.log('\n--- TEST 4: 4-Leg Route (Dharmapuri -> Coimbatore) ---');
const fourLegResults = findMultiLegJourneys(allSchedules, 'Dharmapuri', 'Coimbatore', convertAmPmToMinutes('06:00 AM'));
assert(fourLegResults.length > 0, `Found ${fourLegResults.length} 4-leg connecting journeys`);
assert(fourLegResults[0].transfers === 3, `Connecting route has 3 transfers (got ${fourLegResults[0]?.transfers})`);
assert(fourLegResults[0].legs.length === 4, `Connecting route has 4 legs (got ${fourLegResults[0]?.legs.length})`);
console.log(`   Hops: ${fourLegResults[0].hopAt}`);
console.log(`   Route details:`);
fourLegResults[0].legs.forEach((l, i) => console.log(`     Leg ${i + 1}: ${l.from} -> ${l.to} [${l.bus}] (${l.departure} - ${l.arrival}) - ${l.fare}`));
console.log(`   Total Duration: ${fourLegResults[0].duration} | Total Fare: ${fourLegResults[0].fare}`);

// TEST 5: 5-leg route (4 transfers)
console.log('\n--- TEST 5: 5-Leg Route (Harur -> Coimbatore) ---');
const fiveLegResults = findMultiLegJourneys(allSchedules, 'Harur', 'Coimbatore', convertAmPmToMinutes('04:00 AM'));
assert(fiveLegResults.length > 0, `Found ${fiveLegResults.length} 5-leg connecting journeys`);
assert(fiveLegResults[0].transfers === 4, `Connecting route has 4 transfers (got ${fiveLegResults[0]?.transfers})`);
assert(fiveLegResults[0].legs.length === 5, `Connecting route has 5 legs (got ${fiveLegResults[0]?.legs.length})`);
console.log(`   Hops: ${fiveLegResults[0].hopAt}`);
console.log(`   Route details:`);
fiveLegResults[0].legs.forEach((l, i) => console.log(`     Leg ${i + 1}: ${l.from} -> ${l.to} [${l.bus}] (${l.departure} - ${l.arrival}) - ${l.fare}`));
console.log(`   Total Duration: ${fiveLegResults[0].duration} | Total Fare: ${fiveLegResults[0].fare}`);

// TEST 6: 6-leg route (5 transfers)
console.log('\n--- TEST 6: 6-Leg Route (Harur -> Madurai) ---');
const sixLegResults = findMultiLegJourneys(allSchedules, 'Harur', 'Madurai', convertAmPmToMinutes('04:00 AM'));
assert(sixLegResults.length > 0, `Found ${sixLegResults.length} 6-leg connecting journeys`);
assert(sixLegResults[0].transfers === 5, `Connecting route has 5 transfers (got ${sixLegResults[0]?.transfers})`);
assert(sixLegResults[0].legs.length === 6, `Connecting route has 6 legs (got ${sixLegResults[0]?.legs.length})`);
console.log(`   Hops: ${sixLegResults[0].hopAt}`);
console.log(`   Route details:`);
sixLegResults[0].legs.forEach((l, i) => console.log(`     Leg ${i + 1}: ${l.from} -> ${l.to} [${l.bus}] (${l.departure} - ${l.arrival}) - ${l.fare}`));
console.log(`   Total Duration: ${sixLegResults[0].duration} | Total Fare: ${sixLegResults[0].fare}`);

// TEST 7: Reverse Multi-Leg Route (Coimbatore -> Dharmapuri: 4 legs)
console.log('\n--- TEST 7: Reverse Multi-Leg (Coimbatore -> Dharmapuri) ---');
const reverseFourLeg = findMultiLegJourneys(allSchedules, 'Coimbatore', 'Dharmapuri', convertAmPmToMinutes('06:00 AM'));
assert(reverseFourLeg.length > 0, `Found ${reverseFourLeg.length} reverse journeys from Coimbatore to Dharmapuri`);
assert(reverseFourLeg[0].transfers === 3, `Reverse journey has 3 transfers (got ${reverseFourLeg[0]?.transfers})`);
assert(reverseFourLeg[0].legs.length === 4, `Reverse journey has 4 legs (got ${reverseFourLeg[0]?.legs.length})`);

// TEST 8: Cycle Prevention Verification
console.log('\n--- TEST 8: Cycle Prevention Verification ---');
let hasAnyCycle = false;
fourLegResults.forEach(journey => {
    const visited = new Set();
    journey.legs.forEach(leg => {
        const fromCity = leg.from.toLowerCase().replace(/ bus stand/i, '').trim();
        if (visited.has(fromCity)) hasAnyCycle = true;
        visited.add(fromCity);
    });
});
assert(!hasAnyCycle, 'No cycles detected in any multi-leg journey path');

// TEST 9: Minimum Transfer Buffer (>= 5 minutes between arrival and departure)
console.log('\n--- TEST 9: Transfer Buffer Timing Verification ---');
let bufferViolations = 0;
fourLegResults.forEach(journey => {
    for (let i = 0; i < journey.legs.length - 1; i++) {
        const arr = convertAmPmToMinutes(journey.legs[i].arrival);
        const nextDep = convertAmPmToMinutes(journey.legs[i + 1].departure);
        if (nextDep < arr + 5) {
            bufferViolations++;
        }
    }
});
assert(bufferViolations === 0, `All transfers strictly observe minimum 5-minute connection buffer (violations: ${bufferViolations})`);

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('====================================================');

if (passedTests === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
