/**
 * Voice Service for Ride Connect
 * Handles Text-to-Speech (TTS) using the native window.speechSynthesis API.
 */

const VoiceService = {
    synth: window.speechSynthesis,
    
    /**
     * Convert text to speech
     * @param {string} text - The text to speak
     * @param {string} lang - Language code (default: 'en-IN')
     * @param {number} rate - Speed of speech (0.1 to 10)
     */
    speak: (text, lang = 'en-IN', rate = 0.9) => {
        if (!VoiceService.synth) {
            console.warn("Speech Synthesis not supported in this browser.");
            return;
        }

        // Cancel any ongoing speech
        VoiceService.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Chrome bug: sometimes voices aren't loaded immediately
        const voices = VoiceService.synth.getVoices();
        if (voices.length > 0) {
            // Find a suitable voice for the language
            const matchedVoice = voices.find(v => v.lang === lang) || 
                                 voices.find(v => v.lang.startsWith(lang.split('-')[0]));
            if (matchedVoice) {
                utterance.voice = matchedVoice;
            }
        }

        VoiceService.synth.speak(utterance);

        // Debugging
        console.log(`[VoiceService] Speaking: "${text}" (${lang})`);
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
