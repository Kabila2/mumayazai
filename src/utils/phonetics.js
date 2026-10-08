// src/utils/phonetics.js — Phonetic (Latin) spelling for Arabic text
//
// WHY THIS EXISTS
// Four modules (alphabet, colors, words, sentences) shipped their own
// `pronunciation` / `simplePronunciation` fields, while every other place that
// shows Arabic — the games, the quiz centre, the builders, the story reader,
// the handwriting tracer — showed bare Arabic script with no way in for a
// learner who cannot read it yet. That made those screens unusable as a first
// encounter with a word.
//
// Rather than hand-author a pronunciation for every string in every module,
// this file works in two layers:
//
//   1. OVERRIDES — a curated map for the vocabulary the app actually teaches,
//      so common words read the way a teacher would say them
//      ("as-salamu alaykum", not a letter-by-letter grind).
//   2. TRANSLITERATE — a general Arabic→Latin fallback for anything the map
//      does not cover, including text a teacher types in (homework, stories,
//      drawing-board labels). Harakat are honoured when present and sun-letter
//      assimilation on the definite article is applied, so new content gets a
//      usable spelling without anyone editing this file.
//
// Modules keep their hand-written `pronunciation` fields; `phoneticFor()`
// prefers those and only falls back to here. Nothing in this file is a
// scholarly transliteration — it is a *reading aid for children*, so it uses
// plain Latin letters and hyphens between syllables, never diacritics.

/** Curated pronunciations for the vocabulary the app teaches. */
const OVERRIDES = {
  // Letter names, as the alphabet module says them
  'ا': 'alif', 'أ': 'alif', 'إ': 'alif', 'آ': 'alif', 'ب': 'baa', 'ت': 'taa',
  'ث': 'thaa', 'ج': 'jeem', 'ح': 'haa', 'خ': 'khaa', 'د': 'daal', 'ذ': 'dhaal',
  'ر': 'raa', 'ز': 'zayn', 'س': 'seen', 'ش': 'sheen', 'ص': 'saad', 'ض': 'daad',
  'ط': 'taa', 'ظ': 'dhaa', 'ع': 'ayn', 'غ': 'ghayn', 'ف': 'faa', 'ق': 'qaaf',
  'ك': 'kaaf', 'ل': 'laam', 'م': 'meem', 'ن': 'noon', 'ه': 'haa', 'و': 'waaw',
  'ي': 'yaa', 'ء': 'hamza', 'ة': 'taa marbuta', 'ى': 'alif maqsura',

  // Colors
  'أحمر': 'ah-mar', 'أزرق': 'az-raq', 'أخضر': 'akh-dar', 'أصفر': 'as-far',
  'بنفسجي': 'ba-naf-sa-jee', 'وردي': 'war-dee', 'برتقالي': 'bur-tu-qaa-lee',
  'بني': 'bun-nee', 'أسود': 'as-wad', 'أبيض': 'ab-yad', 'رمادي': 'ra-maa-dee',
  'ذهبي': 'dha-ha-bee', 'فضي': 'fid-dee',

  // Numbers
  'صفر': 'sifr', 'واحد': 'waa-hid', 'اثنان': 'ith-naan', 'ثلاثة': 'tha-laa-tha',
  'أربعة': 'ar-ba-a', 'خمسة': 'kham-sa', 'ستة': 'sit-ta', 'سبعة': 'sab-a',
  'ثمانية': 'tha-maa-ni-ya', 'تسعة': 'tis-a', 'عشرة': 'ash-ra',

  // Words taught in the words module and the builders
  'تعلم': 'ta-al-lum', 'كتاب': 'ki-taab', 'قلم': 'qa-lam', 'قراءة': 'qi-raa-a',
  'سعيد': 'sa-eed', 'حب': 'hubb', 'صديق': 'sa-deeq', 'مساعدة': 'mu-saa-a-da',
  'طعام': 'ta-aam', 'ماء': 'maa', 'بيت': 'bayt', 'عائلة': 'aa-i-la',
  'لعب': 'la-ib', 'نوم': 'nawm', 'أكل': 'akl', 'مشي': 'mash-ee',
  'مدرسة': 'mad-ra-sa', 'شمس': 'shams', 'قمر': 'qa-mar', 'باب': 'baab',
  'شجرة': 'sha-ja-ra', 'زهرة': 'zah-ra', 'سيارة': 'say-yaa-ra', 'يد': 'yad',
  'أم': 'umm', 'أب': 'ab', 'ولد': 'wa-lad', 'بنت': 'bint', 'سمك': 'sa-mak',
  'طائر': 'taa-ir', 'قط': 'qitt', 'كلب': 'kalb', 'أسد': 'a-sad', 'بطة': 'bat-ta',
  'تفاحة': 'tuf-faa-ha', 'ثلج': 'thalj', 'جمل': 'ja-mal', 'حصان': 'hi-saan',
  'خروف': 'kha-roof', 'دب': 'dubb', 'ذئب': 'dhi-b', 'رقم': 'ra-qam',

  // Sentences and everyday phrases
  'السلام عليكم': 'as-sa-laa-mu a-lay-kum',
  'صباح الخير': 'sa-baah al-khayr',
  'مساء الخير': 'ma-saa al-khayr',
  'كيف حالك': 'kay-fa haa-luk',
  'أنا بخير': 'a-na bi-khayr',
  'شكرا': 'shuk-ran',
  'مرحبا': 'mar-ha-ban',
  'مع السلامة': 'ma-a as-sa-laa-ma',
  'من فضلك': 'min fad-lik',
  'أهلا وسهلا': 'ah-lan wa-sah-lan'
};

