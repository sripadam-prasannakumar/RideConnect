import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPubNubInstance, RIDE_UPDATES_CHANNEL } from '../../utils/pubnubService';

// --- Custom Icons ---
const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/709/709722.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
});

const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204008.png',
    iconSize: [45, 45],
    iconAnchor: [22, 22],
});

const pickupIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const dropIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

// Helper component to auto-recenter and fit bounds
function MapController({ coords, autoFit = false }) {
    const map = useMap();
    const hasFitted = useRef(false);

    useEffect(() => {
        if (!coords || coords.length === 0) return;
        
        if (autoFit && !hasFitted.current) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50] });
            hasFitted.current = true;
        } else if (!autoFit && coords[0] && coords[1]) {
            map.panTo(coords, { animate: true });
        }
    }, [coords, map, autoFit]);
    
    return null;
}

const LiveTrackingMap = ({ rideId, pickupCoords, dropCoords, initialDriverCoords }) => {
    const [driverLocation, setDriverLocation] = useState(initialDriverCoords || [pickupCoords[0] + 0.002, pickupCoords[1] + 0.002]);
    const [userLocation, setUserLocation] = useState(null);
    const [roadRoute, setRoadRoute] = useState([]);
    const [isSimulating, setIsSimulating] = useState(true);
    
    // 1. Track User's Real-time location
    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.error("Geolocation error:", err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // 2. Fetch Road-Optimized Route (OSRM)
    const fetchOSRMRoute = useCallback(async (start, end) => {
        if (!start || !end) return;
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                setRoadRoute(coords);
            }
        } catch (e) {
            console.error("OSRM Route error:", e);
            setRoadRoute([start, end]); // Fallback to straight line
        }
    }, []);

    useEffect(() => {
        if (pickupCoords && dropCoords) {
            fetchOSRMRoute(pickupCoords, dropCoords);
        }
    }, [pickupCoords, dropCoords, fetchOSRMRoute]);

    // 3. Simulation / Backend Sync Logic
    useEffect(() => {
        if (!rideId) return;

        const pubnub = getPubNubInstance('customer_tracking_live');
        if (pubnub) {
            pubnub.addListener({
                message: (event) => {
                    const msg = event.message;
                    if (msg.type === 'location_update' && String(msg.ride_id) === String(rideId)) {
                        setIsSimulating(false);
                        const newLoc = [msg.location.lat, msg.location.lng];
                        setDriverLocation(newLoc);
                    }
                }
            });
            pubnub.subscribe({ channels: [RIDE_UPDATES_CHANNEL] });
        }

        // --- Simulation Mode ---
        // If no real updates come after 5 seconds, move driver slowly toward pickup
        let simInterval;
        if (isSimulating) {
            simInterval = setInterval(() => {
                setDriverLocation(prev => {
                    const target = pickupCoords;
                    const step = 0.0001; // Simulation step
                    const dLat = target[0] - prev[0];
                    const dLng = target[1] - prev[1];
                    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
                    if (dist < step) return prev;
                    return [prev[0] + (dLat / dist) * step, prev[1] + (dLng / dist) * step];
                });
            }, 2000);
        }

        return () => {
            if (pubnub) pubnub.unsubscribeAll();
            if (simInterval) clearInterval(simInterval);
        };
    }, [rideId, isSimulating, pickupCoords]);

    return (
        <div className="w-full h-full relative group">
            <MapContainer 
                center={pickupCoords} 
                zoom={14} 
                style={{ height: '100%', width: '100%', zIndex: 0, background: '#111827' }} 
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap'
                />
                
                <ZoomControl position="bottomright" />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup className="custom-popup">You are here</Popup>
                    </Marker>
                )}

                {/* Pickup Marker */}
                <Marker position={pickupCoords} icon={pickupIcon}>
                    <Popup className="custom-popup">Pickup Location</Popup>
                </Marker>

                {/* Destination Marker */}
                <Marker position={dropCoords} icon={dropIcon}>
                    <Popup className="custom-popup">Destination</Popup>
                </Marker>

                {/* Driver Marker */}
                {driverLocation && (
                    <Marker position={driverLocation} icon={driverIcon} zIndexOffset={1000}>
                        <Popup className="custom-popup">Driver (Live)</Popup>
                    </Marker>
                )}

                {/* Road Accurate Route Polyline */}
                {roadRoute.length > 0 && (
                    <Polyline 
                        positions={roadRoute} 
                        color="#0dccf2" 
                        weight={6} 
                        opacity={0.6} 
                        lineJoin="round"
                    >
                        <Popup>Optimized Route</Popup>
                    </Polyline>
                )}

                <MapController coords={roadRoute.length > 0 ? roadRoute : [pickupCoords, dropCoords]} autoFit />
            </MapContainer>
            
            {/* Attribution overlay */}
            <div className="absolute bottom-2 left-2 z-10 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[8px] text-white/50 pointer-events-none uppercase tracking-widest font-bold">
                Leaflet | OpenStreetMap (OSRM)
            </div>
            
            <style>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    background: #1e293b;
                    color: white;
                    font-weight: bold;
                    border-radius: 12px;
                    border: 1px solid rgba(13, 204, 242, 0.3);
                }
                .custom-popup .leaflet-popup-tip {
                    background: #1e293b;
                }
            `}</style>
        </div>
    );
};

export default LiveTrackingMap;
