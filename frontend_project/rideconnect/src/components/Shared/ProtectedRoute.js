import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
        // If they don't have the right role, redirect to their own dashboard
        const redirectPath = userRole === 'driver' ? '/driver/dashboard' : '/customer/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
