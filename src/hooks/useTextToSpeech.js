import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../store/LanguageContext';
import { usePreferences } from '../store/PreferencesContext';

/**
 * Universal Bilingual Web Speech Synthesis Hook
 * Supports English and Malayalam audio narration for hands-free kitchen operations and low-vision access.
 */
export function useTextToSpeech() {
  const { language } = useLanguage();
  const { preferences } = usePreferences();
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const cancel = useCallback(() => {
    if (isSupported && typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const speak = useCallback(
    (text, targetLang = 'auto') => {
      if (!isSupported || !text) return;

      cancel();

      const langCode =
        targetLang === 'auto'
          ? language === 'ml'
            ? 'ml-IN'
            : 'en-US'
          : targetLang;

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      utterance.lang = langCode;
      utterance.rate = preferences.voiceRate || 1.0;
      utterance.pitch = 1.0;
      utterance.volume = typeof preferences.soundVolume === 'number' ? preferences.soundVolume : 0.9;

      // Select matching voice if available
      const matchingVoice = voices.find(
        (v) => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2))
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, language, preferences.voiceRate, preferences.soundVolume, voices, cancel]
  );

  return {
    isSupported,
    isSpeaking,
    speak,
    cancel,
    voices,
  };
}

export default useTextToSpeech;
