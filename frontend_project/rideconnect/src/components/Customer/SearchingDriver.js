import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthStatus } from '../../utils/authUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import { Loader2, MapPin, ShieldCheck, UserCheck, Smartphone, Phone, Star, Car, Navigation, ChevronRight, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import SurgeSelectionModal from './SurgeSelectionModal';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import { getPubNubInstance, RIDE_REQUESTS_CHANNEL, RIDE_UPDATES_CHANNEL } from '../../utils/pubnubService';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceService from '../../utils/voiceService';
import useVoicePreference from '../../hooks/useVoicePreference';

const SearchingDriver = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const rideId = state?.rideId;
    const initialRideData = state?.rideData;
    
    const [status, setStatus] = useState('searching'); // searching, accepted
    const [rideData, setRideData] = useState(initialRideData);
    const [socket, setSocket] = useState(null);
    const [isSurgeModalOpen, setIsSurgeModalOpen] = useState(false);
    const [timer, setTimer] = useState(15);
    const [currentFare, setCurrentFare] = useState(initialRideData?.estimated_fare || initialRideData?.total_fare || 0);
    const [canShowSurge, setCanShowSurge] = useState(true);
    const [voiceEnabled, toggleVoice] = useVoicePreference();

    const handleAcceptance = useCallback((data) => {
        setStatus('accepted');
        setRideData(data);
        
        // Voice Instruction for Customer
        if (voiceEnabled) {
            const driverName = data?.driver?.name || "Your pro";
            const pickup = initialRideData?.pickup_location || "the pickup point";
            VoiceService.speak(`Driver ${driverName} assigned. Arriving at ${pickup} in approximately 4 minutes.`);
        }
    }, [initialRideData, voiceEnabled]);

    useEffect(() => {
        let interval;
        if (status === 'searching' && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0 && status === 'searching' && canShowSurge) {
            setIsSurgeModalOpen(true);
            setCanShowSurge(false);
        }
        return () => clearInterval(interval);
    }, [status, timer, canShowSurge]);

    const handleApplySurge = async (amount) => {
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/ride/apply-surge/${rideId}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surge_amount: amount })
            });
            const data = await res.json();
            if (res.ok) {
                setCurrentFare(data.total_fare);
                setIsSurgeModalOpen(false);
                setTimer(15);
                setCanShowSurge(true);
            } else {
                alert(data.error || "Failed to apply surge");
            }
        } catch (error) {
            console.error("Surge error:", error);
        }
    };

    useEffect(() => {
        const { isAuthenticated, email } = getAuthStatus();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        const userId = initialRideData?.customer?.user?.id || email;

        // --- PubNub Integration ---
        const pubnub = getPubNubInstance(`customer_${userId}`);
        if (pubnub) {
            pubnub.addListener({
                message: (event) => {
                    // Standard message: { ride_id, status: 'accepted' }
                    const msg = event.message;
                    const msgRideId = msg.ride_id || msg.rideId;
                    
                    if (event.channel === RIDE_UPDATES_CHANNEL && msg.status === 'accepted' && String(msgRideId) === String(rideId)) {
                        console.log("PubNub: Driver Assigned Update Received", msg);
                        handleAcceptance(msg.ride_data || msg);
                    }
                }
            });
            pubnub.subscribe({ channels: [RIDE_UPDATES_CHANNEL] });
        }

        const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/ride/${userId}/`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to searching socket");
            if (initialRideData) {
                const messageData = { ...initialRideData, estimated_fare: currentFare };
                ws.send(JSON.stringify({
                    type: 'ride_request',
                    ride_data: messageData
                }));

                if (pubnub) {
                    pubnub.publish({
                        channel: RIDE_REQUESTS_CHANNEL,
                        message: {
                            type: 'ride_request',
                            ride_data: messageData
                        }
                    });
                }
            }
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'ride_update' && data.ride_status === 'accepted') {
                handleAcceptance(data.ride_data || data);
            }
        };

        ws.onerror = (err) => console.error("WS Error:", err);
        ws.onclose = () => console.log("Searching socket closed");

        setSocket(ws);

        return () => {
            ws.close();
            if (pubnub) pubnub.unsubscribeAll();
        }
    }, [navigate, rideId, currentFare, initialRideData, handleAcceptance]);

    // Polling for ride status (using new API)
    useEffect(() => {
        let pollInterval;
        if (status === 'searching' && rideId) {
            const checkRideStatus = async () => {
                try {
                    const res = await authorizedFetch(`${API_BASE_URL}/api/ride/${rideId}/status/`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.status === 'accepted') {
                            handleAcceptance(data);
                        }
                    }
                } catch (e) { console.error("Status poll error:", e); }
            };

            pollInterval = setInterval(checkRideStatus, 3000);
        }
        return () => clearInterval(pollInterval);
    }, [status, rideId, handleAcceptance]);

    const driver = rideData?.driver;
    const vehicle = rideData?.vehicle;

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden min-h-screen relative">
            <div className={`relative flex h-screen w-full flex-col transition-all duration-700 ${status === 'accepted' ? 'blur-sm brightness-50' : ''}`}>
                <div className="layout-container flex h-full grow flex-col">
                    <header className="flex items-center border-b border-solid border-slate-200 dark:border-slate-800 px-4 md:px-10 py-6 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-50">
                        <GlobalBackButton variant="ghost" className="hover:text-primary mr-6" />
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight flex-1">
                            {status === 'searching' ? 'Looking for Driver' : 'Driver Assigned'}
                        </h2>
                        <button 
                            onClick={toggleVoice}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                            title={voiceEnabled ? "Mute Voice" : "Unmute Voice"}
                        >
                            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                    </header>

                    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                        <div className="w-full max-w-md flex flex-col items-center gap-10">
                            <div className="relative size-64 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75"></div>
                                <div className="absolute inset-4 rounded-full bg-primary/10 animate-pulse"></div>
                                
                                <div className="relative z-10 size-40 rounded-full border-4 border-primary bg-background-dark flex items-center justify-center shadow-[0_0_50px_rgba(13,204,242,0.5)] overflow-hidden">
                                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 animate-scan"></div>
                                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4 text-center">
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Searching</h1>
                                <p className="text-slate-500 max-w-[280px]">Connecting you with the closest professional driver near your area.</p>
                            </div>

                            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 size-3 rounded-full bg-primary shadow-[0_0_10px_rgba(13,204,242,0.8)]"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Pickup</span>
                                        <span className="text-sm font-medium line-clamp-1">{initialRideData?.pickup_location}</span>
                                    </div>
                                </div>
                                <div className="ml-[5px] h-6 border-l-2 border-dashed border-slate-200 dark:border-slate-800"></div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 size-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Drop-off</span>
                                        <span className="text-sm font-medium line-clamp-1">{initialRideData?.destination}</span>
                                    </div>
                                </div>
                                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Price</span>
                                        <span className="text-xl font-black text-primary italic">₹{currentFare}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Secure</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <AnimatePresence>
                {status === 'accepted' && (
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-x-0 bottom-0 z-[100] bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] border-t border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-4"></div>
                        
                        <div className="px-6 pb-10 flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                                        <UserCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase italic tracking-tight dark:text-white">Driver Assigned</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arriving in approx. 4 mins</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs font-black dark:text-white">4.9</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
                                <div className="relative">
                                    <div className="size-20 rounded-full bg-primary/20 border-4 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden shadow-2xl">
                                        {driver?.profile_picture ? (
                                            <img 
                                                src={`${API_BASE_URL}${driver.profile_picture}`} 
                                                alt={driver?.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                                                <span className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                                    {(driver?.name || "D").charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full size-6 flex items-center justify-center shadow-lg">
                                        <ShieldCheck className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-2xl font-black italic dark:text-white leading-none tracking-tight">
                                                {driver?.name || "Ravi Kumar"}
                                            </h4>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star key={s} className={`w-2.5 h-2.5 ${s <= 4 ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">4.9 • 1.2k Rides</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Vehicle</span>
                                            <span className="text-sm font-bold dark:text-slate-200">
                                                {driver?.vehicle_type || "Car"}
                                            </span>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg">
                                            <span className="text-xs font-black tracking-widest">
                                                {driver?.vehicle_number || "AP05AB1234"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <a 
                                    href={`tel:${driver?.phone || '9876543210'}`}
                                    className="flex items-center justify-center gap-3 rounded-[1.5rem] h-14 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-black hover:bg-green-500/20 transition-all active:scale-95 shadow-sm"
                                >
                                    <Phone className="w-5 h-5" />
                                    Call Driver
                                </a>
                                <button 
                                    className="flex items-center justify-center gap-3 rounded-[1.5rem] h-14 bg-primary/10 border border-primary/20 text-primary font-black hover:bg-primary/20 transition-all active:scale-95 shadow-sm"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Message
                                </button>
                            </div>

                            <button 
                                onClick={() => navigate('/customer/tracking', { state: { rideId, driverData: driver, rideStatus: 'accepted' } })}
                                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl h-16 bg-primary text-background-dark font-black text-xl overflow-hidden shadow-[0_15px_30px_rgba(13,204,242,0.3)] active:scale-[0.98] transition-transform"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-white/20 to-primary translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <Navigation className="w-6 h-6 animate-pulse" />
                                <span className="relative uppercase italic tracking-tight">Live Tracking</span>
                                <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SurgeSelectionModal 
                isOpen={isSurgeModalOpen}
                onClose={() => setIsSurgeModalOpen(false)}
                onSelect={handleApplySurge}
                baseFare={initialRideData?.base_fare || currentFare}
            />
            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default SearchingDriver;
