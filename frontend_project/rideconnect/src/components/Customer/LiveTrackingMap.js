import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPubNubInstance, RIDE_UPDATES_CHANNEL } from '../../utils/pubnubService';

// Custom icons
const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204008.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
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

function RecenterAutomatically({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.panTo([lat, lng]);
    }, [lat, lng, map]);
    return null;
}

const LiveTrackingMap = ({ rideId, pickupCoords, dropCoords, initialDriverCoords }) => {
    const [driverLocation, setDriverLocation] = useState(initialDriverCoords || pickupCoords);
    const [trail, setTrail] = useState(initialDriverCoords ? [initialDriverCoords] : [pickupCoords]);

    useEffect(() => {
        if (!rideId) return;

        const pubnub = getPubNubInstance('customer_tracking');
        if (pubnub) {
            pubnub.addListener({
                message: (event) => {
                    const msg = event.message;
                    if (msg.type === 'location_update' && String(msg.ride_id) === String(rideId)) {
                        const newLoc = [msg.location.lat, msg.location.lng];
                        setDriverLocation(newLoc);
                        setTrail(prev => [...prev, newLoc]);
                    }
                }
            });
            pubnub.subscribe({ channels: [RIDE_UPDATES_CHANNEL] });
        }

        return () => {
            if (pubnub) pubnub.unsubscribeAll();
        };
    }, [rideId]);

    const routeCoords = [pickupCoords, dropCoords];

    return (
        <div className="w-full h-full">
            <MapContainer center={pickupCoords} zoom={15} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OSM'
                />

                {/* Pickup Marker */}
                <Marker position={pickupCoords} icon={pickupIcon}>
                    <Popup>Pickup</Popup>
                </Marker>

                {/* Drop Marker */}
                <Marker position={dropCoords} icon={dropIcon}>
                    <Popup>Destination</Popup>
                </Marker>

                {/* Driver Marker */}
                {driverLocation && (
                    <Marker position={driverLocation} icon={driverIcon}>
                        <Popup>Driver</Popup>
                    </Marker>
                )}

                {/* Full Route Line (Dashed) */}
                <Polyline positions={routeCoords} color="#94a3b8" weight={3} opacity={0.5} dashArray="5, 10" />

                {/* Driver Trail (Solid) */}
                <Polyline positions={trail} color="#06b6d4" weight={5} opacity={0.8} />

                <RecenterAutomatically lat={driverLocation[0]} lng={driverLocation[1]} />
            </MapContainer>
        </div>
    );
};

export default LiveTrackingMap;
