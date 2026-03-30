import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RideRequestNotification = ({ rideData, onAccept, onDecline }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!rideData) return;

        // Play notification sound
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            
            // First beep
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
            gain1.gain.setValueAtTime(0.1, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.5);
            
            // Second beep
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
            gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.2);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
            osc2.start(ctx.currentTime + 0.2);
            osc2.stop(ctx.currentTime + 0.7);
        } catch (e) {
            console.error("Audio API error", e);
        }

        // Auto-decline after 15 seconds
        const timer = setTimeout(() => {
            onDecline();
        }, 15000);

        return () => clearTimeout(timer);
    }, [rideData, onDecline]);

    if (!rideData) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-background-dark/80 backdrop-blur-xl flex items-center justify-center p-4">
            <style>
                {`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                `}
            </style>
            <div className="w-full max-w-md bg-white dark:bg-[#152a2e] rounded-xl shadow-2xl border border-slate-200 dark:border-primary/30 overflow-hidden flex flex-col animate-in zoom-in duration-300">
                {/* Progress Bar Timer */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-primary animate-timer"></div>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">New Ride Request</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="material-symbols-outlined text-primary text-lg">verified</span>
                                <span className="text-primary font-bold tracking-tight uppercase text-xs">Matching Your Vehicle</span>
                            </div>
                        </div>
                        <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-lg font-black border border-primary/30">
                            ₹{rideData.estimated_fare}
                        </div>
                    </div>

                    {/* Trip Details Card */}
                    <div className="bg-slate-50 dark:bg-background-dark/50 rounded-lg p-4 space-y-4 mb-6">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                <div className="w-0.5 h-8 border-l border-dashed border-primary/40 my-1"></div>
                                <span className="material-symbols-outlined text-slate-400">flag</span>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="min-h-[40px]">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Pickup</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2">{rideData.pickup_address || rideData.pickup_location}</p>
                                </div>
                                <div className="min-h-[40px]">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Dropoff</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2">{rideData.dropoff_address || rideData.destination}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-primary/10">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Duration</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rideData.duration_text}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">
                                    {rideData.vehicle_type === 'bike' ? 'motorcycle' : (rideData.vehicle_type === 'cargo' ? 'local_shipping' : 'directions_car')}
                                </span>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Vehicle</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{rideData.vehicle_type}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button onClick={() => onAccept(rideData.id)} className="w-full bg-primary hover:brightness-110 text-slate-900 font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(13,204,242,0.4)] transition-all">
                            <span className="material-symbols-outlined font-bold">check_circle</span>
                            Accept Trip
                        </button>
                        <button onClick={onDecline} className="w-full bg-transparent border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-4 rounded-lg transition-all">
                            Decline
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes timer {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-timer {
                    animation: timer 15s linear forwards;
                }
            `}</style>
        </div>
    );
};
export default RideRequestNotification;
