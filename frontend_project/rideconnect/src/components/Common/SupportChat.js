import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MessageSquare, ChevronRight, HelpCircle, Phone, ThumbsUp, ThumbsDown } from 'lucide-react';

const CUSTOMER_CARE_NUMBER = "6305627782";

const SUPPORT_OPTIONS = [
    {
        id: 'ride_issue',
        label: 'Issue with ride / driver',
        response: 'We apologize for the inconvenience with your ride. Please choose a specific issue:',
        subOptions: [
            { id: 'ride_history', label: 'Ride not showing in history', response: 'Sometimes ride history takes up to 10 minutes to update. If it\'s been longer, please check your network connection.' },
            { id: 'driver_behavior', label: 'Driver behavior issue', response: 'We take safety and professionalism seriously. Please report the specific incident so our safety team can investigate immediately.' },
            { id: 'late_pickup', label: 'Late pickup issue', response: 'Drivers aim for punctuality, but traffic can cause delays. We recommend checking the live tracking for real-time updates.' }
        ]
    },
    {
        id: 'payment_issue',
        label: 'Payment / billing issue',
        response: 'Billing transparency is important to us. Which of these matches your concern?',
        subOptions: [
            { id: 'wrong_charge', label: 'Wrong amount charged', response: 'Extra charges are often due to wait times or route deviations. You can review the fare breakdown in your ride receipt.' },
            { id: 'refund_status', label: 'Refund status', response: 'Refunds typically process within 5-7 business days depending on your bank. Check your bank statement for "RideConnect Pay".' },
            { id: 'promo_issue', label: 'Promo code not applied', response: 'Ensure the promo was applied BEFORE starting the ride. Most promos have a flight-time or destination restriction.' }
        ]
    },
    {
        id: 'account_issue',
        label: 'Account related issue',
        response: 'Let\'s get your account sorted. What do you need help with?',
        subOptions: [
            { id: 'verification', label: 'Verification pending', response: 'The verification process takes 24-48 hours. Please ensure your documents are clear and valid.' },
            { id: 'car_details', label: 'Car details update', response: 'You can update your vehicle info in the Profile section. New vehicles will require fresh document verification.' },
            { id: 'delete_account', label: 'Delete account', response: 'We\'re sorry to see you go. Account deletion can be initiated from Settings, but it is irreversible.' }
        ]
    },
    {
        id: 'safety_concern',
        label: 'Safety concern',
        response: 'Your safety is our #1 priority. Please specify:',
        subOptions: [
            { id: 'emergency', label: 'Emergency assistance', response: 'If this is a life-threatening emergency, please call 112 immediately. Otherwise, share the incident details here.' },
            { id: 'report_incident', label: 'Report an incident', response: 'Please describe the incident in detail. Our 24/7 safety response team will call you within 15 minutes.' }
        ]
    }
];

