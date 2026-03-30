import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RideRequestNotification from './RideRequestNotification';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import { getPubNubInstance, RIDE_REQUESTS_CHANNEL, RIDE_UPDATES_CHANNEL } from '../../utils/pubnubService';

const DriverDashboard = () => {
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [availableRides, setAvailableRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vehicleType, setVehicleType] = useState(null);
    const [activeRideRequest, setActiveRideRequest] = useState(null);
    const [socket, setSocket] = useState(null);
    const [driverId, setDriverId] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const email = sessionStorage.getItem('user_email');

    useEffect(() => {
        if (!email) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch verification status
                const vRes = await authorizedFetch(`${API_BASE_URL}/api/driver/verification-status/?email=${encodeURIComponent(email)}`);
                const vData = await vRes.json();
                const status = vData.verification_status || 'unverified';
                setVerificationStatus(status);
                setVehicleType(vData.vehicle_type);
                setIsOnline(vData.is_online || false);
                setDriverId(vData.id);

                // If approved, fetch available rides
                if (status === 'verified') {
                    const rRes = await authorizedFetch(`${API_BASE_URL}/api/ride/available/?email=${encodeURIComponent(email)}`);
                    if (rRes.ok) {
                        const rData = await rRes.json();
                        setAvailableRides(rData);
                    }

                    // Setup WebSocket for real-time ride requests
                    const vt = vData.vehicle_type || 'car';
                    // The driver connects to their specific group
                    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/driver/${vData.id}/?vehicle_type=${vt}`;
                    const ws = new WebSocket(wsUrl);
                    
                    ws.onopen = () => console.log(`Connected to driver socket (ID: ${vData.id}) for ${vt}`);
                    ws.onmessage = (e) => {
                        const data = JSON.parse(e.data);
                        if (data.type === 'new_ride_request') {
                            console.log("New ride request received:", data.ride_data);
                            setActiveRideRequest(data.ride_data);
                        } else if (data.type === 'ride_taken') {
                            console.log("Ride taken by another driver:", data.ride_id);
                            if (activeRideRequest && activeRideRequest.id === data.ride_id) {
                                setActiveRideRequest(null);
                            }
                            // Also refresh available rides list
                            authorizedFetch(`${API_BASE_URL}/api/ride/available/?email=${encodeURIComponent(email)}`)
                                .then(res => res.json())
                                .then(data => setAvailableRides(data));
                        }
                    };
                    ws.onerror = (err) => console.error("WS Error:", err);
                    ws.onclose = () => console.log("Ride socket closed");
                    setSocket(ws);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        const interval = setInterval(() => {
            if (verificationStatus === 'verified') {
                authorizedFetch(`${API_BASE_URL}/api/ride/available/?email=${encodeURIComponent(email)}`)
                    .then(res => res.json())
                    .then(data => setAvailableRides(data))
                    .catch(err => console.error('Error refreshing rides:', err));
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            if (socket) socket.close();
        };
    }, [email, navigate, verificationStatus]);

    // Separate Polling Effect for Verification Status
    useEffect(() => {
        if (!email || verificationStatus === 'verified') return;

        const pollStatus = async () => {
            try {
                const res = await authorizedFetch(`${API_BASE_URL}/api/driver/verification-status/?email=${encodeURIComponent(email)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.verification_status !== verificationStatus) {
                        setVerificationStatus(data.verification_status);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        const statusInterval = setInterval(pollStatus, 10000); // Poll every 10s

        /* --- Location Tracking --- */
        let watchId = null;
        if ("geolocation" in navigator) {
            watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        await authorizedFetch(`${API_BASE_URL}/api/driver/update-location/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ lat: latitude, lng: longitude })
                        });
                        console.log("Location updated:", latitude, longitude);
                    } catch (err) {
                        console.error("Failed to update location:", err);
                    }
                },
                (err) => console.error("Geolocation error:", err),
                { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
            );
        }

        return () => {
            clearInterval(statusInterval);
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [email, verificationStatus]);

    // PubNub Real-Time Integration
    useEffect(() => {
        if (!driverId || verificationStatus !== 'verified') return;

        let pubnub = null;
        if (isOnline) {
            pubnub = getPubNubInstance(`driver_${driverId}`);
            if (pubnub) {
                pubnub.addListener({
                    message: (event) => {
                        if (event.channel === RIDE_REQUESTS_CHANNEL && event.message.type === 'ride_request') {
                            console.log("PubNub ride request received:", event.message.ride_data);
                            setActiveRideRequest(event.message.ride_data);
                        } else if (event.channel === RIDE_UPDATES_CHANNEL && event.message.status === 'accepted') {
                            console.log("PubNub ride accepted by another driver:", event.message.ride_id);
                            setActiveRideRequest(prev => {
                                if (prev && prev.id === event.message.ride_id) {
                                    return null;
                                }
                                return prev;
                            });
                            // Refresh list
                            authorizedFetch(`${API_BASE_URL}/api/ride/available/?email=${encodeURIComponent(email)}`)
                                .then(res => res.json())
                                .then(data => setAvailableRides(data));
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
    }, [isOnline, driverId, verificationStatus, email]);

    const handleAcceptRide = async (rideId) => {
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/ride/accept/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ride_id: rideId, driver_email: email })
            });
            if (res.ok) {
                // Publish accept to PubNub
                const pubnub = getPubNubInstance(`driver_${driverId}`);
                if (pubnub) {
                    pubnub.publish({
                        channel: RIDE_UPDATES_CHANNEL,
                        message: {
                            ride_id: rideId,
                            status: 'accepted'
                        }
                    });
                }
                setActiveRideRequest(null);
                
                // Get full ride details if available in availableRides or activeRideRequest
                // Navigate to tracking
                navigate('/driver/navigation', { state: { rideId: rideId } });
            } else {
                const error = await res.json();
                alert(error.error || "Failed to accept ride");
                setActiveRideRequest(null);
            }
        } catch (err) {
            console.error("Error accepting ride:", err);
        }
    };

    const handleDeclineRide = () => {
        setActiveRideRequest(null);
    };

    const toggleOnlineStatus = async () => {
        if (togglingStatus) return;
        setTogglingStatus(true);
        try {
            const newStatus = !isOnline;
            const res = await authorizedFetch(`${API_BASE_URL}/api/driver/status-toggle/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, is_online: newStatus })
            });

            if (res.ok) {
                const data = await res.json();
                setIsOnline(data.is_online);
            } else {
                console.error("Failed to toggle status");
                alert("Failed to update status. Please try again.");
            }
        } catch (err) {
            console.error("Error toggling status:", err);
            alert("Network error while updating status.");
        } finally {
            setTogglingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen relative">
            <style>
                {`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                .fill-icon {
                    font-variation-settings: 'FILL' 1;
                }
                `}
            </style>

            {/* Ride Request Notification Overlay */}
            {activeRideRequest && (
                <RideRequestNotification 
                    rideData={activeRideRequest} 
                    onAccept={handleAcceptRide}
                    onDecline={handleDeclineRide}
                />
            )}

            {/* Verification Required Overlay */}
            {verificationStatus !== 'verified' && (
                <div className="fixed inset-0 z-[100] bg-background-dark/80 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
                        <div className="size-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(13,204,242,0.15)]">
                            <span className="material-symbols-outlined text-4xl text-primary">
                                {verificationStatus === 'pending' ? 'schedule' : 'lock'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black mb-3">
                            {verificationStatus === 'pending' ? 'Verification Pending' : 'Account Verification Required'}
                        </h2>
                        <p className="text-slate-400 mb-8">
                            {verificationStatus === 'pending' 
                                ? "Our team is currently reviewing your documents. You'll receive an email once your account is activated." 
                                : "To start accepting rides and accessing your driver tools, please complete your profile verification."}
                        </p>
                        
                        <div className="space-y-4">
                            {verificationStatus !== 'pending' && (
                                <button 
                                    onClick={() => navigate('/driver/license')}
                                    className="w-full py-4 bg-primary text-background-dark font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    Complete Verification <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            )}
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all border border-slate-700"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex min-h-screen overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark hidden lg:flex flex-col">
                    <div className="p-6 flex items-center gap-3">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark">
                            <span className="material-symbols-outlined font-bold">directions_car</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">RideConnect</h1>
                    </div>
                    <nav className="flex-1 px-4 space-y-2 mt-4">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary cursor-pointer">
                            <span className="material-symbols-outlined fill-icon">dashboard</span>
                            <span className="font-medium">Dashboard</span>
                        </div>
                        <div onClick={() => navigate('/driver/profile')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">person</span>
                            <span className="font-medium">Profile</span>
                        </div>
                        <div onClick={() => navigate('/driver/earnings')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">payments</span>
                            <span className="font-medium">Earnings</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">history</span>
                            <span className="font-medium">History</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">chat</span>
                            <span className="font-medium">Support</span>
                        </div>
                        <div onClick={() => navigate('/driver/settings')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">settings</span>
                            <span className="font-medium">Settings</span>
                        </div>
                    </nav>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={() => navigate('/login')}>
                            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgZ7fSWPODUkZuszz1zA10t5eTjEOSgNK0D_1TPAmI2DEEYOw0QuciTVQjuQnQd9k0un0kGIHPnqohU71Y4HUcS2woGmnwRpNscvYllEPwglYAxdbcKkMNyy7PqwP4V6I2Iv7KRdbhdTkGC0_6lmjAQZMd0jRDhxFA3UA0lQhFxeaqqFVPEG0uq-FmgwdkjMWXtIjUFwSB5RHJRonkuAL5qlU-xsJnawXHgj6vAo-0ub0hiI16bMw59tj0J0q_eWP18Zza0tn7v6I" alt="Driver Portrait" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">Alex Driver</span>
                                <span className="text-xs text-red-500 font-medium hover:underline mt-1">Logout</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark/50">
                    {/* Top Header */}
                    <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dashboard</h2>
                        </div>
                        <div className="flex items-center gap-6">
                            {/* Status Toggle */}
                            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-full px-4 border border-slate-200 dark:border-slate-700">
                                <span className={`text-xs font-bold uppercase tracking-wider ${!isOnline ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>Offline</span>
                                <label className={`relative flex h-[24px] w-[44px] cursor-pointer items-center rounded-full p-1 transition-colors ${isOnline ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'} ${togglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={isOnline}
                                        onChange={toggleOnlineStatus}
                                        disabled={togglingStatus}
                                    />
                                    <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isOnline ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </label>
                                <span className={`text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-primary' : 'text-slate-400 dark:text-slate-600'}`}>Online</span>
                            </div>
                            <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                            </button>
                        </div>
                    </header>

                    <div className="p-6 space-y-8 max-w-7xl mx-auto">
                        {/* Stats Grid */}
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">Total Trips</p>
                                        <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">1,284</h3>
                                    </div>
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <span className="material-symbols-outlined">route</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-emerald-500 text-sm font-medium">
                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                    <span>+12% this month</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">Rating</p>
                                        <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">4.95</h3>
                                    </div>
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <span className="material-symbols-outlined fill-icon">star</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-emerald-500 text-sm font-medium">
                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                    <span>+0.02% higher</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">Hours Online</p>
                                        <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">142h</h3>
                                    </div>
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <span className="material-symbols-outlined">schedule</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-emerald-500 text-sm font-medium">
                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                    <span>+5% from last week</span>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Earnings & Activity */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Earnings Summary */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Earnings Summary</h2>
                                        <button onClick={() => navigate('/driver/earnings')} className="text-primary text-sm font-semibold hover:underline">View Detailed Report</button>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800">
                                            <div className="p-6 text-center">
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today</p>
                                                <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">$142.50</p>
                                            </div>
                                            <div className="p-6 text-center bg-slate-50/50 dark:bg-primary/5">
                                                <p className="text-xs font-semibold text-primary uppercase tracking-wider">This Week</p>
                                                <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">$892.20</p>
                                            </div>
                                            <div className="p-6 text-center">
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Balance</p>
                                                <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">$4,250.00</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
                                            <div className="h-32 w-full bg-gradient-to-t from-primary/10 to-transparent rounded-lg flex items-end px-4 gap-2">
                                                {/* Mock Chart Bars */}
                                                <div className="flex-1 bg-primary/20 h-[40%] rounded-t-sm"></div>
                                                <div className="flex-1 bg-primary/20 h-[60%] rounded-t-sm"></div>
                                                <div className="flex-1 bg-primary/20 h-[35%] rounded-t-sm"></div>
                                                <div className="flex-1 bg-primary/20 h-[80%] rounded-t-sm"></div>
                                                <div className="flex-1 bg-primary/20 h-[50%] rounded-t-sm"></div>
                                                <div className="flex-1 bg-primary/20 h-[90%] rounded-t-sm"></div>
                                                <div className="flex-1 bg-primary h-[70%] rounded-t-sm"></div>
                                            </div>
                                            <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-slate-400 uppercase">
                                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span className="text-primary">Sun</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Recent Activity */}
                                <section>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Completed Rides</h2>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                    <span className="material-symbols-outlined">person_pin_circle</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">Airport Transfer - Terminal 2</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Completed 2h ago • Luxury SUV</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900 dark:text-white">+$45.00</p>
                                                <p className="text-xs text-emerald-500 font-medium">Paid</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                    <span className="material-symbols-outlined">shopping_bag</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">Westside Mall - Central Plaza</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Completed 4h ago • Executive Sedan</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900 dark:text-white">+$22.50</p>
                                                <p className="text-xs text-emerald-500 font-medium">Paid</p>
                                            </div>
                                        </div>

                                        <button className="w-full py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Show All History</button>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Ride Requests */}
                            <div className="space-y-8">
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Live Requests</h2>
                                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase animate-pulse">Live</span>
                                    </div>
                                    <div className="space-y-4">
                                        {availableRides.length > 0 ? (
                                            availableRides.map((ride) => (
                                                <div key={ride.id} className="bg-white dark:bg-slate-800/40 rounded-xl border-2 border-primary overflow-hidden shadow-lg shadow-primary/5">
                                                    <div className="p-4 bg-primary text-background-dark flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-xl">timer</span>
                                                            <span className="font-bold">{ride.duration_text || 'New Request'}</span>
                                                        </div>
                                                        <span className="text-xs font-bold px-2 py-1 bg-white/30 rounded uppercase">{ride.vehicle_type}</span>
                                                    </div>
                                                    <div className="p-5 space-y-4">
                                                        <div className="flex gap-4">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="size-3 rounded-full border-2 border-primary bg-white"></div>
                                                                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
                                                                <div className="size-3 rounded-full bg-primary"></div>
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div className="leading-none">
                                                                    <p className="text-xs font-bold text-slate-400 uppercase">Pickup</p>
                                                                    <p className="font-semibold text-slate-900 dark:text-white truncate">{ride.pickup_location}</p>
                                                                </div>
                                                                <div className="leading-none">
                                                                    <p className="text-xs font-bold text-slate-400 uppercase">Drop-off</p>
                                                                    <p className="font-semibold text-slate-900 dark:text-white truncate">{ride.destination}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Type</span>
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{ride.vehicle_type}</span>
                                                            </div>
                                                            <div className="flex flex-col text-right">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Fare</span>
                                                                <span className="text-sm font-bold text-primary">₹{ride.estimated_fare}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Decline</button>
                                                            <button onClick={() => handleAcceptRide(ride.id)} className="flex-[2] py-3 rounded-lg bg-primary text-background-dark font-bold hover:brightness-110 transition-all">Accept Trip</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                                                <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                    <span className="material-symbols-outlined text-3xl">radar</span>
                                                </div>
                                                <p className="text-slate-500 font-medium">Looking for rides nearby...</p>
                                                <p className="text-xs text-slate-400 mt-1">Pending requests for your vehicle type will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Map Preview */}
                                <section className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                        <h3 className="font-bold text-slate-900 dark:text-white">Nearby Demand</h3>
                                    </div>
                                    <div className="relative aspect-square">
                                        <img className="w-full h-full object-cover grayscale brightness-50 contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDrsYIsUETvJf9zEGgFyCK2kmbkwW1DGOflCc9YZl4Sy8xUAo7Lpohhv3ijTj5J6kGefMiDYVKYVb-jCrsukE0ArleylKX_7Gderd3-Dn5KtLueOnioaM8R2vLy9yZB30ByINpfq1d7LPZR9kLH5e0LgdmjfqCE0f5TxXF5MjZ5TV4H9ZdpWkvfLrVYgK_x2WUMuxvwPd9dvs067pWCHr_eONpmwWEpD9uf41pW5gpcAMxdgBPpEOSXmtNJZXDep7DOoOyy4mvWPk" alt="Map" />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="size-24 rounded-full bg-primary/20 border border-primary animate-pulse flex items-center justify-center">
                                                <div className="size-4 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 bg-background-dark/90 backdrop-blur-sm p-3 rounded-lg border border-slate-700">
                                            <p className="text-xs font-bold text-primary uppercase">Hotspot Alert</p>
                                            <p className="text-sm text-white font-medium mt-1">High demand in Downtown Arts District</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DriverDashboard;
