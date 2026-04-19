import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthStatus } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';
import { MapPin, Navigation, Info, Target, Loader2, Truck, UserCircle, Car, Bike, Package, Moon, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BikeFareDetailsModal from './BikeFareDetailsModal';
import CargoFareDetailsModal from './CargoFareDetailsModal';
import VoiceService from '../../utils/voiceService';
import VoiceAssistant from '../Shared/VoiceAssistant';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeClock } from '@mui/x-date-pickers/TimeClock';
import dayjs from 'dayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const muiDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0DCAF2',
    },
    background: {
      paper: 'transparent',
    },
    text: {
      primary: '#fff',
    }
  },
  typography: {
    fontFamily: 'inherit',
  }
});

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAX_BIKE_DISTANCE = 35;

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
    const { state } = useLocation();
    const [pickupLocation, setPickupLocation] = useState(null); 
    const [dropLocation, setDropLocation] = useState(null);
    const [routePolyline, setRoutePolyline] = useState([]);
    const [durationText, setDurationText] = useState('');
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [distance, setDistance] = useState(0);
    const [price, setPrice] = useState(0);

    const [selectedType, setSelectedType] = useState(state?.fastTrackType || 'car');
    const [useDriversVehicle, setUseDriversVehicle] = useState(state?.fastTrackType === 'bike');
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showVehicleSelector, setShowVehicleSelector] = useState(false);
    const [showFareModal, setShowFareModal] = useState(false);
    const [fareDetails, setFareDetails] = useState(null);
    const [calculating, setCalculating] = useState(false);

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
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduledTime, setScheduledTime] = useState(''); // Combined for backend compatibility

    const [isDistanceValid, setIsDistanceValid] = useState(true);
    const [distanceError, setDistanceError] = useState('');

    // Cargo States
    const [cargoCapacity, setCargoCapacity] = useState('500kg');
    const [loadType, setLoadType] = useState('Normal');

    const pickupRef = useRef(null);
    const dropRef = useRef(null);
    const isSelectionTriggered = useRef(false);

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
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=10&viewbox=78.2,17.2,78.8,17.6`);
            const data = await res.json();
            
            // Deduplicate by display name to avoid "multiple suggestions" that are largely identical
            const uniqueResults = [];
            const seenLabels = new Set();
            
            data.forEach(item => {
                const label = item.display_name;
                // Basic normalization: remove extra spaces and commas to detect similar entries
                const normalizedLabel = label.toLowerCase().replace(/[, ]+/g, ' ').trim();
                
                if (!seenLabels.has(normalizedLabel)) {
                    seenLabels.add(normalizedLabel);
                    uniqueResults.push({
                        label: label,
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon)
                    });
                }
            });
            
            setSuggestions(uniqueResults.slice(0, 5)); // Still limit UI show to 5 best unique ones
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
        if (isSelectionTriggered.current) {
            isSelectionTriggered.current = false;
            return;
        }
        const timer = setTimeout(() => searchLocation(pickupSearch, setPickupSuggestions, setIsSearchingPickup), 800);
        return () => clearTimeout(timer);
    }, [pickupSearch]);

    useEffect(() => {
        if (isSelectionTriggered.current) {
            isSelectionTriggered.current = false;
            return;
        }
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

    // 1. Single Unified Fare Calculation Function (CRITICAL)
    const calculateFare = useCallback((dist) => {
        if (!dist || dist <= 0) return null;

        let total_fare = 0;
        let onward_fare = 0;
        let base_fare = 0;
        let surcharge_amount = 0;
        let waiting_charge = 0;
        let load_charge = 0;
        let night_charge = 0;
        let total_distance = dist;
        let return_fare = 0;

        if (selectedType === 'cargo' && useDriversVehicle) {
            // Updated Cargo Request Van Rates
            const pricing_map = {
                '500kg': { base: 150.0, rate: 11.0 },
                '1 Ton': { base: 220.0, rate: 15.0 },
                '1.5 Ton': { base: 280.0, rate: 19.0 },
                '2 Ton': { base: 350.0, rate: 23.0 },
                '2.5 Ton': { base: 550.0, rate: 29.0 },
                '3 Ton': { base: 750.0, rate: 35.0 },
            };
            const config = pricing_map[cargoCapacity] || pricing_map['500kg'];
            base_fare = config.base;
            let kmRate = config.rate;

            // Apply Cargo Discount (₹3/km) as requested by USER
            kmRate = kmRate - 3;

            if (dist <= 5) onward_fare = base_fare;
            else onward_fare = base_fare + (dist * kmRate);

            if (dist > 15) onward_fare *= 0.9; // 10% Long distance discount

            // Add load charges
            const load_charges = { 'Normal': 0.0, 'Heavy': 100.0, 'Fragile': 150.0, 'Furniture': 200.0 };
            load_charge = load_charges[loadType] || 0;

            // Night Charges (Check local hour)
            const hour = new Date().getHours();
            if (hour >= 22 || hour < 6) night_charge = onward_fare * 0.15;

            // Fixed 20% Surge for Consistency
            surcharge_amount = onward_fare * 0.20;

            total_fare = onward_fare + load_charge + surcharge_amount + night_charge;
        } else if (selectedType === 'bike') {
            base_fare = 22.0;
            if (dist <= 2) onward_fare = base_fare;
            else if (dist <= 6) onward_fare = base_fare + (dist - 2.0) * 6.0;
            else onward_fare = base_fare + (4.0 * 6.0) + ((dist - 6.0) * 8.0);
            
            surcharge_amount = 15.0; // Fixed surcharge
            total_fare = onward_fare + surcharge_amount;
        } else {
            // Standard Car / Own Vehicle Cargo
            base_fare = (tripType === 'daily') ? 1000.0 : 600.0;
            const threshold = (tripType === 'daily') ? 150.0 : 40.0;
            
            onward_fare = base_fare + (dist > threshold ? (dist - threshold) * 3.0 : 0);
            if (tripType === 'round_trip' || (tripType === 'daily' && dist > 150)) {
                return_fare = dist * 3.0;
            }
            total_fare = onward_fare + return_fare;
            total_distance = (tripType === 'round_trip' || tripType === 'daily') ? dist * 2 : dist;
        }

        const details = {
            total_fare: Math.round(total_fare),
            total: Math.round(total_fare), // Alias for consistency with USER naming
            base_fare,
            onward_fare,
            load_charge,
            waiting_charge,
            night_charge,
            surcharge_amount,
            total_distance: parseFloat(total_distance.toFixed(2)),
            return_fare
        };

        // DEBUG CHECK (MANDATORY)
        console.log("MAIN:", details.total);
        console.log("MODAL:", details.total);
        return details;
    }, [selectedType, tripType, cargoCapacity, loadType, useDriversVehicle]);

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
                setDistance(onwardDistanceRaw);
                const onwardDurationSec = route.duration;
                setDurationSeconds(onwardDurationSec);

                // Use the Single Source of Truth function
                const details = calculateFare(onwardDistanceRaw);
                if (details) {
                    setFareDetails(details);
                    setPrice(details.total_fare);
                }

                const durText = onwardDurationSec > 3600
                    ? `${Math.floor(onwardDurationSec / 3600)}h ${Math.floor((onwardDurationSec % 3600) / 60)}m`
                    : `${Math.ceil(onwardDurationSec / 60)} mins`;
                setDurationText(durText);
            }
        } catch (error) { console.error("Routing error:", error); }
    }, [pickupLocation, dropLocation, calculateFare]);

    // Update fare in real-time when dependencies change
    useEffect(() => {
        if (distance > 0) {
            const details = calculateFare(distance);
            if (details) {
                setFareDetails(details);
                setPrice(details.total_fare);
            }
        }
    }, [distance, calculateFare]);

    useEffect(() => {
        calculateRoute();
    }, [pickupLocation, dropLocation, tripType, selectedType, useDriversVehicle, cargoCapacity, loadType, calculateRoute]);

    // Distance Restriction for Bikes
    useEffect(() => {
        if (selectedType === 'bike' && distance > MAX_BIKE_DISTANCE) {
            setIsDistanceValid(false);
            const msg = `Bike rides are limited to ${MAX_BIKE_DISTANCE} KM. Please choose Car or Cargo for longer trips.`;
            setDistanceError(msg);
            VoiceService.speak(msg, { rate: 0.9 });
        } else {
            setIsDistanceValid(true);
            setDistanceError('');
        }
    }, [selectedType, distance]);

    const handleBookRide = async () => {
        if (!pickupLocation || !dropLocation || (!selectedVehicle && !useDriversVehicle)) return;

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
            vehicle_id: useDriversVehicle ? null : selectedVehicle?.id,
            cargo_capacity: cargoCapacity,
            load_type: loadType,
            is_own_vehicle: selectedType === 'cargo' && !useDriversVehicle,
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

                if (data.status === 'scheduled') {
                    VoiceService.speak(`Your ride for ${new Date(scheduledTime).toLocaleString()} has been scheduled successfully.`, { rate: 0.8 });
                    alert("Ride scheduled successfully! You can view it in your Ride History.");
                    navigate('/customer/dashboard');
                } else {
                    VoiceService.speak("Your ride request is successful. Searching for nearby drivers. Please hold on.", { rate: 0.85 });
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

            <main className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)]">
                {/* Map Section */}
                <div className="lg:col-span-7 flex flex-col gap-4 h-[40vh] lg:h-auto shrink-0">
                    <div className="flex flex-col hidden lg:flex">
                        <h1 className="text-2xl font-black">Plan Your Ride</h1>
                        <p className="text-sm text-slate-500">Fixed base pricing and transparent distance tracking.</p>
                    </div>

                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative z-0">
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
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Service Category</label>
                            <span className="text-[8px] font-black text-primary uppercase italic tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">Premium Dispatch</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'car', label: 'Car', icon: <Car className="size-5" />, desc: 'Pro Cabs' },
                                { id: 'cargo', label: 'Cargo', icon: <Truck className="size-5" />, desc: 'Goods Van' },
                                { id: 'bike', label: 'Bike Rides', icon: <Bike className="size-5" />, desc: 'Quick Bike Ride' },
                            ].map(t => (
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    key={t.id} 
                                    onClick={() => {
                                        setSelectedType(t.id);
                                        if (t.id === 'bike') setUseDriversVehicle(true);
                                        else if (t.id === 'car') setUseDriversVehicle(false);
                                    }}
                                    className={`flex flex-col items-center justify-center p-4 min-h-[90px] rounded-3xl border-2 transition-all gap-2 
                                        ${selectedType === t.id 
                                            ? (t.id === 'bike' && !isDistanceValid ? 'border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(13,204,242,0.15)]') 
                                            : (t.id === 'bike' && distance > MAX_BIKE_DISTANCE ? 'border-red-500/30 text-red-500/50 hover:border-red-500/50' : 'border-slate-100 dark:border-slate-800 hover:border-primary/40')} 
                                        scale-[1.02]`}
                                >
                                    {t.icon}
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{t.label}</p>
                                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t.desc}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Cargo Service Options (New) */}
                    {selectedType === 'cargo' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cargo Logistics Mode</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={() => setUseDriversVehicle(false)}
                                    className={`group flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-bold text-xs ${!useDriversVehicle ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-emerald-500/30'}`}>
                                    <UserCircle className={`size-4 transition-transform group-hover:scale-110 ${!useDriversVehicle ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <div className="text-left">
                                        <p className="leading-none">Own Vehicle</p>
                                        <p className="text-[7px] font-medium uppercase mt-0.5 opacity-60">I have the van</p>
                                    </div>
                                </button>
                                <button onClick={() => setUseDriversVehicle(true)}
                                    className={`group flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-bold text-xs ${useDriversVehicle ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-blue-500/30'}`}>
                                    <Truck className={`size-4 transition-transform group-hover:scale-110 ${useDriversVehicle ? 'text-blue-500' : 'text-slate-400'}`} />
                                    <div className="text-left">
                                        <p className="leading-none">Request Van</p>
                                        <p className="text-[7px] font-medium uppercase mt-0.5 opacity-60">Driver with Van</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Cargo Configuration (New) */}
                    {selectedType === 'cargo' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5 bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/10 mb-2">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Load Capacity</label>
                                <div className="flex flex-wrap gap-2">
                                    {['500kg', '1 Ton', '1.5 Ton', '2 Ton', '2.5 Ton', '3 Ton'].map(cap => (
                                        <button key={cap} onClick={() => setCargoCapacity(cap)}
                                            className={`px-3 py-2 rounded-xl border-2 font-bold text-[10px] transition-all ${cargoCapacity === cap ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-emerald-500/30'}`}>
                                            {cap}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Load Type</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {['Normal', 'Heavy', 'Fragile', 'Furniture'].map(type => (
                                        <button key={type} onClick={() => setLoadType(type)}
                                            className={`py-2 rounded-xl border-2 font-bold text-[10px] transition-all capitalize ${loadType === type ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-blue-500/30'}`}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Trip Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trip Mode</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                        <div className="flex flex-col sm:flex-row gap-4">
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
                                        <button 
                                            onClick={() => setShowDatePicker(true)}
                                            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 hover:border-primary transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <Clock className="size-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ride Timing</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-white">
                                                        {scheduleDate && scheduleTime ? `${scheduleDate} at ${scheduleTime}` : "Select Date & Time"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">calendar_month</span>
                                        </button>
                                        <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* Professional schedule system active.</p>
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
                                            <button key={i} type="button" onClick={() => { 
                                                isSelectionTriggered.current = true;
                                                setPickupLocation(s); 
                                                setPickupSearch(s.label); 
                                                setPickupSuggestions([]); 
                                            }}
                                                className="w-full px-5 py-4 text-left text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-0 font-medium line-clamp-1">
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
                                            <button key={i} type="button" onClick={() => { 
                                                isSelectionTriggered.current = true;
                                                setDropLocation(s); 
                                                setDropSearch(s.label); 
                                                setDropSuggestions([]); 
                                            }}
                                                className="w-full px-5 py-4 text-left text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-0 font-medium line-clamp-1">
                                                {s.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Vehicle */}
                    {useDriversVehicle ? (
                         <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-background-dark shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl">{selectedType === 'bike' ? 'motorcycle' : 'local_shipping'}</span>
                            </div>
                            <div>
                                <p className="font-black italic uppercase text-primary tracking-tight">Driver Assigned {selectedType}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Professional {selectedType} service included</p>
                            </div>
                         </div>
                    ) : selectedVehicle ? (
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
                    
                    {/* MANDATORY FARE DISPLAY CARD - ALWAYS VISIBLE */}
                    <div className="relative z-[100] mt-4 mb-2 p-3 bg-[#0f172a] rounded-xl border border-white/5 shadow-2xl">
                        {console.log("Fare:", price, "Distance:", distance)}
                        <div className="flex justify-between items-center px-2">
                           <div className="space-y-0.5">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Estimated Fare</p>
                                <h3 className="text-xl font-black text-white italic">
                                    {(fareDetails?.total_fare || price) > 0 ? `₹${fareDetails?.total_fare || price}` : "Calculating..."}
                                </h3>
                           </div>
                           <div className="text-right space-y-0.5">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Distance</p>
                                <p className={`text-sm font-bold ${selectedType === 'bike' && !isDistanceValid ? 'text-red-500' : 'text-primary'}`}>
                                    {distance > 0 ? `${distance.toFixed(1)} km` : "-- km"}
                                </p>
                                {selectedType === 'bike' && (
                                    <p className={`text-[8px] font-black uppercase tracking-tight ${distance > MAX_BIKE_DISTANCE ? 'text-red-400' : 'text-slate-500'}`}>
                                        Max for Bike: {MAX_BIKE_DISTANCE}km
                                    </p>
                                )}
                           </div>
                        </div>
                        {price > 0 && (
                            <button 
                                onClick={() => (selectedType === 'bike' || selectedType === 'cargo') && setShowFareModal(true)}
                                className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-colors">
                                <Info className="size-3" /> View Breakdown
                            </button>
                        )}
                        
                        {distanceError && selectedType === 'bike' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-[9px] font-bold text-red-500 flex items-center gap-2">
                                    <Info className="size-3 shrink-0" />
                                    {distanceError}
                                </p>
                                <div className="mt-2 flex gap-2">
                                    <button onClick={() => setSelectedType('car')} className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-red-500 text-white">Switch to Car</button>
                                    <button onClick={() => setSelectedType('cargo')} className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/10 text-red-400">Switch to Cargo</button>
                                </div>
                            </motion.div>
                        )}
                        
                        <AnimatePresence>
                            {calculating && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                                    <Loader2 className="size-5 text-primary animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={handleBookRide} disabled={!pickupLocation || !dropLocation || (!selectedVehicle && !useDriversVehicle) || (isScheduled && !scheduledTime) || !isDistanceValid}
                        className="w-full py-5 bg-primary text-background-dark font-black text-lg rounded-2xl shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest active:scale-95">
                        {isScheduled ? 'Schedule Booking' : `Book ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`}
                    </button>

                    {/* Integrated Voice Assistant */}
                    <div className="flex flex-col items-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Voice Assistant</p>
                        <VoiceAssistant 
                            placeholder="Try saying 'Book Bike' or 'Call Car'"
                            onCommand={(cmd) => {
                                const cleanCmd = cmd.toLowerCase();
                                if (cleanCmd.includes('bike')) setSelectedType('bike');
                                if (cleanCmd.includes('car')) setSelectedType('car');
                                if (cleanCmd.includes('cargo')) setSelectedType('cargo');
                                
                                if (cleanCmd.includes('book') || cleanCmd.includes('confirm')) {
                                    if (pickupLocation && dropLocation && selectedVehicle) {
                                        handleBookRide();
                                    } else {
                                        VoiceService.speak("Please set pickup and destination first.", { rate: 0.9 });
                                    }
                                }
                            }}
                        />
                    </div>
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

            {/* Modern Date/Time Picker Modal */}
            <AnimatePresence>
                {showDatePicker && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-background-dark/95 backdrop-blur-xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-slate-900 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        >
                            <div className="p-8 pb-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                                        <h3 className="text-xl font-black italic tracking-tight">Schedule Your Ride</h3>
                                    </div>
                                    <button onClick={() => setShowDatePicker(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Date Selection */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Select Date</label>
                                        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                                            {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + offset);
                                                const dateStr = d.toISOString().split('T')[0];
                                                const isSelected = scheduleDate === dateStr;
                                                return (
                                                    <button 
                                                        key={dateStr}
                                                        onClick={() => setScheduleDate(dateStr)}
                                                        className={`shrink-0 flex flex-col items-center justify-center size-20 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary text-background-dark' : 'border-white/5 bg-white/5 text-slate-300'}`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase mb-1">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                        <span className="text-xl font-black">{d.getDate()}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Time Selection */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Select Time</label>
                                        <div className="flex flex-col items-center p-4 rounded-3xl bg-white/5 border border-white/10">
                                            <ThemeProvider theme={muiDarkTheme}>
                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                    <TimeClock 
                                                        value={scheduleTime ? dayjs(scheduleTime, 'HH:mm') : null}
                                                        onChange={(newValue) => setScheduleTime(newValue ? newValue.format('HH:mm') : '')}
                                                    />
                                                </LocalizationProvider>
                                            </ThemeProvider>
                                            <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/20 border border-white/5">
                                                <Clock className="size-4 text-primary" />
                                                <div className="text-white font-bold text-lg tracking-widest">
                                                    {scheduleTime ? dayjs(scheduleTime, 'HH:mm').format('hh:mm A') : '--:-- --'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        disabled={!scheduleDate || !scheduleTime}
                                        onClick={() => {
                                            const combined = `${scheduleDate}T${scheduleTime}`;
                                            setScheduledTime(combined);
                                            setShowDatePicker(false);
                                            VoiceService.speak(`Ride scheduled for ${scheduleDate} at ${scheduleTime}`, { rate: 0.9 });
                                        }}
                                        className="w-full py-5 bg-primary text-background-dark font-black text-lg rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-30 disabled:pointer-events-none uppercase tracking-widest mt-4"
                                    >
                                        Confirm Schedule
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <BikeFareDetailsModal
                isOpen={showFareModal && selectedType === 'bike'}
                onClose={() => setShowFareModal(false)}
                fareDetails={fareDetails}
            />

            <CargoFareDetailsModal
                isOpen={showFareModal && selectedType === 'cargo'}
                onClose={() => setShowFareModal(false)}
                fareDetails={fareDetails}
            />
        </div>
    );
};

export default BookDriver;
