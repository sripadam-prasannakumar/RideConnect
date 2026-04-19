import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getAuthStatus } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';
import { getDefaultAvatar } from '../../utils/avatarUtils';
import { MessageSquare, ChevronRight } from 'lucide-react';
import SupportChat from '../Common/SupportChat';

const CustomerProfile = () => {
    const navigate = useNavigate();
    const { isAuthenticated, email } = getAuthStatus();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: '',
        email: email,
        phone: '',
        role: 'customer',
        profile_image: null,
    });

    const [editedProfile, setEditedProfile] = useState({ ...profile });
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [error, setError] = useState('');

    const [userVehicles, setUserVehicles] = useState([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login?role=customer');
            return;
        }

        // Fetch Profile
        authorizedFetch(`${API_BASE_URL}/api/user-profile/?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.full_name !== undefined) {
                    const fetched = {
                        name: data.full_name || '',
                        email: data.email || email,
                        phone: data.phone || '',
                        role: data.role || 'customer',
                        profile_image: data.profile_image || null,
                    };
                    setProfile(fetched);
                    setEditedProfile(fetched);
                }
            })
            .catch(() => setError('Failed to load profile. Please try again.'))
            .finally(() => setLoading(false));

        // Fetch Vehicles
        authorizedFetch(`${API_BASE_URL}/api/user-vehicles/?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUserVehicles(data);
                }
            })
            .catch(err => console.error('Error fetching vehicles:', err))
            .finally(() => setVehiclesLoading(false));
    }, [email, navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
        
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/user-vehicles/${vehicleId}/`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setUserVehicles(prev => prev.filter(v => v.id !== vehicleId));
                setSavedMsg('Vehicle deleted successfully');
                setTimeout(() => setSavedMsg(''), 3000);
            } else {
                setError('Failed to delete vehicle.');
            }
        } catch (error) {
            setError('Network error while deleting vehicle.');
        }
    };

    const handleDeleteImage = async (imageId, vehicleId) => {
        if (!window.confirm('Delete this image?')) return;
        
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/user-vehicles/images/${imageId}/`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setUserVehicles(prev => prev.map(v => {
                    if (v.id === vehicleId) {
                        return { ...v, images: v.images.filter(img => img.id !== imageId) };
                    }
                    return v;
                }));
            }
        } catch (error) {
            setError('Failed to delete image.');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSavedMsg('');

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('full_name', editedProfile.name);
            formData.append('phone', editedProfile.phone);
            if (selectedFile) {
                formData.append('profile_picture', selectedFile);
            }

            const res = await authorizedFetch(`${API_BASE_URL}/api/update-profile/`, {
                method: 'PATCH',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                const updated = {
                    ...editedProfile,
                    profile_image: data.profile_image || profile.profile_image
                };
                setProfile(updated);
                setEditedProfile(updated);
                setSelectedFile(null);
                setPreviewImage(null);
                setSavedMsg('✓ Profile updated successfully!');
                setTimeout(() => setSavedMsg(''), 3000);
            } else {
                setError(data.error || 'Update failed. Please try again.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setSaving(false);
        }
    };

    const avatarUrl = previewImage || profile.profile_image || getDefaultAvatar('customer', profile.email);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
                <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-sm font-medium">
                    <div className="flex items-center gap-4">
                        <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-200 dark:border-slate-800" />
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">Pages /</span>
                            <span>Profile</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-none">{loading ? '...' : (profile.name || 'Customer')}</p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Member</p>
                            </div>
                            <div className="size-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center overflow-hidden">
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-4 text-primary">
                            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
                            <p className="text-sm font-bold uppercase tracking-widest">Loading Profile...</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
                        {/* Profile Header Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center md:items-end gap-8 shadow-xl"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <div className="size-32 rounded-3xl border-4 border-white dark:border-slate-800 shadow-2xl bg-primary/10 flex items-center justify-center overflow-hidden relative">
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <h1 className="text-4xl font-black tracking-tight">{profile.name || 'Your Name'}</h1>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 self-center">
                                        RideConnect Member
                                    </span>
                                </div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{profile.email}</p>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSave}
                                disabled={saving || (profile.name === editedProfile.name && profile.phone === editedProfile.phone && !selectedFile)}
                                className="px-8 py-4 bg-primary text-background-dark font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? (
                                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Saving...</>
                                ) : (profile.name === editedProfile.name && profile.phone === editedProfile.phone && !selectedFile) ? (
                                    <><span className="material-symbols-outlined text-sm">check_circle</span> No Changes</>
                                ) : (
                                    <><span className="material-symbols-outlined text-sm">save</span> Save Profile</>
                                )}
                            </motion.button>
                        </motion.div>

                        {/* Success / Error Messages */}
                        <AnimatePresence>
                            {savedMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-sm"
                                >
                                    <span className="material-symbols-outlined">check_circle</span>
                                    {savedMsg}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm"
                                >
                                    <span className="material-symbols-outlined">error</span>
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Personal Details */}
                            <div className="lg:col-span-2 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm"
                                >
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <span className="material-symbols-outlined text-primary">person</span>
                                        <h3 className="text-lg font-black uppercase tracking-widest">Personal Details</h3>
                                        <span className="ml-auto text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                                            Auto-filled from Registration
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary h-14 focus:outline-none transition-all"
                                                value={editedProfile.name}
                                                onChange={e => setEditedProfile(p => ({ ...p, name: e.target.value }))}
                                                placeholder="Your full name"
                                            />
                                        </div>
                                        {/* Phone */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <div className="phone-input-container-custom">
                                                <PhoneInput
                                                    country={'in'}
                                                    value={editedProfile.phone}
                                                    onChange={phone => setEditedProfile(p => ({ ...p, phone: '+' + phone }))}
                                                    inputProps={{
                                                        name: 'phone',
                                                        required: true
                                                    }}
                                                    containerClass="!w-full"
                                                    inputClass="!w-full !bg-slate-50 dark:!bg-slate-800 !border !border-slate-200 dark:!border-slate-700 !rounded-xl !px-5 !py-4 focus:!ring-2 focus:!ring-primary !h-14 focus:!outline-none !transition-all !pl-14"
                                                    buttonClass="!bg-transparent !border-none !rounded-xl !pl-2"
                                                    dropdownClass="dark:!bg-slate-800 dark:!text-slate-100"
                                                />
                                            </div>
                                        </div>
                                        {/* Email (read-only) */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                Email Address
                                                <span className="text-[8px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-black uppercase tracking-widest">Read-only</span>
                                            </label>
                                            <input
                                                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 h-14 text-slate-500 cursor-not-allowed"
                                                value={editedProfile.email}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* My Vehicles */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm"
                                >
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">directions_car</span>
                                            <h3 className="text-lg font-black uppercase tracking-widest">My Vehicles</h3>
                                        </div>
                                        <button onClick={() => navigate('/customer/vehicles')} className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                                            <span className="material-symbols-outlined text-sm">add_circle</span> Add
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {vehiclesLoading ? (
                                            <div className="col-span-full py-10 flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Vehicles...</p>
                                            </div>
                                        ) : userVehicles.length === 0 ? (
                                            <div className="col-span-full py-10 flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                <span className="material-symbols-outlined text-4xl text-slate-300">directions_car</span>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold">No vehicles added yet</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Add your first car to get started</p>
                                                </div>
                                                <button onClick={() => navigate('/customer/vehicles')} className="px-6 py-2 bg-primary text-background-dark text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20">Add Vehicle</button>
                                            </div>
                                        ) : (
                                            userVehicles.map(v => (
                                                <div key={v.id} className="relative flex flex-col gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 group hover:border-primary/30 border border-transparent transition-all shadow-sm">
                                                    {/* Floating Icons Inside Card */}
                                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <button 
                                                            onClick={() => navigate(`/customer/add-vehicle?brand=${v.brand}&model=${v.model_name}&edit=${v.id}`)}
                                                            className="p-1.5 text-slate-400 hover:text-primary transition-colors bg-white dark:bg-slate-700 rounded-lg shadow-md border border-slate-100 dark:border-slate-600"
                                                            title="Edit Vehicle"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteVehicle(v.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-700 rounded-lg shadow-md border border-slate-100 dark:border-slate-600"
                                                            title="Delete Vehicle"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-5">
                                                        <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg overflow-hidden shrink-0">
                                                            {v.images && v.images.length > 0 ? (
                                                                <img src={`${API_BASE_URL}${v.images[0].image}`} alt={v.model_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-3xl">directions_car</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-sm tracking-tight">{v.brand} {v.model_name}</h4>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Plate: {v.registration_number}</p>
                                                            <div className="flex gap-2 mt-2">
                                                                <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600 shadow-sm">{v.fuel_type}</span>
                                                                <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600 shadow-sm">{v.transmission}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Image Gallery with Delete */}
                                                    {v.images && v.images.length > 0 && (
                                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                            {v.images.map(img => (
                                                                <div key={img.id} className="relative group/img size-14 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                                                    <img src={`${API_BASE_URL}${img.image}`} className="w-full h-full object-cover" alt="car" />
                                                                    <button 
                                                                        onClick={() => handleDeleteImage(img.id, v.id)}
                                                                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Settings Sidebar */}
                            <div className="space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm"
                                >
                                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-500 pb-4 border-b border-slate-100 dark:border-slate-800">Settings</h3>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Push Notifications', sub: 'Activity alerts' },
                                            { label: 'Biometric Login', sub: 'FaceID / Fingerprint' },
                                            { label: 'Privacy Mode', sub: 'Hide ride history' }
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold">{s.label}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold">{s.sub}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked={i !== 1} />
                                                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="bg-primary/5 rounded-3xl border border-primary/20 p-8 space-y-4"
                                >
                                    <h4 className="font-black text-primary flex items-center gap-2 text-sm uppercase tracking-widest">
                                        <span className="material-symbols-outlined">verified</span> Account Info
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="material-symbols-outlined text-sm text-primary">mail</span>
                                            <span className="break-all">{profile.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="material-symbols-outlined text-sm text-primary">phone</span>
                                            <span>{profile.phone || 'Not set'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="material-symbols-outlined text-sm text-primary">badge</span>
                                            <span className="capitalize">{profile.role}</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-all">
                                        Change Password
                                    </button>
                                </motion.div>
                            </div>
                        </div>

                        {/* Need more help? Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-xl font-black tracking-tight">Need more help?</h2>
                            <div 
                                onClick={() => setIsSupportOpen(true)}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between group cursor-pointer hover:border-primary/40 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-all">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">24x7 support</h4>
                                        <p className="text-[11px] text-slate-500 font-bold tracking-tight">Talk to us in your language</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                    <span className="text-primary text-xs font-black uppercase tracking-widest">Chat Now</span>
                                    <ChevronRight size={18} className="text-primary" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            <SupportChat isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        </div>
    );
};

export default CustomerProfile;
