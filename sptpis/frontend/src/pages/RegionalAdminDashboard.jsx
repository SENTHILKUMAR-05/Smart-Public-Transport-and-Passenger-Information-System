import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Building, Bus, Users, Activity, BarChart3, AlertTriangle,
    MapPin, CheckCircle2, Navigation, MessageSquare, ListRestart,
    Clock, ShieldAlert, MonitorSpeaker
} from 'lucide-react';
import FleetMap from '../components/Map/FleetMap';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, active, onClick, hasSubItems }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
    >
        <Icon className="w-4 h-4" />
        <span className="flex-1 text-left">{label}</span>
        {hasSubItems && <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tab</span>}
    </button>
);

const RegionalAdminDashboard = () => {
    const { user } = useAuth();
    const [activeMenu, setActiveMenu] = useState('overview');
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { liveBuses } = useSocket();

    const [depots, setDepots] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [complaints, setComplaints] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/regional/dashboard');
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
            if (menu === 'depots') {
                const res = await axios.get('/api/regional/depots');
                setDepots(res.data);
            } else if (menu === 'routes') {
                const res = await axios.get('/api/regional/routes');
                setRoutes(res.data);
            } else if (menu === 'incidents') {
                const res = await axios.get('/api/regional/incidents');
                setIncidents(res.data);
            } else if (menu === 'complaints') {
                const res = await axios.get('/api/regional/complaints');
                setComplaints(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex h-full items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-white rounded-full animate-spin"></div>
                </div>
            );
        }

        switch (activeMenu) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider text-xs px-2 py-1 rounded">Regional Transport Administration</span>
                                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-2">
                                    <Building className="w-6 h-6 text-white" />
                                    Region: {dashboardData?.region?.name || 'Authorized Region'}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Corporation: {dashboardData?.region?.corporation_name || 'TNSTC'}</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-sm font-bold text-slate-300">Live Connection</span>
                                </div>
                                <span className="text-xs text-slate-500 mt-1">Admin ID: {user?.user_id}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard title="Total Buses (Region)" value={dashboardData?.total_buses || 0} icon={Bus} color="border-slate-700 text-slate-300" />
                            <MetricCard title="Active Trips" value={dashboardData?.active_buses || 0} trend="Live" icon={Activity} color="border-emerald-500/30 text-emerald-400" />
                            <MetricCard title="Passengers Today" value={dashboardData?.passengers_today || 0} icon={Users} color="border-blue-500/30 text-blue-400" />
                            <MetricCard title="Critical Incidents" value={dashboardData?.critical_incidents || 0} trend="Review" icon={AlertTriangle} color="border-rose-500/30 text-rose-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-[450px] flex flex-col">
                                <div className="mb-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-300">Regional Live Operations Map</h3>
                                        <p className="text-xs text-slate-500">Live operational boundaries isolated securely</p>
                                    </div>
                                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">{Math.max(1, Object.keys(liveBuses).length)} buses tracked</span>
                                </div>
                                <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
                                    <FleetMap buses={Object.values(liveBuses)} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                                    <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Issue Tracking</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-300">Open Complaints</span>
                                            <strong className="text-amber-400">{dashboardData?.open_complaints || 0}</strong>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-300">Escalated Complaints</span>
                                            <strong className="text-rose-400">{dashboardData?.escalated_complaints || 0}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                                    <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Quick Escalate</h3>
                                    <p className="text-xs text-slate-400 mb-4">Escalate critical items up to State Administration directly.</p>
                                    <button onClick={() => loadTabData('incidents')} className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded transition">Escalate Incident</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'depots':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Building className="w-5 h-5 text-indigo-400" /> Regional Depot Monitoring
                        </h2>
                        <DataTable
                            columns={['Depot ID', 'Depot Name', 'Depot Code', 'Address', 'Status']}
                            data={depots.map(d => [
                                '#' + d.depot_id,
                                <strong className="text-white">{d.name}</strong>,
                                <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">{d.code}</span>,
                                d.address,
                                <StatusBadge status={d.status} />
                            ])}
                        />
                    </div>
                );

            case 'routes':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-emerald-400" /> Regional Route Monitoring
                        </h2>
                        <p className="text-sm text-slate-400 mb-4">Showing long-distance and local routes servicing depots in your authorized Region.</p>
                        <DataTable
                            columns={['Route Code', 'Name', 'Source', 'Destination', 'Distance', 'Auth Scope']}
                            data={routes.map(r => [
                                <strong className="text-emerald-400">{r.route_code}</strong>,
                                r.name,
                                r.source_city,
                                r.destination_city,
                                r.total_distance_km + ' km',
                                <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-[10px]">Strict</span>
                            ])}
                        />
                    </div>
                );

            case 'incidents':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-400" /> Active Regional Incidents
                            </h2>
                        </div>
                        <DataTable
                            columns={['Incident ID', 'Type', 'Severity', 'Location', 'Status', 'Escalate']}
                            data={incidents.map(i => [
                                '#' + i.incident_id,
                                i.incident_type,
                                <StatusBadge status={i.severity} />,
                                i.location,
                                <StatusBadge status={i.status} />,
                                <button className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded hover:bg-rose-500 hover:text-white transition">Escalate</button>
                            ])}
                        />
                    </div>
                );

            case 'complaints':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-amber-400" /> Escalated Complaints Monitoring
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

            default:
                return <div className="text-slate-400 h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">Section Under Construction...</div>;
        }
    };

    return (
        <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-64px)] bg-slate-950">

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col pt-6 hidden md:flex overflow-y-auto">
                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Regional Dashboard</div>
                    <SidebarItem icon={Activity} label="Live Operations" active={activeMenu === 'overview'} onClick={() => loadTabData('overview')} />
                </div>

                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Depots</div>
                    <SidebarItem icon={Building} label="Depot Overview" active={activeMenu === 'depots'} onClick={() => loadTabData('depots')} />
                    <SidebarItem icon={BarChart3} label="Depot Performance" active={activeMenu === 'depot_perf'} onClick={() => { }} />
                </div>

                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Routes</div>
                    <SidebarItem icon={Navigation} label="Route Monitoring" active={activeMenu === 'routes'} onClick={() => loadTabData('routes')} />
                    <SidebarItem icon={Clock} label="Schedule Monitoring" active={activeMenu === 'schedules'} onClick={() => { }} />
                </div>

                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Passenger Services</div>
                    <SidebarItem icon={MessageSquare} label="Complaints" active={activeMenu === 'complaints'} onClick={() => loadTabData('complaints')} />
                    <SidebarItem icon={AlertTriangle} label="Incidents" active={activeMenu === 'incidents'} onClick={() => loadTabData('incidents')} />
                </div>

                <div className="px-6 mb-4 mt-auto pb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Analytics & Alerting</div>
                    <SidebarItem icon={MonitorSpeaker} label="Regional Alerts" active={activeMenu === 'alerts'} onClick={() => { }} />
                    <SidebarItem icon={Users} label="Passenger Demand" active={activeMenu === 'demand'} onClick={() => { }} />
                    <SidebarItem icon={ListRestart} label="Audit Logs" active={activeMenu === 'audit'} onClick={() => { }} />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto w-full">
                {renderContent()}
            </main>

        </div>
    );
};

// Reusable components
const StatusBadge = ({ status }) => {
    let color = 'bg-slate-500/20 text-slate-400';
    if (status === 'Active' || status === 'Approved' || status === 'Resolved') color = 'bg-emerald-500/30 text-emerald-400 font-bold border border-emerald-500/30';
    else if (status === 'Pending Review' || status === 'Open') color = 'bg-amber-500/30 text-amber-400 font-bold border border-amber-500/30';
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
            {trend && <span className={`text-xs font-bold ${trend === 'Alert' ? 'text-rose-400 bg-rose-400/10' : 'text-emerald-400 bg-emerald-400/10'} px-1.5 py-0.5 rounded mb-1`}>{trend}</span>}
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

export default RegionalAdminDashboard;
