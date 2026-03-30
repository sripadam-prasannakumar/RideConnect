import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const GlobalBackButton = ({ className = '', variant = 'default' }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        // Logically, we go back one step in history
        navigate(-1);
    };

    const variants = {
        default: "flex items-center justify-center size-10 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary transition-all shadow-sm",
        primary: "flex items-center justify-center size-10 rounded-xl bg-primary text-background-dark hover:brightness-110 transition-all shadow-lg shadow-primary/20",
        ghost: "flex items-center justify-center size-10 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className={`${variants[variant] || variants.default} ${className}`}
            title="Go Back"
        >
            <span className="material-symbols-outlined font-bold">arrow_back</span>
        </motion.button>
    );
};

export default GlobalBackButton;
