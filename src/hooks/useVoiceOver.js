import { useState, useEffect, useCallback, useRef } from 'react';
import { speechFriendly } from '../utils/speechPhrasing';
import { COMFORT_CHANGED_EVENT } from '../utils/comfortSettings';

/**
 * Voice Over hook - gives every screen text-to-speech
 *
 * HOW IT SOUNDS
 * Two things made the old voice sound robotic, and both are fixed here
 * instead of in every single screen:
 *
 *   1. SPEED. Rate 1.0 and pitch 1.0 is the flattest the browser voice
 *      gets. Slowing it down a little and lifting the pitch a little sounds
 *      warmer and gives a child time to follow a word they have never heard
 *      before. The defaults below do that. A learner who wants it faster
 *      can still change it in the voice settings.
 *   2. WORDING. Everything goes through speechFriendly() first, which
 *      spells small numbers out ("five points" instead of "5 points"),
 *      turns dashes into commas so the voice pauses, and removes emoji and
 *      markdown that would otherwise get read out letter by letter.
 *
 * Long text is also split into sentences and queued one by one, because
 * if you give the browser one long string it reads the whole thing in
 * one flat tone. Short text like a single letter is left as it is.
 *
 */

const VOICE_STORAGE_KEY = "stellar_voice_settings";

/**
 * Default settings chosen for a child learning to read, not for the fastest
 * playback. If the user has saved their own settings those are used instead.
 */
const DEFAULT_SETTINGS = {
  enabled: true,
  autoPlay: true,
  speed: 0.92,
  pitch: 1.06,
  volume: 0.9
};

/** Split text at the end of each sentence so each one gets its own rise and fall. */
const splitIntoClauses = (text) =>
  String(text)
    .split(/(?<=[.!?؟])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

// Find the most natural sounding voices for Arabic and English
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

  // First try: look for the voices in the list above
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

  // Second try: if none of them exist, take any voice in the right language
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

    // I use addEventListener instead of setting onvoiceschanged directly.
    // Every screen has its own copy of this hook, so setting the property
    // meant each new screen replaced the last one's handler, and when a
    // screen closed it set it to null for everyone. Voices that loaded late
    // then never reached the screens that were still waiting for them.
    const synth = window.speechSynthesis;
    if (synth && typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', loadVoices);
      return () => synth.removeEventListener('voiceschanged', loadVoices);
    }
    return undefined;
  }, [language, selectedVoice]);

  // Keep in sync with the Comfort panel: its read-aloud switch writes to the
  // same storage key this hook reads from.
  useEffect(() => {
    const sync = () => setSettings(loadVoiceSettings());
    window.addEventListener(COMFORT_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COMFORT_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

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

  // Take the next item off the queue and speak it
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

    // speechFriendly replaces the emoji and markdown stripping that used to
    // be written out here. It does the same job and also spells out numbers
    // and turns dashes into pauses (see src/utils/speechPhrasing.js).
    const cleanText = speechFriendly(nextText, language);

    // If nothing is left after cleaning (for example the text was only an
    // emoji) move on to the next item. Some browsers never fire onend for an
    // empty utterance, so queueing it would get the queue stuck.
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
      // "interrupted" and "canceled" happen whenever new speech replaces old
      // speech, and "not-allowed" when the browser blocks audio before the
      // first tap. These are all normal so they are not reported as errors.
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

  // Stop speaking. This has to be declared before speak() because speak()
  // lists it as a dependency, and a const used before it is declared would
  // crash on the first render.
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      queueRef.current = [];
      isProcessingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  // speak() - the main function the screens call
  //
  // Long text is queued one sentence at a time instead of being sent as one
  // big utterance, because the browser reads one long string in a single
  // flat tone, while separate sentences each get their own rise and fall.
  // Short text (a word or a letter name) is left whole, since splitting it
  // would only add a pause where there should not be one.
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

  // Only speak if auto-play is turned on
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
