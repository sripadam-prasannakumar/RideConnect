import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalBackButton from '../Shared/GlobalBackButton';
import { useUser } from '../../UserContext';
import { getDefaultAvatar } from '../../utils/avatarUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import { getAuthStatus } from '../../utils/authUtils';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Clock, User, ChevronRight, Filter, AlertTriangle, CheckCircle2, QrCode, Building2, CreditCard, Send, DollarSign } from 'lucide-react';

const DriverEarnings = () => {
    const navigate = useNavigate();
    const { userProfile } = useUser();
    const [period, setPeriod] = useState('weekly');
    const [stats, setStats] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [showPayModal, setShowPayModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const fetchEarnings = useCallback(async (selectedPeriod) => {
        setLoading(true);
        const { email } = getAuthStatus();
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/driver/dashboard-stats/?email=${encodeURIComponent(email)}&period=${selectedPeriod}`);
            const data = await res.json();
            if (res.ok) {
                setStats(data);
                setHistory(data.recent_rides || []);
            }

            // Fetch wallet details
            const wallRes = await authorizedFetch(`${API_BASE_URL}/api/driver/wallet/`);
            const wallData = await wallRes.json();
            if (wallRes.ok) {
                setWallet(wallData);
                setPaymentAmount(wallData.pending_commission);
            }
        } catch (e) {
            console.error('Error fetching earnings:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEarnings(period);
    }, [period, fetchEarnings]);

    const handlePayCommission = async () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
        setIsPaying(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/driver/pay-commission/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: paymentAmount })
            });
            if (res.ok) {
                setPaymentSuccess(true);
                setTimeout(() => {
                    setShowPayModal(false);
                    setPaymentSuccess(false);
                    fetchEarnings(period);
                }, 2000);
            } else {
                const data = await res.json();
                alert(data.error || 'Payment failed');
            }
        } catch (e) {
            alert('Failed to process payment');
        } finally {
            setIsPaying(false);
        }
    };

    const statCards = [
        { label: 'Gross Revenue', value: stats?.gross_earnings || '0.00', icon: <ArrowUpRight className="text-emerald-400" />, sub: 'Total fare collected' },
        { label: 'Net Take-home', value: wallet?.net_balance || '0.00', icon: <TrendingUp className="text-primary" />, sub: 'After commissions', highlight: true },
        { label: 'Pending Comm.', value: wallet?.pending_commission || '0.00', icon: <ArrowDownRight className={parseFloat(wallet?.pending_commission) > 0 ? "text-rose-400" : "text-emerald-400"} />, sub: 'Payable to admin' },
        { label: 'Total Trips', value: stats?.total_trips || '0', icon: <Clock className="text-amber-400" />, sub: 'Completed rides' }
    ];

    return (
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-slate-50 dark:bg-background-dark">
            <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
                {/* Alert for Pending Commission */}
                {wallet?.is_restricted && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-4 text-rose-500 shadow-lg shadow-rose-500/5"
                    >
                        <div className="shrink-0 p-2 bg-rose-500 text-white rounded-xl">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black uppercase tracking-widest italic">Account Restricted</h4>
                            <p className="text-[10px] font-bold uppercase mt-0.5 opacity-80">Pending commission (₹{wallet.pending_commission}) exceeds limit (₹{wallet.limit}). Pay now to accept new rides.</p>
                        </div>
                        <button 
                            onClick={() => setShowPayModal(true)}
                            className="px-6 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                            Settle Now
                        </button>
                    </motion.div>
                )}

                <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-200 dark:border-slate-800" />
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                            <Wallet className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight uppercase italic underline decoration-primary decoration-4 underline-offset-8">Earnings Hub</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Real-time wallet & commission monitoring</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {['daily', 'weekly', 'monthly'].map(p => (
                                <button 
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border ${stat.highlight ? 'border-primary shadow-[0_0_30px_rgba(13,204,242,0.15)] bg-primary/5' : 'border-slate-200 dark:border-slate-800 shadow-sm'} group relative overflow-hidden`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-slate-500 font-black uppercase tracking-widest text-[9px]">{stat.label}</div>
                                <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className={`text-3xl font-black italic tracking-tighter ${stat.highlight ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                    {typeof stat.value === 'string' && (stat.value.includes('.') || !isNaN(stat.value)) ? `₹${Number(stat.value).toLocaleString(undefined, {minimumFractionDigits: 2})}` : stat.value}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Earnings Insight Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Transaction History */}
                         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                     <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                          <Clock className="size-5" />
                                     </div>
                                     <h3 className="text-sm font-black uppercase tracking-widest italic">Settlement History</h3>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-8 py-5">Ride Session</th>
                                            <th className="px-8 py-5">Customer</th>
                                            <th className="px-8 py-5 text-right">Gross Fare</th>
                                            <th className="px-8 py-5 text-right text-rose-500">Comm (8%)</th>
                                            <th className="px-8 py-5 text-right text-primary">Net Earning</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {history.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    No recent earnings found
                                                </td>
                                            </tr>
                                        ) : (
                                            history.map(row => (
                                                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-sm text-slate-900 dark:text-white italic tracking-tighter">#RC{row.id}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(row.time).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                                <User className="size-4" />
                                                            </div>
                                                            <span className="font-black text-[11px] uppercase italic tracking-widest">{row.user}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="font-black text-slate-900 dark:text-white text-sm tabular-nums">₹{row.amount}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="font-black text-rose-500 text-xs tabular-nums">-₹{(parseFloat(row.amount) * 0.08).toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="font-black text-primary text-base tabular-nums italic tracking-tighter">₹{(parseFloat(row.amount) * 0.92).toFixed(2)}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                         {/* Payment History (Commission to Admin) */}
                         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                     <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                          <ArrowDownRight className="size-5" />
                                     </div>
                                     <h3 className="text-sm font-black uppercase tracking-widest italic">Commission Payments</h3>
                                </div>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-8 py-5">Date</th>
                                            <th className="px-8 py-5">Amount</th>
                                            <th className="px-8 py-5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {!wallet?.payment_history || wallet.payment_history.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    No commission payments recorded
                                                </td>
                                            </tr>
                                        ) : (
                                            wallet.payment_history.map(row => (
                                                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                                                    <td className="px-8 py-6">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(row.date).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="font-black text-rose-500 text-sm tabular-nums">₹{parseFloat(row.amount).toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">{row.status}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                         {/* Settlement Wallet */}
                         <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full -mr-24 -mt-24 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                              <div className="relative">
                                   <div className="flex items-center justify-between mb-8">
                                        <div className="p-3 rounded-2xl bg-white/10 text-primary">
                                            <TrendingUp className="size-6 shadow-[0_0_15px_rgba(13,204,242,0.8)]" />
                                        </div>
                                        <div className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                                            Commission Due
                                        </div>
                                   </div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending to Admin</p>
                                   <h4 className="text-4xl font-black italic tracking-tighter text-white mb-8">₹{wallet?.pending_commission || '0.00'}</h4>
                                   
                                   <button 
                                        onClick={() => setShowPayModal(true)}
                                        className="w-full py-4 bg-primary text-background-dark rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                                   >
                                        Settle Commission
                                        <Send className="size-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                   </button>
                              </div>
                         </div>

                         {/* Admin Bank Details */}
                         <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Building2 size={16} />
                                    </div>
                                    <h5 className="text-[11px] font-black uppercase tracking-widest italic outline-none">Admin Bank Details</h5>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                        <span className="text-[9px] font-black uppercase text-slate-400">Account Holder</span>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{wallet?.admin_bank_details?.account_holder || "RideConnect Admin"}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl font-mono">
                                        <span className="text-[9px] font-black uppercase text-slate-400 font-sans">A/C Number</span>
                                        <span className="text-[10px] font-black tracking-widest">{wallet?.admin_bank_details?.account_number || "XXXXXXXXXXXX"}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl font-mono">
                                        <span className="text-[9px] font-black uppercase text-slate-400 font-sans">IFSC Code</span>
                                        <span className="text-[10px] font-black tracking-widest">{wallet?.admin_bank_details?.ifsc || "IFSCXXXXXX"}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-primary/10 p-4 rounded-2xl border border-primary/20">
                                        <div className="flex items-center gap-2 text-primary font-black uppercase text-[9px]">
                                            <QrCode size={14} />
                                            UPI ID
                                        </div>
                                        <span className="text-[10px] font-black text-primary italic lowercase tracking-tight">{wallet?.admin_bank_details?.upi_id || "admin@rideconnect"}</span>
                                    </div>
                                </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Pay Modal */}
            <AnimatePresence>
                {showPayModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                                        <DollarSign size={20} />
                                    </div>
                                    <h3 className="text-lg font-black uppercase italic tracking-widest outline-none">Mark as Paid</h3>
                                </div>
                                <button onClick={() => setShowPayModal(false)} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors">
                                    <Clock className="rotate-45" size={16} />
                                </button>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                {paymentSuccess ? (
                                    <div className="py-10 flex flex-col items-center justify-center gap-4 text-center">
                                        <div className="size-20 bg-emerald-500 text-white rounded-full flex items-center justify-center animate-bounce">
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase italic text-emerald-500">Payment Recorded</h4>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Your pending commission has been updated.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/5">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Instructions</p>
                                            <ol className="space-y-3 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase leading-relaxed">
                                                <li className="flex gap-2"><span className="text-primary tracking-tighter font-mono">01.</span> Transfer the amount via UPI to <span className="text-primary italic lowercase tracking-tight">{wallet?.admin_bank_details?.upi_id}</span></li>
                                                <li className="flex gap-2"><span className="text-primary tracking-tighter font-mono">02.</span> Once done, enter the amount below</li>
                                                <li className="flex gap-2"><span className="text-primary tracking-tighter font-mono">03.</span> Click "Confirm Payment" to update your wallet</li>
                                            </ol>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Payment Amount (₹)</label>
                                            <div className="relative group">
                                                <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                                <input 
                                                    type="number"
                                                    value={paymentAmount}
                                                    onChange={e => setPaymentAmount(e.target.value)}
                                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl pl-16 pr-6 py-5 text-xl font-black italic tracking-tighter focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase ml-4 italic">Max payable: ₹{wallet?.pending_commission}</p>
                                        </div>

                                        <button 
                                            onClick={handlePayCommission}
                                            disabled={isPaying || !paymentAmount}
                                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl transition-all ${isPaying ? 'bg-slate-200 cursor-wait' : 'bg-primary text-background-dark hover:scale-[1.02] active:scale-95 shadow-primary/20 font-black'}`}
                                        >
                                            {isPaying ? 'Processing...' : 'Confirm Payment'}
                                            {!isPaying && <Send size={16} className="group-hover:translate-x-1 transition-transform" />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
};

export default DriverEarnings;
