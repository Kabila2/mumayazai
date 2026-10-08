// src/utils/comfortSettings.js — One place for the learner's sensory settings
//
// WHY THIS EXISTS
// The app already had switches for sound effects, read-aloud and reduced
// motion, but each lived in its own key, was read by a different component,
// and two of them (SoundToggle, VoiceOverControl) were never rendered anywhere
// at all. A learner with sensory sensitivities — which, for an app built for
// neurodiverse children, is the learner — had no way to make the app quieter.
//
// This file owns every "how much stimulation do I want?" preference:
//
//   sounds             click/success/error tones               (soundEffects.js)
//   readAloud          speech on lessons, quizzes and games     (useVoiceOver.js)
//   reducedMotion      shorter, calmer animations everywhere    (App.css + MotionConfig)
//   readingTint        a coloured overlay that eases visual stress for many
//                      dyslexic readers (Irlen-style tints)
//   quietCelebrations  the "Great job!" popup without confetti or fanfare
//   focusMode          hides the leaderboard and ambient movement on the home
//                      page, so the only thing on screen is the next step
//
// The existing storage keys are kept, so nothing that already reads them
// breaks and an exported data file from before this change still restores.
//
// HOW IT REACHES THE PAGE
// `applyComfort()` writes the visual settings onto <html> as a class and
// `data-stellar-*` attributes — the same mechanism dark mode, high contrast and
// the rewards use — so one call covers every screen, including portals and the
// full-screen chat. Components that need the value in JS subscribe to
// COMFORT_CHANGED_EVENT.

export const COMFORT_CHANGED_EVENT = 'stellar:comfort-changed';

const KEYS = {
  sounds: 'stellar_sounds_enabled',
  voice: 'stellar_voice_settings',
  reducedMotion: 'reduced-motion',
  readingTint: 'stellar_reading_tint',
  quietCelebrations: 'stellar_quiet_celebrations',
  focusMode: 'stellar_focus_mode'
};

export const READING_TINTS = [
  { id: 'none', nameEn: 'Off', nameAr: 'بدون', swatch: 'transparent' },
  { id: 'cream', nameEn: 'Cream', nameAr: 'كريمي', swatch: '#fff3c4' },
  { id: 'peach', nameEn: 'Peach', nameAr: 'خوخي', swatch: '#ffd9c7' },
  { id: 'mint', nameEn: 'Mint', nameAr: 'نعناعي', swatch: '#d2f5e3' },
  { id: 'sky', nameEn: 'Sky', nameAr: 'سماوي', swatch: '#d6e9ff' },
  { id: 'lilac', nameEn: 'Lilac', nameAr: 'ليلكي', swatch: '#e6dcff' }
];

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Storage unavailable — the setting still applies for this session.
  }
};

const readVoiceSettings = () => {
  try {
    return JSON.parse(read(KEYS.voice)) || {};
  } catch (error) {
    return {};
  }
};

/** The OS-level preference, which is honoured even if the in-app switch is off. */
export const systemPrefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Every comfort setting, with its default where nothing is saved. */
export const getComfort = () => {
  const voice = readVoiceSettings();
  return {
    sounds: read(KEYS.sounds) !== 'false',
    readAloud: voice.enabled !== false,
    reducedMotion: read(KEYS.reducedMotion) === 'true',
    readingTint: READING_TINTS.some((t) => t.id === read(KEYS.readingTint))
      ? read(KEYS.readingTint)
      : 'none',
    quietCelebrations: read(KEYS.quietCelebrations) === 'true',
    focusMode: read(KEYS.focusMode) === 'true'
  };
};

/** True when motion should be minimised, for either reason. */
export const shouldReduceMotion = () =>
  getComfort().reducedMotion || systemPrefersReducedMotion();

/**
 * Push the visual settings onto <html>. Safe to call before React mounts, so
 * index.js can apply them before the first paint.
 */
export const applyComfort = (comfort = getComfort()) => {
  if (typeof document === 'undefined') return comfort;
  const root = document.documentElement;

  root.classList.toggle('reduced-motion', !!comfort.reducedMotion);
  root.setAttribute('data-stellar-tint', comfort.readingTint || 'none');
  root.setAttribute('data-stellar-focus', comfort.focusMode ? 'true' : 'false');
  root.setAttribute('data-stellar-quiet', comfort.quietCelebrations ? 'true' : 'false');
  root.setAttribute('data-stellar-sounds', comfort.sounds ? 'true' : 'false');

  return comfort;
};

/**
 * Change one or more settings. Writes them, applies them, and tells every
 * listening component. Returns the full, updated set.
 */
export const setComfort = (patch) => {
  const current = getComfort();
  const next = { ...current, ...patch };

  if ('sounds' in patch) write(KEYS.sounds, String(!!next.sounds));
  if ('reducedMotion' in patch) write(KEYS.reducedMotion, String(!!next.reducedMotion));
  if ('readingTint' in patch) write(KEYS.readingTint, next.readingTint || 'none');
  if ('quietCelebrations' in patch) write(KEYS.quietCelebrations, String(!!next.quietCelebrations));
  if ('focusMode' in patch) write(KEYS.focusMode, String(!!next.focusMode));

  if ('readAloud' in patch) {
    // The voice settings object is owned by useVoiceOver; only its `enabled`
    // flag is a comfort setting, so the rest is preserved untouched.
    const voice = readVoiceSettings();
    write(KEYS.voice, JSON.stringify({ ...voice, enabled: !!next.readAloud }));
  }

  applyComfort(next);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COMFORT_CHANGED_EVENT, { detail: next }));
  }

  return next;
};

/**
 * Turn everything calm on at once — the one-tap answer for a learner who is
 * overwhelmed right now and does not want to work through six switches.
 */
export const setCalmMode = (on = true) =>
  setComfort(
    on
      ? { sounds: false, reducedMotion: true, quietCelebrations: true, focusMode: true }
      : { sounds: true, reducedMotion: false, quietCelebrations: false, focusMode: false }
  );

/** Whether every calm-mode setting is currently on. */
export const isCalmMode = (comfort = getComfort()) =>
  !comfort.sounds && comfort.reducedMotion && comfort.quietCelebrations && comfort.focusMode;

const comfortSettings = {
  COMFORT_CHANGED_EVENT,
  READING_TINTS,
  getComfort,
  setComfort,
  applyComfort,
  setCalmMode,
  isCalmMode,
  shouldReduceMotion,
  systemPrefersReducedMotion
};

export default comfortSettings;
