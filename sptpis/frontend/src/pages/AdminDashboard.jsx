import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import FleetMap from '../components/Map/FleetMap';
import { 
  ShieldAlert, Bus, Users, MapPin, BarChart3, TrendingUp, 
  DollarSign, Activity, CheckCircle2, AlertTriangle, Clock, 
  Search, Eye, Filter, RefreshCw 
} from 'lucide-react';

const AdminDashboard = () => {
  const { liveBuses, isConnected } = useSocket();

  const [fleetData, setFleetData] = useState({ summary: {}, buses: [] });
  const [analytics, setAnalytics] = useState(null);
  const [transportTab, setTransportTab] = useState('fleet_map'); // 'fleet_map', 'analytics', 'buses', 'drivers', 'routes', 'bookings'

  // Transport CRUD Tables state
  const [busesList, setBusesList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [routesList, setRoutesList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [fleetRes, anRes, bRes, dRes, rRes, bkRes] = await Promise.all([
        axios.get('/api/admin/fleet'),
        axios.get('/api/admin/analytics'),
        axios.get('/api/admin/buses'),
        axios.get('/api/admin/drivers'),
        axios.get('/api/admin/routes'),
        axios.get('/api/admin/bookings')
      ]);

      setFleetData(fleetRes.data);
      setAnalytics(anRes.data);
      setBusesList(bRes.data || []);
      setDriversList(dRes.data || []);
      setRoutesList(rRes.data || []);
      setBookingsList(bkRes.data || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Merge Socket.IO live buses into fleetData
  const mergedFleetBuses = (fleetData.buses || []).map((bus) => ({
    ...bus,
    ...(liveBuses[bus.bus_id] || {})
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner: Admin Header & Quick Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
              TNSTC Control Center
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-2 flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-brand-500" />
              <span>Admin Transport Management & Live Fleet Command</span>
            </h2>
          </div>
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400">Total TNSTC Fleet</span>
            <p className="text-2xl font-extrabold text-white mt-1">
              {mergedFleetBuses.length || 4} <span className="text-xs font-normal text-slate-400">buses</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
            <span className="text-xs text-slate-400">Active / On-Time</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">
              {mergedFleetBuses.filter(b => b.status === 'Active').length || 4}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-brand-500/30">
            <span className="text-xs text-slate-400">Weekly Revenue (INR)</span>
            <p className="text-2xl font-extrabold text-brand-400 mt-1">
              ₹{(analytics?.summary?.total_revenue_inr || 4857600).toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30">
            <span className="text-xs text-slate-400">Avg Fleet Occupancy</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">
              {analytics?.summary?.avg_fleet_occupancy || 78.4}%
            </p>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'fleet_map', label: 'Live Fleet Monitoring (All Buses Map)', icon: Activity },
          { id: 'analytics', label: 'Analytics & Revenue Charts', icon: BarChart3 },
          { id: 'buses', label: 'Manage Buses', icon: Bus },
          { id: 'drivers', label: 'Manage Drivers', icon: Users },
          { id: 'routes', label: 'Manage Routes', icon: MapPin },
          { id: 'bookings', label: 'Passenger Bookings', icon: CheckCircle2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = transportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTransportTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE FLEET MONITORING (ALL BUSES ON ONE MAP) */}
      {transportTab === 'fleet_map' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Tamil Nadu Statewide Live Fleet Map
                </h3>
                <p className="text-xs text-slate-400">
                  Displays live locations, route progress, active buses, and simulated emergency/delayed status in real-time.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  Active ({mergedFleetBuses.filter(b => b.status === 'Active').length})
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Delayed ({mergedFleetBuses.filter(b => b.status === 'Delayed').length})
                </span>
              </div>
            </div>

            {/* Interactive All-Bus Leaflet Map */}
            <FleetMap buses={mergedFleetBuses} />

            {/* Fleet Status Summary Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mergedFleetBuses.map((b) => (
                <div key={b.bus_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-brand-500/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-white text-sm">
                      {b.registration_number}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        b.status === 'Emergency'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : b.status === 'Delayed'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">
                    <b>Route:</b> {b.route_name || b.source_city + ' - ' + b.destination_city}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                    <span>Speed: <b className="text-white">{b.speed_kmh || 58} km/h</b></span>
                    <span>Load: <b className="text-emerald-400">{b.occupancy_percentage || 57}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS DASHBOARD (DAILY PASSENGERS, ROUTE POPULARITY, PEAK HOURS, REVENUE) */}
      {transportTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Row 1: Daily Passengers Chart & Peak Hour Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Daily Passengers & Revenue Chart (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
                    Weekly Demand Analytics
                  </span>
                  <h3 className="font-extrabold text-white text-base mt-0.5">
                    Daily Passengers & Revenue Trend
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Mon - Sun</span>
              </div>

              {/* Custom Animated Bar Chart */}
              <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-800 px-2">
                {(analytics.daily_passengers || []).map((d, i) => {
                  const heightPct = Math.round((d.passengers / 6500) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] text-brand-400 font-bold opacity-0 group-hover:opacity-100 transition">
                        {d.passengers}
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-500 group-hover:from-emerald-600 group-hover:to-emerald-400 transition-all duration-500 shadow-md"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-xs font-bold text-slate-400">{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Peak Weekday: <b className="text-white">Saturday (6,450 passengers)</b></span>
                <span>Total Weekly Revenue: <b className="text-emerald-400">₹48,57,600</b></span>
              </div>
            </div>

            {/* Peak Hour Analysis (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Time-of-Day Profile
                </span>
                <h3 className="font-extrabold text-white text-base mt-0.5">
                  Peak Hour Occupancy Analysis (%)
                </h3>
              </div>

              <div className="space-y-3">
                {(analytics.peak_hours || []).map((p, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{p.hour} Hrs</span>
                      <span className="font-bold text-amber-400">{p.occupancy}% Load</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.occupancy > 85 ? 'bg-rose-500' : p.occupancy > 70 ? 'bg-amber-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${p.occupancy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Route Popularity Table & Occupancy Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-extrabold text-white text-base mb-4">
                Route Popularity & Revenue Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-2">Route Name</th>
                      <th className="py-3 px-2">Trips/Week</th>
                      <th className="py-3 px-2">Avg Occupancy</th>
                      <th className="py-3 px-2 text-right">Revenue (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(analytics.route_popularity || []).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-bold text-white">{r.route}</td>
                        <td className="py-3 px-2 text-slate-300">{r.trips}</td>
                        <td className="py-3 px-2">
                          <span className="text-emerald-400 font-bold">{r.avg_occupancy}%</span>
                        </td>
                        <td className="py-3 px-2 text-right font-extrabold text-brand-400">
                          ₹{r.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-extrabold text-white text-base mb-4">
                Passenger Type Classification
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Reserved Passengers (Online)</span>
                    <b className="text-white">58%</b>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full" style={{ width: '58%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Normal Direct Boarding</span>
                    <b className="text-white">32%</b>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '32%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Women Free Scheme (Pink Buses)</span>
                    <b className="text-pink-400">10%</b>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-pink-500 h-full" style={{ width: '10%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE BUSES TABLE */}
      {transportTab === 'buses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-white text-base">
              TNSTC Registered Fleet ({busesList.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Registration #</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Seats</th>
                  <th className="py-3 px-2">Assigned Driver</th>
                  <th className="py-3 px-2">Route Name</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {busesList.map((b) => (
                  <tr key={b.bus_id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-2 text-slate-400">#{b.bus_id}</td>
                    <td className="py-3 px-2 font-bold text-white">{b.registration_number}</td>
                    <td className="py-3 px-2 text-brand-400">{b.bus_type}</td>
                    <td className="py-3 px-2 text-slate-300">{b.total_seats}</td>
                    <td className="py-3 px-2 text-slate-300">{b.driver_name || 'Unassigned'}</td>
                    <td className="py-3 px-2 text-slate-300">{b.route_name || 'Dharmapuri - Sathyamangalam'}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MANAGE DRIVERS TABLE */}
      {transportTab === 'drivers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-extrabold text-white text-base mb-4">
            Registered Drivers ({driversList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Badge #</th>
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">License</th>
                  <th className="py-3 px-2">Depot</th>
                  <th className="py-3 px-2">Experience</th>
                  <th className="py-3 px-2">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {driversList.map((d) => (
                  <tr key={d.driver_id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-2 font-bold text-brand-400">{d.badge_number}</td>
                    <td className="py-3 px-2 font-semibold text-white">{d.name}</td>
                    <td className="py-3 px-2 text-slate-300">{d.license_number}</td>
                    <td className="py-3 px-2 text-slate-300">{d.depot}</td>
                    <td className="py-3 px-2 text-slate-300">{d.experience_years} yrs</td>
                    <td className="py-3 px-2 text-amber-400 font-bold">★ {d.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MANAGE ROUTES TABLE */}
      {transportTab === 'routes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-extrabold text-white text-base mb-4">
            Tamil Nadu Transport Routes ({routesList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Route Code</th>
                  <th className="py-3 px-2">Route Name</th>
                  <th className="py-3 px-2">Source</th>
                  <th className="py-3 px-2">Destination</th>
                  <th className="py-3 px-2">Distance</th>
                  <th className="py-3 px-2">Duration</th>
                  <th className="py-3 px-2">Base Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {routesList.map((r) => (
                  <tr key={r.route_id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-2 font-bold text-brand-400">{r.route_code}</td>
                    <td className="py-3 px-2 font-semibold text-white">{r.name}</td>
                    <td className="py-3 px-2 text-slate-300">{r.source_city}</td>
                    <td className="py-3 px-2 text-slate-300">{r.destination_city}</td>
                    <td className="py-3 px-2 text-slate-300">{r.total_distance_km} km</td>
                    <td className="py-3 px-2 text-slate-300">{r.estimated_duration_mins} mins</td>
                    <td className="py-3 px-2 text-emerald-400 font-bold">₹{r.base_fare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PASSENGER BOOKINGS TABLE */}
      {transportTab === 'bookings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-extrabold text-white text-base mb-4">
            Recent Passenger Bookings ({bookingsList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Ref Code</th>
                  <th className="py-3 px-2">Passenger</th>
                  <th className="py-3 px-2">Seat</th>
                  <th className="py-3 px-2">Boarding → Destination</th>
                  <th className="py-3 px-2">Bus #</th>
                  <th className="py-3 px-2">Fare Paid</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookingsList.map((bk) => (
                  <tr key={bk.booking_id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-2 font-bold text-brand-400">{bk.booking_reference}</td>
                    <td className="py-3 px-2 font-semibold text-white">{bk.passenger_name || 'S. Karthik'}</td>
                    <td className="py-3 px-2 font-bold text-white">{bk.seat_number}</td>
                    <td className="py-3 px-2 text-slate-300">{bk.boarding_stop} → {bk.destination_stop}</td>
                    <td className="py-3 px-2 text-slate-300">{bk.registration_number || 'TN-29-N-1542'}</td>
                    <td className="py-3 px-2 text-emerald-400 font-bold">₹{bk.fare_paid}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {bk.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
