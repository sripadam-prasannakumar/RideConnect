import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthStatus } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';
import { getPubNubInstance, RIDE_REQUESTS_CHANNEL } from '../../utils/pubnubService';
import { MapPin, Navigation, Info, Target, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BikeFareDetailsModal from './BikeFareDetailsModal';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const dropIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const MapAutoCenter = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
};

const BookDriver = () => {
    const navigate = useNavigate();
    const [pickupLocation, setPickupLocation] = useState(null); // { label, lat, lng }
    const [dropLocation, setDropLocation] = useState(null);
    const [routePolyline, setRoutePolyline] = useState([]);
    const [durationText, setDurationText] = useState('');
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [distance, setDistance] = useState(0);
    const [price, setPrice] = useState(0);
    
    const [selectedType, setSelectedType] = useState('car');
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showVehicleSelector, setShowVehicleSelector] = useState(false);
    const [showFareModal, setShowFareModal] = useState(false);
    const [fareDetails, setFareDetails] = useState(null);
    
    // Search states
    const [pickupSearch, setPickupSearch] = useState('');
    const [dropSearch, setDropSearch] = useState('');
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [dropSuggestions, setDropSuggestions] = useState([]);
    const [isSearchingPickup, setIsSearchingPickup] = useState(false);
    const [isSearchingDrop, setIsSearchingDrop] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    
    // Trip Type
    const [tripType, setTripType] = useState('one_way'); // 'one_way', 'round_trip', 'daily'
    const [isPickupDrop, setIsPickupDrop] = useState(false); // Kept for backward compatibility if needed, but we'll use tripType
    
    // Advance Booking
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledTime, setScheduledTime] = useState('');

    const pickupRef = useRef(null);
    const dropRef = useRef(null);

    const defaultCenter = [17.3850, 78.4867]; // Hyderabad center

    useEffect(() => {
        const { isAuthenticated, email } = getAuthStatus();
        if (!isAuthenticated) {
            navigate('/login');
        } else if (email) {
            fetchUserVehicles(email);
        }
    }, [navigate]);

    const fetchUserVehicles = async (email) => {
        try {
            const response = await authorizedFetch(`${API_BASE_URL}/api/user-vehicles/?email=${encodeURIComponent(email)}`);
            if (response.ok) {
                const data = await response.json();
                setVehicles(data);
                if (data.length > 0) {
                    const matching = data.filter(v => v.vehicle_type === selectedType);
                    if (matching.length > 0) setSelectedVehicle(matching[0]);
                }
            }
        } catch (error) { console.error("Error fetching vehicles:", error); }
    };

    // Geocoding: Nominatim OSM
    const searchLocation = async (query, setSuggestions, setLoading) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            // Added viewbox bias for Hyderabad/Telangana area for better local accuracy
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&viewbox=78.2,17.2,78.8,17.6`);
            const data = await res.json();
            setSuggestions(data.map(item => ({
                label: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
            })));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            return data.display_name;
        } catch (e) {
            console.error("Reverse geocoding error:", e);
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    };

    const handleSetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const label = await reverseGeocode(latitude, longitude);
                setPickupLocation({ label, lat: latitude, lng: longitude });
                setPickupSearch(label);
                setIsLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Unable to retrieve your location. Please check permissions.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => searchLocation(pickupSearch, setPickupSuggestions, setIsSearchingPickup), 800);
        return () => clearTimeout(timer);
    }, [pickupSearch]);

    useEffect(() => {
        const timer = setTimeout(() => searchLocation(dropSearch, setDropSuggestions, setIsSearchingDrop), 800);
        return () => clearTimeout(timer);
    }, [dropSearch]);

    // Click outside to close results
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickupRef.current && !pickupRef.current.contains(event.target)) {
                setPickupSuggestions([]);
            }
            if (dropRef.current && !dropRef.current.contains(event.target)) {
                setDropSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Routing and Fare Calculation
    const calculateRoute = useCallback(async () => {
        if (!pickupLocation || !dropLocation) return;

        try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pickupLocation.lng},${pickupLocation.lat};${dropLocation.lng},${dropLocation.lat}?overview=full&geometries=geojson`);
            const data = await res.json();
            
            if (data.code === 'Ok' && data.routes.length > 0) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
                setRoutePolyline(coordinates);
                
                const onwardDistanceRaw = route.distance / 1000.0;
                const onwardDurationSec = route.duration;

                // --- Call Backend Fare API ---
                try {
                    const fareRes = await authorizedFetch(`${API_BASE_URL}/api/calculate-fare/`, {
                        method: 'POST',
                        body: JSON.stringify({
                            distance: onwardDistanceRaw,
                            vehicle_type: selectedType,
                            trip_type: tripType
                        })
                    });
                    if (fareRes.ok) {
                        const fareData = await fareRes.json();
                        setFareDetails(fareData);
                        setPrice(Math.round(fareData.total_fare));
                        setDistance(fareData.total_distance);
                        setDurationSeconds(onwardDurationSec);
                    }
                } catch (e) {
                    console.error("Fare API error:", e);
                }
                
                const durText = onwardDurationSec > 3600 
                    ? `${Math.floor(onwardDurationSec/3600)}h ${Math.floor((onwardDurationSec%3600)/60)}m`
                    : `${Math.ceil(onwardDurationSec/60)} mins`;
                setDurationText(durText);
            }
        } catch (error) { console.error("Routing error:", error); }
    }, [pickupLocation, dropLocation, tripType, selectedType]);

    useEffect(() => {
        calculateRoute();
    }, [pickupLocation, dropLocation, isPickupDrop, calculateRoute]);

    const handleBookRide = async () => {
        if (!pickupLocation || !dropLocation || !selectedVehicle) return;
        
        const rideData = {
            pickup_location: pickupLocation.label,
            destination: dropLocation.label,
            pickup_lat: pickupLocation.lat,
            pickup_lng: pickupLocation.lng,
            drop_lat: dropLocation.lat,
            drop_lng: dropLocation.lng,
            duration_text: durationText,
            duration_seconds: Math.round(durationSeconds),
            distance: distance,
            trip_type: tripType,
            price: price, // Frontend estimate
            selected_vehicle_type: selectedType,
            vehicle_id: selectedVehicle.id,
            ...(isScheduled && scheduledTime ? { scheduled_time: new Date(scheduledTime).toISOString() } : {})
        };

        try {
            const response = await authorizedFetch(`${API_BASE_URL}/api/ride/request/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rideData)
            });

            if (response.ok) {
                const data = await response.json();
                
                // Publish to PubNub if it's an immediate search
                if (data.status === 'searching') {
                    const { isAuthenticated, email } = getAuthStatus();
                    const pubnub = getPubNubInstance(`customer_${email}`);
                    if (pubnub) {
                        pubnub.publish({
                            channel: RIDE_REQUESTS_CHANNEL,
                            message: {
                                ride_id: data.ride_id,
                                pickup: pickupLocation.label,
                                destination: dropLocation.label,
                                fare: price,
                                customer_id: email, // or user ID if available
                                vehicle_type: selectedType,
                                duration_text: durationText
                            }
                        });
                    }
                }

                if (data.status === 'scheduled') {
                    alert("Ride scheduled successfully! You can view it in your Ride History.");
                    navigate('/customer/dashboard');
                } else {
                    navigate('/customer/searching', { state: { rideId: data.ride_id, rideData: data } });
                }
            }
        } catch (error) { console.error("Booking error:", error); }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 md:px-10 py-4 sticky top-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md z-[1001]">
                <div className="flex items-center gap-6">
                    <GlobalBackButton variant="ghost" />
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/customer/dashboard')}>
                        <div className="size-8 text-primary"><Navigation className="w-full h-full" fill="currentColor" /></div>
                        <h2 className="text-xl font-bold tracking-tight">RideConnect</h2>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-80px)]">
                {/* Map Section */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black">Plan Your Ride</h1>
                        <p className="text-sm text-slate-500">Fixed base pricing and transparent distance tracking.</p>
                    </div>

                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative z-0">
                        <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; OSM'
                            />
                            {pickupLocation && (
                                <Marker 
                                    position={[pickupLocation.lat, pickupLocation.lng]} 
                                    icon={pickupIcon} 
                                    draggable={true}
                                    eventHandlers={{
                                        dragend: async (e) => {
                                            const { lat, lng } = e.target.getLatLng();
                                            const label = await reverseGeocode(lat, lng);
                                            setPickupLocation({ label, lat, lng });
                                            setPickupSearch(label);
                                        }
                                    }}
                                />
                            )}
                            {dropLocation && (
                                <Marker 
                                    position={[dropLocation.lat, dropLocation.lng]} 
                                    icon={dropIcon} 
                                    draggable={true}
                                    eventHandlers={{
                                        dragend: async (e) => {
                                            const { lat, lng } = e.target.getLatLng();
                                            const label = await reverseGeocode(lat, lng);
                                            setDropLocation({ label, lat, lng });
                                            setDropSearch(label);
                                        }
                                    }}
                                />
                            )}
                            {routePolyline.length > 0 && <Polyline positions={routePolyline} color="#0DCAF2" weight={6} opacity={0.8} />}
                            <MapAutoCenter center={pickupLocation ? [pickupLocation.lat, pickupLocation.lng] : defaultCenter} />
                        </MapContainer>
                    </div>
                </div>

                {/* Booking Console */}
                <div className="lg:col-span-5 flex flex-col gap-6 bg-white dark:bg-slate-900/40 p-6 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto custom-scrollbar">
                    {/* Category */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Service Category</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'bike', label: 'Bike', icon: 'motorcycle' },
                                { id: 'car', label: 'Car', icon: 'directions_car' },
                                { id: 'cargo', label: 'Cargo', icon: 'local_shipping' },
                            ].map(t => (
                                <button key={t.id} onClick={() => setSelectedType(t.id)}
                                    className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all gap-2 ${selectedType === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-slate-100 dark:border-slate-800 hover:border-primary/40'}`}>
                                    <span className="material-symbols-outlined">{t.icon}</span>
                                    <span className="text-[10px] font-bold uppercase">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trip Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trip Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setTripType('one_way')}
                                className={`py-3 rounded-2xl border-2 font-bold text-[10px] transition-all ${tripType === 'one_way' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-50 dark:border-slate-800'}`}>
                                One Way
                            </button>
                            <button onClick={() => setTripType('round_trip')}
                                className={`py-3 rounded-2xl border-2 font-bold text-[10px] transition-all ${tripType === 'round_trip' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-50 dark:border-slate-800'}`}>
                                Round Trip
                            </button>
                            <button onClick={() => setTripType('daily')}
                                className={`py-3 rounded-2xl border-2 font-bold text-[10px] transition-all ${tripType === 'daily' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-50 dark:border-slate-800'}`}>
                                Daily (12h)
                            </button>
                        </div>
                        {tripType === 'daily' && (
                            <p className="text-[9px] text-primary/80 font-medium italic mt-1">
                                * Fixed ₹1000 for 150 km. (Incl. Pickup + Drop)
                            </p>
                        )}
                        {(tripType === 'round_trip' || tripType === 'daily') && (
                            <div className="flex items-center gap-2 mt-2 p-2 bg-primary/5 rounded-xl border border-primary/10">
                                <Info className="size-3 text-primary" />
                                <p className="text-[9px] text-primary font-bold uppercase tracking-tight">
                                    Waiting charges are applicable (₹35/hour)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Scheduling Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timing</label>
                        <div className="flex gap-4">
                            <button onClick={() => setIsScheduled(false)}
                                className={`flex-1 py-4 rounded-2xl border-2 font-bold text-xs transition-all ${!isScheduled ? 'border-primary bg-primary/10 text-primary' : 'border-slate-50 dark:border-slate-800'}`}>
                                Ride Now
                            </button>
                            <button onClick={() => setIsScheduled(true)}
                                className={`flex-1 py-4 rounded-2xl border-2 font-bold text-xs transition-all ${isScheduled ? 'border-primary bg-primary/10 text-primary' : 'border-slate-50 dark:border-slate-800'}`}>
                                Schedule Later
                            </button>
                        </div>
                        <AnimatePresence>
                            {isScheduled && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="pt-3">
                                        <input type="datetime-local" 
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                                            className="w-full px-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none font-medium text-sm text-slate-700 dark:text-slate-200"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* Please select a time at least 30 minutes in the future.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-5">
                        <div className="relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Pickup Location</label>
                            <div className="relative" ref={pickupRef}>
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-primary" />
                                <input value={pickupSearch} onChange={(e) => setPickupSearch(e.target.value)}
                                    onFocus={() => pickupSearch.length >= 3 && searchLocation(pickupSearch, setPickupSuggestions, setIsSearchingPickup)}
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
                                    placeholder="Set pickup..." />
                                <button type="button" onClick={handleSetCurrentLocation} disabled={isLocating}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors disabled:opacity-50">
                                    {isLocating ? <Loader2 className="size-5 animate-spin" /> : <Target className="size-5" />}
                                </button>
                            </div>
                            <AnimatePresence>
                                {pickupSuggestions.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 mt-2 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                                        {pickupSuggestions.map((s, i) => (
                                            <button key={i} type="button" onClick={() => { setPickupLocation(s); setPickupSearch(s.label); setPickupSuggestions([]); }}
                                                className="w-full px-5 py-4 text-left text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-0 truncate font-medium">
                                                {s.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Drop Location</label>
                            <div className="relative" ref={dropRef}>
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-rose-500" />
                                <input value={dropSearch} onChange={(e) => setDropSearch(e.target.value)}
                                    onFocus={() => dropSearch.length >= 3 && searchLocation(dropSearch, setDropSuggestions, setIsSearchingDrop)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
                                    placeholder="Set destination..." />
                            </div>
                            <AnimatePresence>
                                {dropSuggestions.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 mt-2 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                                        {dropSuggestions.map((s, i) => (
                                            <button key={i} type="button" onClick={() => { setDropLocation(s); setDropSearch(s.label); setDropSuggestions([]); }}
                                                className="w-full px-5 py-4 text-left text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-0 truncate font-medium">
                                                {s.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Simple Fare Display */}
                    {distance > 0 && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 text-slate-500 font-medium">
                                    <span className="material-symbols-outlined text-sm">straighten</span>
                                    Distance & Time
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{distance.toFixed(1)} km / {durationText}</span>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <button 
                                    onClick={() => selectedType === 'bike' && setShowFareModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-black text-primary uppercase tracking-wider hover:bg-primary/10 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    Fare Details
                                </button>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-primary">₹{price}</span>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">All inclusive</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vehicle */}
                    {selectedVehicle ? (
                        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Navigation className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{selectedVehicle.brand} {selectedVehicle.model_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedVehicle.registration_number}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowVehicleSelector(true)} className="text-[10px] font-black text-primary uppercase tracking-widest">Change</button>
                        </div>
                    ) : (
                        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-center space-y-3">
                            <p className="text-xs font-bold text-red-400">No {selectedType} vehicles linked</p>
                            <button onClick={() => navigate('/customer/vehicles')} className="text-[10px] font-black text-red-500 uppercase underline">Add Vehicle</button>
                        </div>
                    )}

                    <button onClick={handleBookRide} disabled={!pickupLocation || !dropLocation || !selectedVehicle || (isScheduled && !scheduledTime)}
                        className="w-full py-5 bg-primary text-background-dark font-black text-lg rounded-2xl shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest active:scale-95">
                        {isScheduled ? 'Schedule Booking' : `Book ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`}
                    </button>
                </div>
            </main>

            {/* Vehicle Modal */}
            <AnimatePresence>
                {showVehicleSelector && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl p-8 border border-white/10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black italic">My {selectedType}s</h3>
                                <button onClick={() => setShowVehicleSelector(false)} className="text-slate-400"><span className="material-symbols-outlined">close</span></button>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {vehicles.filter(v => v.vehicle_type === selectedType).map(v => (
                                    <div key={v.id} onClick={() => { setSelectedVehicle(v); setShowVehicleSelector(false); }}
                                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedVehicle?.id === v.id ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800/50'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined">{v.vehicle_type === 'bike' ? 'motorcycle' : v.vehicle_type === 'cargo' ? 'local_shipping' : 'directions_car'}</span>
                                            </div>
                                            <div><p className="font-bold text-sm">{v.brand} {v.model_name}</p><p className="text-[10px] text-slate-500 uppercase">{v.registration_number}</p></div>
                                        </div>
                                        {selectedVehicle?.id === v.id && <span className="material-symbols-outlined text-primary">check_circle</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <BikeFareDetailsModal 
                isOpen={showFareModal} 
                onClose={() => setShowFareModal(false)} 
                fareDetails={fareDetails} 
            />
        </div>
    );
};

export default BookDriver;
