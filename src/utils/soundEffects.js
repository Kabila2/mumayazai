/**
 * Sound Effects System
 * Provides audio feedback for user interactions
 */

const SOUND_ENABLED_KEY = 'mumayaz_sounds_enabled';

// Check if sounds are enabled
export const areSoundsEnabled = () => {
  const saved = localStorage.getItem(SOUND_ENABLED_KEY);
  return saved === null ? true : saved === 'true'; // Default to enabled
};

// Toggle sound effects
export const toggleSounds = () => {
  const current = areSoundsEnabled();
  localStorage.setItem(SOUND_ENABLED_KEY, (!current).toString());
  return !current;
};

// Web Audio API context
let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Play a tone
const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
  if (!areSoundsEnabled()) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = volume;

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    console.warn('Sound playback failed:', error);
  }
};

// Play a chord
const playChord = (frequencies, duration, volume = 0.2) => {
  if (!areSoundsEnabled()) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    frequencies.forEach(freq => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.value = volume;

      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    });
  } catch (error) {
    console.warn('Chord playback failed:', error);
  }
};

// Play ascending tones
const playAscending = (startFreq, steps, duration) => {
  if (!areSoundsEnabled()) return;

  try {
    const ctx = getAudioContext();
    const stepDuration = duration / steps;

    for (let i = 0; i < steps; i++) {
      const freq = startFreq * Math.pow(1.2, i);
      const startTime = ctx.currentTime + (i * stepDuration);

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.15;

      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + stepDuration);

      oscillator.start(startTime);
      oscillator.stop(startTime + stepDuration);
    }
  } catch (error) {
    console.warn('Ascending sound failed:', error);
  }
};

/**
 * Sound Effect Functions
 */

// Correct answer sound - cheerful ascending tones
export const playCorrectSound = () => {
  playAscending(523, 4, 0.4); // C5, 4 steps
  if (navigator.vibrate) {
    navigator.vibrate([50, 50, 50]);
  }
};

// Wrong answer sound - descending tone
export const playWrongSound = () => {
  playTone(200, 0.3, 'sawtooth', 0.2);
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
};

// Click/tap sound - short click
export const playClickSound = () => {
  playTone(800, 0.05, 'sine', 0.1);
};

// Achievement unlocked - triumphant chord
export const playAchievementSound = () => {
  playChord([523, 659, 784, 1047], 0.8, 0.25); // C major chord
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200]);
  }
};

// Level up sound - ascending melody
export const playLevelUpSound = () => {
  const notes = [523, 587, 659, 784, 880, 1047]; // C D E G A C
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'triangle', 0.2), i * 80);
  });
  if (navigator.vibrate) {
    navigator.vibrate([50, 30, 50, 30, 50, 30, 100]);
  }
};

// Message received sound - gentle notification
export const playMessageSound = () => {
  playChord([659, 784], 0.3, 0.15);
  if (navigator.vibrate) {
    navigator.vibrate([30, 20, 30]);
  }
};

// Button hover sound - subtle tone
export const playHoverSound = () => {
  playTone(600, 0.03, 'sine', 0.05);
};

// Success sound - positive feedback
export const playSuccessSound = () => {
  playChord([659, 784, 988], 0.5, 0.2);
  if (navigator.vibrate) {
    navigator.vibrate([50, 50, 100]);
  }
};

// Error sound - negative feedback
export const playErrorSound = () => {
  playTone(150, 0.4, 'square', 0.2);
  if (navigator.vibrate) {
    navigator.vibrate([200]);
  }
};

// Coin/points earned sound - satisfying ding
export const playPointsSound = () => {
  setTimeout(() => playTone(1047, 0.1, 'sine', 0.2), 0);
  setTimeout(() => playTone(1319, 0.15, 'sine', 0.15), 100);
  if (navigator.vibrate) {
    navigator.vibrate([40, 20, 60]);
  }
};

// Quiz start sound
export const playQuizStartSound = () => {
  playTone(440, 0.2, 'triangle', 0.2);
  setTimeout(() => playTone(554, 0.2, 'triangle', 0.2), 150);
};

// Quiz complete sound
export const playQuizCompleteSound = () => {
  playAscending(440, 6, 0.6);
  if (navigator.vibrate) {
    navigator.vibrate([50, 30, 50, 30, 50, 30, 150]);
  }
};

// Streak milestone sound - celebratory
export const playStreakSound = () => {
  const melody = [523, 659, 784, 1047, 784, 1047, 1319];
  melody.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, 'sine', 0.18), i * 90);
  });
  if (navigator.vibrate) {
    navigator.vibrate([40, 20, 40, 20, 40, 20, 40, 20, 100]);
  }
};

// Card flip sound
export const playCardFlipSound = () => {
  playTone(700, 0.08, 'square', 0.12);
};

// Whoosh sound - for transitions
export const playWhooshSound = () => {
  if (!areSoundsEnabled()) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } catch (error) {
    console.warn('Whoosh sound failed:', error);
  }
};

// Pop sound - for modals/popups
export const playPopSound = () => {
  playTone(880, 0.08, 'sine', 0.15);
};

// Soft click - for subtle interactions
export const playSoftClickSound = () => {
  playTone(600, 0.03, 'sine', 0.08);
};

/**
 * Play sound by name (useful for dynamic sound selection)
 */
export const playSound = (soundName) => {
  const soundMap = {
    correct: playCorrectSound,
    wrong: playWrongSound,
    click: playClickSound,
    achievement: playAchievementSound,
    levelUp: playLevelUpSound,
    message: playMessageSound,
    hover: playHoverSound,
    success: playSuccessSound,
    error: playErrorSound,
    points: playPointsSound,
    quizStart: playQuizStartSound,
    quizComplete: playQuizCompleteSound,
    streak: playStreakSound,
    cardFlip: playCardFlipSound,
    whoosh: playWhooshSound,
    pop: playPopSound,
    softClick: playSoftClickSound
  };

  const soundFunc = soundMap[soundName];
  if (soundFunc) {
    soundFunc();
  } else {
    console.warn(`Sound "${soundName}" not found`);
  }
};

export default {
  areSoundsEnabled,
  toggleSounds,
  playCorrectSound,
  playWrongSound,
  playClickSound,
  playAchievementSound,
  playLevelUpSound,
  playMessageSound,
  playHoverSound,
  playSuccessSound,
  playErrorSound,
  playPointsSound,
  playQuizStartSound,
  playQuizCompleteSound,
  playStreakSound,
  playCardFlipSound,
  playWhooshSound,
  playPopSound,
  playSoftClickSound,
  playSound
};
