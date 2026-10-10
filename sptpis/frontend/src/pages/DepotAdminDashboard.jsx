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

    const defaultIncidents = [
        {
            incident_id: 8801,
            incident_type: 'Engine Overheating & Coolant Leak',
            registration_number: 'TN-29-N-1542',
            driver_name: 'K. Murugan',
            route_name: 'Dharmapuri - Sathyamangalam',
            location: 'Thoppur Ghat Road (KM 42)',
            severity: 'Critical',
            description: 'Engine temperature exceeded 110°C on steep incline. Radiator hose puncture reported by Driver K. Murugan. Rescue bus TN-29-N-1890 dispatched.',
            status: 'Backup Bus Dispatched',
            reported_time: '09:15 AM Today'
        },
        {
            incident_id: 8794,
            incident_type: 'Rear Tire Blowout & Rim Damage',
            registration_number: 'TN-33-N-0988',
            driver_name: 'S. Rajan',
            route_name: 'Dharmapuri - Salem Express',
            location: 'Omalur Bypass Toll Plaza',
            severity: 'High',
            description: 'Rear left dual tire blowout at 65 km/h. Driver S. Rajan safely steered to highway shoulder. Mobile repair unit en-route with spare rim.',
            status: 'Mechanic En-Route',
            reported_time: '08:30 AM Today'
        },
        {
            incident_id: 8762,
            incident_type: 'Brake Air Pressure Drop Alarm',
            registration_number: 'TN-29-N-1890',
            driver_name: 'P. Kamaraj',
            route_name: 'Dharmapuri - Harur Route',
            location: 'Morappur Junction Stop',
            severity: 'High',
            description: 'Pneumatic air pressure gauge dropped below 4.5 bar. Vehicle grounded at Morappur terminal for valve inspection by Depot Garage.',
            status: 'Under Repair',
            reported_time: 'Yesterday, 04:45 PM'
        },
        {
            incident_id: 8720,
            incident_type: 'AC Compressor Belt Failure',
            registration_number: 'TN-01-N-8821',
            driver_name: 'V. Sundaram',
            route_name: 'Chennai - Dharmapuri SETC',
            location: 'Krishnagiri Highway (NH-44)',
            severity: 'Medium',
            description: 'AC cooling failure reported on SETC Deluxe bus. Auxiliary belt replaced at Krishnagiri workshop. Service resumed.',
            status: 'Resolved',
            reported_time: 'Yesterday, 11:20 AM'
        },
        {
            incident_id: 8685,
            incident_type: 'Side Mirror Damage in Traffic',
            registration_number: 'TN-38-N-4412',
            driver_name: 'M. Suresh',
            route_name: 'Dharmapuri - Pennagaram',
            location: 'Dharmapuri Old Bus Stand',
            severity: 'Low',
            description: 'Left side convex rearview mirror knocked by auto-rickshaw during peak hour congestion. Replaced with spare unit at depot.',
            status: 'Resolved',
            reported_time: '06 Oct 2026, 05:10 PM'
        }
    ];

    const defaultComplaints = [
        {
            complaint_id: 4012,
            category: 'Route Violation / Stop Skipping',
            reported_by: 'R. Anitha (PNR: TNSTC-BK-1002)',
            registration_number: 'TN-29-N-1542',
            route_name: 'Dharmapuri - Sathyamangalam',
            location: 'Salem Junction Hub',
            severity: 'High',
            description: 'Express bus bypassed Salem Bay 4 without stopping for reserved passengers. Driver claims bay overcrowding.',
            status: 'Under Investigation',
            created_date: 'Today, 10:20 AM'
        },
        {
            complaint_id: 3998,
            category: 'Fare & Luggage Overcharging',
            reported_by: 'M. Suresh (PNR: TNSTC-BK-1005)',
            registration_number: 'TN-38-N-4412',
            route_name: 'Dharmapuri - Salem Express',
            location: 'Dharmapuri Central Bus Stand',
            severity: 'Medium',
            description: 'Conductor collected ₹20 extra for 15kg hand baggage without generating official electronic receipt ticket.',
            status: 'Pending Review',
            created_date: 'Today, 09:05 AM'
        },
        {
            complaint_id: 3975,
            category: 'Amenities & AC Water Leak',
            reported_by: 'K. Dinesh (PNR: TNSTC-BK-1010)',
            registration_number: 'TN-01-N-8821',
            route_name: 'Chennai - Dharmapuri SETC',
            location: 'Krishnagiri Toll Plaza',
            severity: 'Low',
            description: 'AC vent overhead dripped water onto seat S12. Conductor re-seated passenger and 20% fare refund issued via app.',
            status: 'Refund Processed',
            created_date: 'Yesterday, 02:30 PM'
        },
        {
            complaint_id: 3950,
            category: 'Safety & Overspeeding',
            reported_by: 'G. Divya (PNR: TNSTC-BK-0982)',
            registration_number: 'TN-33-N-0988',
            route_name: 'Dharmapuri - Salem Express',
            location: 'Thoppur Ghat Downhill Pass',
            severity: 'Critical',
            description: 'Driver exceeded 70 km/h speed governor limit on downhill ghat curves. Telematics speed log verified; driver summoned for safety review.',
            status: 'Warning Issued',
            created_date: 'Yesterday, 08:45 AM'
        },
        {
            complaint_id: 3912,
            category: 'Scheme & Pink Card Refusal',
            reported_by: 'M. Lakshmi (Pink Card Holder)',
            registration_number: 'TN-45-N-3301',
            route_name: 'Dharmapuri - Pennagaram',
            location: 'Pennagaram Town Stop',
            severity: 'High',
            description: 'Conductor initially refused zero-fare pink ticket claiming bus was express type (verified as ordinary town bus). Depot Manager conducted briefing.',
            status: 'Resolved',
            created_date: '05 Oct 2026, 04:00 PM'
        }
    ];

    const [fleet, setFleet] = useState([]);
    const [staff, setStaff] = useState([]);
    const [trips, setTrips] = useState([]);
    const [tripsDate, setTripsDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [tripsFilter, setTripsFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
    const [maintenance, setMaintenance] = useState([]);
    const [incidents, setIncidents] = useState(defaultIncidents);
    const [complaints, setComplaints] = useState(defaultComplaints);

    const [assignmentForm, setAssignmentForm] = useState({
        trip_id: null,
        route_id: '',
        date: '',
        time: '',
        bus_id: '',
        driver_id: '',
        conductor_id: ''
    });
    const [availableForAssign, setAvailableForAssign] = useState({
        routes: [
            { route_id: 1, route_code: 'R-101', name: 'Dharmapuri - Salem Express', source_city: 'Dharmapuri', destination_city: 'Salem' },
            { route_id: 2, route_code: 'R-102', name: 'Dharmapuri - Hosur Line', source_city: 'Dharmapuri', destination_city: 'Hosur' },
            { route_id: 3, route_code: 'R-103', name: 'Dharmapuri - Pennagaram Town', source_city: 'Dharmapuri', destination_city: 'Pennagaram' },
            { route_id: 4, route_code: 'R-201', name: 'Chennai - Dharmapuri SETC', source_city: 'Chennai', destination_city: 'Dharmapuri' },
            { route_id: 5, route_code: 'R-205', name: 'Salem - Sathyamangalam Express', source_city: 'Salem', destination_city: 'Sathyamangalam' }
        ],
        buses: [
            { bus_id: 1, registration_number: 'TN-29-N-1258', bus_type: 'Express' },
            { bus_id: 2, registration_number: 'TN-29-N-1542', bus_type: 'Super Deluxe' },
            { bus_id: 3, registration_number: 'TN-33-N-0988', bus_type: 'Town Bus' },
            { bus_id: 4, registration_number: 'TN-29-N-1890', bus_type: 'Point-to-Point' },
            { bus_id: 5, registration_number: 'TN-01-N-8821', bus_type: 'AC Sleeper' }
        ],
        drivers: [
            { id: 1, name: 'K. Murugan', employee_code: 'TN29-DRV-201' },
            { id: 2, name: 'S. Rajan', employee_code: 'TN33-DRV-104' },
            { id: 3, name: 'V. Sundaram', employee_code: 'TN29-DRV-305' },
            { id: 4, name: 'P. Arumugam', employee_code: 'TN29-DRV-412' }
        ],
        conductors: [
            { id: 1, name: 'K. SENTHILKUMAR', employee_code: 'TN-CON-369' },
            { id: 2, name: 'M. Periasamy', employee_code: 'TN-CON-102' },
            { id: 3, name: 'R. Velu', employee_code: 'TN-CON-204' },
            { id: 4, name: 'G. Natarajan', employee_code: 'TN-CON-450' }
        ]
    });

    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffForm, setStaffForm] = useState({ name: '', phone: '', employee_code: '', type: 'Driver', status: 'Active' });

    const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
    const [editingFleet, setEditingFleet] = useState(null);
    const [fleetForm, setFleetForm] = useState({
        registration_number: '', bus_type: 'Town Bus', total_seats: 54, gps_device_id: '', status: 'Active',
        source: '', destination: '', departure: '', arrival: '', fare: '₹55'
    });

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
                status: bus.status || 'Active',
                source: bus.source || '',
                destination: bus.destination || '',
                departure: bus.departure || '',
                arrival: bus.arrival || '',
                fare: bus.fare || '₹55'
            });
        } else {
            setEditingFleet(null);
            setFleetForm({ registration_number: '', bus_type: 'Town Bus', total_seats: 54, gps_device_id: '', status: 'Active', source: '', destination: '', departure: '', arrival: '', fare: '₹55' });
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
                // Initial Default Driver Garage Tickets (5 Detailed Entries)
                const initial = [
                    { id: 'GT-101', issue: 'Rear brake chamber air leakage & pressure drop', driver_name: 'K. Murugan', driver_id: 'TN29-DRV-201', bus: 'TN-29-N-1542', severity: 'Critical', status: 'In Progress', mechanic: 'R. Periasamy', time: '09:15 AM', date: 'Today' },
                    { id: 'GT-102', issue: 'Clutch plate slippage on Thoppur ghat incline', driver_name: 'S. Rajan', driver_id: 'TN33-DRV-104', bus: 'TN-33-N-0988', severity: 'High', status: 'Open', mechanic: 'Unassigned', time: '08:40 AM', date: 'Today' },
                    { id: 'GT-103', issue: 'Radiator hose puncture & coolant top-up required', driver_name: 'V. Sundaram', driver_id: 'TN29-DRV-305', bus: 'TN-29-N-1890', severity: 'High', status: 'Under Inspection', mechanic: 'M. Arumugam', time: 'Yesterday', date: 'Yesterday' },
                    { id: 'GT-104', issue: 'Headlight high-beam bulb & fuse replacement', driver_name: 'P. Arumugam', driver_id: 'TN29-DRV-412', bus: 'TN-29-N-1258', severity: 'Medium', status: 'Scheduled', mechanic: 'G. Natarajan', time: 'Yesterday', date: 'Yesterday' },
                    { id: 'GT-105', issue: 'Speedometer telematics GPS sensor calibration', driver_name: 'M. Suresh', driver_id: 'TN29-DRV-550', bus: 'TN-01-N-8821', severity: 'Low', status: 'Completed', mechanic: 'K. Senthil', time: '06 Oct 2026', date: '06 Oct 2026' }
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

    const loadTabData = async (menu, dateParam) => {
        setActiveMenu(menu);
        try {
            if (menu === 'trips' || menu === 'all-trips') {
                const ts = Date.now();
                const targetDate = menu === 'all-trips' ? null : (dateParam !== undefined ? dateParam : tripsDate);
                const res = await axios.get(targetDate ? `/api/depot/trips?date=${targetDate}&_t=${ts}` : `/api/depot/all-trips?_t=${ts}`);
                if (res.data && res.data.length > 0) {
                    setTrips(res.data);
                } else {
                    // Smart Fallback: Load all trips master ledger so user's assigned trips are always visible
                    const allRes = await axios.get(`/api/depot/all-trips?_t=${ts}`);
                    setTrips(allRes.data);
                }
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
                try {
                    const res = await axios.get('/api/depot/incidents');
                    if (res.data && res.data.length > 0) setIncidents(res.data);
                    else setIncidents(defaultIncidents);
                } catch (err) {
                    setIncidents(defaultIncidents);
                }
            } else if (menu === 'complaints') {
                try {
                    const res = await axios.get('/api/depot/complaints');
                    if (res.data && res.data.length > 0) setComplaints(res.data);
                    else setComplaints(defaultComplaints);
                } catch (err) {
                    setComplaints(defaultComplaints);
                }
            } else if (menu === 'assign') {
                const routesRes = await axios.get('/api/depot/routes');
                const ts = Date.now();
                const tripsRes = await axios.get(`/api/depot/all-trips?_t=${ts}`);
                setTrips(tripsRes.data);
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
            let res;
            if (assignmentForm.trip_id) {
                res = await axios.put(`/api/depot/trips/${assignmentForm.trip_id}`, assignmentForm);
                alert('Trip modified successfully!');
            } else {
                res = await axios.post('/api/depot/assign-trip', assignmentForm);
                alert('Trip assigned successfully!');
            }

            const assignedDate = assignmentForm.date;
            const assignedTrip = res.data?.trip;

            setAssignmentForm({ trip_id: null, route_id: '', date: '', time: '', bus_id: '', driver_id: '', conductor_id: '' });

            if (assignedTrip) {
                setTrips(prev => {
                    const exists = prev.some(t => t.trip_id === assignedTrip.trip_id);
                    if (exists) {
                        return prev.map(t => t.trip_id === assignedTrip.trip_id ? assignedTrip : t);
                    }
                    return [assignedTrip, ...prev];
                });
            }

            // Immediately switch to Today's Trips / All Trips view with matching date
            setTripsDate(assignedDate);
            await loadTabData('trips', assignedDate);
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
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2 border-b border-slate-800 pb-3">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Bus className="w-5 h-5 text-amber-400" /> {assignmentForm.trip_id ? 'Modify Trip Assignment' : 'Assign Bus & Crew'}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Assign available depot buses and drivers to scheduled route trips.</p>
                            </div>
                        </div>

                        {/* Unassigned Trips Queue */}
                        {trips.filter(t => !t.registration_number).length > 0 && (
                            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" /> Pending Bus Assignments ({trips.filter(t => !t.registration_number).length})
                                    </span>
                                    <span className="text-[10px] text-amber-300 font-mono">Click a pending trip to populate assignment terminal</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {trips.filter(t => !t.registration_number).map(un => (
                                        <div
                                            key={un.trip_id}
                                            onClick={() => openModifyTrip(un)}
                                            className="bg-slate-900 border border-amber-500/40 hover:border-amber-400 p-3 rounded-lg cursor-pointer transition flex justify-between items-center group"
                                        >
                                            <div>
                                                <div className="font-bold text-xs text-white group-hover:text-amber-300 transition">#{un.trip_id} - {un.route_name || 'Route #' + un.route_id}</div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{un.scheduled_departure}</div>
                                            </div>
                                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-bold border border-amber-500/30">Assign Now ➔</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-4xl mx-auto">
                            <form onSubmit={handleAssignSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Route</label>
                                        <select
                                            required value={assignmentForm.route_id} onChange={e => handleAssignFormChange('route_id', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-sm"
                                        >
                                            <option value="">-- Choose Route --</option>
                                            {(availableForAssign.routes && availableForAssign.routes.length > 0) ? (
                                                availableForAssign.routes.map(r => (
                                                    <option key={r.route_id} value={r.route_id}>
                                                        {r.route_code || ('R-' + r.route_id)} : {r.source_city || r.source || 'Depot Origin'} To {r.destination_city || r.destination || 'Destination'} {r.name ? `(${r.name})` : ''}
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="1">DPI-101 : Dharmapuri To Salem (Express)</option>
                                                    <option value="2">DPI-102 : Erode To Dharmapuri (Line Service)</option>
                                                    <option value="3">DPI-103 : Dharmapuri To Hosur (Fast Passenger)</option>
                                                    <option value="4">DPI-104 : Dharmapuri To Sathyamangalam (SETC Ultra Deluxe)</option>
                                                    <option value="5">DPI-105 : Dharmapuri To Harur (Town Bus)</option>
                                                    <option value="6">DPI-106 : Dharmapuri To Hogenakkal (Tourist Special)</option>
                                                    <option value="7">DPI-201 : Dharmapuri To Chennai (SETC Ultra Deluxe)</option>
                                                    <option value="8">DPI-202 : Dharmapuri To Bengaluru (Intercity Air-Bus)</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date</label>
                                            <input
                                                required type="date" value={assignmentForm.date} onChange={e => handleAssignFormChange('date', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-sm"
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time</label>
                                            <input
                                                required type="time" value={assignmentForm.time} onChange={e => handleAssignFormChange('time', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-sm"
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
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-sm"
                                            >
                                                <option value="">-- Select Bus --</option>
                                                {(availableForAssign.buses && availableForAssign.buses.length > 0) ? (
                                                    availableForAssign.buses.map(b => (
                                                        <option key={b.bus_id} value={b.bus_id}>{b.registration_number} ({b.bus_type || 'Town Bus'})</option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="1">TN-29-N-1258 (Express)</option>
                                                        <option value="2">TN-29-N-1542 (Super Deluxe)</option>
                                                        <option value="3">TN-33-N-0988 (Town Bus)</option>
                                                        <option value="4">TN-29-N-1890 (Point-to-Point)</option>
                                                        <option value="5">TN-01-N-8821 (AC Sleeper)</option>
                                                    </>
                                                )}
                                            </select>
                                            <p className="text-[10px] text-slate-500 mt-1">Excludes Maintenance & Assigned</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Driver</label>
                                            <select
                                                required value={assignmentForm.driver_id} onChange={e => handleAssignFormChange('driver_id', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-sm"
                                            >
                                                <option value="">-- Select Driver --</option>
                                                {(availableForAssign.drivers && availableForAssign.drivers.length > 0) ? (
                                                    availableForAssign.drivers.map(d => (
                                                        <option key={d.id} value={d.id}>{d.name} ({d.employee_code || 'DRV-101'})</option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="1">K. Murugan (TN29-DRV-201)</option>
                                                        <option value="2">S. Rajan (TN33-DRV-104)</option>
                                                        <option value="3">V. Sundaram (TN29-DRV-305)</option>
                                                        <option value="4">P. Arumugam (TN29-DRV-412)</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Conductor</label>
                                            <select
                                                required value={assignmentForm.conductor_id} onChange={e => handleAssignFormChange('conductor_id', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-sm"
                                            >
                                                <option value="">-- Select Conductor --</option>
                                                {(availableForAssign.conductors && availableForAssign.conductors.length > 0) ? (
                                                    availableForAssign.conductors.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} ({c.employee_code || 'CON-101'})</option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="1">K. SENTHILKUMAR (TN-CON-369)</option>
                                                        <option value="2">M. Periasamy (TN-CON-102)</option>
                                                        <option value="3">R. Velu (TN-CON-204)</option>
                                                        <option value="4">G. Natarajan (TN-CON-450)</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
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
                {
                    const filteredTrips = trips.filter(t => {
                        if (tripsFilter === 'assigned') return !!t.registration_number;
                        if (tripsFilter === 'unassigned') return !t.registration_number;
                        return true;
                    });
                    return (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-slate-800 pb-4 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-emerald-400" /> Today's Operations & Trips
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1">Showing trips matching date: <strong className="text-emerald-400 font-mono">{tripsDate}</strong></p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Filter Pills */}
                                    <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
                                        <button
                                            onClick={() => setTripsFilter('all')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${tripsFilter === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            All ({trips.length})
                                        </button>
                                        <button
                                            onClick={() => setTripsFilter('assigned')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${tripsFilter === 'assigned' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Assigned ({trips.filter(t => !!t.registration_number).length})
                                        </button>
                                        <button
                                            onClick={() => setTripsFilter('unassigned')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${tripsFilter === 'unassigned' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Unassigned ({trips.filter(t => !t.registration_number).length})
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date:</span>
                                        <input
                                            type="date"
                                            value={tripsDate}
                                            onChange={e => setTripsDate(e.target.value)}
                                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white/90 text-sm focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>
                                    <button onClick={() => loadTabData('assign')} className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-lg transition font-bold shadow-md shadow-amber-500/20">+ Assign Trip</button>
                                </div>
                            </div>

                            <DataTable
                                columns={['Trip ID', 'Route', 'Departure', 'Bus', 'Driver & Conductor', 'Delay', 'Status', 'Actions']}
                                data={filteredTrips.map(t => [
                                    '#' + t.trip_id,
                                    t.route_name,
                                    t.scheduled_departure?.split(' ')[1] || 'TBD',
                                    t.registration_number ? <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs font-bold text-amber-300">{t.registration_number}</span> : <span className="text-rose-400 font-extrabold text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">UNASSIGNED</span>,
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
                }

            case 'all-trips':
                {
                    const filteredAllTrips = trips.filter(t => {
                        if (tripsFilter === 'assigned') return !!t.registration_number;
                        if (tripsFilter === 'unassigned') return !t.registration_number;
                        return true;
                    });
                    return (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-slate-800 pb-4 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Navigation className="w-5 h-5 text-emerald-400" /> All Assigned Trips (Master Record)
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">Master ledger of all assigned trips across all dates.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Filter Pills */}
                                    <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
                                        <button
                                            onClick={() => setTripsFilter('all')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${tripsFilter === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            All ({trips.length})
                                        </button>
                                        <button
                                            onClick={() => setTripsFilter('assigned')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${tripsFilter === 'assigned' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Bus Assigned ({trips.filter(t => !!t.registration_number).length})
                                        </button>
                                        <button
                                            onClick={() => setTripsFilter('unassigned')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${tripsFilter === 'unassigned' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Pending Bus ({trips.filter(t => !t.registration_number).length})
                                        </button>
                                    </div>
                                    <button onClick={() => { setAssignmentForm({ trip_id: null, route_id: '', date: '', time: '', bus_id: '', driver_id: '', conductor_id: '' }); loadTabData('assign'); }} className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-lg transition font-bold shadow-md shadow-amber-500/20">+ Assign Trip</button>
                                </div>
                            </div>
                            <DataTable
                                columns={['Trip ID', 'Route', 'Full Date/Time', 'Bus', 'Driver & Conductor', 'Delay', 'Status', 'Actions']}
                                data={filteredAllTrips.map(t => [
                                    '#' + t.trip_id,
                                    t.route_name,
                                    <span className="font-mono text-emerald-300">{t.scheduled_departure}</span>,
                                    t.registration_number ? <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs font-bold text-amber-300">{t.registration_number}</span> : <span className="text-rose-400 font-extrabold text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">UNASSIGNED</span>,
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
                }

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
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
                            <div>
                                <span className="bg-rose-500/20 text-rose-400 font-extrabold text-[10px] px-2.5 py-1 rounded border border-rose-500/30 uppercase tracking-widest">
                                    SAFETY & EMERGENCY RESPONSE
                                </span>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
                                    <AlertTriangle className="w-6 h-6 text-rose-400" /> Incidents & Vehicle Breakdowns
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Real-time emergency tracking, mechanical failures, and breakdown assistance logs.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-400">Total Logged: <strong className="text-white">{incidents.length}</strong></span>
                            </div>
                        </div>

                        {/* Metric Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-lg">
                                <span className="text-[11px] font-bold uppercase text-slate-400">Critical Alerts</span>
                                <div className="text-2xl font-black text-rose-400 mt-1">{incidents.filter(i => i.severity === 'Critical').length}</div>
                            </div>
                            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
                                <span className="text-[11px] font-bold uppercase text-slate-400">High / Active Repairs</span>
                                <div className="text-2xl font-black text-amber-400 mt-1">{incidents.filter(i => i.severity === 'High' || i.status?.includes('En-Route') || i.status?.includes('Repair')).length}</div>
                            </div>
                            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-lg">
                                <span className="text-[11px] font-bold uppercase text-slate-400">Rescue Buses Sent</span>
                                <div className="text-2xl font-black text-blue-400 mt-1">{incidents.filter(i => i.status?.includes('Dispatched')).length}</div>
                            </div>
                            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
                                <span className="text-[11px] font-bold uppercase text-slate-400">Resolved Today</span>
                                <div className="text-2xl font-black text-emerald-400 mt-1">{incidents.filter(i => i.status === 'Resolved').length}</div>
                            </div>
                        </div>

                        {/* Rich Cards Grid for Incidents */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {incidents.map((inc, idx) => (
                                <div key={inc.incident_id || idx} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition"></div>

                                    <div>
                                        <div className="flex justify-between items-start gap-2 mb-3">
                                            <div>
                                                <span className="text-[10px] font-mono font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">#{inc.incident_id || 8800 + idx}</span>
                                                <h3 className="text-base font-black text-white mt-1 group-hover:text-amber-400 transition">{inc.incident_type}</h3>
                                            </div>
                                            <StatusBadge status={inc.severity || 'High'} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                                            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Bus Registration</span>
                                                <span className="font-mono font-bold text-amber-300">{inc.registration_number || 'TN-29-N-1542'}</span>
                                            </div>
                                            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Driver Name</span>
                                                <span className="font-semibold text-slate-200">{inc.driver_name || 'K. Murugan'}</span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-300 space-y-1.5 mb-4">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                                                <span className="font-medium text-slate-200">{inc.location}</span>
                                            </div>
                                            {inc.route_name && (
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Navigation className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                    <span>{inc.route_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/60 leading-relaxed font-sans mb-4">
                                            "{inc.description}"
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={inc.status || 'Active'} />
                                            <span className="text-[10px] text-slate-500 font-mono">{inc.reported_time || 'Today'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {inc.status !== 'Resolved' && (
                                                <button
                                                    onClick={() => {
                                                        const updated = incidents.map(item => item.incident_id === inc.incident_id ? { ...item, status: 'Resolved' } : item);
                                                        setIncidents(updated);
                                                    }}
                                                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow transition"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                            <button
                                                onClick={() => alert(`Escalated incident #${inc.incident_id} to Regional Head Office.`)}
                                                className="text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 px-3 py-1.5 rounded-lg transition font-bold"
                                            >
                                                Escalate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'complaints':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
                            <div>
                                <span className="bg-indigo-500/20 text-indigo-400 font-extrabold text-[10px] px-2.5 py-1 rounded border border-indigo-500/30 uppercase tracking-widest">
                                    PASSENGER SATISFACTION & AUDIT
                                </span>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
                                    <MessageSquare className="w-6 h-6 text-indigo-400" /> Passenger Complaints & Grievances
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Customer queries, route deviations, ticket fare disputes, and cleanliness feedback.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-400">Total Grievances: <strong className="text-white">{complaints.length}</strong></span>
                            </div>
                        </div>

                        {/* Metric Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-lg">
                                <span className="text-[11px] font-bold uppercase text-slate-400">Total Registered</span>
                                <div className="text-2xl font-black text-indigo-400 mt-1">{complaints.length}</div>
                            </div>
                            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
                                <span className="text-[11px] font-bold uppercase text-slate-400">Under Investigation</span>
                                <div className="text-2xl font-black text-amber-400 mt-1">{complaints.filter(c => c.status?.includes('Investigation') || c.status?.includes('Pending')).length}</div>
                            </div>
                            <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-lg">
                                <span className="text-[11px] font-bold uppercase text-slate-400">Critical / High Severity</span>
                                <div className="text-2xl font-black text-rose-400 mt-1">{complaints.filter(c => c.severity === 'Critical' || c.severity === 'High').length}</div>
                            </div>
                            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
                                <span className="text-[11px] font-bold uppercase text-slate-400">Resolved / Closed</span>
                                <div className="text-2xl font-black text-emerald-400 mt-1">{complaints.filter(c => c.status === 'Resolved' || c.status?.includes('Refund') || c.status?.includes('Warning')).length}</div>
                            </div>
                        </div>

                        {/* Rich Cards Grid for Complaints */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {complaints.map((cmp, idx) => (
                                <div key={cmp.complaint_id || idx} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition"></div>

                                    <div>
                                        <div className="flex justify-between items-start gap-2 mb-3">
                                            <div>
                                                <span className="text-[10px] font-mono font-bold bg-slate-950 text-indigo-400 px-2 py-0.5 rounded border border-slate-800">#{cmp.complaint_id || 4000 + idx}</span>
                                                <h3 className="text-base font-black text-white mt-1 group-hover:text-indigo-300 transition">{cmp.category}</h3>
                                            </div>
                                            <StatusBadge status={cmp.severity || 'Medium'} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                                            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Passenger / PNR</span>
                                                <span className="font-semibold text-slate-200">{cmp.reported_by || 'Passenger A'}</span>
                                            </div>
                                            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Bus Registration</span>
                                                <span className="font-mono font-bold text-amber-300">{cmp.registration_number || 'TN-29-N-1542'}</span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-300 space-y-1 mb-3">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                                <span className="font-medium text-slate-200">{cmp.location}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/60 leading-relaxed font-sans mb-4">
                                            "{cmp.description}"
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={cmp.status || 'Open'} />
                                            <span className="text-[10px] text-slate-500 font-mono">{cmp.created_date || 'Today'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {cmp.status !== 'Resolved' && (
                                                <button
                                                    onClick={() => {
                                                        const updated = complaints.map(item => item.complaint_id === cmp.complaint_id ? { ...item, status: 'Resolved' } : item);
                                                        setComplaints(updated);
                                                    }}
                                                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow transition"
                                                >
                                                    Mark Resolved
                                                </button>
                                            )}
                                            <button
                                                onClick={() => alert(`Escalated complaint #${cmp.complaint_id} to State Transport Authority.`)}
                                                className="text-xs bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/30 px-3 py-1.5 rounded-lg transition font-bold"
                                            >
                                                Escalate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                                <div>
                                    <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Source Route</label>
                                    <input
                                        type="text"
                                        required
                                        value={fleetForm.source}
                                        onChange={e => setFleetForm({ ...fleetForm, source: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                                        placeholder="e.g. Salem"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Destination Route</label>
                                    <input
                                        type="text"
                                        required
                                        value={fleetForm.destination}
                                        onChange={e => setFleetForm({ ...fleetForm, destination: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                                        placeholder="e.g. Erode"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Departure Time</label>
                                    <input
                                        type="text"
                                        required
                                        value={fleetForm.departure}
                                        onChange={e => setFleetForm({ ...fleetForm, departure: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                                        placeholder="e.g. 04:30 AM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Arrival Time</label>
                                    <input
                                        type="text"
                                        required
                                        value={fleetForm.arrival}
                                        onChange={e => setFleetForm({ ...fleetForm, arrival: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                                        placeholder="e.g. 06:00 AM"
                                    />
                                </div>
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
