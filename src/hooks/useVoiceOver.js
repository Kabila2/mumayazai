import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Enhanced Voice Over Hook - Provides text-to-speech functionality
 * for accessibility and user preference
 */

const VOICE_STORAGE_KEY = "mumayaz_voice_settings";

// Get natural voices for Arabic and English
const getNaturalVoices = (language, availableVoices) => {
  if (!availableVoices || availableVoices.length === 0) return [];

  const naturalVoices = {
    en: [
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Google UK English Female',
      'Google UK English Male',
      'Google US English',
      'Microsoft Zira Desktop - English (United States)',
      'Alex',
      'Samantha',
      'en-US',
      'en-GB'
    ],
    ar: [
      'Microsoft Salma Online (Natural) - Arabic (Egypt)',
      'Microsoft Shakir Online (Natural) - Arabic (Egypt)',
      'Microsoft Hamed Online (Natural) - Arabic (Saudi Arabia)',
      'Microsoft Zariyah Online (Natural) - Arabic (Saudi Arabia)',
      'Google العربية',
      'Google Arabic',
      'Microsoft Naayf - Arabic (Saudi Arabia)',
      'Microsoft Hoda - Arabic (Egypt)',
      'ar-SA',
      'ar-EG',
      'ar'
    ]
  };

  const preferredNames = naturalVoices[language] || naturalVoices.en;
  const filtered = [];

  // First pass: Find exact matches
  for (const preferredName of preferredNames) {
    const voice = availableVoices.find(v =>
      v.name === preferredName ||
      v.name.includes(preferredName) ||
      preferredName.includes(v.name)
    );
    if (voice && !filtered.find(f => f.name === voice.name)) {
      filtered.push(voice);
    }
  }

  // Second pass: Find by language if no exact matches
  if (filtered.length === 0) {
    const langCode = language === 'ar' ? 'ar' : 'en';
    const langVoices = availableVoices.filter(v => {
      if (!v.lang) return false;
      const lowerLang = v.lang.toLowerCase();

      if (language === 'ar') {
        return lowerLang.startsWith('ar') ||
               lowerLang.includes('arabic') ||
               v.name.toLowerCase().includes('arabic');
      } else {
        return lowerLang.startsWith('en');
      }
    });
    filtered.push(...langVoices);
  }

  return filtered.slice(0, 10);
};

// Load voice settings from localStorage
const loadVoiceSettings = () => {
  try {
    const stored = localStorage.getItem(VOICE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load voice settings:', error);
  }
  return {
    enabled: true,
    autoPlay: true,
    speed: 1.0,
    pitch: 1.0,
    volume: 0.9
  };
};

// Save voice settings to localStorage
const saveVoiceSettings = (settings) => {
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save voice settings:', error);
  }
};

export const useVoiceOver = (language = 'en', options = {}) => {
  const {
    autoPlayEnabled = true,
    onStart = null,
    onEnd = null,
    onError = null
  } = options;

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settings, setSettings] = useState(loadVoiceSettings);
  const utteranceRef = useRef(null);
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices() || [];
      setVoices(availableVoices);

      if (availableVoices.length > 0 && !selectedVoice) {
        const naturalVoices = getNaturalVoices(language, availableVoices);
        if (naturalVoices.length > 0) {
          setSelectedVoice(naturalVoices[0]);
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [language, selectedVoice]);

  // Update selected voice when language changes
  useEffect(() => {
    if (voices.length > 0) {
      const naturalVoices = getNaturalVoices(language, voices);
      if (naturalVoices.length > 0) {
        setSelectedVoice(naturalVoices[0]);
      }
    }
  }, [language, voices]);

  // Save settings when they change
  useEffect(() => {
    saveVoiceSettings(settings);
  }, [settings]);

  // Process voice queue
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const nextText = queueRef.current.shift();

    if (!nextText || !window.speechSynthesis) {
      isProcessingRef.current = false;
      return;
    }

    // Clean text for better speech
    const cleanText = nextText
      .replace(/[🎙️📱⚙️🔊🎯✨💬📋🗑️💾🧭🏆🎨📊🎮📚🌟⭐]/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\n+/g, '. ')
      .replace(/\. \. +/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Apply settings
    utterance.rate = settings.speed;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';

    // Set voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      isProcessingRef.current = false;
      onEnd?.();
      // Process next in queue
      setTimeout(() => processQueue(), 100);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      isProcessingRef.current = false;
      onError?.(event.error);
      // Process next in queue even on error
      setTimeout(() => processQueue(), 100);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, settings, language, onStart, onEnd, onError]);

  // Speak function - main API
  const speak = useCallback((text, immediate = false) => {
    if (!text || !settings.enabled || !window.speechSynthesis) {
      return;
    }

    if (immediate) {
      // Stop current speech and clear queue
      stop();
      queueRef.current = [text];
      processQueue();
    } else {
      // Add to queue
      queueRef.current.push(text);
      processQueue();
    }
  }, [settings.enabled, processQueue]);

  // Stop speaking
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      queueRef.current = [];
      isProcessingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking]);

  // Resume speaking
  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  // Toggle voice over on/off
  const toggleEnabled = useCallback(() => {
    setSettings(prev => {
      const newSettings = { ...prev, enabled: !prev.enabled };
      if (!newSettings.enabled) {
        stop();
      }
      return newSettings;
    });
  }, [stop]);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Speak with auto-play check
  const speakAuto = useCallback((text, immediate = false) => {
    if (settings.autoPlay && autoPlayEnabled) {
      speak(text, immediate);
    }
  }, [settings.autoPlay, autoPlayEnabled, speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    // State
    isSpeaking,
    isEnabled: settings.enabled,
    voices: getNaturalVoices(language, voices),
    selectedVoice,
    settings,

    // Functions
    speak,
    speakAuto,
    stop,
    pause,
    resume,
    toggleEnabled,
    updateSettings,
    setSelectedVoice
  };
};

export default useVoiceOver;
