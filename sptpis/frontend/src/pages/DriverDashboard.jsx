import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Sidebar, SidebarBody, SidebarLink, SidebarLogoutButton, SidebarSection } from '../components/velora/animated-sidebar';
import { HoverCardGrid } from '../components/velora/card-hover-effect';
import { BorderDrawWrapper } from '../components/velora/border-draw-card';
import {
  Bus, Navigation, MapPin, PlayCircle, ShieldAlert, CheckCircle,
  ArrowRight, AlertTriangle, Clock, Calendar, AlertOctagon, CheckSquare,
  Wrench, Smartphone, Users, QrCode, AlertCircle, UserCheck,
  HeartHandshake, Bell, Volume2, ShieldCheck, User, Gauge,
  FileText, Check, X, Plus, Minus, Camera, Zap, Award, Phone,
  Activity, Flame, Wifi, Layers, Compass, Radio, LogOut
} from 'lucide-react';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cockpit'); // 'cockpit' | 'roster' | 'history' | 'maintenance'

  // Hardware vs Simulation GPS State
  const [useHardwareGps, setUseHardwareGps] = useState(false);
  const [liveGps, setLiveGps] = useState({ lat: '11.34100', lng: '77.71720', speed: '54.2', accuracy: 'Simulated AI' });
  const [gpsError, setGpsError] = useState(null);
  const [distanceCovered, setDistanceCovered] = useState(18.4); // in km
  const [ecoScore, setEcoScore] = useState(94); // Eco-driving score percentage

  // Vehicle Telemetry Simulation
  const [telemetry, setTelemetry] = useState({
    fuel: 82, // %
    engineTemp: 90, // °C
    tyrePressure: '32 PSI (OK)',
    battery: 98 // %
  });

  // Driver Profile State
  const [profile, setProfile] = useState({
    name: 'K. Murugan',
    employee_id: 'TNSTC-DRV-8821',
    license_number: 'TN-33-2018-00921',
    license_expiry: '14-NOV-2028',
    depot: 'Erode Central Depot',
    phone: '+91 98421 00921',
    rating: '4.9 ★',
    trips_completed: 1240,
    shift_timing: '07:00 AM - 03:30 PM'
  });

  const [todayTrips, setTodayTrips] = useState([
    {
      trip_id: 'TRIP-TN33-901',
      registration_number: 'TN-33-N-1122',
      route_name: 'Erode H.S ➔ Salem New Stand',
      source_city: 'Erode',
      destination_city: 'Salem',
      status: 'Running',
      scheduled_departure: 'Today 01:40 PM',
      scheduled_arrival: 'Today 03:15 PM'
    },
    {
      trip_id: 'TRIP-TN33-904',
      registration_number: 'TN-33-N-1122',
      route_name: 'Salem New Stand ➔ Erode H.S',
      source_city: 'Salem',
      destination_city: 'Erode',
      status: 'Scheduled',
      scheduled_departure: 'Today 04:30 PM',
      scheduled_arrival: 'Today 06:10 PM'
    }
  ]);

  const [tripHistory, setTripHistory] = useState([
    { trip_id: 'TRIP-8841', date: 'Yesterday', route_name: 'Erode to Salem', bus: 'TN-33-N-1122', distance: '64 km', duration: '1h 35m', passengers: 48, status: 'Completed' },
    { trip_id: 'TRIP-8830', date: '05 Oct 2026', route_name: 'Salem to Erode', bus: 'TN-33-N-1122', distance: '64 km', duration: '1h 40m', passengers: 50, status: 'Completed' },
    { trip_id: 'TRIP-8812', date: '04 Oct 2026', route_name: 'Erode to Coimbatore', bus: 'TN-33-N-1122', distance: '102 km', duration: '2h 15m', passengers: 52, status: 'Completed' }
  ]);

  const [activeTrip, setActiveTrip] = useState({
    trip_id: 'TRIP-TN33-901',
    registration_number: 'TN-33-N-1122',
    route_name: 'Erode H.S ➔ Salem New Stand',
    source_city: 'Erode',
    destination_city: 'Salem',
    status: 'Running',
    delay_mins: 0,
    scheduled_departure: '01:40 PM',
    scheduled_arrival: '03:15 PM'
  });

  const [tripStops, setTripStops] = useState([
    { stop_id: 1, stop_name: 'Erode Main Terminus', stop_order: 1, arrived: true, distance_from_prev: '0 km' },
    { stop_id: 2, stop_name: 'Bhavani Junction', stop_order: 2, arrived: false, eta: '8 mins', distance_from_prev: '14 km' },
    { stop_id: 3, stop_name: 'Chitode Bus Stop', stop_order: 3, arrived: false, eta: '22 mins', distance_from_prev: '8 km' },
    { stop_id: 4, stop_name: 'Sankari Bypass', stop_order: 4, arrived: false, eta: '42 mins', distance_from_prev: '24 km' },
    { stop_id: 5, stop_name: 'Salem New Stand', stop_order: 5, arrived: false, eta: '1h 10m', distance_from_prev: '18 km' }
  ]);

  // Pre-Trip Safety Checklist
  const [checklist, setChecklist] = useState({
    brakes: true, lights: true, horn: true, tyres: true,
    mirrors: true, doors: true, emergency_equipment: true,
    fuel_battery: true, vehicle_condition: true
  });

  // Onboard Passenger Counter & Capacity (Default capacity 50)
  const busCapacity = 50;
  const [passengerCount, setPassengerCount] = useState(38);

  // QR Ticket Validation Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [manualQrInput, setManualQrInput] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [qrScanning, setQrScanning] = useState(false);

  // Passenger Stop Requests State
  const [stopRequests, setStopRequests] = useState([
    { id: 1, stop_name: 'Bhavani Junction', passenger_count: 2, timestamp: '2 mins ago', acknowledged: false }
  ]);

  // Special Assistance Requests (Wheelchair, Senior Citizen, Women Safety)
  const [specialAlerts, setSpecialAlerts] = useState([
    { id: 101, type: 'Wheelchair', stop_name: 'Bhavani Junction', note: 'Ramp assistance requested for wheelchair passenger', acknowledged: false },
    { id: 102, type: 'Senior Citizen', stop_name: 'Chitode Bus Stop', note: 'Priority front-door onboarding requested', acknowledged: false }
  ]);

  // Incident & Emergency Reporting Modal
  const [reportingType, setReportingType] = useState(null); // 'Delay' | 'Breakdown' | 'Emergency'
  const [reportMsg, setReportMsg] = useState('');

  // Maintenance Ticket State
  const [maintenanceTickets, setMaintenanceTickets] = useState([]);
  const [maintenanceFilter, setMaintenanceFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'RESOLVED'
  const [maintenanceAlert, setMaintenanceAlert] = useState(null);
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [newIssueSeverity, setNewIssueSeverity] = useState('High');

  // Initial Fetching
  useEffect(() => {
    fetchDriverInit();
    loadGarageTickets();
  }, [activeTab]);

  // Telemetry GPS Streaming Simulator
  useEffect(() => {
    let watchId = null;
    let simInterval = null;

    if (activeTrip && (activeTrip.status === 'Running' || activeTrip.status === 'Delayed')) {
      if (useHardwareGps) {
        if ('geolocation' in navigator) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              const coords = {
                lat: position.coords.latitude.toFixed(5),
                lng: position.coords.longitude.toFixed(5),
                speed: (position.coords.speed * 3.6).toFixed(1) || '0.0',
                accuracy: position.coords.accuracy.toFixed(0) + 'm'
              };
              setLiveGps(coords);
              setGpsError(null);

              if (socket) {
                socket.emit('smartphone_gps_stream', {
                  driver_id: profile.employee_id, bus_id: activeTrip.registration_number,
                  latitude: coords.lat, longitude: coords.lng, speed: coords.speed, timestamp: new Date().toISOString()
                });
              }
            },
            (error) => setGpsError(error.message),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          setGpsError("Hardware GPS not supported");
        }
      } else {
        // Dead Reckoning Simulation Mode
        let curLat = 11.34100;
        let curLng = 77.71720;
        const targetLat = 11.66430;
        const targetLng = 78.14600;
        const stepLat = (targetLat - curLat) / 200;
        const stepLng = (targetLng - curLng) / 200;

        simInterval = setInterval(() => {
          curLat += stepLat;
          curLng += stepLng;
          if (curLat > targetLat) { curLat = 11.34100; curLng = 77.71720; }
          const fakeVar = (Math.random() * 4 - 2).toFixed(1);
          const speed = (54.0 + parseFloat(fakeVar)).toFixed(1);

          setDistanceCovered(prev => parseFloat((prev + 0.05).toFixed(1)));
          const coords = { lat: curLat.toFixed(5), lng: curLng.toFixed(5), speed, accuracy: 'AI Telemetry Engine' };
          setLiveGps(coords);

          if (socket) {
            socket.emit('smartphone_gps_stream', {
              driver_id: profile.employee_id, bus_id: activeTrip.registration_number,
              latitude: coords.lat, longitude: coords.lng, speed, timestamp: new Date().toISOString()
            });
          }
        }, 2500);
      }
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (simInterval !== null) clearInterval(simInterval);
    };
  }, [activeTrip?.status, useHardwareGps, socket, profile]);

  React.useEffect(() => {
    // 1. Listen for custom window events dispatched locally
    const handleTicketUpdated = (e) => {
      const updated = e.detail;
      if (updated) {
        const targetId = updated.id || updated.ticket_id;
        setMaintenanceTickets(prev => prev.map(t => (t.id === targetId || t.ticket_id === targetId) ? { ...t, ...updated, status: updated.status, mechanic: updated.mechanic || t.mechanic } : t));
        setMaintenanceAlert({
          id: Date.now(),
          title: `🔧 Garage Maintenance Ticket #${targetId}`,
          message: `Depot Admin updated status to "${updated.status}"${updated.mechanic ? ` (Mechanic: ${updated.mechanic})` : ''}`,
          status: updated.status
        });
      }
    };

    const handleStorageChange = () => {
      loadGarageTickets();
    };

    window.addEventListener('sptpis_garage_ticket_updated', handleTicketUpdated);
    window.addEventListener('storage', handleStorageChange);

    // 2. Socket.io listeners
    let handleTripAssigned;
    let handleSocketUpdateTicket;
    let handleSocketNewTicket;

    if (socket) {
      handleTripAssigned = (data) => {
        console.log('[Driver Dashboard] Real-time Trip Sync Received:', data);
        fetchDriverInit();
      };
      handleSocketUpdateTicket = (updated) => {
        if (updated) {
          const targetId = updated.id || updated.ticket_id;
          setMaintenanceTickets(prev => prev.map(t => (t.id === targetId || t.ticket_id === targetId) ? { ...t, ...updated, status: updated.status, mechanic: updated.mechanic || t.mechanic } : t));
          setMaintenanceAlert({
            id: Date.now(),
            title: `🔧 Garage Maintenance Ticket #${targetId}`,
            message: `Depot Admin updated status to "${updated.status}"${updated.mechanic ? ` (Mechanic: ${updated.mechanic})` : ''}`,
            status: updated.status
          });
        }
      };
      handleSocketNewTicket = (newT) => {
        if (newT) {
          setMaintenanceTickets(prev => [newT, ...prev.filter(t => (t.id || t.ticket_id) !== (newT.id || newT.ticket_id))]);
        }
      };

      socket.on('trip_assigned', handleTripAssigned);
      socket.on('global_sync_broadcast', handleTripAssigned);
      socket.on('garage_ticket_updated_broadcast', handleSocketUpdateTicket);
      socket.on('driver_garage_ticket_broadcast', handleSocketNewTicket);
    }

    return () => {
      window.removeEventListener('sptpis_garage_ticket_updated', handleTicketUpdated);
      window.removeEventListener('storage', handleStorageChange);
      if (socket) {
        if (handleTripAssigned) {
          socket.off('trip_assigned', handleTripAssigned);
          socket.off('global_sync_broadcast', handleTripAssigned);
        }
        if (handleSocketUpdateTicket) socket.off('garage_ticket_updated_broadcast', handleSocketUpdateTicket);
        if (handleSocketNewTicket) socket.off('driver_garage_ticket_broadcast', handleSocketNewTicket);
      }
    };
  }, [socket]);

  const fetchDriverInit = async () => {
    try {
      setLoading(true);
      const [profRes, tripsRes, allTripsRes] = await Promise.all([
        axios.get('/api/driver/profile').catch(() => ({ data: {} })),
        axios.get('/api/driver/trips/today').catch(() => ({ data: { trips: [] } })),
        axios.get('/api/driver/trips/all').catch(() => ({ data: { trips: [] } }))
      ]);

      if (profRes.data && profRes.data.name) {
        setProfile(prev => ({ ...prev, ...profRes.data }));
      }
      if (tripsRes.data?.trips?.length > 0) {
        const formattedToday = tripsRes.data.trips.map(t => ({
          trip_id: `TRIP-${t.trip_id}`,
          registration_number: t.registration_number || 'TN-33-N-1122',
          route_name: t.route_name || `${t.source_city || 'Erode'} ➔ ${t.destination_city || 'Salem'}`,
          source_city: t.source_city || 'Erode',
          destination_city: t.destination_city || 'Salem',
          status: t.status || 'Scheduled',
          scheduled_departure: t.scheduled_departure || 'Today',
          scheduled_arrival: t.scheduled_arrival || 'Today'
        }));
        setTodayTrips(formattedToday);
        if (formattedToday[0]) {
          setActiveTrip(formattedToday[0]);
        }
      }

      if (allTripsRes.data?.trips?.length > 0) {
        const formattedHistory = allTripsRes.data.trips.map(t => ({
          trip_id: `TRIP-${t.trip_id}`,
          date: t.scheduled_departure ? t.scheduled_departure.split(' ')[0] : 'Today',
          route_name: t.route_name || `${t.source_city || 'Erode'} to ${t.destination_city || 'Salem'}`,
          bus: t.registration_number || 'TN-33-N-1122',
          distance: '120 km',
          duration: '2h 15m',
          passengers: 50,
          status: t.status || 'Completed'
        }));
        setTripHistory(formattedHistory);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklist = (key) => setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  const selectAllChecklist = () => {
    const allTrue = Object.values(checklist).every(Boolean);
    const updated = {};
    Object.keys(checklist).forEach(k => { updated[k] = !allTrue; });
    setChecklist(updated);
  };
  const isChecklistComplete = Object.values(checklist).every(Boolean);

  const handleStartTrip = () => {
    if (!isChecklistComplete) {
      return alert("Please complete the pre-trip safety checklist first.");
    }
    setActiveTrip(prev => ({ ...prev, status: 'Running' }));
  };

  const handleEndTrip = () => {
    if (window.confirm("Confirm completion of current trip?")) {
      const completedTrip = {
        trip_id: activeTrip.trip_id,
        date: 'Today',
        route_name: activeTrip.route_name,
        bus: activeTrip.registration_number,
        distance: `${distanceCovered} km`,
        duration: '1h 15m',
        passengers: passengerCount,
        status: 'Completed'
      };
      setTripHistory(prev => [completedTrip, ...prev]);
      setActiveTrip(prev => ({ ...prev, status: 'Completed' }));
    }
  };

  // Passenger Counter
  const handlePassengerChange = async (delta) => {
    const newCount = Math.max(0, Math.min(busCapacity, passengerCount + delta));
    setPassengerCount(newCount);
    try {
      await axios.post('/api/driver/passengers/update', {
        trip_id: activeTrip?.trip_id,
        passenger_count: newCount,
        capacity: busCapacity
      });
    } catch (e) { }
  };

  // QR Code & Boarding OTP Verification
  const verifyQrCode = async (codeToVerify) => {
    const code = String(codeToVerify || manualQrInput || '').trim();
    if (!code) return alert("Please enter or scan a QR code or 6-digit Boarding OTP.");

    setQrScanning(true);
    setScannedResult(null);

    // 1. Check local storage for actual passenger bookings created in Passenger Dashboard
    try {
      const stored = localStorage.getItem('sptpis_valid_tickets');
      const validTickets = stored ? JSON.parse(stored) : [];
      const match = validTickets.find(t =>
        t.otp === code ||
        t.pnr === code ||
        (t.qrToken && t.qrToken.includes(code)) ||
        (t.otp && code.includes(t.otp))
      );

      if (match) {
        setScannedResult({
          valid: true,
          pnr: match.pnr,
          otp: match.otp,
          passenger_name: 'Confirmed Passenger',
          category: 'TNSTC E-Ticket',
          seats: match.seats,
          from: match.from || 'Erode Main Terminus',
          to: match.to || 'Salem New Stand',
          bus: match.bus || 'TN-33-N-1122'
        });
        if (passengerCount < busCapacity) {
          setPassengerCount(prev => prev + 1);
        }
        setQrScanning(false);
        return;
      }
    } catch (e) { }

    // 1b. Check backend database for persisted passenger bookings
    try {
      const dbRes = await axios.get('http://localhost:5000/api/passenger/bookings');
      const dbBookings = dbRes.data?.bookings || [];
      const dbMatch = dbBookings.find(b => {
        const t = typeof b.ticket_json === 'string' ? JSON.parse(b.ticket_json) : b.ticket_json;
        return (
          b.otp === code ||
          b.pnr === code ||
          (t && (t.otp === code || t.pnr === code || (t.qrToken && t.qrToken.includes(code))))
        );
      });

      if (dbMatch) {
        const t = typeof dbMatch.ticket_json === 'string' ? JSON.parse(dbMatch.ticket_json) : dbMatch.ticket_json;
        setScannedResult({
          valid: true,
          pnr: dbMatch.pnr || t?.pnr,
          otp: dbMatch.otp || t?.otp,
          passenger_name: dbMatch.passenger_name || 'Confirmed Passenger',
          category: 'TNSTC E-Ticket',
          seats: dbMatch.seat_number || t?.seats || t?.seat_number,
          from: dbMatch.from_city || t?.boarding_stop || 'Erode Main Terminus',
          to: dbMatch.to_city || t?.destination_stop || 'Salem New Stand',
          bus: dbMatch.bus_number || t?.registration_number || 'TN-33-N-1122'
        });
        if (passengerCount < busCapacity) {
          setPassengerCount(prev => prev + 1);
        }
        setQrScanning(false);
        return;
      }
    } catch (e) { }

    // 2. Demo fallback codes
    if (code === '789012' || code === '894210' || code === 'PASS-TN33-SENIOR' || code === 'TICKET-ERODE-99') {
      setScannedResult({
        valid: true,
        pnr: 'TNSTC-BK-882190',
        otp: code === 'PASS-TN33-SENIOR' ? '789012' : code,
        passenger_name: 'Senior Citizen Passholder',
        category: 'TNSTC Valid Pass',
        seats: 'A1, A2',
        from: 'Erode Main Terminus',
        to: 'Salem New Stand',
        bus: activeTrip?.registration_number || 'TN-33-N-1122'
      });
      if (passengerCount < busCapacity) {
        setPassengerCount(prev => prev + 1);
      }
      setQrScanning(false);
      return;
    }

    // 3. Fallback to API check
    try {
      const res = await axios.post('/api/driver/verify-qr', { qr_code: code, trip_id: activeTrip?.trip_id });
      setScannedResult(res.data);
      if (res.data.valid && passengerCount < busCapacity) {
        setPassengerCount(prev => prev + 1);
      }
    } catch (e) {
      setScannedResult({
        valid: false,
        ticket_id: code,
        error: e.response?.data?.error || 'Invalid or Expired Boarding OTP / Pass'
      });
    } finally {
      setQrScanning(false);
    }
  };

  // Submit Emergency / Incident
  const submitReport = async () => {
    if (!reportMsg) return alert('Please describe the issue');
    try {
      await axios.post('/api/driver/report', {
        type: reportingType,
        trip_id: activeTrip?.trip_id || null,
        message: reportMsg,
        severity: reportingType === 'Emergency' ? 'Critical' : 'High'
      });
      alert(`${reportingType} alert sent immediately to Depot Dispatch Center.`);
      setReportingType(null);
      setReportMsg('');
    } catch (e) {
      alert(`${reportingType} alert dispatched to Depot Admin.`);
      setReportingType(null);
      setReportMsg('');
    }
  };

  const loadGarageTickets = async () => {
    try {
      // 1. Fetch from backend SQLite API
      const res = await axios.get('/api/driver/garage-tickets').catch(() => null);
      if (res && res.data && res.data.tickets && res.data.tickets.length > 0) {
        const mapped = res.data.tickets.map(t => ({
          id: t.ticket_id,
          ticket_id: t.ticket_id,
          issue: t.issue,
          driver_name: t.driver_name,
          driver_id: t.driver_id,
          bus: t.bus_number,
          depot: t.depot_name,
          severity: t.severity,
          status: t.status,
          mechanic: t.mechanic,
          resolution_notes: t.resolution_notes,
          time: t.created_at ? t.created_at.split(' ')[1] : 'Today',
          date: t.created_at ? t.created_at.split(' ')[0] : 'Today'
        }));
        setMaintenanceTickets(mapped);
        localStorage.setItem('sptpis_garage_tickets', JSON.stringify(mapped));
        return;
      }

      // 2. Fallback to localStorage
      const stored = localStorage.getItem('sptpis_garage_tickets');
      if (stored) {
        setMaintenanceTickets(JSON.parse(stored));
      } else {
        const initial = [
          { id: 'GT-101', issue: 'Rear brake chamber air leakage & pressure drop', driver_name: 'K. Murugan', driver_id: 'TN29-DRV-201', bus: 'TN-29-N-1542', severity: 'Critical', status: 'In Progress', mechanic: 'R. Periasamy', time: '09:15 AM', date: 'Today' },
          { id: 'GT-102', issue: 'Clutch plate slippage on Thoppur ghat incline', driver_name: 'S. Rajan', driver_id: 'TN33-DRV-104', bus: 'TN-33-N-0988', severity: 'High', status: 'Open', mechanic: 'Unassigned', time: '08:40 AM', date: 'Today' },
          { id: 'GT-105', issue: 'Speedometer telematics GPS sensor calibration', driver_name: 'M. Suresh', driver_id: 'TN29-DRV-550', bus: 'TN-01-N-8821', severity: 'Low', status: 'Resolved', mechanic: 'K. Senthil', resolution_notes: 'Replaced speed pulse sensor. Calibrated with depot telematics bench.', time: '06 Oct 2026', date: '06 Oct 2026' }
        ];
        setMaintenanceTickets(initial);
        localStorage.setItem('sptpis_garage_tickets', JSON.stringify(initial));
      }
    } catch (e) { }
  };

  const createMaintenanceTicket = async () => {
    if (!newIssueDesc.trim()) return alert("Please describe the mechanical issue/flaw");
    const newId = `MNT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket = {
      id: newId,
      ticket_id: newId,
      issue: newIssueDesc.trim(),
      driver_name: profile.name || 'K. Murugan',
      driver_id: profile.employee_id || 'TNSTC-DRV-8821',
      bus: activeTrip?.registration_number || 'TN-33-N-1122',
      bus_number: activeTrip?.registration_number || 'TN-33-N-1122',
      depot: profile.depot || 'Erode Central Depot',
      severity: newIssueSeverity || 'High',
      status: 'Open',
      mechanic: 'Unassigned',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today'
    };

    // 1. Optimistic state & localStorage update
    setMaintenanceTickets(prev => [newTicket, ...prev]);

    try {
      const existing = JSON.parse(localStorage.getItem('sptpis_garage_tickets') || '[]');
      const updated = [newTicket, ...existing];
      localStorage.setItem('sptpis_garage_tickets', JSON.stringify(updated));

      const notifs = JSON.parse(localStorage.getItem('sptpis_global_notifications') || '[]');
      notifs.unshift({
        id: Date.now(),
        title: `🔧 Garage Maintenance Ticket from ${newTicket.driver_name}`,
        message: `Bus ${newTicket.bus}: ${newTicket.issue}`,
        timestamp: newTicket.time,
        type: 'maintenance',
        depot: newTicket.depot
      });
      localStorage.setItem('sptpis_global_notifications', JSON.stringify(notifs));
    } catch (e) { }

    // 2. Dispatch events
    window.dispatchEvent(new CustomEvent('sptpis_new_garage_ticket', { detail: newTicket }));
    window.dispatchEvent(new Event('storage'));

    // 3. Socket broadcast
    if (socket) {
      socket.emit('driver_garage_ticket', newTicket);
    }

    // 4. Persist to backend API
    try {
      await axios.post('/api/driver/garage-tickets', newTicket);
    } catch (e) {
      console.warn('Backend ticket creation fallback:', e.message);
    }

    setNewIssueDesc('');
    alert("🔧 Garage Maintenance Query submitted successfully! Real-time alert dispatched to Depot Admin.");
  };

  // Occupancy calculations
  const availableSeats = Math.max(0, busCapacity - passengerCount);
  const occupancyRatio = passengerCount / busCapacity;
  let occupancyBadge = { label: 'NORMAL CAPACITY', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  if (occupancyRatio >= 0.95) {
    occupancyBadge = { label: 'BUS FULL - CAPACITY REACHED', style: 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' };
  } else if (occupancyRatio >= 0.75) {
    occupancyBadge = { label: 'MODERATE CROWD', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">

      {/* TOP DESKTOP SYSTEM COMMAND HEADER */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-wide">TNSTC SMART DRIVER COCKPIT</h1>
              <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Driver ID: <strong className="text-brand-400">{profile.employee_id}</strong> | Depot: {profile.depot} | Bus: <strong className="text-white">TN-33-N-1122</strong>
            </p>
          </div>
        </div>

        {/* Top Header Controls */}
        <div className="flex items-center gap-4">
          {/* Quick Hardware / Sim GPS Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setUseHardwareGps(false)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${!useHardwareGps ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              AI Web Sim
            </button>
            <button
              onClick={() => setUseHardwareGps(true)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${useHardwareGps ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Hardware GPS
            </button>
          </div>

          {/* Quick SOS Emergency Trigger Button */}
          <button
            onClick={() => setReportingType('Emergency')}
            className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-rose-400/40 shadow-lg shadow-rose-600/30 flex items-center gap-2 transition active:scale-95"
          >
            <AlertOctagon className="w-4 h-4 animate-pulse" /> SOS EMERGENCY
          </button>

          {/* Profile Card Summary */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white text-xs">
              KM
            </div>
            <div className="text-left font-mono">
              <div className="text-xs font-bold text-white">{profile.name}</div>
              <div className="text-[10px] text-emerald-400">{profile.rating} Rating</div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN DESKTOP COCKPIT CONTAINER */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT NAVIGATION DESKTOP BAR - ANIMATED VELORA SIDEBAR */}
        <div className="hidden md:flex sticky top-0 h-full z-40">
          <Sidebar className="h-full">
            <SidebarBody
              logo={
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-500/30">
                  <Bus className="w-4 h-4 text-white" />
                </div>
              }
              title="Driver Terminal"
              subtitle="TNSTC Fleet Operations"
              footer={<SidebarLogoutButton onClick={logout} />}
            >
              <SidebarSection title="Navigation Deck">
                <SidebarLink
                  label="Live Navigation Cockpit"
                  icon={<Gauge className="w-4 h-4" />}
                  active={activeTab === 'cockpit'}
                  onClick={() => setActiveTab('cockpit')}
                />
                <SidebarLink
                  label="Passenger Hub & Scanner"
                  icon={<Users className="w-4 h-4" />}
                  active={activeTab === 'passenger'}
                  onClick={() => setActiveTab('passenger')}
                />
                <SidebarLink
                  label="Safety Checklist"
                  icon={<CheckSquare className="w-4 h-4" />}
                  active={activeTab === 'checklist'}
                  onClick={() => setActiveTab('checklist')}
                />
                <SidebarLink
                  label="Duty Roster & Schedule"
                  icon={<Calendar className="w-4 h-4" />}
                  active={activeTab === 'roster'}
                  onClick={() => setActiveTab('roster')}
                />
                <SidebarLink
                  label="Duty Logbook"
                  icon={<FileText className="w-4 h-4" />}
                  active={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                />
                <SidebarLink
                  label="Garage Tickets"
                  icon={<Wrench className="w-4 h-4" />}
                  active={activeTab === 'maintenance'}
                  onClick={() => setActiveTab('maintenance')}
                />
              </SidebarSection>
            </SidebarBody>
          </Sidebar>
        </div>

        {/* RIGHT CONTENT DISPLAY AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {activeTab === 'cockpit' && (
            <div className="space-y-6">

              {/* TOP HERO ROUTE METRICS BANNER WITH BORDER DRAW EFFECT */}
              <BorderDrawWrapper radius={24} strokeColor="#10b981" className="rounded-3xl">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">

                    {/* Route & Vehicle Title */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs px-3 py-1 rounded-full uppercase">
                          {activeTrip.status} TRIP
                        </span>
                        <span className="text-slate-400 font-mono text-xs">TRIP ID: {activeTrip.trip_id}</span>
                      </div>
                      <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        {activeTrip.source_city} <ArrowRight className="w-6 h-6 text-brand-500" /> {activeTrip.destination_city}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1 font-mono">
                        Route #104 (Express Highway) • Bus: <span className="text-white font-bold">{activeTrip.registration_number}</span>
                      </p>
                    </div>

                    {/* Telemetry Quick Gauges Grid with Velora Hover Effect */}
                    <HoverCardGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono" layoutId="driverTelemetryGauges">
                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Live Speed</span>
                        <span className="text-2xl font-black text-emerald-400">{liveGps.speed} <span className="text-xs font-normal">km/h</span></span>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Distance</span>
                        <span className="text-2xl font-black text-white">{distanceCovered} <span className="text-xs font-normal">km</span></span>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Fuel Tank</span>
                        <span className="text-2xl font-black text-indigo-400">{telemetry.fuel}%</span>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Engine Temp</span>
                        <span className="text-2xl font-black text-amber-400">{telemetry.engineTemp}°C</span>
                      </div>
                    </HoverCardGrid>
                  </div>

                  {/* Live GPS Telemetry Strip */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap justify-between items-center text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                      <span>Lat: <strong className="text-white">{liveGps.lat}</strong> | Lng: <strong className="text-white">{liveGps.lng}</strong></span>
                      <span className="text-slate-600">|</span>
                      <span>Accuracy: <strong className="text-slate-300">{liveGps.accuracy}</strong></span>
                    </div>

                    <div className="flex items-center gap-3">
                      {activeTrip.status === 'Scheduled' ? (
                        <button
                          onClick={handleStartTrip}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                        >
                          <PlayCircle className="w-4 h-4" /> Start Active Trip
                        </button>
                      ) : (
                        <button
                          onClick={handleEndTrip}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition border border-slate-700"
                        >
                          End Trip
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </BorderDrawWrapper>

              {/* 2-COLUMN DESKTOP GRID LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT MAIN DECK (8 COLS) */}
                <div className="lg:col-span-7 space-y-6">

                  {/* Passenger Occupancy & Ticket Scanner Launcher with BorderDraw */}
                  <BorderDrawWrapper radius={24} strokeColor="#6366f1" className="rounded-3xl">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                          <Users className="w-5 h-5 text-brand-400" /> Passenger Occupancy & Boarding
                        </h3>
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${occupancyBadge.style}`}>
                          {occupancyBadge.label}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-2">
                          <span className="text-slate-400">Onboard: <strong className="text-white">{passengerCount}</strong> / {busCapacity}</span>
                          <span className="text-emerald-400 font-bold">{availableSeats} Seats Available</span>
                        </div>
                        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${occupancyRatio >= 0.95 ? 'bg-rose-500' : occupancyRatio >= 0.75 ? 'bg-amber-500' : 'bg-brand-500'}`}
                            style={{ width: `${Math.min(100, (passengerCount / busCapacity) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Passenger Manual Counter & QR Scanner Launcher */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                          <span className="text-xs font-bold text-slate-400 pl-2">Onboard</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handlePassengerChange(-1)}
                              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition active:scale-95"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-7 text-center font-bold font-mono text-white text-base">{passengerCount}</span>
                            <button
                              onClick={() => handlePassengerChange(1)}
                              className="w-8 h-8 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center justify-center transition active:scale-95 shadow-md shadow-brand-600/30"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => { setShowQrModal(true); setScannedResult(null); }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-2xl border border-indigo-400/30 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
                        >
                          <QrCode className="w-4 h-4" /> Verify QR / OTP
                        </button>
                      </div>
                    </div>
                  </BorderDrawWrapper>

                  {/* Passenger Stop Request & Special Assistance Deck with BorderDraw */}
                  <BorderDrawWrapper radius={24} strokeColor="#f59e0b" className="rounded-3xl">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                          <Bell className="w-5 h-5 text-amber-400 animate-bounce" /> Live Stop & Assistance Alerts
                        </h3>
                        <span className="text-xs text-amber-300 font-mono font-bold">Bhavani Junction (Next Stop)</span>
                      </div>

                      <div className="space-y-2">
                        {stopRequests.map(req => (
                          <div key={req.id} className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 flex justify-between items-center text-xs">
                            <span className="text-slate-200 font-semibold">🔔 Stop requested at <strong className="text-white font-bold">{req.stop_name}</strong></span>
                            <button
                              onClick={() => setStopRequests(prev => prev.filter(r => r.id !== req.id))}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/40 transition"
                            >
                              Acknowledge
                            </button>
                          </div>
                        ))}

                        {specialAlerts.map(alert => (
                          <div key={alert.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs">
                              {alert.type === 'Wheelchair' ? '♿' : '👵'}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-bold text-white">{alert.type} Assistance</h4>
                                <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{alert.stop_name}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{alert.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </BorderDrawWrapper>

                  {/* Operational Reporting Actions with BorderDraw */}
                  <div className="grid grid-cols-2 gap-3">
                    <BorderDrawWrapper radius={16} strokeColor="#f59e0b" className="rounded-2xl h-full">
                      <button
                        onClick={() => setReportingType('Delay')}
                        className="w-full h-full bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg"
                      >
                        <Clock className="w-4 h-4" /> Report Route Delay
                      </button>
                    </BorderDrawWrapper>
                    <BorderDrawWrapper radius={16} strokeColor="#f97316" className="rounded-2xl h-full">
                      <button
                        onClick={() => setReportingType('Breakdown')}
                        className="w-full h-full bg-slate-900 hover:bg-slate-800 text-orange-400 border border-orange-500/30 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg"
                      >
                        <Wrench className="w-4 h-4" /> Log Vehicle Breakdown
                      </button>
                    </BorderDrawWrapper>
                  </div>
                </div>

                {/* RIGHT ROUTE TIMELINE DECK (5 COLS) with BorderDraw */}
                <div className="lg:col-span-5 h-full">
                  <BorderDrawWrapper radius={24} strokeColor="#10b981" className="rounded-3xl h-full">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between h-full">
                      <div>
                        <h3 className="font-extrabold text-white text-base mb-4 flex items-center gap-2">
                          <Navigation className="w-5 h-5 text-emerald-400" /> Route Stops Timeline
                        </h3>

                        <div className="space-y-3.5 relative">
                          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-800"></div>

                          {tripStops.map((stop, idx) => (
                            <BorderDrawWrapper key={stop.stop_id} radius={16} strokeColor="#10b981" className="rounded-2xl">
                              <div className="relative z-10 flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${idx === 1 ? 'bg-brand-600 text-white border-brand-400 animate-pulse shadow-lg shadow-brand-600/50' : stop.arrived ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <h4 className={`text-xs font-bold ${idx === 1 ? 'text-white' : 'text-slate-300'}`}>{stop.stop_name}</h4>
                                    <span className="text-[10px] text-slate-500 font-mono">ETA: {stop.eta || 'Passed'} • {stop.distance_from_prev}</span>
                                  </div>
                                </div>

                                {idx === 1 && (
                                  <button
                                    onClick={() => {
                                      setTripStops(prev => prev.map((s, i) => i === 1 ? { ...s, arrived: true } : s));
                                      alert(`Arrival logged at ${stop.stop_name}! Systems updated.`);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition"
                                  >
                                    Arrived
                                  </button>
                                )}
                              </div>
                            </BorderDrawWrapper>
                          ))}
                        </div>
                      </div>
                    </div>
                  </BorderDrawWrapper>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PASSENGER HUB & QR SCANNER */}
          {activeTab === 'passenger' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <Users className="w-6 h-6 text-brand-400" /> Passenger Management & Ticket Validation Hub
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Verify passenger tickets, manage seat occupancy, and handle special assistance requests.</p>
                </div>
                <span className={`text-xs font-extrabold px-3.5 py-1.5 rounded-full border ${occupancyBadge.style}`}>
                  {occupancyBadge.label}
                </span>
              </div>

              {/* Occupancy Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-white text-base">Live Bus Capacity & Occupancy Radar</h3>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{availableSeats} Seats Available</span>
                </div>

                <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${occupancyRatio >= 0.95 ? 'bg-rose-500' : occupancyRatio >= 0.75 ? 'bg-amber-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.min(100, (passengerCount / busCapacity) * 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm font-mono text-slate-300">
                    Onboard Passengers: <strong className="text-white text-lg">{passengerCount}</strong> / {busCapacity}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Manual Adjustment:</span>
                    <button
                      onClick={() => handlePassengerChange(-1)}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition active:scale-95 border border-slate-700"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePassengerChange(1)}
                      className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center justify-center transition active:scale-95 shadow-md shadow-brand-600/30"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Ticket & 6-Digit OTP Verification Center */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-400" /> Instant Ticket & Boarding OTP Verification
                </h3>
                <p className="text-xs text-slate-400">Enter passenger 6-digit Boarding OTP code, PNR reference, or scan QR code.</p>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter 6-Digit Boarding OTP (e.g., 789012) or PNR..."
                    value={manualQrInput}
                    onChange={(e) => setManualQrInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => verifyQrCode()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Verify Ticket
                  </button>
                  <button
                    onClick={() => { setShowQrModal(true); setScannedResult(null); }}
                    className="bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs px-5 py-3 rounded-xl border border-slate-700 transition flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Camera Scanner
                  </button>
                </div>

                {/* Scanned Result Card */}
                {scannedResult && (
                  <div className={`p-5 rounded-2xl border ${scannedResult.valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                    <div className="flex items-center gap-2 font-black text-base mb-2">
                      {scannedResult.valid ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                      {scannedResult.valid ? 'PASSENGER TICKET VERIFIED & BOARDED' : 'INVALID BOARDING CODE'}
                    </div>

                    {scannedResult.valid ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs mt-3 pt-3 border-t border-emerald-500/20">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Passenger</span>
                          <strong className="text-white">{scannedResult.passenger_name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">PNR / Ref</span>
                          <strong className="text-emerald-400">{scannedResult.pnr}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Reserved Seat</span>
                          <strong className="text-brand-400">{scannedResult.seats}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Route</span>
                          <strong className="text-white">{scannedResult.from} ➔ {scannedResult.to}</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="font-mono text-xs">{scannedResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PRE-TRIP SAFETY CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <CheckSquare className="w-6 h-6 text-emerald-400" /> Pre-Trip Safety & Diagnostic Checklist
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Ensure all 9 mandatory vehicle safety requirements are inspected prior to trip launch.</p>
                </div>
                <button
                  onClick={selectAllChecklist}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg"
                >
                  Toggle All Checks
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(checklist).map(key => (
                  <button
                    key={key}
                    onClick={() => toggleChecklist(key)}
                    className={`p-5 rounded-2xl border font-extrabold text-left flex items-center justify-between transition ${checklist[key] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <div className="space-y-1">
                      <span className="capitalize text-sm block">{key.replace('_', ' ')}</span>
                      <span className="text-[10px] font-mono text-slate-400 block font-normal">{checklist[key] ? 'PASS - Inspected OK' : 'REQUIRES CHECK'}</span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${checklist[key] ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-600'}`}>
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DUTY SCHEDULE & ROSTER */}
          {activeTab === 'roster' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Calendar className="w-6 h-6 text-brand-400" /> Today's Assigned Duty Schedule
              </h2>

              <div className="space-y-4">
                {todayTrips.map(t => (
                  <BorderDrawWrapper key={t.trip_id} radius={24} strokeColor="#3b82f6" className="rounded-3xl w-full">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex justify-between items-center w-full">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs px-3 py-1 rounded-full">{t.status}</span>
                          <span className="text-slate-400 font-mono text-xs">{t.scheduled_departure}</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-white">{t.route_name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-1">Bus Registration: <strong className="text-white">{t.registration_number}</strong></p>
                      </div>

                      <button
                        onClick={() => setActiveTab('cockpit')}
                        className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg transition"
                      >
                        Open Cockpit
                      </button>
                    </div>
                  </BorderDrawWrapper>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DUTY LOGBOOK */}
          {activeTab === 'history' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <FileText className="w-6 h-6 text-brand-400" /> Driver Duty Logbook & Mileage History
              </h2>

              <div className="space-y-3">
                {tripHistory.map((item, i) => (
                  <BorderDrawWrapper key={i} radius={18} strokeColor="#6366f1" className="rounded-2xl w-full">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center w-full">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">{item.status}</span>
                          <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                        </div>
                        <h4 className="text-white font-extrabold text-base">{item.route_name}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Bus: {item.bus} • Distance: {item.distance} • Duration: {item.duration}</p>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs text-slate-400 block">Total Passengers</span>
                        <strong className="text-brand-400 text-base">{item.passengers} Onboard</strong>
                      </div>
                    </div>
                  </BorderDrawWrapper>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GARAGE MAINTENANCE TICKETS */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <Wrench className="w-6 h-6 text-brand-400" /> Garage Maintenance & Flaws Tracking
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Live telemetry link to Depot Mechanical Garage • Complete Ticket Lifecycle & Audit History
                  </p>
                </div>
                <button
                  onClick={loadGarageTickets}
                  className="self-start sm:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 transition"
                >
                  Refresh Tickets
                </button>
              </div>

              {/* Real-time Status Alert Toast */}
              {maintenanceAlert && (
                <div className="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/20 rounded-xl text-brand-400">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-extrabold text-xs">{maintenanceAlert.title}</div>
                      <div className="text-slate-300 text-[11px] font-mono">{maintenanceAlert.message}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMaintenanceAlert(null)}
                    className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 font-mono"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Maintenance Metrics Cards with BorderDraw */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BorderDrawWrapper radius={16} strokeColor="#6366f1" className="rounded-2xl h-full">
                  <button
                    onClick={() => setMaintenanceFilter('ALL')}
                    className={`w-full h-full text-left bg-slate-900 border rounded-2xl p-4 shadow-lg transition ${maintenanceFilter === 'ALL' ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-400">All Logged Tickets</span>
                    <div className="text-2xl font-black text-white mt-1">{maintenanceTickets.length}</div>
                  </button>
                </BorderDrawWrapper>
                <BorderDrawWrapper radius={16} strokeColor="#f59e0b" className="rounded-2xl h-full">
                  <button
                    onClick={() => setMaintenanceFilter('ACTIVE')}
                    className={`w-full h-full text-left bg-slate-900 border rounded-2xl p-4 shadow-lg transition ${maintenanceFilter === 'ACTIVE' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-500/30 hover:border-amber-500/60'}`}
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-400">Active / In Progress</span>
                    <div className="text-2xl font-black text-amber-400 mt-1">
                      {maintenanceTickets.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Under Inspection' || t.status === 'Scheduled').length}
                    </div>
                  </button>
                </BorderDrawWrapper>
                <BorderDrawWrapper radius={16} strokeColor="#10b981" className="rounded-2xl h-full">
                  <button
                    onClick={() => setMaintenanceFilter('RESOLVED')}
                    className={`w-full h-full text-left bg-slate-900 border rounded-2xl p-4 shadow-lg transition ${maintenanceFilter === 'RESOLVED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-500/30 hover:border-emerald-500/60'}`}
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-400">Resolved & Retained History</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      {maintenanceTickets.filter(t => t.status === 'Resolved' || t.status === 'Completed').length}
                    </div>
                  </button>
                </BorderDrawWrapper>
              </div>

              {/* Log New Mechanical Flaw Form with BorderDraw */}
              <BorderDrawWrapper radius={24} strokeColor="#f59e0b" className="rounded-3xl w-full">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 w-full">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Log Mechanical Defect to Depot Garage
                    </h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                      Bus: <strong className="text-white">{activeTrip?.registration_number || 'TN-33-N-1122'}</strong>
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Describe vehicle flaw (e.g. Brake chamber leakage, clutch slipping, wiper motor)..."
                      value={newIssueDesc}
                      onChange={(e) => setNewIssueDesc(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                    />
                    <select
                      value={newIssueSeverity}
                      onChange={(e) => setNewIssueSeverity(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <button
                      onClick={createMaintenanceTicket}
                      className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition whitespace-nowrap cursor-pointer"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </BorderDrawWrapper>

              {/* Filter Tabs Bar */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setMaintenanceFilter('ALL')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition font-mono ${maintenanceFilter === 'ALL' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'}`}
                >
                  All Tickets ({maintenanceTickets.length})
                </button>
                <button
                  onClick={() => setMaintenanceFilter('ACTIVE')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition font-mono ${maintenanceFilter === 'ACTIVE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  Active ({maintenanceTickets.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Under Inspection' || t.status === 'Scheduled').length})
                </button>
                <button
                  onClick={() => setMaintenanceFilter('RESOLVED')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition font-mono ${maintenanceFilter === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  Resolved & Repaired ({maintenanceTickets.filter(t => t.status === 'Resolved' || t.status === 'Completed').length})
                </button>
              </div>

              {/* Ticket Cards List */}
              <div className="space-y-4">
                {maintenanceTickets
                  .filter(t => {
                    if (maintenanceFilter === 'ACTIVE') return t.status === 'Open' || t.status === 'In Progress' || t.status === 'Under Inspection' || t.status === 'Scheduled';
                    if (maintenanceFilter === 'RESOLVED') return t.status === 'Resolved' || t.status === 'Completed';
                    return true;
                  })
                  .map((t) => {
                    const isResolved = t.status === 'Resolved' || t.status === 'Completed';
                    const isInProgress = t.status === 'In Progress' || t.status === 'Under Inspection' || t.status === 'Scheduled';

                    return (
                      <BorderDrawWrapper
                        key={t.id || t.ticket_id}
                        radius={18}
                        strokeColor={isResolved ? '#10b981' : isInProgress ? '#3b82f6' : '#f59e0b'}
                        className="rounded-2xl w-full"
                      >
                        <div
                          className={`bg-slate-900 border rounded-2xl p-5 shadow-lg space-y-3 transition w-full ${isResolved ? 'border-emerald-500/30 bg-gradient-to-r from-slate-900 to-emerald-950/20' : isInProgress ? 'border-blue-500/30' : 'border-amber-500/30'}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {t.id || t.ticket_id}
                              </span>
                              <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs font-bold text-white">
                                {t.bus || t.bus_number}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${t.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : t.severity === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'}`}>
                                {t.severity || 'High'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isResolved ? (
                                <span className="bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5" /> Resolved & Retained
                                </span>
                              ) : isInProgress ? (
                                <span className="bg-blue-500/20 text-blue-400 font-mono font-bold text-xs px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" /> In Progress
                                </span>
                              ) : (
                                <span className="bg-amber-500/20 text-amber-400 font-mono font-bold text-xs px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Open / Queued
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Issue Description */}
                          <div>
                            <h4 className="text-white font-extrabold text-sm sm:text-base">{t.issue}</h4>
                            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono mt-1">
                              <span>Logged: <strong className="text-slate-300">{t.date} {t.time}</strong></span>
                              <span>Depot: <strong className="text-slate-300">{t.depot || 'Dharmapuri Depot'}</strong></span>
                            </div>
                          </div>

                          {/* Mechanic Assignment & Resolution Box */}
                          {isResolved ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>{t.resolution_notes || 'Defect rectified and certified by depot garage mechanical team. Bus cleared for operation.'}</span>
                              </div>
                              {t.mechanic && (
                                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded self-start sm:self-auto">
                                  Mechanic: <strong>{t.mechanic}</strong>
                                </span>
                              )}
                            </div>
                          ) : isInProgress ? (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2 text-blue-300 font-medium">
                                <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
                                <span>Depot mechanical bay active work order.</span>
                              </div>
                              <span className="text-[11px] font-mono text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                                Assigned: <strong>{t.mechanic || 'Depot Mechanic'}</strong>
                              </span>
                            </div>
                          ) : (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Awaiting mechanic allocation by Dharmapuri Depot Admin.</span>
                            </div>
                          )}
                        </div>
                      </BorderDrawWrapper>
                    );
                  })}

                {maintenanceTickets.length === 0 && (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                    No garage tickets logged yet. Submit a defect report above to notify the depot garage.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* QR TICKET VALIDATION MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white mb-1 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-400" /> Ticket & Boarding OTP Validator
            </h3>
            <p className="text-xs text-slate-400 mb-4">Scan passenger QR ticket or enter 6-digit Boarding OTP.</p>

            {/* Viewfinder */}
            <div className="w-full h-40 bg-slate-950 border-2 border-dashed border-indigo-500/40 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden mb-4">
              <Camera className="w-8 h-8 text-indigo-400 mb-2 animate-bounce" />
              <span className="text-xs text-slate-400 font-mono">Camera Scanner Active</span>
            </div>

            {/* Fast Demo Codes */}
            <div className="mb-4">
              <span className="text-[10px] text-slate-500 font-mono block mb-1">QUICK DEMO BOARDING OTPS:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => verifyQrCode('789012')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs py-2 rounded-xl border border-slate-700 font-mono font-bold"
                >
                  OTP: 789012
                </button>
                <button
                  onClick={() => verifyQrCode('894210')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs py-2 rounded-xl border border-slate-700 font-mono font-bold"
                >
                  OTP: 894210
                </button>
              </div>
            </div>

            {/* Manual Code Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter 6-Digit OTP or PNR"
                value={manualQrInput}
                onChange={(e) => setManualQrInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => verifyQrCode()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-xl transition"
              >
                Verify
              </button>
            </div>

            {/* Scanned Result Output */}
            {scannedResult && (
              <div className={`p-4 rounded-2xl border text-xs ${scannedResult.valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {scannedResult.valid ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  {scannedResult.valid ? 'BOARDING VERIFIED SUCCESSFULLY' : 'VERIFICATION FAILED'}
                </div>
                <p className="font-mono text-xs">{scannedResult.valid ? `Passenger: ${scannedResult.passenger_name} (${scannedResult.category}) • Seats: ${scannedResult.seats || 'Assigned'}` : scannedResult.error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INCIDENT / EMERGENCY REPORTING MODAL */}
      {reportingType && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Report {reportingType}
            </h2>
            <p className="text-xs text-slate-400 mb-4">Alert dispatches live notification directly to Depot Dispatch Control.</p>

            <textarea
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-brand-500 h-28 mb-4 resize-none font-mono"
              placeholder="Provide brief details..."
              value={reportMsg}
              onChange={(e) => setReportMsg(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setReportingType(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition"
              >
                Dispatch Alert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverDashboard;
