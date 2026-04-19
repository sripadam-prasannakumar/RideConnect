import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuthStatus } from '../../utils/authUtils';
import LogoBadge from '../Shared/LogoBadge';


const Splash = () => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                const increment = Math.random() * 5 + 1;
                return Math.min(prev + increment, 100);
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (progress >= 100) {
            sessionStorage.removeItem('manualDashboard'); // Reset manual navigation flag for fresh load
            const { isAuthenticated, role: userRole } = getAuthStatus();
            const timer = setTimeout(() => {
                if (isAuthenticated) {
                    if (userRole === 'admin') navigate('/admin/dashboard');
                    else if (userRole === 'driver') navigate('/driver/dashboard');
                    else navigate('/customer/dashboard');
                } else {
                    navigate('/welcome');
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [progress, navigate]);

    return (
        <div className="fixed inset-0 bg-[#0a1416] flex items-center justify-center overflow-hidden font-display select-none">
            {/* Ambient Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#101f22] via-[#0a1416] to-[#070d0e]"></div>
                
                {/* Animated Particle-like Blobs */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]"
                />
                <motion.div 
                    animate={{ 
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.15, 0.1],
                        rotate: [360, 180, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]"
                />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8 text-center">
                {/* Logo Section */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-12 relative"
                >
                    <LogoBadge size="xl" />

                </motion.div>

                {/* Brand Identity */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                >
                    <h1 className="text-white text-5xl font-bold tracking-tight mb-2">RideConnect</h1>
                    <p className="text-primary/60 text-sm font-semibold tracking-[0.3em] uppercase">Premium Automotive Intelligence</p>
                </motion.div>

                {/* Loading Interface */}
                <div className="w-full mt-16 flex flex-col gap-6">
                    <div className="flex items-end justify-between text-slate-400">
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Network Status</span>
                            <motion.p 
                                key={Math.floor(progress / 25)}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm font-medium text-slate-200"
                            >
                                {progress < 25 ? "Establishing link..." : 
                                 progress < 50 ? "Verifying credentials..." : 
                                 progress < 75 ? "Loading architecture..." : "Finalizing session..."}
                            </motion.p>
                        </div>
                        <span className="text-2xl font-bold text-primary tabular-nums">
                            {Math.round(progress)}%
                        </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-md">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-primary/50 to-primary origin-left"
                            style={{ width: `${progress}%` }}
                            layoutId="progress-bar"
                        />
                        {/* Glow effect */}
                        <motion.div 
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="h-full bg-primary/30 blur-sm -mt-1"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex justify-center"
                    >
                        <div className="px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Encrypted Environment</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Corner Decorative Elements */}
            <div className="absolute top-12 left-12 flex flex-col gap-1">
                <div className="w-8 h-[2px] bg-primary/20" />
                <div className="w-4 h-[2px] bg-primary/10" />
            </div>
            <div className="absolute bottom-12 right-12 flex flex-col gap-1 items-end">
                <div className="w-4 h-[2px] bg-primary/10" />
                <div className="w-8 h-[2px] bg-primary/20" />
                <p className="mt-4 text-[9px] font-bold text-slate-600 tracking-widest uppercase italic">System.v4.0.1</p>
            </div>
        </div>
    );
};

export default Splash;
