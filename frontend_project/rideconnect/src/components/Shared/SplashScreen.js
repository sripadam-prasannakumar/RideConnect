import React, { useState, useEffect } from 'react';

const SplashScreen = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 15) + 5;
            });
        }, 300);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
            {/* Subtle Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-background-dark via-[#0a1416] to-black opacity-100"></div>
            {/* Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-[400px] px-6">
                {/* Logo Section */}
                <div className="mb-16">
                    <div className="hidden">
                        <div className="bg-center bg-no-repeat bg-cover" data-alt="High-end luxury car interior dashboard lighting" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCs2B0Qc_2YCefSGHpOsZ7BG7KjdS14_vCT2XkNPoDKKGBLVyc806MGbJXs8QF6sPr01YXyB52abz2jjzLi7e6btEKPJNddc4pcuGoGqngwydJ8uZUUzhEx0-kZXjJtB_JfBbIDYWlq_yV0-7TlNrlo7-Ac8ZadxmFk3iyVlDwithjxh02nHTSwQaYN7vWIr0sPrxb3ORULxEyznY3H9IaCKwnOHA0K4hOHVlwXATVA5-uBIF7OLAalThiDOPt-bD9t6M4HThLcGEc")' }}></div>
                    </div>
                    <div className="w-36 h-36 flex items-center justify-center rounded-full bg-surface-dark/40 backdrop-blur-xl shadow-[0_0_50px_rgba(13,204,242,0.2)] border-2 border-primary/30 overflow-hidden relative group">
                        <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(13,204,242,0.8)_360deg)] animate-[spin_3s_linear_infinite] group-hover:animate-[spin_1.5s_linear_infinite]"></div>
                        <div className="absolute inset-1 bg-background-dark/80 rounded-full backdrop-blur-md z-0"></div>
                        <img 
                            src="/drivemate_logo.png" 
                            alt="RideConnect Logo" 
                            className="w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10" 
                        />
                    </div>
                </div>
                
                {/* Brand Content */}
                <div className="text-center mb-12">
                    <h1 className="text-slate-100 text-4xl font-bold tracking-tight mb-2">RideConnect</h1>
                    <p className="text-primary/80 text-sm font-medium tracking-[0.2em] uppercase">Premium Automotive Intelligence</p>
                </div>
                
                {/* Loading Interface */}
                <div className="w-full flex flex-col gap-4">
                    <div className="flex items-end justify-between px-1">
                        <div className="flex flex-col gap-1">
                            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">System Status</span>
                            <p className="text-slate-100 text-sm font-normal">Initializing secure connection...</p>
                        </div>
                        <span className="text-primary text-lg font-bold">{Math.min(progress, 100)}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/30">
                        <div className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(13,204,242,0.6)] transition-all ease-out duration-300" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-sm animate-pulse">lock</span>
                            <span className="text-primary/70 text-[10px] font-semibold uppercase tracking-widest">End-to-End Encrypted</span>
                        </div>
                    </div>
                </div>
                
                {/* Footer Meta */}
                <div className="absolute bottom-12 flex flex-col items-center gap-2">
                    <p className="text-slate-500 text-[10px] font-medium tracking-widest uppercase">Version 4.0.1 Premium</p>
                    <div className="flex gap-4">
                        <span className="material-symbols-outlined text-slate-600 text-lg">bluetooth_connected</span>
                        <span className="material-symbols-outlined text-slate-600 text-lg">settings_input_antenna</span>
                        <span className="material-symbols-outlined text-slate-600 text-lg">navigation</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
