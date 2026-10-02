// src/utils/speechPhrasing.js — Natural wording for spoken feedback
//
// WHY THIS EXISTS
// The learning modules announced progress by reading a data structure out
// loud: "Letter baa marked as learned. You earned 5 points." Nobody talks like
// that — "marked as learned" is a database state, and a bare numeral makes the
// synthesiser clip straight through it. The result sounded robotic even on a
// good voice.
//
// Two things are fixed here:
//   1. WORDING — short, varied, human sentences. A teacher says "Nice one —
//      that's baa. Five points for you." Rotating between a few phrasings also
//      stops the fifth letter in a row from sounding like a recording.
//   2. DELIVERY — `speechFriendly()` spells small numbers out (synthesisers
//      read "5" far more flatly than "five"), turns dashes into commas so the
//      voice breathes in the right places, and drops emoji and markdown that
//      otherwise get read character by character.
//
// `useVoiceOver` applies `speechFriendly()` to everything it speaks, so plain
// `speak()` calls elsewhere benefit without changing.

const NUMBER_WORDS = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  ar: ['صفر', 'واحدة', 'نقطتان', 'ثلاث', 'أربع', 'خمس', 'ست', 'سبع', 'ثمان',
    'تسع', 'عشر']
};

/** Pick one of several phrasings, so repeated events do not sound canned. */
const pick = (options) => options[Math.floor(Math.random() * options.length)];

/** Spell a small number out; large ones stay as digits. */
const spellNumber = (n, language = 'en') => {
  const words = NUMBER_WORDS[language] || NUMBER_WORDS.en;
  return words[n] !== undefined ? words[n] : String(n);
};

/**
 * Rewrite a string so a speech synthesiser reads it the way a person would.
 * Safe to run on anything, including text that is already clean.
 */
export const speechFriendly = (text, language = 'en') => {
  if (!text) return '';

  return (
    String(text)
      // Emoji and pictographs get read as their unicode names on some voices.
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu, ' ')
      // Markdown emphasis and bullets.
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^[\s>*•-]+/gm, '')
      // Dashes and slashes become pauses rather than being read aloud.
      .replace(/\s+[—–-]\s+/g, ', ')
      .replace(/\s*\/\s*/g, ' or ')
      // "5 points" reads much more naturally as "five points".
      .replace(/\b(\d{1,2})\b/g, (match, digits) =>
        spellNumber(Number(digits), language))
      // Percentages are read flat without the word.
      .replace(/(\d+)\s*%/g, language === 'ar' ? '$1 بالمئة' : '$1 percent')
      // Collapse the whitespace the substitutions above leave behind.
      .replace(/\n+/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,!?])/g, '$1')
      .replace(/([.,!?]){2,}/g, '$1')
      .trim()
  );
};

/**
 * "You learned something and earned points." The single most-spoken line in
 * the app, so it gets the most variations.
 */
export const learnedPhrase = ({ language = 'en', kind = 'letter', name, points }) => {
  const kindWords = {
    en: { letter: 'letter', color: 'colour', word: 'word', sentence: 'sentence' },
    ar: { letter: 'حرف', color: 'لون', word: 'كلمة', sentence: 'جملة' }
  };
  const kindWord = (kindWords[language] || kindWords.en)[kind] || kind;
  const spelledPoints = points ? spellNumber(points, language) : null;

  if (language === 'ar') {
    const opener = pick(['أحسنت', 'رائع', 'ممتاز', 'جميل']);
    const reward = spelledPoints ? ` لك ${spelledPoints} نقاط.` : '';
    return `${opener}! تعلمت ${kindWord} ${name}.${reward}`;
  }

  const opener = pick(['Nice one', 'Lovely', 'Well done', 'Great', 'Good job']);
  const reward = spelledPoints ? ` That's ${spelledPoints} points for you.` : '';
  return `${opener}! You learned the ${kindWord} ${name}.${reward}`;
};

/** "You finished the whole module." */
export const moduleCompletePhrase = ({ language = 'en', moduleName }) => {
  if (language === 'ar') {
    return `${pick(['مبروك', 'أحسنت صنعاً', 'عمل رائع'])}! أكملت ${moduleName} بالكامل.`;
  }
  return `${pick(['Wonderful', 'Brilliant', 'Amazing work'])}! You finished the whole ${moduleName}.`;
};

/** Feedback on a quiz answer. */
export const answerPhrase = ({ language = 'en', correct }) => {
  if (language === 'ar') {
    return correct
      ? pick(['صحيح! أحسنت', 'نعم، هذا صحيح', 'ممتاز، إجابة صحيحة'])
      : pick(['ليست هذه، حاول مرة أخرى', 'قريب، جرب مرة أخرى']);
  }
  return correct
    ? pick(['That\'s right. Well done', 'Yes, correct', 'Spot on'])
    : pick(['Not quite, have another go', 'Close, try that again']);
};

/** Reading a word or phrase out with its phonetic spelling. */
export const pronouncePhrase = ({ language = 'en', arabic, english }) => {
  if (!english) return arabic;
  return language === 'ar' ? `${arabic}، وتعني ${english}` : `${arabic}, which means ${english}`;
};

export default {
  speechFriendly,
  learnedPhrase,
  moduleCompletePhrase,
  answerPhrase,
  pronouncePhrase
};
