import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthStatus } from '../../utils/authUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import { Star, Phone, MessageSquare, Map as MapIcon, ShieldCheck } from 'lucide-react';

const DriverAssigned = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const driverData = state?.driverData;
    const rideId = state?.rideId;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen">
            <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-primary/20 px-6 md:px-10 py-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
                        <div className="flex items-center gap-6">
                            <GlobalBackButton variant="ghost" className="hover:text-primary" />
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/customer/dashboard')}>
                                <div className="size-8 text-primary">
                                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                        <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"></path>
                                        <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"></path>
                                    </svg>
                                </div>
                                <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight uppercase italic tracking-tighter">RideConnect</h2>
                            </div>
                        </div>
                    </header>

                    <main className="flex flex-1 justify-center py-8 px-4 md:px-0 bg-slate-50 dark:bg-slate-950">
                        <div className="layout-content-container flex flex-col max-w-[480px] w-full gap-8">
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                                    Success • Driver Confirmed
                                </div>
                                <h1 className="text-4xl font-black dark:text-white uppercase italic tracking-tight">Your pro is here</h1>
                            </div>

                            <div className="flex flex-col items-center gap-8 p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
                                
                                <div className="relative">
                                    <div className="size-40 rounded-full border-4 border-primary bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(13,204,242,0.3)]">
                                        {driverData?.user?.profile_image ? (
                                            <img className="w-full h-full object-cover" src={driverData.user.profile_image} alt="Driver" />
                                        ) : (
                                            <div className="text-primary font-black text-5xl uppercase italic tracking-tighter">
                                                {driverData?.user?.first_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-1 right-3 bg-primary text-background-dark rounded-full p-2 border-4 border-white dark:border-slate-900 shadow-lg">
                                        <ShieldCheck className="size-6" />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-slate-900 dark:text-white text-3xl font-black italic tracking-tight">
                                        {driverData?.user?.first_name || 'Pro Driver'}
                                    </p>
                                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center text-yellow-500 gap-1">
                                            <Star className="size-4 fill-yellow-500" />
                                            <span className="text-slate-900 dark:text-slate-100 font-black text-sm">4.9</span>
                                        </div>
                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">Master Specialist</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 w-full">
                                    <div className="flex flex-col items-center text-center">
                                        <span className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-1">Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-green-500"></div>
                                            <p className="text-lg font-black dark:text-primary italic">Coming</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center text-center border-l border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-1">Eta</span>
                                        <p className="text-lg font-black dark:text-primary italic">4 Mins</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 p-6 rounded-3xl bg-primary/10 border border-primary/20 shadow-sm relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
                                <div className="relative flex items-center justify-center size-14 rounded-2xl bg-white dark:bg-slate-950 text-primary shadow-lg group-hover:scale-110 transition-transform">
                                    <MapIcon className="size-7" />
                                </div>
                                <div className="relative flex flex-col">
                                    <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Premium Fleet</p>
                                    <p className="text-slate-900 dark:text-white font-black text-xl italic tracking-tight">Honda Civic • White</p>
                                    <p className="text-primary font-bold text-xs">Licence: B-2940-DA</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button className="flex w-full items-center justify-center gap-3 rounded-2xl h-16 bg-primary text-background-dark font-black text-xl hover:brightness-110 transition-all shadow-[0_15px_30px_rgba(13,204,242,0.3)] active:scale-[0.98] uppercase italic tracking-tight">
                                    <MapIcon className="size-6" />
                                    Live Tracking
                                </button>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="flex items-center justify-center gap-3 rounded-2xl h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <Phone className="size-5" />
                                        Call
                                    </button>
                                    <button className="flex items-center justify-center gap-3 rounded-2xl h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <MessageSquare className="size-5" />
                                        Chat
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>

                    <footer className="mt-auto px-6 py-10 flex flex-col items-center gap-6 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-black">
                        <div className="flex gap-10">
                            <a className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors cursor-pointer">Safety</a>
                            <a className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors cursor-pointer">Details</a>
                            <a className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline cursor-pointer">Cancel</a>
                        </div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">RideConnect Premium • 2026</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default DriverAssigned;
