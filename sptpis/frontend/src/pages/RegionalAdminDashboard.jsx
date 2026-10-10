import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
    Building, Bus, Users, Activity, BarChart3, AlertTriangle,
    MapPin, CheckCircle2, Navigation, MessageSquare, ListRestart,
    Clock, ShieldAlert, MonitorSpeaker, TrendingUp, TrendingDown,
    Wrench, Star, ArrowRight, UserCog, UserCheck, Settings, X
} from 'lucide-react';
import FleetMap from '../components/Map/FleetMap';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, active, onClick, hasSubItems, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
    >
        <Icon className="w-5 h-5" />
        <span className="flex-1 text-left">{label}</span>
        {badge && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
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
    const [auditLogs, setAuditLogs] = useState([]);
    const [schedules, setSchedules] = useState([]);
    
    // Drill-down state
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedDepot, setSelectedDepot] = useState(null);
    
    // UI Filters & Action State
    const [complaintFilter, setComplaintFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // { type: 'route'|'direct'|'dispatch'|'escalate', item: any }
    const [toast, setToast] = useState(null);
    const [modalNotes, setModalNotes] = useState('');
    const [selectedOption, setSelectedOption] = useState('');

    const triggerToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const formatBusReg = (reg) => {
        if (!reg) return 'TN-38-N-1023';
        const strReg = String(reg);
        return strReg.startsWith('TN-') ? strReg : `TN-${strReg}`;
    };

    const getTalukDepotName = (districtObj, idx) => {
        const list = districtObj?.talukList || districtObj?.taluks || [districtObj?.name || 'Central'];
        const talukName = list[idx % list.length];
        return `${talukName} Depot`;
    };

    const getDynamicLocation = (districtObj, idx) => {
        const list = districtObj?.talukList || districtObj?.taluks || ['Highway Sector'];
        const talukName = list[idx % list.length];
        const km = 14 + ((idx + 1) * 18) % 50;
        return `${talukName} Sector (NH-45, Km ${km})`;
    };

    const handleModalSubmit = (e) => {
        if (e) e.preventDefault();
        if (!activeModal) return;
        const { type, item } = activeModal;
        setActionLoading(true);

        setTimeout(() => {
            if (type === 'route') {
                setComplaints(prev => prev.map(c => c.complaint_id === item.complaint_id ? { ...c, status: 'Routed to Depot' } : c));
                triggerToast(`Ticket #${item.complaint_id} successfully assigned & routed to Depot Manager.`);
            } else if (type === 'direct') {
                setComplaints(prev => prev.map(c => c.complaint_id === item.complaint_id ? { ...c, status: 'Resolved' } : c));
                triggerToast(`Ticket #${item.complaint_id} marked as RESOLVED by Regional Admin.`);
            } else if (type === 'dispatch') {
                setIncidents(prev => prev.map(inc => inc.incident_id === item.incident_id ? { ...inc, status: 'Unit Dispatched' } : inc));
                triggerToast(`Emergency Response Unit dispatched for Bus ID ${item.bus_id}!`);
            } else if (type === 'escalate') {
                setIncidents(prev => prev.map(inc => inc.incident_id === item.incident_id ? { ...inc, status: 'Escalated to State Admin' } : inc));
                triggerToast(`Incident #${item.incident_id} escalated to State Transport Command Center!`, 'warning');
            }
            setActionLoading(false);
            setActiveModal(null);
            setModalNotes('');
            setSelectedOption('');
        }, 500);
    };

    const tnDistrictsData = [
        { name: 'Ariyalur', code: 'ARI', fleet: 150, taluks: ['Ariyalur', 'Sendurai', 'Udayarpalayam', 'Andimadam'] },
        { name: 'Chengalpattu', code: 'CGL', fleet: 320, taluks: ['Chengalpattu', 'Tambaram', 'Pallavaram', 'Vandalur', 'Thiruporur', 'Tirukalukundram', 'Madurantakam', 'Cheyyur'] },
        { name: 'Chennai', code: 'MAS', fleet: 1200, taluks: ['Aminjikarai', 'Ayanavaram', 'Egmore', 'Guindy', 'Mambalam', 'Mylapore', 'Perambur', 'Purasawalkam', 'Tondiarpet', 'Velachery', 'Alandur', 'Sholinganallur', 'Tiruvottiyur', 'Madhavaram', 'Ambattur', 'Maduravoyal'] },
        { name: 'Coimbatore', code: 'CBE', fleet: 850, taluks: ['Coimbatore North', 'Coimbatore South', 'Mettupalayam', 'Sulur', 'Pollachi', 'Kinathukadavu', 'Valparai', 'Annur', 'Perur', 'Madukkarai', 'Anamalai'] },
        { name: 'Cuddalore', code: 'CUD', fleet: 400, taluks: ['Cuddalore', 'Panruti', 'Chidambaram', 'Kattumannarkoil', 'Virudhachalam', 'Tittakudi', 'Kurinjipadi', 'Bhuvanagiri', 'Veppur', 'Srimushnam'] },
        { name: 'Dharmapuri', code: 'DPI', fleet: 350, taluks: ['Dharmapuri', 'Harur', 'Palacode', 'Pennagaram', 'Pappireddipatti'] },
        { name: 'Dindigul', code: 'DGL', fleet: 450, taluks: ['Dindigul', 'Palani', 'Kodaikanal', 'Vedasandur', 'Natham', 'Nilakottai', 'Oddanchatram', 'Athoor', 'Gujiliyamparai'] },
        { name: 'Erode', code: 'ERD', fleet: 480, taluks: ['Erode', 'Perundurai', 'Bhavani', 'Gobichettipalayam', 'Sathyamangalam', 'Anthiyur', 'Modakkurichi', 'Kodumudi', 'Thalavadi', 'Nambiyur'] },
        { name: 'Kallakurichi', code: 'KLK', fleet: 260, taluks: ['Kallakurichi', 'Sankarapuram', 'Chinnasalem', 'Ulundurpet', 'Tirukkoyilur', 'Kalvarayan Hills'] },
        { name: 'Kanchipuram', code: 'KPM', fleet: 350, taluks: ['Kanchipuram', 'Sriperumbudur', 'Uthiramerur', 'Walajabad', 'Kundrathur'] },
        { name: 'Kanyakumari', code: 'KKM', fleet: 500, taluks: ['Agastheeswaram', 'Thovalai', 'Kalkulam', 'Vilavancode', 'Killiyoor', 'Thiruvattar'] },
        { name: 'Karur', code: 'KAR', fleet: 280, taluks: ['Karur', 'Aravakurichi', 'Manmangalam', 'Pugalur', 'Kulithalai', 'Krishnarayapuram', 'Kadavur'] },
        { name: 'Krishnagiri', code: 'KGI', fleet: 310, taluks: ['Krishnagiri', 'Hosur', 'Pochampalli', 'Uthangarai', 'Denkanikottai'] },
        { name: 'Madurai', code: 'MDU', fleet: 700, taluks: ['Madurai North', 'Madurai South', 'Madurai East', 'Madurai West', 'Thiruparankundram', 'Tirumangalam', 'Peraiyur', 'Usilampatti', 'Vadipatti', 'Melur', 'Kalligudi'] },
        { name: 'Mayiladuthurai', code: 'MAY', fleet: 180, taluks: ['Mayiladuthurai', 'Sirkali', 'Tharangambadi', 'Kuthalam'] },
        { name: 'Nagapattinam', code: 'NGP', fleet: 200, taluks: ['Nagapattinam', 'Kilvelur', 'Thirukuvalai', 'Vedaranyam'] },
        { name: 'Namakkal', code: 'NMK', fleet: 280, taluks: ['Namakkal', 'Rasipuram', 'Tiruchengode', 'Paramathi Velur'] },
        { name: 'Nilgiris', code: 'NIL', fleet: 220, taluks: ['Udhagamandalam', 'Coonoor', 'Kotagiri', 'Gudalur', 'Pandalur', 'Kundah'] },
        { name: 'Perambalur', code: 'PBL', fleet: 140, taluks: ['Perambalur', 'Kunnam', 'Alathur', 'Veppanthattai'] },
        { name: 'Pudukkottai', code: 'PDK', fleet: 420, taluks: ['Pudukkottai', 'Alangudi', 'Aranthangi', 'Avadaiyarkoil', 'Gandarvakottai', 'Iluppur', 'Karambakkudi', 'Kulathur', 'Manamelkudi', 'Ponnamaravathi', 'Thirumayam', 'Viralimalai'] },
        { name: 'Ramanathapuram', code: 'RMD', fleet: 370, taluks: ['Ramanathapuram', 'Rameswaram', 'Tiruvadanai', 'Paramakudi', 'Mudukulathur', 'Kamuthi', 'Kadaladi', 'Kilakarai', 'Rajasingamangalam'] },
        { name: 'Ranipet', code: 'RPT', fleet: 250, taluks: ['Arakkonam', 'Arcot', 'Walajah', 'Sholingur', 'Nemili', 'Kalavai'] },
        { name: 'Salem', code: 'SLM', fleet: 420, taluks: ['Salem', 'Salem South', 'Salem West', 'Yercaud', 'Attur', 'Gangavalli', 'Peddanaickenpalayam', 'Vazhapadi', 'Mettur', 'Omalur', 'Kadaiyampatti', 'Edappadi', 'Sankari'] },
        { name: 'Sivaganga', code: 'SVG', fleet: 360, taluks: ['Sivaganga', 'Karaikudi', 'Devakottai', 'Tirupathur', 'Manamadurai', 'Ilayangudi', 'Kalayar Koil', 'Singampunari', 'Thirupuvanam'] },
        { name: 'Tenkasi', code: 'TSI', fleet: 300, taluks: ['Tenkasi', 'Shenkottai', 'Kadayanallur', 'Sivagiri', 'Veerakeralampudur', 'Sankarankoil', 'Thiruvengadam', 'Alangulam'] },
        { name: 'Thanjavur', code: 'TNJ', fleet: 450, taluks: ['Thanjavur', 'Kumbakonam', 'Papanasam', 'Thiruvaiyaru', 'Orathanadu', 'Pattukkottai', 'Peravurani', 'Budalur', 'Thiruvidaimarudur'] },
        { name: 'Theni', code: 'THN', fleet: 270, taluks: ['Theni', 'Periyakulam', 'Andipatti', 'Uthamapalayam', 'Bodinayakanur'] },
        { name: 'Thoothukudi', code: 'TUT', fleet: 430, taluks: ['Thoothukudi', 'Tiruchendur', 'Srivaikuntam', 'Vilathikulam', 'Kovilpatti', 'Ettayapuram', 'Ottapidaram', 'Kayathar', 'Sathankulam'] },
        { name: 'Tiruchirappalli', code: 'TRY', fleet: 650, taluks: ['Tiruchirappalli West', 'Tiruchirappalli East', 'Srirangam', 'Manapparai', 'Marungapuri', 'Lalgudi', 'Manachanallur', 'Musiri', 'Thottiyam', 'Thuraiyur', 'Tiruverumbur'] },
        { name: 'Tirunelveli', code: 'TNV', fleet: 520, taluks: ['Tirunelveli', 'Palayamkottai', 'Ambasamudram', 'Nanguneri', 'Radhapuram', 'Cheranmahadevi', 'Manur'] },
        { name: 'Tirupathur', code: 'TPT', fleet: 210, taluks: ['Tirupathur', 'Vaniyambadi', 'Natrampalli', 'Ambur'] },
        { name: 'Tiruppur', code: 'TPR', fleet: 550, taluks: ['Tiruppur North', 'Tiruppur South', 'Avinashi', 'Palladam', 'Udumalaipettai', 'Kangeyam', 'Dharapuram', 'Madathukulam', 'Uthukuli'] },
        { name: 'Tiruvallur', code: 'TVR', fleet: 480, taluks: ['Tiruvallur', 'Poonamallee', 'Ponneri', 'Gummidipoondi', 'Uthukkottai', 'Tiruttani', 'Pallipattu', 'R.K. Pettai', 'Avadi'] },
        { name: 'Tiruvannamalai', code: 'TVM', fleet: 500, taluks: ['Tiruvannamalai', 'Kilpennathur', 'Polur', 'Arani', 'Kalasapakkam', 'Jamunamarathur', 'Chengam', 'Thandarampattu', 'Vandavasi', 'Cheyyar', 'Vembakkam', 'Chetpet'] },
        { name: 'Tiruvarur', code: 'TVU', fleet: 340, taluks: ['Tiruvarur', 'Mannargudi', 'Thiruthuraipoondi', 'Nannilam', 'Kudavasal', 'Valangaiman', 'Needamangalam', 'Koothanallur'] },
        { name: 'Vellore', code: 'VEL', fleet: 390, taluks: ['Vellore', 'Anaicut', 'Katpadi', 'Gudiyatham', 'Pernambut', 'K.V. Kuppam'] },
        { name: 'Viluppuram', code: 'VPM', fleet: 460, taluks: ['Viluppuram', 'Tindivanam', 'Vanur', 'Vikravandi', 'Marakkanam', 'Gingee', 'Melmalayanur', 'Kandachipuram', 'Thiruvennainallur'] },
        { name: 'Virudhunagar', code: 'VNR', fleet: 410, taluks: ['Virudhunagar', 'Aruppukkottai', 'Sathur', 'Sivakasi', 'Srivilliputhur', 'Rajapalayam', 'Kariapatti', 'Tiruchuli', 'Vembakottai', 'Watrap'] }
    ];

    const availableDistricts = tnDistrictsData.map(d => ({
        id: `dst-${d.code.toLowerCase()}`,
        name: `${d.name} District`,
        code: d.code,
        talukCount: d.taluks.length,
        fleet: d.fleet,
        talukList: d.taluks
    }));

    const [globalDistrict, setGlobalDistrict] = useState(availableDistricts.find(d => d.code === 'SLM') || availableDistricts[0]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/regional/dashboard');
            setDashboardData(res.data);

            // Also load depots by default to populate the AI mock metrics
            const depotRes = await axios.get('/api/regional/depots');
            setDepots(enrichDepotsWithAiMetrics(depotRes.data || fallBackDepots));

        } catch (e) {
            console.error(e);
            // Fallback for demo purposes
            setDepots(enrichDepotsWithAiMetrics(fallBackDepots));
        } finally {
            setLoading(false);
        }
    };

    // AI MOCK DATA ENRICHMENT (Since this showcases the ML aspect)
    const getDepotsForDistrict = (districtCode) => {
        const districtInfo = availableDistricts.find(d => d.code === districtCode);
        if (districtInfo && districtInfo.talukList) {
            return districtInfo.talukList.map((talukName, idx) => ({
                depot_id: 21 + idx + Math.floor(Math.random() * 10000),
                name: `${talukName} Taluk`,
                code: `${districtCode}-T${idx + 1}`,
                address: talukName
            }));
        }

        return [
            { depot_id: 21, name: `${districtCode} Central Taluk`, code: `${districtCode}-T1`, address: "Central" }
        ];
    };

    const fallBackDepots = getDepotsForDistrict('SLM');

    const enrichDepotsWithAiMetrics = (depotList) => {
        return depotList.map((d, i) => {
            const healthScore = Math.floor(Math.random() * 30) + 65; // 65-95
            const revenue = Math.floor(Math.random() * 500000) + 100000;
            const revTrend = Math.random() > 0.4 ? 'up' : 'down';

            return {
                ...d,
                health_score: healthScore,
                active_trips: Math.floor(Math.random() * 15) + 5,
                buses: { active: 45 + i * 5, idle: 12, maint: 3 + i },
                revenue_today: revenue,
                revenue_trend: revTrend,
                open_complaints: Math.floor(Math.random() * 8),
                ai_perf: {
                    on_time_pct: healthScore + 2,
                    avg_delay_mins: Math.floor(Math.random() * 10) + (healthScore < 75 ? 15 : 2), // Gradient Boost Output
                    avg_occupancy: Math.floor(Math.random() * 30) + 55, // Random Forest Output
                    rev_per_bus: Math.floor(revenue / 45),
                },
                admin_oversight: {
                    manager: `Manager ${d.name.split(' ')[0]}`,
                    last_login: "2 mins ago",
                    audit_flags: healthScore < 75 ? 2 : 0
                }
            };
        });
    };

    const loadTabData = async (menu) => {
        setActiveMenu(menu);
        setSelectedDistrict(null); // Reset district drilldown
        setSelectedDepot(null); // Reset depot drilldown
        try {
            if (menu === 'routes') {
                try {
                    const res = await axios.get('/api/regional/routes');
                    if (Array.isArray(res.data)) setRoutes(res.data);
                } catch { setRoutes([]); }
            } else if (menu === 'incidents') {
                try {
                    const res = await axios.get('/api/regional/incidents');
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setIncidents(res.data);
                    } else {
                        throw new Error("mock fallback");
                    }
                } catch {
                    setIncidents([
                        { incident_id: 'INC-REG-01', type: 'Panic Button Triggered', description: `Driver triggered silent panic alarm on Route originating from ${globalDistrict.name}.`, bus_id: 'TN-30-C-8822', severity: 'Critical', reported_time: new Date(Date.now() - 1200000).toISOString(), status: 'Dispatching Local Police' },
                        { incident_id: 'INC-REG-11', type: 'Severe Collision', description: `Major collision with freight truck reported on highway bound to ${globalDistrict.name}.`, bus_id: 'TN-38-F-2210', severity: 'High', reported_time: new Date(Date.now() - 4500000).toISOString(), status: 'Emergency Responders Notified' }
                    ]);
                }
            } else if (menu === 'complaints') {
                try {
                    const res = await axios.get('/api/regional/complaints');
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setComplaints(res.data);
                    } else {
                         throw new Error("mock fallback");
                    }
                } catch {
                     setComplaints([
                        { complaint_id: 'RA-0921', category: 'Safety & Security', description: `Driver was speeding recklessly near the ${globalDistrict.name} school zone. Needs immediate warning.`, registration_number: 'TN-38-N-1023', severity: 'High', status: 'Pending Review', created_date: new Date(Date.now() - 3600000).toISOString() },
                        { complaint_id: 'RA-0918', category: 'Breakdown / Maintenance', description: `Bus broke down near ${globalDistrict.name} border, no replacement sent for 3 hours.`, registration_number: 'TN-43-C-5091', severity: 'High', status: 'Escalated', created_date: new Date(Date.now() - 86400000 * 2).toISOString() },
                        { complaint_id: 'DEP-8422', category: 'Staff Behavior', description: 'Conductor was extremely rude and refused to give correct change. Depot admin did not take action within SLA.', registration_number: 'TN-33-F-1209', severity: 'Medium', status: 'Escalated', created_date: new Date(Date.now() - 86400000 * 3).toISOString() },
                        { complaint_id: 'DEP-8319', category: 'Cleanliness', description: 'Seats were torn and there was a heavy stench. Escalated from depot level.', registration_number: 'TN-30-A-1100', severity: 'Low', status: 'Escalated', created_date: new Date(Date.now() - 86400000 * 4).toISOString() },
                        { complaint_id: 'RA-0905', category: 'Severe Delay', description: `Expected bus at 6 AM in ${globalDistrict.name}, arrived at 8:30 AM. Missed the connecting train.`, registration_number: 'TN-55-B-3090', severity: 'High', status: 'Resolved', created_date: new Date(Date.now() - 86400000 * 5).toISOString() },
                        { complaint_id: 'RA-0911', category: 'Route Deviation', description: `Bus skipped designated stops in ${globalDistrict.name} causing 40 passengers to wait over an hour.`, registration_number: 'TN-45-V-8811', severity: 'High', status: 'Pending Review', created_date: new Date(Date.now() - 86400000 * 1).toISOString() }
                    ]);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex h-full items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }

        switch (activeMenu) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider text-xs px-2.5 py-1 rounded-full border border-blue-500/30">Regional Transport Administration</span>
                                <h2 className="text-3xl font-black text-white flex items-center gap-3 mt-3">
                                    <Building className="w-8 h-8 text-blue-500" />
                                    Region: 
                                    <select 
                                        className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1 text-2xl font-black focus:outline-none focus:border-blue-500"
                                        value={globalDistrict.code}
                                        onChange={(e) => {
                                            const d = availableDistricts.find(x => x.code === e.target.value);
                                            setGlobalDistrict(d);
                                            setDepots(enrichDepotsWithAiMetrics(getDepotsForDistrict(d.code)));
                                        }}
                                    >
                                        {availableDistricts.map(d => (
                                            <option key={d.code} value={d.code} className="text-sm font-medium">{d.name}</option>
                                        ))}
                                    </select>
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Corporation: TNSTC (Tamil Nadu State Transport Corporation)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard title="Total Buses Monitored" value={dashboardData?.total_buses || 215} icon={Bus} color="border-slate-700 text-slate-300" />
                            <MetricCard title="Live Socket Connections" value={Object.keys(liveBuses).length || 42} trend="Active Now" icon={Activity} color="border-emerald-500/30 text-emerald-400" />
                            <MetricCard title="Passengers Today" value={`14,${Math.floor(Math.random() * 900) + 100}`} icon={Users} color="border-blue-500/30 text-blue-400" />
                            <MetricCard title="Critical Breakdowns" value={incidents.length || 2} trend="Requires Action" icon={Wrench} color="border-rose-500/30 text-rose-400" />
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-[500px] flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500"></div>
                            <div className="mb-4 flex justify-between items-center z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-400" /> Regional Live Operations Map</h3>
                                    <p className="text-xs text-slate-400">Live operational boundaries isolated securely for your region.</p>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative shadow-inner">
                                <FleetMap buses={Object.values(liveBuses)} districtName={globalDistrict.name} />
                            </div>
                        </div>
                    </div>
                );

            case 'depots':
                if (selectedDepot) return <DepotDrillDown depot={selectedDepot} onBack={() => setSelectedDepot(null)} />;

                if (!selectedDistrict) {
                    return (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                                <div>
                                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                        <MapPin className="w-6 h-6 text-blue-500" /> Regional Districts Overview
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">Select a district to view taluk-level operational metrics.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {availableDistricts.map(dist => (
                                    <div key={dist.id} onClick={() => {
                                        setSelectedDistrict(dist);
                                        setDepots(enrichDepotsWithAiMetrics(getDepotsForDistrict(dist.code)));
                                    }} className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 shadow-xl cursor-pointer transition-all hover:bg-slate-800/80 group transform hover:-translate-y-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">{dist.name}</h3>
                                                <span className="text-xs font-semibold bg-slate-800 px-2 py-1 rounded text-slate-300">{dist.code} Region</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <MapPin className="w-5 h-5 text-blue-400" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Taluks</p>
                                                <p className="text-lg font-black text-white flex items-center gap-1">{dist.talukCount}</p>
                                            </div>
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Fleet</p>
                                                <p className="text-lg font-black text-emerald-400 flex items-center gap-1"><Bus className="w-4 h-4" /> {dist.fleet}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                                            <span className="text-slate-400">View Taluk Breakdown</span>
                                            <span className="text-blue-400 font-bold flex items-center group-hover:translate-x-1 transition-transform">Explore <ArrowRight className="w-3 h-3 ml-1" /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedDistrict(null)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition" title="Back to Districts">
                                    <ArrowRight className="w-5 h-5 rotate-180" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border border-blue-500/30">{selectedDistrict.name}</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                        <Building className="w-6 h-6 text-blue-500" /> Taluk Depot Overview
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">Live metrics aggregated from Socket.IO and backend databases for {selectedDistrict.name}.</p>
                                </div>
                            </div>

                            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition shadow-lg flex items-center gap-2">
                                <MonitorSpeaker className="w-4 h-4" /> Broadcast to All Depots
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {depots.map(d => (
                                <div key={d.depot_id} onClick={() => setSelectedDepot(d)} className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 shadow-xl cursor-pointer transition-all hover:bg-slate-800/80 group transform hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">{d.name}</h3>
                                            <span className="text-xs font-semibold bg-slate-800 px-2 py-1 rounded text-slate-300">{d.code}</span>
                                        </div>
                                        {/* Composite Health Score */}
                                        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 ${d.health_score > 80 ? 'border-emerald-500 text-emerald-400' : d.health_score > 70 ? 'border-amber-500 text-amber-400' : 'border-rose-500 text-rose-400'}`}>
                                            <span className="text-sm font-black">{d.health_score}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                                            <p className="text-xs text-slate-500 font-semibold uppercase">Active Trips</p>
                                            <p className="text-lg font-bold text-emerald-400 flex items-center gap-1"><Activity className="w-4 h-4" /> {d.active_trips}</p>
                                        </div>
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                                            <p className="text-xs text-slate-500 font-semibold uppercase">Revenue</p>
                                            <p className="text-lg font-bold text-white flex items-center gap-1">
                                                ₹{(d.revenue_today / 1000).toFixed(1)}k
                                                {d.revenue_trend === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Fleet Status (Live)</span>
                                            <span className="text-slate-300 font-bold">{d.buses.active + d.buses.idle + d.buses.maint} Total</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
                                            <div style={{ width: `${(d.buses.active / (d.buses.active + d.buses.idle + d.buses.maint)) * 100}%` }} className="bg-emerald-500"></div>
                                            <div style={{ width: `${(d.buses.idle / (d.buses.active + d.buses.idle + d.buses.maint)) * 100}%` }} className="bg-blue-500"></div>
                                            <div style={{ width: `${(d.buses.maint / (d.buses.active + d.buses.idle + d.buses.maint)) * 100}%` }} className="bg-rose-500"></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            <span className="text-emerald-500">{d.buses.active} Active</span>
                                            <span className="text-blue-500">{d.buses.idle} Idle</span>
                                            <span className="text-rose-500">{d.buses.maint} Maint</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <AlertTriangle className={`w-3 h-3 ${d.open_complaints > 5 ? 'text-rose-500' : 'text-amber-500'}`} />
                                            <span>{d.open_complaints} Open Complaints</span>
                                        </div>
                                        <span className="text-blue-400 font-semibold flex items-center">Drill-down <ArrowRight className="w-3 h-3 ml-1" /></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'complaints': {
                const filteredComplaints = complaints.filter(c => {
                    if (complaintFilter === 'escalated') return c.status === 'Escalated' || c.severity === 'High';
                    if (complaintFilter === 'resolved') return c.status === 'Resolved';
                    return true;
                });

                const highPriorityCount = complaints.filter(c => c.severity === 'High').length;
                const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">Public Sentiment Oversight</span>
                                    <span className="text-xs text-slate-500 font-bold">• {globalDistrict.name} Region</span>
                                </div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
                                    <MessageSquare className="w-6 h-6 text-amber-500" /> Passenger Feedback & SLA Escalations
                                </h2>
                                <p className="text-sm text-slate-400">Monitor passenger satisfaction, route SLA compliance, and resolve escalated tickets.</p>
                            </div>

                            {/* Filter Pills */}
                            <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-xl">
                                <button onClick={() => setComplaintFilter('all')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${complaintFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                                    All Tickets ({complaints.length})
                                </button>
                                <button onClick={() => setComplaintFilter('escalated')} className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${complaintFilter === 'escalated' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400"/> Escalated ({highPriorityCount})
                                </button>
                                <button onClick={() => setComplaintFilter('resolved')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${complaintFilter === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                                    Resolved ({resolvedCount})
                                </button>
                            </div>
                        </div>

                        {/* Summary Metrics Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Logged Tickets</p>
                                    <p className="text-xl font-black text-white">{complaints.length} <span className="text-xs text-slate-400 font-normal">in district</span></p>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SLA High Priority</p>
                                    <p className="text-xl font-black text-rose-400">{highPriorityCount} <span className="text-xs text-slate-400 font-normal font-mono">Action req.</span></p>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resolution Rate</p>
                                    <p className="text-xl font-black text-emerald-400">96.4% <span className="text-xs text-slate-400 font-normal">SLA target</span></p>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Resolution SLA</p>
                                    <p className="text-xl font-black text-amber-400">1.8 hrs <span className="text-xs text-slate-400 font-normal">turnaround</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Complaint Ticket Cards Grid */}
                        <div className="grid gap-4">
                            {filteredComplaints.length > 0 ? filteredComplaints.map((c, idx) => (
                                <div key={c.complaint_id} className={`bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 shadow-xl border-l-4 transition-all hover:translate-y-[-2px] hover:shadow-2xl ${
                                    c.severity === 'High' ? 'border-l-rose-500 border-t border-b border-r border-slate-800' :
                                    c.status === 'Resolved' ? 'border-l-emerald-500 border-t border-b border-r border-slate-800' :
                                    'border-l-amber-500 border-t border-b border-r border-slate-800'
                                }`}>
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* Severity Badge */}
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                                                    c.severity === 'High' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${c.severity === 'High' ? 'bg-rose-400 animate-ping' : 'bg-amber-400'}`}></span>
                                                    {c.severity} Priority
                                                </span>

                                                {/* Category Tag */}
                                                <span className="bg-slate-800 text-blue-400 text-xs font-bold px-3 py-1 rounded-lg border border-slate-700">
                                                    {c.category || 'Service Quality'}
                                                </span>

                                                {/* Ticket ID */}
                                                <span className="text-slate-500 text-xs font-mono font-bold">Ticket #{c.complaint_id}</span>
                                            </div>

                                            <p className="text-white font-semibold text-base leading-relaxed italic bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                                                "{c.description}"
                                            </p>

                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                                                <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                                    <Bus className="w-3.5 h-3.5 text-blue-400"/> Bus Reg: <strong className="text-white">{formatBusReg(c.registration_number)}</strong>
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                                    <Building className="w-3.5 h-3.5 text-slate-400"/> Depot: <strong className="text-slate-200">{getTalukDepotName(globalDistrict, idx)}</strong>
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock className="w-3.5 h-3.5 text-amber-400"/> Reported: {new Date(c.created_date).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status & Action Control Group */}
                                        <div className="flex flex-col items-start lg:items-end gap-3 min-w-[200px] w-full lg:w-auto border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                                c.status === 'Escalated' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse' :
                                                c.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                                                c.status === 'Routed to Depot' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                                                'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                            }`}>
                                                {c.status}
                                            </span>

                                            {c.status !== 'Resolved' && (
                                                <div className="flex gap-2 w-full lg:w-auto">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedOption(getTalukDepotName(globalDistrict, idx));
                                                            setActiveModal({ type: 'route', item: c });
                                                        }} 
                                                        className="flex-1 lg:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer hover:border-blue-500/50 shadow-md"
                                                    >
                                                        <Building className="w-3.5 h-3.5 text-blue-400" /> Route to Depot
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedOption('Issue Direct Disciplinary Fine & Warning');
                                                            setActiveModal({ type: 'direct', item: c });
                                                        }} 
                                                        className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-blue-400"
                                                    >
                                                        <UserCheck className="w-3.5 h-3.5" /> Take Direct Action
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-3xl">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                                    <h3 className="text-lg font-bold text-slate-300 mb-1">No complaints matching filter</h3>
                                    <p className="text-slate-500 text-sm">All operations in {globalDistrict.name} region are operating within high SLA standard.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            case 'incidents':
                const safeIncidents = Array.isArray(incidents) ? incidents : [];
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Emergency Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Live Radar Active
                                    </span>
                                    <span className="text-xs text-slate-500 font-bold">• {globalDistrict?.name || 'Regional'} Command Center</span>
                                </div>
                                <h2 className="text-2xl font-black text-rose-500 flex items-center gap-2 mt-1">
                                    <ShieldAlert className="w-6 h-6 text-rose-500" /> Emergency Incident Command Matrix
                                </h2>
                                <p className="text-sm text-slate-400">Live critical panic button alerts, telemetry SOS feeds, and rapid emergency unit dispatch.</p>
                            </div>

                            <div className="bg-rose-950/40 border border-rose-500/30 px-4 py-2 rounded-2xl flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-rose-400">Emergency Protocol</p>
                                    <p className="text-xs text-slate-300 font-bold">Active SLA Response: &lt; 5 mins</p>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Metrics Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/30 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                                <div>
                                    <p className="text-xs text-rose-400 uppercase font-black tracking-wider">Active Critical SOS</p>
                                    <p className="text-3xl font-black text-white mt-1">{safeIncidents.length}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Requiring immediate command response</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                                    <AlertTriangle className="w-7 h-7 animate-pulse" />
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                                <div>
                                    <p className="text-xs text-blue-400 uppercase font-black tracking-wider">Dispatched Patrol Units</p>
                                    <p className="text-3xl font-black text-white mt-1">{safeIncidents.filter(i => i?.status === 'Unit Dispatched').length}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">En route to incident location</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Activity className="w-7 h-7" />
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                                <div>
                                    <p className="text-xs text-emerald-400 uppercase font-black tracking-wider">Avg Response Time</p>
                                    <p className="text-3xl font-black text-white mt-1">3.4 <span className="text-sm font-normal text-slate-400">mins</span></p>
                                    <p className="text-[10px] text-slate-400 mt-1">State highway protocol benchmark</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Clock className="w-7 h-7" />
                                </div>
                            </div>
                        </div>

                        {/* Incident Cards */}
                        <div className="grid gap-5">
                            {safeIncidents.map((inc, idx) => (
                                <div key={inc?.incident_id || idx} className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-950 rounded-3xl p-6 shadow-2xl border border-rose-500/40 relative overflow-hidden group hover:border-rose-500/80 transition-all">
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-rose-500/10 transition-colors"></div>

                                     <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                                          <div className="flex gap-5 items-start">
                                              {/* Pulsing SOS Icon */}
                                              <div className="relative flex-shrink-0">
                                                  <div className="absolute inset-0 bg-rose-500 rounded-2xl blur-md animate-pulse opacity-60"></div>
                                                  <div className="w-16 h-16 bg-slate-950 rounded-2xl border-2 border-rose-500 flex flex-col items-center justify-center relative z-10 text-rose-500 shadow-xl">
                                                      <AlertTriangle className="w-7 h-7 animate-bounce"/>
                                                      <span className="text-[8px] font-black uppercase text-rose-400 mt-0.5">SOS</span>
                                                  </div>
                                              </div>

                                              <div className="space-y-2">
                                                 <div className="flex flex-wrap items-center gap-2">
                                                     <h4 className="text-white font-bold text-lg flex items-center gap-2">
                                                         {inc?.type || `${inc?.severity || 'General'} Alert`}
                                                     </h4>
                                                     <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full border ${
                                                         inc?.status === 'Unit Dispatched' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-md' :
                                                         inc?.status === 'Escalated to State Admin' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                                                         'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                                                     }`}>
                                                         {inc?.status || 'Active Alert'}
                                                     </span>
                                                     <span className="text-xs font-mono text-slate-500">#{inc?.incident_id || 'UNK'}</span>
                                                 </div>

                                                 <p className="text-slate-200 text-sm font-medium bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 leading-relaxed">
                                                     "{inc?.description || 'No description provided.'}"
                                                 </p>

                                                 {/* Telemetry Strip */}
                                                 <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 pt-1">
                                                     <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-white">
                                                         <Bus className="w-3.5 h-3.5 text-rose-400"/> Bus Reg: <strong>{formatBusReg(inc?.bus_id)}</strong>
                                                     </span>
                                                     <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-slate-300">
                                                         <MapPin className="w-3.5 h-3.5 text-blue-400"/> Location: <strong>{getDynamicLocation(globalDistrict, idx)}</strong>
                                                     </span>
                                                     <span className="flex items-center gap-1.5 text-slate-400">
                                                         <Clock className="w-3.5 h-3.5 text-amber-400"/> Reported: {inc?.reported_time ? new Date(inc.reported_time).toLocaleString() : 'N/A'}
                                                     </span>
                                                 </div>
                                              </div>
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="flex flex-col gap-2.5 min-w-[220px] w-full lg:w-auto border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
                                              <button 
                                                 onClick={() => {
                                                     setSelectedOption('Highway Patrol & Heavy Towing Team');
                                                     setActiveModal({ type: 'dispatch', item: inc });
                                                 }} 
                                                 className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2 cursor-pointer border border-rose-400/30"
                                              >
                                                 <ShieldAlert className="w-4 h-4" /> Dispatch Nearest Unit
                                              </button>
                                              <button 
                                                 onClick={() => {
                                                     setSelectedOption('High Urgency State Command Directive');
                                                     setActiveModal({ type: 'escalate', item: inc });
                                                 }} 
                                                 className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition border border-slate-700 flex items-center justify-center gap-2 cursor-pointer hover:border-rose-500/50"
                                              >
                                                 <AlertTriangle className="w-4 h-4 text-amber-400" /> Escalate to State Level
                                              </button>
                                          </div>
                                     </div>
                                </div>
                            ))}

                             {safeIncidents.length === 0 && (
                                <div className="text-center p-14 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-1">Zero Active Incidents</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto">No emergency SOS signals or vehicle breakdowns reported across the {globalDistrict?.name || 'Regional'} region.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'revenue_insights':
                // Static monthly revenue calculation
                const monthlyRevenueLakhs = (globalDistrict.fleet * 1.85).toFixed(2);
                return (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                            <div>
                                <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded inline-block mb-2 border border-emerald-500/20">Dynamic Financial Matrix</span>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-emerald-500" /> Revenue & Fleet Analytics: {globalDistrict.name}
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">Live profitability and fleet utilization metrics specifically scoped to the {globalDistrict.name} region.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                                <div className="flex items-center gap-8 relative z-10">
                                     <div className="w-32 h-32 rounded-full border-4 border-emerald-500/20 flex items-center justify-center relative flex-shrink-0">
                                          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                                          <TrendingUp className="w-12 h-12 text-emerald-400" />
                                     </div>
                                     <div>
                                          <p className="text-emerald-500/80 uppercase tracking-widest text-xs font-black mb-2">Total Monthly Revenue (Estimated)</p>
                                          <h1 className="text-6xl font-black text-white">₹{monthlyRevenueLakhs} <span className="text-2xl text-slate-500 font-medium tracking-normal">Lakhs</span></h1>
                                          
                                          <div className="flex gap-4 mt-6">
                                               <div className="bg-slate-950/80 px-5 py-3 rounded-xl border border-slate-800/80 shadow-inner block">
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Active Fleet</p>
                                                    <p className="text-xl font-bold text-white flex items-center gap-2"><Bus className="w-4 h-4 text-emerald-400"/> {globalDistrict.fleet}</p>
                                               </div>
                                               <div className="bg-slate-950/80 px-5 py-3 rounded-xl border border-slate-800/80 shadow-inner block">
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Yield / Bus / Month</p>
                                                    <p className="text-xl font-bold text-blue-400">₹{parseFloat(((monthlyRevenueLakhs * 100000) / globalDistrict.fleet).toFixed(0)).toLocaleString()}</p>
                                               </div>
                                          </div>
                                     </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
                                 <div>
                                      <h3 className="text-white font-bold mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400"/> Taluk Revenue Distribution</h3>
                                      <div className="h-[220px] w-full">
                                           <ResponsiveContainer width="100%" height="100%">
                                               <BarChart data={globalDistrict.talukList.map(t => ({ name: t, revenue: Math.floor(Math.random() * 400) + 150 }))}>
                                                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                   <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(0,6)+'...'} />
                                                   <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}k`} />
                                                   <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}} itemStyle={{color: '#38bdf8', fontWeight: 'bold'}} formatter={(value) => [`₹${value},000`, 'Revenue']} />
                                                   <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                                               </BarChart>
                                           </ResponsiveContainer>
                                      </div>
                                 </div>
                                 <button className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg transition border border-slate-700 flex items-center justify-center gap-2">
                                     <BarChart3 className="w-4 h-4"/> Extract Full Report
                                 </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30 p-12">
                        <Settings className="w-12 h-12 mb-4 opacity-50 text-blue-500 animate-spin-slow" />
                        <h2 className="text-xl font-bold text-white mb-2">Module Integration Pending</h2>
                        <p className="text-sm text-center max-w-sm">This specific workspace is currently being linked to the backend services. Please check back next sprint.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-64px)] bg-slate-950 relative pb-16 md:pb-0">
            {/* Sidebar Navigation */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col pt-6 hidden md:flex sticky top-0 h-[calc(100vh-64px)] overflow-y-auto shadow-2xl z-40">
                <div className="px-4 mb-6 relative z-10">
                    <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <UserCog className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Regional Admin</h4>
                            <p className="text-xs text-blue-400">Authenticated Scope</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 pl-2">Operations</div>
                    <SidebarItem icon={Activity} label="Live Map Overview" active={activeMenu === 'overview'} onClick={() => loadTabData('overview')} />
                </div>

                <div className="px-4 mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 pl-2">Depot Network</div>
                    <SidebarItem icon={Building} label="Depots Overview (Grid)" active={activeMenu === 'depots'} onClick={() => loadTabData('depots')} />
                </div>

                <div className="px-4 mb-4">
                    <SidebarItem icon={TrendingUp} label="Revenue & Analytics" active={activeMenu === 'revenue_insights'} onClick={() => loadTabData('revenue_insights')} />
                </div>

                <div className="px-4 mb-4 mt-auto pb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 pl-2">Safety & Feedback</div>
                    <SidebarItem icon={MessageSquare} label="Passenger Feedback" active={activeMenu === 'complaints'} onClick={() => loadTabData('complaints')} />
                    <SidebarItem icon={ShieldAlert} label="Emergency Incidents" active={activeMenu === 'incidents'} onClick={() => loadTabData('incidents')} badge={incidents.length > 0 ? incidents.length : null} />
                </div>
            </aside>
            
            {/* Mobile Nav Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center h-16 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <button onClick={() => loadTabData('overview')} className={`p-2 flex flex-col items-center flex-1 ${activeMenu === 'overview' ? 'text-blue-500' : 'text-slate-400'}`}>
                    <Activity className="w-5 h-5"/>
                    <span className="text-[10px] mt-1 font-bold uppercase">Map</span>
                </button>
                <button onClick={() => loadTabData('depots')} className={`p-2 flex flex-col items-center flex-1 ${activeMenu === 'depots' ? 'text-blue-500' : 'text-slate-400'}`}>
                    <Building className="w-5 h-5"/>
                    <span className="text-[10px] mt-1 font-bold uppercase">Depots</span>
                </button>
                <button onClick={() => loadTabData('revenue_insights')} className={`p-2 flex flex-col items-center flex-1 ${activeMenu === 'revenue_insights' ? 'text-blue-500' : 'text-slate-400'}`}>
                    <TrendingUp className="w-5 h-5"/>
                    <span className="text-[10px] mt-1 font-bold uppercase">Revenue</span>
                </button>
                <button onClick={() => loadTabData('complaints')} className={`p-2 flex flex-col items-center flex-1 ${activeMenu === 'complaints' ? 'text-blue-500' : 'text-slate-400'}`}>
                    <MessageSquare className="w-5 h-5"/>
                    <span className="text-[10px] mt-1 font-bold uppercase">Feedback</span>
                </button>
                <button onClick={() => loadTabData('incidents')} className={`p-2 flex flex-col items-center flex-1 ${activeMenu === 'incidents' ? 'text-rose-500' : 'text-slate-400'} relative`}>
                    <ShieldAlert className="w-5 h-5"/>
                    <span className="text-[10px] mt-1 font-bold uppercase">Alerts</span>
                    {incidents.length > 0 && <span className="absolute top-1 right-[20%] w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></span>}
                </button>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto w-full relative">
                {/* Toast Notification */}
                {toast && (
                    <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
                        <div className={`px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-white text-sm font-bold backdrop-blur-xl ${
                            toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/50 shadow-amber-500/20' : 'bg-emerald-950/90 border-emerald-500/50 shadow-emerald-500/20'
                        }`}>
                            <CheckCircle2 className={`w-5 h-5 ${toast.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`} />
                            <span>{toast.message}</span>
                            <button onClick={() => setToast(null)} className="ml-3 text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
                        </div>
                    </div>
                )}

                {/* Interactive Action Modal */}
                {activeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    {activeModal.type === 'route' && <Building className="w-5 h-5 text-blue-500" />}
                                    {activeModal.type === 'direct' && <UserCheck className="w-5 h-5 text-emerald-500" />}
                                    {activeModal.type === 'dispatch' && <ShieldAlert className="w-5 h-5 text-rose-500" />}
                                    {activeModal.type === 'escalate' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                                    
                                    {activeModal.type === 'route' && `Route Ticket #${activeModal.item.complaint_id} to Depot`}
                                    {activeModal.type === 'direct' && `Direct Action for Ticket #${activeModal.item.complaint_id}`}
                                    {activeModal.type === 'dispatch' && `Dispatch Unit for Bus #${activeModal.item.bus_id}`}
                                    {activeModal.type === 'escalate' && `State Escalation for Incident #${activeModal.item.incident_id}`}
                                </h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleModalSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Target Action / Unit</label>
                                    <input 
                                        type="text" 
                                        value={selectedOption} 
                                        onChange={(e) => setSelectedOption(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="Enter target depot or dispatch team..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Regional Admin Directive Notes</label>
                                    <textarea 
                                        value={modalNotes}
                                        onChange={(e) => setModalNotes(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="Add operational notes or instructions..."
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveModal(null)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={actionLoading}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-lg ${
                                            activeModal.type === 'dispatch' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' :
                                            activeModal.type === 'escalate' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' :
                                            'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                                        }`}
                                    >
                                        {actionLoading ? <Settings className="w-4 h-4 animate-spin"/> : 'Confirm & Execute Directive'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {renderContent()}
            </main>
        </div>
    );
};

// -------------------------------------------------------------
// DRILL-DOWN SUB-COMPONENT
// -------------------------------------------------------------
const DepotDrillDown = ({ depot, onBack }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                <button onClick={onBack} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition">
                    <X className="w-5 h-5" />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border border-indigo-500/30">Depot Drill-Down</span>
                        <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${depot.health_score > 75 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                            Health: {depot.health_score}
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white mt-1">{depot.name} <span className="text-slate-500 font-medium text-lg">({depot.code})</span></h2>
                </div>
                <div className="ml-auto bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Today's Depot Revenue</p>
                    <p className="text-xl font-bold text-emerald-400 font-mono">₹{depot.revenue_today.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Center / Left Panel */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Admin Oversight Box */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                                <UserCheck className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold">Account Oversight: {depot.admin_oversight.manager}</h4>
                                <p className="text-xs text-slate-400">Depot Administration Account • Last login: <span className="text-emerald-400">{depot.admin_oversight.last_login}</span></p>
                            </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                            {depot.admin_oversight.audit_flags > 0 && (
                                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg font-bold">
                                    {depot.admin_oversight.audit_flags} Audit Flags
                                </span>
                            )}
                            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg transition border border-slate-700">View Audit Log</button>
                        </div>
                    </div>

                    {/* Fleet Operations Overview Shape */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

                        <div className="relative z-10">
                            <h3 className="font-black text-xl text-white flex items-center gap-2 mb-1">
                                <Bus className="w-5 h-5 text-blue-400" /> Fleet Operations Overview
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">Real-time status of all {depot.buses.active + depot.buses.idle + depot.buses.maint} assigned vehicles in {depot.name}.</p>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-950/80 border border-slate-700/50 p-4 rounded-xl flex flex-col justify-between backdrop-blur shadow-inner">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                            <Bus className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Total</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-white">{depot.buses.active + depot.buses.idle + depot.buses.maint}</p>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Fleet Size</p>
                                    </div>
                                </div>

                                <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-xl flex flex-col justify-between backdrop-blur group hover:border-emerald-500/60 transition shadow-[0_0_15px_rgba(16,185,129,0.05)] text-emerald-400 text-left relative">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                            <Activity className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <span className="flex h-3 w-3 relative mt-1 mr-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-3xl font-black">{depot.buses.active}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-emerald-500/80">Running Live</p>
                                    </div>
                                </div>

                                <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-xl flex flex-col justify-between backdrop-blur group hover:border-amber-500/60 transition shadow-[0_0_15px_rgba(245,158,11,0.05)] text-amber-400 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                            <Clock className="w-4 h-4 text-amber-400" />
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-3xl font-black">{depot.buses.idle}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-amber-500/80">Idle / Depot</p>
                                    </div>
                                </div>

                                <div className="bg-slate-950/80 border border-rose-500/30 p-4 rounded-xl flex flex-col justify-between backdrop-blur group hover:border-rose-500/60 transition shadow-[0_0_15px_rgba(243,33,117,0.05)] text-rose-400 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                                            <Wrench className="w-4 h-4 text-rose-400" />
                                        </div>
                                        <AlertTriangle className="w-4 h-4 opacity-50 mt-1 mr-1" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-3xl font-black">{depot.buses.maint}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-rose-500/80">Under Maint</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-slate-800">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Fleet Allocation Visualizer
                                    </span>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                                        {((depot.buses.active / (depot.buses.active + depot.buses.idle + depot.buses.maint)) * 100).toFixed(1)}% Active Rate
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-slate-950 rounded-full flex overflow-hidden shadow-inner border border-slate-700/50">
                                    <div style={{ width: `${(depot.buses.active / (depot.buses.active + depot.buses.idle + depot.buses.maint)) * 100}%` }} className="bg-emerald-500 h-full hover:brightness-125 transition-all"></div>
                                    <div style={{ width: `${(depot.buses.idle / (depot.buses.active + depot.buses.idle + depot.buses.maint)) * 100}%` }} className="bg-amber-500 h-full hover:brightness-125 transition-all"></div>
                                    <div style={{ width: `${(depot.buses.maint / (depot.buses.active + depot.buses.idle + depot.buses.maint)) * 100}%` }} className="bg-rose-500 h-full hover:brightness-125 transition-all"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Passenger Feedback Pannel */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-amber-400" /> Active Passenger Feedback & Complaints</h3>
                            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">{depot.open_complaints} Open</span>
                        </div>
                        <div className="space-y-3">
                            {[...Array(Math.max(1, depot.open_complaints))].slice(0, 3).map((_, i) => (
                                <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-300">"Bus delayed by 40 minutes at Dharmapuri toll"</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Bus TN-29-N-11{i} • Submitted 1 hr ago • Tag: <span className="text-amber-400">Delay</span></p>
                                    </div>
                                    <button className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-1 rounded hover:bg-slate-700">Review</button>
                                </div>
                            ))}
                            {depot.open_complaints === 0 && <p className="text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">No active complaints. Excellent service record today.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    {/* Maintenance / Breakdown Log */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-rose-500" /> Breakdown Log</h3>
                            <span className="text-xs font-bold text-slate-400">{depot.buses.maint} Vehicles</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4 pb-4 border-b border-slate-800">Aggregated from Driver Dashboard Panic Buttons (Socket.IO)</p>

                        <div className="space-y-3">
                            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Active Breakdown</span>
                                <h4 className="text-white text-sm font-bold">Engine Fault - TN-29-N-1542</h4>
                                <p className="text-xs text-slate-400 mt-1">Driver K. Murugan triggered panic alert at 10:42 AM.</p>
                                <button className="mt-3 text-xs w-full py-1.5 bg-rose-500/20 text-rose-400 rounded font-bold hover:bg-rose-500 hover:text-white transition">Dispatch Mechanic</button>
                            </div>
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg opacity-60">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Resolved</span>
                                <h4 className="text-white text-sm font-bold">Tire Puncture - TN-30-A-9921</h4>
                                <p className="text-xs text-slate-400 mt-1">Resolved in 45 mins.</p>
                            </div>
                        </div>
                    </div>

                    {/* Driver Roster Summary */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2"><UserCheck className="w-4 h-4 text-blue-500" /> Duty Roster</h3>
                        </div>
                        <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex justify-between p-2 hover:bg-slate-800 rounded-lg transition"><span>Available Drivers:</span> <span className="font-bold">42</span></div>
                            <div className="flex justify-between p-2 hover:bg-slate-800 rounded-lg transition"><span>On-Trip (Active):</span> <span className="font-bold text-emerald-400">{depot.active_trips}</span></div>
                            <div className="flex justify-between p-2 hover:bg-slate-800 rounded-lg transition"><span>On Leave (Absent):</span> <span className="font-bold text-rose-400">3</span></div>
                        </div>
                        <button className="w-full mt-4 py-2 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition">View Full Roster Matrix</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Reusable Metric Component
const MetricCard = ({ title, value, trend, icon: Icon, color }) => (
    <div className={`bg-slate-900 border ${color} rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:bg-slate-800/80 cursor-default group`}>
        <Icon className={`w-10 h-10 absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform duration-300`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-black text-white">{value}</span>
            {trend && <span className={`text-[10px] uppercase font-bold ${trend === 'Requires Action' ? 'text-rose-400 bg-rose-500/20' : 'text-emerald-400 bg-emerald-500/20'} px-2 py-0.5 rounded-full mb-1`}>{trend}</span>}
        </div>
    </div>
);

export default RegionalAdminDashboard;
