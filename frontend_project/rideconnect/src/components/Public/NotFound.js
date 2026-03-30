import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark text-slate-100 font-display">
            <h1 className="text-9xl font-black text-primary/20">404</h1>
            <p className="text-xl font-bold mt-4">Screen not found in the new UI system.</p>
            <button
                onClick={() => navigate('/')}
                className="mt-8 px-8 py-4 bg-primary text-background-dark font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
            >
                Back to Welcome
            </button>
        </div>
    );
};

export default NotFound;
