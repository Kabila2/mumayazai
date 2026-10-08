import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Speech from 'speak-tts';
import './ArabicAlphabetLearning.css';
import PointNotification from './PointNotification';
import { awardPoints, POINT_VALUES } from '../utils/pointsUtils';
import { recordModuleItemLearned, syncModuleLearned } from '../utils/progressUtils';
import { useVoiceOver } from '../hooks/useVoiceOver';
import { checkAchievements } from '../utils/achievementsSystem';
import { PASS_PERCENT } from '../utils/moduleUnlockUtils';
import { learnedPhrase, moduleCompletePhrase } from '../utils/speechPhrasing';
import { playClickSound } from '../utils/soundEffects';
import CelebrationPopup from './CelebrationPopup';

/**
 * The 28 letters this module teaches. Exported so the Quiz Centre can build
 * its unit test from the letters a learner has actually completed (the ids
 * progressUtils records are the `letter` values here).
 */
export const arabicAlphabet = [
  { letter: 'ا', name: 'ألف', pronunciation: 'alif', english: 'A', word: 'أسد', wordMeaning: 'lion', emoji: '🦁', category: 'vowel' },
  { letter: 'ب', name: 'باء', pronunciation: 'baa', english: 'B', word: 'بطة', wordMeaning: 'duck', emoji: '🦆', category: 'consonant' },
  { letter: 'ت', name: 'تاء', pronunciation: 'taa', english: 'T', word: 'تفاحة', wordMeaning: 'apple', emoji: '🍎', category: 'consonant' },
  { letter: 'ث', name: 'ثاء', pronunciation: 'thaa', english: 'Th', word: 'ثلج', wordMeaning: 'snow', emoji: '❄️', category: 'consonant' },
  { letter: 'ج', name: 'جيم', pronunciation: 'jeem', english: 'J', word: 'جمل', wordMeaning: 'camel', emoji: '🐫', category: 'consonant' },
  { letter: 'ح', name: 'حاء', pronunciation: 'haa', english: 'H', word: 'حصان', wordMeaning: 'horse', emoji: '🐴', category: 'consonant' },
  { letter: 'خ', name: 'خاء', pronunciation: 'khaa', english: 'Kh', word: 'خروف', wordMeaning: 'sheep', emoji: '🐑', category: 'consonant' },
  { letter: 'د', name: 'دال', pronunciation: 'daal', english: 'D', word: 'دب', wordMeaning: 'bear', emoji: '🐻', category: 'consonant' },
  { letter: 'ذ', name: 'ذال', pronunciation: 'dhaal', english: 'Dh', word: 'ذئب', wordMeaning: 'wolf', emoji: '🐺', category: 'consonant' },
  { letter: 'ر', name: 'راء', pronunciation: 'raa', english: 'R', word: 'رقم', wordMeaning: 'number', emoji: '🔢', category: 'consonant' },
  { letter: 'ز', name: 'زاي', pronunciation: 'zaay', english: 'Z', word: 'زهرة', wordMeaning: 'flower', emoji: '🌸', category: 'consonant' },
  { letter: 'س', name: 'سين', pronunciation: 'seen', english: 'S', word: 'سمك', wordMeaning: 'fish', emoji: '🐟', category: 'consonant' },
  { letter: 'ش', name: 'شين', pronunciation: 'sheen', english: 'Sh', word: 'شمس', wordMeaning: 'sun', emoji: '☀️', category: 'consonant' },
  { letter: 'ص', name: 'صاد', pronunciation: 'saad', english: 'S', word: 'صقر', wordMeaning: 'falcon', emoji: '🦅', category: 'consonant' },
  { letter: 'ض', name: 'ضاد', pronunciation: 'daad', english: 'D', word: 'ضفدع', wordMeaning: 'frog', emoji: '🐸', category: 'consonant' },
  { letter: 'ط', name: 'طاء', pronunciation: 'taa', english: 'T', word: 'طائر', wordMeaning: 'bird', emoji: '🐦', category: 'consonant' },
  { letter: 'ظ', name: 'ظاء', pronunciation: 'dhaa', english: 'Dh', word: 'ظبي', wordMeaning: 'deer', emoji: '🦌', category: 'consonant' },
  { letter: 'ع', name: 'عين', pronunciation: 'ayn', english: 'A', word: 'عين', wordMeaning: 'eye', emoji: '👁️', category: 'consonant' },
  { letter: 'غ', name: 'غين', pronunciation: 'ghayn', english: 'Gh', word: 'غراب', wordMeaning: 'crow', emoji: '🐦‍⬛', category: 'consonant' },
  { letter: 'ف', name: 'فاء', pronunciation: 'faa', english: 'F', word: 'فيل', wordMeaning: 'elephant', emoji: '🐘', category: 'consonant' },
  { letter: 'ق', name: 'قاف', pronunciation: 'qaaf', english: 'Q', word: 'قطة', wordMeaning: 'cat', emoji: '🐱', category: 'consonant' },
  { letter: 'ك', name: 'كاف', pronunciation: 'kaaf', english: 'K', word: 'كلب', wordMeaning: 'dog', emoji: '🐕', category: 'consonant' },
  { letter: 'ل', name: 'لام', pronunciation: 'laam', english: 'L', word: 'ليمون', wordMeaning: 'lemon', emoji: '🍋', category: 'consonant' },
  { letter: 'م', name: 'ميم', pronunciation: 'meem', english: 'M', word: 'ماء', wordMeaning: 'water', emoji: '💧', category: 'consonant' },
  { letter: 'ن', name: 'نون', pronunciation: 'noon', english: 'N', word: 'نمر', wordMeaning: 'tiger', emoji: '🐯', category: 'consonant' },
  { letter: 'ه', name: 'هاء', pronunciation: 'haa', english: 'H', word: 'هدية', wordMeaning: 'gift', emoji: '🎁', category: 'consonant' },
  { letter: 'و', name: 'واو', pronunciation: 'waaw', english: 'W', word: 'وردة', wordMeaning: 'rose', emoji: '🌹', category: 'vowel' },
  { letter: 'ي', name: 'ياء', pronunciation: 'yaa', english: 'Y', word: 'يد', wordMeaning: 'hand', emoji: '✋', category: 'vowel' }
];

