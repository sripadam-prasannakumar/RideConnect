import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 bg-[#0a1416] flex flex-col font-display select-none overflow-hidden text-slate-100">
            {/* Ambient Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#101f22] via-[#0a1416] to-black"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-6 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="size-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(13,204,242,0.15)] border border-primary/20 overflow-hidden">
                        <img 
                            src="/drivemate_logo.png" 
                            alt="RideConnect" 
                            className="w-7 h-7 object-contain drop-shadow-md" 
                        />
                    </div>
                    <span className="text-white text-lg font-bold tracking-tight">RideConnect</span>
                </div>
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-base">forum</span>
                        Concierge
                    </button>
                    <div className="w-[1px] h-4 bg-white/10"></div>
                    <div className="size-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                        <span className="material-symbols-outlined text-sm text-slate-400">language</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-2xl flex flex-col items-center text-center">
                    
                    {/* Animated Logo */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="mb-10 relative"
                    >
                        <div className="size-36 flex items-center justify-center rounded-full bg-surface-dark/40 backdrop-blur-xl shadow-[0_0_50px_rgba(13,204,242,0.2)] border-2 border-primary/30 overflow-hidden relative group">
                            <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(13,204,242,0.8)_360deg)] animate-[spin_3s_linear_infinite] group-hover:animate-[spin_1.5s_linear_infinite]"></div>
                            <div className="absolute inset-1 bg-background-dark/80 rounded-full backdrop-blur-md z-0"></div>
                            <img 
                                src="/drivemate_logo.png" 
                                alt="RideConnect" 
                                className="w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10" 
                            />
                        </div>
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute -inset-4 border border-primary/20 rounded-[40px]"
                        />
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h1 className="text-white text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                            Redefining <br />
                            <span className="text-primary italic">Luxury Mobility</span>
                        </h1>
                        <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-md mx-auto leading-relaxed mb-12">
                            The intelligent interface for professional chauffeured services and elite rentals.
                        </p>
                    </motion.div>

                    {/* CTAs */}
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-6 w-full max-w-md"
                    >
                        <button
                            onClick={() => navigate('/role-selection?action=login')}
                            className="flex-1 h-14 rounded-2xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(13,204,242,0.2)] hover:scale-105 transition-all"
                        >
                            Log In Session
                        </button>
                        <button
                            onClick={() => navigate('/role-selection?action=register')}
                            className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:scale-105 transition-all"
                        >
                            Get Started
                        </button>
                    </motion.div>

                    {/* Features Row */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="grid grid-cols-4 gap-12 mt-20"
                    >
                        {[
                            { icon: 'shield_locked', label: 'Vetted' },
                            { icon: 'diamond', label: 'Elite' },
                            { icon: 'bolt', label: 'Rapid' },
                            { icon: 'verified', label: 'Secure' }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-primary/40 text-2xl">{item.icon}</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 px-8 py-6 flex items-center justify-between text-slate-600 text-[10px] font-black uppercase tracking-widest border-t border-white/5">
                <p>© 2024 RideConnect Global</p>
                <div className="flex gap-8">
                    <a className="hover:text-primary transition-colors" href="/terms">Terms</a>
                    <a className="hover:text-primary transition-colors" href="/privacy">Privacy</a>
                </div>
            </footer>
        </div>
    );
};

export default Welcome;
