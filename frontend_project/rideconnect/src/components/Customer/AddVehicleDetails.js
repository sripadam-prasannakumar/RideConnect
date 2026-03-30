import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthStatus } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';

// Indian Vehicle Registration Regex: 2 letters + 2 digits + 1-2 letters + 4 digits
const VEHICLE_REG_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;

const AddVehicleDetails = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const brand = searchParams.get('brand') || '';
    const model = searchParams.get('model') || '';

    // Form State
    const [regNumber, setRegNumber] = useState('');
    const [regError, setRegError] = useState('');
    const [vehicleType, setVehicleType] = useState(searchParams.get('type') || 'car'); // car, bike, cargo
    const [fuelType, setFuelType] = useState('petrol');
    const [transmission, setTransmission] = useState('automatic');
    const [loadCapacity, setLoadCapacity] = useState(''); // in kg
    const [images, setImages] = useState([]);
    const [imageError, setImageError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editVehicleId, setEditVehicleId] = useState(null);
    const fileInputRef = useRef(null);

    // Check for edit mode
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId) {
            setIsEditMode(true);
            setEditVehicleId(editId);
            fetchVehicleData(editId);
        }
    }, [searchParams]);
    const fetchVehicleData = async (id) => {
        try {
            const response = await authorizedFetch(`${API_BASE_URL}/api/user-vehicles/${id}/`);
            if (response.ok) {
                const data = await response.json();
                setRegNumber(data.registration_number);
                setVehicleType(data.vehicle_type || 'car');
                setFuelType(data.fuel_type);
                setTransmission(data.transmission);
                setLoadCapacity(data.load_capacity || '');
                // For images, we show existing ones as previews but they are handled differently
                if (data.images) {
                    setImages(data.images.map(img => ({ 
                        id: img.id, 
                        url: `${API_BASE_URL}${img.image}`,
                        file: null, // Existing image doesn't have a new file
                        isExisting: true 
                    })));
                }
            }
        } catch (error) {
            console.error('Error fetching vehicle for edit:', error);
        }
    };

    // Handle registration number input
    const handleRegNumberChange = (e) => {
        const raw = e.target.value.toUpperCase().replace(/\s+/g, '');
        setRegNumber(raw);
        if (submitted || regError) {
            validateRegNumber(raw);
        }
    };

    const validateRegNumber = (value) => {
        if (!value) {
            setRegError('Vehicle Registration Number is required.');
            return false;
        }
        if (!VEHICLE_REG_REGEX.test(value)) {
            setRegError('Please enter a valid Indian Vehicle Registration Number (e.g., AP21AB1234).');
            return false;
        }
        setRegError('');
        return true;
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const totalAfter = images.length + files.length;

        if (totalAfter > 4) {
            setImageError('You can upload a maximum of 4 images.');
            const allowed = files.slice(0, 4 - images.length);
            const newImages = allowed.map(f => ({ file: f, url: URL.createObjectURL(f) }));
            setImages(prev => [...prev, ...newImages]);
            return;
        }

        setImageError('');
        const newImages = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = async (idx) => {
        const img = images[idx];
        if (img.isExisting) {
            if (!window.confirm('Delete this saved image?')) return;
            try {
                const res = await authorizedFetch(`${API_BASE_URL}/api/user-vehicles/images/${img.id}/`, {
                    method: 'DELETE',
                });
                if (!res.ok) {
                    setImageError('Failed to delete saved image.');
                    return;
                }
            } catch (error) {
                setImageError('Network error deleting image.');
                return;
            }
        }
        setImages(prev => prev.filter((_, i) => i !== idx));
        if (images.length - 1 >= 2) setImageError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        setRegError('');
        setImageError('');

        const regValid = validateRegNumber(regNumber);
        if (images.length < 2) {
            setImageError(`Please upload at least 2 ${vehicleType} images.`);
        }

        if (!regValid || images.length < 2) return;

        const { email } = getAuthStatus();
        if (!email) {
            navigate('/login?role=customer');
            return;
        }

        // Prepare FormData for multi-part file upload
        const formData = new FormData();
        formData.append('email', email);
        formData.append('vehicle_type', vehicleType);
        formData.append('brand', brand);
        formData.append('model_name', model);
        formData.append('registration_number', regNumber);
        formData.append('fuel_type', fuelType);
        formData.append('transmission', transmission);
        if (vehicleType === 'cargo' && loadCapacity) {
            formData.append('load_capacity', loadCapacity);
        }
        
        // Append all NEW images
        images.forEach((img, index) => {
            if (img.file) {
                formData.append('images', img.file);
            }
        });

        try {
            const url = isEditMode 
                ? `${API_BASE_URL}/api/user-vehicles/${editVehicleId}/`
                : `${API_BASE_URL}/api/user-vehicles/`;
            
            const response = await authorizedFetch(url, {
                method: isEditMode ? 'PATCH' : 'POST',
                body: formData,
            });

            if (response.ok) {
                navigate('/customer/profile');
            } else {
                const data = await response.json();
                setRegError(data.registration_number ? data.registration_number[0] : 'Failed to save vehicle. Please try again.');
            }
        } catch (error) {
            console.error('Error saving vehicle:', error);
            setRegError('Network error. Please check your connection.');
        }
    };

    const fuelOptions = [
        { value: 'petrol', label: 'Petrol', icon: 'local_gas_station' },
        { value: 'diesel', label: 'Diesel', icon: 'oil_barrel' },
        { value: 'cng', label: 'CNG', icon: 'propane' },
        { value: 'ev', label: 'EV', icon: 'ev_station' },
    ];

    const vehicleTypeOptions = [
        { value: 'car', label: 'Car', icon: 'directions_car' },
        { value: 'bike', label: 'Bike', icon: 'motorcycle' },
        { value: 'cargo', label: 'Cargo', icon: 'local_shipping' },
    ];

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
            {/* Navigation Bar */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-4 w-full">
                <div className="flex items-center gap-6">
                    <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-200 dark:border-slate-800" />
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/customer/dashboard')}>
                        <div className="size-8 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined font-black text-2xl text-primary">directions_car</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">Vehicle Details</h2>
                    </div>
                </div>
            </header>

                    <main className="flex flex-1 justify-center py-8 px-6">
                        <div className="layout-content-container flex flex-col max-w-[600px] flex-1">
                            {/* Progress Indicator */}
                            <div className="flex flex-col gap-3 mb-8">
                                <div className="flex gap-6 justify-between items-end">
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Step 3 of 3</p>
                                    <p className="text-primary text-sm font-bold">100%</p>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-primary/10 overflow-hidden">
                                    <div className="h-full rounded-full bg-primary" style={{ width: '100%' }}></div>
                                </div>
                                {brand && model && (
                                    <p className="text-slate-500 dark:text-primary/70 text-sm font-normal">
                                        Adding: <span className="text-primary font-bold">{brand} {model}</span>
                                    </p>
                                )}
                            </div>

                            {/* Header Text */}
                            <div className="flex flex-col gap-2 mb-8">
                                <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black leading-tight tracking-tight">
                                    {isEditMode ? 'Edit Vehicle Details' : 'Add Vehicle Details'}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400 text-base">
                                    {isEditMode ? 'Update your vehicle information below.' : 'Enter your vehicle information to complete the setup.'}
                                </p>
                            </div>

                            {/* Form */}
                            <form className="flex flex-col gap-7" onSubmit={handleSubmit}>

                                {/* === VEHICLE TYPE === */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wide flex items-center gap-1">
                                        Vehicle Type
                                        <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {vehicleTypeOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setVehicleType(opt.value)}
                                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 text-center transition-all cursor-pointer ${
                                                    vehicleType === opt.value
                                                        ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                                                        : 'border-slate-200 dark:border-primary/10 bg-white dark:bg-primary/5 text-slate-600 dark:text-slate-400 hover:border-primary/40'
                                                }`}
                                            >
                                                <span className={`material-symbols-outlined text-2xl ${vehicleType === opt.value ? 'text-primary' : 'text-slate-400'}`}>
                                                    {opt.icon}
                                                </span>
                                                <span className="text-xs font-bold">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* === VEHICLE REGISTRATION NUMBER === */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wide flex items-center gap-1">
                                        Vehicle Registration Number
                                        <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">pin</span>
                                        <input
                                            className={`w-full pl-12 pr-4 h-14 rounded-xl border-2 bg-white dark:bg-primary/5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all text-base font-mono tracking-widest uppercase placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:tracking-normal ${
                                                regError
                                                    ? 'border-red-500 focus:ring-red-400/30 focus:border-red-500'
                                                    : regNumber && !regError && VEHICLE_REG_REGEX.test(regNumber)
                                                    ? 'border-emerald-500 focus:ring-emerald-400/30 focus:border-emerald-500'
                                                    : 'border-slate-200 dark:border-primary/20 focus:ring-primary/30 focus:border-primary'
                                            }`}
                                            placeholder="e.g. AP21AB1234"
                                            type="text"
                                            maxLength={10}
                                            value={regNumber}
                                            onChange={handleRegNumberChange}
                                            onBlur={() => validateRegNumber(regNumber)}
                                        />
                                        {regNumber && !regError && VEHICLE_REG_REGEX.test(regNumber) && (
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">check_circle</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-500">Format: 2 letters + 2 digits + 1-2 letters + 4 digits (e.g. AP21AB1234)</p>
                                    <AnimatePresence>
                                        {regError && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                className="text-sm text-red-500 font-medium flex items-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-base">error</span>
                                                {regError}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* === LOAD CAPACITY (Cargo only) === */}
                                {vehicleType === 'cargo' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex flex-col gap-2"
                                    >
                                        <label className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wide flex items-center gap-1">
                                            Load Capacity (kg)
                                            <span className="text-red-500 font-bold">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">weight</span>
                                            <input
                                                className="w-full pl-12 pr-4 h-14 rounded-xl border-2 border-slate-200 dark:border-primary/20 bg-white dark:bg-primary/5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
                                                placeholder="e.g. 500"
                                                type="number"
                                                value={loadCapacity}
                                                onChange={(e) => setLoadCapacity(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* === FUEL TYPE === */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wide flex items-center gap-1">
                                        Fuel Type
                                        <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {fuelOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFuelType(opt.value)}
                                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 text-center transition-all cursor-pointer ${
                                                    fuelType === opt.value
                                                        ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                                                        : 'border-slate-200 dark:border-primary/10 bg-white dark:bg-primary/5 text-slate-600 dark:text-slate-400 hover:border-primary/40'
                                                }`}
                                            >
                                                <span className={`material-symbols-outlined text-2xl ${fuelType === opt.value ? 'text-primary' : 'text-slate-400'}`}>
                                                    {opt.icon}
                                                </span>
                                                <span className="text-xs font-bold">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* === TRANSMISSION TYPE === */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wide flex items-center gap-1">
                                        Transmission Type
                                        <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'manual', label: 'Manual', icon: 'settings' },
                                            { value: 'automatic', label: 'Automatic', icon: 'auto_mode' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setTransmission(opt.value)}
                                                className={`flex items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer font-bold text-sm ${
                                                    transmission === opt.value
                                                        ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                                                        : 'border-slate-200 dark:border-primary/10 bg-white dark:bg-primary/5 text-slate-600 dark:text-slate-400 hover:border-primary/40'
                                                }`}
                                            >
                                                <span className={`material-symbols-outlined text-xl ${transmission === opt.value ? 'text-primary' : 'text-slate-400'}`}>
                                                    {opt.icon}
                                                </span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* === VEHICLE IMAGES === */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wide flex items-center gap-1">
                                        {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Images
                                        <span className="text-red-500 font-bold">*</span>
                                        <span className="text-slate-400 font-normal normal-case ml-1">(2–4 photos required)</span>
                                    </label>

                                    {/* Image Preview Grid */}
                                    {images.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <AnimatePresence>
                                                {images.map((img, idx) => (
                                                    <motion.div
                                                        key={img.url}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="relative group aspect-square rounded-xl overflow-hidden border-2 border-primary/30 shadow-md"
                                                    >
                                                        <img src={img.url} alt={`vehicle-${idx}`} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(idx)}
                                                                className="bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                        <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                            #{idx + 1}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    {images.length < 4 && (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${
                                                imageError
                                                    ? 'border-red-400 bg-red-500/5'
                                                    : 'border-slate-300 dark:border-primary/20 hover:border-primary/50 hover:bg-primary/5 bg-slate-50 dark:bg-primary/5'
                                            }`}
                                        >
                                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-slate-700 dark:text-slate-300">Click to upload {vehicleType} photos</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {images.length === 0 ? 'Add 2 to 4 photos' : `${images.length}/4 uploaded — add ${4 - images.length} more`}
                                                </p>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                    )}

                                    {/* Image count indicator */}
                                    <div className="flex gap-2 items-center">
                                        {[1, 2, 3, 4].map(n => (
                                            <div
                                                key={n}
                                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                                    images.length >= n ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                                                }`}
                                            />
                                        ))}
                                        <span className="text-xs text-slate-500 font-bold ml-1">{images.length}/4</span>
                                    </div>

                                    <AnimatePresence>
                                        {imageError && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                className="text-sm text-red-500 font-medium flex items-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-base">error</span>
                                                {imageError}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* === SUBMIT BUTTON === */}
                                <div className="mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full flex h-14 items-center justify-center gap-2 rounded-xl bg-primary text-background-dark text-lg font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                                        type="submit"
                                    >
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Save &amp; Continue
                                    </motion.button>
                                </div>
                            </form>

                            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-8">
                                By clicking continue, you agree to our <span className="text-primary underline cursor-pointer">Terms of Service</span>
                            </p>
                        </div>
                    </main>
        </div>
    );
};

export default AddVehicleDetails;
