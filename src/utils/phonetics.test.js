/**
 * The phonetic reading aid. Every place in the app that shows Arabic script now
 * shows its Latin spelling underneath, and most of those strings have no
 * hand-written pronunciation — they go through the transliterator here.
 *
 * The cases below are the ones that are easy to get silently wrong, where the
 * output stays plausible-looking Latin text while being the wrong sound. A
 * learner has no way to notice, so the tests have to.
 */
import { transliterate, phoneticFor, stripHarakat } from './phonetics';

describe('transliterate: curated vocabulary', () => {
  it('uses the hand-written pronunciation for words the app teaches', () => {
    expect(transliterate('كِتَاب')).toBe('ki-taab');
    expect(transliterate('أحمر')).toBe('ah-mar');
    expect(transliterate('بَيْت')).toBe('bayt');
  });

  it('matches a curated entry whether or not the input is vocalised', () => {
    // The OVERRIDES map is written unvocalised; content in the modules is not.
    expect(transliterate('السَّلامُ عَلَيْكُم')).toBe('as-sa-laa-mu a-lay-kum');
    expect(transliterate('السلام عليكم')).toBe('as-sa-laa-mu a-lay-kum');
  });

  it('ignores trailing punctuation when matching', () => {
    expect(transliterate('كَيْفَ حالُكَ؟')).toBe('kay-fa haa-luk');
  });
});

describe('transliterate: the definite article', () => {
  /**
   * Sun-letter assimilation is the single most noticeable transliteration
   * error there is: الشمس is "ash-shams", and anything that renders it
   * "al-shams" teaches the wrong sound.
   */
  it('assimilates the laam into a following sun letter', () => {
    expect(transliterate('الشَّمْس')).toBe('ash-shams');
    expect(transliterate('السَّلام')).toBe('as-salaam');
  });

  it('sounds the laam before a moon letter', () => {
    expect(transliterate('القَمَر')).toBe('al-qamar');
  });
});

describe('transliterate: vowels and doubling', () => {
  it('reads an unvowelled waaw or yaa as a long vowel, not a consonant', () => {
    expect(transliterate('نور')).toBe('noor');   // not "nwr"
    expect(transliterate('بَيْت')).toBe('bayt'); // vowelled yaa stays a glide
  });

  it('doubles a consonant carrying shadda', () => {
    // مُعَلِّم — the shadda on the laam is a real doubling, unlike the one the
    // definite article's assimilation produces.
    expect(transliterate('مُعَلِّم')).toContain('ll');
  });

  it('collapses a vowel run longer than two', () => {
    // ع and ا both read as "a", so a word with both can stack three or more.
    expect(transliterate('الطَّعام')).not.toMatch(/([aeiou])\1{2}/);
  });
});

describe('transliterate: input it should decline', () => {
  it('returns empty for anything with no Arabic in it', () => {
    expect(transliterate('hello')).toBe('');
    expect(transliterate('123')).toBe('');
    expect(transliterate('')).toBe('');
    expect(transliterate(null)).toBe('');
    expect(transliterate(undefined)).toBe('');
  });

  it('never returns a bare separator', () => {
    // A stray leading or trailing hyphen would render as a phonetic line
    // containing nothing but punctuation.
    ['ا', 'ال', 'ة', 'ء'].forEach((input) => {
      expect(transliterate(input)).not.toMatch(/^-|-$/);
    });
  });
});

describe('phoneticFor', () => {
  it('prefers a module\'s own hand-written field over the transliterator', () => {
    expect(phoneticFor({ arabic: 'كِتَاب', simplePronunciation: 'ki-tab' })).toBe('ki-tab');
    expect(phoneticFor({ arabic: 'سَعِيد', pronunciation: 'sa-eed' })).toBe('sa-eed');
  });

  it('falls back to the transliterator when the field is absent', () => {
    expect(phoneticFor({ arabic: 'مَاء' })).toBe('maa');
  });

  it('accepts a bare string', () => {
    expect(phoneticFor('قَلَم')).toBe('qa-lam');
  });

  it('reads the alternative field names the modules use', () => {
    expect(phoneticFor({ nameAr: 'أزرق' })).toBe('az-raq');
    expect(phoneticFor({ word: 'شمس' })).toBe('shams');
  });
});

describe('stripHarakat', () => {
  it('removes vowel marks, shadda, sukun and tatweel', () => {
    expect(stripHarakat('كِتَاب')).toBe('كتاب');
    expect(stripHarakat('السَّلامُ')).toBe('السلام');
  });
});

describe('transliterate: mark order independence', () => {
  /**
   * The marks on one letter appear in either order in real text — a shadda
   * with a kasra under it is encoded both as shadda-then-kasra and as
   * kasra-then-shadda. Both must transliterate identically.
   */
  const SHADDA = 'ّ';
  const KASRA = 'ِ';

  it('gives the same result whichever order shadda and its vowel appear in', () => {
    const shaddaFirst = `مُعَل${SHADDA}${KASRA}م`;
    const vowelFirst  = `مُعَل${KASRA}${SHADDA}م`;

    expect(transliterate(shaddaFirst)).toBe(transliterate(vowelFirst));
    expect(transliterate(shaddaFirst)).toContain('ll');
  });

  it('does not double the vowel instead of the consonant', () => {
    const vowelFirst = `مُعَل${KASRA}${SHADDA}م`;
    expect(transliterate(vowelFirst)).not.toContain('ii');
  });
});

describe('transliterate: waaw and yaa', () => {
  it('reads a marked waaw or yaa as a glide, not a long vowel', () => {
    // نَوْم — waaw with sukun, so "nawm" and not "naoom".
    expect(transliterate('نَوْم')).toBe('nawm');
    // بَيْت — yaa with sukun, so "bayt" and not "baeet".
    expect(transliterate('بَيْت')).toBe('bayt');
  });

  it('reads an unmarked waaw or yaa as a long vowel', () => {
    expect(transliterate('نور')).toBe('noor');
    // جَدِيد — unmarked yaa mid-word reads "ee". Deliberately a word that is
    // NOT in the curated map, so this exercises the transliterator rather than
    // a lookup. (صَدِيق would have returned its curated 'sa-deeq'.)
    expect(transliterate('جَدِيد')).toBe('jadeed');
  });
});
