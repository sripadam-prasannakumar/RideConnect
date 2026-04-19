import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthStatus, storeActiveRide, getActiveRide } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import { Bike, Truck, Car, ShieldCheck, MapPin, Star, Route, Clock, Plus, X, Loader2, ChevronRight } from 'lucide-react';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';
import QRCodeComponent from '../Shared/QRCodeComponent';

const DriverDashboard = () => {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(false);
    const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [driverVehicleType, setDriverVehicleType] = useState('car');
    const [stats, setStats] = useState(null);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
    const [socket, setSocket] = useState(null);
    const [availableRides, setAvailableRides] = useState([]);
    const [ignoredRequests, setIgnoredRequests] = useState(new Set());

    const fetchProfileData = useCallback(async (email) => {
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/user-profile/?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (data.email) setUserData(data);
        } catch (e) { console.error('Error fetching profile:', e); }
    }, []);

    const fetchVerificationStatus = useCallback(async (email) => {
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/driver/verification-status/?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (data.verification_status) {
                setVerificationStatus(data.verification_status);
                setIsOnline(data.is_online);
                setDriverVehicleType(data.vehicle_type || 'car');
            }
        } catch (e) { console.error('Error fetching verification:', e); }
    }, []);

    const fetchDashboardStats = useCallback(async (email) => {
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/driver/dashboard-stats/?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (res.ok) {
                setStats(data);
                setRides(data.recent_rides || []);
                
                // Store active ride if exists
                if (data.active_ride && data.active_ride.status !== 'completed' && data.active_ride.status !== 'cancelled') {
                    storeActiveRide(data.active_ride);
                    localStorage.setItem('lastActiveRideId', data.active_ride.id);
                    // Persistence Check: if ongoing/accepted, move to trip-status
                    // BUT respect the manualDashboard flag set when driver explicitly navigated here
                    const manualDashboard = sessionStorage.getItem('manualDashboard');
                    if (manualDashboard) {
                        sessionStorage.removeItem('manualDashboard'); // One-time skip
                    } else {
                        navigate('/driver/trip-status', { 
                            state: { 
                                rideId: data.active_ride.id, 
                                rideData: data.active_ride 
                            },
                            replace: true 
                        });
                    }
                } else {
                    storeActiveRide(null);
                    localStorage.removeItem('lastActiveRideId');
                }
            }
        } catch (e) { console.error('Error fetching stats:', e); }
    }, [navigate]);

    useEffect(() => {
        const { isAuthenticated, email } = getAuthStatus();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const init = async () => {
            setLoading(true);
            await Promise.all([
                fetchProfileData(email),
                fetchVerificationStatus(email),
                fetchDashboardStats(email)
            ]);
            setLoading(false);
        };
        init();
    }, [navigate, fetchProfileData, fetchVerificationStatus, fetchDashboardStats]);

    // WebSocket Integration
    useEffect(() => {
        const { isAuthenticated, user_id } = getAuthStatus();
        const effectiveUserId = user_id || userData.user_id;
        const driverId = stats?.driver_id || userData.driver_id || effectiveUserId;

        if (isAuthenticated && isOnline && driverId) {
            const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/driver/${driverId}/`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => console.log("Driver WS connected:", driverId);
            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                console.log("Driver WS Raw Data:", data);

                // Handle both direct data, 'new_ride_request' (from group), and 'send_ride_request' (direct)
                const isStructured = data.type === 'new_ride_request' || data.type === 'send_ride_request';
                const rData = isStructured ? (data.ride_data || data.data) : data;

                // Validate vehicle type match
                if (rData && rData.vehicle_type && rData.vehicle_type !== driverVehicleType) return;

                if (rData && rData.pickup_location && rData.destination && (rData.ride_id || rData.id)) {
                    const rideId = rData.ride_id || rData.id;
                    if (!ignoredRequests.has(rideId)) {
                        setAvailableRides(prev => {
                            if (prev.some(r => r.id === rideId)) return prev;
                            const newRide = {
                                id: rideId,
                                pickup_location: rData.pickup_location,
                                destination: rData.destination,
                                estimated_fare: rData.estimated_fare || rData.total_fare,
                                duration_text: rData.duration_text || "Calculated soon",
                                customer_name: rData.customer_name || "Customer"
                            };
                            return [newRide, ...prev];
                        });
                    }
                } else if (data.type === 'ride_taken' || (data.type === 'ride_update' && data.status === 'accepted')) {
                    const rideId = data.ride_id || (data.ride_data?.id);
                    if (rideId) {
                        setAvailableRides(prev => prev.filter(r => r.id !== rideId));
                    }
                }
            };
            ws.onerror = (err) => console.error("WS Error:", err);
            ws.onclose = () => console.log("Driver WS closed");

            setSocket(ws);
            return () => ws.close();
        }
    }, [isOnline, userData.user_id, ignoredRequests.size, stats?.driver_id, userData.driver_id]);

    // API Polling for available rides (Replaces PubNub)
    useEffect(() => {
        let pollInterval;
        const { email } = getAuthStatus();

        if (isOnline && email) {
            const fetchAvailableRides = async () => {
                try {
                    const res = await authorizedFetch(`${API_BASE_URL}/api/ride/available/?email=${encodeURIComponent(email)}`);
                    if (res.ok) {
                        const data = await res.json();
                        // Update available rides list, keeping only those not ignored
                        setAvailableRides(data.filter(r => !ignoredRequests.has(r.id)));
                    }
                } catch (e) { console.error("Poll Error:", e); }
            };

            fetchAvailableRides(); // Initial call
            pollInterval = setInterval(fetchAvailableRides, 5000); // 5 sec poll
        } else if (!isOnline) {
            setAvailableRides([]); // Clear list when offline
        }
        return () => clearInterval(pollInterval);
    }, [isOnline, ignoredRequests]);

    // PubNub Real-Time Integration has been removed in favor of WebSockets and API Polling.
    

    // Handle Auto-Offline
    useEffect(() => {
        const handleOffline = () => {
            const { email } = getAuthStatus();
            if (isOnline && email) {
                const blob = new Blob([JSON.stringify({ email, is_online: false })], { type: 'application/json' });
                navigator.sendBeacon(`${API_BASE_URL}/api/driver/status-toggle/`, blob);
            }
        };
        window.addEventListener('beforeunload', handleOffline);
        return () => window.removeEventListener('beforeunload', handleOffline);
    }, [isOnline]);

    // Update Driver Location
    useEffect(() => {
        let locationInterval;
        if (isOnline) {
            const updateLocation = () => {
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            await authorizedFetch(`${API_BASE_URL}/api/driver/update-location/`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ lat: latitude, lng: longitude })
                            });
                        } catch (e) { console.error("Location update error:", e); }
                    }, (err) => console.error("Geolocation error:", err));
                }
            };

            updateLocation(); // Initial update
            locationInterval = setInterval(updateLocation, 30000); // Every 30 seconds
        }
        return () => clearInterval(locationInterval);
    }, [isOnline]);

    // Real-time events are now handled by WebSockets and API Polling.
    

    const handleToggleStatus = async () => {
        if (toggleLoading || verificationStatus !== 'verified') return;
        const { email } = getAuthStatus();
        const newStatus = !isOnline;

        setToggleLoading(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/driver/status-toggle/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, is_online: newStatus })
            });
            const data = await res.json();
            if (res.ok) {
                setIsOnline(data.is_online);
            } else {
                alert(data.error || "Failed to update status. Please ensure your profile is fully complete.");
            }
        } catch (e) {
            console.error('Toggle status error:', e);
            alert("Network error. Please try again.");
        } finally {
            setToggleLoading(false);
        }
    };

    const handleAcceptRide = async (rideId) => {
        const { email, user_id } = getAuthStatus();
        try {
            // BACKEND FIXES INCORPORATED: Added rideId to path to match server requirement
            const res = await authorizedFetch(`${API_BASE_URL}/api/ride/accept/${rideId}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            const data = await res.json();
            if (res.ok) {
                // Status update via PubNub removed.
                // Status is already updated in the backend and synced via WebSockets/Polling.
                setAvailableRides(prev => prev.filter(r => r.id !== rideId));
                navigate('/driver/trip-status', { state: { rideId, rideData: data } });
            } else {
                alert(data.error || "Failed to accept ride");
                setAvailableRides(prev => prev.filter(r => r.id !== rideId));
            }
        } catch (e) {
            console.error('Accept ride error:', e);
        }
    };

    const handleRejectRide = (rideId) => {
        setIgnoredRequests(prev => new Set([...prev, rideId]));
        setAvailableRides(prev => prev.filter(r => r.id !== rideId));
    };

    const statItems = [
        { label: 'Total Trips', value: stats?.total_trips ?? '0', icon: 'route', color: 'primary' },
        { label: 'Rating', value: stats?.rating ?? '4.95', icon: 'star', color: 'amber' },
        { label: 'Active Rides', value: stats?.active_rides ?? '0', icon: 'schedule', color: 'emerald' }
    ];

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark min-h-screen">
            <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-200 dark:border-slate-800" />
                    <h2 className="text-lg font-bold">Driver Dashboard</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${!isOnline ? 'text-slate-400' : 'text-slate-600 dark:text-slate-500'}`}>Offline</span>
                        <div 
                            onClick={verificationStatus === 'verified' && !toggleLoading ? handleToggleStatus : undefined}
                            className={`relative w-14 h-7 rounded-full transition-all flex items-center p-1 cursor-pointer ${isOnline ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <motion.div 
                                animate={{ x: isOnline ? 28 : 0 }}
                                className="size-5 rounded-full bg-white shadow-lg"
                            />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>Online</span>
                    </div>
                    {isOnline && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Requests</span>
                        </div>
                    )}
                    <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                    </button>
                </div>
            </header>

            <div className="p-6 space-y-8 max-w-7xl mx-auto">
                {/* Verification & Registered Vehicle Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                   {(verificationStatus === 'unverified' || !verificationStatus || verificationStatus === 'null') ? (
                         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="p-8 rounded-[2rem] bg-amber-500 text-background-dark shadow-xl flex flex-col md:flex-row items-center gap-6">
                            <div className="size-16 rounded-full bg-background-dark/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-4xl">warning</span>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-black tracking-tight mb-1 uppercase italic">Action Required</h3>
                                <p className="font-bold opacity-90 text-sm">Upload license to start earning.</p>
                            </div>
                            <button onClick={() => navigate('/driver/license')}
                                className="px-10 py-4 bg-background-dark text-amber-500 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all shrink-0">
                                Verify Now
                            </button>
                        </motion.div>
                   ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                                    <ShieldCheck className="size-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Verified Expert</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">Since {new Date().getFullYear()}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="size-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-800 shadow-inner flex items-center justify-center">
                                    {userData.profile_image ? <img src={userData.profile_image} alt="Profile" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-slate-300">person</span>}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase leading-none">{userData.full_name || 'Expert Driver'}</h3>
                                    <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-2">
                                        <Star className="size-3 text-amber-500 fill-amber-500" /> {stats?.rating || '4.95'} Ratings
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                   )}

                   {/* Vehicle Card(s) */}
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm border-b-4 border-b-primary relative overflow-hidden"
                   >
                        <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-[0.03] rotate-12 scale-150">
                             {driverVehicleType === 'bike' ? <Bike className="size-48" /> : (driverVehicleType === 'cargo' ? <Truck className="size-48" /> : <Car className="size-48" />)}
                        </div>
                        <div className="flex items-start justify-between relative z-10 mb-6">
                            <div className="p-4 rounded-3xl bg-primary/10 text-primary">
                                {driverVehicleType === 'bike' ? <Bike className="size-10" /> : (driverVehicleType === 'cargo' ? <Truck className="size-10" /> : <Car className="size-10" />)}
                            </div>
                             <div className="text-right">
                                <div className="flex items-center gap-2 mb-2 justify-end">
                                    <button 
                                        onClick={() => setIsAddVehicleModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <Plus className="size-3" />
                                        Add Vehicle
                                    </button>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Registered Fleet</p>
                                <p className="text-lg font-black italic uppercase tracking-tighter text-primary">Active {driverVehicleType === 'bike' ? 'Ride' : (driverVehicleType === 'cargo' ? 'Cargo' : 'Economy')}</p>
                            </div>
                        </div>

                        {/* List all registered vehicles */}
                        <div className="space-y-4 relative z-10">
                            {userData.vehicles && userData.vehicles.length > 0 ? (
                                userData.vehicles.map((v, idx) => (
                                    <div key={idx} className="flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-4 first:border-0 first:pt-0">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle License No.</p>
                                            <p className="text-xl font-black font-mono tracking-tighter text-slate-900 dark:text-white uppercase">
                                                {v.registration_number}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Model / Type</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">
                                                {v.model_name} • <span className="uppercase">{v.vehicle_type}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-4 first:border-0 first:pt-0">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle License No.</p>
                                        <p className="text-xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">{userData.vehicle_number || "XX-00-XX-0000"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle Model</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">{userData.vehicle_model || "Not Specified"}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                   </motion.div>
                </div>

                {(verificationStatus === 'pending' || verificationStatus === 'rejected') && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg ${verificationStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' : 'bg-primary/10 border-primary/20 text-primary-dark dark:text-primary'
                            }`}>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-xl">{verificationStatus === 'rejected' ? 'error' : 'info'}</span>
                            <div>
                                <p className="font-bold text-sm tracking-tight">{verificationStatus === 'rejected' ? 'Verification Rejected' : 'Documentation Under Review'}</p>
                                <p className="text-[11px] font-medium opacity-80">{verificationStatus === 'rejected' ? 'Please re-submit clear documents.' : 'We are currently reviewing your documents for security.'}</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/driver/license')}
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${verificationStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-primary text-background-dark shadow-xl shadow-primary/20'}`}>
                            {verificationStatus === 'rejected' ? 'Update Documents' : 'Check Details'}
                        </button>
                    </motion.div>
                )}

                {/* Stats Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {statItems.map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-slate-800/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary/30 transition-all group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{stat.label}</p>
                                    <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
                                </div>
                                <div className={`bg-${stat.color}/10 p-2.5 rounded-xl text-${stat.color} group-hover:scale-110 transition-transform`}>
                                    <span className="material-symbols-outlined">{stat.icon}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* Active Booking Section for Driver */}
                {stats?.active_ride && (
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Active Booking</h2>
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full">
                                <Clock className="size-3.5 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">In Progress</span>
                            </div>
                        </div>
                        <div 
                            onClick={() => navigate('/driver/trip-status', { state: { rideId: stats.active_ride.id } })}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-xl group cursor-pointer relative overflow-hidden transition-all hover:border-primary/50"
                        >
                            <div className="absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <span className="text-[10px] font-black uppercase text-primary">Click to view details</span>
                                <ChevronRight className="size-3 text-primary" />
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <span className="material-symbols-outlined">person_pin_circle</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Passenger</p>
                                            <p className="text-lg font-black italic uppercase italic tracking-tighter">{stats.active_ride.customer?.full_name || "Customer"}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 relative">
                                        <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                                        <div className="flex items-start gap-4">
                                            <div className="size-3 rounded-full border-2 border-primary bg-background-dark relative z-10 mt-1"></div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Pickup</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{stats.active_ride.pickup_location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="size-3 rounded-full bg-primary relative z-10 mt-1 shadow-[0_0_8px_rgba(13,204,242,0.8)]"></div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Destination</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{stats.active_ride.destination}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden lg:flex flex-col items-center gap-2 px-8 border-l border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estimated Fare</p>
                                    <p className="text-4xl font-black italic tracking-tighter text-primary">₹{stats.active_ride.total_fare || stats.active_ride.estimated_fare}</p>
                                    <button className="mt-4 px-8 py-3 bg-primary text-background-dark rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Resume Trip</button>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Earnings Summary */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Earnings Summary</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800">
                                    <div className="p-6 text-center">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Today</p>
                                        <p className="text-2xl font-bold mt-2">₹{stats?.today_earnings || '0.00'}</p>
                                    </div>
                                    <div className="p-6 text-center bg-primary/5">
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">This Week</p>
                                        <p className="text-2xl font-bold mt-2">₹{stats?.weekly_earnings || '0.00'}</p>
                                    </div>
                                    <div className="p-6 text-center">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Lifetime</p>
                                        <p className="text-2xl font-bold mt-2">₹{stats?.total_earnings || '0.00'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Recent Rides */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Recent History</h2>
                                <button onClick={() => navigate('/driver/history')} className="text-primary text-xs font-bold hover:underline">View All</button>
                            </div>
                            <div className="space-y-3">
                                {rides.length === 0 ? (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                                        <span className="material-symbols-outlined text-4xl block mb-2">history</span>
                                        <p className="text-sm font-semibold">No recent rides found</p>
                                    </div>
                                ) : (
                                    rides.map(ride => (
                                        <div key={ride.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined">{ride.vehicle_type === 'bike' ? 'motorcycle' : 'directions_car'}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm truncate max-w-[150px] md:max-w-xs">{ride.drop}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                                                        {new Date(ride.time).toLocaleDateString()} • {ride.vehicle_type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-sm text-slate-900 dark:text-white">+₹{ride.amount}</p>
                                                <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{ride.status}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        {/* My QR Code Section */}
                        <section className="animate-in slide-in-from-right duration-700 delay-150">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold italic tracking-tight uppercase">My Payment QR</h2>
                                <button 
                                    onClick={() => navigate('/driver/profile')}
                                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                >
                                    Edit UPI ID
                                </button>
                            </div>
                            
                            {(stats?.upi_id || userData?.upi_id) ? (
                                <QRCodeComponent 
                                    value={`upi://pay?pa=${stats?.upi_id || userData?.upi_id}&pn=${encodeURIComponent(userData?.full_name || 'Driver')}&cu=INR`}
                                    label="My UPI QR"
                                    subLabel={stats?.upi_id || userData?.upi_id}
                                    size={180}
                                    showControls={true}
                                />
                            ) : (
                                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 group hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate('/driver/profile')}>
                                     <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                          <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                                     </div>
                                     <h4 className="text-sm font-black uppercase tracking-widest">Setup UPI ID</h4>
                                     <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Required to receive payments directly from customers</p>
                                     <button className="mt-4 px-6 py-2.5 bg-background-dark dark:bg-slate-800 text-white dark:text-primary rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-primary group-hover:text-background-dark transition-all">Link Now</button>
                                </div>
                            )}
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-4 mt-8">
                                <h2 className="text-xl font-bold">Live Feed</h2>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-500/20 text-emerald-500 animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                                    {isOnline ? 'Active' : 'Offline'}
                                </span>
                            </div>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableRides.length > 0 ? (
                                    availableRides.map(request => (
                                        <motion.div key={request.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-primary/20 hover:border-primary shadow-sm hover:shadow-[0_0_20px_rgba(13,204,242,0.1)] overflow-hidden text-left transition-all">
                                            <div className="bg-primary/10 p-3 flex justify-between items-center text-primary">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[10px] font-bold">person</span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{request.customer_name || 'Passenger'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px] font-black uppercase tracking-[0.2em]">{request.vehicle_type === 'bike' ? 'motorcycle' : 'directions_car'}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{request.vehicle_type || 'Ride'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="size-1.5 rounded-full bg-primary animate-pulse"></div>
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Live Request</span>
                                                </div>
                                            </div>
                                            <div className="p-5 space-y-5">
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-4">
                                                        <div className="size-2 rounded-full bg-primary mt-1.5 shadow-[0_0_8px_rgba(13,204,242,0.8)]"></div>
                                                        <div className="flex-1">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pickup</p>
                                                            <p className="text-xs font-bold line-clamp-1 leading-snug">{request.pickup_location}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="size-2 rounded-full bg-rose-500 mt-1.5 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                                                        <div className="flex-1">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Destination</p>
                                                            <p className="text-xs font-bold line-clamp-1 leading-snug">{request.destination}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{request.duration_text}</p>
                                                    </div>
                                                    <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                                                        <p className="text-[7px] font-black text-primary uppercase tracking-widest">Fare</p>
                                                        <p className="text-xs font-black text-primary italic">₹{request.estimated_fare || request.total_fare}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mt-1">
                                                    <button onClick={() => handleRejectRide(request.id)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-500 font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl transition-all">Ignore</button>
                                                    <button onClick={() => handleAcceptRide(request.id)} className="flex-[2] py-3 bg-primary text-background-dark font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">Accept Trip</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-primary/5 rounded-2xl border-2 border-dashed border-primary/30">
                                        <span className="material-symbols-outlined text-3xl text-primary mb-2 animate-spin">radar</span>
                                        <p className="text-xs font-bold text-primary">Scanning for nearby rides...</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Refreshes every 5s</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Persistent Active Ride Card (if any) */}
                        <AnimatePresence>
                            {getActiveRide() && (
                                <motion.div 
                                    initial={{ y: 50, opacity: 0 }} 
                                    animate={{ y: 0, opacity: 1 }} 
                                    exit={{ y: 50, opacity: 0 }}
                                    onClick={() => navigate('/driver/trip-status', { state: { rideId: getActiveRide().id } })}
                                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-6 cursor-pointer border border-primary/30 hover:shadow-primary/20 transition-all group"
                                >
                                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Route className="size-6 shadow-[0_0_10px_rgba(13,204,242,0.5)]" />
                                    </div>
                                    <div className="pr-4 border-r border-slate-700">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Active Trip Ongoing</p>
                                        <p className="text-sm font-bold truncate max-w-[150px] italic">#{getActiveRide().id.toString().slice(-6).toUpperCase()}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">View Details</p>
                                        <ChevronRight className="size-4 text-slate-500 group-hover:text-white transition-colors" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            <AddVehicleModal 
                isOpen={isAddVehicleModalOpen} 
                onClose={() => setIsAddVehicleModalOpen(false)} 
                onSuccess={() => fetchProfileData(getAuthStatus().email)}
            />
        </main>
    );
};

/* ─── Add Vehicle Modal ─── */
const AddVehicleModal = ({ isOpen, onClose, onSuccess }) => {
    const [fields, setFields] = useState({ vehicle_type: 'bike', registration_number: '', model_name: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/user-vehicles/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_type: fields.vehicle_type,
                    registration_number: fields.registration_number.toUpperCase().replace(/\s/g, ''),
                    model_name: fields.model_name,
                    brand: fields.vehicle_type === 'bike' ? 'Bike' : 'Cargo Van', // fallback
                    fuel_type: 'petrol',
                    transmission: 'manual'
                })
            });
            const data = await res.json();
            if (res.ok) {
                onSuccess();
                onClose();
                setFields({ vehicle_type: 'bike', registration_number: '', model_name: '' });
            } else {
                setError(data.registration_number ? data.registration_number[0] : (data.error || 'Failed to add vehicle'));
            }
        } catch (e) {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-widest text-primary italic">Add New Vehicle</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Expansion of your fleet</p>
                                </div>
                                <button onClick={onClose} className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest underline decoration-primary decoration-2 underline-offset-4">Vehicle Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'bike', label: 'Bike', icon: <Bike className="size-5" /> },
                                            { id: 'cargo', label: 'Cargo Van', icon: <Truck className="size-5" /> },
                                        ].map(v => (
                                            <button
                                                key={v.id} type="button"
                                                onClick={() => setFields({ ...fields, vehicle_type: v.id })}
                                                className={`flex items-center justify-center p-4 rounded-2xl border-2 transition-all gap-3 ${fields.vehicle_type === v.id ? 'border-primary bg-primary/10 text-primary' : 'border-slate-100 dark:border-slate-800'}`}
                                            >
                                                {v.icon}
                                                <span className="text-xs font-black uppercase tracking-tighter">{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registration Number</label>
                                    <input 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary h-14 outline-none font-mono tracking-widest uppercase" 
                                        placeholder="APXX1234"
                                        value={fields.registration_number}
                                        onChange={(e) => {
                                            setFields({ ...fields, registration_number: e.target.value.toUpperCase() });
                                            if (error) setError(null);
                                        }}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Model Name</label>
                                    <input 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary h-14 outline-none" 
                                        placeholder="e.g. Pulsar 220"
                                        value={fields.model_name}
                                        onChange={(e) => {
                                            setFields({ ...fields, model_name: e.target.value });
                                            if (error) setError(null);
                                        }}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-shake">
                                        {error}
                                    </div>
                                )}

                                <button 
                                    type="submit" disabled={loading}
                                    className="w-full py-5 bg-primary text-background-dark font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                                    {loading ? 'Adding...' : 'Add Vehicle'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DriverDashboard;
