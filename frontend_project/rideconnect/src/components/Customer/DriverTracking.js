import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';
import { getAuthStatus } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import LiveTrackingMap from './LiveTrackingMap';

const DriverTracking = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const rideId = state?.rideId;
    const [rideStatus, setRideStatus] = useState(state?.rideStatus || 'accepted');
    const [driverData, setDriverData] = useState(state?.driverData || null);
    const [rideData, setRideData] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [finalPrice, setFinalPrice] = useState(0);

    useEffect(() => {
        const { isAuthenticated, email } = getAuthStatus();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchRideDetails = async () => {
            try {
                const res = await authorizedFetch(`${API_BASE_URL}/api/ride/history/?email=${email}&role=customer`);
                const data = await res.json();
                if (res.ok) {
                    const currentRide = data.find(r => r.id === rideId);
                    if (currentRide) {
                        setRideData(currentRide);
                        setRideStatus(currentRide.status);
                        if (currentRide.driver) setDriverData(currentRide.driver);
                    }
                }
            } catch (e) {
                console.error("Fetch ride error:", e);
            }
        };

        fetchRideDetails();

        const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/ride/${email}/`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'ride_update') {
                setRideStatus(data.ride_status);
                if (data.ride_status === 'completed') {
                    setFinalPrice(data.estimated_fare);
                    setShowCompleteModal(true);
                }
            }
        };

        return () => ws.close();
    }, [navigate, rideId]);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden min-h-screen">
            <div className="relative h-screen w-full flex flex-col">
                {/* Top Navigation Bar */}
                <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/customer/driver-assigned')} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-slate-100">arrow_back</span>
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/customer/dashboard')}>
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
                    {rideData && (
                        <LiveTrackingMap
                            rideId={rideId}
                            pickupCoords={[rideData.pickup_lat, rideData.pickup_lng]}
                            dropCoords={[rideData.drop_lat, rideData.drop_lng]}
                            initialDriverCoords={rideData.driver_lat ? [rideData.driver_lat, rideData.driver_lng] : null}
                        />
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
                </main>

                {/* Bottom-Docked Card */}
                <footer className="absolute bottom-0 left-0 right-0 z-50 p-6 md:px-12 md:pb-8 pointer-events-none">
                    <div className="max-w-4xl mx-auto w-full bg-background-dark border border-white/10 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] pointer-events-auto overflow-hidden">
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
                                        {driverData?.user?.profile_picture ? (
                                            <img alt="Driver Profile" className="w-full h-full object-cover" src={driverData.user.profile_picture} />
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
                                    <h3 className="text-xl font-extrabold text-slate-100 mb-1">{driverData?.user?.first_name || "Assigned Driver"}</h3>
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
                    </div>
                </footer>

                {/* Ride Completion Modal */}
                {showCompleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-md">
                        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                            <div className="bg-primary p-8 text-center">
                                <div className="size-20 bg-background-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                                    <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
                                </div>
                                <h3 className="text-2xl font-black text-background-dark">Ride Completed!</h3>
                                <p className="text-background-dark/70 font-bold text-sm">Hope you had a great trip</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1">Total Fare Paid</p>
                                    <h4 className="text-5xl font-black text-slate-900 dark:text-white italic">₹{finalPrice}</h4>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">payments</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                                        <p className="text-sm font-bold">In-App Wallet / Cash</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/customer/dashboard')}
                                    className="w-full py-4 bg-primary text-background-dark font-black rounded-2xl shadow-lg hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    BACK TO DASHBOARD
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverTracking;
