import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Menu, X } from 'lucide-react';
import Button from './Button';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <nav className="navbar glass">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <Car className="logo-icon" size={24} />
                    <span className="logo-text">Ride<span className="text-gradient">Connect</span></span>
                </Link>

                {/* Desktop Menu */}
                <div className="navbar-links">
                    <Link to="/" className="nav-link" onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}>How it Works</Link>
                    <Link to="/login" className="nav-link">Customer</Link>
                    <Link to="/login" className="nav-link">Driver</Link>
                    <Link to="/login"><Button variant="glass" size="md">Login</Button></Link>
                    <Link to="/register"><Button variant="primary" size="md">Get Started</Button></Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mobile-menu glass"
                >
                    <Link to="/about" className="nav-link" onClick={() => setIsOpen(false)}>About</Link>
                    <Link to="/services" className="nav-link" onClick={() => setIsOpen(false)}>Services</Link>
                    <Link to="/driver/register" className="nav-link" onClick={() => setIsOpen(false)}>Drive with Us</Link>
                    <div className="mobile-actions">
                        <Link to="/login" className="w-full" onClick={() => setIsOpen(false)}><Button variant="secondary" className="w-full">Login</Button></Link>
                        <Link to="/register" className="w-full" onClick={() => setIsOpen(false)}><Button variant="primary" className="w-full">Get Started</Button></Link>
                    </div>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;
