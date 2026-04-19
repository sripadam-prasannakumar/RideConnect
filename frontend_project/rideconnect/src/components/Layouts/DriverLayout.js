import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DriverSidebar from '../Driver/DriverSidebar';
import { Menu } from 'lucide-react';
import LogoBadge from '../Shared/LogoBadge';


const DriverLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#0a0f1c]">
            {/* Mobile Header Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1c] fixed top-0 left-0 w-full z-30">
                <LogoBadge size="sm" />

                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="p-2 text-primary rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 shadow-2xl lg:shadow-none`}>
                <DriverSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <main className="flex-1 w-full lg:w-auto overflow-hidden flex flex-col pt-[72px] lg:pt-0">
                <Outlet />
            </main>
        </div>
    );
};

export default DriverLayout;
