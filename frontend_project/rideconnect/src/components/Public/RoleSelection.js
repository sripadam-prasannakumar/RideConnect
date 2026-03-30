import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlobalBackButton from '../Shared/GlobalBackButton';

const RoleSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const action = queryParams.get('action') || 'register';

    const handleRoleSelect = (role) => {
        if (action === 'login') {
            navigate(`/login?role=${role}`);
        } else {
            navigate(`/register?role=${role}`);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0a1416] flex flex-col font-display select-none overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
            </div>

            {/* Navigation Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <GlobalBackButton variant="ghost" className="text-white hover:text-primary border-white/10" />
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-3 text-primary cursor-pointer group" 
                        onClick={() => navigate('/')}
                    >
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-dark/60 backdrop-blur-md shadow-[0_0_20px_rgba(13,204,242,0.2)] border border-primary/30 overflow-hidden relative group">
                        <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(13,204,242,0.8)_360deg)] animate-[spin_3s_linear_infinite] group-hover:animate-[spin_1.5s_linear_infinite]"></div>
                        <div className="absolute inset-[2px] bg-background-dark/90 rounded-full backdrop-blur-md z-0"></div>
                        <img 
                            src="/drivemate_logo.png" 
                            alt="RideConnect" 
                            className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10" 
                        />
                    </div>
                    <h2 className="text-white text-xl font-bold tracking-tight">RideConnect</h2>
                </motion.div>
                </div>
                
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-4"
                >
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">System Status</span>
                        <div className="flex items-center gap-1.5">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase">Optimal</span>
                        </div>
                    </div>
                </motion.div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-5xl"
                >
                    {/* Title Section */}
                    <motion.div variants={itemVariants} className="text-center mb-10">
                        <h1 className="text-white text-5xl font-black tracking-tight mb-3">Choose your role</h1>
                        <p className="text-primary/60 text-lg font-medium tracking-wide">Select how you want to use RideConnect today</p>
                    </motion.div>

                    {/* Role Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Customer Card */}
                        <motion.div 
                            variants={itemVariants}
                            whileHover={{ y: -10 }}
                            onClick={() => handleRoleSelect('customer')} 
                            className="group relative flex flex-col items-stretch rounded-3xl overflow-hidden border border-white/5 bg-surface-dark/40 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 shadow-2xl cursor-pointer"
                        >
                            <div className="relative w-full aspect-[2/1] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent z-10" />
                                <img alt="Customer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuByO1aljW0hBALmXb9lD3aE_-fAn1JBpgT83fmVRVRjCHXY6yK3dUOXDiRqeGHVmZ_rLYtivHlmK84MctBjI11UnY3-wuZGyjQ4Tt2OSNRSY5NP5p4--bnmFwzaAN2NTHL8f1cbwUQ0HGaeZC4euwc7nDKayxndnFruZoFlT-VaVAtH_XPhz3R2pRTPuEdYtcpP7RKquzFKNcoMm3T6Gfmpi3qjkb2ukxL5lkW5Cypa1EqCK343AQRQroqtmQPHautzpqMiVXjZNuA" />
                                <div className="absolute top-6 left-6 z-20 size-12 flex items-center justify-center rounded-2xl bg-primary text-background-dark shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined text-3xl">person_pin_circle</span>
                                </div>
                            </div>
                            <div className="flex flex-col p-8 gap-6">
                                <div>
                                    <h3 className="text-white text-3xl font-bold mb-3">Customer</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Book a ride and travel in comfort. Request premium cars at your fingertips for your daily commute or special occasions.</p>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <span className="text-[10px] text-primary/40 font-black uppercase tracking-[0.2em]">Ready to travel</span>
                                    <motion.button 
                                        whileTap={{ scale: 0.95 }}
                                        className="h-11 px-8 rounded-xl bg-primary text-background-dark text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:brightness-110 transition-all"
                                    >
                                        Select Customer
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Driver Card */}
                        <motion.div 
                            variants={itemVariants}
                            whileHover={{ y: -10 }}
                            onClick={() => handleRoleSelect('driver')} 
                            className="group relative flex flex-col items-stretch rounded-3xl overflow-hidden border border-white/5 bg-surface-dark/40 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 shadow-2xl cursor-pointer"
                        >
                            <div className="relative w-full aspect-[2/1] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent z-10" />
                                <img alt="Driver" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJztUGK9pxivu45t7ODwblnsCoIdSRZEVRCeJSoiE01wIIoS26y6VC4wTp_DFhadm3XsQvrxUrISqiVHmkigvIGaQoKEoWg7xCqolcGi6UNKxFKo5aW5S9X1f5-Ewx-Xm8j6NyKn1V-1e16gMWCZBEY4eetvxLO3f2HugRfaXekvskZtrdtiOoeqTLe5dCrYGwn8siwKO_Vu5yeTl3vqe5ChAlPtjyPfBBK66gIVLTeKvFYuerK1DqLG6FrWA0gMr8pydlZyduxRk" />
                                <div className="absolute top-6 left-6 z-20 size-12 flex items-center justify-center rounded-2xl bg-primary text-background-dark shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined text-3xl">directions_car</span>
                                </div>
                            </div>
                            <div className="flex flex-col p-8 gap-6">
                                <div>
                                    <h3 className="text-white text-3xl font-bold mb-3">Driver</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Join our fleet and start earning. Professional driver dashboard with flexible scheduling and high-demand route optimization.</p>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <span className="text-[10px] text-primary/40 font-black uppercase tracking-[0.2em]">Earn on your time</span>
                                    <motion.button 
                                        whileTap={{ scale: 0.95 }}
                                        className="h-11 px-8 rounded-xl bg-primary text-background-dark text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:brightness-110 transition-all"
                                    >
                                        Select Driver
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Footer Action */}
                    <motion.div variants={itemVariants} className="mt-12 flex justify-center">
                        <button 
                            onClick={() => navigate('/role-selection?action=login')} 
                            className="group flex items-center gap-4 px-10 py-5 rounded-2xl bg-white/5 border border-white/5 text-white/80 text-sm font-bold hover:bg-white/10 transition-all"
                        >
                            <span>Already have an account?</span>
                            <span className="text-primary tracking-wide">Log in here</span>
                            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </motion.div>
                </motion.div>
            </main>

            {/* Support Info */}
            <footer className="relative z-10 px-8 py-6 flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <p>© 2024 RideConnect Global Inc.</p>
                <div className="flex gap-8">
                    <a className="hover:text-primary transition-colors" href="/privacy">Privacy</a>
                    <a className="hover:text-primary transition-colors" href="/terms">Terms</a>
                    <a className="hover:text-primary transition-colors" href="/support">Support</a>
                </div>
            </footer>
        </div>
    );
};

export default RoleSelection;
