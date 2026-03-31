import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BikeFareDetailsModal = ({ isOpen, onClose, fareDetails }) => {
    if (!isOpen) return null;

    const { total_fare, onward_fare, surcharge_amount, base_fare } = fareDetails || {};

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl p-8 overflow-hidden border-t border-slate-100 dark:border-slate-800"
                >
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8 cursor-pointer" onClick={onClose}></div>
                    
                    <div className="space-y-8">
                        {/* Title Section */}
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <span className="material-symbols-outlined text-3xl">motorcycle</span>
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tight dark:text-white uppercase">Bike Fare Details</h2>
                        </div>

                        {/* Total Price Section */}
                        <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Total Estimated fare price</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">including taxes.</p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-slate-900 dark:text-white italic">₹{Math.round(total_fare)}*</span>
                            </div>
                        </div>

                        {/* Breakdown List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Ride Fare</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100 italic font-mono">₹{onward_fare?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Surcharge</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100 italic font-mono">₹{surcharge_amount?.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Info Text */}
                        <div className="space-y-3 pt-2">
                            <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
                                *Price may vary based on final pickup or drop location, time taken, final route and toll area.
                            </p>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-primary">info</span>
                                    {base_fare} Base Fare upto 2 kms, 6 Rs/km upto 6 kms post 6 kms 8Rs/km
                                </p>
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-primary">timer</span>
                                    Waiting charges after 3 mins of captain arrival is ₹1/min
                                </p>
                            </div>
                        </div>

                        {/* Action */}
                        <button 
                            onClick={onClose}
                            className="w-full py-5 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BikeFareDetailsModal;
