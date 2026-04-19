import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { getAuthStatus } from '../../utils/authUtils';

/**
 * A wrapper for routes that should only be accessible to authenticated users.
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Component to render if authenticated
 * @param {string} props.role - Required role for access (optional)
 */
const ProtectedRoute = ({ children, role }) => {
    const { isAuthenticated, role: userRole } = getAuthStatus();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login page but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role && userRole !== role) {
        if (role === 'admin') {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-slate-900 flex-col font-display">
                    <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700 backdrop-blur-xl flex flex-col items-center shadow-2xl">
                        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">gavel</span>
                        <h1 className="text-3xl text-white font-black tracking-widest uppercase">Access Denied</h1>
                        <p className="text-slate-400 mt-2 font-medium">Elevated privileges required to view this system.</p>
                    </div>
                </div>
            );
        }
        // If they don't have the right role, redirect to their own dashboard
        const redirectPath = userRole === 'driver' ? '/driver/dashboard' : '/customer/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