/** Harakat that change the reading. */
const FATHA = 'َ';
const DAMMA = 'ُ';
const KASRA = 'ِ';
const SHADDA = 'ّ';
const SUKUN = 'ْ';
const TANWEEN_FATH = 'ً';
const TANWEEN_DAMM = 'ٌ';
const TANWEEN_KASR = 'ٍ';

/** Marks dropped outright: superscript alif, maddah and the Quranic set. */
const DROPPED_MARKS = /[ٓ-ٰٟۖ-ۭ]/g;

/** All marks, for the unvocalised lookups the OVERRIDES map is written in. */
const ALL_MARKS = /[ً-ْٓ-ٰٟۖ-ۭـ]/g;

/** Base consonant and long-vowel values, as a child would sound them out. */
const LETTERS = {
  'ا': 'aa', 'آ': 'aa', 'أ': 'a', 'إ': 'i', 'ؤ': 'u', 'ئ': 'i', 'ء': '',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'dh', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a'
};

/** Short-vowel and tanween values. */
const VOWELS = {
  [FATHA]: 'a',
  [DAMMA]: 'u',
  [KASRA]: 'i',
  [TANWEEN_FATH]: 'an',
  [TANWEEN_DAMM]: 'un',
  [TANWEEN_KASR]: 'in'
};

/**
 * Sun letters: the laam of `al-` assimilates into them, so الشَّمْس reads
 * "ash-shams" and not "al-shams". Getting this wrong is the most noticeable
 * transliteration error there is for a learner.
 */
const SUN_LETTERS = 'تثدذرزسشصضطظلن';

const isArabicChar = (ch) => /[؀-ۿ]/.test(ch);

/** Strip every mark, for override lookups (the map is unvocalised). */
export const stripHarakat = (text) =>
  String(text || '').replace(ALL_MARKS, '').trim();

