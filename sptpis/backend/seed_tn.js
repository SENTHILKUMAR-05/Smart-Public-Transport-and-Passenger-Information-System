const db = require('./config/database');

const districtsData = [
  { name: 'Ariyalur', code: 'ARL', taluks: ['Ariyalur', 'Sendurai', 'Udayarpalayam', 'Andimadam'] },
  { name: 'Chengalpattu', code: 'CGL', taluks: ['Chengalpattu', 'Tambaram', 'Pallavaram', 'Cheyyur', 'Madurantakam', 'Thiruporur', 'Tirukalukundram'] },
  { name: 'Chennai', code: 'CHN', taluks: ['Alandur', 'Ambattur', 'Aminjikarai', 'Ayanavaram', 'Egmore', 'Guindy', 'Madhavaram', 'Madhuravoyal', 'Mambalam', 'Mylapore', 'Perambur', 'Purasawalkam', 'Sholinganallur', 'Tondiarpet', 'Velachery'] },
  { name: 'Coimbatore', code: 'CBE', taluks: ['Coimbatore North', 'Coimbatore South', 'Pollachi', 'Mettupalayam', 'Annur', 'Kinathukadavu', 'Madukkarai', 'Perur', 'Sulur', 'Valparai'] },
  { name: 'Cuddalore', code: 'CUD', taluks: ['Cuddalore', 'Chidambaram', 'Kattumannarkoil', 'Kurinjipadi', 'Panruti', 'Titakudi', 'Veppur', 'Bhuvanagiri', 'Srimushnam', 'Vridhachalam'] },
  { name: 'Dharmapuri', code: 'DPI', taluks: ['Dharmapuri', 'Palacode', 'Pennagaram', 'Harur', 'Pappireddipatti', 'Karimangalam', 'Nallampalli'] },
  { name: 'Dindigul', code: 'DGL', taluks: ['Dindigul', 'Palani', 'Kodaikanal', 'Natham', 'Nilakkottai', 'Oddanchatram', 'Vedasandur', 'Athoor', 'Gujiliyamparai'] },
  { name: 'Erode', code: 'ERD', taluks: ['Erode', 'Bhavani', 'Gobichettipalayam', 'Sathyamangalam', 'Anthiyur', 'Perundurai', 'Modakurichi', 'Kodumudi', 'Nambiyur', 'Thalavadi'] },
  { name: 'Kallakurichi', code: 'KLK', taluks: ['Kallakurichi', 'Sankarapuram', 'Ulundurpet', 'Chinnasalem', 'Tirukoilur', 'Kalvarayan Hills'] },
  { name: 'Kanchipuram', code: 'KPM', taluks: ['Kanchipuram', 'Sriperumbudur', 'Uthiramerur', 'Walajabad', 'Kundrathur'] },
  { name: 'Kanyakumari', code: 'KKM', taluks: ['Agasteeswaram (Nagercoil)', 'Kalkulam (Thuckalay)', 'Vilavancode (Marthandam)', 'Thovalai', 'Thiruvattar', 'Killiyoor'] },
  { name: 'Karur', code: 'KAR', taluks: ['Karur', 'Kulithalai', 'Aravakurichi', 'Krishnarayapuram', 'Kadavur', 'Manmangalam', 'Pugalur'] },
  { name: 'Krishnagiri', code: 'KRI', taluks: ['Krishnagiri', 'Hosur', 'Denkanikottai', 'Pochampalli', 'Uthangarai', 'Bargur', 'Shoolagiri', 'Anjetty'] },
  { name: 'Madurai', code: 'MDU', taluks: ['Madurai North', 'Madurai South', 'Melur', 'Thirumangalam', 'Tiruparankundram', 'Usilampatti', 'Vadipatti', 'Peraiyur', 'Madurai East', 'Madurai West', 'Kalligudi'] },
  { name: 'Mayiladuthurai', code: 'MYD', taluks: ['Mayiladuthurai', 'Sirkali', 'Tharangambadi', 'Kuthalam'] },
  { name: 'Nagapattinam', code: 'NGP', taluks: ['Nagapattinam', 'Kilvelur', 'Thirukuvalai', 'Vedaranyam'] },
  { name: 'Namakkal', code: 'NMK', taluks: ['Namakkal', 'Rasipuram', 'Tiruchengode', 'Paramathi Velur', 'Kolli Hills', 'Sendamangalam', 'Kumarapalayam', 'Mohanur'] },
  { name: 'Nilgiris', code: 'NIL', taluks: ['Udhagamandalam', 'Coonoor', 'Gudalur', 'Kotagiri', 'Kundah', 'Pandalur'] },
  { name: 'Perambalur', code: 'PRM', taluks: ['Perambalur', 'Kunnam', 'Alathur', 'Veppanthattai'] },
  { name: 'Pudukkottai', code: 'PDK', taluks: ['Pudukkottai', 'Alangudi', 'Aranthangi', 'Avadaiyarkoil', 'Gandarvakottai', 'Iluppur', 'Karambakkudi', 'Kulathur', 'Manamelkudi', 'Ponnamaravathi', 'Thirumayam', 'Viralimalai'] },
  { name: 'Ramanathapuram', code: 'RMD', taluks: ['Ramanathapuram', 'Rameswaram', 'Paramakudi', 'Kadaladi', 'Kamuthi', 'Kilakarai', 'Mudukulathur', 'R.S. Mangalam', 'Tiruvadanai'] },
  { name: 'Ranipet', code: 'RPT', taluks: ['Ranipet', 'Arakkonam', 'Arcot', 'Walajah', 'Nemili', 'Sholinghur'] },
  { name: 'Salem', code: 'SLM', taluks: ['Salem', 'Omalur', 'Attur', 'Mettur', 'Edappadi', 'Gangavalli', 'Kadaiyampatti', 'Pethanaickenpalayam', 'Salem South', 'Salem West', 'Sankari', 'Valapady', 'Yercaud'] },
  { name: 'Sivaganga', code: 'SVG', taluks: ['Sivaganga', 'Karaikudi', 'Devakottai', 'Ilayangudi', 'Kalaiyarkoil', 'Manamadurai', 'Singampunari', 'Tirupathur', 'Tirupuvanam'] },
  { name: 'Tenkasi', code: 'TEN', taluks: ['Tenkasi', 'Shenkottai', 'Sankarankoil', 'Alangulam', 'Kadayanallur', 'Kuruvikulam', 'Thiruvengadam', 'V.K. Pudur'] },
  { name: 'Thanjavur', code: 'TNJ', taluks: ['Thanjavur', 'Kumbakonam', 'Pattukkottai', 'Orathanadu', 'Papanasam', 'Peravurani', 'Thiruvaiyaru', 'Thiruvidaimarudur', 'Boothalur'] },
  { name: 'Theni', code: 'THN', taluks: ['Theni', 'Periyakulam', 'Bodinayakanur', 'Andipatti', 'Uthamapalayam'] },
  { name: 'Thoothukudi', code: 'TUT', taluks: ['Thoothukudi', 'Tiruchendur', 'Kovilpatti', 'Eral', 'Ettayapuram', 'Kayathar', 'Ottapidaram', 'Sathankulam', 'Srivaikuntam', 'Vilathikulam'] },
  { name: 'Tiruchirappalli', code: 'TRY', taluks: ['Trichy (West)', 'Trichy (East)', 'Srirangam', 'Lalgudi', 'Manapparai', 'Musiri', 'Thottiyam', 'Thuraiyur', 'Manachanallur', 'Marungapuri'] },
  { name: 'Tirunelveli', code: 'TNV', taluks: ['Tirunelveli', 'Palayamkottai', 'Ambasamudram', 'Cheranmahadevi', 'Manur', 'Nanguneri', 'Radhapuram', 'Thisayanvilai'] },
  { name: 'Tirupathur', code: 'TPT', taluks: ['Tirupathur', 'Vaniyambadi', 'Ambur', 'Natrampalli'] },
  { name: 'Tiruppur', code: 'TPR', taluks: ['Tiruppur North', 'Tiruppur South', 'Dharapuram', 'Udumalaipettai', 'Avinashi', 'Kangeyam', 'Madathukulam', 'Palladam', 'Uthukuli'] },
  { name: 'Tiruvallur', code: 'TVR', taluks: ['Tiruvallur', 'Ponneri', 'Poonamallee', 'Avadi', 'Gummidipoondi', 'Pallipattu', 'R.K. Pet', 'Tiruttani', 'Uthukkottai'] },
  { name: 'Tiruvannamalai', code: 'TVM', taluks: ['Tiruvannamalai', 'Arani', 'Cheyyar', 'Chengam', 'Chetpet', 'Kalasapakkam', 'Kilpennathur', 'Polur', 'Thandarampet', 'Vandavasi', 'Vembakkam', 'Jamunamarathur'] },
  { name: 'Tiruvarur', code: 'TVU', taluks: ['Tiruvarur', 'Mannargudi', 'Nannilam', 'Kodavasal', 'Needamangalam', 'Thiruthuraipoondi', 'Valangaiman', 'Koothanallur'] },
  { name: 'Vellore', code: 'VLR', taluks: ['Vellore', 'Gudiyatham', 'Katpadi', 'Anaicut', 'K.V. Kuppam', 'Pernambut'] },
  { name: 'Viluppuram', code: 'VPM', taluks: ['Viluppuram', 'Tindivanam', 'Gingee', 'Kandachipuram', 'Marakkanam', 'Melmalaiyanur', 'Thiruvennainallur', 'Vanur', 'Vikravandi'] },
  { name: 'Virudhunagar', code: 'VNR', taluks: ['Virudhunagar', 'Sivakasi', 'Aruppukkottai', 'Kariapatti', 'Rajapalayam', 'Sattur', 'Srivilliputhur', 'Tiruchuli', 'Vembakottai', 'Watrap'] }
];

