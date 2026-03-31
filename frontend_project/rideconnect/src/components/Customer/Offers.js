import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlobalBackButton from '../Shared/GlobalBackButton';

const Offers = () => {
    const navigate = useNavigate();
    const [referralCode] = useState('RIDE' + Math.random().toString(36).substring(2, 7).toUpperCase());
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const offers = [
        {
            id: 1,
            title: "3 Rides Milestone",
            description: "Complete 3 rides within a week and get 50% flat discount on your 4th ride!",
            progress: 66,
            footer: "2/3 Rides Completed",
            color: "primary",
            icon: "military_tech",
            gradient: "from-primary/20 to-primary/5"
        },
        {
            id: 2,
            title: "Long Distance Saver",
            description: "Planning a trip over 20km? Save flat 25% on long distance bookings instantly.",
            progress: 100,
            footer: "Always Active",
            color: "emerald-500",
            icon: "distance",
            gradient: "from-emerald-500/20 to-emerald-500/5"
        },
        {
            id: 3,
            title: "Refer & Earn",
            description: "Share your code with friends. You get 15% wallet commission for every successful ride they take!",
            progress: 0,
            footer: "Start Sharing Now",
            color: "amber-500",
            icon: "share",
            gradient: "from-amber-500/20 to-amber-500/5"
        },
        {
            id: 4,
            title: "Weekend Warrior",
            description: "Ride between Saturday and Sunday to unlock exclusive cashback rewards up to 40%.",
            progress: 0,
            footer: "Available this Sat",
            color: "indigo-500",
            icon: "weekend",
            gradient: "from-indigo-500/20 to-indigo-500/5"
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-background-dark font-display pb-20">
            {/* Header section with curve */}
            <div className="bg-primary pt-12 pb-16 px-6 rounded-b-[3rem] shadow-lg shadow-primary/20 relative z-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <GlobalBackButton variant="ghost" className="text-background-dark hover:bg-background-dark/10" />
                        <div>
                            <h1 className="text-3xl font-black text-background-dark tracking-tight">Exclusive Offers</h1>
                            <p className="text-background-dark/70 font-bold uppercase tracking-widest text-[10px]">Unlock savings on every ride</p>
                        </div>
                    </div>
                </div>
            </div>
                
            {/* Floating Referral Card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="relative -mt-10 mx-6 sm:mx-auto max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6 z-10">
                    <div className="size-20 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-amber-500 text-4xl">redeem</span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-lg font-black dark:text-white">Referral Bonus</h2>
                        <p className="text-xs font-semibold text-slate-500">Earn ₹50 for every friend who joins!</p>
                        <div className="mt-4 flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-700">
                            <span className="text-lg font-black tracking-widest text-primary flex-1">{referralCode}</span>
                            <button onClick={handleCopy} className="text-slate-500 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

            <div className="mt-8 px-6 max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {offers.map((offer, index) => (
                        <motion.div 
                            key={offer.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden group hover:scale-[1.02] transition-all`}
                        >
                            {/* Background Pulse Effect */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${offer.gradient} rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform`}></div>
                            
                            <div className="relative z-10 space-y-6">
                                <div className={`size-14 rounded-2xl flex items-center justify-center border ${
                                    offer.color === 'primary' ? 'bg-primary/10 border-primary/20 text-primary' :
                                    offer.color === 'emerald-500' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    offer.color === 'amber-500' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                    'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                                }`}>
                                    <span className="material-symbols-outlined text-3xl font-bold">{offer.icon}</span>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-black mb-2 dark:text-white line-clamp-1">{offer.title}</h3>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed italic">{offer.description}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Progress</span>
                                        <span className={
                                            offer.color === 'primary' ? 'text-primary' :
                                            offer.color === 'emerald-500' ? 'text-emerald-500' :
                                            offer.color === 'amber-500' ? 'text-amber-500' :
                                            'text-indigo-500'
                                        }>{offer.progress}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${offer.progress}%` }} transition={{ duration: 1.5 }}
                                            className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
                                                offer.color === 'primary' ? 'bg-primary' :
                                                offer.color === 'emerald-500' ? 'bg-emerald-500' :
                                                offer.color === 'amber-500' ? 'bg-amber-500' :
                                                'bg-indigo-500'
                                            }`} />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tighter">{offer.footer}</p>
                                </div>

                                <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                                    offer.color === 'primary' ? 'bg-primary/10 hover:bg-primary text-primary hover:text-white' :
                                    offer.color === 'emerald-500' ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white' :
                                    offer.color === 'amber-500' ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white' :
                                    'bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white'
                                }`}>
                                    Claim Now
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Terms and Conditions */}
                <div className="p-8 bg-slate-200/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">How it works</p>
                    <div className="flex flex-col sm:flex-row justify-around gap-6 opacity-60">
                        <div className="space-y-2">
                            <span className="material-symbols-outlined text-slate-400">local_activity</span>
                            <p className="text-[10px] font-bold uppercase">Earn coupons</p>
                        </div>
                        <div className="space-y-2">
                            <span className="material-symbols-outlined text-slate-400">wallet</span>
                            <p className="text-[10px] font-bold uppercase">Stored in wallet</p>
                        </div>
                        <div className="space-y-2">
                            <span className="material-symbols-outlined text-slate-400">check_circle</span>
                            <p className="text-[10px] font-bold uppercase">Auto-apply at checkout</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Offers;
