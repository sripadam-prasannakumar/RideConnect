import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalBackButton from '../Shared/GlobalBackButton';
import API_BASE_URL from '../../apiConfig';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('email'); // 'email', 'otp', 'reset'
    
    // Form States
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    
    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/forgot-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            
            if (response.ok) {
                setSuccessMessage(data.message);
                setStep('otp');
            } else {
                setError(data.error || 'Failed to request password reset.');
            }
        } catch (err) {
            setError('Cannot connect to server.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };
    
    const handleOtpSubmit = (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }
        setError('');
        setStep('reset');
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/reset-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    otp: otp.join(''),
                    new_password: newPassword,
                    confirm_password: confirmPassword
                }),
            });
            const data = await response.json();
            
            if (response.ok) {
                setSuccessMessage('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.error || 'Failed to reset password.');
            }
        } catch (err) {
            setError('Cannot connect to server.');
        } finally {
            setIsLoading(false);
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
                        
                        <div className="relative p-8 border-b border-primary/10 text-center">
                            <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Forgot Password</h1>
                            <p className="text-primary text-sm font-medium mt-2">
                                {step === 'email' && "Enter your email to receive an OTP"}
                                {step === 'otp' && "Verify your email address"}
                                {step === 'reset' && "Create a new password"}
                            </p>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <AnimatePresence mode="wait">
                                {step === 'email' && (
                                    <motion.form 
                                        key="email"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleEmailSubmit} 
                                        className="space-y-4"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <label className="text-slate-300 text-sm font-medium">Email Address</label>
                                            <input 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)} 
                                                required 
                                                className="form-input flex w-full rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-slate-700 bg-slate-800/50 h-12 placeholder:text-slate-500 px-4 text-base transition-all" 
                                                placeholder="hello@drivemate.com" 
                                                type="email" 
                                            />
                                        </div>
                                        {error && <div className="text-red-400 text-sm font-medium text-center">{error}</div>}
                                        <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold h-12 rounded-lg transition-all shadow-lg shadow-primary/20 active:scale-[0.98] mt-6 disabled:opacity-70">
                                            {isLoading ? 'Sending OTP...' : 'Send Verification Code'}
                                        </button>
                                        <button type="button" onClick={() => navigate('/login')} className="w-full text-slate-400 text-sm font-medium hover:text-white transition-colors">
                                            Back to Login
                                        </button>
                                    </motion.form>
                                )}

                                {step === 'otp' && (
                                    <motion.form 
                                        key="otp"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleOtpSubmit} 
                                        className="space-y-6"
                                    >
                                        <div className="text-center text-slate-300 text-sm">
                                            We've sent a 6-digit code to <span className="text-white font-bold">{email}</span>
                                        </div>
                                        <div className="flex justify-center gap-2 sm:gap-4">
                                            {otp.map((data, index) => (
                                                <input
                                                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border border-slate-700 bg-slate-800/50 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                                    type="text"
                                                    name="otp"
                                                    maxLength="1"
                                                    key={index}
                                                    value={data}
                                                    onChange={e => handleOtpChange(e.target, index)}
                                                    onFocus={e => e.target.select()}
                                                    onKeyDown={e => handleOtpKeyDown(e, index)}
                                                />
                                            ))}
                                        </div>
                                        {error && <div className="text-red-400 text-sm font-medium text-center">{error}</div>}
                                        {successMessage && <div className="text-green-400 text-sm font-medium text-center">{successMessage}</div>}
                                        <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold h-12 rounded-lg transition-all shadow-lg shadow-primary/20 active:scale-[0.98] mt-6">
                                            Verify Code
                                        </button>
                                        <button type="button" onClick={() => setStep('email')} className="w-full text-slate-400 text-sm font-medium hover:text-white transition-colors">
                                            Change Email
                                        </button>
                                    </motion.form>
                                )}

                                {step === 'reset' && (
                                    <motion.form 
                                        key="reset"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleResetSubmit} 
                                        className="space-y-4"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <label className="text-slate-300 text-sm font-medium">New Password</label>
                                            <div className="relative flex w-full items-stretch">
                                                <input 
                                                    value={newPassword} 
                                                    onChange={(e) => setNewPassword(e.target.value)} 
                                                    required 
                                                    className="form-input flex w-full rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-slate-700 bg-slate-800/50 h-12 placeholder:text-slate-500 px-4 pr-12 text-base transition-all" 
                                                    placeholder="••••••••" 
                                                    type={showPassword1 ? "text" : "password"} 
                                                />
                                                <button type="button" onClick={() => setShowPassword1(!showPassword1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword1 ? 'visibility_off' : 'visibility'}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-slate-300 text-sm font-medium">Confirm New Password</label>
                                            <div className="relative flex w-full items-stretch">
                                                <input 
                                                    value={confirmPassword} 
                                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                                    required 
                                                    className="form-input flex w-full rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-slate-700 bg-slate-800/50 h-12 placeholder:text-slate-500 px-4 pr-12 text-base transition-all" 
                                                    placeholder="••••••••" 
                                                    type={showPassword2 ? "text" : "password"} 
                                                />
                                                <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword2 ? 'visibility_off' : 'visibility'}</span>
                                                </button>
                                            </div>
                                        </div>

                                        {error && <div className="text-red-400 text-sm font-medium text-center">{error}</div>}
                                        {successMessage && <div className="text-green-400 text-sm font-medium text-center">{successMessage}</div>}
                                        
                                        <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold h-12 rounded-lg transition-all shadow-lg shadow-primary/20 active:scale-[0.98] mt-6 disabled:opacity-70">
                                            {isLoading ? 'Resetting Password...' : 'Reset Password'}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
