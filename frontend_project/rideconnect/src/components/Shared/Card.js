import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

const Card = ({ children, className = '', animate = true, delay = 0 }) => {
    return (
        <motion.div
            initial={animate ? { opacity: 0, y: 20 } : false}
            animate={animate ? { opacity: 1, y: 0 } : false}
            transition={{ duration: 0.5, delay: delay }}
            className={`glass-card-container ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default Card;
