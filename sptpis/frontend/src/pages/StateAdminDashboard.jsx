import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ShieldAlert, Bus, Users, Activity, BarChart3, Settings, AlertTriangle,
    MapPin, CheckCircle2, Navigation, Layers, PhoneCall, ListRestart, MonitorSpeaker,
    PieChart, Zap, IndianRupee, HandCoins, Globe, TrendingUp, Radio, Megaphone, CloudRain, Trash2, Plus, X, Clock, Route, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [fareRate, setFareRate] = useState(1.35);
    const [analyticsTimeframe, setAnalyticsTimeframe] = useState('Last 7 Days');
    const [hiddenComplaints, setHiddenComplaints] = useState([]);
    const [hiddenIncidents, setHiddenIncidents] = useState([]);
    const [hiddenProposals, setHiddenProposals] = useState([]);
    const [isCreatingAlert, setIsCreatingAlert] = useState(false);
    const [isAddingCorp, setIsAddingCorp] = useState(false);
    const [managingCorp, setManagingCorp] = useState(null);
    
    const { triggerGlobalAlert } = useSocket();

    const triggerNotification = (title, message) => {
        if (triggerGlobalAlert) {
            triggerGlobalAlert({ title, message });
        }
    };

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
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex justify-between items-end mb-4 border-b border-slate-800/80 pb-6 relative">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-500/10 blur-[60px] rounded-full pointer-events-none -z-10"></div>
                            <div>
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter">
                                    State Command
                                </h2>
                                <p className="text-slate-400 mt-3 font-semibold text-sm">Global operations, live fleet telemetry, and automated diagnostics.</p>
                            </div>
                        </div>

                        {/* Top Metrics Grid */}
                        <motion.div 
                            initial="hidden" 
                            animate="visible" 
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                            }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6"
                        >
                            <MetricCard title="Total Fleet Asset" value="23,450" trend="+12 Added" icon={Layers} color="border-indigo-500/40 text-indigo-400" />
                            <MetricCard title="Gross Rev (Today)" value="₹1.42 Cr" trend="Up 4%" icon={IndianRupee} color="border-emerald-500/40 text-emerald-400" />
                            <MetricCard title="Active Network" value={dashboardData?.active_trips || '3,012'} trend="High Yield" icon={Zap} color="border-amber-500/40 text-amber-400" />
                            <MetricCard title="System Alerts" value={(dashboardData?.delayed || 0) + (dashboardData?.critical_incidents || 0)} trend="Needs Attn" icon={AlertTriangle} color="border-rose-500/40 text-rose-400" />
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"
                        >
                            {/* Real-time map takes up 2/3 of space in large screens */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-brand-900/20 flex flex-col min-h-[500px]">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 relative z-10 gap-3">
                                    <div>
                                        <h3 className="text-lg font-black text-white">Live Operations Heatmap</h3>
                                        <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mt-1">SATELLITE TRACKING • {Object.values(liveBuses).length} ACTIVE NODES</p>
                                    </div>
                                    <div className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-black tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                                        TN JURISDICTION
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden relative ring-1 ring-white/10 shadow-inner">
                                    <FleetMap buses={Object.values(liveBuses)} />
                                </div>
                            </div>

                            {/* Side Analytics Panel */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-[24px] p-6 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/0 to-transparent"></div>
                                    <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center justify-between relative z-10">
                                        <span className="flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400 animate-pulse" /> State Pulse</span>
                                        <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded-md border border-slate-700">LIVE</span>
                                    </h3>
                                    <div className="space-y-6 relative z-10">
                                        {[
                                            { label: 'Passenger Turnout', val: dashboardData?.passengers_today?.toLocaleString() || '1,420,551', color: 'text-indigo-400', bar: '85%', bg: 'bg-indigo-500' },
                                            { label: 'Expected Revenue', val: '₹1.42 Cr', color: 'text-emerald-400', bar: '92%', bg: 'bg-emerald-500' },
                                            { label: 'Open Critical Esc.', val: dashboardData?.critical_incidents || '14', color: 'text-rose-400', bar: '15%', bg: 'bg-rose-500' }
                                        ].map((item, idx) => (
                                            <motion.div key={idx} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 * idx, type: 'spring' }} className="group/item">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wide group-hover/item:text-slate-300 transition-colors">{item.label}</span>
                                                    <strong className={`text-lg font-black tracking-tight ${item.color}`}>{item.val}</strong>
                                                </div>
                                                <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-800/80 relative">
                                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: item.bar }} transition={{ duration: 1.5, delay: 0.2, type: 'spring' }} className={`${item.bg} h-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.4)] relative overflow-hidden`}>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/item:animate-[shimmer_1.5s_infinite]"></div>
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-brand-900/40 to-slate-900 border border-brand-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-500/20 blur-2xl rounded-full"></div>
                                    <h3 className="font-black text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-brand-400" /> Fast Execution
                                    </h3>
                                    <div className="space-y-3 relative z-10">
                                        <button onClick={() => loadTabData('settings')} className="w-full px-4 py-3 bg-slate-800/80 hover:bg-brand-600/20 border border-slate-700/50 hover:border-brand-500/50 rounded-xl text-sm font-semibold text-slate-200 transition-all text-left flex justify-between items-center group shadow-md hover:shadow-brand-500/20">
                                            Update State Policy <ShieldAlert className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
                                        </button>
                                        <button onClick={() => loadTabData('alerts')} className="w-full px-4 py-3 bg-slate-800/80 hover:bg-amber-600/20 border border-slate-700/50 hover:border-amber-500/50 rounded-xl text-sm font-semibold text-slate-200 transition-all text-left flex justify-between items-center group shadow-md hover:shadow-amber-500/20">
                                            Issue Emergency Alert <AlertTriangle className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                );

            case 'corporations':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6 relative">
                            <div className="absolute top-0 right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
                            <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/5 rounded-xl border border-indigo-500/20 shadow-inner">
                                        <Layers className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    State Transport Corporations
                                </h2>
                                <p className="text-slate-400 mt-2 font-medium">Manage top-level structural entities (e.g., SETC, TNSTC zones).</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsAddingCorp(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 text-sm flex items-center gap-2 hover:-translate-y-1 active:scale-95">
                                    <Plus className="w-4 h-4"/> Add Corporation
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {corporations.map((c, i) => (
                                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: 'spring' }} whileHover={{ y: -5, boxShadow: '0 10px 40px -10px rgba(99,102,241, 0.2)' }} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 hover:border-indigo-500/50 rounded-3xl p-6 relative flex flex-col group transition-all duration-300 shadow-xl overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>
                                     <div className="flex justify-between items-start mb-4 relative z-10">
                                         <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded shadow-inner font-black uppercase tracking-widest text-lg">{c.code}</div>
                                         <StatusBadge status={c.status} />
                                     </div>
                                     <h3 className="text-xl font-black text-white mb-2 relative z-10">{c.name}</h3>
                                     <p className="text-slate-400 text-sm mb-6 flex-1 relative z-10 line-clamp-2">"{c.description || 'Primary transport division governing specified regions and operations within the state administrative body.'}"</p>
                                     <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-4 relative z-10">
                                         <div>
                                            <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Corporate ID</div>
                                            <div className="text-sm font-black text-white font-mono">#{c.corporation_id}</div>
                                         </div>
                                         <div className="flex flex-col items-end">
                                            <button onClick={() => setManagingCorp(c)} className="text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-1 group/btn"><Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-300"/> Manage</button>
                                         </div>
                                     </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'regions':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6 relative">
                            <div className="absolute top-0 right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
                            <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/5 rounded-xl border border-blue-500/20 shadow-inner">
                                        <MapPin className="w-6 h-6 text-blue-400" />
                                    </div>
                                    Regional Administration
                                </h2>
                                <p className="text-slate-400 mt-2 font-medium">Manage and monitor geographic operation zones state-wide.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input type="text" placeholder="Search regions..." className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 outline-none w-64 p-2.5 pl-4 shadow-inner" />
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-lg shadow-blue-500/20 text-sm whitespace-nowrap">
                                    + Add Region
                                </button>
                            </div>
                        </div>

                        {/* Regional Data Visualizations */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 flex justify-between items-center">
                                    38-District Live Operations Cloud
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                    </span>
                                </h4>
                                <div className="flex flex-wrap gap-2 h-44 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                                    {[
                                        "Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Tiruppur", "Karur", "Namakkal", "Kanyakumari", "Nilgiris", "Dharmapuri", "Krishnagiri", "Cuddalore", "Villupuram", "Kanchipuram", "Tiruvallur", "Chengalpattu", "Ranipet", "Tirupathur", "Ramanathapuram", "Sivaganga", "Virudhunagar", "Pudukkottai", "Nagapattinam", "Tiruvarur", "Mayiladuthurai", "Ariyalur", "Perambalur", "Kallakurichi", "Tenkasi", "Tiruvannamalai", "The Nilgiris"
                                    ].map((dist, i) => {
                                        let state = 'Optimal';
                                        let css = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/20';
                                        if (i % 8 === 0) {
                                            state = 'High Vol';
                                            css = 'border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20';
                                        } else if (i % 15 === 0) {
                                            state = 'Critical';
                                            css = 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]';
                                        }

                                        return (
                                            <motion.div 
                                                initial={{ scale: 0, opacity: 0 }} 
                                                animate={{ scale: 1, opacity: 1 }} 
                                                transition={{ delay: i * 0.01 }}
                                                whileHover={{ scale: 1.1, zIndex: 10 }}
                                                key={i} 
                                                className={`text-[9px] font-bold px-2.5 py-1.5 border rounded-md cursor-crosshair transition-colors duration-200 group relative ${css}`}
                                            >
                                                {dist}
                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl uppercase font-bold tracking-wider">
                                                    Status: {state}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Regional Revenue Distribution</h4>
                                <div className="flex gap-3 items-center mt-2">
                                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 relative shadow-inner">
                                        <motion.div initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]"></motion.div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between text-xs"><span className="text-purple-400 font-bold">Urban Zones</span><span className="text-white">65%</span></div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full"><motion.div initial={{width:0}} animate={{width:'65%'}} transition={{duration:1}} className="h-full bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></motion.div></div>
                                        <div className="flex items-center justify-between text-xs"><span className="text-indigo-400 font-bold">Rural Links</span><span className="text-white">35%</span></div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full"><motion.div initial={{width:0}} animate={{width:'35%'}} transition={{duration:1, delay:0.2}} className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></motion.div></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-xl rounded-full"></div>
                                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Overall Efficiency Index</h4>
                                <div className="text-3xl font-black text-white mt-1 relative z-10">94.2%</div>
                                <div className="flex items-center gap-2 mt-2 relative z-10">
                                    <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">+2.4% vs last mo.</span>
                                </div>
                                <div className="mt-4 relative z-10">
                                     <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none"><motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} d="M0,20 Q10,5 20,15 T40,10 T60,18 T80,5 T100,10" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]"/></svg>
                                </div>
                            </div>
                        </div>

                        <DataTable
                            columns={['Region ID', 'Region Name', 'Region Code', 'Corporation', 'Status']}
                            data={regions.map(r => [
                                <span className="font-mono text-slate-500 font-bold">#{r.region_id}</span>,
                                <span className="text-slate-100 font-bold tracking-wide">{r.name}</span>,
                                <span className="bg-slate-900 border border-slate-700 text-blue-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-inner">{r.code}</span>,
                                <span className="text-slate-300 font-medium text-xs">{r.corporation_name}</span>,
                                <StatusBadge status={r.status} />
                            ])}
                        />
                    </motion.div>
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
                const mockProposals = [
                    { proposal_id: "8719", source: "Chennai CMBT", destination: "Madurai Mattuthavani", distance_km: 462, regions_covered: "Chennai, Trichy, Madurai", estimated_demand: "Very High" },
                    { proposal_id: "8722", source: "Coimbatore Gandhipuram", destination: "Bangalore Majestic", distance_km: 365, regions_covered: "Coimbatore, Salem, Hosur", estimated_demand: "High" },
                    { proposal_id: "8745", source: "Trichy Central", destination: "Kanyakumari", distance_km: 382, regions_covered: "Trichy, Madurai, Tirunelveli", estimated_demand: "Moderate" },
                    { proposal_id: "8751", source: "Salem New Stand", destination: "Pondicherry", distance_km: 220, regions_covered: "Salem, Villupuram", estimated_demand: "High" },
                    { proposal_id: "8773", source: "Vellore", destination: "Tirupati", distance_km: 110, regions_covered: "Vellore", estimated_demand: "Very High" },
                    { proposal_id: "8790", source: "Tirunelveli", destination: "Chennai Kilambakkam", distance_km: 620, regions_covered: "TNL, Madurai, Trichy, CHN", estimated_demand: "Critical" }
                ];
                const activeProposals = mockProposals.filter(p => !hiddenProposals.includes(p.proposal_id));
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl">
                        <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6 relative">
                            <div className="absolute left-0 top-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
                            <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                                    <div className="p-3 bg-gradient-to-br from-emerald-600/30 to-teal-600/10 rounded-2xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                        <Route className="w-7 h-7 text-emerald-400 animate-pulse" />
                                    </div>
                                    Route Governance & Proposals
                                </h2>
                                <p className="text-slate-400 mt-2 font-medium">Review and validate new route expansions proposed by regional admins.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-slate-900 border border-slate-700 px-5 py-2.5 rounded-xl shadow-inner relative overflow-hidden flex items-center gap-3">
                                    <div className="text-sm uppercase font-bold text-slate-300 tracking-wider z-10 relative">{activeProposals.length} Pending Approvals</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AnimatePresence>
                                {activeProposals.length === 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full p-12 text-center text-slate-400 font-bold border border-slate-800 rounded-2xl bg-slate-900/50">
                                        All route proposals have been processed.
                                    </motion.div>
                                ) : activeProposals.map((p, i) => (
                                    <motion.div layout key={p.proposal_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.3 } }} transition={{ delay: i * 0.1, type: 'spring', bounce: 0.3 }} whileHover={{ y: -4, boxShadow: '0 15px 40px -15px rgba(16,185,129, 0.15)' }} className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-700/80 hover:border-emerald-500/50 rounded-3xl p-6 relative flex flex-col group transition-colors duration-300 shadow-xl overflow-hidden">
                                        
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-3 py-1.5 rounded-md shadow-inner border border-slate-600 font-bold tracking-widest">PROP-{p.proposal_id}</span>
                                            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-emerald-500/20 shadow-inner">
                                                <Activity className="w-3 h-3"/> Yield: {p.estimated_demand}
                                            </span>
                                        </div>

                                        {/* Route Visualizer */}
                                        <div className="flex items-center justify-between mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-inner relative">
                                            {/* Animated dotted line */}
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 border-t-2 border-dashed border-slate-600 group-hover:border-emerald-500/50 transition-colors"></div>
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 overflow-hidden h-6">
                                                <Bus className="w-4 h-4 text-emerald-500 mt-1 origin-left -translate-x-full group-hover:translate-x-[400%] transition-transform duration-[2s] ease-linear"/>
                                            </div>

                                            <div className="text-center w-[45%] z-10">
                                                <div className="w-10 h-10 mx-auto bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 mb-2 shadow-inner group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors"><MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-400"/></div>
                                                <h4 className="text-xs font-black text-white truncate px-1">{p.source}</h4>
                                            </div>
                                            <div className="text-center w-[45%] z-10">
                                                <div className="w-10 h-10 mx-auto bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 mb-2 shadow-inner group-hover:border-brand-500/30 group-hover:bg-brand-500/10 transition-colors"><MapPin className="w-4 h-4 text-slate-400 group-hover:text-brand-400"/></div>
                                                <h4 className="text-xs font-black text-white truncate px-1">{p.destination}</h4>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 mt-auto">
                                            <div>
                                                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Total Distance</div>
                                                <div className="text-sm font-black text-white font-mono">{p.distance_km} KM</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Regions Crossed</div>
                                                <div className="text-sm font-bold text-slate-300 truncate">{p.regions_covered}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 relative z-10 pt-2 border-t border-slate-800">
                                            <button onClick={() => {
                                                triggerGlobalAlert('success', `Proposal PROP-${p.proposal_id} approved. Dispatch team notified.`, 'Moderate');
                                                setHiddenProposals(prev => [...prev, p.proposal_id]);
                                            }} className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-emerald-500/30 flex justify-center items-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-1">
                                                <Check className="w-4 h-4"/> Approve
                                            </button>
                                            <button onClick={() => {
                                                triggerGlobalAlert('error', `Proposal PROP-${p.proposal_id} rejected. Return to planning.`, 'Low');
                                                setHiddenProposals(prev => [...prev, p.proposal_id]);
                                            }} className="flex-1 bg-rose-600/10 hover:bg-rose-500 text-rose-400 hover:text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-rose-500/20 flex justify-center items-center gap-2 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:-translate-y-1">
                                                <X className="w-4 h-4"/> Reject
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );

            case 'alerts':
                const liveAlerts = [
                    { id: "ALT-192", title: "Pongal Special Services Active", type: "Festival Special", priority: "Medium", target: "Entire State", time: "2 Hrs Ago" },
                    { id: "ALT-193", title: "Heavy Rain Warning (Coastal)", type: "Weather", priority: "High", target: "Chennai, Cuddalore Regions", time: "5 Mins Ago" }
                ];

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
                       <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6 relative">
                            <div className="absolute left-0 top-0 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full pointer-events-none"></div>
                            <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                                    <div className="p-3 bg-gradient-to-br from-brand-600/30 to-purple-600/10 rounded-2xl border border-brand-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                        <Megaphone className="w-7 h-7 text-brand-400 hover:-rotate-12 transition-transform" />
                                    </div>
                                    Statewide Broadcasts
                                </h2>
                                <p className="text-slate-400 mt-2 font-medium">Issue mass-alerts directly to driver terminals and passenger apps.</p>
                            </div>
                            <button onClick={() => setIsCreatingAlert(true)} className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-black px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] flex items-center gap-2 hover:scale-105 active:scale-95 text-sm border-b-2 border-brand-700 active:border-b-0 active:translate-y-px z-10 relative">
                                <Plus className="w-5 h-5"/> New Global Alert
                            </button>
                        </div>

                        <div className="space-y-4">
                            {liveAlerts.map((alt, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/60 border border-slate-700/50 p-5 rounded-2xl hover:border-brand-500/40 transition-all hover:bg-slate-800/60 shadow-lg group gap-4 relative overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 w-1 bg-slate-700 group-hover:bg-brand-500 transition-colors"></div>
                                    <div className="flex items-center gap-5 pl-2">
                                        <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center border border-slate-700 group-hover:border-brand-500/50 transition-colors shadow-inner flex-shrink-0">
                                            {alt.type === 'Weather' ? <CloudRain className="w-7 h-7 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" /> : <Radio className="w-7 h-7 text-brand-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"/>}
                                        </div>
                                        <div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                                <h4 className="text-lg font-bold text-white tracking-wide">{alt.title}</h4>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shadow-inner max-w-max ${alt.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-brand-500/10 text-brand-400 border-brand-500/30'}`}>{alt.priority} Priority</span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 uppercase tracking-wider bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/80 w-fit">
                                                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 opacity-70"/> {alt.target}</span> 
                                                <span className="text-slate-600">&bull;</span> 
                                                <span className="flex items-center gap-1.5 text-indigo-300"><Clock className="w-3.5 h-3.5 opacity-70"/> {alt.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="sm:self-center self-end w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-colors border border-slate-700 hover:border-rose-500/30 text-slate-500 shrink-0"><Trash2 className="w-4 h-4"/></button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'incidents':
                const initialIncidents = [
                    { id: "INC-817", type: "Major Breakdown", severity: "High", location: "Omalur Bypass, TN-30-H-1922", description: "Engine overheating leading to complete halt. Replacement bus requested from Salem depot.", status: "Dispatching Relief", time: "10 Mins Ago", coord: "11.742° N, 78.058° E" },
                    { id: "INC-822", type: "Traffic Blockade", severity: "Medium", location: "Chennai - Tambaram Route", description: "Local protest blocking the main arterial road. 12 buses currently stuck or rerouting.", status: "Rerouting Active", time: "25 Mins Ago", coord: "12.924° N, 80.110° E" },
                    { id: "INC-839", type: "Minor Accident", severity: "Critical", location: "Madurai Ring Road", description: "Rear-ended by a commercial truck. Passengers safe, minor damages. Police arriving.", status: "Emergency Response", time: "Just Now", coord: "9.896° N, 78.145° E" }
                ];
                
                const activeIncidents = initialIncidents.filter(inc => !hiddenIncidents.includes(inc.id));
                
                const handleTakeControl = (inc) => {
                    triggerGlobalAlert('info', `State Command assumed direct control of ${inc.id}. Central response protocols activated.`, 'High');
                    setHiddenIncidents(prev => [...prev, inc.id]);
                };

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl">
                        <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6">
                            <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                                    <div className="p-3 bg-gradient-to-br from-indigo-600/30 to-blue-600/10 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                        <Activity className="w-7 h-7 text-indigo-400 animate-pulse" />
                                    </div>
                                    Live Incident Command
                                </h2>
                                <p className="text-slate-400 mt-2 font-medium">Real-time operational monitoring of vehicle breakdowns and routing emergencies.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-slate-900 border border-slate-700 px-5 py-2.5 rounded-xl shadow-inner relative overflow-hidden flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shadow-[0_0_10px_rgba(244,63,94,1)] absolute opacity-75"></div>
                                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full relative z-10"></div>
                                    <div className="text-sm uppercase font-bold text-slate-300 tracking-wider z-10 relative">{activeIncidents.length} Active Incidents</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {activeIncidents.length === 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full p-12 text-center text-slate-400 font-bold border border-slate-800 rounded-2xl bg-slate-900/50">
                                        All field incidents have been resolved or assumed.
                                    </motion.div>
                                ) : activeIncidents.map((inc, i) => (
                                    <motion.div layout key={inc.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)', transition: { duration: 0.3 } }} transition={{ delay: i * 0.05, type: 'spring', bounce: 0.4 }} whileHover={{ y: -6, boxShadow: '0 10px 40px -10px rgba(99,102,241, 0.2)' }} className="bg-slate-900/80 border border-slate-700/80 hover:border-indigo-500/50 rounded-3xl p-6 relative flex flex-col group transition-all duration-500 ease-out shadow-lg">
                                        {inc.severity === 'Critical' && <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none transition-all group-hover:bg-rose-500/20"></div>}
                                        {inc.severity === 'High' && <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none transition-all group-hover:bg-orange-500/20"></div>}
                                        {inc.severity === 'Medium' && <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none transition-all group-hover:bg-amber-500/20"></div>}
                                        
                                        <div className="flex justify-between items-start mb-5 relative z-10">
                                            <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-3 py-1.5 rounded-md shadow-inner border border-slate-600 font-bold tracking-widest">{inc.id}</span>
                                            <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-indigo-500/20 shadow-inner"><Clock className="w-3 h-3"/> {inc.time}</span>
                                        </div>
                                        
                                        <h3 className="text-xl font-black text-white mb-3 relative z-10 tracking-wide">{inc.type}</h3>
                                        
                                        <div className="bg-slate-950/70 rounded-2xl p-4 mb-5 border border-slate-800/80 relative z-10 shadow-inner mt-2 flex-grow">
                                            <div className="text-[10px] uppercase text-slate-500 font-bold mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-400"/> {inc.location}</div>
                                            <div className="text-[11px] text-slate-500 font-mono mb-3 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded shadow-inner w-fit">{inc.coord}</div>
                                            <p className="text-sm text-slate-300 leading-relaxed break-words font-medium">"{inc.description}"</p>
                                        </div>

                                        <div className="flex flex-col gap-3 relative z-10 mt-auto pt-1">
                                            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center shadow-inner">
                                            <div className="text-[10px] uppercase text-slate-500 font-bold">Current Status</div>
                                            <div className="text-xs font-black text-white uppercase tracking-wider">{inc.status}</div>
                                            </div>
                                            <button onClick={() => handleTakeControl(inc)} className="w-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white py-3 rounded-xl text-sm font-black transition-all border border-indigo-500/30 flex justify-center items-center gap-2 group/action hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-[1.02] active:scale-[0.98]">
                                                Take Control <Zap className="w-4 h-4 group-hover/action:text-amber-400 transition-colors"/>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );

            case 'complaints':
                const initialEscalatedComplaints = [
                    {
                        id: "CMP-8942",
                        category: "Severe Safety Violation",
                        severity: "Critical",
                        location: "Villupuram Depot (TN-32-N-1293)",
                        customer: "Anand M. (+91 98421*****)",
                        reportedAt: "5 Days Ago",
                        depotAdmin: { name: "Suresh P. (VP-Depot)", status: "Ignored SLA (>48h)" },
                        regionalAdmin: { name: "Karthik R. (Region 2)", status: "Ignored SLA (>96h)" },
                        description: "Driver was repeatedly using a mobile phone while driving at high speeds on the highway, ignoring passenger requests to stop.",
                    },
                    {
                        id: "CMP-9102",
                        category: "Overcharging Fare",
                        severity: "High",
                        location: "Thoppur Toll Plaza",
                        customer: "Meena K. (+91 82210*****)",
                        reportedAt: "4 Days Ago",
                        depotAdmin: { name: "Ramesh T. (Dharmapuri)", status: "Resolution Rejected" },
                        regionalAdmin: { name: "Siva S. (Region 4)", status: "Ignored SLA (>72h)" },
                        description: "Conductor charged ₹120 instead of the standard ₹85 fare and refused to issue a printed ticket.",
                    },
                    {
                        id: "CMP-9351",
                        category: "Bus Breakdown & Abandonment",
                        severity: "Critical",
                        location: "Trichy - Madurai Highway",
                        customer: "Priya S. (+91 91754*****)",
                        reportedAt: "6 Days Ago",
                        depotAdmin: { name: "Bala G. (Trichy Central)", status: "Ignored SLA (>72h)" },
                        regionalAdmin: { name: "Kumar V. (Region 3)", status: "Ignored SLA (>120h)" },
                        description: "Bus broke down in the middle of the night. Passengers were left stranded for 5 hours with no replacement bus arranged by the depot.",
                    },
                    {
                        id: "CMP-9520",
                        category: "Rude Staff Behavior",
                        severity: "Medium",
                        location: "Coimbatore Gandhipuram",
                        customer: "Vignesh C. (+91 89012*****)",
                        reportedAt: "3 Days Ago",
                        depotAdmin: { name: "Manoj D. (CBE-Depot)", status: "Pending Fix (>48h)" },
                        regionalAdmin: { name: "Arun K. (Region 1)", status: "Ignored SLA (>48h)" },
                        description: "Conductor used entirely inappropriate and abusive language when asked for change for a 500 rupee note.",
                    },
                    {
                        id: "CMP-9774",
                        category: "Skipping Scheduled Stops",
                        severity: "High",
                        location: "Salem Bypass",
                        customer: "Deepa R. (+91 99401*****)",
                        reportedAt: "5 Days Ago",
                        depotAdmin: { name: "Rajesh N. (Salem)", status: "False Resolution" },
                        regionalAdmin: { name: "Vijay M. (Region 5)", status: "Ignored SLA (>72h)" },
                        description: "Bus did not enter the Salem bus stand as scheduled on the ticket. Driver dropped 15 passengers on the bypass highway at 2 AM.",
                    }
                ];

                const escalatedComplaints = initialEscalatedComplaints.filter(c => !hiddenComplaints.includes(c.id));

                const handleResolveCompensate = (id) => {
                    triggerGlobalAlert(
                        'info',
                        `Complaint ${id} was resolved. Customer compensated directly by State Admin.`,
                        'Moderate'
                    );
                    setHiddenComplaints(prev => [...prev, id]);
                };

                const handleIssueDemerit = (id, depotAdmin, regionalAdmin) => {
                    triggerGlobalAlert(
                        'warning',
                        `Demerits Logged: ${depotAdmin} and ${regionalAdmin} penalized for severe SLA negligence on ${id}.`,
                        'High'
                    );
                };

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl">
                        <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6 relative">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none"></div>
                            <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                                    <div className="p-3 bg-gradient-to-br from-rose-600/30 to-orange-600/10 rounded-2xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                                        <AlertTriangle className="w-7 h-7 text-rose-400 animate-pulse" />
                                    </div>
                                    Action Required: SLA Breaches
                                </h2>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-center shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
                                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider relative z-10">Depot SLA Fails</div>
                                    <div className="text-xl font-black text-amber-500 relative z-10">14</div>
                                </div>
                                <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-center shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors"></div>
                                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider relative z-10">Regional SLA Fails</div>
                                    <div className="text-xl font-black text-rose-500 relative z-10">2</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <AnimatePresence>
                            {escalatedComplaints.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-slate-400 font-bold border border-slate-800 rounded-2xl bg-slate-900/50">
                                    All state-level escalations have been resolved! 
                                </motion.div>
                            ) : escalatedComplaints.map((comp) => (
                                <motion.div 
                                    key={comp.id} 
                                    initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, overflow: 'hidden' }}
                                    transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }} 
                                    whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(225,29,72, 0.15)' }}
                                    className="bg-gradient-to-r from-slate-900 to-[#0f1118] border border-slate-700/60 rounded-3xl p-6 relative overflow-hidden flex flex-col xl:flex-row gap-8 hover:border-rose-500/50 transition-colors duration-500 group"
                                >
                                    {/* Left: Complaint Details */}
                                    <div className="flex-1 space-y-4 relative z-10">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                            <div>
                                                <span className="bg-slate-800/80 border border-slate-600 text-slate-300 px-3 py-1 text-xs font-bold rounded-md uppercase tracking-widest font-mono mr-3 inline-block shadow-inner">
                                                    {comp.id}
                                                </span>
                                                <span className={`px-3 py-1 text-xs font-black rounded-md uppercase tracking-widest shadow-inner inline-block ${comp.severity === 'Critical' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'}`}>
                                                    {comp.severity} Priority
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{comp.reportedAt}</div>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-xl font-black text-white">{comp.category}</h3>
                                            <p className="text-slate-400 text-sm mt-2 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-inner">
                                                "{comp.description}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                                    <MapPin className="w-4 h-4 text-indigo-400"/>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Location / Scope</div>
                                                    <div className="text-sm font-bold text-slate-200">{comp.location}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                                    <Users className="w-4 h-4 text-emerald-400"/>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Customer Direct</div>
                                                    <div className="text-sm font-bold text-slate-200">{comp.customer}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vertical/Horizontal Divider based on screen */}
                                    <div className="hidden xl:block w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>
                                    <div className="block xl:hidden h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2"></div>

                                    {/* Right: Escalation Map & Action */}
                                    <div className="w-full xl:w-[400px] flex flex-col justify-between relative z-10 shrink-0">
                                        
                                        <div className="relative pl-8 space-y-9 ml-2 mt-2 h-full flex flex-col justify-center pb-8 pt-4">
                                            {/* Glowing Animated Line */}
                                            <div className="absolute left-0 top-8 bottom-16 w-0.5 bg-slate-800/80 rounded-full">
                                                <motion.div 
                                                    initial={{ height: 0 }}
                                                    animate={{ height: '100%' }}
                                                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                                                    className="w-full rounded-full bg-gradient-to-b from-indigo-500 via-rose-500 to-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.9)]"
                                                ></motion.div>
                                            </div>

                                            {/* Phase 1 */}
                                            <div className="relative group/step">
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="absolute -left-[41px] bg-slate-900 border-2 border-indigo-500 w-[20px] h-[20px] rounded-full z-10 shadow-[0_0_10px_rgba(99,102,241,0.5)] flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                                                </motion.div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider">Level 1: Depot Admin</h4>
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mt-1.5 gap-1">
                                                    <div className="text-[11px] text-slate-400 font-medium font-mono bg-slate-900/50 px-2 py-1 rounded inline-block border border-slate-700">Resp: {comp.depotAdmin.name}</div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20 self-start sm:self-auto shrink-0 shadow-inner block w-fit">{comp.depotAdmin.status}</span>
                                                </div>
                                            </div>
                                            {/* Phase 2 */}
                                            <div className="relative group/step mt-6">
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} className="absolute -left-[41px] bg-slate-900 border-2 border-rose-400 w-[20px] h-[20px] rounded-full z-10 shadow-[0_0_10px_rgba(244,63,94,0.5)] flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                                                </motion.div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider">Level 2: Regional Admin</h4>
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mt-1.5 gap-1">
                                                    <div className="text-[11px] text-slate-400 font-medium font-mono bg-slate-900/50 px-2 py-1 rounded inline-block border border-slate-700">Resp: {comp.regionalAdmin.name}</div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20 self-start sm:self-auto shrink-0 shadow-inner block w-fit">{comp.regionalAdmin.status}</span>
                                                </div>
                                            </div>
                                            {/* Phase 3 */}
                                            <div className="relative mt-6 group/step">
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4 }} className="absolute -left-[47px] bg-rose-600 border-[4px] border-slate-900 w-[32px] h-[32px] rounded-full shadow-[0_0_20px_rgba(225,29,72,0.8)] animate-[pulse_1.5s_ease-in-out_infinite] flex items-center justify-center text-white z-20 hover:scale-110 transition-transform">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </motion.div>
                                                <h4 className="text-[13px] font-black text-rose-400 uppercase tracking-wider bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/10 inline-block">Level 3: State Command</h4>
                                                <p className="text-[11px] text-slate-300 font-semibold mt-2.5 max-w-[280px] leading-relaxed tracking-wide border-l-2 border-rose-500/50 pl-3">
                                                    SLA severely breached. Mandatory intervention required to resolve issue and penalize staff.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 mt-2 pt-5 border-t border-slate-800/80">
                                            <button onClick={() => handleResolveCompensate(comp.id)} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3 rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 text-sm border-b-2 border-emerald-700 active:border-b-0 active:translate-y-px">
                                                <CheckCircle2 className="w-5 h-5"/> Resolve & Compensate Customer
                                            </button>
                                            <button onClick={() => handleIssueDemerit(comp.id, comp.depotAdmin.name.split(' (')[0], comp.regionalAdmin.name.split(' (')[0])} className="w-full bg-slate-800/80 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-100 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider group shadow-inner">
                                                Issue Demerits to Negligent Admins <Zap className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:animate-bounce transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Subdued Glow effect */}
                                    {comp.severity === 'Critical' && (
                                        <div className="absolute top-1/2 -right-10 -translate-y-1/2 w-72 h-72 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/20 transition-colors duration-700"></div>
                                    )}
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );

            case 'analytics':
                let revData;
                let revLabels;
                let trendLabels;
                let trendDots;
                let trendPath;
                let trendFill;
                let titleStr = "Weekly";

                let districtsPerform = [
                    { name: 'Chennai Corp.', rev: 45 },
                    { name: 'Coimbatore', rev: 25 },
                    { name: 'Madurai Reg.', rev: 18 },
                    { name: 'Trichy Reg.', rev: 12 }
                ];

                if (analyticsTimeframe === 'Last 7 Days') {
                    revData = [62.5, 71.0, 58.2, 84.1, 92.4, 142.5, 105.0];
                    revLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    trendLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    trendDots = [
                        { x: 0, y: 45, val: '55%' },
                        { x: 16.66, y: 25, val: '75%' },
                        { x: 33.33, y: 35, val: '65%' },
                        { x: 50, y: 10, val: '90%' },
                        { x: 66.66, y: 40, val: '60%' },
                        { x: 83.33, y: 20, val: '80%' },
                        { x: 100, y: 5, val: '95%' }
                    ];
                    trendFill = "M 0,45 C 8.33,45 8.33,25 16.66,25 C 24.99,25 24.99,35 33.33,35 C 41.66,35 41.66,10 50,10 C 58.33,10 58.33,40 66.66,40 C 74.99,40 74.99,20 83.33,20 C 91.66,20 91.66,5 100,5 L 100,100 L 0,100 Z";
                    trendPath = "M 0,45 C 8.33,45 8.33,25 16.66,25 C 24.99,25 24.99,35 33.33,35 C 41.66,35 41.66,10 50,10 C 58.33,10 58.33,40 66.66,40 C 74.99,40 74.99,20 83.33,20 C 91.66,20 91.66,5 100,5";
                    titleStr = "Weekly";
                } else if (analyticsTimeframe === 'This Month') {
                    revData = [210.5, 230.1, 195.4, 255.0, 310.2];
                    revLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];
                    trendLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];
                    trendDots = [
                        { x: 0, y: 70, val: '30%' },
                        { x: 25, y: 50, val: '50%' },
                        { x: 50, y: 30, val: '70%' },
                        { x: 75, y: 40, val: '60%' },
                        { x: 100, y: 15, val: '85%' }
                    ];
                    trendFill = "M 0,70 C 12.5,70 12.5,50 25,50 C 37.5,50 37.5,30 50,30 C 62.5,30 62.5,40 75,40 C 87.5,40 87.5,15 100,15 L 100,100 L 0,100 Z";
                    trendPath = "M 0,70 C 12.5,70 12.5,50 25,50 C 37.5,50 37.5,30 50,30 C 62.5,30 62.5,40 75,40 C 87.5,40 87.5,15 100,15";
                    districtsPerform[0].rev = 42;
                    districtsPerform[1].rev = 28;
                    titleStr = "Monthly";
                } else {
                    revData = [850.5, 910.4, 1420.5];
                    revLabels = ['Oct', 'Nov', 'Dec'];
                    trendLabels = ['Oct', 'Nov', 'Dec'];
                    trendDots = [
                        { x: 0, y: 60, val: '40%' },
                        { x: 50, y: 35, val: '65%' },
                        { x: 100, y: 20, val: '80%' }
                    ];
                    trendFill = "M 0,60 C 25,60 25,35 50,35 C 75,35 75,20 100,20 L 100,100 L 0,100 Z";
                    trendPath = "M 0,60 C 25,60 25,35 50,35 C 75,35 75,20 100,20";
                    districtsPerform[2].rev = 22;
                    districtsPerform[3].rev = 15;
                    titleStr = "Quarterly";
                }
                
                const maxRev = Math.max(...revData) * 1.1;

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                    <BarChart3 className="w-6 h-6 text-purple-400" /> Executive Financial Analytics
                                </h2>
                                <p className="text-slate-400 mt-1">Statewide macro-economic visualizations and revenue tracking.</p>
                            </div>
                            <select 
                                value={analyticsTimeframe}
                                onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5 focus:ring-brand-500 outline-none shadow-inner"
                            >
                                <option>Last 7 Days</option>
                                <option>This Month</option>
                                <option>This Quarter</option>
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Bar Chart Panel */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
                                <h3 className="text-slate-300 font-bold mb-6 flex justify-between items-center relative z-10">
                                    {titleStr} Gross Revenue (Lakhs ₹)
                                    <TrendingUp className="text-emerald-400 w-5 h-5"/>
                                </h3>
                                <div className="h-64 flex items-end gap-4 justify-between relative mt-4">
                                    {revData.map((val, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                                            <div className="relative w-full h-[200px] flex items-end bg-slate-800/30 rounded-t-lg overflow-hidden border-b border-slate-700">
                                                <motion.div 
                                                    key={analyticsTimeframe}
                                                    initial={{ height: 0 }} animate={{ height: `${(val / maxRev) * 100}%` }} transition={{ duration: 0.8, delay: idx * 0.05 }}
                                                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg relative group-hover:from-emerald-500 group-hover:to-emerald-300 transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                                                >
                                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 px-2 py-1 rounded shadow-xl z-20 whitespace-nowrap">₹{val} Lakhs</span>
                                                </motion.div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{revLabels[idx]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Donut Chart / Progress bars Panel */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                                <h3 className="text-slate-300 font-bold mb-6 flex justify-between items-center relative z-10">
                                    Revenue Contribution by Zone
                                    <PieChart className="text-purple-400 w-5 h-5"/>
                                </h3>
                                <div className="space-y-6 mt-4 relative z-10">
                                    {districtsPerform.map((d, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className="w-24 text-sm font-bold text-slate-300 group-hover:text-purple-300 transition-colors">{d.name}</div>
                                            <div className="flex-1 bg-slate-800 h-3 rounded-full overflow-hidden flex items-center shadow-inner">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${d.rev}%` }} transition={{ duration: 1, delay: 0.3 }} className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]"></motion.div>
                                            </div>
                                            <div className="w-12 text-right text-xs font-black text-slate-400 group-hover:text-purple-300 transition-colors">{d.rev}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Activity Trend Panel */}
                        <div className="bg-[#12141c]/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden mt-6 backdrop-blur-md">
                            <h3 className="text-slate-200 font-bold mb-2 flex justify-center items-center relative z-10 text-lg tracking-wide">
                                Activity Trend ({analyticsTimeframe})
                            </h3>
                            <div className="relative w-full h-[340px] mt-6 text-[11px] font-medium font-sans">
                                <div className="absolute inset-x-0 inset-y-0 bottom-8 pl-12 pr-6 z-0">
                                   <div className="h-full w-full relative">
                                        {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((val, i) => (
                                            <div key={i} className="flex items-center absolute w-full -mt-2.5 h-5" style={{ top: `${(i / 10) * 100}%`}}>
                                                <div className="absolute -left-12 w-10 text-right text-slate-500">{val}%</div>
                                                <div className="flex-1 h-px bg-slate-800/60"></div>
                                            </div>
                                        ))}

                                        {/* Overlay SVG for Curve and Area */}
                                        <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                                                </linearGradient>
                                            </defs>
                                            {/* Gradient Fill */}
                                            <motion.path 
                                                key={`fill-${analyticsTimeframe}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 1.0, duration: 1 }}
                                                d={trendFill}
                                                fill="url(#curveGradient)"
                                            />
                                            {/* Smooth Curved Line */}
                                            <motion.path 
                                                key={`path-${analyticsTimeframe}`}
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                                d={trendPath}
                                                fill="none"
                                                stroke="#3b82f6" 
                                                strokeWidth="2.5" 
                                                vectorEffect="non-scaling-stroke"
                                                className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                            />
                                        </svg>

                                        {/* Overlay SVG for Dots */}
                                        <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
                                            {trendDots.map((p, i) => (
                                                <motion.circle 
                                                    key={`${analyticsTimeframe}-${i}`}
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: 1.0 + (i * 0.1), duration: 0.3 }}
                                                    cx={`${p.x}%`} 
                                                    cy={`${p.y}%`} 
                                                    r="4.5" 
                                                    fill="#3b82f6" 
                                                    className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] cursor-pointer"
                                                />
                                            ))}
                                        </svg>

                                        {/* X Axis */}
                                        <div className="absolute top-full left-0 w-full h-8 mt-4">
                                            {trendLabels.map((date, i) => {
                                                const segments = trendLabels.length - 1;
                                                const xPos = segments > 0 ? (i / segments) * 100 : 50;
                                                return (
                                                <div key={i} className="absolute text-center text-slate-500 w-12 -ml-6 uppercase tracking-wider" style={{ left: `${xPos}%` }}>
                                                    {date}
                                                </div>
                                            )})}
                                        </div>
                                   </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 'settings':
                const handlePolicyToggle = (title, isEnabled) => {
                    const status = isEnabled ? 'enabled' : 'disabled';
                    triggerNotification(
                        `Global Policy Synced`, 
                        `The "${title}" constraint has been ${status}. This policy is now propagating across all Regional, Depot, Driver, and Customer dashboards.`
                    );
                };
                
                const handleFareChange = (amount) => {
                    const newFare = (fareRate + amount).toFixed(2);
                    if (newFare < 0.5) return;
                    triggerNotification(
                        `Base Fare Rate Adjusted`, 
                        `The price for all state transport has been updated from ₹${fareRate.toFixed(2)} to ₹${newFare} for every km. Live syncing across all platforms...`
                    );
                    setFareRate(parseFloat(newFare));
                };

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="border-b border-slate-800 pb-4 mb-6">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                <ShieldAlert className="w-6 h-6 text-brand-400" /> State Policy Command Center
                            </h2>
                            <p className="text-slate-400 mt-1">Configure global pricing, subsidies, and emergency responses.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                            {/* Economy & Subsidies */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden hover:border-indigo-500/30 transition-colors">
                                <div className="bg-indigo-500/10 px-6 py-4 border-b border-indigo-500/20 flex items-center gap-3">
                                    <HandCoins className="w-5 h-5 text-indigo-400" />
                                    <h3 className="font-bold text-indigo-100">Economic Subsidies (TN schemes)</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <PolicyToggle title="Women's Free Travel Scheme" desc="Zero-fare tracking on all ordinary intra-city services." active={true} color="indigo" onToggle={handlePolicyToggle} />
                                    <PolicyToggle title="Student Concession Pass Validation" desc="Enforce automated cross-checking of smart cards." active={true} color="indigo" onToggle={handlePolicyToggle} />
                                    <PolicyToggle title="Senior Citizen 50% Subsidy" desc="Apply state subsidy rules for demographics over 60+." active={false} color="indigo" onToggle={handlePolicyToggle} />
                                </div>
                            </div>

                            {/* Crisis & Security */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden hover:border-rose-500/30 transition-colors">
                                <div className="bg-rose-500/10 px-6 py-4 border-b border-rose-500/20 flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                                    <h3 className="font-bold text-rose-100">Crisis & Emergency Response</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <PolicyToggle title="Global Booking Freeze" desc="Halt all inter-district bookings instantly during emergencies." active={false} color="rose" onToggle={handlePolicyToggle} />
                                    <PolicyToggle title="SOS Multi-cast" desc="Auto-relay panic button alerts directly to state police API." active={true} color="rose" onToggle={handlePolicyToggle} />
                                    <PolicyToggle title="Disaster Mode Rerouting" desc="AI drops toll roads, prioritizes evacuation corridors." active={false} color="rose" onToggle={handlePolicyToggle} />
                                </div>
                            </div>
                            
                            {/* Operational Config */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden col-span-1 md:col-span-2 hover:border-brand-500/30 transition-colors">
                                <div className="bg-brand-500/10 px-6 py-4 border-b border-brand-500/20 flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-brand-400" />
                                    <h3 className="font-bold text-brand-100">Global System Parameters</h3>
                                </div>
                                <div className="p-6 flex flex-col md:flex-row gap-8 items-start md:items-center bg-slate-900/50">
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold mb-1">Statewide Base Fare Rate</h4>
                                        <p className="text-sm text-slate-400">Current rate per kilometer for express and deluxe services across all zones.</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-inner">
                                        <button onClick={() => handleFareChange(-0.1)} className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg transition-colors shadow">-</button>
                                        <span className="font-mono text-2xl font-bold px-4 text-brand-400 tracking-wider">₹{fareRate.toFixed(2)}</span>
                                        <button onClick={() => handleFareChange(0.1)} className="w-10 h-10 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-lg transition-colors shadow shadow-brand-500/20">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
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
                    <SidebarItem icon={BarChart3} label="Financial Analytics" active={activeMenu === 'analytics'} onClick={() => loadTabData('analytics')} />
                    <SidebarItem icon={Settings} label="Global Settings" active={activeMenu === 'settings'} onClick={() => loadTabData('settings')} />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto w-full relative">
                {renderContent()}
            </main>

            <AnimatePresence>
                {isCreatingAlert && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gradient-to-b from-slate-900 to-[#07090e] border border-slate-700/80 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                            <button onClick={() => setIsCreatingAlert(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors border border-slate-700 z-10"><X className="w-5 h-5"/></button>
                            
                            <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3 relative z-10"><div className="p-2 bg-brand-500/20 rounded-lg text-brand-400 border border-brand-500/30"><Megaphone className="w-5 h-5"/></div> Global Broadcaster</h3>
                            <p className="text-slate-400 text-sm mb-8 relative z-10">Deploy an operational or emergency alert instantly to all organization terminals nationwide.</p>
                            
                            <div className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Alert Heading</label>
                                    <input id="alertTitle" type="text" placeholder="e.g. Critical Weather Warning - Deploy Protocols" className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-brand-500 outline-none transition-all shadow-inner font-medium placeholder:text-slate-600"/>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Severity</label>
                                        <select id="alertSeverity" className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-brand-500 outline-none transition-all shadow-inner font-medium appearance-none">
                                            <option value="Info">Low (Info)</option>
                                            <option value="Moderate">Moderate (Warning)</option>
                                            <option value="High">Emergency (Critical)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Audience</label>
                                        <select className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-brand-500 outline-none transition-all shadow-inner font-medium appearance-none">
                                            <option>All Regions (Global)</option>
                                            <option>Chennai Corporation</option>
                                            <option>Depot Staff Only</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Payload</label>
                                    <textarea id="alertMessage" rows="3" placeholder="Provide detailed instructions..." className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-brand-500 outline-none transition-all shadow-inner resize-none font-medium placeholder:text-slate-600"></textarea>
                                </div>
                                
                                <button onClick={() => {
                                    const title = document.getElementById('alertTitle').value || 'System Alert';
                                    const msg = document.getElementById('alertMessage').value || 'No content provided.';
                                    const sevStr = document.getElementById('alertSeverity').value;
                                    const typeMap = { 'Info': 'info', 'Moderate': 'warning', 'High': 'error' };
                                    triggerGlobalAlert(typeMap[sevStr], `${title}: ${msg}`, sevStr);
                                    setIsCreatingAlert(false);
                                }} className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-3 mt-4 hover:scale-[1.02] active:scale-95 border-b-[3px] border-brand-800 active:border-b-0 active:translate-y-[3px]">
                                    <Radio className="w-5 h-5"/> Deploy Broadcast Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAddingCorp && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gradient-to-b from-slate-900 to-[#07090e] border border-slate-700/80 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                            <button onClick={() => setIsAddingCorp(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors border border-slate-700 z-10"><X className="w-5 h-5"/></button>
                            
                            <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3 relative z-10"><div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30"><Layers className="w-5 h-5"/></div> Add Corporation</h3>
                            <p className="text-slate-400 text-sm mb-8 relative z-10">Register a new State Transport Corporation entity for administrative management.</p>
                            
                            <div className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Corporation Name</label>
                                    <input type="text" placeholder="e.g. SETC New Division" className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-medium placeholder:text-slate-600"/>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Short Code</label>
                                    <input type="text" placeholder="e.g. SETC-N" className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-medium placeholder:text-slate-600"/>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Description / Scope</label>
                                    <textarea rows="2" placeholder="Primary responsibilities..." className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none transition-all shadow-inner resize-none font-medium placeholder:text-slate-600"></textarea>
                                </div>
                                
                                <button onClick={() => {
                                    triggerGlobalAlert('success', `New organization structure formed successfully. Network updating...`, 'Moderate');
                                    setIsAddingCorp(false);
                                }} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-3 mt-4 hover:scale-[1.02] active:scale-95 border-b-[3px] border-indigo-800 active:border-b-0 active:translate-y-[3px]">
                                    <Plus className="w-5 h-5"/> Register Entity
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {managingCorp && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gradient-to-b from-slate-900 to-[#07090e] border border-slate-700/80 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                            <button onClick={() => setManagingCorp(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors border border-slate-700 z-10"><X className="w-5 h-5"/></button>
                            
                            <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3 relative z-10"><div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30"><Settings className="w-5 h-5"/></div> Corp Config</h3>
                            <p className="text-slate-400 text-sm mb-8 relative z-10">Manage permissions, budget, and operational status for {managingCorp?.name}.</p>
                            
                            <div className="space-y-5 relative z-10">
                                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Entity Reference</div>
                                    <div className="text-white font-mono font-black">{managingCorp?.code} - #{managingCorp?.corporation_id}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Annual Budget Allocate</label>
                                        <select className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-medium appearance-none">
                                            <option>₹500 Cr (Standard)</option>
                                            <option>₹750 Cr (Expanded)</option>
                                            <option>₹1000 Cr (Priority)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Status</label>
                                        <select className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-medium appearance-none">
                                            <option>Active / Online</option>
                                            <option>Maintenance Mode</option>
                                            <option>Suspended</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <button onClick={() => {
                                    triggerGlobalAlert('success', `Configuration for ${managingCorp.code} updated and synchronized.`, 'Moderate');
                                    setManagingCorp(null);
                                }} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-3 mt-4 hover:scale-[1.02] active:scale-95 border-b-[3px] border-indigo-800 active:border-b-0 active:translate-y-[3px]">
                                    <CheckCircle2 className="w-5 h-5"/> Apply Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

// Reusable components
const StatusBadge = ({ status }) => {
    let colorClass, dotClass;
    if (status === 'Active' || status === 'Approved' || status === 'Resolved') {
        colorClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]';
        dotClass = 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] animate-pulse';
    }
    else if (status === 'Pending Review' || status === 'Open') {
        colorClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.1)]';
        dotClass = 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]';
    }
    else if (status === 'Escalated' || status === 'Critical' || status === 'High' || status === 'Inactive') {
        colorClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]';
        dotClass = 'bg-rose-400 shadow-[0_0_5px_rgba(244,63,94,0.8)] animate-pulse';
    } else {
        colorClass = 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
        dotClass = 'bg-slate-400';
    }

    return (
        <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest transition-all min-w-[80px] ${colorClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`}></span>
            {status}
        </span>
    );
};

const PolicyToggle = ({ title, desc, active: defaultActive, color, onToggle }) => {
    const [active, setActive] = useState(defaultActive);
    const colorClasses = {
        indigo: 'bg-indigo-600',
        rose: 'bg-rose-600',
        brand: 'bg-brand-600'
    };
    
    const handleToggle = () => {
        const newState = !active;
        setActive(newState);
        if (onToggle) onToggle(title, newState);
    };

    return (
        <div className="flex items-start sm:items-center justify-between gap-4 group flex-col sm:flex-row">
            <div>
                <h4 className="text-slate-200 font-bold group-hover:text-white transition-colors">{title}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">{desc}</p>
            </div>
            <button 
                onClick={handleToggle}
                className={`w-14 h-7 rounded-full relative transition-colors duration-300 flex-shrink-0 shadow-inner border border-slate-800 ${active ? colorClasses[color] : 'bg-slate-800'}`}
            >
                <motion.div 
                    initial={false}
                    animate={{ x: active ? 28 : 2 }}
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md`}
                />
            </button>
        </div>
    );
};

const MetricCard = ({ title, value, trend, icon: Icon, color }) => {
    const rawColor = color.split(' ')[1].replace('text-', ''); // e.g., 'indigo-400'
    const bgColor = color.split(' ')[0].replace('border-', 'bg-');
    
    return (
        <motion.div 
            variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.4 } }
            }}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)' }} 
            className={`bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:${color.split(' ')[0]} rounded-3xl p-5 xl:p-6 shadow-2xl relative overflow-hidden group cursor-pointer backdrop-blur-xl transition-all duration-300 w-full`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 bg-${rawColor.split('-')[0]}-500`}></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10 gap-2">
                <div className={`w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:${bgColor} transition-colors duration-500 shadow-inner shrink-0`}>
                    <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
                </div>
                {trend && <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-inner border border-slate-800 bg-slate-950/50 ${color.split(' ')[1]} shrink-0 text-right leading-tight`}>{trend}</span>}
            </div>
            
            <div className="relative z-10 flex flex-col w-full">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</span>
                <div className="flex items-end justify-between gap-3 w-full">
                    <span className="text-2xl lg:text-3xl xl:text-3xl 2xl:text-4xl font-black text-white tracking-tighter drop-shadow-md whitespace-nowrap">{value}</span>
                    
                    {/* Animated Sparkline */}
                    <div className="flex items-end gap-[3px] h-8 pb-1 opacity-50 group-hover:opacity-100 transition-opacity duration-300 shrink-0">
                        {[4, 7, 3, 9, 5, 10, 6].map((h, i) => (
                            <motion.div key={i} initial={{ height: '30%' }} animate={{ height: `${h * 10}%` }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8 + (i * 0.15) }} className={`w-1.5 rounded-t-full bg-${rawColor}`}></motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const DataTable = ({ columns, data }) => (
    <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-700/50">
                        {columns.map((c, i) => (
                            <th key={i} className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400/80 ${i === 0 ? 'pl-8' : ''}`}>
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                    <AnimatePresence>
                        {data.length === 0 ? (
                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}><td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 font-medium tracking-wide">No active records found.</td></motion.tr>
                        ) : data.map((row, i) => (
                            <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                key={i} 
                                className="group hover:bg-slate-800/40 transition-colors duration-300 even:bg-slate-900/40"
                            >
                                {row.map((cell, j) => (
                                    <td key={j} className={`px-6 py-4 ${j === 0 ? 'pl-8' : ''}`}>
                                        <div className="group-hover:translate-x-1 transition-transform duration-300">
                                            {cell}
                                        </div>
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    </div>
);

export default StateAdminDashboard;
