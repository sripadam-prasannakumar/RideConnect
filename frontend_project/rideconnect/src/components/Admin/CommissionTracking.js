import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, User, ShieldCheck, Search, Download, Receipt, Wallet, AlertCircle, ArrowUpRight, Clock, ChevronRight } from 'lucide-react';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import GlobalBackButton from '../Shared/GlobalBackButton';
import { useNavigate } from 'react-router-dom';

const CommissionTracking = () => {
    const navigate = useNavigate();
    const [rides, setRides] = useState([]);
    const [driverCommissions, setDriverCommissions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('rides'); // 'rides' or 'drivers'

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [ridesRes, driversRes, statsRes] = await Promise.all([
                    authorizedFetch(`${API_BASE_URL}/api/admin/commissions/`),
                    authorizedFetch(`${API_BASE_URL}/api/admin/driver-commissions/`),
                    authorizedFetch(`${API_BASE_URL}/api/admin/stats/`)
                ]);

                const [ridesData, driversData, statsData] = await Promise.all([
                    ridesRes.json(),
                    driversRes.json(),
                    statsRes.json()
                ]);

                setRides(Array.isArray(ridesData) ? ridesData : []);
                setDriverCommissions(Array.isArray(driversData) ? driversData : []);
                setStats(statsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredRides = rides.filter(ride => 
        ride.id.toString().includes(searchTerm) || 
        ride.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDrivers = driverCommissions.filter(d => 
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-900">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 bg-slate-900 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                        <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-700" />
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <TrendingUp className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight uppercase italic underline decoration-primary decoration-4 underline-offset-8">Commission Hub</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Global Revenue & Driver Settlements</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <div className="relative w-full sm:flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-5" />
                            <input 
                                className="w-full bg-background-dark border-none rounded-2xl pl-12 pr-6 py-4 text-xs font-bold focus:ring-2 focus:ring-primary h-14" 
                                placeholder={activeTab === 'rides' ? "Search Ride ID or Driver..." : "Search Driver name or email..."}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: 'Total Commission Paid', value: stats?.total_commission_earned || 0, icon: <TrendingUp className="size-5" />, color: 'emerald', sub: 'Already settled by drivers' },
                        { label: 'Pending Commission', value: stats?.total_commission_pending || 0, icon: <AlertCircle className="size-5" />, color: 'rose', sub: 'Balance in driver wallets' },
                        { label: 'Platform Revenue', value: stats?.platform_revenue || 0, icon: <DollarSign className="size-5" />, color: 'primary', sub: 'Actual cash received' }
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:border-primary/50 transition-all shadow-2xl text-white"
                        >
                            <div className="flex flex-col gap-4 relative text-white">
                                <div className="flex items-center justify-between">
                                    <div className={`size-12 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500 flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        {stat.icon}
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase text-slate-500">Live</div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    <h3 className="text-3xl font-black italic tracking-tighter mt-2 text-white">₹{Number(stat.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{stat.sub}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 w-fit">
                    <button 
                        onClick={() => { setActiveTab('rides'); setSearchTerm(''); }}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rides' ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Ride Settlements
                    </button>
                    <button 
                        onClick={() => { setActiveTab('drivers'); setSearchTerm(''); }}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'drivers' ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Driver Balances
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
                    <div className="p-8 border-b border-white/10 bg-background-dark/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Receipt className="size-5 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-widest italic text-white">{activeTab === 'rides' ? 'Live Settlements' : 'Driver Receivables'}</h3>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl">
                            <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Feed</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-background-dark/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                {activeTab === 'rides' ? (
                                    <tr>
                                        <th className="px-10 py-6">Ride Session</th>
                                        <th className="px-10 py-6">Participants</th>
                                        <th className="px-10 py-6 text-right">Total Fare</th>
                                        <th className="px-10 py-6 text-right text-emerald-500">Commission (8%)</th>
                                        <th className="px-10 py-6 text-right">Net Driver</th>
                                        <th className="px-10 py-6">Payment</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-10 py-6">Driver Info</th>
                                        <th className="px-10 py-6 text-right">Total Gross</th>
                                        <th className="px-10 py-6 text-right text-emerald-500">Commission Paid</th>
                                        <th className="px-10 py-6 text-right text-rose-500">Pending Dues</th>
                                        <th className="px-10 py-6">Status</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activeTab === 'rides' ? (
                                    filteredRides.length === 0 ? (
                                        <tr><td colSpan="6" className="py-20 text-center text-slate-500 uppercase font-black text-[10px] tracking-widest">No settlements found</td></tr>
                                    ) : (
                                        filteredRides.map((ride, idx) => (
                                            <tr key={ride.id} className="hover:bg-white/5 transition-all group">
                                                <td className="px-10 py-8">
                                                    <span className="text-xs font-black font-mono text-primary italic">#RC{ride.id}</span>
                                                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">{new Date(ride.created_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-1.5 rounded-full bg-primary shrink-0"></div>
                                                            <span className="text-xs font-black italic uppercase tracking-tighter text-white">{ride.driver_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-1.5 rounded-full bg-slate-600 shrink-0"></div>
                                                            <span className="text-[10px] font-bold text-slate-400 capitalize">{ride.customer_name}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right font-black italic tracking-tighter text-sm text-white">₹{Number(ride.total_fare).toLocaleString()}</td>
                                                <td className="px-10 py-8 text-right font-black italic tracking-tighter text-sm text-emerald-500">₹{Number(ride.commission_amount).toLocaleString()}</td>
                                                <td className="px-10 py-8 text-right font-black italic tracking-tighter text-sm text-primary">₹{Number(ride.driver_amount).toLocaleString()}</td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${ride.paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                        {ride.paymentStatus?.toUpperCase() || 'PAID'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    filteredDrivers.length === 0 ? (
                                        <tr><td colSpan="5" className="py-20 text-center text-slate-500 uppercase font-black text-[10px] tracking-widest">No drivers found</td></tr>
                                    ) : (
                                        filteredDrivers.map((driver, idx) => (
                                            <tr key={driver.id} className="hover:bg-white/5 transition-all group text-white">
                                                <td className="px-10 py-8">
                                                    <span className="text-xs font-black italic uppercase tracking-tighter text-white">{driver.name}</span>
                                                    <p className="text-[9px] text-slate-500 font-bold mt-1 lowercase">{driver.email}</p>
                                                </td>
                                                <td className="px-10 py-8 text-right font-black italic tracking-tighter text-sm text-white">₹{Number(driver.total_earned).toLocaleString()}</td>
                                                <td className="px-10 py-8 text-right font-black italic tracking-tighter text-sm text-emerald-500">₹{Number(driver.total_paid).toLocaleString()}</td>
                                                <td className="px-10 py-8 text-right font-black italic tracking-tighter text-sm text-rose-500">₹{Number(driver.pending_commission).toLocaleString()}</td>
                                                <td className="px-10 py-8">
                                                    {driver.pending_commission >= (stats?.commission_limit || 500) ? (
                                                        <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-rose-500">
                                                            <AlertCircle className="size-3" />
                                                            Blocked
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                                            <ShieldCheck className="size-3" />
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-primary/5 border border-dashed border-primary/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <ShieldCheck />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase italic tracking-widest text-white">Automated Collection System</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Drivers are restricted from taking new rides if pending commission exceeds the set limit.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/platform-settings')}
                        className="px-8 py-4 bg-primary text-background-dark rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Adjust Limits
                    </button>
                </div>
            </div>
        </main>
    );
};

export default CommissionTracking;
