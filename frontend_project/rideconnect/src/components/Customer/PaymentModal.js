import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, CheckCircle, X, ExternalLink, QrCode, ArrowRight, ShieldCheck, Wallet } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import { authorizedFetch } from '../../utils/apiUtils';
import QRCodeComponent from '../Shared/QRCodeComponent';

const PaymentModal = ({ isOpen, onClose, ride, onPaymentSuccess }) => {
    const [method, setMethod] = useState('upi'); // 'upi' or 'cash'
    const [step, setStep] = useState('select'); // 'select', 'process', 'success'
    const [loading, setLoading] = useState(false);

    const totalAmount = ride?.total_fare || ride?.estimated_fare || 0;

    const handleMethodSelect = async () => {
        setLoading(true);
        const res = await authorizedFetch(`${API_BASE_URL}/api/payment/method/`, {
            method: 'POST',
            body: JSON.stringify({ ride_id: ride.id, method: method })
        });
        if (res.ok) {
            setStep('process');
        }
        setLoading(false);
    };

    const handleUPISuccess = async () => {
        setLoading(true);
        const res = await authorizedFetch(`${API_BASE_URL}/api/payment/complete/`, {
            method: 'POST',
            body: JSON.stringify({ ride_id: ride.id })
        });
        if (res.ok) {
            setStep('success');
            setLoading(false);
            setTimeout(() => {
                onPaymentSuccess();
            }, 3000);
        } else {
            setLoading(false);
        }
    };

    const isPaid = ride?.paymentStatus === 'SUCCESS' || ride?.paymentStatus === 'completed' || ride?.status === 'paid';

    useEffect(() => {
        if (isPaid) {
            setStep('success');
        } else if (ride?.payment_method && step === 'select') {
            setMethod(ride.payment_method);
            setStep('process');
        }
    }, [isPaid, ride?.payment_method, step]);

    if (!isOpen || !ride) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background-dark/90 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Secure Payment</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Transaction ID: #RC-{ride.id}</p>
                    </div>
                    {step !== 'success' && (
                        <button 
                            onClick={onClose}
                            className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="p-8 space-y-8">
                    {step === 'select' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                             {/* Fare Summary */}
                             <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Total Payable</p>
                                    <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹{totalAmount}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Distance</p>
                                    <p className="font-black text-slate-900 dark:text-white">{ride.distance} KM</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Payment Method</p>
                                
                                <button 
                                    onClick={() => setMethod('upi')}
                                    className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${method === 'upi' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${method === 'upi' ? 'bg-primary text-background-dark' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                                            <QrCode size={28} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-slate-900 dark:text-white">UPI & QR Code</p>
                                            <p className="text-xs text-slate-500 font-bold">Fast & Contactless Payment</p>
                                        </div>
                                    </div>
                                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${method === 'upi' ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-700'}`}>
                                        {method === 'upi' && <div className="size-2 rounded-full bg-background-dark" />}
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setMethod('cash')}
                                    className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${method === 'cash' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${method === 'cash' ? 'bg-primary text-background-dark' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                                            <Wallet size={28} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-slate-900 dark:text-white">Cash</p>
                                            <p className="text-xs text-slate-500 font-bold">Pay directly to driver</p>
                                        </div>
                                    </div>
                                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${method === 'cash' ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-700'}`}>
                                        {method === 'cash' && <div className="size-2 rounded-full bg-background-dark" />}
                                    </div>
                                </button>
                            </div>

                            <button 
                                onClick={handleMethodSelect}
                                disabled={loading}
                                className={`w-full py-5 bg-primary text-background-dark font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Processing...' : `Continue with ${method === 'upi' ? 'UPI' : 'Cash'}`}
                                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    )}

                    {step === 'process' && method === 'upi' && (
                        <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500">
                             <div className="text-center space-y-2">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white">Scan to Pay Driver</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Amount: ₹{totalAmount}</p>
                            </div>

                            <div className="relative group">
                                <QRCodeComponent 
                                    value={`upi://pay?pa=${ride.driver?.upi_id || 'rideconnect@upi'}&pn=${encodeURIComponent(ride.driver?.name || 'RideConnect Driver')}&am=${totalAmount}&cu=INR`}
                                    label="Scan to Pay"
                                    subLabel={`UPI ID: ${ride.driver?.upi_id || 'rideconnect@upi'}`}
                                    size={220}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                 <button 
                                    onClick={() => setStep('select')}
                                    className="py-4 border-2 border-slate-100 dark:border-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                 >
                                    <ArrowRight size={14} className="rotate-180" /> Change Method
                                 </button>
                                 <button 
                                    onClick={handleUPISuccess}
                                    disabled={loading}
                                    className="py-4 bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                 >
                                    {loading ? 'Confirming...' : 'I Have Paid'} <CheckCircle size={14} />
                                 </button>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400">
                                <ShieldCheck size={16} />
                                <p className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted Secure UPI Transaction</p>
                            </div>
                        </div>
                    )}

                    {step === 'process' && method === 'cash' && (
                        <div className="flex flex-col items-center justify-center gap-8 py-10 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="size-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-primary">
                                    <Wallet size={32} className="animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white">Please pay cash to driver</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Amount to pay: ₹{totalAmount}</p>
                                <p className="text-[10px] text-slate-400 mt-4">Waiting for driver to confirm payment...</p>
                            </div>

                            <button 
                                onClick={() => setStep('select')}
                                className="py-4 px-6 border-2 border-slate-100 dark:border-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <ArrowRight size={14} className="rotate-180" /> Change Method
                            </button>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center gap-8 py-10 animate-in zoom-in-95 duration-700">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="size-32 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40"
                            >
                                <CheckCircle size={64} className="animate-in fade-in zoom-in-50 duration-500" />
                            </motion.div>
                            <div className="text-center space-y-3">
                                <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Payment Done!</h4>
                                <p className="text-sm text-slate-500 font-medium">₹{totalAmount} paid successfully to {ride.driver?.name || 'Driver'}.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl w-full flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                         <ShieldCheck size={20} className="text-emerald-500" />
                                    </div>
                                    <div>
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Status</p>
                                         <p className="text-sm font-black text-emerald-500 uppercase">Confirmed ✓</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-primary transition-colors">
                                    <ExternalLink size={20} />
                                </button>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-full py-5 bg-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Done & Return
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Security Badge */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 opacity-50 contrast-0 grayscale dark:invert" />
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-40 grayscale" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3 opacity-40 grayscale" />
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
                    <p className="text-[9px] font-black uppercase text-slate-400">PCI-DSS Compliant</p>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentModal;
