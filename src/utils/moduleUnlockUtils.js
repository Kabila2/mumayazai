// src/utils/moduleUnlockUtils.js — Sequential curriculum and module locking
//
// WHY THIS EXISTS
// Every learning module used to be open from the first visit, which left a new
// learner looking at sixteen tiles with no idea where to begin, and let them
// into "Sentences" before they could read a letter. This file turns the modules
// into an ordered path: one is open, the rest are locked, and finishing a
// module opens the next.
//
// WHAT COUNTS AS FINISHED
// A module is complete when BOTH hold:
//   • its content is at least PASS_PERCENT (70%) covered — the same per-module
//     percentages progressUtils already tracks and the Progress Dashboard
//     already shows; and
//   • its achievement is unlocked, i.e. the learner has actually been credited
//     for the work rather than clicked through it.
// Requiring both is deliberate: percentage alone can be reached by paging
// through a module, and the achievement alone says nothing about coverage.
//
// TESTS LOCK WITH THEIR LESSON
// Each learn module names the quiz topic that drills it (`testTopic`). The
// Quiz Centre reads the same lock state, so "Colors" is unavailable as a test
// topic for exactly as long as the Colors lesson is. A test you cannot study
// for is just a way to fail.
//
// The practice activities (builders, games) and the always-on tools (homework,
// drawing, stories) are NOT gated — they are places to play with what you
// already know, and locking them would leave a stuck learner with nothing to
// do. `CURRICULUM` lists only what is sequenced.

import { getModulePercent } from './progressUtils';
import { getUserAchievements } from './achievementsSystem';

/** The score a module must reach before the next one opens. */
export const PASS_PERCENT = 70;

/**
 * The ordered path. `id` matches the section id the platform navigates to,
 * `testTopic` the Quiz Centre topic that drills it, and `achievement` the
 * badge that must also be unlocked.
 *
 * The alphabet gates on `alphabet_intermediate` (14 letters) rather than
 * `alphabet_master` (all 28) on purpose: PASS_PERCENT of 28 letters is 20, so
 * the intermediate badge is always already earned by the time the percentage
 * passes, and `alphabet_master` keeps meaning the full set. The other three
 * use the `*_complete` badges added to achievementsSystem.js for exactly this.
 */
export const CURRICULUM = [
  {
    id: 'alphabet',
    testTopic: 'alphabet',
    achievement: 'alphabet_intermediate',
    titleEn: 'Arabic Alphabet',
    titleAr: 'الحروف العربية'
  },
  {
    id: 'colors',
    testTopic: 'colors',
    achievement: 'colors_complete',
    titleEn: 'Colors',
    titleAr: 'الألوان'
  },
  {
    id: 'words',
    testTopic: 'words',
    achievement: 'words_complete',
    titleEn: 'Words',
    titleAr: 'الكلمات'
  },
  {
    id: 'sentences',
    testTopic: 'sentences',
    achievement: 'sentences_complete',
    titleEn: 'Sentences',
    titleAr: 'الجمل'
  }
];

/** Section ids that sit on the path, for quick membership checks. */
export const SEQUENCED_SECTIONS = CURRICULUM.map((m) => m.id);

/** Quiz topics that sit on the path. */
export const SEQUENCED_TOPICS = CURRICULUM.map((m) => m.testTopic);

const unlockedAchievementIds = (userEmail) => {
  if (!userEmail) return [];
  try {
    const achievements = getUserAchievements(userEmail);
    return Array.isArray(achievements)
      ? achievements.map((a) => a.id || a)
      : Object.keys(achievements || {});
  } catch (error) {
    return [];
  }
};

/**
 * Whether a single curriculum module counts as finished. Exported because the
 * Progress Dashboard and the unit test both want the same definition.
 */
export const isModuleComplete = (userEmail, moduleId, unlockedIds = null) => {
  const entry = CURRICULUM.find((m) => m.id === moduleId);
  if (!entry) return false;

  if (getModulePercent(userEmail, moduleId) < PASS_PERCENT) return false;
  if (!entry.achievement) return true;

  const ids = unlockedIds || unlockedAchievementIds(userEmail);
  return ids.includes(entry.achievement);
};

