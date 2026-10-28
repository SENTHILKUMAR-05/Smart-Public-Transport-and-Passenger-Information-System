import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, ShieldAlert, BadgeCheck, Users, Sparkles, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ElectricBorder from '../components/ElectricBorder';

const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const canvasRef = useRef(null);

    // Full-screen, ultra-performant 60/120fps ribbon animation (zero scroll lag)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let t = 0;
        let dpr = 1;

        const handleResize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
            const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
        };

        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize, { passive: true });
        }

        const NUM_SAMPLES = 120;
        const NUM_STRANDS = 36;

        const draw = () => {
            t += 0.022;

            const w = canvas.width / dpr;
            const h = canvas.height / dpr;

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            const responsiveScale = Math.min(1.2, Math.max(0.65, w / 900));

            // 1. Compute center S-curve wave spine points (full bleed off-screen to off-screen)
            const points = [];
            for (let i = 0; i <= NUM_SAMPLES; i++) {
                const u = i / NUM_SAMPLES;

                const waveA = Math.sin(t * 1.4 + u * 4.4) * (24 * responsiveScale);
                const waveB = Math.cos(t * 1.1 + u * 3.5) * (32 * responsiveScale);

                const px = -w * 0.06 + w * 1.12 * u + waveA * (1 - u * 0.35);
                const py = h * 1.06 - h * 1.12 * Math.pow(u, 0.92) + (h * 0.28 * Math.sin(u * Math.PI * 1.85)) + waveB;

                points.push({ x: px, y: py });
            }

            // 2. Compute normal vectors along the spine
            const normals = [];
            for (let i = 0; i <= NUM_SAMPLES; i++) {
                const pPrev = points[Math.max(0, i - 1)];
                const pNext = points[Math.min(NUM_SAMPLES, i + 1)];
                const dx = pNext.x - pPrev.x;
                const dy = pNext.y - pPrev.y;
                const len = Math.hypot(dx, dy) || 1;
                normals.push({ nx: -dy / len, ny: dx / len });
            }

            // 3. Fast hardware-accelerated ambient glow layers (zero CPU filter blur lag!)
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            for (let i = 0; i <= NUM_SAMPLES; i++) {
                if (i === 0) ctx.moveTo(points[i].x, points[i].y);
                else ctx.lineTo(points[i].x, points[i].y);
            }

            ctx.strokeStyle = 'rgba(147, 51, 234, 0.12)';
            ctx.lineWidth = 140 * responsiveScale;
            ctx.stroke();

            ctx.strokeStyle = 'rgba(217, 70, 239, 0.22)';
            ctx.lineWidth = 75 * responsiveScale;
            ctx.stroke();

            ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
            ctx.lineWidth = 35 * responsiveScale;
            ctx.stroke();
            ctx.restore();

            // 4. Draw high-contrast striated fiber optic silk strands
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            let pinchPoint = null;

            for (let s = 0; s < NUM_STRANDS; s++) {
                const strandFrac = (s / (NUM_STRANDS - 1)) * 2 - 1;
                const absFrac = Math.abs(strandFrac);

                let strandColor;
                let strandWidth = 1.4;

                if (absFrac < 0.12) {
                    strandColor = 'rgba(255, 255, 255, 0.98)';
                    strandWidth = 2.4;
                } else if (absFrac < 0.28) {
                    strandColor = 'rgba(250, 232, 255, 0.92)';
                    strandWidth = 2.0;
                } else if (absFrac < 0.55) {
                    strandColor = 'rgba(217, 70, 239, 0.85)';
                    strandWidth = 1.7;
                } else if (absFrac < 0.8) {
                    strandColor = 'rgba(168, 85, 247, 0.82)';
                    strandWidth = 1.5;
                } else {
                    strandColor = 'rgba(126, 34, 206, 0.75)';
                    strandWidth = 1.3;
                }

                ctx.beginPath();
                for (let i = 0; i <= NUM_SAMPLES; i++) {
                    const u = i / NUM_SAMPLES;
                    const p = points[i];
                    const norm = normals[i];

                    const twist = u * Math.PI * 2.85 + t * 0.62;
                    const cosTwist = Math.cos(twist);

                    const pinchDist = (u - 0.52) / 0.13;
                    const envelope = (108 * responsiveScale) * (1 - 0.88 * Math.exp(-pinchDist * pinchDist)) + 7;

                    if (s === 0 && Math.abs(u - 0.52) < 0.008) {
                        pinchPoint = { x: p.x, y: p.y };
                    }

                    const offset = strandFrac * envelope * cosTwist;
                    const sx = p.x + norm.nx * offset;
                    const sy = p.y + norm.ny * offset;

                    if (i === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }

                ctx.strokeStyle = strandColor;
                ctx.lineWidth = strandWidth;
                ctx.stroke();
            }

            // 5. Central blazing white twist pinch flare & glint
            if (pinchPoint) {
                const flareRadius = 155 * responsiveScale;
                const flareGrad = ctx.createRadialGradient(
                    pinchPoint.x, pinchPoint.y, 0,
                    pinchPoint.x, pinchPoint.y, flareRadius
                );
                flareGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
                flareGrad.addColorStop(0.1, 'rgba(250, 232, 255, 0.95)');
                flareGrad.addColorStop(0.3, 'rgba(217, 70, 239, 0.7)');
                flareGrad.addColorStop(0.65, 'rgba(147, 51, 234, 0.3)');
                flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = flareGrad;
                ctx.beginPath();
                ctx.arc(pinchPoint.x, pinchPoint.y, flareRadius, 0, Math.PI * 2);
                ctx.fill();

                const glintRadius = 240 * responsiveScale;
                const glintGrad = ctx.createRadialGradient(
                    pinchPoint.x, pinchPoint.y, 0,
                    pinchPoint.x, pinchPoint.y, glintRadius
                );
                glintGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
                glintGrad.addColorStop(0.25, 'rgba(240, 171, 252, 0.75)');
                glintGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.save();
                ctx.translate(pinchPoint.x, pinchPoint.y);
                ctx.rotate(-0.38);
                ctx.scale(2.2, 0.28);
                ctx.fillStyle = glintGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 130 * responsiveScale, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.restore();
            ctx.restore();

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

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
        <div className="min-h-screen w-full bg-[#000000] flex flex-col items-center justify-center relative overflow-x-hidden text-slate-200 px-4 py-8">
            
            {/* Fixed Full-Viewport Background Canvas (Lag-free hardware composited) */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 w-screen h-screen pointer-events-none z-0"
                style={{ opacity: 1, willChange: 'transform' }}
            />

            {/* Deep Ambient Contrast Vignette */}
            <div className="fixed inset-0 pointer-events-none z-[1]" style={{
                background: 'radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.8) 100%)'
            }}></div>

            {/* Electric Border Wrapped Translucent Login Box */}
            <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 w-full max-w-md my-auto"
                >
                    <ElectricBorder
                        color="#7df9ff"
                        glowColor="#c084fc"
                        speed={1.3}
                        chaos={0.65}
                        spread={0.7}
                        strands={4}
                        thickness={1.8}
                        glow={1.1}
                        intensity={1.0}
                        arcs={2}
                        borderRadius={32}
                        interactive={true}
                        className="w-full shadow-2xl"
                    >
                        <div 
                            className="backdrop-blur-3xl p-6 sm:p-8 md:p-9 rounded-[32px] relative overflow-hidden border border-white/15"
                            style={{
                                backgroundColor: 'rgba(8, 4, 18, 0.58)',
                                boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            {/* Top Soft Shimmer Border Accent */}
                            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none"></div>

                            {/* Logo & Header */}
                            <div className="flex justify-center mb-5 sm:mb-6">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/40 border border-white/20 relative group">
                                    <Bus className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400" />
                                </div>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-white mb-2 tracking-tight flex items-center justify-center gap-2">
                                <span>SPTPIS Portal</span>
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 animate-pulse" />
                            </h2>
                            
                            <p className="text-center text-purple-200/80 mb-6 sm:mb-8 text-xs sm:text-sm font-medium px-2">
                                Smart Public Transport & Passenger Information System
                            </p>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    className="mb-6 p-3.5 sm:p-4 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center text-red-300 text-sm backdrop-blur-md"
                                >
                                    <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0 text-red-400" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {/* Form Controls */}
                            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-purple-200/90 mb-2 ml-1 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Username</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-white/[0.06] border border-white/15 rounded-2xl px-4 py-3 sm:py-3.5 outline-none focus:border-cyan-400 focus:bg-white/[0.1] focus:shadow-[0_0_24px_rgba(125,249,255,0.45)] transition-all text-white placeholder-slate-400 font-medium text-sm backdrop-blur-sm"
                                            placeholder="Enter your username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-purple-200/90 mb-2 ml-1 flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Password</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/[0.06] border border-white/15 rounded-2xl px-4 py-3 sm:py-3.5 outline-none focus:border-cyan-400 focus:bg-white/[0.1] focus:shadow-[0_0_24px_rgba(125,249,255,0.45)] transition-all text-white placeholder-slate-400 font-medium text-sm backdrop-blur-sm"
                                            placeholder="Enter your password"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-cyan-500/35 hover:shadow-cyan-400/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center mt-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Secure Login'
                                    )}
                                </button>
                            </form>

                            {/* Quick Info Box for Temporary Credentials */}
                            <div className="mt-6 sm:mt-8 p-3.5 sm:p-4 bg-white/[0.04] backdrop-blur-xl border border-white/15 rounded-2xl shadow-inner">
                                <h4 className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-widest mb-3 ml-1 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-cyan-300" />
                                    <span>Temporary Demo Access</span>
                                </h4>
                                <div className="space-y-2 text-xs text-slate-300">
                                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/[0.05] transition">
                                        <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-400" /> State Admin</span>
                                        <span className="font-mono bg-black/60 border border-white/10 px-2 py-0.5 rounded text-[11px] text-purple-200">state_admin / admin</span>
                                    </div>
                                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/[0.05] transition">
                                        <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-400" /> Regional Admin</span>
                                        <span className="font-mono bg-black/60 border border-white/10 px-2 py-0.5 rounded text-[11px] text-purple-200">regional_admin / admin</span>
                                    </div>
                                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/[0.05] transition">
                                        <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-400" /> Depot Admin</span>
                                        <span className="font-mono bg-black/60 border border-white/10 px-2 py-0.5 rounded text-[11px] text-purple-200">depot_admin / admin</span>
                                    </div>
                                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/[0.05] transition">
                                        <span className="flex items-center gap-2"><Bus className="w-4 h-4 text-cyan-400" /> Driver</span>
                                        <span className="font-mono bg-black/60 border border-white/10 px-2 py-0.5 rounded text-[11px] text-cyan-200">driver / driver</span>
                                    </div>
                                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/[0.05] transition">
                                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" /> Passenger</span>
                                        <span className="font-mono bg-black/60 border border-white/10 px-2 py-0.5 rounded text-[11px] text-emerald-200">passenger / passenger</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ElectricBorder>
                </motion.div>
            </div>
        );
    };

export default Login;
