/**
 * Voice Service for Ride Connect
 * Handles Text-to-Speech (TTS) and Speech-to-Text (STT) 
 * using native Web Speech APIs.
 */

const VoiceService = {
    synth: typeof window !== 'undefined' ? window.speechSynthesis : null,
    recognition: null,
    isListening: false,

    /**
     * Initialize Speech Recognition
     */
    initRecognition: (onResult, onEnd, onError) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser.");
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            if (onResult) onResult(transcript, event.results[0].isFinal);
        };

        recognition.onend = () => {
            VoiceService.isListening = false;
            if (onEnd) onEnd();
        };

        recognition.onerror = (event) => {
            VoiceService.isListening = false;
            if (onError) onError(event.error);
        };

        VoiceService.recognition = recognition;
        return recognition;
    },

    startListening: () => {
        if (VoiceService.recognition && !VoiceService.isListening) {
            try {
                VoiceService.recognition.start();
                VoiceService.isListening = true;
                console.log("[VoiceService] Started listening...");
            } catch (e) {
                console.error("[VoiceService] Recognition start error:", e);
            }
        }
    },

    stopListening: () => {
        if (VoiceService.recognition && VoiceService.isListening) {
            VoiceService.recognition.stop();
            VoiceService.isListening = false;
            console.log("[VoiceService] Stopped listening.");
        }
    },

    /**
     * Convert text to speech with high-quality settings
     * Optimized for "Metro Station" style clarity
     */
    speak: (text, options = {}) => {
        if (!VoiceService.synth) {
            console.warn("Speech Synthesis not supported in this browser.");
            return;
        }

        // Respect mute settings
        const savedPreference = localStorage.getItem('voice_enabled');
        const voiceEnabled = savedPreference !== null ? JSON.parse(savedPreference) : true;
        if (!voiceEnabled) {
            console.log(`[VoiceService] Muted by user. Suppressed speech: "${text}"`);
            return;
        }

        const {
            lang = 'en-IN',
            rate = 0.85, // Slower for clarity, metro-style
            pitch = 1,
            volume = 1,
            onEnd = null
        } = options;

        // Cancel any ongoing speech
        VoiceService.synth.cancel();

        // Add slight pauses for better clarity by manipulating text
        // Replacing commas and periods with commas plus a space ensures natural breaks
        const naturalText = text.replace(/,/g, ', ').replace(/\./g, '.  ');
        
        const utterance = new SpeechSynthesisUtterance(naturalText);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        if (onEnd) utterance.onend = onEnd;

        // Optimized Voice Selection
        const voices = VoiceService.synth.getVoices();
        if (voices.length > 0) {
            // Priority: 1. Google UK English Female (clear professional), 2. Google US English, 3. Native Female, 4. Any English
            const premiumVoices = [
                'Google UK English Female',
                'Google US English',
                'Microsoft Zira',
                'Samantha',
                'Victoria'
            ];

            let selectedVoice = null;
            
            // Try to find a premium voice
            for (const name of premiumVoices) {
                selectedVoice = voices.find(v => v.name.includes(name));
                if (selectedVoice) break;
            }

            // Fallback to lang matching if no premium found
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang === lang) || 
                                voices.find(v => v.lang.startsWith('en'));
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        VoiceService.synth.speak(utterance);
        console.log(`[VoiceService] Speaking: "${naturalText}"`);
    },

    /**
     * Stop all current and pending speech
     */
    cancel: () => {
        if (VoiceService.synth) {
            VoiceService.synth.cancel();
        }
    }
};

export default VoiceService;
