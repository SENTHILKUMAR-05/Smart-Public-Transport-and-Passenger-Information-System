import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Building, Bus, Users, Activity, Wrench, AlertTriangle,
    MapPin, CheckCircle2, History, MessageSquare, Briefcase,
    Navigation, CalendarClock, PhoneCall, Bell, X, CheckCircle
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, active, onClick, hasSubItems, badgeCount }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
            ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
    >
        <Icon className="w-4 h-4" />
        <span className="flex-1 text-left">{label}</span>
        {badgeCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{badgeCount}</span>
        )}
        {hasSubItems && <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tab</span>}
    </button>
);

const DepotAdminDashboard = () => {
    const { user } = useAuth();
    const [activeMenu, setActiveMenu] = useState('overview');
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { liveBuses, socket } = useSocket();

    const [fleet, setFleet] = useState([]);
    const [staff, setStaff] = useState([]);
    const [trips, setTrips] = useState([]);
    const [tripsDate, setTripsDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [maintenance, setMaintenance] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [complaints, setComplaints] = useState([]);

    const [assignmentForm, setAssignmentForm] = useState({
        trip_id: null,
        route_id: '',
        date: '',
        time: '',
        bus_id: '',
        driver_id: '',
        conductor_id: ''
    });
    const [availableForAssign, setAvailableForAssign] = useState({ routes: [], buses: [], drivers: [], conductors: [] });

    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffForm, setStaffForm] = useState({ name: '', phone: '', employee_code: '', type: 'Driver', status: 'Active' });

    const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
    const [editingFleet, setEditingFleet] = useState(null);
    const [fleetForm, setFleetForm] = useState({ registration_number: '', bus_type: 'Town Bus', total_seats: 54, gps_device_id: '', status: 'Active' });

    const handleFleetSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFleet) {
                await axios.put(`/api/depot/buses/${editingFleet.bus_id}`, fleetForm);
            } else {
                await axios.post('/api/depot/buses', fleetForm);
            }
            setIsFleetModalOpen(false);
            setEditingFleet(null);
            loadTabData('fleet');
        } catch (error) {
            console.error('Error saving bus:', error);
            const errMsg = error.response?.data?.error || error.message || 'Unknown error';
            alert('Failed to save bus: ' + errMsg);
        }
    };

    const handleFleetDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this bus?')) return;
        try {
            await axios.delete(`/api/depot/buses/${id}`);
            loadTabData('fleet');
        } catch (error) {
            console.error('Error deleting bus:', error);
            alert('Failed to delete bus');
        }
    };

    const openFleetModal = (bus = null) => {
        if (bus) {
            setEditingFleet(bus);
            setFleetForm({
                registration_number: bus.registration_number || '',
                bus_type: bus.bus_type || 'Town Bus',
                total_seats: bus.total_seats || 54,
                gps_device_id: bus.gps_device_id || '',
                status: bus.status || 'Active'
            });
        } else {
            setEditingFleet(null);
            setFleetForm({ registration_number: '', bus_type: 'Town Bus', total_seats: 54, gps_device_id: '', status: 'Active' });
        }
        setIsFleetModalOpen(true);
    };

    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStaff) {
                await axios.put(`/api/depot/staff/${editingStaff.id}`, staffForm);
            } else {
                await axios.post('/api/depot/staff', staffForm);
            }
            setIsStaffModalOpen(false);
            setEditingStaff(null);
            loadTabData('staff');
        } catch (error) {
            console.error('Error saving staff:', error);
            const errMsg = error.response?.data?.error || error.message || 'Unknown error';
            alert('Failed to save staff: ' + errMsg);
        }
    };

    const handleStaffDelete = async (id, type) => {
        if (!window.confirm(`Are you sure you want to remove this ${type}?`)) return;
        try {
            await axios.delete(`/api/depot/staff/${id}?type=${type}`);
            loadTabData('staff');
        } catch (error) {
            console.error('Error deleting staff:', error);
            alert('Failed to delete staff');
        }
    };

    const openStaffModal = (staffMember = null) => {
        if (staffMember) {
            setEditingStaff(staffMember);
            setStaffForm({
                name: staffMember.name || '',
                phone: staffMember.phone || '',
                employee_code: staffMember.employee_code || '',
                type: staffMember.type || 'Driver',
                status: staffMember.status || 'Active'
            });
        } else {
            setEditingStaff(null);
            setStaffForm({ name: '', phone: '', employee_code: '', type: 'Driver', status: 'Active' });
        }
        setIsStaffModalOpen(true);
    };

    // Driver Garage Maintenance Real-time Tickets & Pop-up Notification
    const [activePopupNotif, setActivePopupNotif] = useState(null);
    const [driverGarageTickets, setDriverGarageTickets] = useState([]);

    useEffect(() => {
        fetchInitialData();
        loadDriverGarageTickets();

        // 1. Listen for custom window event dispatched when a driver submits a garage query
        const handleNewGarageTicket = (e) => {
            const ticket = e.detail;
            if (ticket) {
                setDriverGarageTickets(prev => [ticket, ...prev]);
                setActivePopupNotif(ticket);
            }
        };

        // 2. Listen for localStorage changes across browser tabs
        const handleStorageChange = () => {
            loadDriverGarageTickets();
        };

        window.addEventListener('sptpis_new_garage_ticket', handleNewGarageTicket);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('sptpis_new_garage_ticket', handleNewGarageTicket);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const loadDriverGarageTickets = () => {
        try {
            const stored = localStorage.getItem('sptpis_garage_tickets');
            if (stored) {
                setDriverGarageTickets(JSON.parse(stored));
            } else {
                // Initial Default Driver Garage Tickets
                const initial = [
                    { id: 'MNT-1042', issue: 'Front door pneumatic seal check & air leak', driver_name: 'K. Murugan', driver_id: 'TNSTC-DRV-8821', bus: 'TN-33-N-1122', severity: 'High', status: 'In Progress', mechanic: 'R. Periasamy', time: '10:15 AM', date: 'Today' },
                    { id: 'MNT-1018', issue: 'Clutch pedal stiffness & oil level low', driver_name: 'S. Rajan', driver_id: 'TNSTC-DRV-4412', bus: 'TN-33-N-0988', severity: 'Critical', status: 'Open', mechanic: 'Unassigned', time: '08:40 AM', date: 'Today' },
                    { id: 'MNT-0994', issue: 'Headlight low-beam bulb replacement', driver_name: 'V. Sundaram', driver_id: 'TNSTC-DRV-1102', bus: 'TN-33-N-1455', severity: 'Medium', status: 'Resolved', mechanic: 'M. Arumugam', time: 'Yesterday', date: 'Yesterday' }
                ];
                setDriverGarageTickets(initial);
                localStorage.setItem('sptpis_garage_tickets', JSON.stringify(initial));
            }
        } catch (e) { }
    };

    const updateTicketStatus = (ticketId, newStatus, mechanicName) => {
        setDriverGarageTickets(prev => {
            const updated = prev.map(t => t.id === ticketId ? { ...t, status: newStatus, mechanic: mechanicName || t.mechanic || 'Assigned Mechanic' } : t);
            localStorage.setItem('sptpis_garage_tickets', JSON.stringify(updated));
            return updated;
        });
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/depot/dashboard');
            setDashboardData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadTabData = async (menu) => {
        setActiveMenu(menu);
        try {
            if (menu === 'trips') {
                // Fetch trips specifically matching the chosen filter date, with cache burster
                const ts = Date.now();
                const res = await axios.get(`/api/depot/trips?date=${dateParam || tripsDate}&_t=${ts}`);
                setTrips(res.data);
            } else if (menu === 'fleet') {
                const res = await axios.get('/api/depot/buses');
                setFleet(res.data);
            } else if (menu === 'staff') {
                const res = await axios.get('/api/depot/staff');
                setStaff(res.data);
            } else if (menu === 'maintenance') {
                const res = await axios.get('/api/depot/maintenance');
                setMaintenance(res.data);
            } else if (menu === 'incidents') {
                const res = await axios.get('/api/depot/incidents');
                setIncidents(res.data);
            } else if (menu === 'complaints') {
                const res = await axios.get('/api/depot/complaints');
                setComplaints(res.data);
            } else if (menu === 'assign') {
                const routesRes = await axios.get('/api/depot/routes');
                setAvailableForAssign(prev => ({ ...prev, routes: routesRes.data }));
            } else if (menu === 'all-trips') {
                const ts = Date.now();
                const res = await axios.get(`/api/depot/all-trips?_t=${ts}`);
                setTrips(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAssignFormChange = async (field, value) => {
        setAssignmentForm(prev => {
            const nextForm = { ...prev, [field]: value };
            if ((field === 'date' || field === 'time') && nextForm.date && nextForm.time) {
                // Fetch available resources when date/time are set
                axios.get(`/api/depot/available-resources?date=${nextForm.date}&time=${nextForm.time}`).then(res => {
                    setAvailableForAssign(p => ({
                        ...p,
                        buses: res.data.buses,
                        drivers: res.data.drivers,
                        conductors: res.data.conductors
                    }));
                }).catch(console.error);
            }
            return nextForm;
        });
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            if (assignmentForm.trip_id) {
                await axios.put(`/api/depot/trips/${assignmentForm.trip_id}`, assignmentForm);
                alert('Trip modified successfully!');
            } else {
                await axios.post('/api/depot/assign-trip', assignmentForm);
                alert('Trip assigned successfully!');
            }

            const assignedDate = assignmentForm.date;
            setAssignmentForm({ trip_id: null, route_id: '', date: '', time: '', bus_id: '', driver_id: '', conductor_id: '' });

            // UX Polish: Instantly set Trips Date filter to the newly assigned date and load it.
            setTripsDate(assignedDate);
            loadTabData('trips', assignedDate);
        } catch (error) {
            alert('Failed to save trip: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleTripDelete = async (id) => {
        if (!window.confirm('Are you sure you want to completely delete this assigned trip?')) return;
        try {
            await axios.delete(`/api/depot/trips/${id}`);
            if (activeMenu === 'all-trips') loadTabData('all-trips');
            else loadTabData('trips', tripsDate);
        } catch (error) {
            alert('Failed to delete trip.');
        }
    };

    const openModifyTrip = async (t) => {
        const datetime = t.scheduled_departure || "2026-01-01 10:00";
        const dateStr = datetime.split(' ')[0];
        const timeStr = datetime.split(' ')[1] || "00:00";

        setAssignmentForm({
            trip_id: t.trip_id,
            route_id: t.route_id,
            date: dateStr,
            time: timeStr,
            bus_id: t.bus_id,
            driver_id: t.driver_id,
            conductor_id: t.conductor_id
        });

        await loadTabData('assign');
        // Instantly manually trigger available resources so dropdowns are populated
        try {
            const res = await axios.get(`/api/depot/available-resources?date=${dateStr}&time=${timeStr}`);
            setAvailableForAssign(p => ({
                ...p,
                buses: res.data.buses,
                drivers: res.data.drivers,
                conductors: res.data.conductors
            }));
        } catch (e) { console.error(e); }
    };

    // Keep trips live-updated if users change the date filter
    useEffect(() => {
        if (activeMenu === 'trips') {
            loadTabData('trips', tripsDate);
        }
    }, [tripsDate]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex h-full items-center justify-center">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-white rounded-full animate-spin"></div>
                </div>
            );
        }

        switch (activeMenu) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wider text-xs px-2 py-1 rounded">Depot Administration</span>
                                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-2">
                                    <Building className="w-6 h-6 text-white" />
                                    {dashboardData?.depot?.name || 'Dharmapuri Depot'}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Region: {dashboardData?.depot?.region_name || 'N/A'} | Corporation: {dashboardData?.depot?.corporation_name || 'N/A'}</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-sm font-bold text-slate-300">Operations Active</span>
                                </div>
                                <span className="text-xs text-slate-500 mt-1">Depot ID: {user?.depot_id}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard title="Total Buses" value={dashboardData?.total_buses || 0} icon={Bus} color="border-slate-700 text-slate-300" />
                            <MetricCard title="Scheduled Trips" value={dashboardData?.scheduled_trips || 0} icon={CalendarClock} color="border-emerald-500/30 text-emerald-400" />
                            <MetricCard title="Open Incidents" value={dashboardData?.open_incidents || 0} icon={AlertTriangle} color="border-amber-500/30 text-amber-400" trend={dashboardData?.open_incidents > 0 ? "Resolve" : null} />
                            <MetricCard title="Open Complaints" value={dashboardData?.open_complaints || 0} icon={MessageSquare} color="border-rose-500/30 text-rose-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Staff Availability</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-300">Drivers</span>
                                        <strong className="text-blue-400">{dashboardData?.total_drivers || 0}</strong>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-300">Conductors</span>
                                        <strong className="text-indigo-400">{dashboardData?.total_conductors || 0}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Quick Assignment</h3>
                                <p className="text-xs text-slate-400 mb-4">Launch assignment terminal for missing resources.</p>
                                <button onClick={() => loadTabData('assign')} className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded transition">Assign Resources</button>
                            </div>
                        </div>
                    </div>
                );

            case 'assign':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Bus className="w-5 h-5 text-amber-400" /> {assignmentForm.trip_id ? 'Modify Trip Assignment' : 'Assign Bus & Crew'}
                            </h2>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-4xl mx-auto">
                            <form onSubmit={handleAssignSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Route</label>
                                        <select
                                            required value={assignmentForm.route_id} onChange={e => handleAssignFormChange('route_id', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                        >
                                            <option value="">-- Choose Route --</option>
                                            {availableForAssign.routes.map(r => (
                                                <option key={r.route_id} value={r.route_id}>{r.route_code} : {r.source_city} To {r.destination_city}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date</label>
                                            <input
                                                required type="date" value={assignmentForm.date} onChange={e => handleAssignFormChange('date', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time</label>
                                            <input
                                                required type="time" value={assignmentForm.time} onChange={e => handleAssignFormChange('time', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {assignmentForm.date && assignmentForm.time ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/50">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Bus</label>
                                            <select
                                                required value={assignmentForm.bus_id} onChange={e => handleAssignFormChange('bus_id', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                            >
                                                <option value="">-- Select Bus --</option>
                                                {availableForAssign.buses.map(b => (
                                                    <option key={b.bus_id} value={b.bus_id}>{b.registration_number} ({b.bus_type})</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-slate-500 mt-1">Excludes Maintenance & Assigned</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Driver</label>
                                            <select
                                                required value={assignmentForm.driver_id} onChange={e => handleAssignFormChange('driver_id', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                            >
                                                <option value="">-- Select Driver --</option>
                                                {availableForAssign.drivers.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name} ({d.employee_code})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Conductor</label>
                                            <select
                                                required value={assignmentForm.conductor_id} onChange={e => handleAssignFormChange('conductor_id', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                            >
                                                <option value="">-- Select Conductor --</option>
                                                {availableForAssign.conductors.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} ({c.employee_code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                                        Please select a Date and Time to load available buses and staff.
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={!assignmentForm.date || !assignmentForm.time} className={`px-8 py-3 rounded-lg font-black transition shadow-lg ${(!assignmentForm.date || !assignmentForm.time) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-amber-500/20'}`}>
                                        Confirm Assignment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 'trips':
                return (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b border-slate-800 pb-4 gap-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400" /> Operations Overview
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Date:</span>
                                <input
                                    type="date"
                                    value={tripsDate}
                                    onChange={e => setTripsDate(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white/90 text-sm focus:outline-none focus:border-emerald-500 transition"
                                />
                                <button onClick={() => loadTabData('assign')} className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-lg transition font-bold shadow-md shadow-amber-500/20 ml-4">+ Assign Trip</button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">Showing assigned trips and operations matching the date: <strong className="text-emerald-400">{tripsDate}</strong></p>
                        <DataTable
                            columns={['Trip ID', 'Route', 'Departure', 'Bus', 'Driver & Conductor', 'Delay', 'Status', 'Actions']}
                            data={trips.map(t => [
                                '#' + t.trip_id,
                                t.route_name,
                                t.scheduled_departure?.split(' ')[1] || 'TBD',
                                t.registration_number ? <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-xs">{t.registration_number}</span> : <span className="text-rose-400 font-bold text-xs">UNASSIGNED</span>,
                                (t.driver_name && t.conductor_name) ? `${t.driver_name} / ${t.conductor_name}` : <span className="text-rose-400 font-bold text-xs">UNASSIGNED</span>,
                                <span className={t.delay_mins > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>{t.delay_mins} min</span>,
                                <StatusBadge status={t.status} />,
                                <div className="flex gap-2">
                                    <button onClick={() => openModifyTrip(t)} className="text-xs bg-slate-700/50 hover:bg-amber-600 px-2 py-1 flex items-center gap-1 rounded transition border border-slate-600 hover:border-amber-600 text-white"><Wrench className="w-3 h-3" /> Modify</button>
                                    <button onClick={() => handleTripDelete(t.trip_id)} className="text-xs bg-slate-700/50 hover:bg-rose-600 px-2 py-1 flex items-center gap-1 rounded transition border border-slate-600 hover:border-rose-600 text-white cursor-pointer"><X className="w-3 h-3" /> Delete</button>
                                </div>
                            ])}
                        />
                    </div>
                );

            case 'all-trips':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Navigation className="w-5 h-5 text-emerald-400" /> All Assigned Trips (Master Record)
                            </h2>
                            <button onClick={() => { setAssignmentForm({ trip_id: null, route_id: '', date: '', time: '', bus_id: '', driver_id: '', conductor_id: '' }); loadTabData('assign'); }} className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-lg transition font-bold shadow-md shadow-amber-500/20">+ Assign Trip</button>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">Master ledger of all assigned trips across all dates. Use the options to modify or remove mistakenly assigned schedules.</p>
                        <DataTable
                            columns={['Trip ID', 'Route', 'Full Date/Time', 'Bus', 'Driver & Conductor', 'Delay', 'Status', 'Actions']}
                            data={trips.map(t => [
                                '#' + t.trip_id,
                                t.route_name,
                                <span className="font-mono text-emerald-300">{t.scheduled_departure}</span>,
                                t.registration_number ? <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-xs">{t.registration_number}</span> : <span className="text-rose-400 font-bold text-xs">UNASSIGNED</span>,
                                (t.driver_name && t.conductor_name) ? `${t.driver_name} / ${t.conductor_name}` : <span className="text-rose-400 font-bold text-xs">UNASSIGNED</span>,
                                <span className={t.delay_mins > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>{t.delay_mins} min</span>,
                                <StatusBadge status={t.status} />,
                                <div className="flex gap-2">
                                    <button onClick={() => openModifyTrip(t)} className="text-xs bg-slate-700/50 hover:bg-amber-600 px-2 py-1 flex items-center gap-1 rounded transition border border-slate-600 hover:border-amber-600 text-white"><Wrench className="w-3 h-3" /> Modify</button>
                                    <button onClick={() => handleTripDelete(t.trip_id)} className="text-xs bg-slate-700/50 hover:bg-rose-600 px-2 py-1 flex items-center gap-1 rounded transition border border-slate-600 hover:border-rose-600 text-white cursor-pointer"><X className="w-3 h-3" /> Delete</button>
                                </div>
                            ])}
                        />
                    </div>
                );

            case 'fleet':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Bus className="w-5 h-5 text-blue-400" /> Depot Fleet Management
                            </h2>
                            <button onClick={() => openFleetModal()} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition font-bold shadow-md">+ Add Bus</button>
                        </div>
                        <DataTable
                            columns={['Registration', 'Type', 'Capacity', 'GPS Device', 'Current Status', 'Actions']}
                            data={fleet.map(b => [
                                <strong className="text-white font-mono">{b.registration_number}</strong>,
                                b.bus_type,
                                b.total_seats + ' Seats',
                                b.gps_device_id || 'N/A',
                                <StatusBadge status={b.status} />,
                                <div className="flex gap-2">
                                    <button onClick={() => openFleetModal(b)} className="text-xs bg-slate-700 hover:bg-amber-600 px-2 py-1 rounded transition text-white">Edit</button>
                                    <button onClick={() => handleFleetDelete(b.bus_id)} className="text-xs bg-slate-700 hover:bg-rose-600 px-2 py-1 rounded transition text-white">Remove</button>
                                </div>
                            ])}
                        />
                    </div>
                );

            case 'staff':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-400" /> Depot Staff Management
                            </h2>
                            <button onClick={() => openStaffModal()} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg transition font-bold shadow-md">+ Add Staff</button>
                        </div>
                        <DataTable
                            columns={['Employee Code', 'Role', 'Name', 'Phone', 'Status', 'Actions']}
                            data={staff.map(s => [
                                <span className="font-mono text-slate-300">{s.employee_code}</span>,
                                <span className={`text-xs font-bold px-2 py-1 rounded ${s.type === 'Driver' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{s.type}</span>,
                                <strong className="text-white">{s.name}</strong>,
                                s.phone,
                                <StatusBadge status={s.status} />,
                                <div className="flex gap-2">
                                    <button onClick={() => openStaffModal(s)} className="text-xs bg-slate-700 hover:bg-amber-600 px-2 py-1 rounded transition text-white">Edit</button>
                                    <button onClick={() => handleStaffDelete(s.id, s.type)} className="text-xs bg-slate-700 hover:bg-rose-600 px-2 py-1 rounded transition text-white">Remove</button>
                                </div>
                            ])}
                        />
                    </div>
                );

            case 'maintenance':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-slate-400" /> Maintenance Logs
                            </h2>
                            <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg transition">+ New Log</button>
                        </div>
                        <DataTable
                            columns={['ID', 'Bus Reg', 'Type', 'Mechanic', 'Start Date', 'Status']}
                            data={maintenance.map(m => [
                                '#' + m.maintenance_id,
                                <span className="font-mono text-amber-400">{m.registration_number}</span>,
                                m.maintenance_type,
                                m.mechanic,
                                m.start_date?.split(' ')[0],
                                <StatusBadge status={m.status} />
                            ])}
                        />
                    </div>
                );

            case 'incidents':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-400" /> Incident Tracking (Local)
                        </h2>
                        <DataTable
                            columns={['Incident ID', 'Type', 'Severity', 'Location', 'Status', 'Escalate']}
                            data={incidents.map(i => [
                                '#' + i.incident_id,
                                i.incident_type,
                                <StatusBadge status={i.severity} />,
                                i.location,
                                <StatusBadge status={i.status} />,
                                <button className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded hover:bg-rose-500 hover:text-white transition">Escalate to Region</button>
                            ])}
                        />
                    </div>
                );

            case 'complaints':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-rose-400" /> Passenger Complaints (Local)
                        </h2>
                        <DataTable
                            columns={['Complaint ID', 'Category', 'Severity', 'Bus Reg.', 'Status']}
                            data={complaints.map(c => [
                                '#' + c.complaint_id,
                                c.category,
                                <StatusBadge status={c.severity} />,
                                c.registration_number || 'Unknown',
                                <StatusBadge status={c.status} />
                            ])}
                        />
                    </div>
                );

            case 'driver_garage':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2 border-b border-slate-800 pb-4">
                            <div>
                                <span className="bg-amber-500/20 text-amber-400 font-extrabold text-xs px-2.5 py-1 rounded border border-amber-500/30 uppercase tracking-widest">
                                    REAL-TIME DRIVER QUERIES
                                </span>
                                <h2 className="text-2xl font-black text-white flex items-center gap-3 mt-2">
                                    <Wrench className="w-7 h-7 text-amber-400" /> Driver Garage Maintenance & Flaws Column
                                </h2>
                                <p className="text-xs text-slate-400 mt-1 font-mono">Live queries & mechanical flaw requests submitted directly by TNSTC drivers.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-400">Total Queries: <strong className="text-white">{driverGarageTickets.length}</strong></span>
                                <button
                                    onClick={loadDriverGarageTickets}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition"
                                >
                                    Refresh List
                                </button>
                            </div>
                        </div>

                        {/* Top Metric Cards for Garage Column */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg">
                                <span className="text-xs font-bold uppercase text-slate-400">Open Queries</span>
                                <div className="text-3xl font-black text-amber-400 mt-1">
                                    {driverGarageTickets.filter(t => t.status === 'Open').length}
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-lg">
                                <span className="text-xs font-bold uppercase text-slate-400">In Progress (Mechanic Assigned)</span>
                                <div className="text-3xl font-black text-blue-400 mt-1">
                                    {driverGarageTickets.filter(t => t.status === 'In Progress').length}
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
                                <span className="text-xs font-bold uppercase text-slate-400">Resolved Flaws</span>
                                <div className="text-3xl font-black text-emerald-400 mt-1">
                                    {driverGarageTickets.filter(t => t.status === 'Resolved').length}
                                </div>
                            </div>
                        </div>

                        {/* Dedicated Driver Maintenance Table Column */}
                        <DataTable
                            columns={['Ticket ID', 'Bus Reg.', 'Driver Info', 'Mechanical Flaw / Query', 'Severity', 'Time / Date', 'Status', 'Depot Action']}
                            data={driverGarageTickets.map(t => [
                                <strong className="font-mono text-amber-400 text-xs">{t.id}</strong>,
                                <span className="font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs font-bold text-white">{t.bus}</span>,
                                <div>
                                    <div className="font-bold text-white text-xs">{t.driver_name}</div>
                                    <div className="text-[10px] font-mono text-slate-400">{t.driver_id}</div>
                                </div>,
                                <div className="max-w-xs text-xs text-slate-200 font-medium">{t.issue}</div>,
                                <StatusBadge status={t.severity || 'High'} />,
                                <span className="text-xs text-slate-400 font-mono">{t.time || t.date}</span>,
                                <StatusBadge status={t.status} />,
                                <div className="flex items-center gap-2">
                                    {t.status === 'Open' && (
                                        <button
                                            onClick={() => updateTicketStatus(t.id, 'In Progress', 'R. Periasamy (Mechanic)')}
                                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-md transition"
                                        >
                                            Assign Mechanic
                                        </button>
                                    )}
                                    {t.status !== 'Resolved' && (
                                        <button
                                            onClick={() => updateTicketStatus(t.id, 'Resolved', t.mechanic)}
                                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                                        </button>
                                    )}
                                    {t.status === 'Resolved' && (
                                        <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" /> Closed
                                        </span>
                                    )}
                                </div>
                            ])}
                        />
                    </div>
                );

            default:
                return <div className="text-slate-400 h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">Section Under Construction...</div>;
        }
    };

    return (
        <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-64px)] bg-slate-950 relative">

            {/* REAL-TIME POPUP TOAST NOTIFICATION WHEN DRIVER SUBMITS GARAGE TICKET */}
            {activePopupNotif && (
                <div className="fixed top-6 right-6 z-50 max-w-md bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-2 border-amber-500 rounded-2xl p-4 shadow-[0_10px_30px_rgba(245,158,11,0.3)] animate-bounce text-white">
                    <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 font-bold shrink-0">
                            <Wrench className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                    NEW DRIVER GARAGE QUERY
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">{activePopupNotif.time}</span>
                            </div>
                            <h4 className="text-sm font-extrabold text-white mt-1.5">Bus {activePopupNotif.bus}: {activePopupNotif.issue}</h4>
                            <p className="text-xs text-slate-300 mt-1 font-mono">Driver: <strong>{activePopupNotif.driver_name}</strong> ({activePopupNotif.driver_id})</p>

                            <button
                                onClick={() => { setActiveMenu('driver_garage'); setActivePopupNotif(null); }}
                                className="mt-3 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                            >
                                Open Driver Garage Column ➔
                            </button>
                        </div>
                        <button onClick={() => setActivePopupNotif(null)} className="text-slate-400 hover:text-white p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col pt-6 hidden md:flex overflow-y-auto">
                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Depot Overview</div>
                    <SidebarItem icon={Activity} label="Depot Dashboard" active={activeMenu === 'overview'} onClick={() => loadTabData('overview')} />
                </div>

                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Daily Operations</div>
                    <SidebarItem icon={Activity} label="Today's Trips" active={activeMenu === 'trips'} onClick={() => loadTabData('trips')} />
                    <SidebarItem icon={Navigation} label="All Trips" active={activeMenu === 'all-trips'} onClick={() => loadTabData('all-trips')} />
                    <SidebarItem icon={Bus} label="Assign Bus" active={activeMenu === 'assign'} onClick={() => { setAssignmentForm({ trip_id: null, route_id: '', date: '', time: '', bus_id: '', driver_id: '', conductor_id: '' }); loadTabData('assign'); }} />
                </div>

                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Resources</div>
                    <SidebarItem icon={Bus} label="Fleet & Buses" active={activeMenu === 'fleet'} onClick={() => loadTabData('fleet')} />
                    <SidebarItem icon={Users} label="Drivers & Conductors" active={activeMenu === 'staff'} onClick={() => loadTabData('staff')} />
                    <SidebarItem icon={Wrench} label="Maintenance Logs" active={activeMenu === 'maintenance'} onClick={() => loadTabData('maintenance')} />
                </div>

                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Issue Tracking & Driver Side</div>
                    <SidebarItem
                        icon={Wrench}
                        label="Driver Garage Tickets"
                        active={activeMenu === 'driver_garage'}
                        onClick={() => loadTabData('driver_garage')}
                        badgeCount={driverGarageTickets.filter(t => t.status === 'Open').length}
                    />
                    <SidebarItem icon={AlertTriangle} label="Incidents & Breakdowns" active={activeMenu === 'incidents'} onClick={() => loadTabData('incidents')} />
                    <SidebarItem icon={MessageSquare} label="Passenger Complaints" active={activeMenu === 'complaints'} onClick={() => loadTabData('complaints')} />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto w-full">
                {renderContent()}
            </main>

            {/* Staff Modal */}
            {isStaffModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-800/50">
                            <h3 className="text-white font-bold text-lg">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                            <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleStaffSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Staff Role Type</label>
                                <select
                                    value={staffForm.type}
                                    onChange={e => setStaffForm({
                                        ...staffForm,
                                        type: e.target.value,
                                        status: e.target.value === 'Driver' ? 'Active' : 'Available'
                                    })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    disabled={!!editingStaff}
                                >
                                    <option value="Driver">Driver</option>
                                    <option value="Conductor">Conductor</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={staffForm.name}
                                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    value={staffForm.phone}
                                    onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    placeholder="Enter 10 digit number"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employee Code / License</label>
                                <input
                                    type="text"
                                    required
                                    value={staffForm.employee_code}
                                    onChange={e => setStaffForm({ ...staffForm, employee_code: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. TN-DRV-123"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                                <select
                                    value={staffForm.status}
                                    onChange={e => setStaffForm({ ...staffForm, status: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                >
                                    {staffForm.type === 'Driver' ? (
                                        <>
                                            <option value="Active">Active</option>
                                            <option value="On-Route">On-Route</option>
                                            <option value="Off-Duty">Off-Duty</option>
                                            <option value="Emergency">Emergency</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Available">Available</option>
                                            <option value="On-Route">On-Route</option>
                                            <option value="Off-Duty">Off-Duty</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 shadow-md shadow-indigo-600/30 text-white rounded-lg font-bold hover:bg-indigo-500 transition">Save Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Fleet Modal */}
            {isFleetModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-800/50">
                            <h3 className="text-white font-bold text-lg">{editingFleet ? 'Edit Bus Details' : 'Add New Bus'}</h3>
                            <button onClick={() => setIsFleetModalOpen(false)} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleFleetSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registration Number</label>
                                <input
                                    type="text"
                                    required
                                    value={fleetForm.registration_number}
                                    onChange={e => setFleetForm({ ...fleetForm, registration_number: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. TN-33-N-1234"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bus Type</label>
                                <select
                                    value={fleetForm.bus_type}
                                    onChange={e => setFleetForm({ ...fleetForm, bus_type: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                >
                                    <option value="Town Bus">Town Bus</option>
                                    <option value="Express">Express</option>
                                    <option value="SETC Ultra Deluxe">SETC Ultra Deluxe</option>
                                    <option value="AC Sleeper">AC Sleeper</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Seats Capacity</label>
                                <input
                                    type="number"
                                    required
                                    value={fleetForm.total_seats}
                                    onChange={e => setFleetForm({ ...fleetForm, total_seats: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">GPS Device ID (Optional)</label>
                                <input
                                    type="text"
                                    value={fleetForm.gps_device_id}
                                    onChange={e => setFleetForm({ ...fleetForm, gps_device_id: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. GPS-9901"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                                <select
                                    value={fleetForm.status}
                                    onChange={e => setFleetForm({ ...fleetForm, status: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Running">Running</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Emergency">Emergency</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsFleetModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-blue-600 shadow-md shadow-blue-600/30 text-white rounded-lg font-bold hover:bg-blue-500 transition">Save Bus</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusable components
const StatusBadge = ({ status }) => {
    let color = 'bg-slate-500/20 text-slate-400';
    if (status === 'Active' || status === 'Resolved' || status === 'Available' || status === 'Running') color = 'bg-emerald-500/30 text-emerald-400 font-bold border border-emerald-500/30';
    else if (status === 'Scheduled' || status === 'Pending Review' || status === 'Open') color = 'bg-amber-500/30 text-amber-400 font-bold border border-amber-500/30';
    else if (status === 'Escalated' || status === 'Critical' || status === 'High' || status === 'Medium') color = 'bg-rose-500/30 text-rose-400 font-bold border border-rose-500/30';
    else if (status === 'Low') color = 'bg-blue-500/30 text-blue-400 font-bold border border-blue-500/30';

    return <span className={`px-2 py-1 rounded text-[11px] uppercase tracking-wider ${color}`}>{status}</span>;
};

const MetricCard = ({ title, value, trend, icon: Icon, color }) => (
    <div className={`bg-slate-900 border ${color} rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:bg-slate-800/80 cursor-pointer`}>
        <Icon className={`w-8 h-8 absolute -right-2 -bottom-2 opacity-10`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-black text-white">{value}</span>
            {trend && <span className={`text-xs font-bold ${trend === 'Resolve' ? 'text-rose-400 bg-rose-400/10' : 'text-emerald-400 bg-emerald-400/10'} px-1.5 py-0.5 rounded mb-1 border ${trend === 'Resolve' ? 'border-rose-500/30' : 'border-emerald-500/30'}`}>{trend}</span>}
        </div>
    </div>
);

const DataTable = ({ columns, data }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50">
                    <tr>
                        {columns.map((c, i) => <th key={i} className="px-4 py-3 text-xs font-extrabold uppercase text-slate-400 tracking-wider whitespace-nowrap">{c}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {data.length === 0 ? (
                        <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">No records found.</td></tr>
                    ) : data.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 transition">
                            {row.map((cell, j) => (
                                <td key={j} className={`px-4 py-3 text-slate-300`}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default DepotAdminDashboard;