/**
 * Lock state for the whole path, in one pass.
 *
 * Returns a map of `{ [moduleId]: { unlocked, complete, percent, isNext,
 * requires } }`. `requires` names the module that has to be finished first, so
 * the UI can say *why* a tile is locked instead of showing a bare padlock.
 *
 * Teachers and parents are not learners: `role` of 'teacher' or 'parent'
 * unlocks everything, so they can look at any lesson they are asked about.
 */
export const getCurriculumState = (userEmail, role = 'student') => {
  const bypass = role === 'teacher' || role === 'parent';
  const unlockedIds = unlockedAchievementIds(userEmail);

  const state = {};

  /**
   * True while EVERY module so far has been completed — not merely the one
   * immediately before.
   *
   * Tracking only the previous module lets a learner skip: finishing `words`
   * (reachable through the Learn hub, a stale link, or progress carried over
   * from before the path existed) would open `sentences` even with `colors`
   * still locked, because `colors` was never the module checked. A path with a
   * hole in it is not a path.
   */
  let allPreviousComplete = true;

  CURRICULUM.forEach((entry, index) => {
    const percent = getModulePercent(userEmail, entry.id);
    const complete = isModuleComplete(userEmail, entry.id, unlockedIds);
    const unlocked = bypass || index === 0 || allPreviousComplete;

    state[entry.id] = {
      id: entry.id,
      index,
      unlocked,
      complete,
      percent,
      isNext: unlocked && !complete,
      requires: index === 0 ? null : CURRICULUM[index - 1].id,
      titleEn: entry.titleEn,
      titleAr: entry.titleAr
    };

    allPreviousComplete = allPreviousComplete && complete;
  });

  return state;
};

/** Whether one section is open to this learner. Unsequenced sections are. */
export const isSectionUnlocked = (userEmail, sectionId, role = 'student') => {
  if (!SEQUENCED_SECTIONS.includes(sectionId)) return true;
  return !!getCurriculumState(userEmail, role)[sectionId]?.unlocked;
};

/** Whether a Quiz Centre topic is open. Topics track their lesson exactly. */
export const isTopicUnlocked = (userEmail, topicId, role = 'student') => {
  const entry = CURRICULUM.find((m) => m.testTopic === topicId);
  if (!entry) return true;
  return !!getCurriculumState(userEmail, role)[entry.id]?.unlocked;
};

/**
 * The module the learner should do next: the first unlocked-but-unfinished one,
 * or the last module once everything is done. Drives the "Continue" card.
 */
export const getNextModule = (userEmail, role = 'student') => {
  const state = getCurriculumState(userEmail, role);
  const next = CURRICULUM.find((m) => state[m.id].unlocked && !state[m.id].complete);
  return next ? state[next.id] : state[CURRICULUM[CURRICULUM.length - 1].id];
};

/**
 * A short, child-readable reason a tile is locked.
 *
 * Names the FIRST unfinished module before this one, not simply the one
 * directly before it: those differ when a learner has finished a later module
 * out of order, and naming an already-finished module as the blocker is worse
 * than saying nothing — it sends them back to something they have done.
 */
export const lockReason = (userEmail, sectionId, language = 'en', role = 'student') => {
  const state = getCurriculumState(userEmail, role);
  const entry = state[sectionId];
  if (!entry || entry.unlocked) return '';

  const blockerEntry = CURRICULUM
    .slice(0, entry.index)
    .find((m) => !state[m.id].complete);

  const name = language === 'ar'
    ? (blockerEntry?.titleAr || state[entry.requires]?.titleAr)
    : (blockerEntry?.titleEn || state[entry.requires]?.titleEn);

  return language === 'ar'
    ? `أكمل ${name} أولاً (${PASS_PERCENT}% على الأقل)`
    : `Finish ${name} first (${PASS_PERCENT}% or more)`;
};

export default {
  PASS_PERCENT,
  CURRICULUM,
  SEQUENCED_SECTIONS,
  SEQUENCED_TOPICS,
  isModuleComplete,
  getCurriculumState,
  isSectionUnlocked,
  isTopicUnlocked,
  getNextModule,
  lockReason
};
