import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, LayoutDashboard, Wallet, History, User, Settings, ShieldCheck, MessageCircle, ChevronRight, X } from 'lucide-react';
import { clearAuthInfo } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import { useUser } from '../../UserContext';
import { getDefaultAvatar } from '../../utils/avatarUtils';
import SupportChat from '../Common/SupportChat';
import LogoBadge from '../Shared/LogoBadge';


const DriverSidebar = ({ onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile } = useUser();
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null);

    useEffect(() => {
        const email = sessionStorage.getItem('user_email');
        if (!email) return;

        // Fetch Verification Status
        authorizedFetch(`${API_BASE_URL}/api/driver/verification-status/?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.verification_status) setVerificationStatus(data.verification_status);
            })
            .catch(console.error);
    }, []);

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/driver/dashboard' },
        { name: 'Earnings', icon: <Wallet size={20} />, path: '/driver/earnings' },
        { name: 'History', icon: <History size={20} />, path: '/driver/history' },
        { name: 'Profile', icon: <User size={20} />, path: '/driver/profile' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/driver/settings' },
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        try {
            await authorizedFetch(`${API_BASE_URL}/api/logout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sessionStorage.getItem('user_email') })
            });
        } catch (err) {
            console.error('Logout API error:', err);
        } finally {
            clearAuthInfo();
            navigate('/login');
        }
    };

    const avatarUrl = userProfile?.profile_image || getDefaultAvatar('driver', userProfile?.email);

    return (
        <aside className="w-64 h-screen flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col sticky top-0 left-0 z-50">
            {/* Logo Section */}
            <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <LogoBadge size="md" />

                {onClose && (
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-primary transition-colors bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => {
                            if (item.name === 'Dashboard') {
                                const activeId = localStorage.getItem('lastActiveRideId');
                                if (activeId) {
                                    navigate('/driver/trip-status', { state: { rideId: activeId } });
                                } else {
                                    navigate(item.path);
                                }
                            } else {
                                navigate(item.path);
                            }
                            if (onClose) onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                            isActive(item.path)
                                ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <div className={`${isActive(item.path) ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'}`}>
                            {item.icon}
                        </div>
                        <span className={`text-sm font-bold uppercase tracking-widest ${isActive(item.path) ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                            {item.name}
                        </span>
                        {isActive(item.path) && (
                            <motion.div 
                                layoutId="activeNav"
                                className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(13,204,242,0.8)]"
                            />
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div 
                    onClick={() => setIsSupportOpen(true)}
                    className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-3 group cursor-pointer hover:bg-primary/10 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                <MessageCircle size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">24x7 Support</p>
                                <p className="text-xs text-slate-900 dark:text-white font-bold">Chat with us</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate('/driver/profile')}>
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                        <img src={avatarUrl} alt="Profile" className="size-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 dark:text-white leading-none truncate uppercase tracking-tight">
                                {userProfile?.full_name || ''}
                            </span>
                            {verificationStatus === 'approved' && (
                                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                            )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 truncate">
                            {userProfile?.email || ''}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    <LogOut size={14} />
                    Logout
                </button>
            </div>
            <SupportChat isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        </aside>
    );
};

export default DriverSidebar;
