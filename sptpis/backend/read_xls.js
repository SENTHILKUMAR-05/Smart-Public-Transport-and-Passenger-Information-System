const xlsx = require('xlsx');
const fs = require('fs');
try {
    const workbook = xlsx.readFile('../../dataset/DTPV names/village_eng.xls');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    fs.writeFileSync('result.json', JSON.stringify(data.slice(0, 10), null, 2));
} catch (e) {
    fs.writeFileSync('result.error', e.toString());
}
