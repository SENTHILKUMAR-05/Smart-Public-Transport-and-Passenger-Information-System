import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ShieldAlert, Bus, Users, Activity, BarChart3, Settings, AlertTriangle,
    MapPin, CheckCircle2, Navigation, Layers, PhoneCall, ListRestart, MonitorSpeaker
} from 'lucide-react';
import FleetMap from '../components/Map/FleetMap';
import { useSocket } from '../context/SocketContext';

// Standard reusable Sidebar Item
const SidebarItem = ({ icon: Icon, label, active, onClick, hasSubItems }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
    >
        <Icon className="w-4 h-4" />
        <span className="flex-1 text-left">{label}</span>
        {hasSubItems && <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tab</span>}
    </button>
);

const StateAdminDashboard = () => {
    const [activeMenu, setActiveMenu] = useState('overview');
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { liveBuses } = useSocket();

    // Tab data placeholders
    const [corporations, setCorporations] = useState([]);
    const [regions, setRegions] = useState([]);
    const [depots, setDepots] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('All');
    const [districtSearch, setDistrictSearch] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/state-admin/dashboard');
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
            if (menu === 'corporations') {
                const res = await axios.get('/api/state-admin/corporations');
                setCorporations(res.data);
            } else if (menu === 'regions') {
                const res = await axios.get('/api/state-admin/regions');
                setRegions(res.data);
            } else if (menu === 'depots') {
                const res = await axios.get('/api/state-admin/depots');
                setDepots(res.data);
            } else if (menu === 'route_proposals') {
                const res = await axios.get('/api/state-admin/routes/proposals');
                setProposals(res.data);
            } else if (menu === 'incidents') {
                const res = await axios.get('/api/state-admin/incidents');
                setIncidents(res.data);
            } else if (menu === 'alerts') {
                const res = await axios.get('/api/state-admin/alerts');
                setAlerts(res.data);
            } else if (menu === 'complaints') {
                const res = await axios.get('/api/state-admin/complaints');
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
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-white rounded-full animate-spin"></div>
                </div>
            );
        }

        switch (activeMenu) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-brand-500" />
                            Statewide Operations Overview (Tamil Nadu)
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard title="Total Corporations" value={dashboardData?.corporations} trend="+" icon={Layers} color="border-indigo-500/30 text-indigo-400" />
                            <MetricCard title="Total Regions" value={dashboardData?.regions} trend="+" icon={MapPin} color="border-blue-500/30 text-blue-400" />
                            <MetricCard title="Active Buses (Real-time)" value={dashboardData?.active_trips || '0'} trend="+" icon={Bus} color="border-emerald-500/30 text-emerald-400" />
                            <MetricCard title="Delayed/Emergency" value={(dashboardData?.delayed || 0) + (dashboardData?.critical_incidents || 0)} trend="Alert" icon={AlertTriangle} color="border-amber-500/30 text-amber-400" />
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-[500px] flex flex-col">
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-slate-300">Live TNSTC/SETC Fleet Map</h3>
                                <p className="text-xs text-slate-500">Live tracking of ongoing trips matching backend active buses</p>
                            </div>
                            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
                                <FleetMap buses={Object.values(liveBuses)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">State Transport Analytics Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-300">Passengers Today</span>
                                        <strong className="text-emerald-400">{dashboardData?.passengers_today?.toLocaleString() || 0}</strong>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-300">Open Complaints</span>
                                        <strong className="text-amber-400">{dashboardData?.open_complaints || 0}</strong>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-300">Critical Incidents</span>
                                        <strong className="text-rose-400">{dashboardData?.critical_incidents || 0}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => loadTabData('alerts')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-slate-300 transition text-left">Publish Alert</button>
                                    <button onClick={() => loadTabData('route_proposals')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-slate-300 transition text-left">Review Proposals</button>
                                    <button onClick={() => loadTabData('incidents')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-slate-300 transition text-left">View Escalations</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'corporations':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-400" /> Manage Corporations
                        </h2>
                        <DataTable
                            columns={['Corporation ID', 'Corporation Name', 'Corporation Code', 'Description', 'Status', 'Created Date']}
                            data={corporations.map(c => [
                                '#' + c.corporation_id,
                                <strong className="text-white">{c.name}</strong>,
                                <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">{c.code}</span>,
                                c.description || 'N/A',
                                <StatusBadge status={c.status} />,
                                c.created_at?.split(' ')[0]
                            ])}
                        />
                    </div>
                );

            case 'regions':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-400" /> Manage Regions
                        </h2>
                        <DataTable
                            columns={['Region ID', 'Region Name', 'Region Code', 'Corporation', 'Status', 'Created Date']}
                            data={regions.map(r => [
                                '#' + r.region_id,
                                <strong className="text-white">{r.name}</strong>,
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">{r.code}</span>,
                                r.corporation_name,
                                <StatusBadge status={r.status} />,
                                r.created_at?.split(' ')[0]
                            ])}
                        />
                    </div>
                );

            case 'depots':
                const uniqueRegions = [...new Set(depots.map(d => d.region_name))].filter(Boolean).sort();
                
                // District view (All)
                if (selectedRegion === 'All') {
                    const districtStats = uniqueRegions.map(r => ({
                        name: r,
                        displayName: r.replace(' District', ''),
                        talukCount: depots.filter(d => d.region_name === r).length
                    })).filter(d => d.displayName.toLowerCase().includes(districtSearch.toLowerCase()));

                    return (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-4">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
                                        <MapPin className="w-6 h-6 text-brand-500" /> Tamil Nadu Districts
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-1">Select a district to view its taluks and depots.</p>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Search districts..." 
                                        className="bg-slate-900 border border-slate-700 text-white text-sm rounded-full focus:ring-brand-500 focus:border-brand-500 block w-64 p-2.5 pl-4 outline-none shadow-inner"
                                        value={districtSearch}
                                        onChange={(e) => setDistrictSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {districtStats.map(dist => (
                                    <div 
                                        key={dist.name}
                                        onClick={() => { setSelectedRegion(dist.name); setDistrictSearch(''); }}
                                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-brand-500 hover:bg-slate-800/80 transition-all group shadow-lg hover:shadow-brand-500/10 flex flex-col items-center text-center relative overflow-hidden"
                                    >
                                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                        <MapPin className="w-8 h-8 text-slate-600 group-hover:text-brand-400 transition-colors mb-3" />
                                        <h3 className="text-white font-bold text-base mb-1 group-hover:text-brand-300">{dist.displayName}</h3>
                                        <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-medium border border-slate-700 group-hover:border-brand-500/30 group-hover:text-brand-200">
                                            {dist.talukCount} Taluks
                                        </span>
                                    </div>
                                ))}
                                {districtStats.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-slate-500">
                                        No districts found matching "{districtSearch}"
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }

                // Drill-down view (Specific District)
                const filteredDepots = depots.filter(d => d.region_name === selectedRegion);
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2 border-b border-slate-800 pb-4">
                            <button 
                                onClick={() => setSelectedRegion('All')}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                                title="Back to Districts"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                            <div>
                                <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
                                    <Bus className="w-6 h-6 text-emerald-400" /> 
                                    {selectedRegion.replace(' District', '')} Taluks
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Managing {filteredDepots.length} taluks in {selectedRegion}.</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden p-1">
                            <DataTable
                                columns={['Taluk Name', 'Code', 'Address / Location', 'Status']}
                                data={filteredDepots.map(d => [
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <MapPin className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <strong className="text-white text-base">{d.name.replace(' Taluk', '')}</strong>
                                    </div>,
                                    <span className="bg-slate-800 text-emerald-400 px-3 py-1.5 rounded-md text-xs font-bold tracking-widest border border-slate-700 shadow-inner">{d.code}</span>,
                                    <span className="text-slate-400 text-sm flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-slate-500"/> {d.address}</span>,
                                    <StatusBadge status={d.status} />
                                ])}
                            />
                        </div>
                    </div>
                );

            case 'route_proposals':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Navigation className="w-5 h-5 text-brand-400" /> Route Governance & Proposals
                            </h2>
                        </div>
                        <DataTable
                            columns={['Proposal ID', 'Source', 'Destination', 'Distance', 'Regions Covered', 'Estimated Demand', 'Status']}
                            data={proposals.map(p => [
                                '#' + p.proposal_id,
                                p.source,
                                p.destination,
                                p.distance_km + ' km',
                                p.regions_covered,
                                <span className="text-amber-400 font-bold">{p.estimated_demand}</span>,
                                <StatusBadge status={p.status} />
                            ])}
                        />
                    </div>
                );

            case 'alerts':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                            <h2 className="text-xl font-bold text-white">Statewide & Emergency Alerts</h2>
                            <button className="bg-brand-600 hover:bg-brand-500 text-white text-xs px-4 py-2 rounded-lg transition font-bold">+ New Alert</button>
                        </div>
                        <DataTable
                            columns={['ID', 'Title', 'Type', 'Priority', 'Target Scope']}
                            data={alerts.map(a => [a.alert_id, a.title, a.alert_type, a.priority, a.target_scope])}
                        />
                    </div>
                );

            case 'incidents':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Incident Monitoring</h2>
                        <DataTable
                            columns={['ID', 'Type', 'Severity', 'Location', 'Description', 'Status']}
                            data={incidents.map(i => [i.incident_id, i.incident_type, i.severity, i.location, i.description, i.status])}
                        />
                    </div>
                );

            case 'complaints':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Escalated Complaints Monitor</h2>
                        <DataTable
                            columns={['ID', 'Category', 'Severity', 'Location', 'Reported By', 'Status']}
                            data={complaints.map(c => [c.complaint_id, c.category, c.severity, c.location, c.reported_by, c.status])}
                        />
                    </div>
                );

            case 'analytics':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-400" /> System Analytics
                        </h2>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-lg">
                            <BarChart3 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-300">Advanced Analytics Coming Soon</h3>
                            <p className="text-slate-500 max-w-md mx-auto mt-2">The AI-driven analytics module is currently being calibrated with statewide passenger density and routing data.</p>
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-400" /> Global Settings
                        </h2>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                            <div className="grid gap-6 max-w-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-slate-200 font-bold">Real-time GPS Tracking</h4>
                                        <p className="text-sm text-slate-500">Enable WebSocket stream from buses</p>
                                    </div>
                                    <div className="w-12 h-6 bg-brand-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-slate-200 font-bold">AI Predictive Alerts</h4>
                                        <p className="text-sm text-slate-500">Auto-generate alerts for predicted delays</p>
                                    </div>
                                    <div className="w-12 h-6 bg-brand-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div className="text-slate-400">Section Under Construction...</div>;
        }
    };

    return (
        <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-64px)] bg-slate-950">

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col pt-6 hidden md:flex">
                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Main Menu</div>
                    <SidebarItem icon={Activity} label="State Overview" active={activeMenu === 'overview'} onClick={() => loadTabData('overview')} />
                </div>

                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Organization</div>
                    <SidebarItem icon={Layers} label="Corporations" active={activeMenu === 'corporations'} onClick={() => loadTabData('corporations')} />
                    <SidebarItem icon={MapPin} label="Regions" active={activeMenu === 'regions'} onClick={() => loadTabData('regions')} />
                    <SidebarItem icon={Bus} label="Depots" active={activeMenu === 'depots'} onClick={() => loadTabData('depots')} />
                </div>

                <div className="px-6 mb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Governance & Ops</div>
                    <SidebarItem icon={Navigation} label="Route Proposals" active={activeMenu === 'route_proposals'} onClick={() => loadTabData('route_proposals')} />
                    <SidebarItem icon={MonitorSpeaker} label="Alerts & Emergencies" active={activeMenu === 'alerts'} onClick={() => loadTabData('alerts')} />
                    <SidebarItem icon={AlertTriangle} label="Incident Monitoring" active={activeMenu === 'incidents'} onClick={() => loadTabData('incidents')} />
                    <SidebarItem icon={PhoneCall} label="Complaints Viewer" active={activeMenu === 'complaints'} onClick={() => loadTabData('complaints')} />
                </div>

                <div className="px-6 mb-4 mt-auto pb-4">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">System</div>
                    <SidebarItem icon={BarChart3} label="Analytics (Soon)" active={activeMenu === 'analytics'} onClick={() => loadTabData('analytics')} />
                    <SidebarItem icon={Settings} label="Global Settings" active={activeMenu === 'settings'} onClick={() => loadTabData('settings')} />
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
    else if (status === 'Escalated' || status === 'Critical' || status === 'High') color = 'bg-rose-500/30 text-rose-400 font-bold border border-rose-500/30';

    return <span className={`px-2 py-1 rounded text-[11px] uppercase tracking-wider ${color}`}>{status}</span>;
};

const MetricCard = ({ title, value, trend, icon: Icon, color }) => (
    <div className={`bg-slate-900 border ${color} rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:bg-slate-800/80 cursor-pointer`}>
        <Icon className={`w-8 h-8 absolute -right-2 -bottom-2 opacity-10`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-black text-white">{value}</span>
            {trend && <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded mb-1">{trend}</span>}
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
                                <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-bold text-slate-300' : 'text-slate-400'}`}>
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

export default StateAdminDashboard;
