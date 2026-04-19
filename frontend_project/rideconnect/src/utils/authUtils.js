/**
 * Decodes a JWT token without using external libraries.
 * @param {string} token 
 * @returns {object|null}
 */
export const decodeJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
};

/**
 * Stores user info in both localStorage and sessionStorage for persistence and quick access.
 * @param {object} userData 
 */
export const storeAuthInfo = ({ email, name, role, tokens }) => {
    if (email) {
        localStorage.setItem('userEmail', email);
        sessionStorage.setItem('user_email', email);
    }
    if (name) {
        localStorage.setItem('userName', name);
        sessionStorage.setItem('user_name', name);
    }
    if (role) {
        localStorage.setItem('userRole', role);
        sessionStorage.setItem('user_role', role);
    }
    if (tokens && tokens.access) {
        localStorage.setItem('access_token', tokens.access);
        sessionStorage.setItem('access_token', tokens.access);
    }
    if (tokens && tokens.refresh) {
        localStorage.setItem('refresh_token', tokens.refresh);
    }
};

/**
 * Retrieves the stored access token.
 * @returns {string|null}
 */
export const getAccessToken = () => localStorage.getItem('access_token');

/**
 * Retrieves the stored refresh token.
 * @returns {string|null}
 */
export const getRefreshToken = () => localStorage.getItem('refresh_token');

/**
 * Clears all auth-related storage.
 */
export const clearAuthInfo = () => {
    // Clear localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    
    // Clear any active ride data
    localStorage.removeItem('activeRide');
    localStorage.removeItem('lastActiveRideId');
    localStorage.removeItem('lastSearchingRideId');
    localStorage.removeItem('lastSearchingRideData');
    
    // Clear session-specific registration markers
    sessionStorage.removeItem('registration_success');
    sessionStorage.removeItem('pending_email');
    
    // Clear JWT tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Fallback for any other potential markers
    sessionStorage.clear();
};

/**
 * Retrieves authentication status and user email.
 * Checks sessionStorage first, then localStorage.
 * @returns {object} { isAuthenticated: boolean, email: string|null, role: string|null }
 */
export const getAuthStatus = () => {
    const email = sessionStorage.getItem('user_email') || localStorage.getItem('userEmail');
    const name = sessionStorage.getItem('user_name') || localStorage.getItem('userName');
    const role = sessionStorage.getItem('user_role') || localStorage.getItem('userRole');
    const token = localStorage.getItem('access_token');
    
    // If it was in localStorage but not sessionStorage, sync them
    if (localStorage.getItem('userEmail') && !sessionStorage.getItem('user_email')) {
        sessionStorage.setItem('user_email', localStorage.getItem('userEmail'));
        sessionStorage.setItem('user_name', localStorage.getItem('userName') || '');
        sessionStorage.setItem('user_role', localStorage.getItem('userRole') || 'customer');
    }

    return {
        isAuthenticated: !!email && !!token,
        email: email,
        name: name,
        role: role
    };
};

/**
 * Stores active ride information for persistence.
 */
export const storeActiveRide = (rideData) => {
    if (rideData && rideData.id) {
        localStorage.setItem('activeRide', JSON.stringify(rideData));
    } else {
        localStorage.removeItem('activeRide');
    }
};

/**
 * Retrieves stored active ride information.
 */
export const getActiveRide = () => {
    const ride = localStorage.getItem('activeRide');
    return ride ? JSON.parse(ride) : null;
};

/**
 * Clears all ride-related persistence data.
 */
export const clearActiveRide = () => {
    localStorage.removeItem('activeRide');
    localStorage.removeItem('lastActiveRideId');
    localStorage.removeItem('lastSearchingRideId');
    localStorage.removeItem('lastSearchingRideData');
};
