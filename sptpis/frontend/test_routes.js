const busSchedules = require('./src/pages/bus_schedules.json');

const convertAmPmToMinutes = (time12) => {
    if (!time12) return 0;
    const [timePart, modifier] = time12.split(' ');
    let [h, m] = timePart.split(':').map(Number);
    if (modifier === 'PM' && h < 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    return (h * 60) + (m || 0);
};

const cleanSrc = 'dharmapuri';
const cleanDest = 'sathy';
const selectedTimeMins = 0;

const firstLegs = busSchedules.filter(r => r.from.toLowerCase() === cleanSrc && convertAmPmToMinutes(r.departure) >= selectedTimeMins);

let hopMatches = [];
firstLegs.forEach(leg1 => {
    const leg1ArrTime = convertAmPmToMinutes(leg1.arrival);
    const secondLegsAny = busSchedules.filter(r => r.from.toLowerCase() === leg1.to.toLowerCase() && convertAmPmToMinutes(r.departure) >= (leg1ArrTime + 5));
    secondLegsAny.forEach(leg2 => {
        if (leg2.to.toLowerCase() === cleanDest) {
            hopMatches.push({ leg1, leg2 });
        } else {
            const leg2ArrTime = convertAmPmToMinutes(leg2.arrival);
            const thirdLegs = busSchedules.filter(r => r.from.toLowerCase() === leg2.to.toLowerCase() && r.to.toLowerCase() === cleanDest && convertAmPmToMinutes(r.departure) >= (leg2ArrTime + 5));
            if (thirdLegs.length > 0) {
                thirdLegs.sort((x, y) => convertAmPmToMinutes(x.departure) - convertAmPmToMinutes(y.departure));
                hopMatches.push({ leg1, leg2, leg3: thirdLegs[0] });
            }
        }
    });
});
console.log('Routes found: ', hopMatches.length);
if (hopMatches.length > 0) console.log(hopMatches[0].leg1.to, hopMatches[0].leg2.to, hopMatches[0].leg3.to);
