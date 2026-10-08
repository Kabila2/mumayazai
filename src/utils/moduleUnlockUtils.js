import { getModulePercent } from './progressUtils';
import { getUserAchievements } from './achievementsSystem';

/** The score a module must reach before the next one opens. */
export const PASS_PERCENT = 70;

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


export const isModuleComplete = (userEmail, moduleId, unlockedIds = null) => {
  const entry = CURRICULUM.find((m) => m.id === moduleId);
  if (!entry) return false;

  if (getModulePercent(userEmail, moduleId) < PASS_PERCENT) return false;
  if (!entry.achievement) return true;

  const ids = unlockedIds || unlockedAchievementIds(userEmail);
  return ids.includes(entry.achievement);
};

export const getCurriculumState = (userEmail, role = 'student') => {
  const bypass = role === 'teacher' || role === 'parent';
  const unlockedIds = unlockedAchievementIds(userEmail);

  const state = {};

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

const moduleUnlockUtils = {
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

export default moduleUnlockUtils;
