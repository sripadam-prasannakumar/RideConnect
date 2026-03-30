import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalBackButton from '../Shared/GlobalBackButton';

const VehicleModelSelection = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="relative flex min-h-screen flex-col overflow-x-hidden">
                <div className="flex h-full grow flex-col">
                    {/* Header */}
                    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 md:px-20 py-4 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-50">
                        <div className="flex items-center gap-6">
                            <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-200 dark:border-slate-800" />
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/customer/dashboard')}>
                                <div className="w-8 h-8 text-primary">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2m_R0OfHdgIya8D-NXku3HJG1YqZDX1jvj0M_JxOCdh_WResp5NNRCyC3a3jWQCyQwlgb7uTpSPEgDUPfeNy9kGLIksm2MtoZPEp8YkiYAjz0GnHblj6KmQ5hxX33oviuVNpULXBouOOKooIyez43E-hBRyY8eJWWLVuIL_ymqXUarhD2as0i6MVOTpIz5ila8m3V8-5SEDLR7JcDMiHzOB6za7zHPzKu2qHR-q2HrKMcO_F2xPOiTo8_UPSCshfeUKPrW7NIee0" alt="RideConnect Logo" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">RideConnect</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <div onClick={() => navigate('/customer/profile')} className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden cursor-pointer">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMs1iAS_ZaZb_Qx8sT1CjGhu7B-WjWf6xYktgwkqQVyeZQgaW4OIi6-luw1pMGe13M0sEb0qxhOnrPSJwxaKC2GfIi0y0cT7Y6Uemf9iBOGe29Dr4cbrQDNiEWn0nPWU6JIl5qkChDap6MJetnnvKfOmuvuF0ReGfZrbh5ysF-3jrRp0jquab2fak3FJQKCJiWAEWyZe10moPe83vJzMeOXKuLdhzfGHi41VccDKGb7y7YPnH8TKeLKaAjcDHVBF48lJU9rZvX0i0" alt="User Avatar" />
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-8">
                        {/* Progress Indicator */}
                        <div className="flex flex-col gap-4 mb-8">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">Configuration</span>
                                    <p className="text-lg font-medium">Step 2 of 3</p>
                                </div>
                                <p className="text-primary font-bold text-lg">66%</p>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '66%' }}></div>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Next: Choose Engine & Trim</p>
                        </div>

                        {/* Page Title */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">Select your Honda model</h1>
                            <p className="text-slate-500 dark:text-slate-400">Choose from the available models in your region</p>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-8">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                                <input className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400" placeholder="Search for City, Civic, Accord..." type="text" />
                            </div>
                        </div>

                        {/* Model Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* City Card */}
                            <div onClick={() => navigate('/customer/add-vehicle')} className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-primary transition-all cursor-pointer">
                                <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&auto=format&fit=crop" alt="Honda City" />
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">City</h3>
                                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-semibold uppercase">Popular</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Sedan</p>
                                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                                        <span>Configure</span>
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                            {/* Amaze Card */}
                            <div onClick={() => navigate('/customer/add-vehicle')} className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-primary transition-all cursor-pointer">
                                <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop" alt="Honda Amaze" />
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">Amaze</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Compact Sedan</p>
                                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                                        <span>Configure</span>
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                            {/* Civic Card */}
                            <div onClick={() => navigate('/customer/add-vehicle')} className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-primary transition-all cursor-pointer">
                                <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&auto=format&fit=crop" alt="Honda Civic" />
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">Civic</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Premium Sedan</p>
                                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                                        <span>Configure</span>
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                            {/* WR-V Card */}
                            <div onClick={() => navigate('/customer/add-vehicle')} className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-primary transition-all cursor-pointer">
                                <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop" alt="Honda WR-V" />
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">WR-V</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Compact SUV</p>
                                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                                        <span>Configure</span>
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                            {/* Jazz Card */}
                            <div onClick={() => navigate('/customer/add-vehicle')} className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-primary transition-all cursor-pointer">
                                <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&auto=format&fit=crop" alt="Honda Jazz" />
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">Jazz</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Premium Hatchback</p>
                                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                                        <span>Configure</span>
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                            {/* View More Card */}
                            <div className="group relative flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 hover:bg-primary/5 hover:border-primary transition-all cursor-pointer">
                                <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary mb-2 transition-colors">add_circle</span>
                                <p className="text-slate-500 dark:text-slate-400 font-medium group-hover:text-primary transition-colors">Other Models</p>
                            </div>
                        </div>

                        {/* Footer Navigation */}
                        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-between items-center py-8 border-t border-slate-200 dark:border-slate-800">
                            <button onClick={() => navigate('/customer/vehicle-brand')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-medium">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Back to Brands
                            </button>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button onClick={() => navigate('/customer/add-vehicle')} className="flex-1 sm:w-auto flex items-center justify-center gap-2 px-10 py-3 bg-primary text-background-dark rounded-lg hover:brightness-110 transition-all font-bold shadow-lg shadow-primary/20">
                                    Continue
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default VehicleModelSelection;
