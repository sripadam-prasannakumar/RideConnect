import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';
import { authorizedFetch } from '../../utils/apiUtils';
import { getAuthStatus } from '../../utils/authUtils';

const TripStatus = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const rideId = state?.rideId;
    const [ride, setRide] = useState(state?.rideData || null);
    const [loading, setLoading] = useState(!state?.rideData);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (!rideId) {
            navigate('/driver/dashboard');
            return;
        }

        const fetchRideDetails = async () => {
            try {
                const res = await authorizedFetch(`${API_BASE_URL}/api/admin/bookings/?status=all`); // Or a specific ride detail endpoint if available
                const data = await res.json();
                const currentRide = data.find(r => r.id === rideId);
                if (currentRide) setRide(currentRide);
            } catch (e) {
                console.error("Error fetching ride details:", e);
            } finally {
                setLoading(false);
            }
        };

        if (!ride) fetchRideDetails();
    }, [rideId, navigate, ride]);

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
                setRide(data);
            } else {
                alert(data.error || "Failed to verify OTP");
            }
        } catch (e) {
            console.error("Start ride error:", e);
        } finally {
            setVerifying(false);
        }
    };

    const handleEndRide = async () => {
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/ride/end/${rideId}/`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(`Ride completed! Total Fare: ₹${data.estimated_fare}`);
                navigate('/driver/dashboard');
            } else {
                alert(data.error || "Failed to end ride");
            }
        } catch (e) {
            console.error("End ride error:", e);
        }
    };

    if (loading || !ride) return <div className="h-screen flex items-center justify-center bg-background-dark text-white">Loading Trip...</div>;

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
                <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-background-dark/80 backdrop-blur-md border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 transition-colors">
                            <span className="material-symbols-outlined">route</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight text-white">Active Trip</h1>
                            <p className="text-xs text-slate-400">ID: #DM-99234</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center size-10 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">shield_with_heart</span>
                        </button>
                        <button className="flex items-center justify-center size-10 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-colors">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                </header>

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
                <section className="relative z-30 bg-background-dark border-t border-slate-800 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <div className="mx-auto w-12 h-1.5 bg-slate-700 rounded-full mt-3 mb-6"></div>
                    <div className="px-6 pb-8 space-y-6 max-w-2xl mx-auto">

                        {/* Customer & Vehicle Info */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPe-zePhHWHH2_jZ9_JbY8QxaQRFvhLOuJ6VXDSn67Oac-i64gUA8YpipvR1sg8WsHBfRZrJadtBsRkOLZKOY31KCMZVQDHGE6txhE4QBegqf76i9ROmr-9P7XyGNMuh5ZT7hxDHBgh8Vad_UFqOD_BpwEoyNNoKSdCRLetTMprRMzbF5qoianQ0lwyDVyrbsrwlbTW1t871fMY5JmQjDo43YC_wo9zIUanpdea8IQpVUZ5mZkxjoIBV3b3zupnE1GhWKBRMNV1h4" alt="Customer Portrait" className="size-16 rounded-2xl object-cover border-2 border-primary/30" />
                                    <div className="absolute -bottom-1 -right-1 size-6 bg-green-500 border-4 border-background-dark rounded-full"></div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{ride.customer_name || "Sarah J."}</h2>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                        <span>Customer</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex size-12 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700 hover:bg-slate-700 transition-colors">
                                    <span className="material-symbols-outlined">chat_bubble</span>
                                </button>
                                <button className="flex size-12 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700 hover:bg-slate-700 transition-colors">
                                    <span className="material-symbols-outlined">call</span>
                                </button>
                            </div>
                        </div>

                        {/* Trip Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pickup Location</p>
                                    <p className="text-sm font-medium text-white line-clamp-1">{ride.pickup_location}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mt-2 mb-1">Drop Location</p>
                                    <p className="text-sm font-medium text-white line-clamp-1">{ride.destination}</p>
                                </div>
                                <p className="text-primary font-bold">65%</p>
                            </div>
                            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(13,204,242,0.5)]" style={{ width: '65%' }}></div>
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

                        {/* Action Button */}
                        <div className="pt-2 space-y-4">
                            {ride.status === 'accepted' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center">Enter Ride OTP</p>
                                        <input
                                            type="text"
                                            maxLength="4"
                                            placeholder="----"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-slate-800 border-2 border-primary/30 rounded-2xl py-4 text-center text-3xl font-black tracking-[0.5em] text-white focus:border-primary outline-none transition-all shadow-[0_0_20px_rgba(13,204,242,0.1)]"
                                        />
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
                            <p className="text-center text-xs text-slate-500 mt-4 italic">Status: {ride.status.toUpperCase()}</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TripStatus;
