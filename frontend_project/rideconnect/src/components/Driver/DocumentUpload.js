import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalBackButton from '../Shared/GlobalBackButton';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import { Bike, Car, Truck, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';



/* ─── Per-field validation helper ─── */
const DL_REGEX = /^[A-Z]{2}[0-9]{2,3}\s?[0-9]{4}[0-9]{7}$/;
const VEHICLE_NUM_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;

/* ─── Indian State Codes ─── */
const STATE_CODES = {
    AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam', BR: 'Bihar',
    CG: 'Chhattisgarh', CH: 'Chandigarh', DD: 'Daman & Diu', DL: 'Delhi',
    DN: 'Dadra & Nagar Haveli', GA: 'Goa', GJ: 'Gujarat', HP: 'Himachal Pradesh',
    HR: 'Haryana', JH: 'Jharkhand', JK: 'Jammu & Kashmir', KA: 'Karnataka',
    KL: 'Kerala', LA: 'Ladakh', LD: 'Lakshadweep', MH: 'Maharashtra',
    ML: 'Meghalaya', MN: 'Manipur', MP: 'Madhya Pradesh', MZ: 'Mizoram',
    NL: 'Nagaland', OD: 'Odisha', OR: 'Odisha', PB: 'Punjab', PY: 'Puducherry',
    RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu', TR: 'Tripura',
    TS: 'Telangana', UK: 'Uttarakhand', UP: 'Uttar Pradesh', WB: 'West Bengal',
};

/* ─── Real-time DL validation ─── */
function getDLValidation(val) {
    if (!val) return { status: 'empty', message: 'Driving License number is required', state: '', breakdown: null };
    const clean = val.trim().toUpperCase();
    if (!DL_REGEX.test(clean))
        return { status: 'invalid', message: 'Format: STATE(2) + DISTRICT(2-3) + YEAR(4) + UNIQUE(7) — e.g. AP005 2025 0012833', state: '', breakdown: null };

    const digits = clean.replace(/\s/g, '');
    const curYear = new Date().getFullYear();

    // Smart year extraction: try 2-digit district (yearStart=4) first,
    // then 3-digit district (yearStart=5). Use whichever gives a valid year.
    let districtLen = 2, yearStart = 4;
    let year = parseInt(digits.slice(4, 8), 10);
    if (year < 1990 || year > curYear) {
        const altYear = parseInt(digits.slice(5, 9), 10);
        if (altYear >= 1990 && altYear <= curYear) {
            districtLen = 3; yearStart = 5; year = altYear;
        } else {
            return { status: 'invalid', message: `Year must be between 1990 and ${curYear} (got ${year})`, state: '', breakdown: null };
        }
    }

    const stateCode = clean.slice(0, 2);
    const state = STATE_CODES[stateCode] || '';
    const breakdown = {
        state: digits.slice(0, 2),
        district: digits.slice(2, yearStart),
        year: digits.slice(yearStart, yearStart + 4),
        unique: digits.slice(yearStart + 4),
    };
    return { status: 'valid', message: '✓ Valid Driving License number', state, breakdown };
}

function validateFields(fields) {
    const errs = {};
    if (!fields.fullName.trim()) errs.fullName = 'Full name is required';
    if (!fields.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    if (!fields.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
    else if (!DL_REGEX.test(fields.licenseNumber))
        errs.licenseNumber = 'Invalid format. Example: AP0520250012833';
    if (!fields.licenseType) errs.licenseType = 'License type is required';
    if (!fields.vehicleType) errs.vehicleType = 'Vehicle type is required';
    if (!fields.vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle registration number is required';
    else if (!VEHICLE_NUM_REGEX.test(fields.vehicleNumber.trim().replace(/\s/g, '').toUpperCase()))
        errs.vehicleNumber = 'Enter valid registration (e.g., TS09EA1234)';
    if (!fields.licenseExpiry) errs.licenseExpiry = 'Expiry date is required';
    if (!fields.licenseFile && !fields.hasExistingFront)
        errs.licenseFile = 'Front image is required';
    if (!fields.licenseFileBack && !fields.hasExistingBack)
        errs.licenseFileBack = 'Back image is required';
    return errs;
}

/* ─── ImageUploadBox ─── */
function ImageUploadBox({ label, previewUrl, onChange, error, inputRef }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                {label} <span className="text-red-500">*</span>
            </label>
            <div
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all hover:bg-primary/5 hover:border-primary group
                    ${error ? 'border-red-500/60' : previewUrl ? 'border-primary/50' : 'border-slate-700'}`}
            >
                {previewUrl ? (
                    <div className="relative w-full text-center">
                        <img src={previewUrl} alt="License" className="max-h-44 mx-auto rounded-lg shadow-xl" />
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-2 text-white font-bold px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full border border-white/20">
                                <span className="material-symbols-outlined text-lg">edit_square</span>Change
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors">upload_file</span>
                        </div>
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Tap to browse or drag photo</p>
                        <p className="text-xs text-slate-500 mt-1">JPG or PNG — high quality only</p>
                    </>
                )}
            </div>
            {error && (
                <p className="text-red-500 text-xs font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>{error}
                </p>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
        </div>
    );
}

/* ─── Shared Components ─── */
const InputField = ({ id, label, type = 'text', placeholder, value, onChange, error, icon, maxLength, readOnly, fields }) => (
    <div className="space-y-4">
        <label htmlFor={id} className="block text-xs font-black text-slate-400 uppercase tracking-widest">
            {label} <span className="text-red-500">*</span>
        </label>
        
        {id === 'vehicleType' ? (
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'car', label: 'Car', icon: <Car className="size-5" /> },
                    { id: 'bike', label: 'Bike', icon: <Bike className="size-5" /> },
                    { id: 'cargo', label: 'Cargo Van', icon: <Truck className="size-5" /> },
                ].map(v => (
                    <button
                        key={v.id}
                        type="button"
                        onClick={() => onChange({ target: { value: v.id } })}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${value === v.id ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(13,204,242,0.2)]' : 'border-slate-100 dark:border-slate-800 hover:border-primary/40'}`}
                    >
                        {v.id === 'car' && <Car className="size-5" />}
                        {v.id === 'bike' && <Bike className="size-5" />}
                        {v.id === 'cargo' && <Truck className="size-5" />}
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{v.label}</span>
                    </button>
                ))}
            </div>
        ) : (
            <div className="relative">
                {icon && <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">{icon}</span>}
                <input
                    id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
                    maxLength={maxLength} readOnly={readOnly}
                    className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4 bg-slate-50/50 dark:bg-slate-800/40 border ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                        } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary transition-all ${id === 'licenseNumber' ? 'font-mono tracking-widest uppercase' : ''
                        } dark:[color-scheme:dark]`}
                />
            </div>
        )}

        {error && (
            <p className="text-red-500 text-[11px] font-bold flex items-center gap-1 mt-1 transition-all">
                <AlertCircle className="size-3.5" />
                {error}
            </p>
        )}
    </div>
);



/* ─── Main Component ─── */
const LicenseUpload = () => {
    const navigate = useNavigate();
    const frontRef = useRef(null);
    const backRef = useRef(null);

    const [fields, setFields] = useState({
        fullName: '', dateOfBirth: '', licenseNumber: '',
        licenseType: '', vehicleType: '', licenseExpiry: '',
        vehicleNumber: '', vehicleModel: ''
    });
    const [licenseFile, setLicenseFile] = useState(null);
    const [licenseFileBack, setLicenseFileBack] = useState(null);
    const [previewFront, setPreviewFront] = useState(null);
    const [previewBack, setPreviewBack] = useState(null);
    const [hasExistingFront, setHasExistingFront] = useState(false);
    const [hasExistingBack, setHasExistingBack] = useState(false);

    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [existingStatus, setExistingStatus] = useState(null);

    const email = sessionStorage.getItem('user_email');

    /* Load existing status */
    useEffect(() => {
        if (!email) { navigate('/login'); return; }
        authorizedFetch(`${API_BASE_URL}/api/driver/verification-status/?email=${encodeURIComponent(email)}`)
            .then(r => r.json())
            .then(data => {
                if (data.verification_status) setExistingStatus(data.verification_status);
                if (data.full_name) setFields(f => ({ ...f, fullName: data.full_name }));
                if (data.date_of_birth) setFields(f => ({ ...f, dateOfBirth: data.date_of_birth }));
                if (data.license_number) setFields(f => ({ ...f, licenseNumber: data.license_number }));
                if (data.license_type) setFields(f => ({ ...f, licenseType: data.license_type }));
                if (data.vehicle_type) setFields(f => ({ ...f, vehicleType: data.vehicle_type }));
                if (data.license_expiry) setFields(f => ({ ...f, licenseExpiry: data.license_expiry }));
                setHasExistingFront(data.has_license_image || false);
                setHasExistingBack(data.has_license_image_back || false);
            })
            .catch(console.error);
    }, [email, navigate]);

    const set = (key) => (e) => {
        const val = key === 'licenseNumber'
            ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)
            : e.target.value;
        setFields(f => ({ ...f, [key]: val }));
        setFieldErrors(fe => ({ ...fe, [key]: undefined }));
    };

    const handleImage = (setter, previewSetter) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setter(file);
        previewSetter(URL.createObjectURL(file));
        setFieldErrors(fe => ({ ...fe, [setter === setLicenseFile ? 'licenseFile' : 'licenseFileBack']: undefined }));
    };

    /* Full submit + verify flow */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        // Validate
        const errs = validateFields({ ...fields, licenseFile, licenseFileBack, hasExistingFront, hasExistingBack });
        if (Object.keys(errs).length) {
            setFieldErrors(errs);
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        const formData = new FormData();
        formData.append('email', email);
        formData.append('full_name', fields.fullName.trim());
        formData.append('date_of_birth', fields.dateOfBirth);
        formData.append('license_number', fields.licenseNumber.trim().toUpperCase());
        formData.append('license_type', fields.licenseType);
        formData.append('vehicle_type', fields.vehicleType);
        formData.append('vehicle_number', fields.vehicleNumber.trim().toUpperCase());
        formData.append('vehicle_model', fields.vehicleModel.trim());
        formData.append('license_expiry', fields.licenseExpiry);
        if (licenseFile) formData.append('license_image', licenseFile);
        if (licenseFileBack) formData.append('license_image_back', licenseFileBack);

        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/driver/license/`, { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => navigate('/driver/dashboard'), 2000);
            } else {
                // Check for specific unique validation errors
                if (data.error && data.error.includes('license number')) {
                    setFieldErrors(prev => ({ ...prev, licenseNumber: data.error }));
                } else if (data.registration_number) {
                    setFieldErrors(prev => ({ ...prev, vehicleNumber: data.registration_number[0] }));
                } else {
                    setSubmitError(data.error || "Failed to submit verification details.");
                }
                setIsSubmitting(false);
                if (data.errors) setFieldErrors(data.errors);
                return;
            }
        } catch {
            setSubmitError('Cannot connect to server. Please make sure the backend is running.');
            setIsSubmitting(false);
            return;
        }
    };


    /* Status badge */
    const statusConfig = {
        unverified: { color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30', icon: 'pending', label: 'Not Submitted' },
        pending: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', icon: 'schedule', label: 'Under Review' },
        approved: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', icon: 'verified', label: 'Approved ✓' },
        rejected: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: 'cancel', label: 'Rejected' },
    };

    /* ── Verification loading screen ── */
    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-md w-full text-center space-y-8"
                >
                    {/* Pulsing icon */}
                    <div className="relative mx-auto size-24">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                        <div className="relative size-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">cloud_upload</span>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Submitting Document</h2>
                        <p className="text-slate-500 mt-1 text-sm">Please wait securely uploading your files.</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    /* ── Success screen ── */
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
                <div className="max-w-lg w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-3xl border bg-emerald-500/5 border-emerald-500/30 p-8 space-y-6 shadow-2xl text-center"
                    >
                        <div className="size-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
                        </div>
                        <h3 className="text-2xl font-black text-emerald-400">Successfully Submitted</h3>
                        <p className="text-slate-400 text-sm mt-1 mb-6">Your license verification request is now actively under review by our admin team. You will be notified by email once the process is complete.</p>

                        <button
                            onClick={() => window.location.href = '/driver/dashboard'}
                            className="w-full py-4 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400"
                        >
                            <span className="material-symbols-outlined">dashboard</span> Return to Dashboard
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    /* ── Main form ── */

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <GlobalBackButton variant="ghost" />
                    <span className="font-semibold text-primary">License Verification</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Driver</span>
                    <div className="size-2 bg-primary rounded-full animate-pulse" />
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
                {/* Title */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4 shadow-[0_0_20px_rgba(13,204,242,0.15)]">
                        <span className="material-symbols-outlined text-3xl text-primary">badge</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Driving License Verification</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Fill all fields accurately. Details will be verified against government records.</p>
                </div>

                {/* Status banner */}
                {existingStatus && statusConfig[existingStatus] && (
                    <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${statusConfig[existingStatus].bg}`}>
                        <span className={`material-symbols-outlined text-xl ${statusConfig[existingStatus].color}`}>
                            {statusConfig[existingStatus].icon}
                        </span>
                        <div>
                            <p className={`font-bold ${statusConfig[existingStatus].color}`}>{statusConfig[existingStatus].label}</p>
                            {existingStatus === 'pending' && <p className="text-xs text-slate-400 mt-0.5">Your submission is under review by our team</p>}
                            {existingStatus === 'verified' && <p className="text-xs text-slate-400 mt-0.5">You are fully verified and can accept rides</p>}
                            {existingStatus === 'rejected' && <p className="text-xs text-slate-400 mt-0.5">Please correct your details and re-submit below</p>}
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2">
                        Personal Information
                    </p>

                    {/* Full Name */}
                    <InputField
                        id="fullName" label="Full Name (as on license)"
                        placeholder="e.g. Prashanth Kumar"
                        value={fields.fullName} onChange={set('fullName')}
                        error={fieldErrors.fullName} icon="person"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date of Birth */}
                        <InputField
                            id="dateOfBirth" label="Date of Birth" type="date"
                            value={fields.dateOfBirth} onChange={set('dateOfBirth')}
                            error={fieldErrors.dateOfBirth} icon="cake"
                        />
                        {/* Driving License Number — custom field with real-time validation */}
                        {(() => {
                            const dlVal = getDLValidation(fields.licenseNumber);
                            const isValid = dlVal.status === 'valid';
                            const isInvalid = dlVal.status === 'invalid' || fieldErrors.licenseNumber;
                            return (
                                <div className="space-y-2">
                                    <label htmlFor="licenseNumber" className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Driving License Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">badge</span>
                                        <input
                                            id="licenseNumber"
                                            type="text"
                                            value={fields.licenseNumber}
                                            onChange={set('licenseNumber')}
                                            placeholder="e.g. AP005 2025 0012833"
                                            maxLength={17}
                                            className={`w-full pl-12 pr-10 py-4 bg-slate-50/50 dark:bg-slate-800/40 border ${isValid ? 'border-emerald-500 focus:ring-emerald-500' :
                                                    isInvalid ? 'border-red-500 focus:ring-red-500' :
                                                        'border-slate-200 dark:border-slate-700 focus:border-primary'
                                                } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 transition-all font-mono tracking-widest uppercase`}
                                        />
                                        {/* Status icon inside input */}
                                        {fields.licenseNumber && (
                                            <span className={`material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-lg ${isValid ? 'text-emerald-400' : 'text-red-400'
                                                }`}>
                                                {isValid ? 'check_circle' : 'cancel'}
                                            </span>
                                        )}
                                    </div>
                                    {/* Validation message */}
                                    {fields.licenseNumber && (
                                        <p className={`text-xs font-semibold flex items-center gap-1 ${isValid ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                            <span className="material-symbols-outlined text-sm">{isValid ? 'verified' : 'error'}</span>
                                            {isValid ? dlVal.message : (fieldErrors.licenseNumber || dlVal.message)}
                                        </p>
                                    )}
                                    {/* State detection + breakdown */}
                                    {isValid && dlVal.state && (
                                        <p className="text-xs text-primary font-semibold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            State: <span className="font-bold">{dlVal.state}</span>
                                        </p>
                                    )}
                                    {isValid && dlVal.breakdown && (
                                        <div className="flex gap-2 flex-wrap mt-1">
                                            {[
                                                { label: 'State', value: dlVal.breakdown.state, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
                                                { label: 'District', value: dlVal.breakdown.district, color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
                                                { label: 'Year', value: dlVal.breakdown.year, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
                                                { label: 'Unique', value: dlVal.breakdown.unique, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
                                            ].map(b => (
                                                <span key={b.label} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono font-bold ${b.color}`}>
                                                    <span className="opacity-60 font-sans font-normal">{b.label}</span> {b.value}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {/* Empty error */}
                                    {!fields.licenseNumber && fieldErrors.licenseNumber && (
                                        <p className="text-red-500 text-xs font-semibold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">error</span>{fieldErrors.licenseNumber}
                                        </p>
                                    )}
                                </div>
                            );
                        })()}

                    </div>

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 pt-2">
                        License Details
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* License Type */}
                        <InputField
                            id="licenseType" label="License Type" type="select"
                            placeholder="Select type..."
                            value={fields.licenseType} onChange={set('licenseType')}
                            error={fieldErrors.licenseType} icon="category"
                        />
                        {/* Vehicle Type */}
                        <InputField
                            id="vehicleType" label="Vehicle Category" type="select"
                            placeholder="Select Category..."
                            value={fields.vehicleType} onChange={set('vehicleType')}
                            error={fieldErrors.vehicleType} icon="category"
                        />
                    </div>

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 pt-2">
                        Professional Vehicle Details
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Vehicle Number */}
                        <InputField
                            id="vehicleNumber" label="Registration Number"
                            placeholder="e.g. AP05 AB 1234"
                            value={fields.vehicleNumber} onChange={set('vehicleNumber')}
                            error={fieldErrors.vehicleNumber} icon="directions_car"
                        />
                        {/* Vehicle Model */}
                        <InputField
                            id="vehicleModel" label="Vehicle Model (Optional)"
                            placeholder="e.g. Royal Enfield Classic 350"
                            value={fields.vehicleModel} onChange={set('vehicleModel')}
                            error={fieldErrors.vehicleModel} icon="model_training"
                        />
                    </div>

                    {/* License Expiry */}
                    <InputField
                        id="licenseExpiry" label="License Expiry Date" type="date"
                        value={fields.licenseExpiry} onChange={set('licenseExpiry')}
                        error={fieldErrors.licenseExpiry} icon="event"
                    />

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 pt-2">
                        License Images
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ImageUploadBox
                            label="License Front Image"
                            previewUrl={previewFront}
                            onChange={handleImage(setLicenseFile, setPreviewFront)}
                            error={fieldErrors.licenseFile}
                            inputRef={frontRef}
                        />
                        <ImageUploadBox
                            label="License Back Image"
                            previewUrl={previewBack}
                            onChange={handleImage(setLicenseFileBack, setPreviewBack)}
                            error={fieldErrors.licenseFileBack}
                            inputRef={backRef}
                        />
                    </div>
                    {(hasExistingFront || hasExistingBack) && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Previously uploaded images will be kept if you don't select new ones.
                        </p>
                    )}

                    {/* General error */}
                    <AnimatePresence>
                        {submitError && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-4"
                            >
                                <span className="material-symbols-outlined text-lg">error</span>
                                {submitError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || existingStatus === 'verified'}
                        className="w-full py-5 bg-primary text-background-dark font-black rounded-xl shadow-[0_10px_30px_rgba(13,204,242,0.25)] hover:bg-primary/90 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                    >
                        {existingStatus === 'verified' ? (
                            <><span className="material-symbols-outlined">verified</span> Already Verified</>
                        ) : (
                            <><span className="material-symbols-outlined">cloud_upload</span> Submit For Review</>
                        )}
                    </button>
                </form>

                <div className="text-center pb-10">
                    <p className="text-slate-500 text-xs font-medium">
                        By submitting, you agree to our <a href="#!" className="underline hover:text-primary transition-colors">Driver Terms</a>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default LicenseUpload;
