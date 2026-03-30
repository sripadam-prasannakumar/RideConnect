import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthStatus } from './utils/authUtils';
import { authorizedFetch } from './utils/apiUtils';
import API_BASE_URL from './apiConfig';

const ThemeContext = createContext();

export const themeOptions = {
    light: [
        { id: 'default', name: 'Default Light', primary: '#0dccf2', bg: '#f5f8f8' },
        { id: 'blue', name: 'Blue Light', primary: '#2563eb', bg: '#eff6ff' },
        { id: 'green', name: 'Green Light', primary: '#16a34a', bg: '#f0fdf4' },
        { id: 'orange', name: 'Orange Light', primary: '#ea580c', bg: '#fff7ed' },
    ],
    dark: [
        { id: 'default', name: 'Default Dark', primary: '#0dccf2', bg: '#101f22' },
        { id: 'blue', name: 'Dark Blue', primary: '#3b82f6', bg: '#0f172a' },
        { id: 'purple', name: 'Dark Purple', primary: '#a855f7', bg: '#1e1b4b' },
        { id: 'green', name: 'Dark Green', primary: '#22c55e', bg: '#064e3b' },
    ]
};

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'dark');
    const [color, setColor] = useState(localStorage.getItem('themeColor') || 'default');

    useEffect(() => {
        const applyTheme = () => {
            const root = document.documentElement;
            const currentTheme = themeOptions[mode].find(t => t.id === color) || themeOptions[mode][0];
            
            root.style.setProperty('--color-primary', currentTheme.primary);
            if (mode === 'light') {
                root.classList.remove('dark');
                root.style.setProperty('--color-background', currentTheme.bg);
                root.style.setProperty('--color-text', '#0f172a');
                root.style.setProperty('--color-surface', '#ffffff');
                root.style.setProperty('--color-border', '#e2e8f0');
            } else {
                root.classList.add('dark');
                root.style.setProperty('--color-background', currentTheme.bg);
                root.style.setProperty('--color-text', '#f8fafc');
                root.style.setProperty('--color-surface', mode === 'dark' && color === 'default' ? '#162c30' : '#1e293b');
                root.style.setProperty('--color-border', mode === 'dark' && color === 'default' ? '#224249' : '#334155');
            }
            
            localStorage.setItem('themeMode', mode);
            localStorage.setItem('themeColor', color);
        };

        applyTheme();
    }, [mode, color]);

    // Initial sync with backend
    useEffect(() => {
        const syncWithBackend = async () => {
            const { isAuthenticated, email } = getAuthStatus();
            if (isAuthenticated) {
                try {
                    const res = await authorizedFetch(`${API_BASE_URL}/api/user-preferences/?email=${encodeURIComponent(email)}`);
                    const data = await res.json();
                    if (data.theme_mode) {
                        setMode(data.theme_mode);
                        setColor(data.theme_color);
                    }
                } catch (error) {
                    console.error("Theme sync error:", error);
                }
            }
        };
        syncWithBackend();
    }, []);

    const updateTheme = async (newMode, newColor) => {
        setMode(newMode);
        setColor(newColor);

        const { isAuthenticated, email } = getAuthStatus();
        if (isAuthenticated) {
            try {
                await authorizedFetch(`${API_BASE_URL}/api/user-preferences/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        theme_mode: newMode,
                        theme_color: newColor
                    })
                });
            } catch (error) {
                console.error("Failed to save theme preference:", error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ mode, color, updateTheme, themeOptions }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
