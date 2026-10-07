import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import RouteMap from '../components/Map/RouteMap';
import QrTicketModal from '../components/common/QrTicketModal';
import villageNames from './village_names.json';
import busSchedules from './bus_schedules.json';
import {
  Bus, MapPin, Calendar, Clock, Navigation, Search,
  Map, Activity, AlertTriangle, ArrowRight, ArrowLeft, X, Heart, ShieldAlert, WifiOff,
  CheckCircle, CreditCard, LayoutGrid, Armchair, Camera, QrCode
} from 'lucide-react';

const PassengerDashboard = () => {
  const { liveBuses, isConnected } = useSocket();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('home'); // home, search, journey, track, complaint

  // Search state
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [showSourceOpts, setShowSourceOpts] = useState(false);
  const [showDestOpts, setShowDestOpts] = useState(false);

  const TN_DISTRICTS_DATA = [
    { name: 'Ariyalur', taluks: ['Ariyalur', 'Sendurai', 'Udayarpalayam', 'Andimadam'] },
    { name: 'Chengalpattu', taluks: ['Chengalpattu', 'Tambaram', 'Pallavaram', 'Cheyyur', 'Madurantakam', 'Thiruporur', 'Tirukalukundram'] },
    { name: 'Chennai', taluks: ['Alandur', 'Ambattur', 'Aminjikarai', 'Ayanavaram', 'Egmore', 'Guindy', 'Madhavaram', 'Madhuravoyal', 'Mambalam', 'Mylapore', 'Perambur', 'Purasawalkam', 'Sholinganallur', 'Tondiarpet', 'Velachery'] },
    { name: 'Coimbatore', taluks: ['Coimbatore North', 'Coimbatore South', 'Pollachi', 'Mettupalayam', 'Annur', 'Kinathukadavu', 'Madukkarai', 'Perur', 'Sulur', 'Valparai'] },
    { name: 'Cuddalore', taluks: ['Cuddalore', 'Chidambaram', 'Kattumannarkoil', 'Kurinjipadi', 'Panruti', 'Titakudi', 'Veppur', 'Bhuvanagiri', 'Srimushnam', 'Vridhachalam'] },
    { name: 'Dharmapuri', taluks: ['Dharmapuri', 'Palacode', 'Pennagaram', 'Harur', 'Pappireddipatti', 'Karimangalam', 'Nallampalli', 'Laligam'] },
    { name: 'Dindigul', taluks: ['Dindigul', 'Palani', 'Kodaikanal', 'Natham', 'Nilakkottai', 'Oddanchatram', 'Vedasandur', 'Athoor', 'Gujiliyamparai'] },
    { name: 'Erode', taluks: ['Erode', 'Bhavani', 'Gobichettipalayam', 'Sathyamangalam', 'Anthiyur', 'Perundurai', 'Modakurichi', 'Kodumudi', 'Nambiyur', 'Thalavadi'] },
    { name: 'Kallakurichi', taluks: ['Kallakurichi', 'Sankarapuram', 'Ulundurpet', 'Chinnasalem', 'Tirukoilur', 'Kalvarayan Hills'] },
    { name: 'Kanchipuram', taluks: ['Kanchipuram', 'Sriperumbudur', 'Uthiramerur', 'Walajabad', 'Kundrathur'] },
    { name: 'Kanyakumari', taluks: ['Agasteeswaram', 'Nagercoil', 'Kalkulam', 'Thuckalay', 'Vilavancode', 'Marthandam', 'Thovalai', 'Thiruvattar', 'Killiyoor'] },
    { name: 'Karur', taluks: ['Karur', 'Kulithalai', 'Aravakurichi', 'Krishnarayapuram', 'Kadavur', 'Manmangalam', 'Pugalur'] },
    { name: 'Krishnagiri', taluks: ['Krishnagiri', 'Hosur', 'Denkanikottai', 'Pochampalli', 'Uthangarai', 'Bargur', 'Shoolagiri', 'Anjetty'] },
    { name: 'Madurai', taluks: ['Madurai North', 'Madurai South', 'Melur', 'Thirumangalam', 'Tiruparankundram', 'Usilampatti', 'Vadipatti', 'Peraiyur', 'Madurai East', 'Madurai West', 'Kalligudi'] },
    { name: 'Mayiladuthurai', taluks: ['Mayiladuthurai', 'Sirkali', 'Tharangambadi', 'Kuthalam'] },
    { name: 'Nagapattinam', taluks: ['Nagapattinam', 'Kilvelur', 'Thirukuvalai', 'Vedaranyam'] },
    { name: 'Namakkal', taluks: ['Namakkal', 'Rasipuram', 'Tiruchengode', 'Paramathi Velur', 'Kolli Hills', 'Sendamangalam', 'Kumarapalayam', 'Mohanur'] },
    { name: 'Nilgiris', taluks: ['Udhagamandalam', 'Ooty', 'Coonoor', 'Gudalur', 'Kotagiri', 'Kundah', 'Pandalur'] },
    { name: 'Perambalur', taluks: ['Perambalur', 'Kunnam', 'Alathur', 'Veppanthattai'] },
    { name: 'Pudukkottai', taluks: ['Pudukkottai', 'Alangudi', 'Aranthangi', 'Avadaiyarkoil', 'Gandarvakottai', 'Iluppur', 'Karambakkudi', 'Kulathur', 'Manamelkudi', 'Ponnamaravathi', 'Thirumayam', 'Viralimalai'] },
    { name: 'Ramanathapuram', taluks: ['Ramanathapuram', 'Rameswaram', 'Paramakudi', 'Kadaladi', 'Kamuthi', 'Kilakarai', 'Mudukulathur', 'R.S. Mangalam', 'Tiruvadanai'] },
    { name: 'Ranipet', taluks: ['Ranipet', 'Arakkonam', 'Arcot', 'Walajah', 'Nemili', 'Sholinghur'] },
    { name: 'Salem', taluks: ['Salem', 'Omalur', 'Attur', 'Mettur', 'Edappadi', 'Gangavalli', 'Kadaiyampatti', 'Pethanaickenpalayam', 'Salem South', 'Salem West', 'Sankari', 'Valapady', 'Yercaud'] },
    { name: 'Sivaganga', taluks: ['Sivaganga', 'Karaikudi', 'Devakottai', 'Ilayangudi', 'Kalaiyarkoil', 'Manamadurai', 'Singampunari', 'Tirupathur', 'Tirupuvanam'] },
    { name: 'Tenkasi', taluks: ['Tenkasi', 'Shenkottai', 'Sankarankoil', 'Alangulam', 'Kadayanallur', 'Kuruvikulam', 'Thiruvengadam', 'V.K. Pudur'] },
    { name: 'Thanjavur', taluks: ['Thanjavur', 'Kumbakonam', 'Pattukkottai', 'Orathanadu', 'Papanasam', 'Peravurani', 'Thiruvaiyaru', 'Thiruvidaimarudur', 'Boothalur'] },
    { name: 'Theni', taluks: ['Theni', 'Periyakulam', 'Bodinayakanur', 'Andipatti', 'Uthamapalayam'] },
    { name: 'Thoothukudi', taluks: ['Thoothukudi', 'Tiruchendur', 'Kovilpatti', 'Eral', 'Ettayapuram', 'Kayathar', 'Ottapidaram', 'Sathankulam', 'Srivaikuntam', 'Vilathikulam'] },
    { name: 'Tiruchirappalli', taluks: ['Trichy', 'Trichy (West)', 'Trichy (East)', 'Srirangam', 'Lalgudi', 'Manapparai', 'Musiri', 'Thottiyam', 'Thuraiyur', 'Manachanallur', 'Marungapuri'] },
    { name: 'Tirunelveli', taluks: ['Tirunelveli', 'Palayamkottai', 'Ambasamudram', 'Cheranmahadevi', 'Manur', 'Nanguneri', 'Radhapuram', 'Thisayanvilai'] },
    { name: 'Tirupathur', taluks: ['Tirupathur', 'Vaniyambadi', 'Ambur', 'Natrampalli'] },
    { name: 'Tiruppur', taluks: ['Tiruppur', 'Tiruppur North', 'Tiruppur South', 'Dharapuram', 'Udumalaipettai', 'Avinashi', 'Kangeyam', 'Madathukulam', 'Palladam', 'Uthukuli'] },
    { name: 'Tiruvallur', taluks: ['Tiruvallur', 'Ponneri', 'Poonamallee', 'Avadi', 'Gummidipoondi', 'Pallipattu', 'R.K. Pet', 'Tiruttani', 'Uthukkottai'] },
    { name: 'Tiruvannamalai', taluks: ['Tiruvannamalai', 'Arani', 'Cheyyar', 'Chengam', 'Chetpet', 'Kalasapakkam', 'Kilpennathur', 'Polur', 'Thandarampet', 'Vandavasi', 'Vembakkam', 'Jamunamarathur'] },
    { name: 'Tiruvarur', taluks: ['Tiruvarur', 'Mannargudi', 'Nannilam', 'Kodavasal', 'Needamangalam', 'Thiruthuraipoondi', 'Valangaiman', 'Koothanallur'] },
    { name: 'Vellore', taluks: ['Vellore', 'Gudiyatham', 'Katpadi', 'Anaicut', 'K.V. Kuppam', 'Pernambut'] },
    { name: 'Viluppuram', taluks: ['Viluppuram', 'Tindivanam', 'Gingee', 'Kandachipuram', 'Marakkanam', 'Melmalaiyanur', 'Thiruvennainallur', 'Vanur', 'Vikravandi'] },
    { name: 'Virudhunagar', taluks: ['Virudhunagar', 'Sivakasi', 'Aruppukkottai', 'Kariapatti', 'Rajapalayam', 'Sattur', 'Srivilliputhur', 'Tiruchuli', 'Vembakottai', 'Watrap'] }
  ];

  const MAJOR_BUS_STANDS = [
    "Koyambedu CMBT (Chennai)", "Kilambakkam KCBT (Chennai)", "Madhavaram MMBT (Chennai)",
    "Mattuthavani (Madurai)", "Arapalayam (Madurai)", "Periyar (Madurai)",
    "Gandhipuram (Coimbatore)", "Ukadam (Coimbatore)", "Singanallur (Coimbatore)", "Mettupalayam Road (Coimbatore)",
    "New Bus Stand (Salem)", "Old Bus Stand (Salem)",
    "Chatram (Trichy)", "Central Bus Stand (Trichy)",
    "Erode Central Bus Stand", "Tirunelveli New Bus Stand",
    "Thoothukudi New Bus Stand", "Vellore New Bus Stand"
  ];

  const PANCHAYAT_TOWNS = [
    "Karumathampatti", "Vellalore", "Perur", "Kannampalayam", "Karamadai", "Pallapalayam", "Sirumugai", "Alanthurai",
    "Othakalmandapam", "Thondamuthur", "Chettipalayam", "Zamin Uthukuli",
    "Chennimalai", "Nasiyanur", "Sivagiri", "Kanjikoil", "Kempanaickenpalayam", "Salangapalayam", "Appakudal", "Kasipalayam",
    "B. Mallapuram", "Kambainallur", "Marandahalli", "Papparapatti", "Kadavur",
    "Alanganallur", "Sholavandan", "Paravai", "Vadipatti", "Melur", "T.Kallupatti",
    "Jalakandapuram", "Konganapuram", "Mecheri", "Nangavalli", "Tharamangalam", "Elampillai", "Kadayampatti",
    "Harur", "Karimangalam", "Pennagaram", "Omalur", "Edappadi",
    "Pallipalayam", "Komarapalayam", "Velur", "Pandamangalam", "Pothanur",
    "Kangeyam", "Vellakoil", "Muthur", "Uthukuli",
    "Kottakuppam", "Valavanur", "Arakandanallur",
    "Vadalur", "Kurinjipadi", "Bhuvanagiri", "Pennadam",
    "Thondi", "Sayalgudi", "Kamuthi", "Abiramam",
    "Thirupathur", "Singampunari", "Thirupuvanam",
    "Kalakkad", "Nanguneri", "Eruvadi", "Vadakkuvalliyur", "Panagudi",
    "Sayalkudi", "Eral", "Sathankulam", "Arumuganeri", "Nazareth"
  ];

  const allDistrictsAndTaluksLower = new Set([
    ...TN_DISTRICTS_DATA.map(d => d.name.toLowerCase()),
    ...TN_DISTRICTS_DATA.flatMap(d => d.taluks.map(t => t.toLowerCase()))
  ]);

  const filteredPanchayats = PANCHAYAT_TOWNS.filter(t => !allDistrictsAndTaluksLower.has(t.toLowerCase()));
  const filteredVillages = villageNames.filter(v => !allDistrictsAndTaluksLower.has(v.toLowerCase()));

  const rawCities = [
    ...TN_DISTRICTS_DATA.map(d => d.name + ' Bus Stand'),
    ...TN_DISTRICTS_DATA.flatMap(d => d.taluks.map(t => t + ' Bus Stand')),
    ...MAJOR_BUS_STANDS,
    ...filteredPanchayats,
    ...filteredVillages
  ];

  const TN_CITIES = Array.from(new Set(rawCities)).sort();

  const convert24hToMinutes = (time24) => {
    if (!time24) return 0;
    const [h, m] = time24.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const convertAmPmToMinutes = (time12) => {
    if (!time12) return 0;
    const [timePart, modifier] = time12.split(' ');
    let [h, m] = timePart.split(':').map(Number);
    if (modifier === 'PM' && h < 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    return (h * 60) + (m || 0);
  };

  const getCurrentTimeStr = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(getCurrentTimeStr());
  const [loading, setLoading] = useState(false);
  const [journeys, setJourneys] = useState([]);

  const [selectedJourney, setSelectedJourney] = useState(null);
  const [activeTracking, setActiveTracking] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // Booking state
  const [bookingContext, setBookingContext] = useState(null);
  const [nextBookingLeg, setNextBookingLeg] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedLegs, setBookedLegs] = useState(() => {
    try {
      const saved = localStorage.getItem('sptpis_valid_tickets_obj');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [bookFilterDate, setBookFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookFilterTime, setBookFilterTime] = useState('00:00');
  const [selectedTicketModal, setSelectedTicketModal] = useState(null);

  // Sync bookedLegs to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('sptpis_valid_tickets_obj', JSON.stringify(bookedLegs));
      // Save array of valid tickets for Driver Scanner cross-read
      const validArray = Object.values(bookedLegs).map(b => ({
        pnr: b.pnr || b.booking_reference,
        otp: b.otp,
        qrToken: `QR-${b.pnr || b.otp}`,
        bus: b.leg?.bus,
        from: b.leg?.from,
        to: b.leg?.to,
        seats: b.seats,
        date: b.date,
        status: 'VALID'
      }));
      localStorage.setItem('sptpis_valid_tickets', JSON.stringify(validArray));
    } catch (e) {}
  }, [bookedLegs]);

  // Complaint state
  const [complaintCategory, setComplaintCategory] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [complaintPhoto, setComplaintPhoto] = useState(null);
  const [complaintBusNumber, setComplaintBusNumber] = useState('');
  const [showBusOpts, setShowBusOpts] = useState(false);
  const [raisedComplaints, setRaisedComplaints] = useState([]);
  const [viewComplaintDetails, setViewComplaintDetails] = useState(null);

  // Example offline simulation
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Optionally simulate offline behaviour
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    fetchComplaints();

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/passenger/complaints?user_id=Passenger1');
      // map backend names to frontend names
      const mapped = res.data.map(c => ({
        id: 'C-' + c.complaint_id,
        date: new Date(c.created_date).toLocaleDateString(),
        time: new Date(c.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        busNumber: c.location || 'N/A',
        category: c.category,
        text: c.description || '',
        statusStr: c.statusStr,
        photoUrl: null
      }));
      setRaisedComplaints(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e, overrideSrc = null, overrideDest = null) => {
    if (e) e.preventDefault();
    if (isOffline) {
      alert("Internet unavailable. Showing cached information.");
    }
    setLoading(true);
    setActiveTab('search');

    // Prevent circular recursion or weird state by clearing history if it's a top-level form submission
    if (e && !overrideSrc) {
      setSearchHistory([]);
    }

    const searchSrc = overrideSrc || source || 'Source';
    const searchDest = overrideDest || destination || 'Dest';

    if (e && !overrideSrc) {
      setRecentSearches(prev => {
        const newSearch = { from: searchSrc, to: searchDest, date, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        return [newSearch, ...prev.filter(s => s.from !== searchSrc || s.to !== searchDest)].slice(0, 10);
      });
    }

    // Simulate a slight delay for realistic loading
    setTimeout(() => {
      const selectedTimeMins = convert24hToMinutes(time);

      let newJourneys = [];
      let cleanSrc = searchSrc.replace(/ Bus Stand$/i, '').trim().toLowerCase();
      let cleanDest = searchDest.replace(/ Bus Stand$/i, '').trim().toLowerCase();

      // Dataset uses abbreviations!
      if (cleanSrc === 'sathyamangalam') cleanSrc = 'sathy';
      if (cleanDest === 'sathyamangalam') cleanDest = 'sathy';

      // Find direct routes departing after the chosen time
      const directMatches = busSchedules.filter(route =>
        route.from.toLowerCase() === cleanSrc &&
        route.to.toLowerCase() === cleanDest &&
        convertAmPmToMinutes(route.departure) >= selectedTimeMins
      );

      if (directMatches.length > 0) {
        directMatches.sort((a, b) => convertAmPmToMinutes(a.departure) - convertAmPmToMinutes(b.departure));
        newJourneys = directMatches.slice(0, 40).map((route, idx) => ({
          id: route.id,
          type: idx === 0 ? 'OPTIMAL' : 'DIRECT',
          label: idx === 0 ? 'AI Recommended (Fastest)' : 'Standard Route',
          duration: route.duration || '1h 30m',
          transfers: 0,
          legs: [{
            from: searchSrc,
            to: searchDest,
            departure: route.departure,
            arrival: route.arrival,
            bus: route.bus,
            service_type: route.service_type || 'TNSTC Bus',
            fare: route.fare || '₹55'
          }],
          fare: route.fare || '₹55',
          crowdingScore: Math.floor(Math.random() * 80) + 10,
          crowdingMessage: idx === 0 ? 'Seats Available' : 'Moderate',
          status: 'On Time',
          statusColor: 'text-emerald-400 bg-emerald-400/10'
        }));
      } else {
        // Build Multi-Hop Connecting Routes dynamically
        const hopMatches = [];
        const firstLegs = busSchedules.filter(route =>
          route.from.toLowerCase() === cleanSrc && convertAmPmToMinutes(route.departure) >= selectedTimeMins
        );

        firstLegs.forEach(leg1 => {
          const leg1ArrTime = convertAmPmToMinutes(leg1.arrival);
          // Find second legs that leave at least 5 mins after arrival
          const secondLegsAny = busSchedules.filter(route =>
            route.from.toLowerCase() === leg1.to.toLowerCase() &&
            convertAmPmToMinutes(route.departure) >= (leg1ArrTime + 5)
          );

          // Sort second legs by earliest departure
          secondLegsAny.sort((a, b) => convertAmPmToMinutes(a.departure) - convertAmPmToMinutes(b.departure));

          // Find the very first connecting valid path for this leg1
          for (let i = 0; i < secondLegsAny.length; i++) {
            const leg2 = secondLegsAny[i];
            if (leg2.to.toLowerCase() === cleanDest) {
              hopMatches.push({ leg1, leg2 });
              break; // Found immediate connection, stop exploring combinations for this leg1
            } else {
              // Explore third leg
              const leg2ArrTime = convertAmPmToMinutes(leg2.arrival);
              const thirdLegs = busSchedules.filter(route =>
                route.from.toLowerCase() === leg2.to.toLowerCase() &&
                route.to.toLowerCase() === cleanDest &&
                convertAmPmToMinutes(route.departure) >= (leg2ArrTime + 5)
              );
              if (thirdLegs.length > 0) {
                thirdLegs.sort((a, b) => convertAmPmToMinutes(a.departure) - convertAmPmToMinutes(b.departure));
                hopMatches.push({ leg1, leg2, leg3: thirdLegs[0] });
                break; // Found 2-transfer connection, stop exploring combinations for this leg1
              }
            }
          }
        });

        if (hopMatches.length > 0) {
          // Sort chronologically by departure of the first leg
          hopMatches.sort((a, b) => convertAmPmToMinutes(a.leg1.departure) - convertAmPmToMinutes(b.leg1.departure));

          // Allow more results to display afternoon/evening journeys
          hopMatches.slice(0, 40).forEach((match, idx) => {
            if (match.leg3) {
              const totalMins = convertAmPmToMinutes(match.leg3.arrival) - convertAmPmToMinutes(match.leg1.departure);
              const durationStr = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
              const fareTotal = parseInt((match.leg1.fare || '55').replace(/[^0-9]/g, '')) + parseInt((match.leg2.fare || '55').replace(/[^0-9]/g, '')) + parseInt((match.leg3.fare || '55').replace(/[^0-9]/g, ''));

              newJourneys.push({
                id: 'hop_' + Math.random().toString(36).substr(2, 9),
                type: idx === 0 ? 'OPTIMAL' : 'CONNECTING',
                label: idx === 0 ? 'AI Recommended Connecting Route' : 'Alternative Hop (2 Transfers)',
                duration: durationStr,
                transfers: 2,
                hopAt: `${match.leg1.to}, ${match.leg2.to}`,
                legs: [
                  { from: searchSrc, to: match.leg1.to + ' Bus Stand', departure: match.leg1.departure, arrival: match.leg1.arrival, bus: match.leg1.bus, service_type: match.leg1.service_type || 'TNSTC', fare: match.leg1.fare || '₹55' },
                  { from: match.leg1.to + ' Bus Stand', to: match.leg2.to + ' Bus Stand', departure: match.leg2.departure, arrival: match.leg2.arrival, bus: match.leg2.bus, service_type: match.leg2.service_type || 'TNSTC', fare: match.leg2.fare || '₹55' },
                  { from: match.leg2.to + ' Bus Stand', to: searchDest, departure: match.leg3.departure, arrival: match.leg3.arrival, bus: match.leg3.bus, service_type: match.leg3.service_type || 'TNSTC', fare: match.leg3.fare || '₹55' }
                ],
                fare: '₹' + fareTotal + ' (Total)',
                crowdingScore: Math.floor(Math.random() * 80) + 10,
                crowdingMessage: 'Moderate',
                status: 'Connecting',
                statusColor: 'text-amber-400 bg-amber-400/10'
              });
            } else {
              const totalMins = convertAmPmToMinutes(match.leg2.arrival) - convertAmPmToMinutes(match.leg1.departure);
              const durationStr = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
              const fareTotal = parseInt((match.leg1.fare || '55').replace(/[^0-9]/g, '')) + parseInt((match.leg2.fare || '55').replace(/[^0-9]/g, ''));

              newJourneys.push({
                id: 'hop_' + Math.random().toString(36).substr(2, 9),
                type: idx === 0 ? 'OPTIMAL' : 'CONNECTING',
                label: idx === 0 ? 'AI Recommended Connecting Route' : 'Alternative Hop',
                duration: durationStr,
                transfers: 1,
                hopAt: match.leg1.to,
                legs: [
                  { from: searchSrc, to: match.leg1.to + ' Bus Stand', departure: match.leg1.departure, arrival: match.leg1.arrival, bus: match.leg1.bus, service_type: match.leg1.service_type || 'TNSTC', fare: match.leg1.fare || '₹55' },
                  { from: match.leg1.to + ' Bus Stand', to: searchDest, departure: match.leg2.departure, arrival: match.leg2.arrival, bus: match.leg2.bus, service_type: match.leg2.service_type || 'TNSTC', fare: match.leg2.fare || '₹55' }
                ],
                fare: '₹' + fareTotal + ' (Total)',
                crowdingScore: Math.floor(Math.random() * 80) + 10,
                crowdingMessage: 'Moderate',
                status: 'Connecting',
                statusColor: 'text-amber-400 bg-amber-400/10'
              });
            }
          });
        }
      }

      setJourneys(newJourneys);
      setLoading(false);
    }, 1000);
  };

  const handleSelectJourney = (journey) => {
    setSelectedJourney(journey);
    setActiveTab('journey');
  };

  const handleTrackBus = (fromCity, toCity, e = null) => {
    if (e) e.stopPropagation();
    setActiveTracking({ from: fromCity, to: toCity });
    setActiveTab('track');
  };

  const handleStartBooking = (leg, nextLeg = null, e = null) => {
    if (e) e.stopPropagation();

    // Dynamically resolve next connecting leg for N-hop journeys if omitted (e.g., in success screen)
    let resolvedNextLeg = nextLeg;
    if (!resolvedNextLeg && selectedJourney?.legs) {
      const idx = selectedJourney.legs.findIndex(l => l.from === leg.from && l.to === leg.to && l.departure === leg.departure);
      if (idx !== -1 && idx < selectedJourney.legs.length - 1) {
        resolvedNextLeg = selectedJourney.legs[idx + 1];
      }
    }

    setBookingContext(leg);
    setNextBookingLeg(resolvedNextLeg);
    setSelectedSeats([]); // reset previous selections
    setBookingSuccess(false); // reset success screen
    setActiveTab('booking');
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category: complaintCategory,
        busNumber: complaintBusNumber,
        text: complaintText,
        photoUrl: complaintPhoto ? URL.createObjectURL(complaintPhoto) : null,
        user_id: 'Passenger1'
      };
      await axios.post('http://localhost:5000/api/passenger/complaints', payload);
      alert(`Complaint submitted for ${complaintCategory}! Connected dynamically to Depot Admin.`);

      await fetchComplaints();
      setActiveTab('raised');
      setComplaintCategory('');
      setComplaintText('');
      setComplaintPhoto(null);
      setComplaintBusNumber('');
    } catch (err) {
      console.error(err);
      alert("Failed to submit complaint.");
    }
  };

  const renderHome = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-2xl font-black text-white mb-6">Where are you going?</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative z-50">
            <MapPin className="w-5 h-5 text-brand-500 absolute left-4 top-3.5" />
            <input
              type="text" placeholder="From (e.g. Erode, Laligam)" required
              value={source}
              autoComplete="off"
              onChange={e => { setSource(e.target.value); setShowSourceOpts(true); }}
              onFocus={() => setShowSourceOpts(true)}
              onBlur={() => setTimeout(() => setShowSourceOpts(false), 200)}
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-500 outline-none transition-colors"
            />
            {/* Custom Autocomplete Dropdown */}
            {showSourceOpts && (
              <div className="absolute top-full mt-2 left-0 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {TN_CITIES.filter(c => c.toLowerCase().includes(source.toLowerCase())).slice(0, 50).map(city => (
                  <div
                    key={city}
                    onMouseDown={(e) => { e.preventDefault(); setSource(city); setShowSourceOpts(false); }}
                    className="px-4 py-3 cursor-pointer text-slate-300 hover:bg-brand-500 hover:text-white font-bold text-sm transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    <MapPin className="w-4 h-4 inline-block mr-2 opacity-50" />
                    {city}
                  </div>
                ))}
                {TN_CITIES.filter(c => c.toLowerCase().includes(source.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-slate-500 text-sm">No exact matches found</div>
                )}
              </div>
            )}
          </div>
          <div className="relative border-l-2 border-dashed border-slate-700 ml-6 my-1 h-3 -mt-2 -mb-2"></div>
          <div className="relative pb-2 z-40">
            <MapPin className="w-5 h-5 text-emerald-500 absolute left-4 top-3.5" />
            <input
              type="text" placeholder="To (e.g. Salem, Dharmapuri)" required
              value={destination}
              autoComplete="off"
              onChange={e => { setDestination(e.target.value); setShowDestOpts(true); }}
              onFocus={() => setShowDestOpts(true)}
              onBlur={() => setTimeout(() => setShowDestOpts(false), 200)}
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
            {/* Custom Autocomplete Dropdown */}
            {showDestOpts && (
              <div className="absolute top-[calc(100%-8px)] mt-0 left-0 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {TN_CITIES.filter(c => c.toLowerCase().includes(destination.toLowerCase())).slice(0, 50).map(city => (
                  <div
                    key={city}
                    onMouseDown={(e) => { e.preventDefault(); setDestination(city); setShowDestOpts(false); }}
                    className="px-4 py-3 cursor-pointer text-slate-300 hover:bg-emerald-500 hover:text-white font-bold text-sm transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    <MapPin className="w-4 h-4 inline-block mr-2 opacity-50" />
                    {city}
                  </div>
                ))}
                {TN_CITIES.filter(c => c.toLowerCase().includes(destination.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-slate-500 text-sm">No exact matches found</div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group cursor-pointer">
              <Calendar className="w-4 h-4 text-brand-400 absolute left-4 top-4 group-hover:text-brand-300 transition-colors pointer-events-none z-10" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-slate-950/60 border border-slate-700 hover:border-brand-500/50 rounded-xl pl-11 pr-4 py-3 text-white focus:border-brand-500 outline-none text-sm transition-all cursor-pointer shadow-inner relative z-0" />
            </div>
            <div className="relative group cursor-pointer">
              <Clock className="w-4 h-4 text-brand-400 absolute left-4 top-4 group-hover:text-brand-300 transition-colors pointer-events-none z-10" />
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-slate-950/60 border border-slate-700 hover:border-brand-500/50 rounded-xl pl-11 pr-4 py-3 text-white focus:border-brand-500 outline-none text-sm transition-all cursor-pointer shadow-inner relative z-0" />
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 mt-4 transition">
            <Search className="w-5 h-5" /> FIND BUSES
          </button>
        </form>
      </div>

      <div className="mb-3 mt-8 text-xs font-black text-slate-500 tracking-widest uppercase ml-1">Popular Quick Routes</div>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
        {[
          { icon: <MapPin className="w-4 h-4 text-emerald-400" />, text: 'Erode ➔ Salem', from: 'Erode', to: 'Salem' },
          { icon: <Bus className="w-4 h-4 text-brand-400" />, text: 'Salem ➔ Dharmapuri', from: 'Salem', to: 'Dharmapuri' },
          { icon: <Clock className="w-4 h-4 text-amber-400" />, text: 'Erode ➔ Sathy', from: 'Erode', to: 'Sathyamangalam' },
          { icon: <Activity className="w-4 h-4 text-rose-400" />, text: 'Dharmapuri ➔ Erode', from: 'Dharmapuri', to: 'Erode' }
        ].map((route, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSource(route.from);
              setDestination(route.to);
              handleSearch(null, route.from, route.to);
            }}
            className="shrink-0 group bg-slate-900 border border-slate-800 hover:border-brand-500 hover:bg-slate-800 px-5 py-3 rounded-xl text-sm font-bold text-slate-300 transition-all shadow hover:shadow-lg flex items-center gap-3"
          >
            <div className="p-1 rounded-md bg-slate-950 shadow-inner group-hover:scale-110 transition-transform">
              {route.icon}
            </div>
            {route.text}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSearchResults = () => {
    const optimal = journeys.find(j => j.type === 'OPTIMAL');
    const others = journeys.filter(j => j.type !== 'OPTIMAL');

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          {searchHistory.length > 0 ? (
            <button
              onClick={() => {
                const prev = searchHistory[searchHistory.length - 1];
                setSource(prev.source);
                setDestination(prev.destination);
                setJourneys(prev.journeys);
                setSearchHistory(searchHistory.slice(0, -1));
              }}
              className="inline-flex items-center gap-3 bg-slate-900 border border-slate-700 hover:border-brand-500 hover:bg-slate-800 pr-5 pl-2 py-1.5 rounded-full text-sm font-bold text-slate-300 hover:text-white transition-all shadow-md group mb-6"
            >
              <div className="bg-slate-800 rounded-full p-2 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Return to Map:</span>
                <span className="text-white">{searchHistory[searchHistory.length - 1].source}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-white">{searchHistory[searchHistory.length - 1].destination}</span>
              </div>
            </button>
          ) : (
            <button onClick={() => setActiveTab('home')} className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-brand-500 pl-3 pr-4 py-2 rounded-full text-brand-400 hover:text-white font-bold mb-6 text-sm transition-all shadow group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Modify Search
            </button>
          )}

          <div className="flex justify-between items-end border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-white text-2xl md:text-3xl flex items-center gap-3">
                {source} <ArrowRight className="w-6 h-6 text-slate-600" /> {destination}
              </h3>
              <p className="text-slate-400 text-sm mt-2">{new Date(date).toDateString()} • Found {journeys.length} Options</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-80">
            <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
            <p className="text-brand-400 font-bold animate-pulse">AI is predicting live delays and crowding...</p>
          </div>
        ) : journeys.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-xl">
            <p className="text-slate-400 mb-4 text-lg">No direct buses found.</p>
            <button className="bg-brand-600 px-6 py-3 rounded-xl text-white font-bold transition hover:bg-brand-500">
              Search Smart Connecting Routes
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* OPTIMAL ROUTE - HERO CARD */}
            {optimal && (
              <div className="relative">
                <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-2">
                  <span>🏆</span> Recommended Optimal Path
                </div>
                <div
                  onClick={() => handleSelectJourney(optimal)}
                  className="bg-slate-900 border-2 border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-6 pt-8 shadow-2xl cursor-pointer transition-all hover:shadow-amber-500/10 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-300">{optimal.legs[0].service_type}</span>
                          {(() => {
                            const bCount = optimal.legs.filter(leg => bookedLegs[`${date}-${leg.bus}-${leg.departure}`]).length;
                            if (bCount === 0) return null;
                            return (
                              <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded shadow drop-shadow-md border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {bCount === optimal.legs.length ? 'Booked' : `Booked (${bCount}/${optimal.legs.length})`}
                              </span>
                            );
                          })()}
                        </div>
                        <span className="text-2xl font-black text-white">{optimal.duration}</span>
                      </div>

                      {/* Timeline Graphic with Animated Driving Bus */}
                      <style>{`
                        @keyframes driveBusAnim {
                          0% { left: 0%; opacity: 0; }
                          10% { opacity: 1; }
                          90% { opacity: 1; }
                          100% { left: calc(100% - 24px); opacity: 0; }
                        }
                      `}</style>
                      <div className="relative flex items-center justify-between mt-2">
                        <div className="flex flex-col items-center z-10 bg-slate-900 rounded-full px-2 py-1">
                          <span className="text-lg font-bold text-white">{optimal.legs[0].departure}</span>
                          <span className="text-xs text-slate-500 mt-1">{source}</span>
                        </div>

                        <div className="flex-1 px-2 relative h-10 flex items-center">
                          {/* The physical road line */}
                          <div className="h-1 w-full bg-slate-800 rounded-full absolute top-1/2 -translate-y-1/2 left-0"></div>
                          <div className="h-1 w-full bg-amber-500/20 rounded-full absolute top-1/2 -translate-y-1/2 left-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]"></div>

                          {/* The Animated Bus traversing the road */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                            style={{ animation: 'driveBusAnim 4s ease-in-out infinite' }}
                          >
                            <div className="w-6 h-0.5 bg-gradient-to-r from-transparent to-amber-500/50"></div> {/* Motion trail */}
                            <Bus className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                          </div>
                        </div>

                        <div className="flex flex-col items-center z-10 bg-slate-900 rounded-full px-2 py-1">
                          <span className="text-lg font-bold text-white">{optimal.legs[optimal.legs.length - 1].arrival}</span>
                          <span className="text-xs text-slate-500 mt-1">{destination}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Stats Panel */}
                    <div className="w-full md:w-64 bg-slate-950/50 rounded-xl p-4 border border-slate-800 grid gap-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Fare</span>
                        <span className="text-white font-bold">{optimal.fare}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Crowding</span>
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" /> {optimal.crowdingMessage}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Live Status</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${optimal.statusColor}`}>{optimal.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* MULTI-HOP BREAKDOWN UI (Only visible if there are transfers) */}
                  {optimal.transfers > 0 && (
                    <div className="mt-8 border-t border-slate-800/60 pt-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Map className="w-4 h-4 text-brand-400" /> Connecting Journey Breakdown
                      </h4>
                      <div className="grid gap-3 relative">
                        {/* Connecting Line behind the steps */}
                        <div className="absolute left-[15px] top-4 bottom-4 w-1 bg-slate-800 rounded-full z-0"></div>

                        {optimal.legs.map((leg, index) => {
                          const nLeg = optimal.legs[index + 1] || null;
                          const isBooked = bookedLegs[`${date}-${leg.bus}-${leg.departure}`];

                          return (
                            <div key={index} className="flex gap-4 items-stretch relative z-10">
                              <div className="w-8 h-8 rounded-full bg-slate-900 border-4 border-slate-950 shadow-[0_0_0_1px_rgba(30,41,59,1)] text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 mt-1">
                                {index + 1}
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchHistory(prev => [...prev, { source, destination, journeys }]);
                                  setSource(leg.from);
                                  setDestination(leg.to);
                                  handleSearch(null, leg.from, leg.to);
                                }}
                                className={`flex-1 p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group ${isBooked ? 'bg-emerald-950/20 border-emerald-500/20 shadow-emerald-500/5' : 'bg-slate-950/80 border-slate-800 hover:border-brand-500 hover:shadow-brand-500/10'}`}
                              >
                                <div>
                                  <div className="font-bold text-white text-[15px] flex items-center gap-2">
                                    {leg.from} <ArrowRight className="w-3 h-3 text-brand-500" /> {leg.to}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                    <Bus className="w-3 h-3 text-slate-500" /> {leg.bus} <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] uppercase font-bold">{leg.service_type}</span>
                                  </div>
                                  {(() => {
                                    const userBooked = bookedLegs[`${date}-${leg.bus}-${leg.departure}`]?.seats.split(', ').length || 0;
                                    const booked = 8 + userBooked;
                                    return (
                                      <div className="flex gap-3 text-[10px] mt-2 bg-slate-900/50 inline-flex px-2 py-1 rounded border border-slate-800">
                                        <span className="text-slate-400">Seats: <b className="text-slate-300">40</b></span>
                                        <span className="text-rose-400/80">Booked: <b className="text-rose-400">{booked}</b></span>
                                        <span className="text-emerald-400/80">Left: <b className="text-emerald-400">{40 - booked}</b></span>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="text-left md:text-right flex flex-col items-start md:items-end">
                                  <div className="font-bold text-emerald-400">{leg.departure} - {leg.arrival}</div>
                                  <div className="flex gap-3 items-center mt-1">
                                    <div className="text-xs text-slate-400 font-medium border-r border-slate-700 pr-3">Fare: {leg.fare || '₹150'}</div>
                                    <button
                                      onClick={(e) => handleTrackBus(leg.from, leg.to, e)}
                                      className="text-[10px] uppercase font-black tracking-widest bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-1 rounded transition-colors"
                                    >
                                      Track Live
                                    </button>
                                    {isBooked ? (
                                      <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded shadow drop-shadow-md border border-emerald-500/30 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Booked
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => { setSelectedJourney(optimal); handleStartBooking(leg, nLeg, e); }}
                                        className="text-[10px] uppercase font-black tracking-widest bg-brand-500 hover:bg-brand-400 text-white px-3 py-1 rounded shadow-lg shadow-brand-500/30 transition-all transform hover:scale-105"
                                      >
                                        Reserve
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OTHER OPTIONS - GRID VIEW */}
            <div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Map className="w-4 h-4" /> Other Available Buses
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {others.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => handleSelectJourney(j)}
                    className="bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-5 shadow-lg group cursor-pointer transition-all hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 group-hover:bg-brand-500/20 group-hover:border-brand-500/30 group-hover:text-brand-300 transition-colors">
                          {j.legs[0]?.service_type || 'Mixed Route'}
                        </span>
                        {(() => {
                          const bCount = j.legs.filter(l => bookedLegs[`${date}-${l.bus}-${l.departure}`]).length;
                          if (bCount === 0) return null;
                          return (
                            <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded shadow drop-shadow-md border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {bCount === j.legs.length ? 'Booked' : `Booked (${bCount}/${j.legs.length})`}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="text-white font-black">{j.duration}</span>
                    </div>

                    <div className="space-y-2 mb-5">
                      <div className="flex justify-between font-bold text-sm">
                        <span className="text-white">{j.legs[0]?.departure}</span>
                        <ArrowRight className="w-4 h-4 text-slate-600" />
                        <span className="text-white">{j.legs[j.legs.length - 1]?.arrival}</span>
                      </div>
                      {j.type === 'CONNECTING' && (
                        <div className="text-[11px] text-brand-400 bg-brand-500/10 py-1 px-2 rounded mt-2 border border-brand-500/20">
                          🔄 Hop at: {j.hopAt}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-400">Total Fare:</span>
                        <span className="text-white font-bold text-base">{j.fare}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

  const renderJourneyDetails = () => (
    <div className="space-y-5">
      <button onClick={() => setActiveTab('search')} className="text-brand-400 font-bold flex items-center gap-2 text-sm">&larr; Back to Results</button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-xl font-black text-white">Journey Details</h2>
          <div className="flex gap-2">
            <button className="bg-slate-800 p-2 rounded text-slate-300"><Heart className="w-4 h-4" /></button>
            <button className="bg-slate-800 p-2 rounded text-slate-300"><AlertTriangle className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="space-y-6 pl-2 border-l-2 border-brand-500/50 ml-2">
          {selectedJourney?.legs.map((leg, idx) => (
            <div key={idx} className="relative pl-6">
              <div className="absolute -left-[22px] bg-slate-900 w-10 h-10 rounded-full border-4 border-slate-950 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-brand-500" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                  <span className="text-brand-400 font-bold text-sm">{leg.from} &rarr; {leg.to}</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">{leg.service_type}</span>
                </div>
                <div className="flex justify-between text-white text-sm mb-3">
                  <span><b>Departs:</b> {leg.departure}</span>
                  <span><b>Arrives:</b> {leg.arrival}</span>
                </div>
                {(() => {
                  const userBooked = bookedLegs[`${date}-${leg.bus}-${leg.departure}`]?.seats.split(', ').length || 0;
                  const booked = 8 + userBooked;
                  return (
                    <div className="flex justify-between text-xs bg-slate-900/50 p-2 rounded-lg border border-slate-800 mb-3 text-slate-300">
                      <span>Total Seats: <b>40</b></span>
                      <span className="text-rose-400">Booked: <b>{booked}</b></span>
                      <span className="text-emerald-400">Available: <b>{40 - booked}</b></span>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleTrackBus(leg.from, leg.to)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold rounded flex items-center justify-center gap-2 transition text-sm">
                    <Activity className="w-4 h-4" /> TRACK LIVE
                  </button>
                  {bookedLegs[`${date}-${leg.bus}-${leg.departure}`] ? (
                    <div className="flex items-center justify-center gap-2 py-2 bg-emerald-900/40 text-emerald-400 font-bold rounded border border-emerald-500/30 shadow-inner text-sm">
                      <CheckCircle className="w-4 h-4" /> BOOKED
                    </div>
                  ) : (
                    <button onClick={() => handleStartBooking(leg, selectedJourney.legs[idx + 1] || null)} className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded flex items-center justify-center gap-2 transition text-sm hover:-translate-y-0.5 shadow-lg shadow-brand-500/30">
                      <Armchair className="w-4 h-4" /> BOOK SEAT
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <button onClick={() => setActiveTab('complaint')} className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1 mx-auto bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" /> Provide Feedback or Report Problem
          </button>
        </div>
      </div>
    </div>
  );

  const renderLiveTracking = () => {
    // Dynamic tracking using clicked sub-leg OR global search inputs
    const trackSrc = activeTracking?.from || source;
    const trackDest = activeTracking?.to || destination;

    const cityCoords = {
      'salem': [11.6643, 78.1460],
      'erode': [11.3410, 77.7172],
      'sathy': [11.5034, 77.2387],
      'villupuram': [11.9401, 79.4861],
      'chennai': [13.0827, 80.2707],
      'dharmapuri': [12.1211, 78.1582],
      'coimbatore': [11.0168, 76.9558],
      'madurai': [9.9252, 78.1198],
      'trichy': [10.7905, 78.7047],
      'tiruppur': [11.1085, 77.3411]
    };

    const sLow = trackSrc.toLowerCase();
    const dLow = trackDest.toLowerCase();

    const getCoord = (name) => {
      for (const [key, val] of Object.entries(cityCoords)) {
        if (name.includes(key)) return val;
      }
      return null;
    };

    const coordSrc = getCoord(sLow);
    const coordDest = getCoord(dLow);

    // If both are found, simply array them. Otherwise provide a generic fallback line.
    let polyline_coords = [[12.1211, 78.1582], [11.6643, 78.1460]]; // Generic Dharmapuri to Salem fallback

    if (coordSrc && coordDest) {
      polyline_coords = [coordSrc, coordDest];
    } else if (coordSrc) {
      polyline_coords = [coordSrc, [coordSrc[0] + 0.5, coordSrc[1] + 0.5]]; // generic line from src
    } else if (coordDest) {
      polyline_coords = [[coordDest[0] - 0.5, coordDest[1] - 0.5], coordDest]; // generic line to dest
    }

    const generatedRoute = {
      source_city: trackSrc,
      destination_city: trackDest,
      polyline_coords: polyline_coords,
      themeColor: '#00e5ff' // Unique cyan neon color
    };

    return (
      <div className="space-y-4">
        <button onClick={() => setActiveTab('journey')} className="text-brand-400 font-bold flex items-center gap-2 text-sm">&larr; Back to Journey</button>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-black text-white">Live AI Tracking Simulation</h3>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono"><Activity className="w-3 h-3 animate-pulse" /> Animated GPS Stream Live</span>
            </div>
          </div>

          <div className="h-96 relative">
            {/* The magic RouteMap that handles animation based on passed route */}
            <RouteMap
              route={generatedRoute}
              busName={`TNSTC (${source} ➔ ${destination})`}
              zoom={10}
            />
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] z-10" />

            <div className="absolute bottom-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-lg w-64">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{trackSrc}</span>
                <span>{trackDest}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 bg-cyan-400 animate-[progress_4s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecent = () => (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <h2 className="text-2xl font-black text-white mb-6">Recent Searches</h2>

      {recentSearches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentSearches.map((s, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSource(s.from);
                setDestination(s.to);
                handleSearch(null, s.from, s.to);
              }}
              className="bg-slate-900 border border-slate-800 hover:border-brand-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
            >
              <div className="flex justify-between items-center text-slate-400 text-xs mb-3 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time}</div>
                <div className="bg-slate-800 px-2 py-1 rounded">{s.date}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white font-black text-lg">{s.from}</span>
                <ArrowRight className="w-4 h-4 text-brand-500 group-hover:translate-x-1 transition-transform" />
                <span className="text-white font-black text-lg">{s.to}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-30 text-indigo-400" />
          <p className="font-bold text-lg text-slate-300">No recent activity yet</p>
          <p className="text-sm mt-2">Searches you make on the dashboard will appear here so you can quickly repeat them.</p>
          <button onClick={() => setActiveTab('home')} className="mt-6 bg-brand-600/20 text-brand-400 border border-brand-500/30 px-6 py-2 rounded-full font-bold hover:bg-brand-500 hover:text-white transition-colors">Start a Search</button>
        </div>
      )}
    </div>
  );

  const getFinishedBuses = () => {
    const currentDateStr = new Date().toISOString().split('T')[0];
    const currentMins = convert24hToMinutes(getCurrentTimeStr());

    const finished = Object.values(bookedLegs)
      .filter(b => (b.date < currentDateStr) || (b.date === currentDateStr && convertAmPmToMinutes(b.leg?.arrival || '11:59 PM') < currentMins));

    const unique = [];
    finished.forEach(b => {
      if (!unique.find(u => u.bus === b.leg.bus)) {
        unique.push({ bus: b.leg.bus, route: `${b.leg.from} ➔ ${b.leg.to}`, date: b.date });
      }
    });
    return unique;
  };

  const renderComplaint = () => (
    <div className="space-y-6">
      <button onClick={() => setActiveTab('search')} className="text-brand-400 font-bold flex items-center gap-2 text-sm">&larr; Back to Dashboard</button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-xl font-black text-white mb-6">Report an Issue</h2>
        <form onSubmit={submitComplaint} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Category</label>
            <select
              value={complaintCategory}
              onChange={e => setComplaintCategory(e.target.value)}
              required
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-500 flex-1"
            >
              <option value="">Select Category...</option>
              <option value="crowding">Extreme Crowding (Unsafe)</option>
              <option value="breakdown">Bus Breakdown / Delayed</option>
              <option value="cleanliness">Poor Cleanliness</option>
              <option value="staff">Staff Behavior</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="relative">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Bus Registration</label>
            <div className="relative">
              <Bus className="w-5 h-5 text-brand-500 absolute left-4 top-3.5" />
              <input
                type="text"
                required
                value={complaintBusNumber}
                onChange={e => { setComplaintBusNumber(e.target.value); setShowBusOpts(true); }}
                onFocus={() => setShowBusOpts(true)}
                onBlur={() => setTimeout(() => setShowBusOpts(false), 200)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-500 uppercase transition-colors"
                placeholder="e.g. TN-30-N-1234"
                autoComplete="off"
              />
              {/* Custom Autocomplete Dropdown */}
              {showBusOpts && (
                <div className="absolute top-full mt-2 left-0 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto z-50">
                  {getFinishedBuses().filter(b => b.bus.toLowerCase().includes(complaintBusNumber.toLowerCase())).map(item => (
                    <div
                      key={item.bus}
                      onMouseDown={(e) => { e.preventDefault(); setComplaintBusNumber(item.bus); setShowBusOpts(false); }}
                      className="px-4 py-3 cursor-pointer text-slate-300 hover:bg-brand-500 hover:text-white font-bold text-sm transition-colors border-b border-slate-700/50 last:border-0 flex items-center"
                    >
                      <span className="w-36 shrink-0"><Bus className="w-4 h-4 inline-block mr-2 opacity-50" /> {item.bus}</span>
                      <span className="text-[10px] text-brand-200 bg-black/20 px-4 py-1 rounded truncate flex-1 text-center">{item.route}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-brand-200 shrink-0 w-24 text-right">{item.date}</span>
                    </div>
                  ))}
                  {getFinishedBuses().filter(b => b.bus.toLowerCase().includes(complaintBusNumber.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-slate-500 text-sm">No recent matching buses found. Manually type if needed.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Details (Optional)</label>
            <textarea
              rows="4"
              value={complaintText}
              onChange={e => setComplaintText(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-500"
              placeholder="Provide exact location or issue details..."
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Upload Photo (Optional)</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={e => setComplaintPhoto(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full bg-slate-950/60 border border-slate-800 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-3 transition-colors group-hover:border-brand-500">
                {complaintPhoto ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">{complaintPhoto.name || 'Photo selected'}</span>
                    <span className="text-xs text-slate-500">Click to replace photo</span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center group-hover:text-brand-400 group-hover:bg-brand-500/20 transition-colors">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-slate-400 font-bold text-sm">Tap to take a photo or upload</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 mt-4 transition">
            <AlertTriangle className="w-5 h-5" /> SUBMIT FAST-TRACK ALERT
          </button>
        </form>
      </div>
    </div>
  );

  const renderBookingInterface = () => {
    if (!bookingContext) return null;

    const fareStr = bookingContext.fare || '₹150';
    const baseFare = parseInt(String(fareStr).replace(/\D/g, '')) || 150;
    const totalAmount = baseFare * selectedSeats.length;

    const toggleSeat = (seatId) => {
      setSelectedSeats(prev =>
        prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
      );
    };

    if (bookingSuccess) {
      const nextLeg = nextBookingLeg;
      const currentTicket = bookedLegs[`${date}-${bookingContext.bus}-${bookingContext.departure}`] || {};
      const pnrNum = currentTicket.pnr || "TNSTC-BK-882190";
      const otpCode = currentTicket.otp || "789012";

      return (
        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-700 min-h-[70vh]">
          {/* DIGITAL TICKET */}
          <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)] w-full max-w-md relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 left-0 h-2 bg-emerald-500"></div>

            <div className="flex flex-col items-center mb-6 relative z-10">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-400 shadow-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
              </div>
              <h2 className="text-2xl font-black text-white">Booking Confirmed</h2>
              <p className="text-slate-400 text-xs mt-1">Seats reserved! Present QR code or OTP to Driver</p>
            </div>

            {/* BOARDING OTP DISPLAY */}
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 text-center my-4 relative z-10 shadow-inner">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400 block mb-1">Boarding Verification OTP</span>
              <span className="text-3xl font-mono font-black text-white tracking-[0.3em]">{otpCode}</span>
            </div>

            <div className="border-t border-b border-slate-700/50 border-dashed py-4 my-4 space-y-3 relative z-10 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">PNR Ticket No.</span>
                <span className="text-white font-mono font-bold tracking-widest">{pnrNum}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Reserved Seats</span>
                <span className="text-brand-400 font-bold bg-brand-500/20 px-2 py-0.5 rounded">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Amount Paid</span>
                <span className="text-emerald-400 font-bold">₹{totalAmount + (selectedSeats.length * 20)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTicketModal(currentTicket)}
              className="w-full mb-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
            >
              <QrCode className="w-5 h-5" /> View QR Pass & Digital Boarding Pass
            </button>

            <div className="flex justify-between items-center mb-2 relative z-10">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Boarding</p>
                <p className="text-white font-bold">{bookingContext.from}</p>
                <p className="text-xs text-slate-400">{bookingContext.departure}</p>
              </div>
              <div className="flex-1 px-4 flex flex-col items-center">
                <Bus className="w-4 h-4 text-emerald-500 mb-1" />
                <div className="h-[2px] w-full bg-slate-800 relative">
                  <div className="absolute top-0 left-0 bottom-0 bg-emerald-500 w-full animate-pulse blur-[1px]"></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Dropping</p>
                <p className="text-white font-bold">{bookingContext.to}</p>
                <p className="text-xs text-slate-400">{bookingContext.arrival}</p>
              </div>
            </div>

            {/* Frost glow inside */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none"></div>
          </div>

          {/* SMART CONTINUITY NAVIGATION */}
          {nextLeg ? (
            <div className="w-full max-w-md space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">You have an upcoming connecting journey.</p>
                <p className="text-white font-bold">Secure your seats for the next leg now!</p>
              </div>
              <button
                onClick={() => handleStartBooking(nextLeg)}
                className="w-full bg-brand-600 hover:bg-brand-500 border border-brand-400 text-white font-black py-4 rounded-xl shadow-[0_10px_30px_-5px_rgba(37,99,235,0.5)] flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
              >
                Book Next Leg: {nextLeg.from} ➔ {nextLeg.to} <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('journey')}
                className="w-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-4 rounded-xl transition-colors"
              >
                Skip and Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-700 delay-300">
              <button
                onClick={() => setActiveTab('journey')}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <button onClick={() => setActiveTab('journey')} className="text-brand-400 font-bold flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Abandon Checkout
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Luxurious Bus Blueprint */}
          <div className="w-full lg:w-[400px] bg-[#0b1121] border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex-shrink-0">
            {/* Bus Header */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-white font-black text-xl">{bookingContext.service_type || 'Premium Coach'}</h3>
                <p className="text-slate-400 text-xs mt-1 font-mono">{bookingContext.bus || 'TN-AI-0000'}</p>
              </div>
              <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center shadow-inner text-slate-500">
                {/* Steering wheel mock */}
                <div className="w-5 h-5 border-2 border-current rounded-full relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-current -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* AI Crowding Thermal UI Map */}
            <p className="text-[10px] text-center font-bold text-brand-400 uppercase tracking-widest mb-6 bg-brand-500/10 py-1.5 rounded-full border border-brand-500/20">
              Interactive Seat Blueprint
            </p>

            {/* SEAT GRID: 2x2 Layout */}
            <div className="w-full max-w-[240px] mx-auto grid grid-cols-5 gap-y-5 gap-x-2 relative z-10 mb-8">
              {/* 10 Rows, 4 seats per row, middle is aisle */}
              {Array.from({ length: 10 }).map((_, row) => (
                <React.Fragment key={row}>
                  {/* Left side seats */}
                  {[1, 2].map(col => {
                    const seatId = `${String.fromCharCode(65 + row)}${col}`;
                    const isOccupied = (row * col) % 7 === 0; // Pseudo-random occupied generator
                    const isSelected = selectedSeats.includes(seatId);
                    const seatColor = isOccupied ? 'bg-slate-800 border-slate-700 text-slate-600' : isSelected ? 'bg-brand-500 border-brand-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-brand-400 cursor-pointer';

                    return (
                      <button
                        key={seatId} disabled={isOccupied} onClick={() => toggleSeat(seatId)}
                        className={`w-10 h-12 rounded-t-xl rounded-b-sm border-2 flex flex-col items-center justify-center gap-1 transition-all ${seatColor} relative overflow-hidden group`}
                      >
                        {/* Headrest indent */}
                        <div className={`w-6 h-1 rounded-full ${isSelected ? 'bg-brand-300' : 'bg-slate-700'} mb-1`} />
                        <span className="text-[9px] font-bold">{seatId}</span>
                        {isSelected && <CheckCircle className="absolute inset-0 m-auto w-4 h-4 text-white opacity-80" />}
                      </button>
                    );
                  })}

                  {/* Aisle Space (Column 3) */}
                  <div className="w-6" />

                  {/* Right side seats */}
                  {[3, 4].map(col => {
                    const seatId = `${String.fromCharCode(65 + row)}${col}`;
                    const isOccupied = (row + col) % 5 === 0;
                    const isSelected = selectedSeats.includes(seatId);
                    const seatColor = isOccupied ? 'bg-slate-800 border-slate-700 text-slate-600' : isSelected ? 'bg-brand-500 border-brand-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-brand-400 cursor-pointer';

                    return (
                      <button
                        key={seatId} disabled={isOccupied} onClick={() => toggleSeat(seatId)}
                        className={`w-10 h-12 rounded-t-xl rounded-b-sm border-2 flex flex-col items-center justify-center gap-1 transition-all ${seatColor} relative overflow-hidden`}
                      >
                        <div className={`w-6 h-1 rounded-full ${isSelected ? 'bg-brand-300' : 'bg-slate-700'} mb-1`} />
                        <span className="text-[9px] font-bold">{seatId}</span>
                        {isSelected && <CheckCircle className="absolute inset-0 m-auto w-4 h-4 text-white opacity-80" />}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm border-2 border-slate-600 bg-slate-900" /> Available</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm border-2 border-slate-700 bg-slate-800" /> Booked</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm border-2 border-brand-400 bg-brand-500" /> Selected</div>
            </div>
          </div>

          {/* RIGHT: Checkout Experience */}
          <div className="flex-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-black text-white mb-6">Journey Details</h2>
              <div className="flex flex-col gap-6 relative">
                <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-slate-800"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] border-4 border-slate-900"></div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Boarding • {bookingContext.departure}</p>
                    <p className="text-white font-bold text-lg">{bookingContext.from}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] border-4 border-slate-900"></div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Dropping • {bookingContext.arrival}</p>
                    <p className="text-white font-bold text-lg">{bookingContext.to}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Glassmorphism Checkout Panel */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2" />

              <h2 className="text-xl font-black text-white mb-6">Fare Summary</h2>

              {selectedSeats.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Seat(s) Selected</span>
                    <span className="font-bold flex gap-2">
                      {selectedSeats.map(s => <span key={s} className="bg-slate-800 px-2 py-0.5 rounded text-brand-400">{s}</span>)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Base Fare ({selectedSeats.length} x ₹{baseFare})</span>
                    <span className="font-mono">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-4">
                    <span>Taxes & Fees</span>
                    <span className="font-mono">₹{selectedSeats.length * 20}</span>
                  </div>
                  <div className="flex justify-between items-center text-white text-2xl font-black pt-2">
                    <span>Total Amount</span>
                    <span className="text-brand-400">₹{totalAmount + (selectedSeats.length * 20)}</span>
                  </div>

                  <button
                    onClick={() => {
                      const generatedPnr = "TNSTC-BK-" + Math.floor(100000 + Math.random() * 900000);
                      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
                      const ticketObj = {
                        pnr: generatedPnr,
                        otp: generatedOtp,
                        booking_reference: generatedPnr,
                        booking_status: 'Confirmed',
                        boarding_stop: bookingContext.from,
                        destination_stop: bookingContext.to,
                        travel_date: date,
                        seat_number: selectedSeats.join(', '),
                        seats: selectedSeats.join(', '),
                        registration_number: bookingContext.bus || 'TN-33-N-1122',
                        fare_paid: totalAmount + (selectedSeats.length * 20),
                        date: date,
                        leg: bookingContext
                      };

                      setBookedLegs(prev => ({
                        ...prev,
                        [`${date}-${bookingContext.bus}-${bookingContext.departure}`]: ticketObj
                      }));
                      setBookingSuccess(true);
                    }}
                    className="w-full mt-6 bg-brand-600 hover:bg-brand-500 text-white font-black py-4 rounded-xl shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
                  >
                    <CreditCard className="w-5 h-5" /> PAY SECURELY
                  </button>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 relative z-10 border-2 border-dashed border-slate-800 rounded-xl">
                  <Armchair className="w-8 h-8 mb-2 opacity-50" />
                  <p className="font-medium">Please select a seat from the blueprint</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTicketLayout = (isFinishedTab) => {
    const currentDateStr = new Date().toISOString().split('T')[0];
    const currentMins = convert24hToMinutes(getCurrentTimeStr());

    // Convert object to array for easier filtering
    const allBookings = Object.entries(bookedLegs).map(([key, data]) => ({ id: key, ...data }));

    // Split into Active vs Finished
    const listToRender = allBookings.filter(b => {
      const isPast = (b.date < currentDateStr) || (b.date === currentDateStr && convertAmPmToMinutes(b.leg?.arrival || '11:59 PM') < currentMins);
      return isFinishedTab ? isPast : !isPast;
    });

    // Sub-Filter by date and time
    const filteredBookings = listToRender.filter(b => {
      if (!isFinishedTab && bookFilterDate && b.date !== bookFilterDate) return false;
      if (!isFinishedTab && bookFilterTime && convertAmPmToMinutes(b.leg?.departure || '00:00') < convert24hToMinutes(bookFilterTime)) return false;
      return true;
    });

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-black text-white">{isFinishedTab ? "Journey History" : "Your Booked Tickets"}</h2>

        {/* Filters (Only show for upcoming bookings to manage active schedule) */}
        {!isFinishedTab && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-4 items-end shadow-lg">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Filter by Date</label>
              <input
                type="date"
                value={bookFilterDate}
                onChange={e => setBookFilterDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Departing After</label>
              <input
                type="time"
                value={bookFilterTime}
                onChange={e => setBookFilterTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        {/* Tickets */}
        {filteredBookings.length > 0 ? (
          <div className="grid gap-4">
            {filteredBookings.sort((a, b) => convertAmPmToMinutes(a.leg.departure) - convertAmPmToMinutes(b.leg.departure)).map((b) => (
              <div key={b.id} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center group transition-all hover:border-slate-700">
                <div className={`absolute top-0 right-0 w-32 h-32 ${isFinishedTab ? 'bg-slate-500/10' : 'bg-emerald-500/10'} blur-[50px] pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2`} />

                <div className="flex-1 w-full space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded border ${isFinishedTab ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>{b.leg.service_type || 'TNSTC'}</span>
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-2">
                      {isFinishedTab && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {b.date}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-white">
                    <div className="flex-1">
                      <div className="text-lg font-black">{b.leg.departure}</div>
                      <div className="text-sm font-medium text-slate-400 mt-1">{b.leg.from}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 mx-4" />
                    <div className="flex-1 text-right">
                      <div className="text-lg font-black">{b.leg.arrival}</div>
                      <div className="text-sm font-medium text-slate-400 mt-1">{b.leg.to}</div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-center md:items-end md:pl-6 md:border-l border-slate-800/80 shrink-0 gap-2 relative z-10">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bus Registration</div>
                  <div className="text-white font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">{b.leg.bus}</div>

                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Seat(s)</div>
                  <div className="text-brand-400 font-bold">{b.seats}</div>

                  {!isFinishedTab ? (
                    <div className="mt-3 flex flex-col gap-2 w-full">
                      <button
                        onClick={() => setSelectedTicketModal(b)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center justify-center gap-2 transition text-xs shadow-md"
                      >
                        <QrCode className="w-4 h-4" /> QR Pass & OTP: <span className="font-mono text-amber-300 font-black">{b.otp || '789012'}</span>
                      </button>
                      <button
                        onClick={() => handleTrackBus(b.leg.from, b.leg.to)}
                        className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded flex items-center justify-center gap-2 transition text-xs shadow-[0_5px_15px_-3px_rgba(37,99,235,0.4)]"
                      >
                        <Activity className="w-4 h-4" /> Track Live
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setComplaintBusNumber(b.leg.bus);
                        setActiveTab('complaint');
                      }}
                      className="mt-4 w-full py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded flex items-center justify-center gap-2 transition text-sm shadow-[0_5px_15px_-3px_rgba(225,29,72,0.4)]"
                    >
                      <ShieldAlert className="w-4 h-4" /> Give Feedback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            {isFinishedTab ? <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30" /> : <Armchair className="w-12 h-12 mx-auto mb-4 opacity-30" />}
            <p className="font-bold text-lg">{isFinishedTab ? "No completed journeys" : "No active tickets found"}</p>
            <p className="text-sm">{isFinishedTab ? "Trips you've finished will appear here." : "Try adjusting your date or time filters, or go book a journey!"}</p>
          </div>
        )}
      </div>
    );
  };

  const renderRaisedComplaints = () => {
    if (viewComplaintDetails) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
          <button onClick={() => setViewComplaintDetails(null)} className="text-brand-400 font-bold flex items-center gap-2 text-sm">&larr; Back to Complaints</button>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
              <div>
                <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">{viewComplaintDetails.id}</div>
                <h2 className="text-xl font-black text-white">{viewComplaintDetails.category.toUpperCase()}</h2>
              </div>
              <div className="px-3 py-1 rounded text-xs font-black uppercase tracking-widest border bg-slate-800 text-amber-400 border-amber-400/30">
                {viewComplaintDetails.statusStr}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
                  <div className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Incident Date</div>
                  <div className="text-white font-bold">{viewComplaintDetails.date} <span className="text-slate-400">{viewComplaintDetails.time}</span></div>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
                  <div className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Bus Number</div>
                  <div className="text-white font-bold">{viewComplaintDetails.busNumber || 'N/A'}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Complaint Details</div>
                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/50 text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {viewComplaintDetails.text}
                </div>
              </div>

              {viewComplaintDetails.photoUrl && (
                <div>
                  <div className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Attached Evidence</div>
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-w-sm">
                    <img src={viewComplaintDetails.photoUrl} alt="Complaint Evidence" className="w-full h-auto object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white">My Raised Complaints</h2>
          <button onClick={() => setActiveTab('complaint')} className="bg-rose-500 hover:bg-rose-400 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 text-sm transition-transform hover:scale-105">
            <ShieldAlert className="w-4 h-4" /> New Complaint
          </button>
        </div>

        {raisedComplaints.length > 0 ? (
          <div className="grid gap-4">
            {raisedComplaints.map(complaint => (
              <div
                key={complaint.id}
                onClick={() => setViewComplaintDetails(complaint)}
                className="bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:-translate-y-1 p-5 rounded-2xl cursor-pointer transition-all shadow-lg flex flex-col sm:flex-row items-center gap-4 sm:gap-6 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800 shadow-inner group-hover:border-amber-500/30">
                  <AlertTriangle className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>

                <div className="flex-1 text-center sm:text-left w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-1">
                    <span className="text-white font-black text-lg truncate w-full sm:w-auto">{complaint.category.toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border bg-slate-800 text-amber-400 border-amber-400/30 shrink-0 mt-1 sm:mt-0">
                      {complaint.statusStr}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs font-bold text-slate-500 mt-3 sm:mt-1 uppercase tracking-widest justify-center sm:justify-start">
                    <span>{complaint.date}</span>
                    <span className="hidden sm:inline">&bull;</span>
                    <span>Bus: {complaint.busNumber || 'N/A'}</span>
                    <span className="hidden sm:inline">&bull;</span>
                    <span className="text-slate-400">ID: {complaint.id}</span>
                  </div>
                </div>

                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors hidden sm:flex">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-30 text-rose-400" />
            <p className="font-bold text-lg text-slate-300">No Complaints Raised</p>
            <p className="text-sm mt-2 max-w-md mx-auto">You haven't submitted any feedback or issues. We're glad your journeys are going smoothly!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex shadow-2xl relative overflow-hidden">

      {/* Sidebar / Slide Bar */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex sticky top-0 h-screen z-40 rounded-r-3xl overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
            <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center shrink-0"><Bus className="w-4 h-4 text-white" /></div>
            <span className="font-extrabold text-white ml-3 hidden lg:block tracking-wide">TNPT Portal</span>
          </div>

          <nav className="p-4 space-y-2 mt-4">
            <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'home' || activeTab === 'search' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Search className="w-5 h-5 shrink-0" />
              <span className="font-bold hidden lg:block uppercase text-xs tracking-wider">Search</span>
            </button>
            <button onClick={() => setActiveTab('recent')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'recent' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Clock className="w-5 h-5 shrink-0" />
              <span className="font-bold hidden lg:block uppercase text-xs tracking-wider">Recent</span>
            </button>
            <button onClick={() => setActiveTab('booked')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'booked' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Armchair className="w-5 h-5 shrink-0" />
              <span className="font-bold hidden lg:block uppercase text-xs tracking-wider">Booked</span>
            </button>
            <button onClick={() => setActiveTab('finished')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'finished' ? 'bg-slate-500/20 text-white border border-slate-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="font-bold hidden lg:block uppercase text-xs tracking-wider">Finished</span>
            </button>
            <button onClick={() => setActiveTab('complaint')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'complaint' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="font-bold hidden lg:block uppercase text-xs tracking-wider">Complaint</span>
            </button>
            <button onClick={() => { setActiveTab('raised'); setViewComplaintDetails(null); }} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'raised' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="font-bold hidden lg:block uppercase text-xs tracking-wider">My Alerts</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 hidden lg:block text-[10px] text-slate-600 text-center uppercase tracking-widest font-black">
          v2.0 Beta
        </div>
      </aside>

      <div className="flex-1 flex flex-col max-w-full relative h-screen overflow-hidden">
        <header className="md:hidden bg-slate-900 border-b border-slate-800 h-16 flex items-center px-4 justify-between shrink-0 top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center shrink-0"><Bus className="w-4 h-4 text-white" /></div>
            <span className="font-extrabold text-white text-sm">TN Public Transport</span>
          </div>
          <div className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded cursor-pointer">EN / TA</div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full pb-24 md:pb-8">
          <div className="max-w-[72rem] mx-auto w-full">
            {activeTab === 'home' && renderHome()}
            {activeTab === 'search' && renderSearchResults()}
            {activeTab === 'journey' && renderJourneyDetails()}
            {activeTab === 'track' && renderLiveTracking()}
            {activeTab === 'booked' && renderTicketLayout(false)}
            {activeTab === 'finished' && renderTicketLayout(true)}
            {activeTab === 'complaint' && renderComplaint()}
            {activeTab === 'booking' && renderBookingInterface()}
            {activeTab === 'recent' && renderRecent()}
            {activeTab === 'raised' && renderRaisedComplaints()}
          </div>
        </main>

        {/* Mobile Nav */}
        <footer className="fixed md:hidden bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex justify-around items-center z-40">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' || activeTab === 'search' ? 'text-brand-400' : 'text-slate-500'}`}>
            <Search className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold">Search</span>
          </button>
          <button onClick={() => setActiveTab('recent')} className={`flex flex-col items-center gap-1 ${activeTab === 'recent' ? 'text-indigo-400' : 'text-slate-500'}`}>
            <Clock className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold">Recent</span>
          </button>
          <button onClick={() => setActiveTab('booked')} className={`flex flex-col items-center gap-1 ${activeTab === 'booked' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <Armchair className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold">Book</span>
          </button>
          <button onClick={() => setActiveTab('complaint')} className={`flex flex-col items-center gap-1 ${activeTab === 'complaint' ? 'text-rose-400' : 'text-slate-500'}`}>
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold">Report</span>
          </button>
        </footer>
      </div>

      {/* QR Ticket Modal popup */}
      {selectedTicketModal && (
        <QrTicketModal
          ticket={selectedTicketModal}
          onClose={() => setSelectedTicketModal(null)}
        />
      )}
    </div>
  );
};

export default PassengerDashboard;
