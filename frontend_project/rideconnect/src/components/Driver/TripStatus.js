import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';
import { authorizedFetch } from '../../utils/apiUtils';
import { getAuthStatus, clearActiveRide } from '../../utils/authUtils';
import VoiceService from '../../utils/voiceService';
import VoiceAssistant from '../Shared/VoiceAssistant';
import { motion } from 'framer-motion';

const TripStatus = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const rideId = state?.rideId || localStorage.getItem('lastActiveRideId');
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState('cash');

    useEffect(() => {
        if (ride?.payment_method) {
            setSelectedMethod(ride.payment_method);
        }
    }, [ride?.payment_method]);

    const handleMethodChange = async (method) => {
        setSelectedMethod(method);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/payment/method/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ride_id: rideId, method: method })
            });
            if (res.ok) {
                setRide(prev => ({...prev, payment_method: method}));
            }
        } catch (e) {
            console.error("Method sync error:", e);
        }
    };

    useEffect(() => {
        const fetchRideDetails = async () => {
            setLoading(true);
            setError(null);
            
            const targetRideId = rideId || state?.rideId;
            
            if (!targetRideId) {
                // Try fetching automatically from active endpoint if no ID in state/local
                try {
                    const activeRes = await authorizedFetch(`${API_BASE_URL}/api/ride/active/`);
                    if (activeRes.ok) {
                        const activeData = await activeRes.json();
                        if (activeData && activeData.id) {
                            setRide(activeData);
                            localStorage.setItem('lastActiveRideId', activeData.id);
                            setLoading(false);
                            return;
                        }
                    }
                } catch (err) { console.error("Active check failed:", err); }
                
                setError("No active trip found.");
                setLoading(false);
                return;
            }

            try {
                const res = await authorizedFetch(`${API_BASE_URL}/api/ride/${targetRideId}/status/`);
                if (res.ok) {
                    const data = await res.json();
                    setRide(data);
                    localStorage.setItem('lastActiveRideId', targetRideId);
                } else {
                    setError("Failed to load trip details.");
                }
            } catch (e) {
                console.error("Error fetching ride details:", e);
                setError("Network error loading trip.");
            } finally {
                setLoading(false);
            }
        };

        fetchRideDetails();
    }, [rideId, state?.rideId]);

    const handleStartRide = async () => {
        if (!otp) {
            alert("Please enter ride OTP from customer");
            return;
        }
        setVerifying(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/ride/verify-otp/${rideId}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp })
            });
            const data = await res.json();
            if (res.ok) {
                console.log("OTP Verified. Trip Status:", data.status);
                VoiceService.speak("O.T.P. Verified successfully. Your ride has started.", { rate: 0.85 });
                setRide(data);
                setOtp("");
                localStorage.setItem('lastActiveRideId', rideId);
            } else {
                VoiceService.speak("Authentication failed. Please check the O.T.P. and try again.", { rate: 0.9 });
                alert(data.error || "Failed to verify OTP");
            }
        } catch (e) {
            console.error("Start ride error:", e);
        } finally {
            setVerifying(false);
        }
    };

    const [showPaymentStatus, setShowPaymentStatus] = useState(false);
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        let pollInterval;
        if (showPaymentStatus && !isPaid) {
            const checkPayment = async () => {
                try {
                    const res = await authorizedFetch(`${API_BASE_URL}/api/ride/${rideId}/status/`);
                    const data = await res.json();
                    if (data.payment_status === 'SUCCESS' || data.paymentStatus === 'SUCCESS' || data.payment_status === 'paid' || data.status === 'paid') {
                        setIsPaid(true);
                        setRide(data);
                        clearActiveRide();
                        localStorage.removeItem('lastActiveRideId');
                        clearInterval(pollInterval);
                    }
                } catch (e) { console.error("Payment check error:", e); }
            };
            pollInterval = setInterval(checkPayment, 3000);
        }
        return () => clearInterval(pollInterval);
    }, [showPaymentStatus, isPaid, rideId]);

    const handleEndRide = async () => {
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/ride/end/${rideId}/`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                VoiceService.speak("Step 1 of 2. Ride has been completed. Please collect the payment of ₹ " + data.total_fare + " from the customer.", { rate: 0.8 });
                setRide({ ...ride, status: 'completed', payment_status: 'pending', total_fare: data.total_fare });
                setShowPaymentStatus(true);
            } else {
                alert(data.error || "Failed to end ride");
            }
        } catch (e) {
            console.error("End ride error:", e);
        }
    };

    useEffect(() => {
        // Only redirect if there's no ride AND we're not in the payment flow
        // When showPaymentStatus is true, the driver ended the ride and is waiting for payment
        if (!loading && !showPaymentStatus && (!ride || ride.status === 'cancelled')) {
            const timer = setTimeout(() => {
                clearActiveRide();
                localStorage.removeItem('lastActiveRideId');
                navigate('/driver/dashboard', { replace: true });
            }, error ? 3000 : 1500);
            return () => clearTimeout(timer);
        }
    }, [ride, loading, navigate, error, showPaymentStatus]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark text-slate-100 p-8">
                <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-black italic mb-2 tracking-tight">Syncing Trip...</h2>
                <p className="text-slate-400 text-sm font-medium animate-pulse">Connecting to live ride data</p>
            </div>
        );
    }


    if (error || !ride) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark text-slate-100 p-8 text-center uppercase tracking-widest">
                <div className="size-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/20 mb-8">
                    <span className="material-symbols-outlined text-4xl">local_taxi</span>
                </div>
                <h2 className="text-2xl font-black italic mb-3 tracking-tight">{error || "No Active Trip Found"}</h2>
                <p className="text-slate-400 text-xs max-w-xs mx-auto mb-10 leading-relaxed font-bold">
                    You don't have any ongoing trips at the moment. Please return to your driver dashboard.
                </p>
                <button 
                    onClick={() => navigate('/driver/dashboard')}
                    className="w-full max-w-xs py-4 bg-primary text-background-dark font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen">
            <style>
                {`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                `}
            </style>
            <div className="relative flex h-screen w-full flex-col overflow-hidden">
                {/* Top Navigation Bar */}
                <motion.header 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-background-dark/80 backdrop-blur-md border-b border-slate-800/50"
                >
                    <div className="flex items-center gap-3">
                        <div onClick={() => {
                            sessionStorage.setItem('manualDashboard', 'true');
                            navigate('/driver/dashboard');
                        }} className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 transition-colors">
                            <span className="material-symbols-outlined">route</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight text-white italic">Active Trip</h1>
                            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">ID: #{rideId || 'DM-99234'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {ride.status === 'accepted' && (
                            <div className="px-4 py-2 border border-primary/40 rounded-xl bg-primary/5 flex items-center gap-2">
                                <span className="text-[10px] uppercase font-black text-primary">TRIP OTP</span>
                                <span className="text-sm font-black text-white tracking-widest">{ride.otp || 'Waiting for OTP...'}</span>
                            </div>
                        )}
                        <div className="px-4 py-2 border border-blue-400/40 rounded-xl bg-blue-500/5 flex items-center gap-2">
                            <span className="text-[10px] uppercase font-black text-blue-400">FARE</span>
                            <span className="text-sm font-black text-white tracking-widest">₹{ride.total_fare || ride.estimated_fare || '0'}</span>
                        </div>
                        <button className="flex items-center justify-center size-10 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">shield_with_heart</span>
                        </button>
                        <button className="flex items-center justify-center size-10 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-colors">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                </motion.header>

                {/* Main Map Area (Simulated) */}
                <main className="relative flex-1 w-full bg-slate-900">
                    <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAVg0KQCh2Z52yQGdoXJlmOjw7htzLz61GHh1_pElhKLEHqOZ3wQaxtL-ZizsebEkG1xlFYrnsGiD0aGZaMmmoHIVQIQTBCrbIJ3PVFvasH6utAS-js0RttSmuQPdWYSm1wVtcqYZYx2szr8Z7lIk5YyqUs5L4fhI3jdQUboMDVlfbsOgEu1334Mflhe80NHUwZgi1EE_PY8JxfCrzTXkOZ-Vi13Wnh2WAG1Ld6v6nv3_CznvvdO6fXICTOA4KOa09_qtIGG4m6A1U')" }}>
                    </div>
                    {/* Floating Map Controls */}
                    <div className="absolute right-6 top-24 flex flex-col gap-2 z-10">
                        <button className="flex size-11 items-center justify-center rounded-lg bg-background-dark border border-slate-700 shadow-xl text-slate-100 hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined">add</span>
                        </button>
                        <button className="flex size-11 items-center justify-center rounded-lg bg-background-dark border border-slate-700 shadow-xl text-slate-100 hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined">remove</span>
                        </button>
                        <button className="mt-2 flex size-11 items-center justify-center rounded-lg bg-primary text-background-dark shadow-xl hover:brightness-110 transition-colors">
                            <span className="material-symbols-outlined">navigation</span>
                        </button>
                    </div>

                    {/* Destination Indicator */}
                    <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md">
                        <div className="bg-background-dark/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex items-center gap-4 shadow-2xl">
                            <div className="flex-1">
                                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Next Turn</p>
                                <p className="text-lg font-bold text-white">400 ft • Market St.</p>
                            </div>
                            <div className="size-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-3xl">turn_right</span>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Bottom Sheet UI */}
                <motion.section 
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    className="relative z-30 bg-background-dark border-t border-slate-800 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing"
                >
                    <div className="mx-auto w-12 h-1.5 bg-slate-700 rounded-full mt-3 mb-6"></div>
                    <div className="px-6 pb-8 space-y-6 max-w-2xl mx-auto">

                        {/* Customer & Vehicle Info */}
                        {/* Customer & Vehicle Info */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-4 gap-x-2">
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className="relative shrink-0">
                                    {ride.customer?.profile_image ? (
                                        <img src={ride.customer.profile_image} alt="Customer" className="size-16 rounded-2xl object-cover border-2 border-primary/30" />
                                    ) : (
                                        <div className="size-16 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined text-3xl">person</span>
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 size-6 bg-green-500 border-4 border-background-dark rounded-full"></div>
                                </div>
                                <div className="truncate">
                                    <h2 className="text-xl font-bold text-white truncate">{ride.customer?.full_name || ride.customer_name || "Customer"}</h2>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                        <span>Verified Customer</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button className="flex size-12 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700 hover:bg-slate-700 transition-colors shadow-md">
                                    <span className="material-symbols-outlined">chat_bubble</span>
                                </button>
                                <button className="flex size-12 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700 hover:bg-slate-700 transition-colors shadow-md">
                                    <span className="material-symbols-outlined">call</span>
                                </button>
                            </div>
                        </div>

                        {/* Trip Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Journey Progress</p>
                                    <p className="text-sm font-bold text-white line-clamp-1">
                                        {ride.status === 'accepted' ? 'Heading to Pickup' : ride.status === 'ongoing' ? 'In Transit' : 'Arrived at Destination'}
                                    </p>
                                </div>
                                <p className="text-primary font-black italic">{ride.status === 'accepted' ? '25%' : ride.status === 'ongoing' ? '75%' : '100%'}</p>
                            </div>
                            <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: ride.status === 'accepted' ? '25%' : ride.status === 'ongoing' ? '75%' : '100%' }}
                                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-[0_0_15px_rgba(13,204,242,0.3)]"
                                ></motion.div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                                <p className="text-xs text-slate-400 mb-1">Elapsed Time</p>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                                    <p className="text-xl font-bold text-white">12:45</p>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                                <p className="text-xs text-slate-400 mb-1">Remaining</p>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">distance</span>
                                    <p className="text-xl font-bold text-white">3.2 mi</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Button Section with Payment Overlays */}
                        <div className="pt-2 space-y-4">
                            {console.log("Current Ride State:", ride?.status)}
                            {!showPaymentStatus ? (
                                <div className="space-y-4">
                                    {/* Payment Method Selector */}
                                    <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 space-y-3">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] text-center">Select Payment Method</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleMethodChange('cash')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${selectedMethod === 'cash' ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">payments</span>
                                                CASH
                                            </button>
                                            <button 
                                                onClick={() => handleMethodChange('upi')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${selectedMethod === 'upi' ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                                                UPI
                                            </button>
                                        </div>
                                    </div>

                                    {ride.status === 'accepted' ? (
                                        <div className="space-y-4">
                                            <div className="space-y-4 bg-slate-800/30 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] text-center">Verify Ride Identity</p>
                                                {ride.otp && <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] text-center italic">Customer OTP Hint: {ride.otp}</p>}
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        maxLength="4"
                                                        placeholder="0000"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-slate-900/50 border-2 border-white/10 rounded-2xl py-5 text-center text-4xl font-black tracking-[0.5em] text-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-2xl placeholder:opacity-20"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={handleStartRide} disabled={verifying || otp.length < 4}
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]">
                                                <span className="material-symbols-outlined font-bold">{verifying ? 'progress_activity' : 'play_circle'}</span>
                                                {verifying ? 'Verifying OTP...' : 'Start Ride'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={handleEndRide} className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]">
                                            <span className="material-symbols-outlined font-bold">check_circle</span>
                                            End Ride
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {!isPaid ? (
                                        <div className="bg-slate-800/80 p-6 rounded-[2rem] border-2 border-primary/20 flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in duration-500">
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black text-white">Ride Completed Successfully</h3>
                                                <p className="text-sm text-slate-400">Please collect <span className="text-primary font-black">₹{ride.total_fare || ride.estimated_fare}</span></p>
                                                <p className="text-xs uppercase font-black text-white px-3 py-1 bg-slate-700/50 rounded-lg inline-block mt-2">
                                                    Method: {ride.payment_method?.toUpperCase() || 'UPI'}
                                                </p>
                                            </div>
                                            
                                            {(!ride.payment_method || ride.payment_method === 'upi') ? (
                                                <>
                                                    <div className="bg-white p-3 rounded-2xl shadow-2xl">
                                                        <img 
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${ride.driver?.upi_id || 'rideconnect@upi'}&pn=${encodeURIComponent(ride.driver?.name || 'RideConnect Driver')}&am=${ride.total_fare || ride.estimated_fare}&cu=INR`)}`} 
                                                            alt="Payment QR" 
                                                            className="size-44"
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-center gap-3 w-full">
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                                            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Wait for payment confirmation</p>
                                                        </div>
                                                        <p className="text-[9px] text-slate-500 uppercase font-bold max-w-[200px]">Dashboard will auto-refresh once payment is verified</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex flex-col items-center gap-3 w-full">
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                            <span className="material-symbols-outlined text-emerald-500 text-lg">payments</span>
                                                            <p className="text-[12px] font-black uppercase text-emerald-500 tracking-widest">Collect cash from customer</p>
                                                        </div>
                                                        <p className="text-[9px] text-slate-500 uppercase font-bold max-w-[200px]">Once received, confirm the payment below</p>
                                                    </div>
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const res = await authorizedFetch(`${API_BASE_URL}/api/payment/complete/`, {
                                                                    method: 'POST',
                                                                    body: JSON.stringify({ ride_id: rideId })
                                                                });
                                                                if (res.ok) {
                                                                     setIsPaid(true);
                                                                }
                                                            } catch (e) {
                                                                console.error("Error confirming cash", e);
                                                            }
                                                        }}
                                                        className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                                                    >
                                                        Confirm Payment Received
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-500 p-8 rounded-[2rem] flex flex-col items-center gap-6 text-center text-background-dark animate-in zoom-in-95 duration-500">
                                            <div className="size-20 rounded-full bg-background-dark/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-5xl font-black">check_circle</span>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-3xl font-black tracking-tight">Payment Received!</h3>
                                                <p className="font-bold opacity-80 uppercase tracking-widest text-xs">₹{ride.total_fare || ride.estimated_fare} Added to Wallet</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    clearActiveRide();
                                                    localStorage.removeItem('lastActiveRideId');
                                                    // Clear state AFTER navigation to prevent the redirect useEffect from firing
                                                    navigate('/driver/dashboard', { replace: true });
                                                    // Delayed cleanup to avoid race conditions
                                                    setTimeout(() => {
                                                        setRide(null);
                                                        setOtp("");
                                                        setShowPaymentStatus(false);
                                                    }, 100);
                                                }}
                                                className="w-full bg-background-dark text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                                            >
                                                Go to Dashboard
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {!isPaid && (
                                <p className="text-center text-[10px] text-slate-500 mt-2 italic uppercase tracking-widest font-bold">
                                    Trip ID: #{rideId} • Status: {ride.status.toUpperCase()}
                                </p>
                            )}

                            {/* Voice Control for Trip */}
                            <div className="flex flex-col items-center pt-6 border-t border-slate-700/30">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Voice Control</p>
                                <VoiceAssistant 
                                    placeholder="Try saying 'End ride' or 'Start trip'"
                                    onCommand={(cmd) => {
                                        const cleanCmd = cmd.toLowerCase();
                                        if (cleanCmd.includes('start') || cleanCmd.includes('begin')) {
                                            if (otp.length === 4) handleStartRide();
                                            else VoiceService.speak("Please enter the O.T.P. first.", { rate: 0.9 });
                                        }
                                        if (cleanCmd.includes('end') || cleanCmd.includes('finish') || cleanCmd.includes('complete')) {
                                            if (ride.status !== 'accepted') handleEndRide();
                                            else VoiceService.speak("Ride must be started before it can be ended.", { rate: 0.9 });
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default TripStatus;
