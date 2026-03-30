import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAuthInfo } from '../../utils/authUtils';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';

const OTPPage = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [email, setEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('pending_email');
        const role = sessionStorage.getItem('user_role');
        if (!storedEmail) {
            navigate('/register');
            return;
        }
        setEmail(storedEmail);
        setUserRole(role || 'customer');

        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [navigate]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        setErrorMsg('');

        if (element.value !== '' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (index > 0 && otp[index] === '') {
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');

        if (otpValue.length !== 6) {
            setErrorMsg("Please enter the complete 6-digit code.");
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        const payload = { email, otp: otpValue };
        console.log('Sending OTP verification request:', payload);

        try {
            // Backend endpoint is /api/verify-otp/ (not /api/verify-email/)
            const response = await fetch(`${API_BASE_URL}/api/verify-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log('OTP verification response:', response.status, data);

            if (response.ok) {
                // Store auth info returned from backend (now including name, role, etc.)
                storeAuthInfo({
                    email: data.email,
                    name: data.name || '',
                    role: data.role,
                    tokens: data.tokens
                });

                sessionStorage.removeItem('pending_email');
                
                const finalRole = data.role || userRole;
                if (finalRole === 'admin') {
                    navigate('/admin/dashboard');
                } else if (finalRole === 'driver') {
                    navigate('/driver/dashboard');
                } else {
                    navigate('/customer/dashboard');
                }
            } else {
                // Show specific backend error message
                const msg = data.error || data.detail || data.message || 'Verification failed. Please check your code.';
                setErrorMsg(msg);
                console.error('OTP validation errors:', data);
            }
        } catch (error) {
            console.error('Verification error:', error);
            setErrorMsg('Cannot connect to the server. Please make sure the backend is running on port 8000.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setErrorMsg('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/resend-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            console.log('Resend OTP response:', response.status);

            if (response.ok) {
                setTimer(30);
                setOtp(['', '', '', '', '', '']);
                setErrorMsg('');
                // Show inline success hint
                alert('A new verification code has been sent to your email.');
            } else {
                const data = await response.json();
                setErrorMsg(data.error || 'Failed to resend code. Please try again later.');
            }
        } catch (error) {
            console.error('Resend error:', error);
            setErrorMsg('Cannot connect to the server. Please try again.');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
            <div className="layout-container flex h-full grow flex-col">
                <div className="flex flex-1 justify-center items-center py-10 px-4">
                    <div className="layout-content-container flex flex-col max-w-[480px] w-full bg-slate-900/40 backdrop-blur-md rounded-xl border border-primary/10 overflow-hidden shadow-2xl relative pt-12">
                        <div className="absolute top-4 left-4 z-30">
                            <GlobalBackButton variant="ghost" className="text-white hover:text-primary" />
                        </div>
                        <div className="@container">
                            <div className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden min-h-64 relative" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDAFnBu-9r1A20iGXgVb3xQWko_zx8i_AiZ63OlwIgN9zVAeZoA1IHthyE025mfYkYGQ9Ii6k7ZpRJ_0Dx15uJIFppZED31pTu8BNMfFYOSYfRwBQ9DZuXjet9BXt73M_YxCNaURT7kF-BeA3yt6TP9im40-xxMVT1jNnolOqWQcDI-mCv20ucXgKU8vmAeQCef-t4JwKVvznJhN5xCSFIBqMK-CdVInm1i7VGPGMiJLMvW_FPl1p7cFjtHE9VyiwA-UBQq9__B2Q4")' }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent"></div>
                                <div className="relative p-6">
                                    <h1 className="text-white text-4xl font-black leading-tight tracking-tight">Security Check</h1>
                                    <p className="text-primary text-base font-medium">Verify your email address</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                {sessionStorage.getItem('registration_success') === 'true' && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-2">
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg mb-1">
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Registration Successful!
                                        </div>
                                        <p className="text-slate-300 text-sm font-semibold">Welcome to RideConnect.</p>
                                        <p className="text-slate-400 text-xs mt-2">A confirmation email has been sent to your registered email address. Please verify your email to continue.</p>
                                    </div>
                                )}
                                <h2 className="text-2xl font-bold text-slate-100">Enter Verification Code</h2>
                                <p className="text-slate-400 text-sm">We've sent a 6-digit code to <span className="text-primary font-bold">{email}</span></p>
                            </div>

                            <form onSubmit={handleVerifyEmail} className="space-y-6">
                                <div className="flex justify-between gap-2">
                                    {otp.map((data, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            name="otp"
                                            maxLength="1"
                                            ref={el => inputRefs.current[index] = el}
                                            value={data}
                                            onChange={e => handleChange(e.target, index)}
                                            onKeyDown={e => handleKeyDown(e, index)}
                                            className="form-input flex w-12 h-14 text-center rounded-lg text-slate-100 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary/50 border border-slate-700 bg-slate-800/50 transition-all"
                                        />
                                    ))}
                                </div>

                                {/* Error message */}
                                {errorMsg && (
                                    <div className="text-red-400 text-sm font-medium text-center bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold h-12 rounded-lg transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70"
                                >
                                    {isLoading ? 'Verifying...' : 'Verify Email'}
                                </button>
                            </form>

                            <div className="text-center pt-4 border-t border-slate-700/50 mt-6">
                                <p className="text-slate-400 text-sm">
                                    Didn't receive the code?{' '}
                                    {timer > 0 ? (
                                        <span className="text-slate-500 font-medium ml-1">Resend in {timer}s</span>
                                    ) : (
                                        <button onClick={handleResend} className="text-primary font-bold hover:underline ml-1">Resend Code</button>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur rounded-full border border-primary/20 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Verification System: Active
                </div>
            </div>
        </div>
    );
};

export default OTPPage;
