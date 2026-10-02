// src/utils/unitTestUtils.js — The unit test, built from what the learner finished
//
// WHY THIS EXISTS
// Every quiz in the Quiz Centre draws from a fixed, hand-written bank: the
// alphabet quiz always asks about ب, ت, ث, ج and ح, whether or not the learner
// has met them. For a learner three letters in, that is a test of material they
// were never shown — and a score that measures nothing.
//
// The unit test asks only about items the learner has actually completed. It
// reads the same per-module `learned` lists progressUtils records (the ones the
// Progress Dashboard counts), resolves each id back to the real content, and
// generates questions from that. So the test grows as the learner does, and a
// 70% on it means 70% of what they have been taught.
//
// WHERE THE CONTENT COMES FROM
// The four learning modules export their own content arrays, and this file
// imports those rather than keeping a copy. The ids progressUtils stores are
// positions and keys IN those arrays, so reading the originals is the only way
// the two cannot drift: adding a word to the words module adds it here, and a
// hand-maintained second copy would have gone stale the first time anyone did.
//
// QUESTION SHAPES
// Mixed on purpose. One shape repeated twenty times is a memory game for the
// shape, not the material: recognising ب → "baa" four different ways is what
// shows it is actually known.

import { getLearnedItems } from './progressUtils';
import { arabicAlphabet } from '../components/ArabicAlphabetLearning';
import { arabicColors } from '../components/ArabicColorsLearning';
import { wordCategories } from '../components/ArabicWordsLearning';
import { sentenceCategories } from '../components/ArabicSentencesLearning';

/** The score needed to pass, matching the curriculum's unlock threshold. */
export { PASS_PERCENT } from './moduleUnlockUtils';

/** A unit test needs enough material to be worth taking. */
export const MIN_ITEMS = 4;

/** Upper bound on question count, so the test stays finishable in one sitting. */
export const MAX_QUESTIONS = 12;

/* --------------------------------------------------------------------------
   Resolving learned ids back to content
   -------------------------------------------------------------------------- */

/**
 * Everything the learner has completed, as a flat list of
 * `{ moduleId, arabic, english, pronunciation }`.
 *
 * Each module records its items under a different kind of id — the alphabet
 * stores the letter character, colors store the English name, and words and
 * sentences store `<category>_<index>` — so each gets its own resolver rather
 * than one that pretends they are the same.
 */
export const getCompletedItems = (userEmail) => {
  const items = [];

  // Alphabet: the id IS the letter.
  getLearnedItems(userEmail, 'alphabet').forEach((letter) => {
    const entry = arabicAlphabet.find((l) => l.letter === letter);
    if (entry) {
      items.push({
        moduleId: 'alphabet',
        arabic: entry.letter,
        english: entry.pronunciation,   // what the letter is CALLED, not "A"
        pronunciation: entry.pronunciation,
        extra: { name: entry.name, word: entry.word, meaning: entry.wordMeaning, emoji: entry.emoji }
      });
    }
  });

  // Colors: the id is the English name.
  getLearnedItems(userEmail, 'colors').forEach((english) => {
    const entry = arabicColors.find((c) => c.english === english);
    if (entry) {
      items.push({
        moduleId: 'colors',
        arabic: entry.arabic,
        english: entry.english.toLowerCase(),
        pronunciation: entry.pronunciation,
        extra: { hex: entry.hex }
      });
    }
  });

  // Words and sentences: the id is `<categoryId>_<indexInCategory>`.
  const resolveIndexed = (moduleId, categories, listKey) => {
    getLearnedItems(userEmail, moduleId).forEach((key) => {
      const separator = key.lastIndexOf('_');
      if (separator < 0) return;

      const categoryId = key.slice(0, separator);
      const index = Number(key.slice(separator + 1));
      const entry = categories.find((c) => c.id === categoryId)?.[listKey]?.[index];
      if (!entry) return;

      items.push({
        moduleId,
        arabic: entry.arabic,
        english: String(entry.english).toLowerCase(),
        pronunciation: entry.pronunciation || entry.simplePronunciation || '',
        extra: { image: entry.image }
      });
    });
  };

  resolveIndexed('words', wordCategories, 'words');
  resolveIndexed('sentences', sentenceCategories, 'sentences');

  return items;
};

/** Per-module counts, for telling the learner what the test will cover. */
export const getCompletedBreakdown = (userEmail) => {
  const items = getCompletedItems(userEmail);
  return {
    total: items.length,
    alphabet: items.filter((i) => i.moduleId === 'alphabet').length,
    colors: items.filter((i) => i.moduleId === 'colors').length,
    words: items.filter((i) => i.moduleId === 'words').length,
    sentences: items.filter((i) => i.moduleId === 'sentences').length
  };
};

