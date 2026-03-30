import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { storeAuthInfo, decodeJwt, getAuthStatus } from '../../utils/authUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';

const RegisterPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const role = (queryParams.get('role') || 'customer').toLowerCase();

    useEffect(() => {
        const { isAuthenticated, role: userRole } = getAuthStatus();
        if (isAuthenticated) {
            if (userRole === 'admin') navigate('/admin/dashboard');
            else if (userRole === 'driver') navigate('/driver/dashboard');
            else navigate('/customer/dashboard');
        }
    }, [navigate]);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setApiError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    role: role,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Do NOT store auth info here — user is not verified yet.
                // Only store pending info to pass to OTP page.
                sessionStorage.setItem('pending_email', formData.email);
                sessionStorage.setItem('user_role', role);
                sessionStorage.setItem('registration_success', 'true');
                navigate('/verify-email');
            } else {
                // Extract specific error messages from backend
                let errorMsg = 'Registration failed. Please check your details.';
                if (data) {
                    if (data.non_field_errors) {
                        // Cross-role validation errors come through here
                        errorMsg = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
                    } else if (data.email) {
                        errorMsg = Array.isArray(data.email) ? data.email[0] : data.email;
                    } else if (data.password) {
                        errorMsg = Array.isArray(data.password) ? data.password[0] : data.password;
                    } else if (data.phone) {
                        errorMsg = Array.isArray(data.phone) ? data.phone[0] : data.phone;
                    } else if (data.error) {
                        errorMsg = data.error;
                    } else if (data.detail) {
                        errorMsg = data.detail;
                    }
                }
                setApiError(errorMsg);
                console.error('Registration errors:', data);
            }
        } catch (error) {
            console.error('Registration error:', error);
            setApiError('Something went wrong. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        console.log('Google Registration Success:', credentialResponse);
        
        try {
            const decoded = decodeJwt(credentialResponse.credential);
            if (decoded) {
                // Store real user info from Google
                storeAuthInfo({
                    email: decoded.email,
                    name: decoded.name,
                    role: role
                });
                navigate(role === 'driver' ? '/driver/dashboard' : '/customer/dashboard');
            } else {
                setApiError('Failed to parse Google account information.');
            }
        } catch (error) {
            console.error('Google handling error:', error);
            setApiError('Error processing Google registration.');
        }
    };

    const handleGoogleError = () => {
        console.log('Google Registration Failed');
        setApiError('Google Registration Failed. Please try again.');
    };

    if (role === 'driver') {
        // Driver layout with premium background
        return (
            <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-x-hidden antialiased">
                {/* Background Image with Overlay */}
                <div className="fixed inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-background-dark/90 to-background-dark z-10"></div>
                    <div 
                        className="h-full w-full bg-cover bg-center" 
                        style={{ 
                            backgroundImage: "url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')" 
                        }}
                    ></div>
                </div>

                {/* Top-Left Back Button */}
                <div className="fixed top-8 left-8 z-50">
                    <GlobalBackButton variant="ghost" className="text-primary hover:text-white transition-all transform hover:scale-110 active:scale-95" />
                </div>

                <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 py-8">
                    {/* Header/Logo Area */}
                    <div className="mb-6 flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-dark/60 backdrop-blur-md shadow-[0_0_20px_rgba(13,204,242,0.2)] border border-primary/30 overflow-hidden relative group">
                                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(13,204,242,0.8)_360deg)] animate-[spin_3s_linear_infinite] group-hover:animate-[spin_1.5s_linear_infinite]"></div>
                                <div className="absolute inset-1 bg-background-dark/90 rounded-full backdrop-blur-md z-0"></div>
                                <img src="/drivemate_logo.png" alt="RideConnect" className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-white">Drive<span className="text-primary">Mate</span></h1>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Partner with Us</h2>
                            <p className="mt-2 text-slate-400">Join our community of professional drivers</p>
                        </div>

                        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {apiError && <div className="md:col-span-2 text-red-400 font-bold text-center text-xs bg-red-400/10 py-2 rounded-lg border border-red-400/20 mb-2">{apiError}</div>}

                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="name">Full Name</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">person</span>
                                    <input name="name" value={formData.name} onChange={handleInputChange} required className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="John Doe" />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="phone">Phone Number</label>
                                <div className="phone-input-container-custom group">
                                    <PhoneInput
                                        country={'in'}
                                        value={formData.phone}
                                        onChange={phone => setFormData({ ...formData, phone: '+' + phone })}
                                        inputProps={{ name: 'phone', required: true }}
                                        containerClass="!w-full"
                                        inputClass="!w-full !rounded-lg !border !border-slate-700 !bg-slate-800/50 !py-3 !pl-14 !pr-3 !text-white !placeholder-slate-500 focus:!border-primary focus:!ring-1 focus:!ring-primary transition-all !h-[46px]"
                                        buttonClass="!bg-transparent !border-none !rounded-lg !pl-2"
                                        dropdownClass="dark:!bg-slate-800 dark:!text-slate-100"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="email">Email Address</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">mail</span>
                                    <input name="email" value={formData.email} onChange={handleInputChange} required className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="driver@drivemate.com" type="email" />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="password">Set Password</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">lock</span>
                                    <input name="password" value={formData.password} onChange={handleInputChange} required className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-12 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="••••••••" type={showPassword ? "text" : "password"} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                        <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <button disabled={isLoading} type="submit" className="w-full bg-primary py-3 rounded-lg text-background-dark font-bold text-lg hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                                    {isLoading ? 'Creating Account...' : 'Register as Partner'}
                                </button>
                            </div>

                            <div className="md:col-span-2">
                                <div className="relative flex items-center py-4">
                                    <div className="flex-grow border-t border-slate-800"></div>
                                    <span className="mx-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Or sign up with</span>
                                    <div className="flex-grow border-t border-slate-800"></div>
                                </div>
                                <div className="md:col-span-2 flex justify-center mt-6">
                                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_blue" shape="pill" size="large" text="signup_with" width="280" />
                                </div>
                            </div>

                            <div className="md:col-span-2 text-center pt-4">
                                <p className="text-slate-400 text-sm">
                                    Already have a partner account? 
                                    <button type="button" onClick={() => navigate('/login?role=driver')} className="text-primary font-bold hover:underline ml-1">Log in here</button>
                                </p>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 text-center text-[10px] text-slate-600 space-x-4 uppercase tracking-widest font-bold">
                        <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
                        <span>•</span>
                        <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
                        <span>•</span>
                        <a href="/support" className="hover:text-primary transition-colors">Support</a>
                    </div>
                </div>
            </div>
        );
    }

    // Customer Registration flow
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
                        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-surface-dark/60 backdrop-blur-md shadow-[0_0_20px_rgba(13,204,242,0.2)] border border-primary/30 overflow-hidden relative group">
                            <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(13,204,242,0.8)_360deg)] animate-[spin_3s_linear_infinite] group-hover:animate-[spin_1.5s_linear_infinite]"></div>
                            <div className="absolute inset-1 bg-background-dark/90 rounded-full backdrop-blur-md z-0"></div>
                            <img 
                                src="/drivemate_logo.png" 
                                alt="RideConnect" 
                                className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10" 
                            />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white">Drive<span className="text-primary">Mate</span></h1>
                    </div>
                </div>

                {/* Registration Card */}
                <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-900/40 p-8 backdrop-blur-xl border border-slate-800 shadow-2xl">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
                        <p className="mt-2 text-sm text-slate-400">Join the future of premium mobility</p>
                    </div>

                    <form onSubmit={handleRegister} className="mt-8 space-y-5">
                        {apiError && <div className="text-red-500 font-bold mb-4 text-center text-sm">{apiError}</div>}

                        {/* Full Name */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="name">Full Name</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-500 text-lg">person</span>
                                </div>
                                <input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm" placeholder="John Doe" type="text" />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="phone">Phone Number</label>
                            <div className="relative phone-input-container-custom">
                                <PhoneInput
                                    country={'in'}
                                    value={formData.phone}
                                    onChange={phone => setFormData({ ...formData, phone: '+' + phone })}
                                    inputProps={{
                                        name: 'phone',
                                        required: true,
                                        autoFocus: false
                                    }}
                                    containerClass="!w-full"
                                    inputClass="!w-full !rounded-lg !border !border-slate-700 !bg-slate-800/50 !py-3 !pl-14 !pr-3 !text-white !placeholder-slate-500 focus:!border-primary focus:!ring-1 focus:!ring-primary sm:!text-sm !h-12"
                                    buttonClass="!bg-transparent !border-none !rounded-lg !pl-2"
                                    dropdownClass="!bg-slate-800 !text-white"
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-500 text-lg">mail</span>
                                </div>
                                <input id="email" name="email" value={formData.email} onChange={handleInputChange} required className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm" placeholder="name@company.com" type="email" />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-500 text-lg">lock</span>
                                </div>
                                <input id="password" name="password" value={formData.password} onChange={handleInputChange} required className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm" placeholder="••••••••" type={showPassword ? "text" : "password"} />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-300">
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
                            <button disabled={isLoading} className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-background-dark hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark transition-all disabled:opacity-50" type="submit">
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                    </form>

                    <div className="relative mt-6">
                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-slate-900/10 px-2 text-slate-400 backdrop-blur-md">Or continue with</span>
                        </div>
                    </div>

                        <div className="col-span-2 flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="filled_blue"
                                shape="pill"
                                size="large"
                                text="signup_with"
                                width="240"
                            />
                        </div>

                    <p className="mt-8 text-center text-sm text-slate-400">
                        Already have an account? 
                        <button onClick={() => navigate(`/login?role=${role}`)} className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors underline underline-offset-4 ml-1">Log in</button>
                    </p>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center text-xs text-slate-500 space-x-4">
                    <a className="hover:text-slate-300" href="/privacy">Privacy Policy</a>
                    <span>•</span>
                    <a className="hover:text-slate-300" href="/terms">Terms of Service</a>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
