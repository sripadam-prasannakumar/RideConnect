import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { storeAuthInfo, decodeJwt, getAuthStatus } from '../../utils/authUtils';
import LogoBadge from '../Shared/LogoBadge';
import GlobalBackButton from '../Shared/GlobalBackButton';

import API_BASE_URL from '../../apiConfig';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const isSecureAdminRoute = location.pathname === '/admin/login' || location.pathname === '/secure-admin-login';
    let role = queryParams.get('role') || 'customer';
    
    // Security enhancement: Only allow admin role if directly accessing the admin login route.
    if (isSecureAdminRoute) {
        role = 'admin';
    } else if (role === 'admin') {
        role = 'customer';
    }

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        const { isAuthenticated, role: userRole } = getAuthStatus();
        if (isAuthenticated) {
            if (userRole === 'admin') navigate('/admin/dashboard');
            else if (userRole === 'driver') navigate('/driver/dashboard');
            else navigate('/customer/dashboard');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setApiError('');

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier, password, role }),
            });

            const data = await response.json();

            if (response.ok) {
                const userRole = data.role || role;

                if (data.require_otp) {
                    sessionStorage.setItem('pending_email', data.email);
                    sessionStorage.setItem('user_role', userRole);
                    navigate('/verify-otp');
                } else {
                    // Only store auth info if NOT requiring OTP (e.g. some internal bypass or future feature)
                    storeAuthInfo({
                        email: data.email,
                        name: data.name || '',
                        role: userRole
                    });

                    if (userRole === 'admin') {
                        navigate('/admin/dashboard');
                    } else if (userRole === 'driver') {
                        navigate('/driver/dashboard');
                    } else {
                        navigate('/customer/dashboard');
                    }
                }
            } else {
                setApiError(data.error || 'Invalid email or password. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setApiError('Cannot connect to server. Please make sure the backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        console.log('Google Login Success Handshake:', credentialResponse);
        
        try {
            // Decode Google ID Token
            const decoded = decodeJwt(credentialResponse.credential);
            if (decoded) {
                console.log('Decoded Google User Profile:', decoded);
                
                // CRITICAL FIX: We must store a token (even if simulated for now) 
                // so that getAuthStatus().isAuthenticated returns true, 
                // otherwise ProtectedRoute will immediately kick the user back to login.
                storeAuthInfo({
                    email: decoded.email,
                    name: decoded.name,
                    role: role,
                    tokens: { 
                        access: credentialResponse.credential, // Use Google's ID token as the session token for now
                        refresh: 'google-session-refresh' 
                    }
                });

                console.log('Authentication stored. Navigating to dashboard...');
                navigate(role === 'driver' ? '/driver/dashboard' : '/customer/dashboard');
            } else {
                setApiError('Failed to parse Google account information. Please try standard login.');
            }
        } catch (error) {
            console.error('Google handling error:', error);
            setApiError('Error processing Google secure login.');
        }
    };

    const handleGoogleError = (error) => {
        console.error('Google Identity Service Error:', error);
        setApiError('Google Login blocked or failed. Please check if your domain is authorized in Google Cloud.');
    };


    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
            {/* Background Image with Overlay */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-background-dark/90 to-background-dark z-10"></div>
                <div 
                    className="h-full w-full bg-cover bg-center" 
                    style={{ 
                        backgroundImage: `url(${role === 'driver' 
                            ? 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop' 
                            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyGAajvf6Zmq73sUKsxnHRe40rI58HXgsWDU7mvix7jR16d9a0GnSVqMlOnxE6IBmv78vtJMJ3I3jf_HBWrhVCWWDcPsL3UgGQlPv0bmSMjCuCyAKtsLwIX_8Y6Ltqzp-UeQ-guRcMLd0LhsbYAh6z-x5Oz9WBwF1PRr8QpICVI4sKm7w4F6U-hpJSn1Xle10ihSwJzr3S6t6J9qwwhJetF39xRWXPQabShp5dFwumA_6ob7gE-cfaaRTsHi7YkiaGSYMpgrJQ0Ks'})` 
                    }}
                ></div>
            </div>

            {/* Top-Left Back Button */}
            <div className="fixed top-8 left-8 z-50">
                <GlobalBackButton variant="ghost" className="text-primary hover:text-white transition-all transform hover:scale-110 active:scale-95" />
            </div>

            {/* Main Content */}
            <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                {/* Header/Logo Area */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-2">
                        <LogoBadge size="md" />

                        <h1 className="text-3xl font-black tracking-tight text-white">Ride<span className="text-primary">Connect</span></h1>
                    </div>
                </div>

                {/* Login Card */}
                <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-900/40 p-8 backdrop-blur-xl border border-slate-800 shadow-2xl relative overflow-hidden">

                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                            {role === 'admin' ? 'Admin Access' : 'Welcome Back'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            {role === 'admin' ? 'Manage the RideConnect ecosystem' : 'Enter your credentials to continue'}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-5">
                        {apiError && <div className="text-red-400 font-bold mb-4 text-center text-xs bg-red-400/10 py-2 rounded-lg border border-red-400/20">{apiError}</div>}

                        {/* Identifier (Email/Username) */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="identifier">
                                {role === 'admin' ? 'Username' : 'Email or Phone'}
                            </label>
                            <div className="relative group">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-500 text-lg group-focus-within:text-primary transition-colors">
                                        {role === 'admin' ? 'person' : 'mail'}
                                    </span>
                                </div>
                                <input 
                                    id="identifier" 
                                    name="identifier" 
                                    value={identifier} 
                                    onChange={(e) => setIdentifier(e.target.value)} 
                                    required 
                                    className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(13,204,242,0.1)] sm:text-sm transition-all" 
                                    placeholder={role === 'admin' ? "admin" : "name@company.com"} 
                                    type="text" 
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
                            <div className="relative group">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-500 text-lg group-focus-within:text-primary transition-colors">lock</span>
                                </div>
                                <input 
                                    id="password" 
                                    name="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                    className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-12 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(13,204,242,0.1)] sm:text-sm transition-all" 
                                    placeholder="••••••••" 
                                    type={showPassword ? "text" : "password"} 
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-300 transition-colors">
                                        <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end pt-1">
                                <button type="button" onClick={() => navigate('/forgot-password')} className="text-primary text-xs font-semibold hover:underline">Forgot password?</button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button 
                                disabled={isLoading} 
                                className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-background-dark hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark transition-all disabled:opacity-50 shadow-lg shadow-primary/20" 
                                type="submit"
                            >
                                {isLoading ? 'Verifying...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    {role !== 'admin' && (
                        <>
                            <div className="relative mt-6">
                                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-slate-900/10 px-2 text-slate-400 backdrop-blur-md">Or continue with</span>
                                </div>
                            </div>

                            <div className="flex justify-center mt-6">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="filled_blue"
                                    shape="pill"
                                    size="large"
                                    text="signin_with"
                                    width="280"
                                />
                            </div>

                            <div className="text-center pt-6">
                                <p className="text-slate-400 text-sm">
                                    Don't have an account? 
                                    <button 
                                        type="button" 
                                        onClick={() => navigate(`/role-selection`)} 
                                        className="text-primary font-bold hover:underline ml-1"
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* System Status Indicator */}
                <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-800/40 backdrop-blur-md rounded-full border border-primary/20 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Secure Encryption Active
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
