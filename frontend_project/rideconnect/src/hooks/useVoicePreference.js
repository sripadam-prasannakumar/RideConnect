import { useState, useEffect } from 'react';

/**
 * Hook to manage voice preference (muted/unmuted)
 */
const useVoicePreference = () => {
    const [voiceEnabled, setVoiceEnabled] = useState(() => {
        const saved = localStorage.getItem('voice_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('voice_enabled', JSON.stringify(voiceEnabled));
    }, [voiceEnabled]);

    const toggleVoice = () => setVoiceEnabled(prev => !prev);

    return [voiceEnabled, toggleVoice];
};

export default useVoicePreference;
