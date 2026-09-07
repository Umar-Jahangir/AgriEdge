import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { translations, type Language, type Translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
  speakText: (text: string, langOverride?: Language) => Promise<void>;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  elevenLabsApiKey: string;
  setElevenLabsApiKey: (key: string) => void;
  audioEngine: 'elevenlabs' | 'webspeech';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('agriedge_lang');
    if (saved === 'en' || saved === 'hi' || saved === 'mr') {
      return saved;
    }
    return 'en';
  });

  const [elevenLabsApiKey, setElevenLabsApiKeyState] = useState<string>(() => {
    return localStorage.getItem('agriedge_elevenlabs_key') || '';
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEngine, setAudioEngine] = useState<'elevenlabs' | 'webspeech'>('webspeech');
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('agriedge_lang', language);
  }, [language]);

  const setElevenLabsApiKey = (key: string) => {
    setElevenLabsApiKeyState(key);
    localStorage.setItem('agriedge_elevenlabs_key', key);
  };

  const setLanguage = (lang: Language) => {
    stopSpeaking();
    setLanguageState(lang);
  };

  const t = (key: keyof Translations): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || String(key);
  };

  const stopSpeaking = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakText = async (text: string, langOverride?: Language): Promise<void> => {
    stopSpeaking();
    const targetLang = langOverride || language;

    // 1. Attempt ElevenLabs Multilingual V2 (via backend proxy or direct key)
    try {
      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: targetLang,
          api_key: elevenLabsApiKey || undefined,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('audio/mpeg')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;
        setAudioEngine('elevenlabs');
        setIsSpeaking(true);

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('ElevenLabs API unavailable or unconfigured, falling back to local speech synthesis', e);
    }

    // 2. Offline / Local Fallback via Native Web Speech Synthesis
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    setAudioEngine('webspeech');
    const utterance = new SpeechSynthesisUtterance(text);

    // Set voice locale
    if (targetLang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (targetLang === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        speakText,
        isSpeaking,
        stopSpeaking,
        elevenLabsApiKey,
        setElevenLabsApiKey,
        audioEngine,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
