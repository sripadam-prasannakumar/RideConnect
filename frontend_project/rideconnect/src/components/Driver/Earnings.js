import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlobalBackButton from '../Shared/GlobalBackButton';

const DriverEarnings = () => {
    const navigate = useNavigate();

    const history = [
        { id: 1, date: 'Oct 24, 2023', user: 'Michael Chen', dist: '12.4 km', time: '18 min', fare: '₹32.40', status: 'Paid' },
        { id: 2, date: 'Oct 24, 2023', user: 'Sarah Jenkins', dist: '24.8 km', time: '34 min', fare: '₹58.20', status: 'Processing' },
        { id: 3, date: 'Oct 24, 2023', user: 'David Miller', dist: '5.2 km', time: '12 min', fare: '₹14.50', status: 'Paid' }
    ];

    return (
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-slate-900/50">
            <div className="p-10">
                <header className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-5">
                        <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-700" />
                        <div className="p-3 rounded-2xl bg-white/5 text-primary border border-white/10">
                            <span className="material-symbols-outlined font-black text-2xl">account_balance_wallet</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Earnings Hub</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold">Alex Rivera</p>
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Gold Tier Driver</p>
                        </div>
                        <img className="size-12 rounded-2xl border-2 border-primary/30 object-cover shadow-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsMBQCYHc2TSKz3qrhSGMRZTRZg0gD8UJCpBWUwxPPNKE7ODDcNKNviMebN2y8fBy999tvvo6bAGEXOkBv975i6ySBYqQL-JyCo1TuBdEaifTrKjvpLgVhPAiJfibNiNhCnwUgemC8_YsJVnEGwGyhwibVECuCbHFN-af1BguuCtCaQkhcUnhdw1LXIKpd5q7SHMJ8Dlvw4xnfQeBuSwR1MD7z1ndWMQm-pdEYCFp4Px_jvT0c_OjE4bH0oICApIDJm_XjPGMSAMc" alt="Profile" />
                    </div>
                </header>

                <div className="space-y-10 max-w-7xl mx-auto w-full">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Earnings', value: '₹12,450.00', trend: '+12.5%', color: 'primary' },
                            { label: 'Current Week', value: '₹842.50', trend: '+5.2%', color: 'emerald-400' },
                            { label: 'Daily Earnings', value: '₹125.20', trend: '+2.1%', color: 'emerald-400' },
                            { label: 'Pending Payout', value: '₹320.00', status: 'Processing', color: 'slate-400' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">{stat.label}</p>
                                <h3 className="text-3xl font-black tabular-nums">{stat.value}</h3>
                                {stat.trend ? (
                                    <div className="mt-4 flex items-center gap-1.5 text-emerald-400 text-xs font-black">
                                        <span className="material-symbols-outlined text-sm font-black">trending_up</span>
                                        {stat.trend}
                                    </div>
                                ) : (
                                    <div className="mt-4 flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-sm font-black">schedule</span>
                                        {stat.status}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Chart Mockup */}
                    <div className="bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-widest">Earnings Performance</h3>
                                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Weekly trend analysis</p>
                            </div>
                            <div className="flex p-1.5 bg-background-dark rounded-2xl border border-white/5">
                                <button className="px-6 py-2.5 bg-primary text-background-dark font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg">Weekly</button>
                                <button className="px-6 py-2.5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-300">Monthly</button>
                            </div>
                        </div>

                        <div className="h-64 flex items-end justify-between gap-4 px-4 pb-8 border-b border-white/5 relative">
                            {[110, 145, 85, 160, 125, 195, 155].map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(val / 195) * 100}%` }}
                                        className={`w-full max-w-[40px] rounded-t-xl relative transition-all ${i === 5 ? 'bg-primary' : 'bg-primary/20 group-hover:bg-primary/40'}`}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-background-dark text-[10px] font-black py-1.5 px-3 rounded-lg shadow-xl tracking-tighter transition-all">
                                            ₹{val}
                                        </div>
                                    </motion.div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${i === 5 ? 'text-primary' : 'text-slate-600'}`}>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between gap-6">
                            <h3 className="text-lg font-black uppercase tracking-widest">Transaction History</h3>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                                <input className="bg-background-dark border-none rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold focus:ring-2 focus:ring-primary w-full md:w-80" placeholder="Search by customer..." />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-background-dark/30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <tr>
                                        <th className="px-8 py-5">Date</th>
                                        <th className="px-8 py-5">Customer</th>
                                        <th className="px-8 py-5 text-right">Fare</th>
                                        <th className="px-8 py-5">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.map(row => (
                                        <tr key={row.id} className="hover:bg-white/5 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-white">{row.date}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{row.time}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                        <span className="material-symbols-outlined text-sm">person</span>
                                                    </div>
                                                    <span className="font-bold text-sm">{row.user}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="font-black text-primary text-lg tabular-nums">{row.fare}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${row.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default DriverEarnings;
