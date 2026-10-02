/**
 * The learning path. Modules used to be all open at once; they now unlock in
 * order, and a test topic locks and unlocks with its lesson.
 *
 * The cases that matter are the boundaries — a module at exactly the pass mark,
 * a module past the mark but without its badge, and the staff bypass — because
 * getting any of them wrong either strands a learner on a lesson they have
 * finished or lets them into one they have not earned.
 */
import {
  PASS_PERCENT,
  CURRICULUM,
  getCurriculumState,
  isSectionUnlocked,
  isTopicUnlocked,
  getNextModule,
  isModuleComplete,
  lockReason
} from './moduleUnlockUtils';
import { syncModuleLearned } from './progressUtils';

const LEARNER = 'kid@x.com';

/** Mark `count` of `total` items learned in a module, as the modules do. */
const setProgress = (moduleId, count, total) =>
  syncModuleLearned(
    LEARNER,
    moduleId,
    Array.from({ length: count }, (_, i) => `${moduleId}_${i}`),
    total
  );

/** Unlock a badge the way achievementsSystem stores them. */
const giveBadge = (id) =>
  localStorage.setItem(
    `stellar_achievements_${LEARNER}`,
    JSON.stringify([{ id, unlockedAt: new Date().toISOString() }])
  );

beforeEach(() => {
  localStorage.clear();
});

describe('the first module is always open', () => {
  it('unlocks the alphabet for a brand new learner', () => {
    expect(isSectionUnlocked(LEARNER, 'alphabet')).toBe(true);
    expect(getNextModule(LEARNER).id).toBe('alphabet');
  });

  it('locks every later module', () => {
    expect(isSectionUnlocked(LEARNER, 'colors')).toBe(false);
    expect(isSectionUnlocked(LEARNER, 'words')).toBe(false);
    expect(isSectionUnlocked(LEARNER, 'sentences')).toBe(false);
  });
});

describe('unlocking requires BOTH coverage and the badge', () => {
  it('does not unlock the next module on coverage alone', () => {
    // Full coverage, no badge: clicking through a module is not finishing it.
    setProgress('alphabet', 28, 28);
    expect(isModuleComplete(LEARNER, 'alphabet')).toBe(false);
    expect(isSectionUnlocked(LEARNER, 'colors')).toBe(false);
  });

  it('does not unlock the next module on the badge alone', () => {
    giveBadge('alphabet_intermediate');
    setProgress('alphabet', 1, 28);
    expect(isModuleComplete(LEARNER, 'alphabet')).toBe(false);
    expect(isSectionUnlocked(LEARNER, 'colors')).toBe(false);
  });

  it('unlocks the next module once both are in place', () => {
    setProgress('alphabet', 20, 28);   // 71%, over the pass mark
    giveBadge('alphabet_intermediate');
    expect(isModuleComplete(LEARNER, 'alphabet')).toBe(true);
    expect(isSectionUnlocked(LEARNER, 'colors')).toBe(true);
  });
});

describe('the pass mark boundary', () => {
  it('does not count a module just under the mark as complete', () => {
    // 19/28 = 68%, under 70.
    setProgress('alphabet', 19, 28);
    giveBadge('alphabet_intermediate');
    expect(isModuleComplete(LEARNER, 'alphabet')).toBe(false);
  });

  it('counts a module exactly at the mark as complete', () => {
    setProgress('alphabet', 7, 10);    // exactly 70%
    giveBadge('alphabet_intermediate');
    expect(isModuleComplete(LEARNER, 'alphabet')).toBe(true);
  });

  it('uses the same mark the quiz calls a pass', () => {
    expect(PASS_PERCENT).toBe(70);
  });
});

describe('only one module opens at a time', () => {
  it('does not skip ahead when a later module is finished out of order', () => {
    // Progress recorded against `words` cannot open `sentences` while the
    // modules before it are unfinished.
    setProgress('words', 16, 16);
    giveBadge('words_complete');
    expect(isSectionUnlocked(LEARNER, 'colors')).toBe(false);
    expect(isSectionUnlocked(LEARNER, 'sentences')).toBe(false);
  });
});

