import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthStatus } from './utils/authUtils';
import { authorizedFetch } from './utils/apiUtils';
import API_BASE_URL from './apiConfig';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const { isAuthenticated } = getAuthStatus();

    const fetchProfile = useCallback(async () => {
        if (!isAuthenticated) {
            setUserProfile(null);
            setLoadingProfile(false);
            return;
        }

        try {
            setLoadingProfile(true);
            const res = await authorizedFetch(`${API_BASE_URL}/api/user-profile/`);
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data);
                
                // Sync with local storage for quick access on next load
                localStorage.setItem('userName', data.full_name);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userEmail', data.email);
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setUserProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return (
        <UserContext.Provider value={{ userProfile, setUserProfile, loadingProfile, refreshUserProfile: fetchProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
