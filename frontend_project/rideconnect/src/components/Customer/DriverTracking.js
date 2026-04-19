import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';
import { getAuthStatus, clearActiveRide } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import LiveTrackingMap from './LiveTrackingMap';
import PaymentModal from './PaymentModal';
import VoiceService from '../../utils/voiceService';
import VoiceAssistant from '../Shared/VoiceAssistant';
import { motion } from 'framer-motion';

const DriverTracking = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const rideId = state?.rideId || localStorage.getItem('lastActiveRideId');
    const [rideStatus, setRideStatus] = useState(state?.rideStatus || 'accepted');
    const [driverData, setDriverData] = useState(state?.driverData || null);
    const [rideData, setRideData] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [finalPrice, setFinalPrice] = useState(0);

    useEffect(() => {
        const { isAuthenticated, email } = getAuthStatus();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (rideId) {
            localStorage.setItem('lastActiveRideId', rideId);
        } else {
            // If no rideId even in localStorage, go back to dashboard
            const savedId = localStorage.getItem('lastActiveRideId');
            if (!savedId) {
                navigate('/customer/dashboard');
                return;
            }
        }

        const handleRideCompleted = (rideData) => {
            const hasAutoOpened = sessionStorage.getItem(`auto_opened_payment_${rideId}`);
            if (!hasAutoOpened) {
                // Ensure text is read out using our VoiceService wrapper.
                VoiceService.speak("Your ride has been completed. Mee ride complete ayyindi", { rate: 0.95 });
                alert("Your destination is completed 🎉");
                
                setTimeout(() => {
                    setShowPaymentModal(true);
                    sessionStorage.setItem(`auto_opened_payment_${rideId}`, 'true');
                }, 2000);
            }
        };

        const fetchRideDetails = async () => {
            try {
                // Try direct ride status endpoint first for faster sync
                const directRes = await authorizedFetch(`${API_BASE_URL}/api/ride/${rideId}/status/`);
                if (directRes.ok) {
                    const data = await directRes.json();
                    setRideData(data);
                    setRideStatus(data.status);
                    if (data.driver) setDriverData(data.driver);
                    
                    if (data.status === 'completed' || data.status === 'COMPLETED') {
                        const finalAmt = data.total_fare || data.estimated_fare || 0;
                        setFinalPrice(finalAmt);
                        const isPending = data.paymentStatus === 'PENDING' || data.paymentStatus === 'pending' || !data.paymentStatus;
                        
                        if (isPending) {
                            handleRideCompleted(data);
                        }
                    } else if (data.status === 'paid' || data.paymentStatus === 'SUCCESS' || data.paymentStatus === 'completed') {
                         navigate('/customer/dashboard');
                    }
                    return; // Successfully loaded from direct API
                }

                // Fallback to history if direct failed
                const res = await authorizedFetch(`${API_BASE_URL}/api/ride/history/?email=${email}&role=customer`);
                const data = await res.json();
                if (res.ok) {
                    const currentRide = data.find(r => r.id == rideId);
                    if (currentRide) {
                        setRideData(currentRide);
                        setRideStatus(currentRide.status);
                        if (currentRide.driver) setDriverData(currentRide.driver);
                        
                        if (currentRide.status === 'completed' || currentRide.status === 'COMPLETED') {
                            const finalAmt = currentRide.total_fare || currentRide.estimated_fare || 0;
                            setFinalPrice(finalAmt);
                            const isPending = currentRide.paymentStatus === 'PENDING' || currentRide.paymentStatus === 'pending' || !currentRide.paymentStatus;
                            if (isPending) {
                                handleRideCompleted(currentRide);
                            }
                        } else if (currentRide.status === 'paid' || currentRide.paymentStatus === 'SUCCESS' || currentRide.paymentStatus === 'completed') {
                             navigate('/customer/dashboard');
                        }
                    }
                }
            } catch (e) {
                console.error("Fetch ride error:", e);
            }
        };

        fetchRideDetails();
        
        // Add polling every 3 seconds as requested
        const pollInterval = setInterval(fetchRideDetails, 3000);

        const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/ride/${email}/`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log("Customer WS Update:", data);
            
            if (data.type === 'ride_update') {
                const newStatus = data.status || data.ride_status;
                if (newStatus) {
                    setRideStatus(newStatus);
                    // Refresh ride data to get latest OTP and payment status
                    if (data.ride_data) {
                        setRideData(data.ride_data);
                    }
                    
                    // Voice Guidance on status change
                    if (newStatus === 'accepted') {
                        VoiceService.speak("A driver has been assigned. Your ride will arrive in approximately 3 minutes.", { rate: 0.85 });
                    } else if (newStatus === 'ongoing' || newStatus === 'en_route') {
                        VoiceService.speak("Step 2 of 2. Your OTP has been verified. The trip has commenced. Please wear your seatbelt.", { rate: 0.8 });
                    } else if (newStatus === 'completed' || newStatus === 'COMPLETED') {
                        const finalAmt = data.amount || data.ride_data?.total_fare || data.estimated_fare || 0;
                        setFinalPrice(finalAmt);
                        
                        // Check if we should open payment modal
                        const isPending = data.paymentStatus === 'PENDING' || data.paymentStatus === 'pending' || data.ride_data?.paymentStatus === 'PENDING' || !data.paymentStatus;
                        if (isPending) {
                            handleRideCompleted(data);
                        }
                    } else if (newStatus === 'paid' || data.paymentStatus === 'SUCCESS' || data.paymentStatus === 'completed') {
                        VoiceService.speak("Payment has been processed. Thank you for riding with us. Have a pleasant day.", { rate: 0.85 });
                        setRideStatus('paid');
                        if (!showPaymentModal) {
                            setTimeout(() => navigate('/customer/dashboard'), 3000);
                        }
                    }
                }
            }
        };

        return () => {
            ws.close();
            clearInterval(pollInterval);
        };
    }, [navigate, rideId, rideStatus]);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden min-h-screen">
            <div className="relative h-screen w-full flex flex-col">
                {/* Top Navigation Bar */}
                <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-slate-100">arrow_back</span>
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                            sessionStorage.setItem('manualDashboard', 'true');
                            navigate('/customer/dashboard');
                        }}>
                            <div className="size-6 text-primary">
                                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
                                    <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
                                </svg>
                            </div>
                            <h2 className="text-white text-lg font-bold leading-tight tracking-tight">RideConnect</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Secure Session</span>
                            <span className="text-xs text-primary font-medium flex items-center gap-1">
                                <span className="size-1.5 bg-primary rounded-full animate-pulse"></span> Encrypted
                            </span>
                        </div>
                        <button className="bg-primary/10 text-primary p-2 rounded-lg hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                </header>

                {/* Main Content Area (Interactive Map Background) */}
                <main className="flex-1 relative bg-slate-900 overflow-hidden">
                    {rideStatus !== 'completed' && rideStatus !== 'paid' ? (
                        <>
                            {rideData ? (
                                <LiveTrackingMap
                                    rideId={rideId}
                                    pickupCoords={[rideData.pickup_lat, rideData.pickup_lng]}
                                    dropCoords={[rideData.drop_lat, rideData.drop_lng]}
                                    initialDriverCoords={rideData.driver_lat ? [rideData.driver_lat, rideData.driver_lng] : null}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-background-dark">
                                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="mt-4 text-slate-400 font-medium">Syncing ride data...</p>
                                </div>
                            )}

                            {/* Safety SOS Button Overlay */}
                            <div className="absolute right-6 top-24 z-30 flex flex-col gap-3">
                                <button className="flex items-center justify-center size-12 rounded-xl bg-background-dark/90 border border-white/10 text-slate-100 shadow-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined">layers</span>
                                </button>
                                <button className="flex items-center justify-center size-12 rounded-xl bg-background-dark/90 border border-white/10 text-slate-100 shadow-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined">near_me</span>
                                </button>
                                <button className="flex items-center justify-center size-12 rounded-xl bg-red-600/20 border border-red-500/50 text-red-500 shadow-xl backdrop-blur-md group hover:bg-red-600 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">shield_with_heart</span>
                                </button>
                            </div>

                            {/* Floating Status Bar */}
                            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-6 py-2.5 bg-background-dark/90 backdrop-blur-xl border border-primary/30 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex size-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
                                    </span>
                                    <span className="text-xs font-bold tracking-widest text-primary uppercase">Live Tracking</span>
                                </div>
                                <div className="h-4 w-px bg-white/10"></div>
                                <p className="text-sm font-medium text-slate-100">ETA: <span className="text-primary font-bold">{rideStatus === 'accepted' ? '3 mins' : 'In Progress'}</span></p>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-background-dark">
                             <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                 <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
                                     {rideStatus === 'completed' ? 'pending_actions' : 'verified_user'}
                                 </span>
                             </div>
                             <h3 className="text-2xl font-black text-white">
                                 {rideStatus === 'completed' ? 'Ride Completed' : 'Payment Successful'}
                             </h3>
                             <p className="text-slate-400 font-medium">
                                 {rideStatus === 'completed' ? 'Waiting for payment confirmation...' : 'Redirecting to dashboard...'}
                             </p>
                        </div>
                    )}
                </main>

                {/* Bottom-Docked Card (Only show if not completed) */}
                {rideStatus !== 'completed' && rideStatus !== 'paid' && (
                    <footer className="absolute bottom-0 left-0 right-0 z-50 p-6 md:px-12 md:pb-8 pointer-events-none">
                        <motion.div 
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            className="max-w-4xl mx-auto w-full bg-background-dark border border-white/10 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] pointer-events-auto overflow-hidden cursor-grab active:cursor-grabbing"
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1"></div>
                            {/* Status Strip */}
                            <div className="bg-primary/10 px-6 py-2 border-b border-primary/20">
                                <p className="text-primary text-xs font-bold uppercase tracking-widest">
                                    {rideStatus === 'accepted' ? 'Driver is on the way' : 'Ride in progress'}
                                </p>
                            </div>
                            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                                {/* Driver Profile & Info */}
                                <div className="flex items-center gap-5 flex-1 w-full cursor-pointer" onClick={() => navigate('/customer/trip-status')}>
                                    <div className="relative group">
                                        <div className="size-20 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-lg bg-slate-800 flex items-center justify-center">
                                            {driverData?.user?.profile_picture || driverData?.profile_image ? (
                                                <img alt="Driver Profile" className="w-full h-full object-cover" src={driverData?.user?.profile_picture || driverData?.profile_image} />
                                            ) : (
                                                <span className="material-symbols-outlined text-4xl text-slate-600">person</span>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-background-dark border border-white/10 rounded-lg px-2 py-0.5 flex items-center gap-1 shadow-md">
                                            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="text-xs font-bold text-slate-100">4.9</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Start OTP</span>
                                        <span className="text-2xl font-black text-white tracking-widest">{rideStatus === 'accepted' ? (rideData?.otp || "----") : "STARTED"}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-extrabold text-slate-100 mb-1">{driverData?.user?.first_name || driverData?.full_name || "Assigned Driver"}</h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="text-sm text-slate-400 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-primary text-sm">
                                                    {driverData?.vehicle_type === 'bike' ? 'motorcycle' : 'directions_car'}
                                                </span>
                                                {driverData?.vehicle_details || `${driverData?.vehicle_type || 'Vehicle'} assigned`}
                                            </span>
                                            <div className="size-1 bg-slate-600 rounded-full"></div>
                                            <span className="text-sm font-mono text-primary font-bold tracking-wider">{driverData?.license_plate || "RIDE-CONNECT"}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* CTA Buttons */}
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-background-dark px-6 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        <span className="material-symbols-outlined">call</span>
                                        Call
                                    </button>
                                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 text-slate-100 border border-white/10 px-6 py-3.5 rounded-xl font-bold transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]">
                                        <span className="material-symbols-outlined">chat_bubble</span>
                                        Message
                                    </button>
                                </div>
                            </div>
                            {/* Live Updates Progress */}
                            <div className="h-1.5 w-full bg-slate-800 relative">
                                <div className="absolute left-0 top-0 h-full bg-primary rounded-r-full shadow-[0_0_10px_rgba(13,204,242,0.5)]" style={{ width: rideStatus === 'accepted' ? '30%' : '75%' }}></div>
                            </div>
                        </motion.div>
                    </footer>
                )}

                {/* Payment Modal / Page */}
                <PaymentModal 
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    ride={{
                        id: rideId,
                        total_fare: finalPrice,
                        distance: rideData?.distance || 0,
                        status: rideStatus,
                        paymentStatus: rideData?.paymentStatus || (rideStatus === 'paid' ? 'SUCCESS' : 'PENDING'),
                        driver: {
                            name: driverData?.user?.full_name || driverData?.user?.first_name,
                            upi_id: driverData?.upi_id || 'rideconnect@upi'
                        }
                    }}
                    onPaymentSuccess={() => {
                        setRideStatus('paid');
                        clearActiveRide();
                        setTimeout(() => navigate('/customer/dashboard'), 2000);
                    }}
                />

                {/* Voice Interaction Overlay */}
                <div className="absolute right-6 bottom-32 z-[60]">
                    <VoiceAssistant 
                        placeholder="Say 'emergency' for help"
                        onCommand={(cmd) => {
                            if (cmd.toLowerCase().includes('emergency') || cmd.toLowerCase().includes('help')) {
                                VoiceService.speak("Emergency assistance has been alerted. Help is on the way.", { rate: 0.9, pitch: 1.1 });
                                // Logic for SOS
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DriverTracking;