describe('test topics track their lesson', () => {
  it('locks a topic for exactly as long as its lesson is locked', () => {
    expect(isTopicUnlocked(LEARNER, 'alphabet')).toBe(true);
    expect(isTopicUnlocked(LEARNER, 'colors')).toBe(false);

    setProgress('alphabet', 20, 28);
    giveBadge('alphabet_intermediate');

    expect(isTopicUnlocked(LEARNER, 'colors')).toBe(true);
  });

  it('leaves topics that are not on the path open', () => {
    expect(isTopicUnlocked(LEARNER, 'anything-else')).toBe(true);
  });
});

describe('unsequenced sections stay open', () => {
  it('never locks the practice activities or the tools', () => {
    // A learner who stalls on a lesson must still have somewhere to go.
    ['quiz', 'drawing', 'story', 'homework', 'memory-game', 'progress']
      .forEach((section) => {
        expect(isSectionUnlocked(LEARNER, section)).toBe(true);
      });
  });
});

describe('teachers and parents bypass the path', () => {
  it('opens every module for staff roles', () => {
    ['teacher', 'parent'].forEach((role) => {
      CURRICULUM.forEach((entry) => {
        expect(isSectionUnlocked(LEARNER, entry.id, role)).toBe(true);
      });
    });
  });

  it('still holds a student to the path', () => {
    expect(isSectionUnlocked(LEARNER, 'sentences', 'student')).toBe(false);
  });
});

describe('lockReason', () => {
  it('names the module that has to be finished first', () => {
    expect(lockReason(LEARNER, 'colors', 'en')).toContain('Arabic Alphabet');
    expect(lockReason(LEARNER, 'colors', 'en')).toContain(String(PASS_PERCENT));
  });

  it('is empty for a module that is already open', () => {
    expect(lockReason(LEARNER, 'alphabet', 'en')).toBe('');
  });

  it('has an Arabic form', () => {
    expect(lockReason(LEARNER, 'colors', 'ar')).toContain('الحروف العربية');
  });
});

describe('getCurriculumState', () => {
  it('marks the open-but-unfinished module as the next step', () => {
    const state = getCurriculumState(LEARNER);
    expect(state.alphabet.isNext).toBe(true);
    expect(state.colors.isNext).toBe(false);
  });

  it('names the blocking module on each locked entry', () => {
    const state = getCurriculumState(LEARNER);
    expect(state.alphabet.requires).toBe(null);
    expect(state.colors.requires).toBe('alphabet');
    expect(state.sentences.requires).toBe('words');
  });

  it('survives a null learner without throwing', () => {
    const state = getCurriculumState(null);
    expect(state.alphabet.unlocked).toBe(true);
    expect(state.colors.unlocked).toBe(false);
  });
});

describe('lockReason names the real blocker', () => {
  /** Give the learner every badge, so only coverage decides completeness. */
  const giveAllBadges = () =>
    localStorage.setItem(
      `stellar_achievements_${LEARNER}`,
      JSON.stringify(
        ['alphabet_intermediate', 'colors_complete', 'words_complete', 'sentences_complete']
          .map((id) => ({ id, unlockedAt: new Date().toISOString() }))
      )
    );

  it('skips past modules the learner has already finished', () => {
    // Alphabet done, colors untouched, words finished out of order. The
    // blocker for `sentences` is `colors` — naming `words` would send the
    // learner back to something they have already completed, and naming
    // `alphabet` would send them back to something else they have done.
    giveAllBadges();
    setProgress('alphabet', 28, 28);
    setProgress('words', 16, 16);

    const reason = lockReason(LEARNER, 'sentences', 'en');
    expect(reason).toContain('Colors');
    expect(reason).not.toContain('Alphabet');
    expect(reason).not.toContain('Words');
  });
});
