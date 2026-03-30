import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, History, User, Settings, LogOut, Heart } from 'lucide-react';
import { clearAuthInfo } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';

const CustomerSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState({ name: '', email: '', profile_picture: null });

    useEffect(() => {
        const email = sessionStorage.getItem('user_email');
        if (!email) return;

        // Fetch User Profile
        authorizedFetch(`${API_BASE_URL}/api/user-profile/?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.email) setUserData(data);
            })
            .catch(console.error);
    }, []);

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/customer/dashboard' },
        { name: 'History', icon: <History size={20} />, path: '/customer/history' },
        { name: 'Profile', icon: <User size={20} />, path: '/customer/profile' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/customer/settings' },
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
            navigate('/');
        }
    };

    return (
        <aside className="w-64 h-screen flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col sticky top-0 left-0 z-50 font-display">
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3">
                <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined font-bold">minor_crash</span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">RideConnect</h1>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => navigate(item.path)}
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
                                layoutId="activeNavCustomer"
                                className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(13,204,242,0.8)]"
                            />
                        )}
                    </button>
                ))}
            </nav>

            {/* Support and User Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Center</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Have questions or need help with a ride?</p>
                    <button className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        Get Help
                    </button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                    <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        {userData.profile_picture ? (
                            <img 
                                src={`${API_BASE_URL}${userData.profile_picture}`} 
                                alt="User" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-700">
                                <User className="size-5 text-slate-400" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-none truncate">
                            {userData.name || 'Member'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 truncate">
                            {userData.email || 'Customer'}
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
        </aside>
    );
};

export default CustomerSidebar;