/** Whether there is enough completed material for a meaningful test. */
export const isUnitTestAvailable = (userEmail) =>
  getCompletedItems(userEmail).length >= MIN_ITEMS;

/* --------------------------------------------------------------------------
   Generating the questions
   -------------------------------------------------------------------------- */

/** Fisher-Yates. `sort(() => Math.random() - 0.5)` is not a shuffle. */
const shuffle = (input) => {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/**
 * Three wrong answers for `correct`, drawn from the learner's OWN completed
 * items wherever possible.
 *
 * Distractors from the same pool are what make the test discriminating: if the
 * wrong options were drawn from material never taught, a learner could pick the
 * only familiar-looking answer every time without knowing any of it. Same-module
 * distractors are preferred for the same reason — "red / blue / green" is a real
 * colour question, where "red / sentence / letter" is not.
 */
const buildDistractors = (correct, pool, field) => {
  const target = correct[field];
  const sameModule = pool.filter(
    (item) => item.moduleId === correct.moduleId && item[field] !== target
  );
  const anyModule = pool.filter((item) => item[field] !== target);

  const picked = [];
  const seen = new Set([target]);

  [...shuffle(sameModule), ...shuffle(anyModule)].forEach((item) => {
    if (picked.length >= 3 || seen.has(item[field])) return;
    seen.add(item[field]);
    picked.push(item[field]);
  });

  return picked;
};

/** Assemble a multiple-choice question with the answer in a random slot. */
const makeChoiceQuestion = ({ prompt, promptArabic, hint, correctValue, distractors }) => {
  // Fewer than two options is not a question — the caller drops these.
  if (distractors.length < 2) return null;

  const options = shuffle([correctValue, ...distractors]);
  return {
    kind: 'choice',
    prompt,
    promptArabic,
    hint,
    options,
    correct: options.indexOf(correctValue)
  };
};

/**
 * Build the test.
 *
 * @param {string} userEmail
 * @param {string} language   'en' | 'ar' — only affects the question wording
 * @returns {{available: boolean, questions: Array, coverage: object}}
 */
export const buildUnitTest = (userEmail, language = 'en') => {
  const items = getCompletedItems(userEmail);
  const coverage = getCompletedBreakdown(userEmail);

  if (items.length < MIN_ITEMS) {
    return { available: false, questions: [], coverage };
  }

  const ar = language === 'ar';

  /* Four question shapes, rotated across the items so a learner is asked the
     same material more than one way. */
  const shapes = [
    // 1. Arabic → English meaning
    (item) => makeChoiceQuestion({
      prompt: ar ? 'ما معنى هذا؟' : 'What does this mean?',
      promptArabic: item.arabic,
      hint: item.pronunciation,
      correctValue: item.english,
      distractors: buildDistractors(item, items, 'english')
    }),

    // 2. English → Arabic script
    (item) => makeChoiceQuestion({
      prompt: ar
        ? `كيف نكتب "${item.english}" بالعربية؟`
        : `How do you write "${item.english}" in Arabic?`,
      promptArabic: null,
      hint: item.pronunciation,
      correctValue: item.arabic,
      distractors: buildDistractors(item, items, 'arabic')
    }),

    // 3. Arabic → how it sounds. Skipped for items with no pronunciation.
    (item) => (item.pronunciation
      ? makeChoiceQuestion({
          prompt: ar ? 'كيف نلفظ هذا؟' : 'How do you say this?',
          promptArabic: item.arabic,
          hint: null,
          correctValue: item.pronunciation,
          distractors: buildDistractors(item, items, 'pronunciation')
        })
      : null),

    // 4. Phonetic → Arabic script, i.e. reading the sound back
    (item) => (item.pronunciation
      ? makeChoiceQuestion({
          prompt: ar
            ? `أي واحدة تُلفظ "${item.pronunciation}"؟`
            : `Which one is said "${item.pronunciation}"?`,
          promptArabic: null,
          hint: null,
          correctValue: item.arabic,
          distractors: buildDistractors(item, items, 'arabic')
        })
      : null)
  ];

  const questions = [];
  // Shuffled so the test is not the learning order read back, and so a retake
  // is not the identical paper.
  shuffle(items).forEach((item, index) => {
    if (questions.length >= MAX_QUESTIONS) return;
    const question = shapes[index % shapes.length](item);
    if (question) {
      questions.push({ ...question, moduleId: item.moduleId, itemArabic: item.arabic });
    }
  });

  return {
    // A pool big enough to pass MIN_ITEMS can still fail to yield questions if
    // every item shares the same English gloss (too few distinct distractors).
    available: questions.length >= MIN_ITEMS,
    questions,
    coverage
  };
};

export default {
  MIN_ITEMS,
  MAX_QUESTIONS,
  getCompletedItems,
  getCompletedBreakdown,
  isUnitTestAvailable,
  buildUnitTest
};
