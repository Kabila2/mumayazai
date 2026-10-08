// src/utils/rewardsStore.js — Turning points into something you can use
//
// WHY THIS EXISTS
// Points were write-only: every module awarded them, three leaderboards ranked
// them, and there was nothing a learner could ever do with them. This file
// gives them a purpose — reach a total and you unlock a way to change how the
// app looks, then pick whichever unlocked reward you want.
//
// UNLOCK, NOT SPEND
// Rewards unlock at a points *threshold* and are never deducted. Two reasons:
// a child who saves up for the gold theme should not be pushed down the
// leaderboard for buying it, and a deduction ledger would mean the number on
// the points bar no longer matches the number everything else ranks by. So
// "500 points" means "once you have earned 500", and the reward stays yours.
//
// HOW THE REWARDS REACH THE PAGE
// `applyRewards()` writes the chosen accent onto <html> as the same --mz-*
// custom properties theme.css already defines, and toggles `data-stellar-*`
// attributes for the background effects. Nothing re-styles components
// individually, so a reward covers every screen at once — the same approach
// dark mode and high contrast use.

import { getTotalPoints } from './leaderboardUtils';

const SELECTION_KEY = 'stellar_rewards_selection';
export const REWARDS_CHANGED_EVENT = 'stellar:rewards-changed';

/**
 * Accent themes. Each supplies the full accent ramp theme.css expects, so a
 * theme recolours buttons, links, focus rings, progress bars and card accents
 * together instead of leaving half the UI on the default purple.
 */
export const ACCENT_THEMES = [
  {
    id: 'default',
    cost: 0,
    nameEn: 'Stellar Purple',
    nameAr: 'بنفسجي مميّز',
    swatch: '#8b5cf6',
    vars: null // the stylesheet's own values
  },
  {
    id: 'ocean',
    cost: 500,
    nameEn: 'Ocean Blue',
    nameAr: 'أزرق المحيط',
    swatch: '#0ea5e9',
    vars: {
      '--mz-accent': '#0ea5e9',
      '--mz-accent-2': '#38bdf8',
      '--mz-accent-hover': '#0284c7',
      '--mz-accent-press': '#0369a1',
      '--mz-accent-text': '#0369a1',
      '--mz-accent-soft': '#e0f2fe',
      '--mz-accent-grad': 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)',
      '--mz-ring': '#0ea5e9'
    }
  },
  {
    id: 'forest',
    cost: 500,
    nameEn: 'Forest Green',
    nameAr: 'أخضر الغابة',
    swatch: '#10b981',
    vars: {
      '--mz-accent': '#10b981',
      '--mz-accent-2': '#34d399',
      '--mz-accent-hover': '#059669',
      '--mz-accent-press': '#047857',
      '--mz-accent-text': '#047857',
      '--mz-accent-soft': '#d1fae5',
      '--mz-accent-grad': 'linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)',
      '--mz-ring': '#10b981'
    }
  },
  {
    id: 'sunset',
    cost: 750,
    nameEn: 'Sunset Orange',
    nameAr: 'برتقالي الغروب',
    swatch: '#f97316',
    vars: {
      '--mz-accent': '#f97316',
      '--mz-accent-2': '#fb923c',
      '--mz-accent-hover': '#ea580c',
      '--mz-accent-press': '#c2410c',
      '--mz-accent-text': '#c2410c',
      '--mz-accent-soft': '#ffedd5',
      '--mz-accent-grad': 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
      '--mz-ring': '#f97316'
    }
  },
  {
    id: 'bubblegum',
    cost: 1000,
    nameEn: 'Bubblegum Pink',
    nameAr: 'وردي العلكة',
    swatch: '#ec4899',
    vars: {
      '--mz-accent': '#ec4899',
      '--mz-accent-2': '#f472b6',
      '--mz-accent-hover': '#db2777',
      '--mz-accent-press': '#be185d',
      '--mz-accent-text': '#be185d',
      '--mz-accent-soft': '#fce7f3',
      '--mz-accent-grad': 'linear-gradient(135deg, #ec4899 0%, #f9a8d4 100%)',
      '--mz-ring': '#ec4899'
    }
  },
  {
    id: 'galaxy',
    cost: 2000,
    nameEn: 'Galaxy Gold',
    nameAr: 'ذهبي المجرة',
    swatch: '#f59e0b',
    vars: {
      '--mz-accent': '#d97706',
      '--mz-accent-2': '#f59e0b',
      '--mz-accent-hover': '#b45309',
      '--mz-accent-press': '#92400e',
      '--mz-accent-text': '#92400e',
      '--mz-accent-soft': '#fef3c7',
      '--mz-accent-grad': 'linear-gradient(135deg, #d97706 0%, #fcd34d 50%, #a78bfa 100%)',
      '--mz-ring': '#d97706'
    }
  }
];

