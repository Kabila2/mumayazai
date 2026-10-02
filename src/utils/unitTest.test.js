/**
 * The unit test is the one quiz built from what the learner has actually
 * finished, rather than a fixed bank. Two things have to hold for it to mean
 * anything, and both are easy to break silently:
 *
 *   • it must NEVER ask about an item the learner has not completed; and
 *   • its wrong answers must come from the learner's own items, or a learner
 *     could pick the only familiar-looking option every time and score 100%
 *     without knowing any of it.
 */
import {
  buildUnitTest,
  getCompletedItems,
  getCompletedBreakdown,
  isUnitTestAvailable,
  MIN_ITEMS,
  MAX_QUESTIONS
} from './unitTestUtils';
import { syncModuleLearned } from './progressUtils';
import { arabicAlphabet } from '../components/ArabicAlphabetLearning';
import { arabicColors } from '../components/ArabicColorsLearning';

const LEARNER = 'kid@x.com';

/** Record learned letters the way ArabicAlphabetLearning does (by glyph). */
const learnLetters = (count) =>
  syncModuleLearned(
    LEARNER,
    'alphabet',
    arabicAlphabet.slice(0, count).map((l) => l.letter),
    arabicAlphabet.length
  );

/** Record learned colours the way ArabicColorsLearning does (by English name). */
const learnColors = (count) =>
  syncModuleLearned(
    LEARNER,
    'colors',
    arabicColors.slice(0, count).map((c) => c.english),
    arabicColors.length
  );

/** Record learned words the way ArabicWordsLearning does (`category_index`). */
const learnWords = (keys) => syncModuleLearned(LEARNER, 'words', keys, 16);

beforeEach(() => {
  localStorage.clear();
});

describe('resolving completed items', () => {
  it('resolves alphabet ids, which are the letter glyphs', () => {
    learnLetters(3);
    const items = getCompletedItems(LEARNER);

    expect(items).toHaveLength(3);
    expect(items[0].arabic).toBe(arabicAlphabet[0].letter);
    expect(items[0].english).toBe(arabicAlphabet[0].pronunciation);
    expect(items.every((i) => i.moduleId === 'alphabet')).toBe(true);
  });

  it('resolves colour ids, which are the English names', () => {
    learnColors(2);
    const items = getCompletedItems(LEARNER);

    expect(items).toHaveLength(2);
    expect(items[0].arabic).toBe(arabicColors[0].arabic);
    expect(items[0].pronunciation).toBe(arabicColors[0].pronunciation);
  });

  it('resolves word ids, which are category-and-index pairs', () => {
    learnWords(['learning_0', 'learning_1', 'feelings_0']);
    const items = getCompletedItems(LEARNER);

    expect(items).toHaveLength(3);
    expect(items.every((i) => i.moduleId === 'words')).toBe(true);
    expect(items.every((i) => i.arabic && i.english)).toBe(true);
  });

  it('drops ids that no longer resolve instead of emitting blanks', () => {
    // A category that was renamed, or an index past the end of the list —
    // a blank question is worse than a missing one.
    learnWords(['learning_0', 'nonexistent_0', 'learning_99']);
    const items = getCompletedItems(LEARNER);

    expect(items).toHaveLength(1);
    expect(items[0].arabic).toBeTruthy();
  });

  it('reports a per-module breakdown', () => {
    learnLetters(5);
    learnColors(2);
    const breakdown = getCompletedBreakdown(LEARNER);

    expect(breakdown).toMatchObject({
      total: 7, alphabet: 5, colors: 2, words: 0, sentences: 0
    });
  });
});

