import { useState, useEffect, useCallback, useRef } from 'react';
import { speechFriendly } from '../utils/speechPhrasing';

/**
 * Enhanced Voice Over Hook - Provides text-to-speech functionality
 * for accessibility and user preference
 *
 * DELIVERY
 * Two things made the old output sound robotic, and both are handled here
 * rather than at every call site:
 *
 *   • PACE. Rate 1.0 with pitch 1.0 is the synthesiser's flattest setting.
 *     Easing the rate slightly below 1 and lifting the pitch a little reads as
 *     warmer and, more importantly, gives a child time to follow a word they
 *     have never heard. The defaults below do that; a learner who wants it
 *     faster still can change it in voice settings.
 *   • PHRASING. Every utterance now goes through `speechFriendly()`, which
 *     spells small numbers out ("five points", not "5 points" — voices clip
 *     straight through digits), turns dashes into commas so the voice breathes,
 *     and strips emoji and markdown that otherwise get read out character by
 *     character.
 *
 * Long text is also split into sentences and queued, because a synthesiser
 * given one long string runs the whole thing at a single flat contour.
 */

const VOICE_STORAGE_KEY = "stellar_voice_settings";

/**
 * Defaults tuned for a child learning to read, not for the fastest possible
 * playback. Saved settings always win over these.
 */
const DEFAULT_SETTINGS = {
  enabled: true,
  autoPlay: true,
  speed: 0.92,
  pitch: 1.06,
  volume: 0.9
};

/** Break text at sentence ends so each clause gets its own intonation. */
const splitIntoClauses = (text) =>
  String(text)
    .split(/(?<=[.!?؟])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

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
  return { ...DEFAULT_SETTINGS };
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

    // `speechFriendly` replaces the hand-rolled emoji/markdown strip that used
    // to live here. It covers the same ground and also spells out numbers and
    // converts dashes to pauses — see src/utils/speechPhrasing.js.
    const cleanText = speechFriendly(nextText, language);

    // Nothing left to say once the decoration is stripped (e.g. the text was
    // only an emoji). Move straight on rather than queueing a silent utterance,
    // which some browsers never fire `onend` for.
    if (!cleanText) {
      isProcessingRef.current = false;
      setTimeout(() => processQueue(), 0);
      return;
    }

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
      // "interrupted"/"canceled" happen whenever newer speech replaces older speech,
      // and "not-allowed" when the browser blocks audio before the first tap —
      // all expected, so they aren't reported as errors.
      if (!['interrupted', 'canceled', 'not-allowed'].includes(event.error)) {
        console.error('Speech synthesis error:', event.error);
      }
      setIsSpeaking(false);
      isProcessingRef.current = false;
      onError?.(event.error);
      // Process next in queue even on error
      setTimeout(() => processQueue(), 100);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, settings, language, onStart, onEnd, onError]);

  // Stop speaking. Declared before `speak`, which lists it as a dependency —
  // a `const` in a dependency array is read during render, so the other order
  // would throw before initialisation.
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      queueRef.current = [];
      isProcessingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  // Speak function - main API
  //
  // Longer text is queued one sentence at a time rather than handed over as a
  // single utterance: a synthesiser reads one long string on a single flat
  // contour, where separate utterances each get their own rise and fall. Short
  // text (a word, a letter name) is left whole — splitting it would only
  // insert a pause where none belongs.
  const speak = useCallback((text, immediate = false) => {
    if (!text || !settings.enabled || !window.speechSynthesis) {
      return;
    }

    const clauses = String(text).length > 80 ? splitIntoClauses(text) : [String(text)];

    if (immediate) {
      // Stop current speech and clear queue
      stop();
      queueRef.current = clauses;
      processQueue();
    } else {
      // Add to queue
      queueRef.current.push(...clauses);
      processQueue();
    }
  }, [settings.enabled, processQueue, stop]);

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
