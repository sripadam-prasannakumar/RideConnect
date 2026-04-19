import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthStatus, clearAuthInfo } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';

const TABS = [
    { id: 'overview',      label: 'Overview',      icon: 'dashboard' },
    { id: 'users',         label: 'Users',          icon: 'manage_accounts' },
    { id: 'bookings',      label: 'Bookings',       icon: 'local_taxi' },
    { id: 'active_drivers',label: 'Active Drivers', icon: 'directions_car' },
    { id: 'verification',  label: 'Verification',   icon: 'verified_user' },
    { id: 'platform_settings', label: 'Platform Settings', icon: 'settings' },
    { id: 'commissions',   label: 'Commission Ledger', icon: 'payments' },
];

const StatusPill = ({ status }) => {
    const map = {
        'Online':   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'Offline':  'bg-slate-500/20 text-slate-400 border-slate-500/30',
        'pending':  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'verified': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
        'accepted': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'completed':'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'cancelled':'bg-red-500/20 text-red-400 border-red-500/30',
        'ongoing':  'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${map[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
            {status}
        </span>
    );
};

const StatCard = ({ title, value, icon, color, loading }) => {
    const colorMap = {
        primary: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        blue:    'text-blue-400 bg-blue-500/10 border-blue-500/30',
        amber:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        red:     'text-red-400 bg-red-500/10 border-red-500/30',
    };
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
            <div className={`size-12 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-black tracking-widest mb-1">{title}</p>
                {loading
                    ? <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700/50 animate-pulse rounded-lg mt-1" />
                    : <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{value ?? '0'}</p>
                }
            </div>
        </motion.div>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { isAuthenticated, email: userEmail, role: userRole, name: userName } = getAuthStatus();

    const [isSidebarOpen, setIsSidebarOpen]       = useState(false);
    const [activeTab, setActiveTab]               = useState('overview');
    const [stats, setStats]                       = useState(null);
    const [users, setUsers]                       = useState([]);
    const [activeDrivers, setActiveDrivers]       = useState([]);
    const [bookings, setBookings]                 = useState([]);
    const [verifications, setVerifications]       = useState([]);
    const [statsLoading, setStatsLoading]         = useState(false);
    const [usersLoading, setUsersLoading]         = useState(false);
    const [activeDriversLoading, setActiveDriversLoading] = useState(false);
    const [bookingsLoading, setBookingsLoading]   = useState(false);
    const [verifyLoading, setVerifyLoading]       = useState(false);
    const [processingId, setProcessingId]         = useState(null);
    const [userRoleFilter, setUserRoleFilter]     = useState('all');
    const [userSearch, setUserSearch]             = useState('');
    const [activeDriverSearch, setActiveDriverSearch] = useState('');
    const [bookingSearch, setBookingSearch]       = useState('');
    const [verificationSearch, setVerificationSearch] = useState('');
    const [toastMsg, setToastMsg]                 = useState('');
    const [deleteTarget, setDeleteTarget]         = useState(null); // { id, name } of user to delete
    const [selectedImage, setSelectedImage]       = useState(null);
    const [zoomScale, setZoomScale]               = useState(1);

    useEffect(() => { setZoomScale(1); }, [selectedImage]);

    useEffect(() => {
        if (!isAuthenticated || userRole !== 'admin') {
            navigate('/login?role=admin');
        }
    }, [isAuthenticated, userRole, navigate]);

    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3500); };

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/stats/`);
            if (res.ok) {
                setStats(await res.json());
            } else if (res.status === 401) {
                console.warn("Admin stats unauthorized - session may be expired");
            }
        } catch (e) { 
            console.error("Failed to fetch admin stats:", e); 
        }
        finally { setStatsLoading(false); }
    }, []);

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/users/?role=${userRoleFilter}`);
            if (res.ok) setUsers(await res.json());
            else if (res.status === 401) {
                console.warn("Unauthorized access - redirecting to login");
                clearAuthInfo();
                navigate('/login?role=admin');
            }
        } catch (e) { console.error(e); }
        finally { setUsersLoading(false); }
    }, [userRoleFilter]);

    const fetchActiveDrivers = useCallback(async () => {
        setActiveDriversLoading(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/active-drivers/`);
            if (res.ok) setActiveDrivers(await res.json());
        } catch (e) { console.error(e); }
        finally { setActiveDriversLoading(false); }
    }, []);

    const fetchBookings = useCallback(async () => {
        setBookingsLoading(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/bookings/`);
            if (res.ok) setBookings(await res.json());
        } catch (e) { console.error(e); }
        finally { setBookingsLoading(false); }
    }, []);

    const fetchVerifications = useCallback(async () => {
        setVerifyLoading(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/verification-requests/`);
            if (res.ok) setVerifications(await res.json());
        } catch (e) { console.error(e); }
        finally { setVerifyLoading(false); }
    }, []);

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchStats();
            fetchBookings();
            const interval = setInterval(() => { fetchStats(); fetchBookings(); }, 5000); // 5s for overview
            return () => clearInterval(interval);
        }
        if (activeTab === 'users') {
            fetchUsers();
            const interval = setInterval(fetchUsers, 10000); // 10s for users
            return () => clearInterval(interval);
        }
        if (activeTab === 'active_drivers') {
            fetchActiveDrivers();
            const interval = setInterval(fetchActiveDrivers, 5000); // 5s for active drivers
            return () => clearInterval(interval);
        }
        if (activeTab === 'bookings') {
            fetchBookings();
            const interval = setInterval(fetchBookings, 8000); // 8s for bookings
            return () => clearInterval(interval);
        }
        if (activeTab === 'verification') {
            fetchVerifications();
            const interval = setInterval(fetchVerifications, 15000); // 15s for verification
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchStats, fetchUsers, fetchActiveDrivers, fetchBookings, fetchVerifications]);

    useEffect(() => { if (activeTab === 'users') fetchUsers(); }, [userRoleFilter]);

    const handleToggleBlock = async (userId) => {
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await res.json();
            if (res.ok) { showToast(data.message); fetchUsers(); }
            else showToast(data.error || 'Error');
        } catch { showToast('Network error'); }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/users/`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: deleteTarget.id })
            });
            const data = await res.json();
            if (res.ok) { showToast(data.message); fetchUsers(); }
            else showToast(data.error || 'Delete failed');
        } catch { showToast('Network error'); }
        finally { setDeleteTarget(null); }
    };


    const handleVerifyAction = async (driverId, action) => {
        if (processingId) return;
        setProcessingId(driverId);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/verify-action/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driver_id: driverId, action })
            });
            const data = await res.json();
            if (res.ok) { showToast(data.message); fetchVerifications(); }
            else showToast(data.error || 'Action failed');
        } catch { showToast('Network error'); }
        finally { setProcessingId(null); }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredActiveDrivers = activeDrivers.filter(d =>
        d.name?.toLowerCase().includes(activeDriverSearch.toLowerCase()) ||
        d.email?.toLowerCase().includes(activeDriverSearch.toLowerCase()) ||
        d.phone?.toLowerCase().includes(activeDriverSearch.toLowerCase())
    );

    const filteredBookings = (Array.isArray(bookings) ? bookings : []).filter(b =>
        b.customer_name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.driver_name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.id?.toString().includes(bookingSearch) ||
        b.pickup_location?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.destination?.toLowerCase().includes(bookingSearch.toLowerCase())
    );

    const filteredVerifications = verifications.filter(v =>
        v.name?.toLowerCase().includes(verificationSearch.toLowerCase()) ||
        v.email?.toLowerCase().includes(verificationSearch.toLowerCase()) ||
        v.dl_number?.toLowerCase().includes(verificationSearch.toLowerCase())
    );

    const statCards = stats ? [
        { title: 'Total Customers', value: stats.total_users,    icon: 'person',      color: 'blue' },
        { title: 'Total Drivers',   value: stats.total_drivers,  icon: 'badge',       color: 'primary' },
        { title: 'Online Drivers',  value: stats.active_drivers, icon: 'wifi',        color: 'emerald' },
        { title: 'Ongoing Rides',   value: stats.ongoing_rides,  icon: 'sensors',     color: 'red' },
        { title: 'Completed Rides', value: stats.completed_rides,icon: 'check_circle', color: 'emerald' },
        { title: 'Platform Comm.',  value: `₹${parseFloat(stats.platform_commission || 0).toFixed(2)}`, icon: 'payments', color: 'amber' },
    ] : Array(6).fill(null);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a1628] font-display text-slate-900 dark:text-white flex overflow-hidden">
            <style>{`
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(13,204,242,0.3); border-radius: 99px; }
            `}</style>

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a1628] fixed top-0 left-0 w-full z-40">
                <img src="/rideconnect_logo.png" alt="RideConnect Logo" className="h-10 object-contain drop-shadow-[0_0_15px_rgba(13,204,242,0.3)]" />
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="p-2 text-cyan-500 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-[60] shadow-2xl lg:shadow-none bg-white dark:bg-slate-900/60`}>
                <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen">
                {/* Logo */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <div className="relative">
                        <img src="/rideconnect_logo.png" alt="RideConnect Admin" className="h-[72px] w-auto object-contain drop-shadow-[0_0_15px_rgba(13,204,242,0.3)]" />
                        <span className="absolute -bottom-2 -right-2 text-[10px] text-cyan-400 font-bold uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded-full border border-cyan-500/30">Admin</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1">
                    {TABS.map(tab => (
                        <button key={tab.id} 
                            onClick={() => {
                                setIsSidebarOpen(false);
                                if (tab.id === 'platform_settings') navigate('/admin/platform-settings');
                                else if (tab.id === 'commissions') navigate('/admin/commissions');
                                else setActiveTab(tab.id);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                activeTab === tab.id
                                    ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                            }`}>
                            <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Admin info */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50">
                        <div className="size-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-cyan-400 text-sm">admin_panel_settings</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{userName || 'Admin'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{userEmail || 'Admin'}</p>
                        </div>
                        <button onClick={() => { clearAuthInfo(); window.location.href = '/login?role=admin'; }}
                            className="text-slate-400 hover:text-red-400 transition-colors" title="Logout">
                            <span className="material-symbols-outlined text-lg">logout</span>
                        </button>
                    </div>
                </div>
                </aside>
            </div>

            {/* Main */}
            <main className="flex-1 w-full lg:w-auto overflow-y-auto overflow-x-hidden custom-scrollbar pt-[72px] lg:pt-0">
                {/* Header */}
                <header className="sticky top-0 z-20 px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0a1628]/80 backdrop-blur-md flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black capitalize">{TABS.find(t => t.id === activeTab)?.label}</h1>
                        <p className="text-xs text-slate-400">RideConnect Control Panel</p>
                    </div>
                    <button onClick={fetchStats} className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                        <span className="material-symbols-outlined text-base">refresh</span> Refresh
                    </button>
                </header>

                <div className="p-8 space-y-8">
                    <AnimatePresence mode="wait">

                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                            {/* Stat cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {statCards.slice(0, 3).map((card, i) => (
                                    <StatCard key={i} loading={statsLoading || !card}
                                        title={card?.title} value={card?.value} icon={card?.icon} color={card?.color} />
                                ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {statCards.slice(3).map((card, i) => (
                                    <StatCard key={i+3} loading={statsLoading || !card}
                                        title={card?.title} value={card?.value} icon={card?.icon} color={card?.color} />
                                ))}
                            </div>

                            {/* Live Bookings preview */}
                            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-cyan-400 text-lg">sensors</span>
                                        Live Activity — Recent Rides
                                    </h2>
                                    <StatusPill status="pending" />
                                </div>
                                {bookingsLoading ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <span className="material-symbols-outlined animate-spin text-3xl text-cyan-400">progress_activity</span>
                                    </div>
                                ) : (!Array.isArray(bookings) || bookings.length === 0) ? (
                                    <div className="p-12 text-center text-slate-400">No active rides at the moment.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-widest">
                                                    <th className="px-6 py-3 text-center w-16">S.No</th>
                                                    <th className="px-6 py-3 text-left">#ID</th>
                                                    <th className="px-6 py-3 text-left">Customer</th>
                                                    <th className="px-6 py-3 text-left">Pickup</th>
                                                    <th className="px-6 py-3 text-left">Drop</th>
                                                    <th className="px-6 py-3 text-left">Vehicle</th>
                                                    <th className="px-6 py-3 text-left">Fare</th>
                                                    <th className="px-6 py-3 text-left">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(bookings) && bookings.slice(0, 8).map((b, index) => (
                                                    <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-3 text-center text-slate-400 font-medium border-r border-slate-100 dark:border-slate-800/50 w-16">{index + 1}</td>
                                                        <td className="px-6 py-3 font-mono text-xs text-slate-400">#{b.id}</td>
                                                        <td className="px-6 py-3 text-slate-900 dark:text-white font-medium">{b.customer_name || 'Customer'}</td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate">{b.pickup_location || '—'}</td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate">{b.destination || '—'}</td>
                                                        <td className="px-6 py-3 capitalize text-slate-600 dark:text-slate-400">{b.vehicle_type}</td>
                                                        <td className="px-6 py-3 text-cyan-500 font-bold">₹{b.estimated_fare}</td>
                                                        <td className="px-6 py-3"><StatusPill status={b.status} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── USERS TAB ── */}
                    {activeTab === 'users' && (
                        <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="relative flex-1 min-w-[200px]">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                    <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-cyan-400 transition-all" />
                                </div>
                                {['all', 'customer', 'driver'].map(f => (
                                    <button key={f} onClick={() => setUserRoleFilter(f)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border ${
                                            userRoleFilter === f
                                                ? 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30'
                                                : 'bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}>{f === 'all' ? 'All Users' : f + 's'}</button>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                {usersLoading ? (
                                    <div className="p-12 text-center">
                                        <span className="material-symbols-outlined animate-spin text-3xl text-cyan-400">progress_activity</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-widest">
                                                    <th className="px-6 py-3 text-center w-16">S.No</th>
                                                    <th className="px-6 py-3 text-left">User</th>
                                                    <th className="px-6 py-3 text-left">Email</th>
                                                    <th className="px-6 py-3 text-left">Phone</th>
                                                    <th className="px-6 py-3 text-left">Role</th>
                                                    <th className="px-6 py-3 text-left">Status</th>
                                                    <th className="px-6 py-3 text-left">Account</th>
                                                    <th className="px-6 py-3 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.length === 0 ? (
                                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No users found.</td></tr>
                                                ) : filteredUsers.map((u, index) => (
                                                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-3 text-center text-slate-400 font-medium border-r border-slate-100 dark:border-slate-800/50 w-16">{index + 1}</td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold text-sm">
                                                                    {u.name?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                                <span className="font-semibold text-slate-900 dark:text-white">{u.name || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{u.phone || '—'}</td>
                                                        <td className="px-6 py-3">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                u.role === 'Driver' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
                                                            }`}>{u.role}</span>
                                                        </td>
                                                        <td className="px-6 py-3"><StatusPill status={u.status} /></td>
                                                        <td className="px-6 py-3">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                            }`}>{u.is_active ? 'Active' : 'Blocked'}</span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => handleToggleBlock(u.id)}
                                                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                                                        u.is_active
                                                                            ? 'border-amber-400/40 text-amber-400 hover:bg-amber-500/10'
                                                                            : 'border-emerald-400/40 text-emerald-400 hover:bg-emerald-500/10'
                                                                    }`}>{u.is_active ? 'Block' : 'Unblock'}</button>
                                                                <button onClick={() => setDeleteTarget({ id: u.id, name: u.name })}
                                                                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-400/40 text-red-400 hover:bg-red-500/10 transition-all">
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── ACTIVE DRIVERS TAB ── */}
                    {activeTab === 'active_drivers' && (
                        <motion.div key="active_drivers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-emerald-400 text-lg">wifi</span>
                                        <h2 className="font-bold text-slate-900 dark:text-white">Active Drivers ({filteredActiveDrivers.length})</h2>
                                    </div>
                                    <div className="relative w-full max-w-xs">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                        <input value={activeDriverSearch} onChange={e => setActiveDriverSearch(e.target.value)}
                                            placeholder="Search by name, email or phone..."
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:border-emerald-400 outline-none transition-all" />
                                    </div>
                                </div>
                                {activeDriversLoading ? (
                                    <div className="p-12 text-center">
                                        <span className="material-symbols-outlined animate-spin text-3xl text-emerald-400">progress_activity</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-widest">
                                                    <th className="px-6 py-3 text-center w-16">S.No</th>
                                                    <th className="px-6 py-3 text-left">Driver</th>
                                                    <th className="px-6 py-3 text-left">Email</th>
                                                    <th className="px-6 py-3 text-left">Phone</th>
                                                    <th className="px-6 py-3 text-left">Vehicle Type</th>
                                                    <th className="px-6 py-3 text-left">Status</th>
                                                    <th className="px-6 py-3 text-left">Last Active</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredActiveDrivers.length === 0 ? (
                                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No active drivers found.</td></tr>
                                                ) : filteredActiveDrivers.map((d, index) => (
                                                    <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-3 text-center text-slate-400 font-medium border-r border-slate-100 dark:border-slate-800/50 w-16">{index + 1}</td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-sm">
                                                                    {d.name?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                                <span className="font-semibold text-slate-900 dark:text-white">{d.name || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{d.email}</td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{d.phone || '—'}</td>
                                                        <td className="px-6 py-3 capitalize text-slate-600 dark:text-slate-400">{d.vehicle_type}</td>
                                                        <td className="px-6 py-3"><StatusPill status={d.status} /></td>
                                                        <td className="px-6 py-3 text-slate-400 text-xs text-emerald-500">{new Date(d.last_active).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── BOOKINGS TAB ── */}
                    {activeTab === 'bookings' && (
                        <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-cyan-400 text-lg">receipt_long</span>
                                        <h2 className="font-bold text-slate-900 dark:text-white">All Bookings ({filteredBookings.length})</h2>
                                    </div>
                                    <div className="relative w-full max-w-xs">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                        <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)}
                                            placeholder="Search by ID, customer, location..."
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:border-cyan-400 outline-none transition-all" />
                                    </div>
                                </div>
                                {bookingsLoading ? (
                                    <div className="p-12 text-center">
                                        <span className="material-symbols-outlined animate-spin text-3xl text-cyan-400">progress_activity</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-widest">
                                                    <th className="px-6 py-3 text-center w-16">S.No</th>
                                                    <th className="px-6 py-3 text-left">#ID</th>
                                                    <th className="px-6 py-3 text-left">Customer</th>
                                                    <th className="px-6 py-3 text-left">Driver</th>
                                                    <th className="px-6 py-3 text-left">Pickup</th>
                                                    <th className="px-6 py-3 text-left">Drop</th>
                                                    <th className="px-6 py-3 text-left text-primary">OTP</th>
                                                    <th className="px-6 py-3 text-left">Fare</th>
                                                    <th className="px-6 py-3 text-left">Comm (12%)</th>
                                                    <th className="px-6 py-3 text-left">Driver</th>
                                                    <th className="px-6 py-3 text-left">Status</th>
                                                    <th className="px-6 py-3 text-left">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredBookings.length === 0 ? (
                                                    <tr><td colSpan={12} className="px-6 py-12 text-center text-slate-400">No bookings found.</td></tr>
                                                ) : filteredBookings.map((b, index) => (
                                                    <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-3 text-center text-slate-400 font-medium border-r border-slate-100 dark:border-slate-800/50 w-16">{index + 1}</td>
                                                        <td className="px-6 py-3 font-mono text-xs text-slate-400">#{b.id}</td>
                                                        <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{b.customer_name || '—'}</td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{b.driver_name || <span className="text-slate-400 italic text-xs">Unassigned</span>}</td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate" title={b.pickup_location}>{b.pickup_location}</td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate" title={b.destination}>{b.destination}</td>
                                                        <td className="px-6 py-3 font-bold text-primary">{b.otp || '—'}</td>
                                                        <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">₹{b.estimated_fare}</td>
                                                        <td className="px-6 py-3 text-amber-500 font-bold">₹{parseFloat(b.commission_amount || 0).toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-emerald-500 font-bold">₹{parseFloat(b.driver_amount || 0).toFixed(2)}</td>
                                                        <td className="px-6 py-3"><StatusPill status={b.status} /></td>
                                                        <td className="px-6 py-3 text-slate-400 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── VERIFICATION TAB ── */}
                    {activeTab === 'verification' && (
                        <motion.div key="verification" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <h1 className="text-xl font-black flex items-center gap-2">
                                    <span className="material-symbols-outlined text-cyan-400">verified_user</span>
                                    Verification Requests ({filteredVerifications.length})
                                </h1>
                                <div className="relative w-full max-w-xs">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                    <input value={verificationSearch} onChange={e => setVerificationSearch(e.target.value)}
                                        placeholder="Search by name, email or DL..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-cyan-400 transition-all" />
                                </div>
                            </div>

                            {verifyLoading ? (
                                <div className="p-12 text-center">
                                    <span className="material-symbols-outlined animate-spin text-4xl text-cyan-400">progress_activity</span>
                                </div>
                            ) : filteredVerifications.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-3 block">search_off</span>
                                    No verification requests found matching your search.
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-widest">
                                                    <th className="px-6 py-3 text-center w-16">S.No</th>
                                                    <th className="px-6 py-3 text-left">Driver</th>
                                                    <th className="px-6 py-3 text-left">DL Details</th>
                                                    <th className="px-6 py-3 text-left">Category</th>
                                                    <th className="px-6 py-3 text-left">Documents</th>
                                                    <th className="px-6 py-3 text-left">Status</th>
                                                    <th className="px-6 py-3 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredVerifications.map((req, index) => (
                                                    <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-3 text-center text-slate-400 font-medium border-r border-slate-100 dark:border-slate-800/50 w-16">{index + 1}</td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold text-xs">
                                                                    {req.name?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-900 dark:text-white capitalize leading-tight">{req.name || '—'}</p>
                                                                    <p className="text-[10px] text-slate-400">{req.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <p className="font-mono text-[10px] text-cyan-500 uppercase tracking-tighter">{req.dl_number || '—'}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1">Exp: {req.expiry_date ? new Date(req.expiry_date).toLocaleDateString() : '—'}</p>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{req.vehicle_type || '—'}</p>
                                                            <p className="text-[10px] text-slate-400 uppercase">{req.license_type || '—'}</p>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex gap-2">
                                                                {req.front_image && (
                                                                    <button onClick={() => setSelectedImage(req.front_image)} className="size-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors" title="View Front">
                                                                        <span className="material-symbols-outlined text-sm">image</span>
                                                                    </button>
                                                                )}
                                                                {req.back_image && (
                                                                    <button onClick={() => setSelectedImage(req.back_image)} className="size-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors" title="View Back">
                                                                        <span className="material-symbols-outlined text-sm">image</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <StatusPill status={req.verification_status?.toLowerCase()} />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {req.verification_status?.toLowerCase() === 'pending' ? (
                                                                    <>
                                                                        <button onClick={() => handleVerifyAction(req.id, 'approve')} disabled={processingId === req.id}
                                                                            className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded hover:bg-emerald-600 transition-all disabled:opacity-50">Approve</button>
                                                                        <button onClick={() => {
                                                                            const reason = window.prompt("Reason for rejection:");
                                                                            if (reason !== null) handleVerifyAction(req.id, 'reject', reason);
                                                                        }} disabled={processingId === req.id}
                                                                            className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">Reject</button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 font-medium">Done</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    </AnimatePresence>
                </div>
            </main>

            {/* Confirm Delete Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 border border-red-500/20 rounded-2xl shadow-2xl p-8 max-w-md w-full">
                            {/* Icon */}
                            <div className="size-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                                <span className="material-symbols-outlined text-red-400 text-3xl">delete_forever</span>
                            </div>
                            {/* Content */}
                            <h2 className="text-xl font-black text-slate-900 dark:text-white text-center">Delete User?</h2>
                            <p className="text-sm text-slate-400 text-center mt-2">
                                You are about to permanently delete
                                <span className="font-bold text-slate-900 dark:text-white"> {deleteTarget.name}</span>.
                                All their data including profile, rides, and vehicles will be removed.
                            </p>
                            <p className="text-xs text-center font-bold text-red-400 mt-3 bg-red-500/10 px-4 py-2 rounded-lg">
                                This action cannot be undone.
                            </p>
                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setDeleteTarget(null)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleDeleteUser}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-base">delete</span>
                                    Confirm Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Image Viewer Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-10">
                        {/* Close Button */}
                        <button onClick={() => setSelectedImage(null)} 
                            className="absolute top-6 right-6 size-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all z-10">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>

                        {/* Zoom Controls */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl z-10 shadow-2xl">
                            <button onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))}
                                className="size-10 rounded-lg hover:bg-white/10 text-white flex items-center justify-center transition-all border border-transparent hover:border-white/10"
                                title="Zoom Out">
                                <span className="material-symbols-outlined">zoom_out</span>
                            </button>
                            <div className="w-16 text-center">
                                <span className="text-white font-mono font-bold text-sm">{Math.round(zoomScale * 100)}%</span>
                            </div>
                            <button onClick={() => setZoomScale(s => Math.min(4, s + 0.25))}
                                className="size-10 rounded-lg hover:bg-white/10 text-white flex items-center justify-center transition-all border border-transparent hover:border-white/10"
                                title="Zoom In">
                                <span className="material-symbols-outlined">zoom_in</span>
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-2" />
                            <button onClick={() => setZoomScale(1)}
                                className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-all px-2 py-1 rounded hover:bg-cyan-500/10">
                                Reset
                            </button>
                        </div>

                        {/* Image Container */}
                        <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar p-10 cursor-zoom-out" onClick={() => setSelectedImage(null)}>
                            <motion.img 
                                key={selectedImage}
                                src={selectedImage} 
                                animate={{ scale: zoomScale }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm pointer-events-auto"
                                style={{ transformOrigin: 'center' }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                        className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold border border-cyan-500/30 flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-400 text-base">check_circle</span>
                        {toastMsg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