describe('availability', () => {
  it('is unavailable for a learner who has finished nothing', () => {
    expect(isUnitTestAvailable(LEARNER)).toBe(false);
    expect(buildUnitTest(LEARNER).available).toBe(false);
  });

  it('is unavailable just below the minimum', () => {
    learnLetters(MIN_ITEMS - 1);
    expect(isUnitTestAvailable(LEARNER)).toBe(false);
  });

  it('becomes available at the minimum', () => {
    learnLetters(MIN_ITEMS);
    expect(isUnitTestAvailable(LEARNER)).toBe(true);
    expect(buildUnitTest(LEARNER).available).toBe(true);
  });

  it('returns an empty question list rather than throwing when unavailable', () => {
    const test = buildUnitTest(LEARNER);
    expect(test.questions).toEqual([]);
    expect(test.coverage.total).toBe(0);
  });
});

describe('the questions it generates', () => {
  it('only ever asks about completed items', () => {
    learnLetters(6);
    const learned = arabicAlphabet.slice(0, 6).map((l) => l.letter);
    const { questions } = buildUnitTest(LEARNER);

    questions.forEach((question) => {
      expect(learned).toContain(question.itemArabic);
    });
  });

  it('never leaks an unlearned item in as a wrong answer', () => {
    learnLetters(6);
    const learnedLetters = arabicAlphabet.slice(0, 6);
    const allowed = new Set([
      ...learnedLetters.map((l) => l.letter),
      ...learnedLetters.map((l) => l.pronunciation)
    ]);

    const { questions } = buildUnitTest(LEARNER);
    expect(questions.length).toBeGreaterThan(0);

    questions.forEach((question) => {
      question.options.forEach((option) => {
        expect(allowed.has(option)).toBe(true);
      });
    });
  });

  it('puts the right answer at the index it reports', () => {
    learnLetters(6);
    const { questions } = buildUnitTest(LEARNER);

    questions.forEach((question) => {
      expect(question.correct).toBeGreaterThanOrEqual(0);
      expect(question.correct).toBeLessThan(question.options.length);
      expect(question.options[question.correct]).toBeTruthy();
    });
  });

  it('never repeats an option within one question', () => {
    // A duplicated option makes a question unanswerable: two identical
    // choices, only one of which is scored correct.
    learnLetters(8);
    const { questions } = buildUnitTest(LEARNER);

    questions.forEach((question) => {
      expect(new Set(question.options).size).toBe(question.options.length);
    });
  });

  it('gives every question at least three options', () => {
    learnLetters(8);
    const { questions } = buildUnitTest(LEARNER);
    questions.forEach((question) => {
      expect(question.options.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('mixes question shapes rather than repeating one', () => {
    learnLetters(10);
    const { questions } = buildUnitTest(LEARNER);
    const prompts = new Set(questions.map((q) => q.prompt));
    expect(prompts.size).toBeGreaterThan(1);
  });

  it('caps the length so the test is finishable in one sitting', () => {
    learnLetters(28);
    learnColors(12);
    const { questions } = buildUnitTest(LEARNER);
    expect(questions.length).toBeLessThanOrEqual(MAX_QUESTIONS);
  });

  it('draws across every module the learner has touched', () => {
    learnLetters(6);
    learnColors(6);
    const { coverage } = buildUnitTest(LEARNER);
    expect(coverage.alphabet).toBe(6);
    expect(coverage.colors).toBe(6);
  });
});

describe('retaking', () => {
  it('reshuffles, so a retake is not guaranteed to be the same paper', () => {
    learnLetters(12);
    // Shuffled items and rotating shapes mean two builds should differ. This
    // can coincide by chance, so it is checked over several builds.
    const signatures = new Set(
      Array.from({ length: 8 }, () =>
        buildUnitTest(LEARNER).questions.map((q) => q.itemArabic).join('|'))
    );
    expect(signatures.size).toBeGreaterThan(1);
  });
});

describe('language', () => {
  it('writes the prompts in Arabic when asked', () => {
    learnLetters(6);
    const { questions } = buildUnitTest(LEARNER, 'ar');
    expect(questions.some((q) => /[؀-ۿ]/.test(q.prompt))).toBe(true);
  });
});