async function seedDistrictsAndTaluks() {
    console.log('Seeding ALL 38 TN Districts as Regions and all Taluks as Depots...');
    try {
        await db.run("PRAGMA foreign_keys = OFF");
        
        // Clear existing regions and depots to start fresh
        await db.run("DELETE FROM Depots");
        await db.run("DELETE FROM Regions");
        
        // Reset auto increment counters
        await db.run("DELETE FROM sqlite_sequence WHERE name='Regions'");
        await db.run("DELETE FROM sqlite_sequence WHERE name='Depots'");

        // Get TNSTC corporation ID (assuming it's 1 from previous seed)
        const tnstc = await db.get("SELECT corporation_id FROM Corporations WHERE code = 'TNSTC'");
        const corpId = tnstc ? tnstc.corporation_id : 1;

        for (const dist of districtsData) {
            // Insert Region (District)
            const result = await db.run(
                "INSERT INTO Regions (name, code, corporation_id) VALUES (?, ?, ?)",
                [dist.name + ' District', dist.code, corpId]
            );
            const regionId = result.lastID;

            // Insert Depots (Taluks)
            for (let i = 0; i < dist.taluks.length; i++) {
                const taluk = dist.taluks[i];
                const talukCode = `${dist.code}-T${i+1}`;
                await db.run(
                    "INSERT INTO Depots (name, code, region_id, address) VALUES (?, ?, ?, ?)",
                    [taluk + ' Taluk', talukCode, regionId, taluk + ' Main Road, ' + dist.name]
                );
            }
        }
        
        await db.run("PRAGMA foreign_keys = ON");
        console.log('Successfully seeded 38 Districts and 310+ Taluks!');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

seedDistrictsAndTaluks();
