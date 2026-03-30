import React from 'react';
import { Outlet } from 'react-router-dom';
import DriverSidebar from '../Driver/DriverSidebar';

const DriverLayout = () => {
    return (
        <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
            <DriverSidebar />
            <main className="flex-1 overflow-hidden flex flex-col">
                <Outlet />
            </main>
        </div>
    );
};

export default DriverLayout;
