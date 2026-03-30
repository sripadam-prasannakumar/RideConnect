import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalBackButton from '../Shared/GlobalBackButton';

const VehicleBrandSelection = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    {/* Main Content Container */}
                    <div className="max-w-[1200px] mx-auto w-full px-4 md:px-10 lg:px-20 py-5">
                        {/* Header */}
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-4 py-4 mb-8">
                            <div className="flex items-center gap-6">
                                <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-200 dark:border-slate-800" />
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/customer/dashboard')}>
                                    <div className="size-10 flex items-center justify-center rounded-lg bg-primary/10">
                                        <img className="w-8 h-8 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8Mmhxd0VFIAR0cnrzTGQU9jbiw1JwUd3wuMI3JzEbSOoJ3ZLXoHce-MmRxaVnpcNSNhFeH-OOeZiAtXvx4j5TSxCKx8jkjuth5nx4_5qHCp6NFHToUEiOjRNEykhXm0PPN6oC9F7VtIhmlzztKcd3dsZoCEtji4GwrOZb-ZTYDnimPXYd21AV9_hNs6OnRtsRuHWRj-SqKMhX8e2hR1sCIOP3IwgIPM50TaL3h0Y221QI9gbEo0N9g0NOKud1gwcGj5DfAYGxKps" alt="RideConnect Logo" />
                                    </div>
                                    <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">RideConnect</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="flex items-center justify-center rounded-full w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/20 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">notifications</span>
                                </button>
                                <div onClick={() => navigate('/customer/profile')} className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/30 cursor-pointer" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuANE95yPc4phvJ1i-eCGmwFUxEq-AjQUgE6bpsXp70b0DCpX7Q5aDtDBCcSL6mEdMH8zaC_MR3coWzIuYVrLNkx-znjgtGeKXL1Njgun0HrRrPCIWWd_kAmIcxmkmoOkrTzLRxZEAVm9B1dQIOyqac73aZIStP4AoSN_XG7yYKirymDsLyj-8GSUKyXpFBJv9bMvtUDVfuED6QuCbTteWOYiN8MLKCJgKKJIlVdja_Ov_7jTSj_ZriAvpgnC6ixsrQZaiYc-s8rbRE')" }}>
                                </div>
                            </div>
                        </header>

                        {/* Page Title & Search Section */}
                        <div className="flex flex-col gap-6 px-4 mb-8">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-3xl md:text-4xl font-bold leading-tight">Select Vehicle Brand</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Choose your car manufacturer to personalize your experience</p>
                            </div>
                            <div className="max-w-2xl w-full">
                                <label className="relative flex items-center group">
                                    <div className="absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined">search</span>
                                    </div>
                                    <input className="w-full h-14 pl-12 pr-4 rounded-xl border-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-500 transition-all text-lg" placeholder="Search brands (e.g. BMW, Tesla, Honda)" type="text" />
                                </label>
                            </div>
                        </div>

                        {/* Brand Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
                            {/* Brand Card: Honda */}
                            <div onClick={() => navigate('/customer/vehicle-model')} className="group cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                    <img className="w-full h-full object-contain" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/320px-Honda.svg.png" alt="Honda" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Honda</p>
                                    <p className="text-primary text-xs font-medium uppercase tracking-wider">Popular</p>
                                </div>
                            </div>
                            {/* Brand Card: Toyota */}
                            <div onClick={() => navigate('/customer/vehicle-model')} className="group cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                    <img className="w-full h-full object-contain" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/320px-Toyota_carlogo.svg.png" alt="Toyota" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Toyota</p>
                                    <p className="text-primary text-xs font-medium uppercase tracking-wider">Popular</p>
                                </div>
                            </div>
                            {/* Brand Card: Hyundai */}
                            <div onClick={() => navigate('/customer/vehicle-model')} className="group cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                    <img className="w-full h-full object-contain" src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/320px-Hyundai_Motor_Company_logo.svg.png" alt="Hyundai" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Hyundai</p>
                                    <p className="text-primary text-xs font-medium uppercase tracking-wider">Popular</p>
                                </div>
                            </div>
                            {/* Brand Card: Tata */}
                            <div onClick={() => navigate('/customer/vehicle-model')} className="group cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                    <img className="w-full h-full object-contain" src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tata_logo.svg/320px-Tata_logo.svg.png" alt="Tata" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Tata</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">Local Favorite</p>
                                </div>
                            </div>
                            {/* Brand Card: Mahindra */}
                            <div onClick={() => navigate('/customer/vehicle-model')} className="group cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                    <img className="w-full h-full object-contain" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Mahindra_Logo.svg/320px-Mahindra_Logo.svg.png" alt="Mahindra" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Mahindra</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">Local Favorite</p>
                                </div>
                            </div>
                            {/* Brand Card: BMW */}
                            <div onClick={() => navigate('/customer/vehicle-model')} className="group cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                    <img className="w-full h-full object-contain" src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/240px-BMW.svg.png" alt="BMW" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">BMW</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">Premium</p>
                                </div>
                            </div>
                            {/* Brand Card: Tesla */}
                            <div onClick={() => navigate('/customer/vehicle-model')} className="group cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                    <img className="w-full h-full object-contain" src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tesla_T_symbol.svg/240px-Tesla_T_symbol.svg.png" alt="Tesla" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Tesla</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">Electric</p>
                                </div>
                            </div>
                            {/* Brand Card: Ford */}
                            <div onClick={() => navigate('/customer/vehicle-model')} className="group cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                    <img className="w-full h-full object-contain" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/320px-Ford_logo_flat.svg.png" alt="Ford" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Ford</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">Global</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-8 mt-4 border-t border-slate-200 dark:border-slate-800">
                            <button onClick={() => navigate('/customer/dashboard')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-base font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700">
                                <span className="material-symbols-outlined text-xl">arrow_back</span>
                                <span>Back to Dashboard</span>
                            </button>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Can't find your brand? <span className="text-primary hover:underline cursor-pointer">Contact support</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleBrandSelection;
