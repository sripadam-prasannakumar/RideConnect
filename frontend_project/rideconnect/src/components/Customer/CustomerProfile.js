import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import { getAuthStatus } from '../../utils/authUtils';

import { useUser } from '../../UserContext';

const CustomerProfile = () => {
    const navigate = useNavigate();
    const { userProfile, refreshUserProfile } = useUser();
    const [localData, setLocalData] = useState({
        full_name: '',
        email: '',
        phone: '',
        membership: 'Gold Member'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setLocalData({
                full_name: userProfile.full_name || '',
                email: userProfile.email || '',
                phone: userProfile.phone || '',
                membership: 'Gold Member'
            });
            setLoading(false);
        }
    }, [userProfile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await authorizedFetch(`${API_BASE_URL}/api/update-profile/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: localData.full_name,
                    phone: localData.phone
                })
            });

            if (response.ok) {
                await refreshUserProfile();
                alert('Profile updated successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/profile-picture/upload/`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                await refreshUserProfile();
                alert('Profile picture updated!');
            }
        } catch (err) {
            console.error("Image upload failed", err);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display min-h-screen">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e3a41;
                    border-radius: 10px;
                }
                `}
            </style>
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-64 border-r border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark flex-col hidden md:flex">
                    <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/customer/dashboard')}>
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark">
                            <span className="material-symbols-outlined font-bold">directions_car</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-primary">RideConnect</h1>
                    </div>
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        <div onClick={() => navigate('/customer/dashboard')} className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">dashboard</span>
                            <span className="text-sm font-medium">Dashboard</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">calendar_today</span>
                            <span className="text-sm font-medium">Bookings</span>
                        </div>
                        <div onClick={() => navigate('/customer/history')} className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">history</span>
                            <span className="text-sm font-medium">History</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer">
                            <span className="material-symbols-outlined leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            <span className="text-sm font-semibold">Profile</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">support_agent</span>
                            <span className="text-sm font-medium">Support</span>
                        </div>
                    </nav>
                    <div className="p-4 mt-auto border-t border-slate-200 dark:border-primary/10">
                        <button onClick={() => navigate('/login')} className="flex w-full items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">logout</span>
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Section */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-background-dark/50">
                    {/* Top Navigation Bar */}
                    <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-primary/10">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Pages /</span>
                            <span className="text-sm font-semibold">Customer Profile</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-slate-500 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <button className="p-2 text-slate-500 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">settings</span>
                            </button>
                            <div className="h-8 w-px bg-slate-200 dark:border-primary/20 mx-2"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold leading-none">{userProfile?.full_name}</p>
                                    <p className="text-xs text-primary font-medium">{localData.membership}</p>
                                </div>
                                <div className="size-10 rounded-full border-2 border-primary overflow-hidden">
                                     {userProfile?.profile_image ? (
                                         <img src={userProfile.profile_image} alt="Profile" className="size-full object-cover" />
                                     ) : (
                                         <div className="size-full flex items-center justify-center bg-slate-800 text-primary">
                                             <span className="material-symbols-outlined">person</span>
                                         </div>
                                     )}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
                        {/* Profile Header Card */}
                        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/10 p-8 flex flex-col md:flex-row items-center md:items-end gap-6 shadow-sm">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative">
                                <div className="size-32 rounded-2xl bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
                                     {userProfile?.profile_image ? (
                                         <img src={userProfile.profile_image} alt="Profile" className="size-full object-cover" />
                                     ) : (
                                         <div className="size-full flex items-center justify-center text-slate-400">
                                              <span className="material-symbols-outlined text-5xl">person</span>
                                         </div>
                                     )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 bg-primary text-background-dark p-2 rounded-lg shadow-lg hover:scale-105 transition-transform cursor-pointer">
                                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-1">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                    <h2 className="text-3xl font-bold">{userProfile?.full_name || 'Customer'}</h2>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30 w-fit self-center">
                                        {localData.membership}
                                    </span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400">Verified User • {userProfile?.email}</p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-primary text-background-dark font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Personal Details Column */}
                            <div className="lg:col-span-2 space-y-8">
                                <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-primary/10 p-6 space-y-6">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-primary/5">
                                        <span className="material-symbols-outlined text-primary">person_outline</span>
                                        <h3 className="text-lg font-bold">Personal Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                                            <input 
                                                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none" 
                                                type="text" 
                                                value={localData.full_name} 
                                                onChange={(e) => setLocalData({...localData, full_name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                                            <input 
                                                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none" 
                                                type="tel" 
                                                value={localData.phone} 
                                                onChange={(e) => setLocalData({...localData, phone: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                                            <input className="w-full bg-slate-50/50 dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 h-12 outline-none cursor-not-allowed opacity-70" type="email" value={localData.email} readOnly />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Occupation</label>
                                            <input className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none" type="text" defaultValue="Product Designer" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Residential Address</label>
                                            <textarea className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none" rows="2" defaultValue="24th Avenue, Manhattan, New York City, NY 10001"></textarea>
                                        </div>
                                    </div>
                                </section>

                                {/* My Vehicles Section */}
                                <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-primary/10 p-6 space-y-6">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-primary/5">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">directions_car</span>
                                            <h3 className="text-lg font-bold">My Vehicles</h3>
                                        </div>
                                        <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                                            <span className="material-symbols-outlined text-sm">add_circle</span> Add New
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Vehicle 1 */}
                                        <div className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-primary/10 bg-slate-50 dark:bg-background-dark/50 hover:border-primary/50 transition-all">
                                            <div className="size-16 rounded-lg bg-slate-200 dark:bg-primary/10 flex items-center justify-center overflow-hidden">
                                                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgYTqlglXBtCbsbv6Y4RVkV9fYvkBONNkuhfNrvnlOWBu5SbGQJ8_TcBfbn7g7EBVTGS-3s7VQDe-jvqMA189-ll93y4IF9y-_VFbFMiz9kyl2p-LmR1t9EtvJ54V1zO4-QFuyW_ycCqnNCHeInSaIX41aiNeV5RRCefDv73NeTLshFnbCkHVwBnXVUengnWzipQ7nWo-GfsNFUHist1BBXcvKCQYL6Y2r4YH9EV2A9ItsLVhDN-56X9uOfVKCt9gKqzQTK7jZPGA" alt="Honda City" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold">Honda City</h4>
                                                <p className="text-xs text-slate-500">Plate: NY-5521</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        {/* Vehicle 2 */}
                                        <div className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-primary/10 bg-slate-50 dark:bg-background-dark/50 hover:border-primary/50 transition-all">
                                            <div className="size-16 rounded-lg bg-slate-200 dark:bg-primary/10 flex items-center justify-center overflow-hidden">
                                                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfwNeSLzQqJgswp7EoISnGiv2CEzgcVj_0vfBHLUuu9jQmE0weIX27xWCIH8gP-XLVzVKJRc-YSaiiWvwLv0BTn6K2oScWbunkVyHDcjYFCI2cSjIFOzq79TQhMTzNedFs8_BsSH_kLKuPsTjKBHtIcv-ihq35j7N2ExlhF8xlB-NLpgB0fWH_FGb1nO8uTmPpehKvI4ZLoLmPmjafx_Pr3sZZ6WE5o-9lML_wq6X7SEUvoW0bWyA2Q_EYyVn4mEX1VDy1O8SjmeQ" alt="Tesla Model 3" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold">Tesla Model 3</h4>
                                                <p className="text-xs text-slate-500">Plate: EL-420X</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Settings */}
                            <div className="space-y-8">
                                <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-primary/10 p-6 space-y-6">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-primary/5">
                                        <span className="material-symbols-outlined text-primary">settings</span>
                                        <h3 className="text-lg font-bold">Account Settings</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">Push Notifications</p>
                                                <p className="text-xs text-slate-500">Activity and booking alerts</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">Biometric Login</p>
                                                <p className="text-xs text-slate-500">FaceID or Fingerprint</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">Marketing Emails</p>
                                                <p className="text-xs text-slate-500">Weekly offers and news</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">Privacy Mode</p>
                                                <p className="text-xs text-slate-500">Hide history from partners</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                </section>
                                <section className="bg-primary/5 rounded-xl border border-primary/20 p-6 space-y-4">
                                    <h4 className="font-bold text-primary flex items-center gap-2">
                                        <span className="material-symbols-outlined">verified</span>
                                        Account Security
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Your data is protected using end-to-end encryption. RideConnect will never share your location data without explicit consent.
                                    </p>
                                    <button className="w-full py-2 bg-transparent border border-primary text-primary text-sm font-bold rounded-lg hover:bg-primary/10 transition-colors">
                                        Change Password
                                    </button>
                                </section>
                            </div>
                        </div>

                        {/* Bottom Footer Buttons (Mobile View Only / Extra) */}
                        <div className="flex md:hidden flex-col gap-4 mt-8 pb-10">
                            <button className="w-full py-4 bg-primary text-background-dark font-bold rounded-lg shadow-lg">
                                Save All Changes
                            </button>
                            <button onClick={() => navigate('/login')} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-red-500 font-bold rounded-lg cursor-pointer">
                                Logout
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerProfile;
