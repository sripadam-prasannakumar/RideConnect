import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DriverNavigation = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const rideId = state?.rideId;

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden h-screen">
            <style>
                {`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                .map-gradient-overlay {
                    background: radial-gradient(circle at center, transparent 0%, rgba(16, 31, 34, 0.4) 100%);
                }
                .route-glow {
                    filter: drop-shadow(0 0 8px #0dccf2);
                }
                `}
            </style>
            <div className="relative h-screen w-full flex flex-col overflow-hidden">
                {/* Full Screen Map Background */}
                <div className="absolute inset-0 z-0 bg-slate-800 dark:bg-background-dark">
                    <div className="w-full h-full bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA141lXwVYqMYlRISjF0VtP70Y82g5q5xVg6lvjVa0g8tbiMF1IqlmjN4dCR0Hv0cqh7LULJvK6y14sEAc8xxJpQwvIhsVn0gwXDoRNJXF1GpvmTbpiS0sNsk4N0XLYE7rXbfLKn4Mh2lQ5hEieuJUQPI3ZICtNdlerKaw90T0GT1zvMf0G6tfNHi6UZNXPxDQ8wkBiYD4uXA3dIvexcQqpAG88iwZq37jVT-ole2HsMFIFkHn1xwzP2qFcwUr1etAokOrJJjdjBNM')" }}>
                    </div>
                    <div className="absolute inset-0 map-gradient-overlay"></div>
                </div>

                {/* Top Navigation Bar & Turn Instruction */}
                <div className="relative z-10 w-full max-w-2xl mx-auto pt-4 px-4">
                    <header className="flex items-center justify-between bg-background-dark/80 backdrop-blur-md rounded-xl border border-primary/20 px-6 py-3 mb-4 shadow-2xl">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/driver/dashboard')}>
                            <img className="size-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_kP4HKY45dhZC3l2ulerdHut6_2XxDMrQ43Lx6F442vumJC2paaeHCVsxrQYBcxGgX12dZaxFxbX_gDCSxPh_KfoyaRg32z0dNggoAjcvtNNFasilK2pUbNoaivV1cOa1as8hi-G3gIdMYCxtpjKBzZSX5N4q9n5bkIwUije1ZcANQ4MmbTiunKePgrq695xqINom5nrucuLX7muf65yONdGtIRgxLr-SCN-gV_KrcfjRhnQ5Dk1G7xtvZxFak3bt17A0BLV8xVI" alt="RideConnect Logo" />
                            <h1 className="text-primary text-xl font-bold tracking-tight">RideConnect</h1>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => navigate('/driver/settings')} className="size-10 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary transition-colors hover:bg-primary/20">
                                <span className="material-symbols-outlined">settings</span>
                            </button>
                            <div onClick={() => navigate('/driver/profile')} className="size-10 rounded-full bg-primary/20 border-2 border-primary overflow-hidden cursor-pointer">
                                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB323O5I3cEBwHhFsuXtIuorcp3IlGTMMRMz7rGroeZ7H1cp_PxfxRkBLg4Iph4lk7OUCN8W5NtuIHQeKEqmBOU92aIoko9vMfp4OJegiyn_HUswpXEmn99cl4_EP3f3Dt4PWr2122sPTvK_mOMSL-K5LPJvz64ORsR5dKinA8cvBuLMiTTcs2AG2MGlLi2whx8cO9zjj-vxzw9VUjoRtcW79pLvZ7JcqtQRy76iq5dnkb5GeKC2V2kb_AT8uCdDmem55WJqLQGN9w" alt="Driver Profile Avatar" />
                            </div>
                        </div>
                    </header>

                    {/* Turn-by-Turn Instruction Card */}
                    <div className="bg-background-dark/95 backdrop-blur-lg rounded-xl p-5 border-l-4 border-primary shadow-2xl flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="bg-primary/20 p-3 rounded-lg text-primary">
                                <span className="material-symbols-outlined !text-4xl">turn_right</span>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Next Turn</p>
                                <h2 className="text-white text-xl font-bold">Turn Right onto Wilshire Blvd</h2>
                                <p className="text-primary font-bold mt-1">In 500 ft</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="material-symbols-outlined text-slate-500 !text-3xl">navigation</span>
                        </div>
                    </div>
                </div>

                {/* Right Side Map Controls */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
                    <button className="size-12 rounded-lg bg-background-dark/90 border border-primary/20 text-white shadow-xl flex items-center justify-center hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                    <button className="size-12 rounded-lg bg-background-dark/90 border border-primary/20 text-white shadow-xl flex items-center justify-center hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined">remove</span>
                    </button>
                    <button className="size-12 rounded-lg bg-primary text-background-dark shadow-xl flex items-center justify-center mt-4 hover:brightness-110 transition-colors">
                        <span className="material-symbols-outlined">my_location</span>
                    </button>
                </div>

                {/* Bottom Pickup Overlay Card */}
                <div className="mt-auto relative z-10 w-full max-w-2xl mx-auto pb-6 px-4">
                    <div className="bg-background-dark/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-primary/10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4">
                                <div className="size-14 rounded-xl bg-slate-700 overflow-hidden border border-primary/30">
                                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0Sit9E7Ib2jcHA_K9BBwpD4YpcIhXWJvfWiaRAaUUmzzV79Am52IAQcvCKc5IgKcZDgIy0WQpQL3-dnaYnLZp2YVmf0ohkqtZYj3lS7HezLKA2X2P68FHR6HXx_mO6LBYdIGdDzY7VEnBB5lu4Z4e3zggqhJ71oZjnpznfZI_5CVukUxpBCUN5xvgau6UY6VpJwcef6uCx18-88TjFRQV9CtO5ON7hjEb4u7DcHataCIyMnaq7M8eigrZuhvuEam38VE52PqxxX4" alt="Sarah J. customer portrait" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white text-xl font-bold">Sarah J.</h3>
                                        <div className="flex items-center bg-primary/10 px-2 py-0.5 rounded text-primary text-xs font-bold">
                                            <span className="material-symbols-outlined !text-xs mr-1 leading-none">star</span>
                                            4.9
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-sm mt-1">Pickup: 1245 Diamond St, Beverly Hills</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-primary text-2xl font-black">8 min</p>
                                <p className="text-slate-400 text-sm">2.5 miles</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => navigate('/driver/trip-status', { state: { rideId: rideId } })} className="flex-1 bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-[0.98]">
                                <span className="material-symbols-outlined">check_circle</span>
                                Arrived at Pickup
                            </button>
                            <button className="size-14 bg-slate-800 hover:bg-slate-700 text-primary border border-primary/20 rounded-xl flex items-center justify-center shadow-lg transition-all">
                                <span className="material-symbols-outlined">chat_bubble</span>
                            </button>
                            <button className="size-14 bg-slate-800 hover:bg-slate-700 text-primary border border-primary/20 rounded-xl flex items-center justify-center shadow-lg transition-all">
                                <span className="material-symbols-outlined">call</span>
                            </button>
                        </div>
                    </div>
                    {/* Handle indicator for expandable bottom sheet */}
                    <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mt-4 opacity-50"></div>
                </div>
            </div>
        </div>
    );
};

export default DriverNavigation;
