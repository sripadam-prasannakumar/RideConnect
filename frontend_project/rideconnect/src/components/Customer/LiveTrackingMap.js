import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';

// Custom icons to avoid broken default leaflet images
const customCarIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204008.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

const customerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// A component to recenter the map when driver moves
function RecenterAutomatically({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        map.panTo([lat, lng]);
    }, [lat, lng, map]);
    return null;
}

export default function LiveTrackingMap() {
    const [rideStarted, setRideStarted] = useState(false);
    
    // Hyderabad dummy coordinates
    const customerLocation = [17.4399, 78.4983];
    const initialDriverLocation = [17.4200, 78.4800];
    
    // Generate a simple dummy route
    const routePath = useMemo(() => {
        const steps = 100;
        const path = [];
        for (let i = 0; i <= steps; i++) {
            const lat = initialDriverLocation[0] + (customerLocation[0] - initialDriverLocation[0]) * (i / steps);
            const lng = initialDriverLocation[1] + (customerLocation[1] - initialDriverLocation[1]) * (i / steps);
            // Add a little curve logic by offsetting longitude slightly at the middle
            const curveOffset = Math.sin((i / steps) * Math.PI) * 0.005;
            path.push([lat, lng + curveOffset]);
        }
        return path;
    }, []);

    const [driverIndex, setDriverIndex] = useState(0);
    const driverLocation = routePath[driverIndex];
    
    // ETA calculation roughly based on remaining points (each tick = 2 secs)
    const remainingTicks = routePath.length - driverIndex - 1;
    const etaMins = Math.max(1, Math.ceil((remainingTicks * 2) / 60));

    useEffect(() => {
        let interval;
        if (rideStarted && driverIndex < routePath.length - 1) {
            interval = setInterval(() => {
                setDriverIndex(prev => Math.min(prev + 1, routePath.length - 1));
            }, 1000); // Super fast 1-second update for testing
        }
        return () => clearInterval(interval);
    }, [rideStarted, driverIndex, routePath.length]);

    const statusMessage = driverIndex === routePath.length - 1 
        ? "Driver Arrived" 
        : driverIndex > routePath.length * 0.8
            ? "Arriving soon"
            : "Driver is on the way";

    return (
        <div className="relative w-full h-screen bg-slate-900 border-none">
            {/* Map Container */}
            <div className="w-full h-full">
                <MapContainer center={customerLocation} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    
                    {/* Customer Marker */}
                    <Marker position={customerLocation} icon={customerIcon}>
                        <Popup>Pickup Location</Popup>
                    </Marker>
                    
                    {/* Driver Marker */}
                    <Marker position={driverLocation} icon={customCarIcon}>
                        <Popup>Raju - AP052025</Popup>
                    </Marker>
                    
                    {/* Route Line */}
                    <Polyline 
                        positions={routePath.slice(driverIndex)} 
                        color="#06b6d4" 
                        weight={5} 
                        opacity={0.8}
                        dashArray="10, 10"
                    />

                    {/* Smooth pan to keep driver in view */}
                    <RecenterAutomatically lat={driverLocation[0]} lng={driverLocation[1]} />
                </MapContainer>
            </div>

            {/* UI Overlay (Rapido-like) */}
            <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-[1000] flex justify-between items-start">
                {/* Back button */}
                <button onClick={() => window.history.back()} className="size-12 rounded-full bg-white shadow-xl flex items-center justify-center pointer-events-auto hover:bg-slate-50 transition-colors">
                    <span className="material-symbols-outlined text-slate-700">arrow_back</span>
                </button>
            </div>

            {/* Bottom Card */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-0 left-0 w-full md:w-96 md:left-1/2 md:-translate-x-1/2 md:bottom-6 z-[1000] p-4 bg-white md:rounded-3xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] md:shadow-2xl"
            >
                <div className="flex justify-center mb-4 md:hidden">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">{statusMessage}</h2>
                        {statusMessage !== "Driver Arrived" && (
                            <p className="text-slate-500 font-medium">Reaching in <span className="text-emerald-500 font-bold">{etaMins} mins</span> ({etaMins * 0.4} km away)</p>
                        )}
                    </div>
                    <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden shrink-0">
                        <span className="material-symbols-outlined text-3xl text-cyan-500 drop-shadow-sm">two_wheeler</span>
                    </div>
                </div>

                {/* Driver Info Element */}
                <div className="bg-slate-50 rounded-2xl p-4 flex gap-4 items-center mb-4 border border-slate-100">
                    <div className="size-12 rounded-full overflow-hidden bg-slate-200 shrink-0">
                        <img src="https://ui-avatars.com/api/?name=Raju+V&background=0D8ABC&color=fff" alt="Driver" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Raju V.</h3>
                            <div className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1"><span className="material-symbols-outlined text-[10px] text-amber-500">star</span> 4.8</div>
                        </div>
                        <p className="text-sm font-semibold text-slate-500">AP05 BX 1234 • Mini</p>
                    </div>
                    <button className="size-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center hover:bg-cyan-200 transition-colors shrink-0">
                        <span className="material-symbols-outlined text-lg">call</span>
                    </button>
                </div>
                
                {/* Simulation Control */}
                <button 
                    onClick={() => setRideStarted(!rideStarted)}
                    className={`w-full py-4 font-bold rounded-xl text-white transition-all shadow-lg flex justify-center items-center gap-2 ${rideStarted ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'}`}
                >
                    <span className="material-symbols-outlined">{rideStarted ? 'pause' : 'play_arrow'}</span>
                    {rideStarted ? 'Pause Simulation' : 'Start Simulation'}
                </button>
            </motion.div>
        </div>
    );
}
