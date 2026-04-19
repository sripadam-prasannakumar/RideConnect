import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceService from '../../utils/voiceService';

const VoiceAssistant = ({ onCommand, placeholder = "Speak now..." }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        // Initialize recognition on mount
        VoiceService.initRecognition(
            (text, isFinal) => {
                setTranscript(text);
                if (isFinal) {
                    setIsListening(false);
                    handleVoiceCommand(text);
                }
            },
            () => setIsListening(false),
            (error) => {
                console.error("Speech Recognition Error:", error);
                setIsListening(false);
            }
        );

        return () => {
            VoiceService.stopListening();
        };
    }, []);

    const handleVoiceCommand = (text) => {
        setIsThinking(true);
        // Simulate a brief delay for "processing"
        setTimeout(() => {
            if (onCommand) onCommand(text);
            setIsThinking(false);
            setTranscript('');
        }, 500);
    };

    const toggleListening = () => {
        if (isListening) {
            VoiceService.stopListening();
            setIsListening(false);
        } else {
            setTranscript('');
            VoiceService.startListening();
            setIsListening(true);
        }
    };

    return (
        <div className="relative flex flex-col items-center gap-4">
            <AnimatePresence>
                {isListening && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full mb-6 w-64 p-4 bg-background-dark/90 backdrop-blur-xl border border-primary/30 rounded-3xl shadow-2xl z-50 text-center"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex gap-1 justify-center items-end h-6">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [8, 24, 12, 20, 8] }}
                                        transition={{ 
                                            repeat: Infinity, 
                                            duration: 0.8, 
                                            delay: i * 0.1,
                                            ease: "easeInOut"
                                        }}
                                        className="w-1.5 bg-primary rounded-full"
                                    />
                                ))}
                            </div>
                            <p className="text-white font-bold text-sm">
                                {transcript || placeholder}
                            </p>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background-dark/90 border-r border-b border-primary/30 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={toggleListening}
                className={`relative group flex items-center justify-center size-14 rounded-full transition-all duration-500 overflow-hidden ${
                    isListening 
                    ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                    : 'bg-primary shadow-[0_0_20px_rgba(13,204,242,0.3)] hover:scale-110 active:scale-95'
                }`}
            >
                {/* Ripple Effect */}
                {isListening && (
                    <>
                        <motion.div 
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 bg-white rounded-full"
                        />
                        <motion.div 
                            initial={{ scale: 1, opacity: 0.3 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                            className="absolute inset-0 bg-white rounded-full"
                        />
                    </>
                )}
                
                <div className="relative z-10 text-background-dark">
                    {isThinking ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : isListening ? (
                        <MicOff size={24} />
                    ) : (
                        <Mic size={24} />
                    )}
                </div>
            </button>
            
            {!isListening && !isThinking && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                    Tap to speak
                </span>
            )}
        </div>
    );
};

export default VoiceAssistant;
