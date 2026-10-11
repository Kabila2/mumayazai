const NUMBER_WORDS = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  ar: ['صفر', 'واحدة', 'نقطتان', 'ثلاث', 'أربع', 'خمس', 'ست', 'سبع', 'ثمان',
    'تسع', 'عشر']
};

/** Pick one phrase at random so the same event does not always sound the same. */
const pick = (options) => options[Math.floor(Math.random() * options.length)];

/** Write a small number as a word. Big numbers stay as digits. */
const spellNumber = (n, language = 'en') => {
  const words = NUMBER_WORDS[language] || NUMBER_WORDS.en;
  return words[n] !== undefined ? words[n] : String(n);
};

/**
 * Rewrite text so the browser voice reads it the way a person would say it.
 * Safe to run on anything, even text that is already clean.
 */
export const speechFriendly = (text, language = 'en') => {
  if (!text) return '';

  return (
    String(text)
      // Some voices read emoji out by their unicode name, so remove them
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu, ' ')
      // Remove markdown bold and bullet symbols
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^[\s>*•-]+/gm, '')
      // Turn dashes and slashes into pauses instead of reading them out
      .replace(/\s+[—–-]\s+/g, ', ')
      .replace(/\s*\/\s*/g, ' or ')
      // "5 points" sounds much better as "five points"
      .replace(/\b(\d{1,2})\b/g, (match, digits) =>
        spellNumber(Number(digits), language))
      // Say "percent" after a percentage
      .replace(/(\d+)\s*%/g, language === 'ar' ? '$1 بالمئة' : '$1 percent')
      // Tidy up the extra spaces left behind by the replacements above
      .replace(/\n+/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,!?])/g, '$1')
      .replace(/([.,!?]){2,}/g, '$1')
      .trim()
  );
};

/**
 * "You learned something and earned points." This is the line the app says
 * most often, so it has the most variations.
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

/** What to say after a quiz answer. */
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

/** Read a word out together with its meaning. */
export const pronouncePhrase = ({ language = 'en', arabic, english }) => {
  if (!english) return arabic;
  return language === 'ar' ? `${arabic}، وتعني ${english}` : `${arabic}, which means ${english}`;
};

const speechPhrasing = {
  speechFriendly,
  learnedPhrase,
  moduleCompletePhrase,
  answerPhrase,
  pronouncePhrase
};

export default speechPhrasing;
