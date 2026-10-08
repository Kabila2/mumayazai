// src/utils/streakUtils.js — The daily streak, as data rather than a component
//
// WHY THIS EXISTS
// The streak used to be computed inside StreakCounter.js, so it only advanced
// when that widget happened to render — and the milestone badges
// (`streak_week`, `streak_month`, `streak_century`) and streak point bonuses
// defined elsewhere were never awarded, because nothing called them.
//
// `touchStreak()` is now called once when the platform mounts, whatever screen
// the learner lands on, and it is the single place a streak changes. The
// widget just reads the result.
//
// RULES (unchanged from the old component)
// • A day counts once, however many times the app is opened.
// • Yesterday → today extends the streak.
// • A gap of exactly one day is forgiven if a freeze was armed.
// • Anything longer restarts at one.

import { checkAchievements } from './achievementsSystem';
import { awardPoints } from './pointsUtils';

export const STREAK_CHANGED_EVENT = 'stellar:streak-changed';

const keyFor = (email) => `stellar_streak_${email}`;

const EMPTY = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  streakFreeze: false,
  totalDaysActive: 0
};

const dayString = (date) => date.toDateString();

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayString(d);
};

/** The saved streak, or an empty one. Never writes. */
export const getStreak = (email) => {
  if (!email) return { ...EMPTY };
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(keyFor(email))) || {}) };
  } catch (error) {
    return { ...EMPTY };
  }
};

const saveStreak = (email, data) => {
  try {
    localStorage.setItem(keyFor(email), JSON.stringify(data));
  } catch (error) {
    // Storage unavailable — nothing else to do.
  }
  try {
    window.dispatchEvent(new CustomEvent(STREAK_CHANGED_EVENT, { detail: { email, ...data } }));
  } catch (error) {
    // No window (tests / SSR).
  }
};

/** Streak lengths that pay a bonus, and the point type each one maps to. */
const STREAK_BONUSES = { 3: 'STREAK_3_DAYS', 7: 'STREAK_7_DAYS', 30: 'STREAK_30_DAYS' };

/** Streak lengths that show a milestone celebration. */
const MILESTONES = [7, 30, 100];

/**
 * Count today as an active day. Idempotent within a day.
 *
 * @returns {{ data: object, extended: boolean, milestone: number|null, broken: boolean }}
 */
export const touchStreak = (email) => {
  if (!email) return { data: { ...EMPTY }, extended: false, milestone: null, broken: false };

  const data = getStreak(email);
  const today = dayString(new Date());
  const last = data.lastActiveDate ? dayString(new Date(data.lastActiveDate)) : null;

  if (last === today) {
    return { data, extended: false, milestone: null, broken: false };
  }

  let next;
  let extended = false;
  let broken = false;

  if (!last) {
    next = { ...data, currentStreak: 1, longestStreak: Math.max(1, data.longestStreak), lastActiveDate: today, totalDaysActive: data.totalDaysActive + 1 };
    extended = true;
  } else if (last === daysAgo(1)) {
    const streak = data.currentStreak + 1;
    next = { ...data, currentStreak: streak, longestStreak: Math.max(streak, data.longestStreak), lastActiveDate: today, totalDaysActive: data.totalDaysActive + 1, streakFreeze: false };
    extended = true;
  } else if (last === daysAgo(2) && data.streakFreeze) {
    // The freeze absorbs the missed day: the streak is kept, not extended.
    next = { ...data, lastActiveDate: today, totalDaysActive: data.totalDaysActive + 1, streakFreeze: false };
  } else {
    next = { ...data, currentStreak: 1, lastActiveDate: today, totalDaysActive: data.totalDaysActive + 1, streakFreeze: false };
    broken = data.currentStreak > 1;
  }

  saveStreak(email, next);

  let milestone = null;
  if (extended) {
    const streak = next.currentStreak;
    if (MILESTONES.includes(streak)) milestone = streak;

    // Badges and bonus points, awarded from the one place the streak moves.
    try {
      checkAchievements(email, 'streak_updated', { streak });
      if (STREAK_BONUSES[streak]) awardPoints(email, STREAK_BONUSES[streak]);
    } catch (error) {
      // A reward failing must never stop the streak itself from saving.
    }
  }

  return { data: next, extended, milestone, broken };
};

/** Arm a freeze: the next single missed day will not break the streak. */
export const armStreakFreeze = (email) => {
  const data = getStreak(email);
  const next = { ...data, streakFreeze: true };
  saveStreak(email, next);
  return next;
};

const streakUtils = { STREAK_CHANGED_EVENT, getStreak, touchStreak, armStreakFreeze };

export default streakUtils;