/**
 * Background effects. These are decoration only — each one is skipped entirely
 * under `prefers-reduced-motion` and under high contrast, where ambient layers
 * only cost legibility.
 */
export const BACKGROUNDS = [
  { id: 'none', cost: 0, nameEn: 'Plain', nameAr: 'عادي', icon: '⬜' },
  { id: 'sparkles', cost: 750, nameEn: 'Sparkles', nameAr: 'لمعات', icon: '✨' },
  { id: 'bubbles', cost: 1200, nameEn: 'Floating Bubbles', nameAr: 'فقاعات طائرة', icon: '🫧' },
  { id: 'stars', cost: 1500, nameEn: 'Night Sky', nameAr: 'سماء الليل', icon: '🌟' },
  { id: 'confetti', cost: 2500, nameEn: 'Party Confetti', nameAr: 'قصاصات حفلة', icon: '🎊' }
];

/**
 * Celebration styles — how the "great job" popup behaves. `calm` is the
 * default on purpose (see CelebrationPopup); the louder ones are opt-in.
 */
export const CELEBRATION_STYLES = [
  { id: 'calm', cost: 0, nameEn: 'Calm', nameAr: 'هادئ', icon: '🌙' },
  { id: 'cheerful', cost: 300, nameEn: 'Cheerful', nameAr: 'مبهج', icon: '🎈' },
  { id: 'fireworks', cost: 1000, nameEn: 'Fireworks', nameAr: 'ألعاب نارية', icon: '🎆' }
];

/** Avatar rings shown around the profile picture in the nav. */
export const AVATAR_FRAMES = [
  { id: 'none', cost: 0, nameEn: 'No frame', nameAr: 'بدون إطار', ring: 'transparent' },
  { id: 'bronze', cost: 300, nameEn: 'Bronze', nameAr: 'برونزي', ring: '#cd7f32' },
  { id: 'silver', cost: 900, nameEn: 'Silver', nameAr: 'فضي', ring: '#c0c0c0' },
  { id: 'gold', cost: 1800, nameEn: 'Gold', nameAr: 'ذهبي', ring: '#ffd700' },
  { id: 'rainbow', cost: 3000, nameEn: 'Rainbow', nameAr: 'قوس قزح', ring: 'conic-gradient(#ef4444,#f59e0b,#10b981,#0ea5e9,#8b5cf6,#ec4899,#ef4444)' }
];

/** Every catalogue, keyed by the selection field it fills. */
export const CATALOGUES = {
  accent: ACCENT_THEMES,
  background: BACKGROUNDS,
  celebration: CELEBRATION_STYLES,
  avatarFrame: AVATAR_FRAMES
};

const DEFAULT_SELECTION = {
  accent: 'default',
  background: 'none',
  celebration: 'calm',
  avatarFrame: 'none'
};

const keyOf = (userEmail) => (userEmail || 'guest').toLowerCase();

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(SELECTION_KEY)) || {};
  } catch (error) {
    return {};
  }
};

/** The rewards this user currently has switched on. */
export const getSelection = (userEmail) => ({
  ...DEFAULT_SELECTION,
  ...(readAll()[keyOf(userEmail)] || {})
});

/** Whether a given reward's points threshold has been reached. */
export const isRewardUnlocked = (userEmail, category, id) => {
  const item = (CATALOGUES[category] || []).find((r) => r.id === id);
  if (!item) return false;
  if (item.cost === 0) return true;
  return getTotalPoints(userEmail) >= item.cost;
};

