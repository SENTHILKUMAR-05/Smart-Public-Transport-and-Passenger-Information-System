import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, ShieldAlert, BadgeCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await login(username, password);
        if (!res.success) {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-slate-200">
            {/* Background Decor */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl shadow-blue-900/20">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Bus className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">SPTPIS Portal</h2>
                    <p className="text-center text-slate-400 mb-8 text-sm">Smart Public Transport ^& Passenger Information System</p>

                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center text-red-400 text-sm">
                            <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-slate-600 font-medium"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-slate-600 font-medium"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center mt-2 group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Secure Login'
                            )}
                        </button>
                    </form>

                    {/* Quick Info Box for Temporary Credentials */}
                    <div className="mt-8 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ml-1">Temporary Demo Access</h4>
                        <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex items-center justify-between px-2">
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-400" /> State Admin</span>
                                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-xs">state_admin / admin</span>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-400" /> Regional Admin</span>
                                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-xs">regional_admin / admin</span>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-400" /> Depot Admin</span>
                                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-xs">depot_admin / admin</span>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <span className="flex items-center gap-2"><Bus className="w-4 h-4 text-blue-400" /> Driver</span>
                                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-xs">driver / driver</span>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" /> Passenger</span>
                                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-xs">passenger / passenger</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