const SupportChat = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Hi, we’re here to help you.', timestamp: new Date() },
        { id: 2, type: 'bot', text: 'Select one of the options below or type your query', timestamp: new Date(), isOptions: true }
    ]);
    const [input, setInput] = useState('');
    const [currentOptions, setCurrentOptions] = useState(SUPPORT_OPTIONS);
    const [showOptions, setShowOptions] = useState(true);
    const [interactionCount, setInteractionCount] = useState(0);
    const [showResolutionCheck, setShowResolutionCheck] = useState(false);
    const [isResolved, setIsResolved] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const addMessage = (text, type = 'user', extra = {}) => {
        const newMessage = {
            id: Date.now(),
            type,
            text,
            timestamp: new Date(),
            ...extra
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleCallNow = () => {
        window.location.href = `tel:${CUSTOMER_CARE_NUMBER}`;
    };

    const suggestCustomerCare = (customIntro = "") => {
        const intro = customIntro || "We’re unable to fully resolve your issue via chat.";
        addMessage(`${intro} Please connect with our customer care for further assistance.`, 'bot');
        setTimeout(() => {
            addMessage(`📞 ${CUSTOMER_CARE_NUMBER}`, 'bot', { isContact: true });
        }, 600);
    };

    const handleOptionSelect = (option) => {
        addMessage(option.label, 'user');
        setShowOptions(false);
        setInteractionCount(prev => prev + 1);

        setTimeout(() => {
            if (option.subOptions) {
                addMessage(option.response || 'Pick a suitable option to proceed', 'bot', { isOptions: true });
                setCurrentOptions(option.subOptions);
                setShowOptions(true);
            } else {
                addMessage(option.response || "I hope this information helps solve your query.", 'bot');
                
                setTimeout(() => {
                    setShowResolutionCheck(true);
                    addMessage("Was this helpful?", "bot", { isResolutionCheck: true });
                }, 1000);
            }
        }, 600);
    };

    const handleResolution = (resolved) => {
        setIsResolved(resolved);
        setShowResolutionCheck(false);
        addMessage(resolved ? "Yes, it helped" : "No, not resolved", "user");

        setTimeout(() => {
            if (resolved) {
                addMessage("Great! I'm glad I could help. Wish you a safe ride with RideConnect!", "bot");
                setTimeout(() => {
                    addMessage("Anything else you'd like to check?", "bot", { isOptions: true });
                    setCurrentOptions(SUPPORT_OPTIONS);
                    setShowOptions(true);
                }, 1500);
            } else {
                suggestCustomerCare();
            }
        }, 800);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        addMessage(input, 'user');
        const userQuery = input.toLowerCase();
        setInput('');
        setShowOptions(false);
        setShowResolutionCheck(false);
        setInteractionCount(prev => prev + 1);

        setTimeout(() => {
            if (userQuery.includes("cancel") || userQuery.includes("refund")) {
                addMessage("I see you're asking about cancellations or refunds. These are usually processed automatically, but for complex cases, personal assistance is better.", "bot");
            } else {
                addMessage("I've noted your query. I'm processing the best way to assist you.", "bot");
            }
            
            setTimeout(() => {
                if (interactionCount >= 2 || userQuery.length > 50) {
                    suggestCustomerCare("This seems like it might need personal attention.");
                } else {
                    addMessage("Until then, you can try these standard categories:", "bot", { isOptions: true });
                    setCurrentOptions(SUPPORT_OPTIONS);
                    setShowOptions(true);
                }
            }, 1200);
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[calc(100%-2rem)] md:w-[420px] h-[650px] max-h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="bg-primary p-7 flex items-center justify-between shadow-lg relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl font-black"></div>
                            <div className="flex items-center gap-3 relative z-10 font-black">
                                <div className="size-11 bg-background-dark/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-background-dark shadow-sm border border-white/20">
                                    <MessageSquare size={22} strokeWidth={2.5} />
                                </div>
                                <div className="font-black">
                                    <h3 className="text-background-dark font-black text-sm uppercase tracking-wider">Support Chat – 24x7 Help</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <p className="text-background-dark/70 text-[9px] font-black uppercase tracking-widest leading-none">Online & Ready</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="size-10 rounded-2xl bg-background-dark/10 hover:bg-background-dark/20 flex items-center justify-center text-background-dark transition-all active:scale-90 relative z-10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-50 dark:bg-slate-950/20">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.type === 'bot' ? -20 : 20, y: 10 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    className={`flex ${msg.type === 'bot' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`flex flex-col ${msg.type === 'bot' ? 'items-start' : 'items-end'} max-w-[88%] space-y-2`}>
                                        <div className={`p-5 rounded-[2rem] text-[13.5px] leading-relaxed shadow-sm ${
                                            msg.type === 'bot' 
                                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800' 
                                                : 'bg-primary text-background-dark rounded-tr-none font-bold shadow-md shadow-primary/10'
                                        }`}>
                                            {msg.text}

                                            {msg.isContact && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                                                    <button 
                                                        onClick={handleCallNow}
                                                        className="w-full h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                                                    >
                                                        <Phone size={16} /> Call Now
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {msg.isResolutionCheck && showResolutionCheck && idx === messages.length - 1 && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleResolution(true)}
                                                    className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all"
                                                >
                                                    <ThumbsUp size={14} /> Yes
                                                </button>
                                                <button 
                                                    onClick={() => handleResolution(false)}
                                                    className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <ThumbsDown size={14} /> No, Not Resolved
                                                </button>
                                            </div>
                                        )}
                                        
                                        {msg.isOptions && showOptions && idx === messages.length - 1 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="w-full flex flex-col gap-2.5"
                                            >
                                                {currentOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleOptionSelect(opt)}
                                                        className="flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-left text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group shadow-sm"
                                                    >
                                                        <span>{opt.label}</span>
                                                        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                        
                                        <span className={`text-[9px] font-black uppercase tracking-widest text-slate-400/80 px-2 leading-none ${
                                            msg.type === 'bot' ? 'text-left' : 'text-right'
                                        }`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Box */}
                        <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                            <form onSubmit={handleSend} className="flex items-center gap-3">
                                <button type="button" className="size-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-all active:scale-90">
                                    <HelpCircle size={20} />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your query here..."
                                        className="w-full h-13 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                        <Mic size={18} />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="size-13 rounded-2.5xl bg-primary text-background-dark flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                                >
                                    <Send size={22} strokeWidth={2.5} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SupportChat;
