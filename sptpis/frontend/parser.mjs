import fs from 'fs';

const raw = fs.readFileSync('../../dataset/DTPV names/village_eng.xls', 'utf8');
const regex = /<td align="left">([^<]+)<\/td>/g;
const matches = [];
let match;
while ((match = regex.exec(raw)) !== null) {
    matches.push(match[1].trim());
}

const uniqueNames = Array.from(new Set(matches)).sort();
fs.writeFileSync('src/pages/village_names.json', JSON.stringify(uniqueNames));
console.log('Done! Extracted ' + uniqueNames.length + ' villages.');
