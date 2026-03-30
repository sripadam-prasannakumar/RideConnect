import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../ThemeContext';
import { Sun, Moon, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';

const Settings = () => {
    const { mode, color, updateTheme, themeOptions } = useTheme();
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
            <motion.div 
                className="max-w-4xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft size={24} style={{ color: 'var(--color-text)' }} />
                        </button>
                        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Settings</h1>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar/Navigation Links Placeholder */}
                    <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary font-semibold" 
                             style={{ backgroundColor: 'var(--color-primary)20', color: 'var(--color-primary)' }}>
                            Appearance
                        </div>
                        <div className="p-3 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-not-allowed">
                            Account Security
                        </div>
                        <div className="p-3 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-not-allowed">
                            Notifications
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-12">
                        {/* Theme Mode Section */}
                        <section>
                            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>Theme Mode</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {['light', 'dark'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => updateTheme(m, color)}
                                        className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4 ${
                                            mode === m 
                                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                                            : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-gray-700'
                                        }`}
                                        style={{ 
                                            borderColor: mode === m ? 'var(--color-primary)' : 'transparent',
                                            backgroundColor: mode === m ? 'var(--color-primary)10' : ''
                                        }}
                                    >
                                        {m === 'light' ? <Sun size={32} /> : <Moon size={32} />}
                                        <span className="font-medium capitalize" style={{ color: 'var(--color-text)' }}>{m} Mode</span>
                                        {mode === m && (
                                            <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full"
                                                 style={{ backgroundColor: 'var(--color-primary)' }}>
                                                <Check size={12} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Color Variations Section */}
                        <section>
                            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>Accent Color</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {themeOptions[mode].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => updateTheme(mode, option.id)}
                                        className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${
                                            color === option.id 
                                            ? 'border-primary bg-primary/5' 
                                            : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-gray-700'
                                        }`}
                                        style={{ 
                                            borderColor: color === option.id ? 'var(--color-primary)' : 'transparent',
                                            backgroundColor: color === option.id ? 'var(--color-primary)10' : ''
                                        }}
                                    >
                                        <div 
                                            className="w-12 h-12 rounded-full shadow-lg transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: option.primary }}
                                        />
                                        <span className="text-sm font-medium text-center" style={{ color: 'var(--color-text)' }}>
                                            {option.name}
                                        </span>
                                        {color === option.id && (
                                            <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full"
                                                 style={{ backgroundColor: 'var(--color-primary)' }}>
                                                <Check size={12} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Preview Section */}
                        <section className="p-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-black/20 backdrop-blur-xl">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-6">Theme Preview</h2>
                            <div className="space-y-4">
                                <div className="h-12 w-full rounded-xl bg-primary/20 flex items-center px-4"
                                     style={{ backgroundColor: 'var(--color-primary)33' }}>
                                    <div className="h-4 w-32 rounded-full bg-primary" style={{ backgroundColor: 'var(--color-primary)' }} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                                    ))}
                                </div>
                                <button className="w-full py-3 rounded-xl font-bold bg-primary text-white"
                                        style={{ backgroundColor: 'var(--color-primary)' }}>
                                    Example Button
                                </button>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="p-8 rounded-3xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl">
                            <h2 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">warning</span>
                                Danger Zone
                            </h2>
                            <p className="text-xs text-slate-500 font-bold mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                            <button 
                                onClick={() => {
                                    if(window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
                                        const email = sessionStorage.getItem('user_email');
                                        authorizedFetch(`${API_BASE_URL}/api/user/delete/`, {
                                            method: 'DELETE',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email })
                                        })
                                        .then(res => {
                                            if(res.ok) {
                                                sessionStorage.clear();
                                                navigate('/login');
                                            } else {
                                                alert('Failed to delete account');
                                            }
                                        })
                                        .catch(err => {
                                            console.error(err);
                                            alert('An error occurred');
                                        });
                                    }
                                }}
                                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Delete My Account
                            </button>
                        </section>
                    </div>
                </div>
            </motion.div>
        </main>
    );
};

export default Settings;
