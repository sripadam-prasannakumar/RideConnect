import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthStatus, clearAuthInfo } from '../../utils/authUtils';
import { authorizedFetch } from '../../utils/apiUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import CustomerSidebar from './CustomerSidebar';
import API_BASE_URL from '../../apiConfig';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
    const [stats, setStats] = useState({ total_rides: 0, total_vehicles: 0, rating: 4.98 });
    const [activeBooking, setActiveBooking] = useState(null);
    const [rideHistory, setRideHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { isAuthenticated, email } = getAuthStatus();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Profile
                const profileRes = await authorizedFetch(`${API_BASE_URL}/api/user-profile/?email=${encodeURIComponent(email)}`);
                const profileData = await profileRes.json();
                if (profileData.email) setUserData(profileData);

                // Fetch Stats
                const statsRes = await authorizedFetch(`${API_BASE_URL}/api/user-stats/?email=${encodeURIComponent(email)}`);
                const statsData = await statsRes.json();
                if (statsData && !statsData.error) {
                    setStats(statsData);
                } else if (statsData && statsData.error) {
                    console.error("Stats API error:", statsData.error);
                }

                // Fetch Active Booking
                const activeRes = await authorizedFetch(`${API_BASE_URL}/api/ride/active/?email=${encodeURIComponent(email)}`);
                const activeData = await activeRes.json();
                if (activeData && !activeData.error) setActiveBooking(activeData);

                // Fetch History
                const historyRes = await authorizedFetch(`${API_BASE_URL}/api/ride/history/?email=${encodeURIComponent(email)}&role=customer`);
                const historyData = await historyRes.json();
                if (Array.isArray(historyData)) setRideHistory(historyData.slice(0, 5)); // Get last 5

            } catch (error) {
                console.error("Dashboard fetching error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto custom-scrollbar">
                        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold">Welcome back, {userData.name || 'there'}!</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">{userData.email || 'Customer Account'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => navigate('/test-tracking')} className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02]">
                                    <span className="material-symbols-outlined">map</span>
                                    Test Live Map
                                </button>
                                <button onClick={() => navigate('/customer/book')} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02]">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Book a Driver Now
                                </button>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-xl">
                                    <span className="material-symbols-outlined text-primary">route</span>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Total Rides</p>
                                    <p className="text-2xl font-bold">{stats.total_rides}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-xl">
                                    <span className="material-symbols-outlined text-primary">garage</span>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Saved Vehicles</p>
                                    <p className="text-2xl font-bold">{stats.total_vehicles}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-xl">
                                    <span className="material-symbols-outlined text-primary">stars</span>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Rating</p>
                                    <p className="text-2xl font-bold">{stats.rating}</p>
                                </div>
                            </div>
                        </div>

                        <section>
                            <h2 className="text-xl font-bold mb-4">Active Booking</h2>
                            {activeBooking && Object.keys(activeBooking).length > 0 ? (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                                    <div className="flex flex-col lg:flex-row">
                                        <div className="flex-1 p-6 lg:p-8 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <span className={`px-3 py-1 ${activeBooking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary'} text-xs font-bold rounded-full uppercase tracking-widest`}>
                                                    {activeBooking.status?.replace('_', ' ') || 'Unknown'}
                                                </span>
                                                <span className="text-sm text-slate-500">
                                                    {activeBooking.created_at ? new Date(activeBooking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center gap-1 mt-1">
                                                        <div className="size-3 rounded-full border-2 border-primary bg-background-dark"></div>
                                                        <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700"></div>
                                                        <div className="size-3 rounded-full bg-primary"></div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Pickup</p>
                                                            <p className="font-medium">{activeBooking.pickup_location}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Destination</p>
                                                            <p className="font-medium">{activeBooking.destination}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {activeBooking.driver ? (
                                                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                    <div className="size-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                        <span className="material-symbols-outlined">person</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold">{activeBooking.driver.user.first_name}</p>
                                                        <p className="text-sm text-slate-500">{activeBooking.vehicle?.brand} {activeBooking.vehicle?.model_name} • {activeBooking.vehicle?.registration_number}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="size-10 flex items-center justify-center rounded-full bg-primary text-background-dark hover:brightness-110 transition-all">
                                                            <span className="material-symbols-outlined">call</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                                    <p className="text-sm text-slate-500 italic">Finding a driver for you...</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="lg:w-1/3 min-h-[250px] relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 size-20">map</span>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Map View</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 flex flex-col items-center justify-center text-center gap-4">
                                    <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined text-3xl">no_drinks</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">No Active Bookings</h3>
                                        <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">Ready to head somewhere? Book a professional driver in seconds.</p>
                                    </div>
                                    <button onClick={() => navigate('/customer/book')} className="mt-2 px-6 py-2 bg-primary text-background-dark font-bold rounded-lg hover:brightness-110 transition-all">
                                        Book Now
                                    </button>
                                </div>
                            )}
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Ride History</h2>
                                <button className="text-primary text-sm font-semibold hover:underline">View All</button>
                            </div>
                            <div className="space-y-3">
                                {rideHistory.length > 0 ? (
                                    rideHistory.map(ride => (
                                        <div key={ride.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
                                            <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500">history</span>
                                            </div>
                                            <div className="flex-1 min-w-[200px]">
                                                <p className="font-semibold">{ride.pickup_location.split(',')[0]} to {ride.destination.split(',')[0]}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(ride.created_at).toLocaleDateString()} • {ride.vehicle ? `${ride.vehicle.brand} ${ride.vehicle.model_name}` : 'No Vehicle'} • {ride.driver ? ride.driver.user.first_name : 'No Driver'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <span className="material-symbols-outlined text-sm">star</span>
                                                <span className="text-sm font-bold">{ride.status === 'completed' ? '5.0' : '—'}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">₹{ride.estimated_fare}</p>
                                                <p className={`text-[10px] ${ride.status === 'completed' ? 'text-green-500' : ride.status === 'cancelled' ? 'text-red-500' : 'text-primary'} uppercase font-bold`}>
                                                    {ride.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-500 italic">No ride history available.</div>
                                )}
                            </div>
                        </section>
            </div>
        </main>
    );
};

export default CustomerDashboard;