/**
 * How a letter looks in each position of a word.
 *
 * This is the single hardest thing about reading Arabic, and the one most
 * primers skip: ب on its own, بـ at the start, ـبـ in the middle and ـب at
 * the end are the same letter wearing four shapes. For a dyslexic learner,
 * who already finds letter shapes slippery, seeing all four side by side —
 * with the lesson's own letter — is what makes the shape change predictable
 * rather than frightening. The joins are drawn with the tatweel (ـ), the
 * typographic connector Arabic fonts use for exactly this.
 *
 * Six letters never connect to the letter after them, so they have no
 * distinct initial or medial form.
 */
const NON_CONNECTING = new Set(['ا', 'د', 'ذ', 'ر', 'ز', 'و']);
const TATWEEL = 'ـ';

export const letterForms = (letter) => {
  const nonConnecting = NON_CONNECTING.has(letter);
  return {
    isolated: letter,
    initial: nonConnecting ? letter : `${letter}${TATWEEL}`,
    medial: nonConnecting ? `${TATWEEL}${letter}` : `${TATWEEL}${letter}${TATWEEL}`,
    final: `${TATWEEL}${letter}`,
    nonConnecting
  };
};

const ArabicAlphabetLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak, onPracticeWriting }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedLetters, setLearnedLetters] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [speechReady, setSpeechReady] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const speechRef = useRef(null);

  // Voice Over hook for accessibility
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  const currentLetter = arabicAlphabet[currentIndex];
  const forms = useMemo(() => letterForms(currentLetter.letter), [currentLetter.letter]);
  const ar = language === 'ar';

  // Initialize Speech TTS for the Arabic letter sounds. Kept separate from
  // the voice-over hook because this one is pinned to an Arabic voice: the
  // name of a letter must be said in Arabic even when the interface is
  // English, and an English voice reading Arabic script is unintelligible.
  useEffect(() => {
    const initSpeech = async () => {
      try {
        const speech = new Speech();
        speechRef.current = speech;

        const result = await speech.init({
          volume: 1,
          lang: 'ar-SA',
          rate: 0.8,
          pitch: 1
        });

        setSpeechReady(true);

        const voices = result.voices || [];
        const arabicVoice = voices.find(v => v.lang.toLowerCase().includes('ar'));
        if (arabicVoice) {
          speech.setVoice(arabicVoice.name);
        } else {
          console.warn('No Arabic speech voice installed — pronunciation falls back to the default voice (Windows: Settings → Time & Language → Speech → Add voices).');
        }
      } catch (error) {
        console.warn('Speech init failed:', error);
      }
    };

    initSpeech();

    return () => {
      if (speechRef.current) {
        speechRef.current.cancel();
      }
    };
  }, []);

  // Get user email on mount
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("stellar_session") || "{}");
      if (session.email) {
        setUserEmail(session.email);

        // Load learned letters
        const learned = JSON.parse(localStorage.getItem(`alphabet_learned_${session.email}`) || '[]');
        setLearnedLetters(learned);

        // Mirror existing progress into the central store the dashboard reads
        syncModuleLearned(session.email, 'alphabet', learned, arabicAlphabet.length);

        // Open on the first letter not yet learned, so "continue" means
        // continue rather than starting from alif every time.
        const firstUnlearned = arabicAlphabet.findIndex((entry) => !learned.includes(entry.letter));
        if (firstUnlearned > 0) setCurrentIndex(firstUnlearned);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Leave keys alone while the learner is typing (e.g. in the settings modal)
      const target = e.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))) return;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (ar) previousLetter(); else nextLetter();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (ar) nextLetter(); else previousLetter();
          break;
        case ' ':
          e.preventDefault();
          speakLetter();
          break;
        case 'Enter':
          e.preventDefault();
          markLetterAsLearned();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, learnedLetters, userEmail, ar]);

  const sayArabic = (text) => {
    if (!speechRef.current || !speechReady) return;
    // Stop any voice-over announcement so the two voices never overlap.
    voiceOver.stop();
    try {
      speechRef.current.speak({ text, queue: false }).catch(() => {});
    } catch (error) {
      // Speech unavailable in this browser.
    }
  };

  const speakLetter = () => sayArabic(currentLetter.name);
  const speakWord = () => sayArabic(currentLetter.word);

  const goTo = (index) => {
    if (speechRef.current) speechRef.current.cancel();
    const next = (index + arabicAlphabet.length) % arabicAlphabet.length;
    setCurrentIndex(next);
    markLetterAsViewed(arabicAlphabet[next]);

    const entry = arabicAlphabet[next];
    // In English the English voice reads the phonetic name; the Arabic script
    // name would be garbled by it.
    voiceOver.speakAuto(ar ? `الحرف ${entry.name}` : `Letter ${entry.pronunciation}`);
  };

  const nextLetter = () => goTo(currentIndex + 1);
  const previousLetter = () => goTo(currentIndex - 1);

  const jumpTo = (index) => {
    playClickSound();
    goTo(index);
  };

  // Mark letter as learned and award points
  const markLetterAsLearned = () => {
    if (!userEmail || learnedLetters.includes(currentLetter.letter)) return;

    const newLearned = [...learnedLetters, currentLetter.letter];
    setLearnedLetters(newLearned);

    localStorage.setItem(`alphabet_learned_${userEmail}`, JSON.stringify(newLearned));

    // Track for the Progress Dashboard
    recordModuleItemLearned(userEmail, 'alphabet', currentLetter.letter, arabicAlphabet.length);

    // Award points for learning a letter
    awardPoints(userEmail, 'LETTER_LEARNED');

    // Award the alphabet badges. This is what opens the next module on the
    // learning path — see moduleUnlockUtils.js — so it has to run from the
    // same place that records the progress, not on a separate trigger.
    checkAchievements(userEmail, 'module_progress', {
      moduleId: 'alphabet',
      learnedCount: newLearned.length,
      totalCount: arabicAlphabet.length,
      passPercent: PASS_PERCENT
    });

    // Show celebration popup (it plays the success chime)
    setShowCelebration(true);

    // Voice over announcement. Phrased by speechPhrasing.js rather than built
    // here: "Letter baa marked as learned. You earned 5 points" reads like a
    // database row out loud, and digits come out flat on most voices.
    voiceOver.speak(
      learnedPhrase({
        language,
        kind: 'letter',
        name: ar ? currentLetter.name : currentLetter.pronunciation,
        points: POINT_VALUES.LETTER_LEARNED
      }),
      true
    );

    // Check if completed all letters
    if (newLearned.length === arabicAlphabet.length) {
      awardPoints(userEmail, 'MODULE_COMPLETED');

      // Voice over for completion
      setTimeout(() => {
        voiceOver.speak(
          moduleCompletePhrase({
            language,
            moduleName: ar ? 'الحروف العربية' : 'Arabic alphabet'
          }),
          true
        );
      }, 1500);
    }
  };

  // Mark letter as viewed (for tracking activity)
  const markLetterAsViewed = (entry) => {
    if (!userEmail) return;

    // Award points for first-time viewing
    const viewedKey = `alphabet_viewed_${userEmail}`;
    const viewed = JSON.parse(localStorage.getItem(viewedKey) || '[]');

    if (!viewed.includes(entry.letter)) {
      viewed.push(entry.letter);
      localStorage.setItem(viewedKey, JSON.stringify(viewed));

      // Small points for viewing
      awardPoints(userEmail, 'LETTER_LEARNED', 0.2); // 1 point for viewing
    }
  };

  const isLearned = learnedLetters.includes(currentLetter.letter);
  const learnedCount = learnedLetters.length;
  const percent = Math.round((learnedCount / arabicAlphabet.length) * 100);

  const formLabels = ar
    ? { isolated: 'منفصل', initial: 'في البداية', medial: 'في الوسط', final: 'في النهاية' }
    : { isolated: 'On its own', initial: 'At the start', medial: 'In the middle', final: 'At the end' };

  return (
    <div className="arabic-alphabet-learning">
      {/* Point Notification */}
      {userEmail && <PointNotification userEmail={userEmail} language={language} />}

      <div className="learning-header">
        <h2 className="learning-title">
          {ar ? 'تعلم الحروف العربية' : 'Learn Arabic Alphabet'}
        </h2>
        {/* Where the learner stands in the whole alphabet, always visible:
            28 letters is a long road, and the counter is the map. */}
        <div className="alphabet-learned-summary" aria-live="off">
          <span className="alphabet-learned-count">{learnedCount}/{arabicAlphabet.length}</span>
          <span className="alphabet-learned-label">{ar ? 'حرفاً تعلمتها' : 'letters learned'}</span>
          <span className="alphabet-learned-bar" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </span>
        </div>
      </div>

      {/* Card View */}
      <div className="letter-container">
        <motion.div
          key={currentIndex}
          className="letter-card"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="letter-display"
            role="button"
            tabIndex={0}
            onClick={speakLetter}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speakLetter(); } }}
            aria-label={ar ? `اسمع الحرف ${currentLetter.name}` : `Hear the letter ${currentLetter.pronunciation}`}
          >
            <motion.div
              className="arabic-letter"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              {currentLetter.letter}
            </motion.div>
            <div className="letter-name">{currentLetter.name}</div>
            <div className="letter-pronunciation">
              {ar ? currentLetter.pronunciation : `(${currentLetter.pronunciation})`}
            </div>
            <div className="pronunciation-hint">
              🔊 {ar ? 'اضغط للاستماع' : 'Click to hear'}
            </div>
          </div>

          {/* The four shapes of the letter. */}
          <div className="letter-forms" role="group" aria-label={ar ? 'أشكال الحرف' : 'Letter shapes'}>
            <div className="letter-forms-title">
              {ar ? 'كيف يُكتب في الكلمة' : 'How it looks inside a word'}
              {forms.nonConnecting && (
                <span className="letter-forms-note">
                  {ar ? ' — هذا الحرف لا يتصل بما بعده' : ' — this letter does not join to the next one'}
                </span>
              )}
            </div>
            {/* The row follows the interface direction, so in English it reads
                own → start → middle → end left to right, and in Arabic the
                natural right-to-left way. Each glyph is Arabic text in its own
                box, so the joins render correctly either way. */}
            <div className="letter-forms-row" dir={ar ? 'rtl' : 'ltr'}>
              {['isolated', 'initial', 'medial', 'final'].map((position) => (
                <div className="letter-form" key={position}>
                  <span className="letter-form-glyph" lang="ar">{forms[position]}</span>
                  <span className="letter-form-label">{formLabels[position]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Example - Image/Emoji */}
          <motion.div
            key={`visual-${currentIndex}`}
            className="letter-visual"
            role="button"
            tabIndex={0}
            onClick={speakWord}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speakWord(); } }}
            aria-label={ar ? `اسمع كلمة ${currentLetter.word}` : `Hear the word ${currentLetter.word}, ${currentLetter.wordMeaning}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="visual-emoji" aria-hidden="true">{currentLetter.emoji}</div>
            <div className="visual-word">
              <div className="arabic-word-main">{currentLetter.word}</div>
              <div className="word-meaning-main">
                ({currentLetter.wordMeaning})
              </div>
              <div className="word-pronunciation-hint">
                🔊 {ar ? 'اضغط لسماع الكلمة' : 'Click to hear word'}
              </div>
            </div>
          </motion.div>

          <div className="letter-info">
            <div className="english-equivalent">
              {ar ? 'بالإنجليزية' : 'English'}: <strong>{currentLetter.english}</strong>
            </div>
          </div>

          {/* Mark as Learned Button */}
          {userEmail && !isLearned && (
            <motion.button
              className="mark-learned-btn"
              onClick={markLetterAsLearned}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              ✓ {ar ? 'علّم كمتعلم' : 'Mark as Learned'}
              <span className="points-badge">+{POINT_VALUES.LETTER_LEARNED}</span>
            </motion.button>
          )}

          {userEmail && isLearned && (
            <div className="learned-badge">
              ✓ {ar ? 'متعلم' : 'Learned'}
            </div>
          )}

          {/* See it, hear it, now write it: the handwriting screen opens on
              this exact letter. Multisensory practice is what makes a letter
              shape stick for a learner who finds shapes slippery. */}
          {onPracticeWriting && (
            <button
              type="button"
              className="practice-writing-btn"
              onClick={() => { playClickSound(); onPracticeWriting(currentIndex); }}
            >
              ✍️ {ar ? 'تدرّب على كتابة هذا الحرف' : 'Practise writing this letter'}
            </button>
          )}
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="navigation-controls">
        <motion.button
          className="nav-btn prev"
          onClick={previousLetter}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={ar ? 'الحرف السابق' : 'Previous letter'}
        >
          {ar ? '→' : '←'}
        </motion.button>

        <div className="progress-section">
          <div className="progress-indicator">
            {currentIndex + 1} / {arabicAlphabet.length}
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / arabicAlphabet.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <motion.button
          className="nav-btn next"
          onClick={nextLetter}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={ar ? 'الحرف التالي' : 'Next letter'}
        >
          {ar ? '←' : '→'}
        </motion.button>
      </div>

      {/* The whole alphabet at a glance, folded by default so the card stays
          the focus; opened, it is a map with the learned letters ticked and
          any letter one tap away. */}
      <div className="alphabet-overview">
        <button
          type="button"
          className="alphabet-overview-toggle"
          onClick={() => { playClickSound(); setShowOverview((value) => !value); }}
          aria-expanded={showOverview}
          aria-controls="alphabet-overview-grid"
        >
          <span aria-hidden="true">{showOverview ? '▾' : '▸'}</span>
          {ar ? 'كل الحروف' : 'All letters'}
          <span className="alphabet-overview-hint">
            {ar ? `${learnedCount} متعلمة` : `${learnedCount} learned`}
          </span>
        </button>

        {showOverview && (
          <div className="alphabet-overview-grid" id="alphabet-overview-grid" dir="rtl" role="list">
            {arabicAlphabet.map((entry, index) => {
              const learned = learnedLetters.includes(entry.letter);
              const active = index === currentIndex;
              return (
                <button
                  type="button"
                  key={entry.letter}
                  role="listitem"
                  className={`alphabet-tile ${learned ? 'is-learned' : ''} ${active ? 'is-active' : ''}`}
                  onClick={() => jumpTo(index)}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`${entry.name} ${entry.pronunciation}${learned ? (ar ? '، متعلم' : ', learned') : ''}`}
                  title={entry.pronunciation}
                >
                  <span className="alphabet-tile-letter" lang="ar">{entry.letter}</span>
                  <span className="alphabet-tile-name">{entry.pronunciation}</span>
                  {learned && <span className="alphabet-tile-tick" aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="keyboard-hints" aria-hidden="true">
        <span className="hint">← →  {ar ? 'تنقّل' : 'move'}</span>
        <span className="hint">{ar ? 'مسافة: اسمع' : 'Space: hear'}</span>
        <span className="hint">{ar ? 'إدخال: تعلمت' : 'Enter: learned'}</span>
      </div>

      {/* Celebration Popup */}
      <CelebrationPopup
        show={showCelebration}
        language={language}
        userEmail={userEmail}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default ArabicAlphabetLearning;
