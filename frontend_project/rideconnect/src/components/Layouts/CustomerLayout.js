import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerSidebar from '../Customer/CustomerSidebar';

const CustomerLayout = () => {
    return (
        <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
            <CustomerSidebar />
            <main className="flex-1 overflow-hidden flex flex-col">
                <Outlet />
            </main>
        </div>
    );
};

export default CustomerLayout;