/**
 * Switch a reward on. Refuses silently if the threshold has not been reached,
 * so a stale UI cannot apply something that is not earned.
 */
export const selectReward = (userEmail, category, id) => {
  if (!CATALOGUES[category]) return getSelection(userEmail);
  if (!isRewardUnlocked(userEmail, category, id)) return getSelection(userEmail);

  const all = readAll();
  const k = keyOf(userEmail);
  all[k] = { ...DEFAULT_SELECTION, ...(all[k] || {}), [category]: id };

  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(all));
  } catch (error) {
    // Storage full or unavailable — apply it for this session anyway.
  }

  applyRewards(userEmail);
  window.dispatchEvent(
    new CustomEvent(REWARDS_CHANGED_EVENT, { detail: { userEmail, category, id } })
  );

  return all[k];
};

/** Every accent variable any theme can set, so switching themes clears cleanly. */
const ALL_ACCENT_VARS = Array.from(
  new Set(ACCENT_THEMES.flatMap((t) => Object.keys(t.vars || {})))
);

/**
 * Push the current selection onto <html>. Call once on start-up and whenever
 * the selection or the points total changes.
 */
export const applyRewards = (userEmail) => {
  const root = document.documentElement;
  if (!root) return;

  const selection = getSelection(userEmail);

  // Accent: clear the previous theme's variables first, so a theme that omits
  // a variable falls back to the stylesheet instead of inheriting a stale one.
  ALL_ACCENT_VARS.forEach((name) => root.style.removeProperty(name));

  const accent = ACCENT_THEMES.find((t) => t.id === selection.accent);
  // Guard against a selection that is no longer earned (points were reset, or
  // the catalogue changed) by re-checking before applying.
  if (accent?.vars && isRewardUnlocked(userEmail, 'accent', accent.id)) {
    Object.entries(accent.vars).forEach(([name, value]) =>
      root.style.setProperty(name, value));
  }

  const background = isRewardUnlocked(userEmail, 'background', selection.background)
    ? selection.background
    : 'none';
  const celebration = isRewardUnlocked(userEmail, 'celebration', selection.celebration)
    ? selection.celebration
    : 'calm';
  const frame = AVATAR_FRAMES.find((f) => f.id === selection.avatarFrame);

  root.setAttribute('data-stellar-bg', background);
  root.setAttribute('data-stellar-celebration', celebration);
  root.setAttribute('data-stellar-frame', selection.avatarFrame);

  if (frame && frame.id !== 'none' && isRewardUnlocked(userEmail, 'avatarFrame', frame.id)) {
    root.style.setProperty('--mz-avatar-ring', frame.ring);
  } else {
    root.style.removeProperty('--mz-avatar-ring');
  }

  return selection;
};

/** The celebration style in force, for CelebrationPopup to read. */
export const getCelebrationStyle = (userEmail) => {
  const selection = getSelection(userEmail);
  return isRewardUnlocked(userEmail, 'celebration', selection.celebration)
    ? selection.celebration
    : 'calm';
};

/**
 * Catalogue rows ready for rendering: each carries whether it is unlocked, how
 * many more points are needed, and whether it is the active choice.
 */
export const getRewardsOverview = (userEmail) => {
  const total = getTotalPoints(userEmail);
  const selection = getSelection(userEmail);

  const decorate = (category) =>
    CATALOGUES[category].map((item) => ({
      ...item,
      category,
      unlocked: item.cost === 0 || total >= item.cost,
      remaining: Math.max(0, item.cost - total),
      active: selection[category] === item.id
    }));

  return {
    totalPoints: total,
    selection,
    accent: decorate('accent'),
    background: decorate('background'),
    celebration: decorate('celebration'),
    avatarFrame: decorate('avatarFrame')
  };
};

const rewardsStore = {
  ACCENT_THEMES,
  BACKGROUNDS,
  CELEBRATION_STYLES,
  AVATAR_FRAMES,
  CATALOGUES,
  REWARDS_CHANGED_EVENT,
  getSelection,
  isRewardUnlocked,
  selectReward,
  applyRewards,
  getCelebrationStyle,
  getRewardsOverview
};

export default rewardsStore;
