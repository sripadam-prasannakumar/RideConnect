import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuthStatus } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';
import { getPubNubInstance, RIDE_REQUESTS_CHANNEL, RIDE_UPDATES_CHANNEL } from '../../utils/pubnubService';

const DriverDashboard = () => {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(false);
    const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [activeRequest, setActiveRequest] = useState(null);
    const [ignoredRequests, setIgnoredRequests] = useState(new Set());
    const [socket, setSocket] = useState(null);

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
            }
        } catch (e) { console.error('Error fetching stats:', e); }
    }, []);

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
        // user_id might not be in authStatus yet if not updated. Let's get it from userData if available.
        const effectiveUserId = user_id || userData.user_id;

        const driverId = stats?.driver_id || userData.driver_id || effectiveUserId;

        if (isAuthenticated && isOnline && driverId) {
            const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/driver/${driverId}/`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => console.log("Driver WS connected:", driverId);
            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                console.log("Driver WS Data:", data);
                
                // If data has pickup/destination/fare, it's a ride request (based on new spec)
                if (data.pickup && data.destination && data.ride_id) {
                    if (!ignoredRequests.has(data.ride_id)) {
                        const mappedRequest = {
                            id: data.ride_id,
                            pickup_location: data.pickup,
                            destination: data.destination,
                            estimated_fare: data.fare,
                            duration_text: "Calculated soon" // New spec doesn't provide this directly
                        };
                        setActiveRequest(mappedRequest);
                        
                        // Auto-dismiss after 30 seconds
                        setTimeout(() => setActiveRequest(prev => prev?.id === data.ride_id ? null : prev), 30000);
                    }
                } else if (data.type === 'ride_update' && (data.status === 'accepted' || data.ride_status === 'accepted')) {
                    // Remove the request if someone else accepted it
                    setActiveRequest(prev => prev?.id === (data.ride_id || data.rideData?.id) ? null : prev);
                }
            };
            ws.onerror = (err) => console.error("WS Error:", err);
            ws.onclose = () => console.log("Driver WS closed");

            setSocket(ws);
            return () => ws.close();
        }
    }, [isOnline, userData.user_id, userData.vehicle_type, ignoredRequests]);

    // PubNub Real-Time Integration
    useEffect(() => {
        const { user_id } = getAuthStatus();
        const effectiveUserId = user_id || userData.user_id;
        const driverId = stats?.driver_id || userData.driver_id || effectiveUserId;

        if (!driverId || verificationStatus !== 'verified') return;

        let pubnub = null;
        if (isOnline) {
            pubnub = getPubNubInstance(`driver_${driverId}`);
            if (pubnub) {
                pubnub.addListener({
                    message: (event) => {
                        if (event.channel === RIDE_REQUESTS_CHANNEL && event.message.type === 'ride_request') {
                            const rData = event.message.ride_data;
                            const rId = rData.id || rData.ride_id;
                            if (!ignoredRequests.has(rId)) {
                                setActiveRequest({
                                    id: rId,
                                    pickup_location: rData.pickup_location || rData.pickup,
                                    destination: rData.destination,
                                    estimated_fare: rData.estimated_fare || rData.fare || rData.total_fare,
                                    duration_text: rData.duration_text || "Calculated soon"
                                });
                                // Auto dismiss 30s
                                setTimeout(() => setActiveRequest(prev => prev?.id === rId ? null : prev), 30000);
                            }
                        } else if (event.channel === RIDE_UPDATES_CHANNEL && event.message.status === 'accepted') {
                            setActiveRequest(prev => prev?.id === event.message.ride_id ? null : prev);
                        }
                    }
                });
                
                pubnub.subscribe({
                    channels: [RIDE_REQUESTS_CHANNEL, RIDE_UPDATES_CHANNEL]
                });
            }
        }

        return () => {
            if (pubnub) {
                pubnub.unsubscribeAll();
            }
        };
    }, [isOnline, stats?.driver_id, userData.driver_id, userData.user_id, verificationStatus, ignoredRequests]);

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

    // Polling for new rides (backup to WebSockets) has been disabled to prevent auto-fetching old database test rides.
    // Real-time events are now handled cleanly by PubNub.

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
            }
        } catch (e) {
            console.error('Toggle status error:', e);
        } finally {
            setToggleLoading(false);
        }
    };

    const handleAcceptRide = async (rideId) => {
        const { email, user_id } = getAuthStatus();
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/ride/accept/${rideId}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                const driverPubId = stats?.driver_id || userData.driver_id || user_id;
                const pubnub = getPubNubInstance(`driver_${driverPubId}`);
                if (pubnub) {
                    pubnub.publish({
                        channel: RIDE_UPDATES_CHANNEL,
                        message: {
                            ride_id: rideId,
                            status: 'accepted'
                        }
                    });
                }
                setActiveRequest(null);
                navigate('/driver/trip-status', { state: { rideId, rideData: data } });
            } else {
                alert(data.error || "Failed to accept ride");
                setActiveRequest(null);
            }
        } catch (e) {
            console.error('Accept ride error:', e);
        }
    };

    const handleRejectRide = () => {
        if (activeRequest) {
            setIgnoredRequests(prev => new Set([...prev, activeRequest.id]));
        }
        setActiveRequest(null);
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
                        <div className={`flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-full px-4 border border-slate-200 dark:border-slate-700 ${verificationStatus !== 'verified' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                             title={verificationStatus !== 'verified' ? "Verify your license to go online" : ""}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${!isOnline ? 'text-slate-400' : 'text-slate-500'}`}>Offline</span>
                            <label className={`relative flex h-[24px] w-[44px] items-center rounded-full p-1 transition-all ${verificationStatus !== 'verified' || toggleLoading ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed' : (isOnline ? 'bg-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700') + ' cursor-pointer'}`}>
                                <input
                                    type="checkbox"
                                    disabled={verificationStatus !== 'verified' || toggleLoading}
                                    checked={verificationStatus === 'verified' && isOnline}
                                    onChange={handleToggleStatus}
                                    className="sr-only peer"
                                />
                                <div className={`h-4 w-4 rounded-full shadow-sm transition-all ${toggleLoading ? 'scale-75 animate-pulse bg-slate-400' : (isOnline ? 'translate-x-5 bg-emerald-500' : 'bg-white')}`}></div>
                            </label>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>Online</span>
                        </div>
                        <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                        </button>
                    </div>
                </header>

                <div className="p-6 space-y-8 max-w-7xl mx-auto">
                    {/* Verification Status Banners */}
                    {(verificationStatus === 'unverified' || !verificationStatus || verificationStatus === 'null') && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="p-8 rounded-2xl bg-primary text-background-dark shadow-[0_0_40px_rgba(13,204,242,0.3)] border border-primary/20 flex flex-col md:flex-row items-center gap-6">
                            <div className="size-16 rounded-full bg-background-dark/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-4xl">warning</span>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black tracking-tight mb-1">Driver Verification Required</h3>
                                <p className="font-semibold opacity-90">Please upload your driving license to start accepting real ride requests.</p>
                            </div>
                            <button onClick={() => navigate('/driver/license')}
                                className="px-10 py-4 bg-background-dark text-primary rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-all active:scale-95 shrink-0">
                                Start Verification
                            </button>
                        </motion.div>
                    )}

                    {(verificationStatus === 'pending' || verificationStatus === 'rejected') && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                                verificationStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' : 'bg-primary/10 border-primary/20 text-primary-dark dark:text-primary'
                            }`}>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined">{verificationStatus === 'rejected' ? 'error' : 'info'}</span>
                                <div>
                                    <p className="font-bold text-sm">{verificationStatus === 'rejected' ? 'Verification Rejected' : 'Verification Pending'}</p>
                                    <p className="text-xs opacity-80">{verificationStatus === 'rejected' ? 'Please re-submit clear documents.' : 'We are currently reviewing your documents.'}</p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/driver/license')}
                                className={`px-5 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 ${verificationStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-primary text-background-dark shadow-lg'}`}>
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

                        {/* Right Column: Live Requests */}
                        <div className="space-y-8">
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">Live Feed</h2>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-500/20 text-emerald-500 animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                                        {isOnline ? 'Active' : 'Offline'}
                                    </span>
                                </div>

                                {activeRequest ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-primary shadow-[0_0_30px_rgba(13,204,242,0.2)] overflow-hidden text-left">
                                        <div className="bg-primary p-3 flex justify-between items-center text-background-dark">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Ride Request</span>
                                            <div className="flex items-center gap-1">
                                                <div className="size-1.5 rounded-full bg-background-dark animate-pulse"></div>
                                                <span className="text-[10px] font-bold uppercase tracking-tighter">Live</span>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="size-2 rounded-full bg-primary mt-1.5 shadow-[0_0_8px_rgba(13,204,242,0.8)]"></div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pickup</p>
                                                        <p className="text-sm font-bold line-clamp-2 leading-snug">{activeRequest.pickup_location}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    <div className="size-2 rounded-full bg-rose-500 mt-1.5 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Destination</p>
                                                        <p className="text-sm font-bold line-clamp-2 leading-snug">{activeRequest.destination}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{activeRequest.duration_text}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                                    <p className="text-[8px] font-black text-primary uppercase tracking-widest">Fare</p>
                                                    <p className="text-sm font-black text-primary italic">₹{activeRequest.estimated_fare}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={handleRejectRide} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">Reject</button>
                                                <button onClick={() => handleAcceptRide(activeRequest.id)} className="flex-[2] py-3 bg-primary text-background-dark font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95">Accept Ride</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="p-8 text-center bg-primary/5 rounded-2xl border-2 border-dashed border-primary/30">
                                        <span className="material-symbols-outlined text-3xl text-primary mb-2 animate-spin">radar</span>
                                        <p className="text-xs font-bold text-primary">Searching for nearby rides...</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </main>
    );
};

export default DriverDashboard;
