import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthStatus } from '../../utils/authUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';

const RideHistory = () => {
    const navigate = useNavigate();
    const [rides, setRides] = useState([]);
    const [stats, setStats] = useState({ totalRides: 0, totalSpent: 0, topDriver: 'N/A' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { email, role } = getAuthStatus();

    useEffect(() => {
        if (!email) {
            navigate('/login');
            return;
        }
        fetchRideHistory();
    }, [email, role, navigate]);

    const fetchRideHistory = async () => {
        setIsLoading(true);
        try {
            const response = await authorizedFetch(`${API_BASE_URL}/api/ride/history/?email=${email}&role=${role}`);
            if (response.ok) {
                const data = await response.json();
                setRides(data);
                calculateStats(data);
            } else {
                setError('Failed to fetch ride history.');
            }
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (rideList) => {
        const totalRides = rideList.length;
        const completedRides = rideList.filter(r => r.status === 'completed');
        const totalSpent = completedRides.reduce((sum, r) => sum + parseFloat(r.estimated_fare), 0);
        
        // Simple top driver calculation
        const drivers = {};
        completedRides.forEach(r => {
            if (r.driver && r.driver.user) {
                const name = r.driver.user.first_name || r.driver.user.email;
                drivers[name] = (drivers[name] || 0) + 1;
            }
        });
        
        let topDriver = 'N/A';
        let maxTrips = 0;
        Object.entries(drivers).forEach(([name, count]) => {
            if (count > maxTrips) {
                maxTrips = count;
                topDriver = name;
            }
        });

        setStats({ 
            totalRides, 
            totalSpent: totalSpent.toFixed(2), 
            topDriver,
            maxTrips 
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-8 py-4">
                <div className="flex items-center gap-6">
                    <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-200 dark:border-slate-800" />
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-background-dark font-bold">history</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Ride History</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{role}</span>
                    <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8">
                {/* Stats Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Your Journeys</h1>
                        <p className="text-slate-500 dark:text-primary/70">Manage and review your past journeys</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total Rides</p>
                            <p className="text-slate-900 dark:text-white text-2xl font-bold">{stats.totalRides}</p>
                        </div>
                        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total Spent</p>
                            <p className="text-slate-900 dark:text-white text-2xl font-bold">₹{stats.totalSpent}</p>
                        </div>
                        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Top Driver</p>
                            <p className="text-slate-900 dark:text-white text-2xl font-bold truncate max-w-[150px]">{stats.topDriver}</p>
                            {stats.maxTrips > 0 && <span className="text-primary text-xs font-bold">{stats.maxTrips} Trips Together</span>}
                        </div>
                    </div>
                </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* Rides List */}
                    <div className="grid grid-cols-1 gap-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                <p className="text-slate-500 font-medium">Loading your journeys...</p>
                            </div>
                        ) : rides.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-6 bg-white dark:bg-primary/5 rounded-2xl border border-dashed border-slate-200 dark:border-primary/20">
                                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-primary/10 flex items-center justify-center text-slate-400 dark:text-primary/40">
                                    <span className="material-symbols-outlined text-4xl">history</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold dark:text-white">No rides yet</h3>
                                    <p className="text-slate-500 mt-2">Your completed trips will appear here.</p>
                                </div>
                                <button onClick={() => navigate(`/${role}/dashboard`)} className="px-6 py-2 bg-primary text-background-dark font-bold rounded-lg hover:opacity-90 transition-all">
                                    Book Your First Ride
                                </button>
                            </div>
                        ) : (
                            rides.map((ride) => (
                                <div key={ride.id} className="group flex flex-col md:flex-row items-center gap-6 p-5 rounded-xl bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 hover:border-primary/40 transition-all shadow-sm">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                                            <span className="material-symbols-outlined text-3xl">
                                                {role === 'driver' ? 'person' : 'person_pin'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white">
                                                {role === 'driver' 
                                                    ? (ride.customer?.user?.first_name || ride.customer?.user?.email)
                                                    : (ride.driver?.user?.first_name || ride.driver?.user?.email || 'Searching...')}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-primary/60 truncate max-w-[200px]">
                                                {ride.pickup_location} → {ride.destination}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-grow w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 dark:border-primary/10 pt-4 md:pt-0 md:pl-8">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Date & Time</p>
                                            <p className="text-sm font-medium">{formatDate(ride.created_at)}</p>
                                            <p className="text-xs text-slate-500">{formatTime(ride.created_at)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Duration</p>
                                            <p className="text-sm font-medium">{ride.duration_text || '--'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Total Cost</p>
                                            <p className="text-sm font-bold text-primary">₹{parseFloat(ride.estimated_fare).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Status</p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${
                                                ride.status === 'completed' 
                                                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                : ride.status === 'cancelled'
                                                ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                                : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                            }`}>
                                                {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <button 
                                            onClick={() => navigate(`/${role}/dashboard`)}
                                            className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-primary text-background-dark font-bold text-sm transition-transform active:scale-95"
                                        >
                                            {role === 'driver' ? 'View Map' : 'Rebook'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
            </main>

            {/* Simple Footer */}
            <footer className="mt-auto border-t border-slate-200 dark:border-primary/10 px-10 py-8 bg-white dark:bg-background-dark/50">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 opacity-50">
                        <span className="material-symbols-outlined text-primary">verified_user</span>
                        <span className="text-sm font-medium">RideConnect Secure Ride History</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">© {new Date().getFullYear()} RideConnect Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default RideHistory;
