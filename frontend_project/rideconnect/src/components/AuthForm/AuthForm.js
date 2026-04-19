import React, { useState } from 'react';
import './AuthForm.css';

const AuthForm = ({ onLogin }) => {
    const [isToggled, setIsToggled] = useState(false);
    const [showPasswordLogin, setShowPasswordLogin] = useState(false);
    const [showPasswordReg, setShowPasswordReg] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [regStep, setRegStep] = useState(1); // 1: Info, 2: OTP, 3: Password
    const [isOtpSent, setIsOtpSent] = useState(false);
    
    const [errors, setErrors] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        match: false
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate login
        if (onLogin) onLogin();
    };

    const handleToggle = (e) => {
        e.preventDefault();
        setIsToggled(!isToggled);
        // Reset states when switching panels
        setShowPasswordLogin(false);
        setShowPasswordReg(false);
        setShowConfirmPassword(false);
        setRegStep(1);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setIsOtpSent(false);
        setErrors({
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false,
            match: false
        });
    };

    const validatePasswords = (pass, confirm) => {
        setErrors({
            length: pass.length >= 8,
            uppercase: /[A-Z]/.test(pass),
            lowercase: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[!@#$%^&*]/.test(pass),
            match: pass === confirm && confirm !== ''
        });
    };

    const handleSendOtp = (e) => {
        e.preventDefault();
        if (email) {
            setIsOtpSent(true);
            setRegStep(2);
            // Simulate OTP send
            console.log("OTP sent to:", email);
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (otp === '123456') { // Dummy OTP for now
            setRegStep(3);
        } else {
            alert("Invalid OTP! Use 123456 for testing.");
        }
    };

    return (
        <div className="auth-page-container">
            <div className={`auth-wrapper ${isToggled ? 'toggled' : ''}`}>
                <div className="background-shape"></div>
                <div className="secondary-shape"></div>

                {/* Login Panel */}
                <div className="credentials-panel signin">
                    <div className="logo-container slide-element">
                        <div className="logo-circle">
                            <img src="/rideconnect_logo.png" alt="RideConnect Logo" />
                            <div className="logo-aura"></div>
                        </div>
                    </div>
                    <h2 className="slide-element">Welcome Back</h2>
                    <p className="subtitle slide-element">Please enter your details to sign in</p>
                    <form action="#!" onSubmit={handleSubmit}>
                        <div className="field-group slide-element">
                            <label>Email or Phone</label>
                            <div className="field-wrapper">
                                <input type="text" placeholder="hello@rideconnect.com" required />
                                <i className="fa-solid fa-user"></i>
                            </div>
                        </div>

                        <div className="field-group slide-element">
                            <div className="label-row">
                                <label>Password</label>
                            </div>
                            <div className="field-wrapper">
                                <input
                                    type={showPasswordLogin ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                />
                                <i
                                    className={`fa-solid ${showPasswordLogin ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                                    onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                                ></i>
                            </div>
                            <div className="input-group" style={{ marginTop: '4px' }}>
                                <button type="button" onClick={() => navigate('/forgot-password')} className="forgot-link text-primary text-xs hover:underline bg-transparent border-none cursor-pointer p-0 ml-auto block">Forgot Password?</button>
                            </div>
                        </div>

                        <div className="field-wrapper slide-element">
                            <button className="submit-button primary" type="submit">
                                Sign In as Customer <i className="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>

                        <div className="divider slide-element">
                            <span>OR CONTINUE WITH</span>
                        </div>

                        <div className="social-buttons slide-element">
                            <button className="social-btn google">
                                <i className="fa-brands fa-google"></i> Google
                            </button>
                            <button className="social-btn apple">
                                <i className="fa-brands fa-apple"></i> Apple
                            </button>
                        </div>

                        <div className="switch-link slide-element">
                            <p>Don't have an account? 
                                <button type="button" className="register-trigger bg-transparent border-none text-primary font-bold cursor-pointer p-0 ml-1 hover:underline" onClick={handleToggle}> Sign up for free</button>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Welcome Back Section */}
                <div className="welcome-section signin">
                    <h2 className="slide-element">WELCOME BACK!</h2>
                </div>

                {/* Register Panel */}
                <div className="credentials-panel signup">
                    <div className="logo-container slide-element">
                        <div className="logo-circle">
                            <img src="/rideconnect_logo.png" alt="RideConnect Logo" />
                            <div className="logo-aura"></div>
                        </div>
                    </div>
                    <h2 className="slide-element">Create Account</h2>
                    <p className="subtitle slide-element">Join the premium ride experience</p>
                    <form action="#!" onSubmit={handleSubmit}>
                        {regStep === 1 && (
                            <>
                                <div className="field-group slide-element">
                                    <label>Name</label>
                                    <div className="field-wrapper">
                                        <input 
                                            type="text" 
                                            placeholder="John Doe"
                                            required 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                        />
                                        <i className="fa-solid fa-user"></i>
                                    </div>
                                </div>

                                <div className="field-group slide-element">
                                    <label>Email</label>
                                    <div className="field-wrapper">
                                        <input 
                                            type="email" 
                                            placeholder="john@example.com"
                                            required 
                                            value={email} 
                                            onChange={(e) => setEmail(e.target.value)} 
                                        />
                                        <i className="fa-solid fa-envelope"></i>
                                    </div>
                                </div>

                                <div className="field-wrapper slide-element">
                                    <button 
                                        className="submit-button primary" 
                                        type="button" 
                                        onClick={handleSendOtp}
                                        disabled={!name || !email}
                                    >
                                        Send OTP <i className="fa-solid fa-paper-plane"></i>
                                    </button>
                                </div>
                            </>
                        )}

                        {regStep === 2 && (
                            <>
                                <div className="field-group slide-element">
                                    <label>Verification Code</label>
                                    <div className="field-wrapper">
                                        <input 
                                            type="text" 
                                            placeholder="123456"
                                            required 
                                            maxLength="6"
                                            value={otp} 
                                            onChange={(e) => setOtp(e.target.value)} 
                                        />
                                        <i className="fa-solid fa-key"></i>
                                    </div>
                                </div>

                                <div className="field-wrapper slide-element">
                                    <button 
                                        className="submit-button primary" 
                                        type="button" 
                                        onClick={handleVerifyOtp}
                                        disabled={otp.length !== 6}
                                    >
                                        Verify OTP <i className="fa-solid fa-check-circle"></i>
                                    </button>
                                </div>
                                <p className="resend-text slide-element">OTP sent to {email}</p>
                            </>
                        )}

                        {regStep === 3 && (
                            <>
                                <div className="field-group slide-element">
                                    <label>Password</label>
                                    <div className="field-wrapper">
                                        <input
                                            type={showPasswordReg ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                validatePasswords(e.target.value, confirmPassword);
                                            }}
                                        />
                                        <i
                                            className={`fa-solid ${showPasswordReg ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                                            onClick={() => setShowPasswordReg(!showPasswordReg)}
                                        ></i>
                                    </div>
                                </div>

                                <div className="field-group slide-element">
                                    <label>Confirm Password</label>
                                    <div className="field-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                validatePasswords(password, e.target.value);
                                            }}
                                        />
                                        <i
                                            className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        ></i>
                                    </div>
                                </div>

                                <div className="validation-panel slide-element">
                                    {password.length > 0 && (
                                        <>
                                            {!errors.length && <p className="invalid">Min 8 chars</p>}
                                            {!errors.uppercase && <p className="invalid">Uppercase</p>}
                                            {!errors.match && <p className="invalid">Match</p>}
                                        </>
                                    )}
                                </div>

                                <div className="field-wrapper slide-element">
                                    <button
                                        className="submit-button primary"
                                        type="submit"
                                        disabled={!Object.values(errors).every(Boolean)}
                                    >
                                        Complete Register <i className="fa-solid fa-user-plus"></i>
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="switch-link slide-element">
                            <p>Already have an account? 
                                <button type="button" className="login-trigger bg-transparent border-none text-primary font-bold cursor-pointer p-0 ml-1 hover:underline" onClick={handleToggle}> Sign In</button>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Welcome Section */}
                <div className="welcome-section signup">
                    <h2 className="slide-element">WELCOME!</h2>
                </div>
            </div>

            <div className="auth-footer">
                <p>Made with ❤️ by <a href="https://linkedin.com/in/prasannakumar-sripadam-9564ab252" target="_blank" rel="noopener noreferrer">Sripadam Prasannakumar</a></p>
            </div>
        </div>
    );
};

export default AuthForm;
