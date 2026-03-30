import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, Zap, ArrowRight, X } from 'lucide-react';

const SurgeSelectionModal = ({ isOpen, onClose, onSelect, baseFare }) => {
    const surgeOptions = [
        { amount: 20, label: 'Standard', description: 'Small boost to attract nearby drivers' },
        { amount: 40, label: 'Priority', description: 'Recommended for faster matching' },
        { amount: 60, label: 'Express', description: 'Highest priority for urgent rides' },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800"
                >
                    <div className="relative p-6 sm:p-8">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4 pt-4 sm:pt-0">
                            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                                <Zap className="w-8 h-8 fill-primary" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                                Increase Your Fare
                            </h2>
                            <p className="text-slate-500 text-sm max-w-[300px]">
                                No drivers are currently available at the base price. Adding a small tip can help you get a ride faster.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mt-8">
                            {surgeOptions.map((option) => (
                                <motion.button
                                    key={option.amount}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelect(option.amount)}
                                    className="group flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-all text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-slate-700 font-black text-lg">
                                            +{option.amount}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{option.label}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{option.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">New Total</p>
                                            <p className="font-black text-primary italic">₹{parseFloat(baseFare) + option.amount}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold uppercase tracking-widest text-xs transition-colors"
                            >
                                Continue waiting with base fare
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SurgeSelectionModal;
