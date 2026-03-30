import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthStatus } from '../../utils/authUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import { Loader2, MapPin, ShieldCheck, UserCheck, Smartphone, Zap } from 'lucide-react';
import SurgeSelectionModal from './SurgeSelectionModal';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import { getPubNubInstance, RIDE_REQUESTS_CHANNEL, RIDE_UPDATES_CHANNEL } from '../../utils/pubnubService';

const SearchingDriver = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const rideId = state?.rideId;
    const rideData = state?.rideData;
    const [status, setStatus] = useState('searching'); // searching, accepted
    const [socket, setSocket] = useState(null);
    const [isSurgeModalOpen, setIsSurgeModalOpen] = useState(false);
    const [timer, setTimer] = useState(15);
    const [currentFare, setCurrentFare] = useState(rideData?.estimated_fare || 0);
    const [canShowSurge, setCanShowSurge] = useState(true);

    useEffect(() => {
        let interval;
        if (status === 'searching' && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0 && status === 'searching' && canShowSurge) {
            setIsSurgeModalOpen(true);
            setCanShowSurge(false); // Only show once per search session or until reset
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
                setTimer(15); // Reset timer for another 15 seconds
                setCanShowSurge(true);
                // The backend will re-broadcast to drivers with expanded radius
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
        
        const userId = rideData?.customer?.user?.id || email;

        // --- PubNub Integration ---
        const pubnub = getPubNubInstance(`customer_${userId}`);
        if (pubnub) {
            pubnub.addListener({
                message: (event) => {
                    if (event.channel === RIDE_UPDATES_CHANNEL && event.message.status === 'accepted' && event.message.ride_id === rideId) {
                        setStatus('accepted');
                        // Note: Driver data might need to be fetched if not fully provided, 
                        // but tracking will handle fetching it.
                        setTimeout(() => {
                            navigate('/customer/tracking', { state: { rideId, driverData: event.message.driver_data || {}, rideStatus: 'accepted' } });
                        }, 1500);
                    }
                }
            });
            pubnub.subscribe({ channels: [RIDE_UPDATES_CHANNEL] });
        }

        const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/ride/${userId}/`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to searching socket");
            // Send ride request notification to drivers
            if (rideData) {
                const messageData = { ...rideData, estimated_fare: currentFare };
                ws.send(JSON.stringify({
                    type: 'ride_request',
                    ride_data: messageData
                }));

                // Also publish via PubNub
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
                setStatus('accepted');
                setTimeout(() => {
                    navigate('/customer/tracking', { state: { rideId, driverData: data.driver_data, rideStatus: 'accepted' } });
                }, 1500);
            }
        };

        ws.onerror = (err) => console.error("WS Error:", err);
        ws.onclose = () => console.log("Searching socket closed");

        setSocket(ws);

        return () => {
            ws.close();
            if (pubnub) pubnub.unsubscribeAll();
        }
    }, [navigate, rideId, currentFare, rideData]);

    // Polling for ride status (backup to WebSockets)
    useEffect(() => {
        let pollInterval;
        if (status === 'searching' && rideId) {
            const checkRideStatus = async () => {
                try {
                    const res = await authorizedFetch(`${API_BASE_URL}/api/ride/active/`);
                    if (res.ok) {
                        const data = await res.json();
                        // If data is a single object (customer flow) and status is accepted
                        if (data && data.id === rideId && data.status === 'accepted') {
                            setStatus('accepted');
                            setTimeout(() => {
                                navigate('/customer/tracking', { state: { rideId, driverData: data.driver, rideStatus: 'accepted' } });
                            }, 1500);
                        }
                    }
                } catch (e) { console.error("Customer poll error:", e); }
            };

            pollInterval = setInterval(checkRideStatus, 3000); // Every 3 seconds
        }
        return () => clearInterval(pollInterval);
    }, [status, rideId, navigate]);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden">
            <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark">
                <div className="layout-container flex h-full grow flex-col">
                    <header className="flex items-center border-b border-solid border-slate-200 dark:border-slate-800 px-4 md:px-10 py-6 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-50">
                        <GlobalBackButton variant="ghost" className="hover:text-primary mr-6" />
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">Looking for Driver</h2>
                    </header>

                    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                        <div className="w-full max-w-md flex flex-col items-center gap-10">
                            {/* Animated Scanner Effect */}
                            <div className="relative size-64 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75"></div>
                                <div className="absolute inset-4 rounded-full bg-primary/10 animate-pulse"></div>
                                
                                <div className="relative z-10 size-40 rounded-full border-4 border-primary bg-background-dark flex items-center justify-center shadow-[0_0_50px_rgba(13,204,242,0.5)] overflow-hidden">
                                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 animate-scan"></div>
                                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                    </div>
                                </div>

                                <div className="absolute top-0 right-10 size-4 rounded-full bg-primary animate-bounce delay-100"></div>
                                <div className="absolute bottom-10 left-0 size-3 rounded-full bg-white/40 animate-pulse delay-500"></div>
                            </div>

                            <div className="flex flex-col items-center gap-4 text-center">
                                {status === 'searching' ? (
                                    <>
                                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Searching</h1>
                                        <p className="text-slate-500 max-w-[280px]">Connecting you with the closest professional driver near your area.</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 text-green-500">
                                            <UserCheck className="w-8 h-8" />
                                            <h1 className="text-3xl font-black tracking-tight uppercase">Driver Found!</h1>
                                        </div>
                                        <p className="text-slate-500">Your driver is on the way. Redirecting to tracking...</p>
                                    </>
                                )}
                            </div>

                            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 size-3 rounded-full bg-primary shadow-[0_0_10px_rgba(13,204,242,0.8)]"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Pickup</span>
                                        <span className="text-sm font-medium line-clamp-1">{rideData?.pickup_location || 'Finding details...'}</span>
                                    </div>
                                </div>
                                <div className="ml-[5px] h-6 border-l-2 border-dashed border-slate-200 dark:border-slate-800"></div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 size-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Drop-off</span>
                                        <span className="text-sm font-medium line-clamp-1">{rideData?.destination || 'Finding details...'}</span>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Price</span>
                                        <span className="text-xl font-black text-primary italic">₹{currentFare}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Secure Booking</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => navigate(-1)}
                                className="text-slate-500 hover:text-red-500 font-bold uppercase tracking-widest text-xs transition-colors"
                            >
                                Cancel Request
                            </button>
                        </div>
                    </main>

                    <div className="py-4 px-6 bg-primary text-background-dark flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Did you know?</span>
                        </div>
                        <p className="text-[10px] font-medium italic">Our drivers are vetted with 20+ performance checks.</p>
                    </div>
                </div>
            </div>

            <SurgeSelectionModal 
                isOpen={isSurgeModalOpen}
                onClose={() => setIsSurgeModalOpen(false)}
                onSelect={handleApplySurge}
                baseFare={rideData?.base_fare || currentFare}
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
