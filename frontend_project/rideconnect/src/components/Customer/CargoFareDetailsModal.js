import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Truck, Package, Clock, ShieldCheck, Moon, Zap } from 'lucide-react';

const CargoFareDetailsModal = ({ isOpen, onClose, fareDetails }) => {
    if (!fareDetails) return null;

    const details = [
        { 
            label: 'Trip Fare (Base + Dist)', 
            value: `₹${(fareDetails.onward_fare || 0).toFixed(2)}`, 
            icon: <Truck className="size-4" />,
            desc: `Incl. ${fareDetails.base_fare ? '₹' + fareDetails.base_fare + ' base' : 'minimum charge'}`
        },
        { 
            label: 'Load Type Charge', 
            value: `₹${(fareDetails.load_charge || 0).toFixed(2)}`, 
            icon: <Package className="size-4" />,
            desc: fareDetails.load_charge > 0 ? 'Handling & Loading' : 'Standard Handling'
        },
        { 
            label: 'Waiting Charges', 
            value: `₹${(fareDetails.waiting_charge || 0).toFixed(2)}`, 
            icon: <Clock className="size-4" />,
            desc: `₹3/min (${fareDetails.waiting_time || 0} mins)`
        },
        { 
            label: 'Night Charges', 
            value: `₹${(fareDetails.night_charge || 0).toFixed(2)}`, 
            icon: <Moon className="size-4" />,
            desc: fareDetails.night_charge > 0 ? '10 PM - 6 AM (15%)' : 'Day Trip'
        },
        { 
            label: 'Surge Charges', 
            value: `₹${(fareDetails.surcharge_amount || 0).toFixed(2)}`, 
            icon: <Zap className="size-4" />,
            desc: 'Demand Pricing'
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="bg-emerald-500 p-8 text-white relative">
                            <div className="absolute top-6 right-6">
                                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="size-6" />
                                </button>
                            </div>
                            <div className="size-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                <Truck className="size-8" />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight">Cargo Fare Details</h3>
                            <p className="text-emerald-100 text-sm font-medium mt-1">Premium Goods Transport Pricing</p>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                {details.map((item, index) => (
                                    <div key={index} className="flex items-start justify-between group">
                                        <div className="flex gap-4">
                                            <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{item.label}</p>
                                                <p className="text-[10px] text-slate-500 font-medium italic">{item.desc}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Total Section */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-1">Total Estimated Fare</p>
                                        <p className="text-xs text-slate-500 italic">Inclusive of all taxes & charges</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-slate-900 dark:text-white">₹{fareDetails.total_fare}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Guarantee Footer */}
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                                <ShieldCheck className="size-5 text-emerald-500" />
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Safe & Insured Cargo Protection Included</p>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="px-8 pb-8">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:brightness-110 transition-all uppercase tracking-widest text-sm"
                            >
                                Got It
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CargoFareDetailsModal;
