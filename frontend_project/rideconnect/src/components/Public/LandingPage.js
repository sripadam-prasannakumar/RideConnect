import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, MapPin, Star, UserPlus, Car, CheckCircle, Zap } from 'lucide-react';
import Button from '../Shared/Button';
import Card from '../Shared/Card';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    const scrollToFeatures = () => {
        const element = document.getElementById('how-it-works');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const instructionSteps = [
        {
            icon: <UserPlus />,
            title: "Register",
            description: "Create your account with email OTP verification for top-tier security."
        },
        {
            icon: <Car />,
            title: "Set Location",
            description: "Choose your pickup and destination on our interactive map."
        },
        {
            icon: <Zap />,
            title: "Connect",
            description: "instantly match with a professional, verified driver near you."
        },
        {
            icon: <CheckCircle />,
            title: "Ride & Enjoy",
            description: "Transparent pricing, live tracking, and premium comfort."
        }
    ];

    return (
        <div className="landing-page">

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="hero-title"
                    >
                        Your Premium <br />
                        <span className="text-gradient">Ride Connection</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="hero-subtitle"
                    >
                        Experience luxury travel at your fingertips. Professional drivers,
                        premium vehicles, and seamless booking for your every journey.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="hero-actions"
                    >
                        <Button size="lg" onClick={() => navigate('/register')}>Get Started Now</Button>
                        <Button variant="secondary" size="lg" onClick={scrollToFeatures}>How it Works</Button>
                    </motion.div>
                </div>

                <div className="hero-visual">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="glow-shape glow-1"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            rotate: [0, -90, 0],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="glow-shape glow-2"
                    />
                </div>
            </section>

            {/* How it Works Section */}
            <section className="how-it-works" id="how-it-works">
                <div className="container mx-auto">
                    <h2 className="section-title text-center">How to Use <span className="text-gradient">RideConnect</span></h2>
                    <p className="text-center text-muted mb-12 max-w-2xl mx-auto">
                        Getting from A to B has never been this seamless. Follow these simple steps
                        to experience the future of urban mobility.
                    </p>

                    <div className="steps-grid">
                        {instructionSteps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15 }}
                                viewport={{ once: true }}
                                className="step-card-premium"
                            >
                                <div className="step-header">
                                    <div className="step-icon-wrapper">{step.icon}</div>
                                </div>
                                <div className="step-body">
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center mt-16"
                    >
                        <Button size="lg" onClick={() => navigate('/register')}>
                            Ready to Join? Register Now
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features-section">
                <h2 className="section-title text-center">Why Choose <span className="text-gradient">RideConnect</span></h2>
                <div className="features-grid">
                    <Card delay={0.1}>
                        <div className="feature-icon"><Shield size={32} /></div>
                        <h3>Safety First</h3>
                        <p>Every driver is verified and every ride is tracked in real-time for your security.</p>
                    </Card>
                    <Card delay={0.2}>
                        <div className="feature-icon"><Clock size={32} /></div>
                        <h3>Always On Time</h3>
                        <p>Our intelligent routing ensuring your driver arrives within minutes of your request.</p>
                    </Card>
                    <Card delay={0.3}>
                        <div className="feature-icon"><MapPin size={32} /></div>
                        <h3>Wide Coverage</h3>
                        <p>From city centers to rural areas, we've got you covered where ever you go.</p>
                    </Card>
                    <Card delay={0.4}>
                        <div className="feature-icon"><Star size={32} /></div>
                        <h3>Premium Fleet</h3>
                        <p>Choose from a variety of luxury vehicles tailored to your comfort and style.</p>
                    </Card>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
