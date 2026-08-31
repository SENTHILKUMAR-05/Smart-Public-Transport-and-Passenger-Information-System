import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Bus, Navigation, MapPin, PlayCircle, ShieldAlert,
  CheckCircle, ArrowRight, AlertTriangle, Clock, Calendar, AlertOctagon, CheckSquare, Wrench, Smartphone
} from 'lucide-react';

const DriverDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // home, trip, history

  // Hardware vs Simulation GPS State
  const [useHardwareGps, setUseHardwareGps] = useState(false);
  const [liveGps, setLiveGps] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [todayTrips, setTodayTrips] = useState([]);

  const [activeTrip, setActiveTrip] = useState(null);
  const [tripStops, setTripStops] = useState([]);

  const [checklist, setChecklist] = useState({
    brakes: false, lights: false, horn: false, tyres: false,
    mirrors: false, doors: false, emergency_equipment: false,
    fuel_battery: false, vehicle_condition: false
  });

  const [reportingType, setReportingType] = useState(null); // 'Delay' | 'Breakdown' | 'Emergency'
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    fetchDriverInit();
  }, [activeTab]);

  // SMARTPHONE-AS-A-SENSOR vs AI WEB SIMULATION TRACKER
  useEffect(() => {
    let watchId = null;
    let simInterval = null;

    // Only turn on monitoring when a trip is actually running
    if (activeTrip && (activeTrip.status === 'Running' || activeTrip.status === 'Delayed')) {

      if (useHardwareGps) {
        // --- LEVEL 1: REAL HARDWARE GPS ---
        if ('geolocation' in navigator) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              const coords = {
                lat: position.coords.latitude.toFixed(5),
                lng: position.coords.longitude.toFixed(5),
                speed: (position.coords.speed * 3.6).toFixed(1) || 0, // m/s to km/h
                accuracy: position.coords.accuracy.toFixed(0) + 'm'
              };
              setLiveGps(coords);
              setGpsError(null);

              if (socket) {
                socket.emit('smartphone_gps_stream', {
                  driver_id: profile?.employee_id, bus_id: activeTrip.registration_number,
                  latitude: coords.lat, longitude: coords.lng, speed: coords.speed, timestamp: new Date().toISOString()
                });
              }
            },
            (error) => setGpsError(error.message),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          setGpsError("GPS completely unsupported on this device");
        }
      } else {
        // --- LEVEL 2: PURE WEB SIMULATION (Dead Reckoning) ---
        // Simulating Erode to Salem slowly over time...
        let curLat = 11.34100;
        let curLng = 77.71720;
        const targetLat = 11.66430;
        const targetLng = 78.14600;

        // Step size (Move slightly every 2 seconds)
        const stepLat = (targetLat - curLat) / 200;
        const stepLng = (targetLng - curLng) / 200;

        setLiveGps({ lat: curLat.toFixed(5), lng: curLng.toFixed(5), speed: "0.0", accuracy: "Simulation Engine" });
        setGpsError(null);

        simInterval = setInterval(() => {
          curLat += stepLat;
          curLng += stepLng;

          // Loop back to start if destination reached for demo purposes
          if (curLat > targetLat) { curLat = 11.34100; curLng = 77.71720; }

          const fakeVariation = (Math.random() * 4 - 2).toFixed(1);
          const speed = (55.4 + parseFloat(fakeVariation)).toFixed(1); // Simulate real bus speed variations

          const coords = { lat: curLat.toFixed(5), lng: curLng.toFixed(5), speed: speed, accuracy: 'Simulated Engine' };
          setLiveGps(coords);

          if (socket) {
            socket.emit('smartphone_gps_stream', {
              driver_id: profile?.employee_id, bus_id: activeTrip.registration_number,
              latitude: coords.lat, longitude: coords.lng, speed: coords.speed, timestamp: new Date().toISOString()
            });
          }
        }, 2000); // Update coordinates every 2 seconds via AI math
      }
    }

    // Always clean up trackers when switching modes or ending trips
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (simInterval !== null) clearInterval(simInterval);
    };
  }, [activeTrip?.status, useHardwareGps, socket, profile]);

  const fetchDriverInit = async () => {
    try {
      setLoading(true);
      const [profRes, tripsRes] = await Promise.all([
        axios.get('/api/driver/profile').catch(() => ({ data: {} })),
        axios.get('/api/driver/trips/today').catch(() => ({ data: { trips: [] } }))
      ]);
      setProfile(profRes.data);

      let fetchedTrips = tripsRes.data.trips || [];

      // FALLBACK MOCK: If the backend hasn't assigned any trips for this specific date, inject a Live Demo Trip so you can test features
      if (fetchedTrips.length === 0) {
        fetchedTrips = [{
          trip_id: 'DEMO-999',
          registration_number: 'TN-33-N-1122',
          route_name: 'Erode H.S ➔ Salem New Stand',
          source_city: 'Erode',
          destination_city: 'Salem',
          status: 'Scheduled',
          scheduled_departure: 'Today 1:40 PM'
        }];
      }

      setTodayTrips(fetchedTrips);

      // Determine if there is a currently running trip
      const running = fetchedTrips.find(t => t.status === 'Running' || t.status === 'Delayed');
      if (running && !activeTrip) {
        fetchTripDetails(running.trip_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripDetails = async (trip_id) => {
    try {
      if (trip_id === 'DEMO-999') {
        setActiveTrip({
          trip_id: 'DEMO-999', registration_number: 'TN-33-N-1122', route_name: 'Erode to Salem',
          source_city: 'Erode', destination_city: 'Salem', status: 'Scheduled', delay_mins: 0
        });
        setTripStops([
          { stop_id: 1, stop_name: 'Erode Main Terminus', stop_order: 1 },
          { stop_id: 2, stop_name: 'Bhavani Junction', stop_order: 2 },
          { stop_id: 3, stop_name: 'Salem New Stand', stop_order: 3 }
        ]);
        setActiveTab('trip');
        return;
      }

      const res = await axios.get(`/api/driver/trips/${trip_id}`);
      setActiveTrip(res.data.trip);
      setTripStops(res.data.stops);
      setActiveTab('trip');
    } catch (e) {
      alert('Error fetching trip details');
    }
  };

  const toggleChecklist = (key) => setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  const isChecklistComplete = Object.values(checklist).every(Boolean);

  const handleStartTrip = async (trip_id) => {
    if (!isChecklistComplete) {
      return alert("Please complete the pre-trip safety check first.");
    }
    try {
      if (trip_id === 'DEMO-999') {
        setActiveTrip(prev => ({ ...prev, status: 'Running' }));
        return;
      }
      const payload = Object.keys(checklist).map(k => ({ item: k, ok: checklist[k] }));
      await axios.post(`/api/driver/trips/${trip_id}/start`, { checklist: payload });
      fetchTripDetails(trip_id);
    } catch (e) {
      alert(e.response?.data?.error || 'Error starting trip');
    }
  };

  const handleEndTrip = async (trip_id) => {
    if (window.confirm("Are you sure you want to end this trip?")) {
      try {
        if (trip_id === 'DEMO-999') {
          setActiveTrip(null);
          setChecklist({ brakes: false, lights: false, horn: false, tyres: false, mirrors: false, doors: false, emergency_equipment: false, fuel_battery: false, vehicle_condition: false });
          setActiveTab('home');
          return;
        }
        await axios.post(`/api/driver/trips/${trip_id}/end`);
        setActiveTrip(null);
        setChecklist({ brakes: false, lights: false, horn: false, tyres: false, mirrors: false, doors: false, emergency_equipment: false, fuel_battery: false, vehicle_condition: false });
        setActiveTab('home');
      } catch (e) {
        alert(e.response?.data?.error || 'Error ending trip');
      }
    }
  };

  const submitReport = async () => {
    if (!reportMsg) return alert('Please enter a description');
    try {
      await axios.post('/api/driver/report', {
        type: reportingType,
        trip_id: activeTrip?.trip_id || null,
        message: reportMsg,
        location: "GPS Coordinates TBD",
        severity: reportingType === 'Emergency' ? 'Critical' : 'High'
      });
      alert(`${reportingType} Reported Successfully! Depot Admin has been notified.`);
      setReportingType(null);
      setReportMsg('');
      if (activeTrip) fetchTripDetails(activeTrip.trip_id);
    } catch (e) {
      alert('Error submitting report');
    }
  };

  const renderHome = () => (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-2">Good Morning, {profile?.name}</h2>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="bg-slate-800 px-2 py-1 rounded">Depot: {profile?.depot}</span>
          <span className="bg-slate-800 px-2 py-1 rounded">ID: {profile?.employee_id || profile?.license_number}</span>
        </div>
      </div>

      <h3 className="font-extrabold text-slate-300 uppercase tracking-widest text-xs px-2">Today's Assignments</h3>

      <div className="space-y-4">
        {todayTrips.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 text-center text-slate-500">
            No trips assigned for today yet.
          </div>
        ) : (
          todayTrips.map(t => (
            <div key={t.trip_id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 bg-slate-800/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-400 font-bold text-sm">{t.scheduled_departure?.split(' ')[1] || '08:00 AM'}</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${t.status === 'Running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>{t.status}</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-1">{t.source_city} &rarr; {t.destination_city}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <Bus className="w-3.5 h-3.5" /> Bus: {t.registration_number || 'TBD'} | Route {t.route_name}
                </div>
              </div>
              <div className="p-3 bg-slate-950 flex justify-end gap-2">
                {(t.status === 'Scheduled' || t.status === 'Running' || t.status === 'Delayed') && (
                  <button onClick={() => fetchTripDetails(t.trip_id)} className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm px-6 py-2 rounded-lg transition shadow-md w-full">
                    {t.status === 'Scheduled' ? 'Start Pre-Trip Check' : 'Resume Trip'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderActiveTrip = () => {
    if (!activeTrip) return <div className="text-white">Loading Trip...</div>;

    if (activeTrip.status === 'Scheduled') {
      // PRE-TRIP CHECKLIST PHASE
      return (
        <div className="space-y-6 max-w-lg mx-auto pb-20">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-2">Trip #{activeTrip.trip_id}</h2>
            <p className="text-slate-400 text-sm mb-4">{activeTrip.source_city} to {activeTrip.destination_city} • Bus {activeTrip.registration_number}</p>

            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg mb-6">
              <h3 className="text-rose-400 font-bold text-sm flex items-center gap-2 mb-2"><CheckSquare className="w-4 h-4" /> Pre-Trip Safety Check</h3>
              <p className="text-xs text-slate-300 mb-4">You must verify the condition of the bus before beginning the trip.</p>

              <div className="grid grid-cols-2 gap-2">
                {Object.keys(checklist).map(key => (
                  <button key={key} onClick={() => toggleChecklist(key)} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold text-left transition ${checklist[key] ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                    <div className={`w-4 h-4 flex items-center justify-center rounded-sm ${checklist[key] ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      {checklist[key] && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    {key.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleStartTrip(activeTrip.trip_id)}
              disabled={!isChecklistComplete}
              className={`w-full py-4 rounded-xl font-black text-lg transition shadow-lg ${isChecklistComplete ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              START TRIP
            </button>
            <button onClick={() => setReportingType('Breakdown')} className="w-full mt-3 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition">Report Initial Problem</button>
          </div>
        </div>
      );
    }

    // RUNNING TRIP PHASE
    return (
      <div className="space-y-6 max-w-lg mx-auto pb-24">

        {/* Tracker Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Live Tracker Mode:</span>
          <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setUseHardwareGps(false)}
              className={`text-[10px] px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${!useHardwareGps ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Web Sim
            </button>
            <button
              onClick={() => setUseHardwareGps(true)}
              className={`text-[10px] px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${useHardwareGps ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Hardware GPS
            </button>
          </div>
        </div>

        {/* Dynamic GPS emulation header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg relative overflow-hidden">
          <div className={`${useHardwareGps ? 'bg-amber-500/10 border-b border-amber-500/30' : 'bg-emerald-500/10 border-b border-emerald-500/30'} p-2 flex justify-between items-center px-4 transition-colors`}>
            <div className="flex items-center gap-2">
              <Smartphone className={`w-4 h-4 ${useHardwareGps ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className={`text-xs font-bold ${useHardwareGps ? 'text-amber-400' : 'text-emerald-400'}`}>
                {useHardwareGps ? 'Live Real Hardware GPS Active' : 'AI Route Web Tracker Active'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${useHardwareGps ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
              <span className={`text-[10px] font-mono ${useHardwareGps ? 'text-amber-300' : 'text-emerald-300'}`}>STREAMING</span>
            </div>
          </div>

          <div className="p-5">
            <h2 className="text-xl font-extrabold text-white mb-1"><span className="text-brand-400">#</span> {activeTrip.source_city} &rarr; {activeTrip.destination_city}</h2>

            {/* Live Real GPS Coordinates Box */}
            <div className="bg-slate-950 rounded-lg p-3 my-4 border border-slate-800 font-mono text-xs text-slate-300 grid grid-cols-2 gap-2 shadow-inner">
              <div className="text-slate-500 col-span-2 uppercase text-[9px] tracking-widest font-bold">
                {useHardwareGps ? 'Sensor Telemetry Data' : 'Algorithmic Simulation Data'}
              </div>

              {gpsError ? (
                <div className="col-span-2 text-rose-400">⚠️ Error: {gpsError} (Ensure Location Permission is ON)</div>
              ) : !liveGps ? (
                <div className="col-span-2 text-amber-400 animate-pulse">Acquiring Signals...</div>
              ) : (
                <>
                  <div>Lat: <span className="text-emerald-400 font-bold">{liveGps.lat}</span></div>
                  <div>Lng: <span className="text-emerald-400 font-bold">{liveGps.lng}</span></div>
                  <div>Spd: <span className="text-white font-bold">{liveGps.speed} km/h</span></div>
                  <div>Acc: <span className="text-slate-400">{liveGps.accuracy}</span></div>
                </>
              )}
            </div>

            <div className="text-xs text-slate-400 mb-4 font-mono">TRIP: {activeTrip.trip_id} | BUS: {activeTrip.registration_number}</div>

            <div className="flex gap-4 mb-2">
              <div className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Status</div>
                <div className={`font-bold ${activeTrip.delay_mins > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{activeTrip.status}</div>
              </div>
              <div className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Delay</div>
                <div className="font-bold text-white">{activeTrip.delay_mins > 0 ? `+${activeTrip.delay_mins} min` : 'On Time'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stop Navigation list mock */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="font-bold text-slate-300 mb-4 text-sm flex items-center gap-2"><Navigation className="w-4 h-4" /> Next Stops</h3>
          <div className="space-y-4 relative">
            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-800" />
            {tripStops.slice(0, 3).map((stop, i) => (
              <div key={stop.stop_id} className="relative z-10 flex gap-4 items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-4 border-slate-900 ${i === 0 ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                  <h4 className={`font-bold ${i === 0 ? 'text-white' : 'text-slate-400'} text-sm`}>{stop.stop_name}</h4>
                  <div className="text-xs text-slate-500 flex justify-between mt-1">
                    <span>ETA: {activeTrip.scheduled_arrival?.split(' ')[1] || 'In 15 mins'}</span>
                    {i === 0 && <button className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Confirm Arrived</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setReportingType('Delay')} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg flex flex-col items-center gap-2 transition">
            <Clock className="w-6 h-6" /> REPORT DELAY
          </button>
          <button onClick={() => setReportingType('Breakdown')} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg flex flex-col items-center gap-2 transition">
            <Wrench className="w-6 h-6" /> BREAKDOWN
          </button>
        </div>

        <button onClick={() => setReportingType('Emergency')} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-rose-400 flex justify-center items-center gap-2 transition">
          <AlertOctagon className="w-6 h-6" /> EMERGENCY
        </button>

        <button onClick={() => handleEndTrip(activeTrip.trip_id)} className="w-full mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-4 rounded-xl transition">
          END TRIP
        </button>
      </div >
    );
  };

  const renderReportingModal = () => {
    if (!reportingType) return null;
    let title = ""; let color = ""; let placeholder = "";
    if (reportingType === 'Delay') { title = "Report Delay"; color = "text-amber-400 border-amber-500/30"; placeholder = "Cause of delay (Traffic, Weather, etc.)"; }
    if (reportingType === 'Breakdown') { title = "Vehicle Breakdown"; color = "text-orange-400 border-orange-500/30"; placeholder = "Describe vehicle problem (Engine, Tyre, etc.)"; }
    if (reportingType === 'Emergency') { title = "CRITICAL EMERGENCY"; color = "text-rose-500 font-black border border-rose-500 bg-rose-950/50 shadow-[0_0_30px_rgba(225,29,72,0.4)]"; placeholder = "Details of accident or severe emergency!!"; }

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className={`w-full max-w-sm bg-slate-900 border rounded-2xl p-6 ${color}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            {reportingType === 'Emergency' ? <AlertOctagon /> : <AlertTriangle />} {title}
          </h2>
          <p className="text-xs text-slate-300 mb-4 text-white">This operational alert will be dispatched instantly to the Depot Admin.</p>

          <textarea
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-brand-500 h-28 mb-4 resize-none"
            placeholder={placeholder}
            value={reportMsg}
            onChange={(e) => setReportMsg(e.target.value)}
          />

          <div className="flex gap-3">
            <button onClick={() => setReportingType(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 transition">Cancel</button>
            <button onClick={submitReport} className={`flex-1 py-3 rounded-xl font-bold text-white transition ${reportingType === 'Emergency' ? 'bg-rose-600' : 'bg-brand-600'}`}>Submit Alert</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:max-w-md md:mx-auto md:border-x md:border-slate-800 md:shadow-2xl overflow-hidden relative">
      {/* Mobile Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-5 flex items-center justify-between h-14 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-brand-500" />
          <span className="font-extrabold text-white uppercase tracking-widest text-sm">TNSTC DRIVER</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 w-full relative z-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          activeTab === 'home' ? renderHome() : renderActiveTrip()
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <footer className="fixed md:absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 h-16 flex items-center px-6 justify-between rounded-t-2xl z-20">
        <button onClick={() => { setActiveTab('home'); setActiveTrip(null); fetchDriverInit(); }} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-brand-400' : 'text-slate-500'}`}>
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Schedule</span>
        </button>

        {activeTrip && (
          <button onClick={() => setActiveTab('trip')} className="-mt-6 bg-brand-600 hover:bg-brand-500 text-white w-14 h-14 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-lg shadow-brand-500/30 transition transform hover:scale-105 relative">
            <Navigation className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
          </button>
        )}

        <button className="flex flex-col items-center gap-1 text-slate-500">
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
        </button>
      </footer>

      {renderReportingModal()}
    </div>
  );
};

export default DriverDashboard;