const stripPunctuation = (text) =>
  String(text || '').replace(/[؟?!.,،:;"'()]/g, '').trim();

/**
 * Transliterate a single Arabic word into child-readable Latin letters.
 * Vocalised input (with harakat) gives a far better result than bare script,
 * which is why the learning content carries them.
 */
/** Every combining mark this transliterator reads. */
const isMark = (ch) =>
  ch !== undefined &&
  (VOWELS[ch] !== undefined || ch === SHADDA || ch === SUKUN);

/**
 * Transliterate one Arabic word.
 *
 * The loop walks LETTER-AT-A-TIME, collecting the run of combining marks that
 * belongs to each letter before emitting anything. That matters because the
 * marks on one letter can be encoded in either order — a shadda with a kasra
 * under it appears both as `ل ﹽ ﹻ` and as `ل ﹻ ﹽ` in real text. An
 * implementation that walks character-at-a-time and doubles "the last thing it
 * wrote" when it meets a shadda therefore doubles the VOWEL instead of the
 * consonant on half its input, turning مُعَلِّم into "muaaliim" rather than
 * "muaallim". Reading the whole cluster first makes the order irrelevant.
 */
const transliterateWord = (word) => {
  const chars = Array.from(word.replace(DROPPED_MARKS, ''));
  let out = '';
  let i = 0;

  // The sun-letter prefix below already doubles the letter, so the shadda that
  // marks the same doubling in the script must not double it again.
  let articleDoubled = false;

  // Definite article. Before a sun letter the laam assimilates into it —
  // الشَّمْس is "ash-shams", not "al-shams" — so the prefix becomes the vowel
  // plus that letter. Before a moon letter the laam is sounded: "al-qamar".
  if (chars[0] === 'ا' && chars[1] === 'ل' && chars[2]) {
    if (SUN_LETTERS.includes(chars[2])) {
      out += `a${LETTERS[chars[2]] || ''}-`;
      articleDoubled = true;
    } else {
      out += 'al-';
    }
    i = 2;
  }

  while (i < chars.length) {
    const ch = chars[i];
    i += 1;

    // A stray mark with no letter before it (malformed input) carries nothing.
    if (isMark(ch)) continue;

    if (!isArabicChar(ch)) {
      out += ch;
      continue;
    }

    const value = LETTERS[ch];
    if (value === undefined) continue;

    // Collect this letter's marks.
    const marks = [];
    while (isMark(chars[i])) {
      marks.push(chars[i]);
      i += 1;
    }

    const hasShadda = marks.includes(SHADDA);
    const vowel = marks.find((mark) => VOWELS[mark] !== undefined);

    // A waaw or yaa is the long vowel only when it carries NO mark at all:
    // نور is "noor", but نَوْم (waaw + sukun) is "nawm" and بَيْت is "bayt",
    // where the letter is a glide rather than a vowel.
    let letterSound = value;
    if (marks.length === 0 && i > 1) {
      if (ch === 'و') letterSound = 'oo';
      else if (ch === 'ي') letterSound = 'ee';
    }

    // Double for shadda — unless the article prefix already did it.
    if (hasShadda && !articleDoubled) letterSound += letterSound;
    articleDoubled = false;

    out += letterSound;

    // A short vowel immediately before an UNMARKED alif, waaw or yaa is one
    // long sound, not two: جَدِيد is "jadeed", not "jadieed". The long-vowel
    // letter carries it, so the short vowel is dropped here. (A marked waaw or
    // yaa is a glide instead — see above — and keeps the short vowel: بَيْت
    // stays "bayt".)
    const nextLetter = chars[i];
    const nextIsUnmarkedLongVowel =
      'اوي'.includes(nextLetter) && !isMark(chars[i + 1]);

    if (vowel && !nextIsUnmarkedLongVowel) out += VOWELS[vowel];
  }

  return out
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    // ع and ا both read as "a", so a word carrying both can stack three or
    // more. Two is the longest a reader needs.
    .replace(/([aeiou])\1{2,}/g, '$1$1')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Phonetic spelling for any Arabic string: the curated map first, then the
 * general transliterator. Returns '' for empty or non-Arabic input so callers
 * can render nothing rather than a stray hyphen.
 */
export const transliterate = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return '';
  if (!Array.from(raw).some(isArabicChar)) return '';

  const bare = stripPunctuation(stripHarakat(raw));
  if (OVERRIDES[bare]) return OVERRIDES[bare];
  if (OVERRIDES[raw]) return OVERRIDES[raw];

  return raw
    .split(/\s+/)
    .map((word) => {
      const bareWord = stripPunctuation(stripHarakat(word));
      return OVERRIDES[bareWord] || transliterateWord(stripPunctuation(word));
    })
    .filter(Boolean)
    .join(' ');
};

/**
 * The pronunciation to show next to a piece of Arabic. A module's own
 * hand-written field always wins; this only fills the gap. `item` may be a
 * plain string or a content object carrying any of the field names the modules
 * already use.
 */
export const phoneticFor = (item, fallbackText) => {
  if (!item) return transliterate(fallbackText);
  if (typeof item === 'string') return transliterate(item) || transliterate(fallbackText);

  return (
    item.pronunciation ||
    item.simplePronunciation ||
    item.phonetic ||
    item.transliteration ||
    transliterate(item.arabic || item.nameAr || item.word || fallbackText)
  );
};

const phonetics = { transliterate, phoneticFor, stripHarakat };

export default phonetics;
