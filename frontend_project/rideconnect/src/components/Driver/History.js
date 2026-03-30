import React from 'react';
import RideHistory from '../Customer/RideHistory';
import DriverSidebar from './DriverSidebar';

const DriverHistoryPage = () => {
    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden antialiased">
            <DriverSidebar />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <RideHistory />
            </div>
        </div>
    );
};

export default DriverHistoryPage;
