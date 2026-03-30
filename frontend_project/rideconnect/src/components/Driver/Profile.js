import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, User, Trash2 } from 'lucide-react';
import GlobalBackButton from '../Shared/GlobalBackButton';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';

const DriverProfile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ name: '', email: '', phone: '', profile_picture: null });
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [licenseDetails, setLicenseDetails] = useState({ number: '', expiry: '', type: '' });
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const webcamRef = React.useRef(null);

    const videoConstraints = {
        facingMode: "user"
    };

    useEffect(() => {
        const email = sessionStorage.getItem('user_email');
        if (!email) { navigate('/login'); return; }

        // Fetch User Profile
        authorizedFetch(`${API_BASE_URL}/api/user-profile/?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.email) setUserData(data);
            })
            .catch(console.error);

        // Fetch Verification Status & License Details
        authorizedFetch(`${API_BASE_URL}/api/driver/verification-status/?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.verification_status) setVerificationStatus(data.verification_status);
                setLicenseDetails({
                    number: data.license_number || '',
                    expiry: data.license_expiry || 'Not set',
                    type: data.license_type || 'Not set'
                });
            })
            .catch(console.error);
    }, [navigate]);

    const statusConfig = {
        unverified: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: 'pending', label: 'Not Verified' },
        pending:  { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', icon: 'schedule', label: 'Under Review' },
        approved: { color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30',   icon: 'verified',  label: 'Approved ✓'   },
        rejected: { color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20',       icon: 'cancel',    label: 'Rejected'     },
    };

    const displayExpiry = licenseDetails.expiry && licenseDetails.expiry !== 'Not set' ? licenseDetails.expiry : 'NOT SET';
    const displayType = licenseDetails.type && licenseDetails.type !== 'Not set' ? licenseDetails.type : 'NOT SET';

    const capture = React.useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
    }, [webcamRef]);

    const handleUploadSelfie = async () => {
        if (!capturedImage) return;
        setUploading(true);
        try {
            const blob = await fetch(capturedImage).then(res => res.blob());
            const formData = new FormData();
            formData.append('email', userData.email);
            formData.append('profile_picture', blob, 'selfie.jpg');

            const response = await authorizedFetch(`${API_BASE_URL}/api/profile-picture/upload/`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setUserData({ ...userData, profile_picture: data.profile_picture });
                setIsCameraOpen(false);
                setCapturedImage(null);
                alert('Profile picture updated successfully');
            } else {
                alert('Failed to upload profile picture');
            }
        } catch (error) {
            console.error('Error uploading selfie:', error);
            alert('An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteProfilePicture = async () => {
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
        
        try {
            const response = await authorizedFetch(`${API_BASE_URL}/api/profile-picture/delete/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: userData.email })
            });

            if (response.ok) {
                setUserData({ ...userData, profile_picture: null });
                alert('Profile picture removed successfully');
            } else {
                alert('Failed to remove profile picture');
            }
        } catch (error) {
            console.error('Error deleting profile picture:', error);
            alert('An error occurred');
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-10">
                    <div className="flex items-center gap-4 mb-2">
                        <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-200 dark:border-slate-800" />
                        <h2 className="text-2xl font-black uppercase tracking-widest">Profile</h2>
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                        <p className="font-bold text-primary flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">info</span>
                            Please review your personal details and complete your driver profile to start receiving ride requests.
                        </p>
                    </div>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative">
                            <div className="relative">
                                <div className="size-32 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-slate-900 overflow-hidden shadow-2xl">
                                    {userData.profile_picture ? (
                                        <img
                                            src={`${API_BASE_URL}${userData.profile_picture}`}
                                            className="w-full h-full object-cover"
                                            alt="Profile"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                            <User className="size-16 text-slate-500" />
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setIsCameraOpen(true)}
                                    className="absolute bottom-0 right-0 bg-primary text-background-dark p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all group/cam"
                                >
                                    <Camera className="size-5 font-black" />
                                </button>
                                {userData.profile_picture && (
                                    <button 
                                        onClick={handleDeleteProfilePicture}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-2.5 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all group/del"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-4xl font-black tracking-tight">{userData.name || 'Driver'}</h2>
                                <div className="flex items-center gap-3 justify-center md:justify-start">
                                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-yellow-500/20">Pro Driver</span>
                                    {verificationStatus === 'verified' && (
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">verified</span> Verified
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1.5 text-yellow-400">
                                        <span className="material-symbols-outlined text-sm font-black">star</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">4.98</span>
                                    </div>
                                </div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Partner: {userData.email}</p>
                            </div>
                        </div>
                        <button className="px-10 py-4 bg-primary text-background-dark font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all relative">Save Changes</button>
                    </motion.section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <section className="space-y-8">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <span className="material-symbols-outlined text-primary">badge</span>
                                <h3 className="text-lg font-black uppercase tracking-widest">Personal Info</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                                    <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary h-14 outline-none" defaultValue={userData.name} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</label>
                                    <div className="phone-input-container-custom">
                                        <PhoneInput
                                            country={'in'}
                                            value={userData.phone}
                                            onChange={phone => setUserData(prev => ({ ...prev, phone: '+' + phone }))}
                                            inputProps={{
                                                name: 'phone',
                                                required: true
                                            }}
                                            containerClass="!w-full"
                                            inputClass="!w-full !bg-white dark:!bg-slate-900 !border !border-slate-200 dark:!border-slate-800 !rounded-2xl !px-6 !py-4 focus:!ring-2 focus:!ring-primary !h-14 !outline-none !pl-16"
                                            buttonClass="!bg-transparent !border-none !rounded-2xl !pl-2"
                                            dropdownClass="dark:!bg-slate-800 dark:!text-slate-100"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                                    <input className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 h-14 outline-none cursor-not-allowed opacity-70" value={userData.email} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                                    <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary h-24 outline-none resize-none" defaultValue="123 Sunset Blvd, CA 90028" />
                                </div>
                            </div>
                        </section>

                        <div className="space-y-10">
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                    <h3 className="text-lg font-black uppercase tracking-widest">Documents</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group hover:border-emerald-500/50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined">id_card</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Driver License</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase text-[9px]">EXP: {displayExpiry}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black flex items-center gap-1 uppercase tracking-widest ${verificationStatus && statusConfig[verificationStatus] ? statusConfig[verificationStatus].color : 'text-slate-500'}`}>
                                            <span className="material-symbols-outlined text-sm font-black">
                                                {verificationStatus && statusConfig[verificationStatus] ? statusConfig[verificationStatus].icon : 'pending'}
                                            </span> 
                                            {verificationStatus && statusConfig[verificationStatus] ? statusConfig[verificationStatus].label : 'Not Submitted'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <span className="material-symbols-outlined">category</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">License Type</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">{displayType}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="material-symbols-outlined text-primary">shield</span>
                                    <h3 className="text-lg font-black uppercase tracking-widest">Security</h3>
                                </div>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold">Push Notifications</p>
                                            <p className="text-[10px] text-slate-500 font-bold">New booking alerts</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </label>
                                    </div>
                                    <button className="w-full py-3 text-primary text-[10px] font-black uppercase tracking-widest border-2 border-primary/20 rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                                        Update Passcode <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

            <AnimatePresence>
                {isCameraOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCameraOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-widest text-primary">Live Selfie</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Identity Verification Flow</p>
                                    </div>
                                    <button 
                                        onClick={() => { setIsCameraOpen(false); setCapturedImage(null); }}
                                        className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                                    {!capturedImage ? (
                                        <>
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                videoConstraints={videoConstraints}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 border-[16px] border-slate-900/50 rounded-3xl pointer-events-none"></div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-primary/30 border-dashed rounded-[100px] pointer-events-none"></div>
                                        </>
                                    ) : (
                                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    {!capturedImage ? (
                                        <button 
                                            onClick={capture}
                                            className="w-full py-5 bg-primary text-background-dark font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                                        >
                                            <Camera className="size-6" />
                                            Capture Photo
                                        </button>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => setCapturedImage(null)}
                                                className="py-5 bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-slate-700"
                                            >
                                                <RefreshCw className="size-5" />
                                                Retake
                                            </button>
                                            <button 
                                                onClick={handleUploadSelfie}
                                                disabled={uploading}
                                                className="py-5 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {uploading ? (
                                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <Check className="size-5" />
                                                )}
                                                Submit
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">Ensure your face is clearly visible inside the frame</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverProfile;
