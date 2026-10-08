// src/components/QuizCenter.js - Centralized Quiz System with Multiple Quiz Types

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { awardPoints } from '../utils/pointsUtils';
import { useVoiceOver } from '../hooks/useVoiceOver';
import { isTopicUnlocked, lockReason, PASS_PERCENT } from '../utils/moduleUnlockUtils';
import { buildUnitTest, getCompletedBreakdown, MIN_ITEMS } from '../utils/unitTestUtils';
import { answerPhrase } from '../utils/speechPhrasing';
import { transliterate, stripHarakat } from '../utils/phonetics';
import { checkAchievements } from '../utils/achievementsSystem';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/soundEffects';
import CelebrationPopup from './CelebrationPopup';
import './QuizCenter.css';

/* ---------------------------------------------------------------------------
   CONTENT
   Kept at module scope: it never depends on props, and recreating ~80
   question objects on every keystroke (it used to live inside the component)
   was pointless work.

   Every question carries what the ARABIC interface needs as well as the
   English one. The quiz was English-only even when the whole app was in
   Arabic, so an Arabic-speaking learner — exactly who the Arabic interface is
   for — got English prompts in the middle of an Arabic app.
   --------------------------------------------------------------------------- */
const QUICK_REVIEW_SIZE = 5;

/** Hints, by their English text, in Arabic. */
const HINTS_AR = {
  'First letter of Arabic alphabet': 'أول حرف في الأبجدية',
  'Second letter of Arabic alphabet': 'ثاني حرف في الأبجدية',
  'Third letter of Arabic alphabet': 'ثالث حرف في الأبجدية',
  'Fourth letter of Arabic alphabet': 'رابع حرف في الأبجدية',
  'Fifth letter of Arabic alphabet': 'خامس حرف في الأبجدية',
  'First letter': 'الحرف الأول',
  'Second letter': 'الحرف الثاني',
  'Third letter': 'الحرف الثالث',
  'Fourth letter': 'الحرف الرابع',
  'Fifth letter': 'الحرف الخامس',
  'Reading material': 'شيء نقرأه',
  'Writing tool': 'أداة للكتابة',
  'Drink this': 'نشربه',
  'Where you live': 'المكان الذي تسكن فيه',
  'Feeling good': 'شعور جميل',
  'You eat this': 'نأكله',
  'Greeting': 'تحية',
  'Express gratitude': 'للتعبير عن الشكر',
  'Farewell': 'وداع',
  'Polite request': 'طلب مهذب',
  'Greeting guests': 'ترحيب بالضيوف',
  'Islamic greeting': 'تحية إسلامية',
  'Ask about wellbeing': 'سؤال عن الحال',
  'Color of apple': 'لون التفاحة',
  'Color of sky': 'لون السماء',
  'Color of grass': 'لون العشب',
  'Color of sun': 'لون الشمس',
  'Color of snow': 'لون الثلج'
};

const QUIZ_CONTENT = {
  alphabet: {
    multipleChoice: [
      { question: 'What is the sound of "ب"?', arabic: 'ب', options: ['ba', 'ta', 'tha', 'ja'], correct: 0 },
      { question: 'What is the sound of "ت"?', arabic: 'ت', options: ['ba', 'ta', 'tha', 'ja'], correct: 1 },
      { question: 'What is the sound of "ث"?', arabic: 'ث', options: ['ba', 'ta', 'tha', 'ja'], correct: 2 },
      { question: 'What is the sound of "ج"?', arabic: 'ج', options: ['ba', 'ta', 'tha', 'ja'], correct: 3 },
      { question: 'What is the sound of "ح"?', arabic: 'ح', options: ['ha', 'kha', 'dal', 'dhal'], correct: 0 }
    ],
    scrambledWords: [
      { word: 'alif', arabic: 'أ', hint: 'First letter of Arabic alphabet' },
      { word: 'ba', arabic: 'ب', hint: 'Second letter of Arabic alphabet' },
      { word: 'ta', arabic: 'ت', hint: 'Third letter of Arabic alphabet' },
      { word: 'tha', arabic: 'ث', hint: 'Fourth letter of Arabic alphabet' },
      { word: 'jeem', arabic: 'ج', hint: 'Fifth letter of Arabic alphabet' }
    ],
    recall: [
      { arabic: 'أ', english: 'alif', hint: 'First letter', options: ['alif', 'ba', 'ta', 'tha'], correct: 0 },
      { arabic: 'ب', english: 'ba', hint: 'Second letter', options: ['alif', 'ba', 'ta', 'tha'], correct: 1 },
      { arabic: 'ت', english: 'ta', hint: 'Third letter', options: ['alif', 'ba', 'ta', 'tha'], correct: 2 },
      { arabic: 'ث', english: 'tha', hint: 'Fourth letter', options: ['ba', 'ta', 'tha', 'jeem'], correct: 2 },
      { arabic: 'ج', english: 'jeem', hint: 'Fifth letter', options: ['tha', 'jeem', 'ha', 'kha'], correct: 1 }
    ],
    fillBlanks: [
      { sentence: 'The first letter of Arabic is _____.', arabic: 'أ', options: ['alif', 'ba', 'ta', 'tha'], correct: 0,
        sentenceAr: 'أول حرف في العربية هو _____.', optionsAr: ['أ', 'ب', 'ت', 'ث'], correctAr: 0 },
      { sentence: 'The sound "ba" is written as _____.', arabic: 'ب', options: ['أ', 'ب', 'ت', 'ث'], correct: 1,
        sentenceAr: 'صوت "با" يُكتب _____.', optionsAr: ['أ', 'ب', 'ت', 'ث'], correctAr: 1 },
      { sentence: 'The third letter is pronounced _____.', arabic: 'ت', options: ['alif', 'ba', 'ta', 'tha'], correct: 2,
        sentenceAr: 'الحرف الثالث هو _____.', optionsAr: ['أ', 'ب', 'ت', 'ث'], correctAr: 2 },
      { sentence: 'The letter ث sounds like _____.', arabic: 'ث', options: ['ba', 'ta', 'tha', 'jeem'], correct: 2,
        sentenceAr: 'الحرف الرابع هو _____.', optionsAr: ['ب', 'ت', 'ث', 'ج'], correctAr: 2 },
      { sentence: 'The fifth Arabic letter is _____.', arabic: 'ج', options: ['tha', 'jeem', 'ha', 'kha'], correct: 1,
        sentenceAr: 'الحرف الخامس هو _____.', optionsAr: ['ث', 'ج', 'ح', 'خ'], correctAr: 1 }
    ],
    matching: [
      { arabic: 'أ', english: 'alif' },
      { arabic: 'ب', english: 'ba' },
      { arabic: 'ت', english: 'ta' },
      { arabic: 'ث', english: 'tha' },
      { arabic: 'ج', english: 'jeem' },
      { arabic: 'ح', english: 'ha' }
    ]
  },
  words: {
    multipleChoice: [
      { question: 'What does "كِتَاب" mean?', arabic: 'كِتَاب', options: ['Book', 'Pen', 'Learn', 'Reading'], correct: 0 },
      { question: 'What does "قَلَم" mean?', arabic: 'قَلَم', options: ['Book', 'Pen', 'Learn', 'Reading'], correct: 1 },
      { question: 'What does "مَاء" mean?', arabic: 'مَاء', options: ['Food', 'Water', 'Home', 'Family'], correct: 1 },
      { question: 'What does "سَعِيد" mean?', arabic: 'سَعِيد', options: ['Sad', 'Happy', 'Angry', 'Tired'], correct: 1 },
      { question: 'What does "بَيْت" mean?', arabic: 'بَيْت', options: ['School', 'Home', 'Car', 'Tree'], correct: 1 }
    ],
    scrambledWords: [
      { word: 'book', arabic: 'كِتَاب', hint: 'Reading material' },
      { word: 'pen', arabic: 'قَلَم', hint: 'Writing tool' },
      { word: 'water', arabic: 'مَاء', hint: 'Drink this' },
      { word: 'home', arabic: 'بَيْت', hint: 'Where you live' },
      { word: 'happy', arabic: 'سَعِيد', hint: 'Feeling good' }
    ],
    recall: [
      { arabic: 'كِتَاب', english: 'book', hint: 'Reading material', options: ['book', 'pen', 'water', 'home'], correct: 0 },
      { arabic: 'قَلَم', english: 'pen', hint: 'Writing tool', options: ['book', 'pen', 'water', 'home'], correct: 1 },
      { arabic: 'مَاء', english: 'water', hint: 'Drink this', options: ['food', 'water', 'home', 'happy'], correct: 1 },
      { arabic: 'بَيْت', english: 'home', hint: 'Where you live', options: ['school', 'home', 'car', 'tree'], correct: 1 },
      { arabic: 'طَعَام', english: 'food', hint: 'You eat this', options: ['water', 'food', 'pen', 'book'], correct: 1 }
    ],
    fillBlanks: [
      { sentence: 'I read a _____ every day.', arabic: 'كِتَاب', options: ['book', 'pen', 'car', 'tree'], correct: 0, sentenceAr: 'أقرأ _____ كل يوم.' },
      { sentence: 'I write with a _____.', arabic: 'قَلَم', options: ['book', 'pen', 'car', 'tree'], correct: 1, sentenceAr: 'أكتب بـ _____.' },
      { sentence: 'I drink _____ when thirsty.', arabic: 'مَاء', options: ['food', 'water', 'milk', 'juice'], correct: 1, sentenceAr: 'أشرب _____ عندما أعطش.' },
      { sentence: 'I live in a _____.', arabic: 'بَيْت', options: ['car', 'home', 'school', 'park'], correct: 1, sentenceAr: 'أعيش في _____.' },
      { sentence: 'I am _____ today!', arabic: 'سَعِيد', options: ['sad', 'happy', 'angry', 'tired'], correct: 1, sentenceAr: 'أنا _____ اليوم!' }
    ],
    matching: [
      { arabic: 'كِتَاب', english: 'book' },
      { arabic: 'قَلَم', english: 'pen' },
      { arabic: 'مَاء', english: 'water' },
      { arabic: 'بَيْت', english: 'home' },
      { arabic: 'طَعَام', english: 'food' },
      { arabic: 'سَعِيد', english: 'happy' }
    ]
  },
  sentences: {
    multipleChoice: [
      { question: 'What does "السَّلَامُ عَلَيْكُم" mean?', arabic: 'السَّلَامُ عَلَيْكُم', options: ['Peace be upon you', 'Good morning', 'Thank you', 'Goodbye'], correct: 0 },
      { question: 'What does "شُكْرًا" mean?', arabic: 'شُكْرًا', options: ['Hello', 'Goodbye', 'Thank you', 'Please'], correct: 2 },
      { question: 'What does "مَعَ السَّلَامَة" mean?', arabic: 'مَعَ السَّلَامَة', options: ['Hello', 'Goodbye', 'Thank you', 'Please'], correct: 1 },
      { question: 'What does "صَبَاحُ الخَيْر" mean?', arabic: 'صَبَاحُ الخَيْر', options: ['Good morning', 'Good night', 'Good afternoon', 'Good evening'], correct: 0 },
      { question: 'What does "كَيْفَ حَالُك" mean?', arabic: 'كَيْفَ حَالُك', options: ['What is your name?', 'How are you?', 'Where are you?', 'What time is it?'], correct: 1 }
    ],
    scrambledWords: [
      { word: 'hello', arabic: 'مَرْحَبًا', hint: 'Greeting' },
      { word: 'thanks', arabic: 'شُكْرًا', hint: 'Express gratitude' },
      { word: 'goodbye', arabic: 'مَعَ السَّلَامَة', hint: 'Farewell' },
      { word: 'please', arabic: 'مِن فَضْلِك', hint: 'Polite request' },
      { word: 'welcome', arabic: 'أَهْلًا وَسَهْلًا', hint: 'Greeting guests' }
    ],
    recall: [
      { arabic: 'السَّلَامُ عَلَيْكُم', english: 'peace be upon you', hint: 'Islamic greeting', options: ['peace be upon you', 'good morning', 'thank you', 'goodbye'], correct: 0 },
      { arabic: 'شُكْرًا', english: 'thank you', hint: 'Express gratitude', options: ['hello', 'goodbye', 'thank you', 'please'], correct: 2 },
      { arabic: 'مَرْحَبًا', english: 'hello', hint: 'Greeting', options: ['hello', 'goodbye', 'thank you', 'how are you'], correct: 0 },
      { arabic: 'مَعَ السَّلَامَة', english: 'goodbye', hint: 'Farewell', options: ['hello', 'goodbye', 'thank you', 'please'], correct: 1 },
      { arabic: 'كَيْفَ حَالُك', english: 'how are you', hint: 'Ask about wellbeing', options: ['what is your name', 'how are you', 'where are you', 'what time is it'], correct: 1 }
    ],
    fillBlanks: [
      { sentence: 'Muslims greet each other by saying _____.', arabic: 'السَّلَامُ عَلَيْكُم', options: ['peace be upon you', 'good morning', 'thank you', 'goodbye'], correct: 0, sentenceAr: 'يحيّي المسلمون بعضهم بقول _____.' },
      { sentence: 'To express gratitude, you say _____.', arabic: 'شُكْرًا', options: ['hello', 'goodbye', 'thank you', 'please'], correct: 2, sentenceAr: 'للتعبير عن الامتنان نقول _____.' },
      { sentence: 'When you meet someone, you say _____.', arabic: 'مَرْحَبًا', options: ['hello', 'goodbye', 'thank you', 'how are you'], correct: 0, sentenceAr: 'عندما تقابل شخصاً تقول _____.' },
      { sentence: 'When leaving, you say _____.', arabic: 'مَعَ السَّلَامَة', options: ['hello', 'goodbye', 'thank you', 'please'], correct: 1, sentenceAr: 'عند المغادرة تقول _____.' },
      { sentence: 'To ask about wellbeing, say _____.', arabic: 'كَيْفَ حَالُك', options: ['what is your name', 'how are you', 'where are you', 'what time is it'], correct: 1, sentenceAr: 'للسؤال عن الحال نقول _____.' }
    ],
    matching: [
      { arabic: 'السَّلَامُ عَلَيْكُم', english: 'peace be upon you' },
      { arabic: 'شُكْرًا', english: 'thank you' },
      { arabic: 'مَرْحَبًا', english: 'hello' },
      { arabic: 'مَعَ السَّلَامَة', english: 'goodbye' },
      { arabic: 'صَبَاحُ الخَيْر', english: 'good morning' },
      { arabic: 'كَيْفَ حَالُك', english: 'how are you' }
    ]
  },
  colors: {
    multipleChoice: [
      { question: 'What color is "أَحْمَر"?', arabic: 'أَحْمَر', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 1 },
      { question: 'What color is "أَزْرَق"?', arabic: 'أَزْرَق', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 0 },
      { question: 'What color is "أَخْضَر"?', arabic: 'أَخْضَر', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 2 },
      { question: 'What color is "أَصْفَر"?', arabic: 'أَصْفَر', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 3 },
      { question: 'What color is "أَبْيَض"?', arabic: 'أَبْيَض', options: ['White', 'Black', 'Brown', 'Pink'], correct: 0 }
    ],
    scrambledWords: [
      { word: 'red', arabic: 'أَحْمَر', hint: 'Color of apple' },
      { word: 'blue', arabic: 'أَزْرَق', hint: 'Color of sky' },
      { word: 'green', arabic: 'أَخْضَر', hint: 'Color of grass' },
      { word: 'yellow', arabic: 'أَصْفَر', hint: 'Color of sun' },
      { word: 'white', arabic: 'أَبْيَض', hint: 'Color of snow' }
    ],
    recall: [
      { arabic: 'أَحْمَر', english: 'red', hint: 'Color of apple', options: ['blue', 'red', 'green', 'yellow'], correct: 1 },
      { arabic: 'أَزْرَق', english: 'blue', hint: 'Color of sky', options: ['blue', 'red', 'green', 'yellow'], correct: 0 },
      { arabic: 'أَخْضَر', english: 'green', hint: 'Color of grass', options: ['blue', 'red', 'green', 'yellow'], correct: 2 },
      { arabic: 'أَصْفَر', english: 'yellow', hint: 'Color of sun', options: ['blue', 'red', 'green', 'yellow'], correct: 3 },
      { arabic: 'أَبْيَض', english: 'white', hint: 'Color of snow', options: ['white', 'black', 'brown', 'pink'], correct: 0 }
    ],
    fillBlanks: [
      { sentence: 'An apple is _____ in color.', arabic: 'أَحْمَر', options: ['blue', 'red', 'green', 'yellow'], correct: 1, sentenceAr: 'لون التفاحة _____.' },
      { sentence: 'The sky is _____.', arabic: 'أَزْرَق', options: ['blue', 'red', 'green', 'yellow'], correct: 0, sentenceAr: 'لون السماء _____.' },
      { sentence: 'Grass is _____.', arabic: 'أَخْضَر', options: ['blue', 'red', 'green', 'yellow'], correct: 2, sentenceAr: 'لون العشب _____.' },
      { sentence: 'The sun is _____.', arabic: 'أَصْفَر', options: ['blue', 'red', 'green', 'yellow'], correct: 3, sentenceAr: 'لون الشمس _____.' },
      { sentence: 'Snow is _____.', arabic: 'أَبْيَض', options: ['white', 'black', 'brown', 'pink'], correct: 0, sentenceAr: 'لون الثلج _____.' }
    ],
    matching: [
      { arabic: 'أَحْمَر', english: 'red' },
      { arabic: 'أَزْرَق', english: 'blue' },
      { arabic: 'أَخْضَر', english: 'green' },
      { arabic: 'أَصْفَر', english: 'yellow' },
      { arabic: 'أَبْيَض', english: 'white' },
      { arabic: 'أَسْوَد', english: 'black' }
    ]
  }
};

const TOPICS = [
  { id: 'alphabet', nameEn: 'Alphabet', nameAr: 'الحروف', icon: '🔤', color: '#6366f1' },
  { id: 'words', nameEn: 'Words', nameAr: 'الكلمات', icon: '📚', color: '#8b5cf6' },
  { id: 'sentences', nameEn: 'Sentences', nameAr: 'الجمل', icon: '💬', color: '#ec4899' },
  { id: 'colors', nameEn: 'Colors', nameAr: 'الألوان', icon: '🎨', color: '#10b981' }
];

/** Fisher-Yates. `sort(() => Math.random() - 0.5)` is not a shuffle. */
const shuffle = (input) => {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const rotate = (array, by) => [...array.slice(by), ...array.slice(0, by)];

/** The multiple-choice prompt, in the interface language. */
const questionText = (topicId, item, language) => {
  if (language !== 'ar') return item.question;
  if (topicId === 'alphabet') return `ما صوت الحرف "${item.arabic}"؟`;
  if (topicId === 'colors') return `ما هو لون "${item.arabic}"؟`;
  return `ما معنى "${item.arabic}"؟`;
};

const hintText = (hint, language) => (language === 'ar' ? HINTS_AR[hint] || hint : hint);

/**
 * A fill-in-the-blank question for the interface language. In Arabic the
 * sentence is Arabic and the choices are the topic's Arabic words (the
 * alphabet bank spells its own choices out), so the learner completes an
 * Arabic sentence rather than an English one.
 */
const localizedFillBlank = (topicId, item, index, language) => {
  if (language !== 'ar' || !item.sentenceAr) {
    return { sentence: item.sentence, options: item.options, correct: item.correct };
  }
  if (item.optionsAr) {
    return { sentence: item.sentenceAr, options: item.optionsAr, correct: item.correctAr };
  }
  const pool = QUIZ_CONTENT[topicId].fillBlanks
    .map((entry) => entry.arabic)
    .filter((arabic) => arabic !== item.arabic);
  const options = rotate([item.arabic, ...pool.slice(0, 3)], index % 4);
  return { sentence: item.sentenceAr, options, correct: options.indexOf(item.arabic) };
};

/** The word to unscramble: English letters in English, Arabic letters in Arabic. */
const scrambleTarget = (item, language) =>
  (language === 'ar' ? stripHarakat(item.arabic).replace(/\s+/g, '') : item.word);

/** A short review built from the learner's own completed items. */
const buildQuickReview = (userEmail, language) => {
  const test = buildUnitTest(userEmail, language);
  return { ...test, questions: test.questions.slice(0, QUICK_REVIEW_SIZE) };
};

const GENERATED_TYPES = ['unit-test', 'quick-review'];

const QuizCenter = ({ t, language, fontSize, highContrast, reducedMotion, speak, userEmail, userRole = 'student', onSectionSelect }) => {
  const [selectedQuizType, setSelectedQuizType] = useState(null);
  // The unit test and quick review are generated per attempt from the
  // learner's completed items, so unlike the other quizzes they cannot come
  // from a static bank.
  const [generatedTest, setGeneratedTest] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [matchingPairs, setMatchingPairs] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  // Guards against the results effect awarding twice for one attempt.
  const awardedRef = useRef(false);

  // Voice Over hook for accessibility
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  const ar = language === 'ar';

  /**
   * What the learner has finished, and so what a unit test could cover.
   * Recomputed when the quiz type changes rather than on every render, which
   * would re-read localStorage on each keystroke.
   */
  const completed = useMemo(
    () => getCompletedBreakdown(userEmail),
    [userEmail, selectedQuizType]  // eslint-disable-line react-hooks/exhaustive-deps
  );

  const hasEnoughCompleted = completed.total >= MIN_ITEMS;

  // Quiz Types
  const quizTypes = [
    {
      /**
       * Quick review: five questions from the learner's own completed items.
       * Short on purpose — spaced, little-and-often recall is what moves
       * things into long-term memory, and five questions is a length a
       * learner with a short attention span will actually finish.
       */
      id: 'quick-review',
      nameEn: 'Quick Review',
      nameAr: 'مراجعة سريعة',
      icon: '⚡',
      color: '#10b981',
      description: hasEnoughCompleted
        ? `${QUICK_REVIEW_SIZE} quick questions on what you have learned`
        : `Finish at least ${MIN_ITEMS} items in a lesson to open this`,
      descriptionAr: hasEnoughCompleted
        ? `${QUICK_REVIEW_SIZE} أسئلة سريعة عمّا تعلمته`
        : `أكمل ${MIN_ITEMS} عناصر على الأقل في درس لفتح هذا`,
      category: 'quiz',
      noTopic: true,
      locked: !hasEnoughCompleted,
      featured: true
    },
    {
      /**
       * The unit test: the only full test drawn from the learner's own
       * completed material rather than a fixed bank. The others can ask about
       * letters and words the learner has never been shown.
       */
      id: 'unit-test',
      nameEn: 'Unit Test',
      nameAr: 'اختبار الوحدة',
      icon: '📋',
      color: '#0ea5e9',
      description: hasEnoughCompleted
        ? `Only what you have finished — ${completed.total} items so far`
        : `Finish at least ${MIN_ITEMS} items in a lesson to open this`,
      descriptionAr: hasEnoughCompleted
        ? `فقط ما أكملته — ${completed.total} عنصراً حتى الآن`
        : `أكمل ${MIN_ITEMS} عناصر على الأقل في درس لفتح هذا`,
      category: 'quiz',
      noTopic: true,
      locked: !hasEnoughCompleted,
      featured: true
    },
    {
      id: 'multiple-choice',
      nameEn: 'Multiple Choice',
      nameAr: 'اختيار من متعدد',
      icon: '✓',
      color: '#6366f1',
      description: 'Choose the correct answer from options',
      descriptionAr: 'اختر الإجابة الصحيحة من الخيارات',
      category: 'quiz'
    },
    {
      id: 'scrambled-letters',
      nameEn: 'Unscramble Words',
      nameAr: 'ترتيب الحروف',
      icon: '🔤',
      color: '#8b5cf6',
      description: 'Arrange letters to form the correct word',
      descriptionAr: 'رتب الحروف لتكوين الكلمة الصحيحة',
      category: 'quiz'
    },
    {
      id: 'matching',
      nameEn: 'Match Pairs',
      nameAr: 'مطابقة الأزواج',
      icon: '🔗',
      color: '#ec4899',
      description: 'Match Arabic words with their English translations',
      descriptionAr: 'طابق الكلمات العربية مع معانيها',
      category: 'quiz'
    },
    {
      id: 'fill-blanks',
      nameEn: 'Fill in the Blanks',
      nameAr: 'املأ الفراغات',
      icon: '📝',
      color: '#10b981',
      description: 'Complete the sentence with the correct word',
      descriptionAr: 'أكمل الجملة بالكلمة الصحيحة',
      category: 'quiz'
    },
    {
      id: 'recall',
      nameEn: 'Memory Recall',
      nameAr: 'استدعاء الذاكرة',
      icon: '🧠',
      color: '#f59e0b',
      description: 'Recall the meaning from memory',
      descriptionAr: 'تذكّر المعنى من الذاكرة',
      category: 'quiz'
    },
    {
      id: 'memory-game',
      nameEn: 'Memory Match',
      nameAr: 'لعبة الذاكرة',
      icon: '🧠',
      color: '#8b5cf6',
      description: 'Match pictures with words',
      descriptionAr: 'طابق الصور مع الكلمات',
      category: 'game',
      isGame: true
    },
    {
      id: 'color-matching',
      nameEn: 'Color Matching',
      nameAr: 'مطابقة الألوان',
      icon: '🎨',
      color: '#667eea',
      description: 'Learn colors by matching',
      descriptionAr: 'تعلم الألوان بالمطابقة',
      category: 'game',
      isGame: true
    },
    {
      id: 'number-learning',
      nameEn: 'Number Learning',
      nameAr: 'تعلم الأرقام',
      icon: '🔢',
      color: '#f97316',
      description: 'Learn numbers by counting',
      descriptionAr: 'تعلم الأرقام بالعدّ',
      category: 'game',
      isGame: true
    }
  ];

  const describe = (type) => (ar ? type.descriptionAr || type.description : type.description);
  const isGenerated = selectedQuizType ? GENERATED_TYPES.includes(selectedQuizType.id) : false;

  // Scramble letters for scrambled quiz
  const scrambleWord = (word) => shuffle(word.split(''));

  // Generate matching pairs for matching game
  const generateMatchingGame = () => {
    if (!selectedTopic) return;

    const matchingContent = QUIZ_CONTENT[selectedTopic.id]?.matching;
    if (!matchingContent) return;

    const pairs = [];
    matchingContent.forEach((item, index) => {
      pairs.push(
        { id: `arabic-${index}`, type: 'arabic', content: item.arabic, pairId: index },
        { id: `english-${index}`, type: 'english', content: item.english, pairId: index }
      );
    });

    setMatchingPairs(shuffle(pairs));
    setMatchedPairs([]);
    setSelectedCards([]);
    setAnswers([]);
    setScore(0);
  };

  // Award points and save quiz history when quiz is completed
  useEffect(() => {
    if (!showResults || !userEmail || answers.length === 0 || awardedRef.current) return;
    awardedRef.current = true;

    const totalQuestions = answers.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const isMatching = selectedQuizType?.id === 'matching';

    if (isMatching) {
      // Matching cannot be failed, so it pays per pair plus a completion
      // bonus rather than the "perfect score" bonus a real test earns.
      awardPoints(userEmail, 'MEMORY_PAIR_FOUND', score);
      awardPoints(userEmail, 'QUIZ_COMPLETED');
    } else {
      // Award points based on performance
      if (percentage === 100) {
        awardPoints(userEmail, 'QUIZ_PERFECT_SCORE');
      } else if (percentage >= PASS_PERCENT) {
        awardPoints(userEmail, 'QUIZ_COMPLETED');
      }
      // Award points for each correct answer
      if (score > 0) awardPoints(userEmail, 'QUIZ_QUESTION_CORRECT', score);
      // Passing the unit test is the milestone the curriculum is built around.
      if (selectedQuizType?.id === 'unit-test' && percentage >= PASS_PERCENT) {
        awardPoints(userEmail, 'TEST_PASSED');
      }
    }

    // One celebration, at the end, when it was earned — not one per answer.
    if (percentage >= PASS_PERCENT) setShowCelebration(true);

    // Quiz badges. `checkAchievements` existed but was never called from
    // anywhere, so `first_quiz`, `perfect_quiz` and `quiz_master` could not
    // be earned at all.
    const quizKey = `stellar_quiz_history_${userEmail}`;
    try {
      const history = JSON.parse(localStorage.getItem(quizKey) || '[]');
      checkAchievements(userEmail, 'quiz_completed', {
        score: percentage,
        totalQuizzes: history.length + 1,
        perfectQuizCount: history.filter((h) => h.score === 100).length
          + (percentage === 100 ? 1 : 0),
        // No per-quiz timer exists, so the speed badge is left unclaimed
        // rather than awarded on a number that is not measured. A timer
        // would also reward rushing, which is the opposite of what these
        // learners need.
        completionTime: Infinity
      });
    } catch (e) {
      console.error('Error checking quiz achievements:', e);
    }

    // Save quiz result to history
    try {
      const existing = JSON.parse(localStorage.getItem(quizKey) || '[]');
      const result = {
        quizName: selectedQuizType?.nameEn
          ? `${selectedQuizType.nameEn}${selectedTopic && !selectedQuizType.noTopic ? ` - ${selectedTopic.nameEn || selectedTopic.id}` : ''}`
          : 'Quiz',
        score: percentage,
        correctAnswers: score,
        totalQuestions,
        completedAt: new Date().toISOString()
      };
      existing.unshift(result); // newest first
      localStorage.setItem(quizKey, JSON.stringify(existing.slice(0, 50))); // keep last 50
    } catch (e) {
      console.error('Error saving quiz history:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults, userEmail, score, answers]);

  // Initialize scrambled letters when starting scrambled quiz
  useEffect(() => {
    if (selectedQuizType?.id === 'scrambled-letters' && selectedTopic && currentQuestionIndex >= 0) {
      const content = QUIZ_CONTENT[selectedTopic.id]?.scrambledWords;
      if (content && content[currentQuestionIndex]) {
        setScrambledLetters(scrambleWord(scrambleTarget(content[currentQuestionIndex], language)));
        setUserAnswer('');
      }
    } else if (selectedQuizType?.id === 'matching' && selectedTopic) {
      generateMatchingGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuizType, selectedTopic, currentQuestionIndex, language]);

  const startGenerated = (typeId) => {
    const generated = typeId === 'quick-review'
      ? buildQuickReview(userEmail, language)
      : buildUnitTest(userEmail, language);
    setGeneratedTest(generated);
    // A synthetic topic keeps the rest of this screen (progress bar, score,
    // back button, results) working unchanged.
    setSelectedTopic(typeId === 'quick-review'
      ? { id: 'quick-review', nameEn: 'Quick Review', nameAr: 'مراجعة سريعة', icon: '⚡', color: '#10b981' }
      : { id: 'unit-test', nameEn: 'Your Unit Test', nameAr: 'اختبار وحدتك', icon: '📋', color: '#0ea5e9' });
  };

  const handleQuizTypeSelect = (type) => {
    playClickSound();

    // If it's a game, navigate to the game section instead
    if (type.isGame && onSectionSelect) {
      onSectionSelect(type.id);
      return;
    }

    if (type.locked) {
      voiceOver.speak(
        ar
          ? `أكمل ${MIN_ITEMS} عناصر على الأقل في أي درس لفتح هذا الاختبار`
          : `Finish at least ${MIN_ITEMS} items in a lesson to open this test`,
        true
      );
      return;
    }

    setSelectedQuizType(type);
    setSelectedTopic(null);
    resetQuiz();

    // The generated tests have no topic step — they already span every
    // module — so they are built the moment they are chosen.
    if (GENERATED_TYPES.includes(type.id)) {
      startGenerated(type.id);
    } else {
      setGeneratedTest(null);
    }
  };

  const handleTopicSelect = (topic) => {
    playClickSound();
    // A test topic is locked for exactly as long as its lesson is: a quiz you
    // have not been taught the material for is only a way to fail.
    if (!isTopicUnlocked(userEmail, topic.id, userRole)) {
      voiceOver.speak(lockReason(userEmail, topic.id, language, userRole), true);
      return;
    }

    setSelectedTopic(topic);
    resetQuiz();
  };

  const resetQuiz = () => {
    awardedRef.current = false;
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setShowResults(false);
    setUserAnswer('');
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setMatchingPairs([]);
    setSelectedCards([]);
    setMatchedPairs([]);
    setShowCelebration(false);
  };

  const handleCardClick = (card) => {
    // Don't allow clicking on matched cards or more than 2 cards
    if (matchedPairs.includes(card.id) || selectedCards.length >= 2) return;

    // Don't allow clicking the same card twice
    if (selectedCards.some(c => c.id === card.id)) return;

    playClickSound();
    if (card.type === 'arabic') voiceOver.speak(card.content, true);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;

      // Check if they match (same pairId but different types)
      if (first.pairId === second.pairId && first.type !== second.type) {
        // Match found!
        playCorrectSound();
        setTimeout(() => {
          const nextMatched = [...matchedPairs, first.id, second.id];
          setMatchedPairs(nextMatched);
          setSelectedCards([]);
          setScore(score + 1);

          // Check if all pairs are matched. The results screen reads
          // `answers.length` as the question count, which was never filled in
          // for matching — so it divided by zero and showed "Infinity%", and
          // the points effect (guarded on answers) never fired.
          if (nextMatched.length === matchingPairs.length) {
            const pairCount = matchingPairs.length / 2;
            setAnswers(Array.from({ length: pairCount }, (_, i) => ({ questionIndex: i, correct: true })));
            setTimeout(() => setShowResults(true), 500);
          }
        }, 500);
      } else {
        // No match
        playWrongSound();
        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const isCardSelected = (card) => selectedCards.some(selected => selected.id === card.id);
  const isCardMatched = (card) => matchedPairs.includes(card.id);

  /** The question bank in play, with per-language shaping applied. */
  const getContent = () => {
    if (!selectedQuizType || !selectedTopic) return null;
    if (isGenerated) return generatedTest?.questions || null;
    const bank = QUIZ_CONTENT[selectedTopic.id];
    if (!bank) return null;
    if (selectedQuizType.id === 'multiple-choice') return bank.multipleChoice;
    if (selectedQuizType.id === 'fill-blanks') return bank.fillBlanks;
    if (selectedQuizType.id === 'recall') return bank.recall;
    if (selectedQuizType.id === 'scrambled-letters') return bank.scrambledWords;
    return null;
  };

  const handleAnswerSelect = (answerIndex, correctIndexOverride = null) => {
    if (showFeedback) return; // Prevent multiple selections

    setSelectedAnswer(answerIndex);

    const content = getContent();
    if (content && content[currentQuestionIndex]) {
      const correctIndex = correctIndexOverride ?? content[currentQuestionIndex].correct;
      const correct = correctIndex === answerIndex;
      setIsCorrect(correct);
      setShowFeedback(true);

      // A chime and a spoken phrase per answer; the celebration popup waits
      // for the results screen. A popup on every one of twelve questions was
      // twelve interruptions in the middle of a test.
      if (correct) {
        setScore(score + 1);
        playCorrectSound();
      } else {
        playWrongSound();
      }
      // Varied wording, so twenty answers in a row do not sound like a
      // recording — see speechPhrasing.js.
      voiceOver.speak(answerPhrase({ language, correct }), true);

      setAnswers([...answers, { questionIndex: currentQuestionIndex, correct }]);

      setTimeout(() => {
        if (currentQuestionIndex < content.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedAnswer(null);
          setShowFeedback(false);
        } else {
          setShowResults(true);
        }
      }, 1500);
    }
  };

  const handleScrambledSubmit = () => {
    const content = QUIZ_CONTENT[selectedTopic.id]?.scrambledWords;
    if (content && content[currentQuestionIndex]) {
      const target = scrambleTarget(content[currentQuestionIndex], language);
      const correct = userAnswer.toLowerCase().trim() === target.toLowerCase();
      setIsCorrect(correct);
      setShowFeedback(true);

      if (correct) {
        setScore(score + 1);
        playCorrectSound();
      } else {
        playWrongSound();
      }
      voiceOver.speak(answerPhrase({ language, correct }), true);

      setAnswers([...answers, { questionIndex: currentQuestionIndex, correct }]);

      setTimeout(() => {
        if (currentQuestionIndex < content.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setShowFeedback(false);
        } else {
          setShowResults(true);
        }
      }, 1500);
    }
  };

  const handleLetterClick = (letter, index) => {
    if (showFeedback) return;
    playClickSound();
    setUserAnswer(userAnswer + letter);
    setScrambledLetters(scrambledLetters.filter((_, i) => i !== index));
  };

  const handleBackspace = () => {
    if (userAnswer.length > 0) {
      playClickSound();
      const lastLetter = userAnswer[userAnswer.length - 1];
      setUserAnswer(userAnswer.slice(0, -1));
      setScrambledLetters([...scrambledLetters, lastLetter]);
    }
  };

  const backLabel = ar ? 'رجوع' : 'Back';

  // Render Quiz Type Selection
  if (!selectedQuizType) {
    const quizOptions = quizTypes.filter(type => type.category === 'quiz');
    const gameOptions = quizTypes.filter(type => type.category === 'game');

    return (
      <div className="quiz-center">
        <motion.div
          className="quiz-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="quiz-title">
            <span className="title-emoji" aria-hidden="true">🎯</span>{' '}
            {ar ? 'اختبر نفسك' : 'Test Yourself'}
          </h2>
          <p className="quiz-subtitle">
            {ar
              ? 'اختر اختباراً أو لعبة لبدء التعلم'
              : 'Select a quiz or game to start learning'}
          </p>
        </motion.div>

        {/* Quizzes Section */}
        <div className="quiz-section">
          <h3 className="quiz-section-title">
            {ar ? '📝 الاختبارات' : '📝 Quizzes'}
          </h3>
          <div className="quiz-types-grid">
            {quizOptions.map((type, index) => (
              <motion.div
                key={type.id}
                className={`quiz-type-card ${type.locked ? 'is-locked' : ''} ${type.featured ? 'is-featured' : ''}`}
                role="button"
                tabIndex={0}
                aria-disabled={!!type.locked}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => handleQuizTypeSelect(type)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleQuizTypeSelect(type);
                  }
                }}
                style={{ '--quiz-accent': type.color }}
              >
                <div className="quiz-type-icon">
                  {type.locked ? '🔒' : type.icon}
                </div>
                <h3 className="quiz-type-name">
                  {ar ? type.nameAr : type.nameEn}
                </h3>
                <p className="quiz-type-description">
                  {describe(type)}
                </p>
                {type.featured && !type.locked && (
                  <span className="quiz-type-tag">
                    {ar ? 'من تعلمك فقط' : 'From your learning only'}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Interactive Games Section */}
        <div className="quiz-section">
          <h3 className="quiz-section-title">
            {ar ? '🎮 الألعاب التفاعلية' : '🎮 Interactive Games'}
          </h3>
          <div className="quiz-types-grid">
            {gameOptions.map((type, index) => (
              <motion.div
                key={type.id}
                className="quiz-type-card"
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (quizOptions.length + index) * 0.06 }}
                onClick={() => handleQuizTypeSelect(type)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleQuizTypeSelect(type);
                  }
                }}
                style={{ '--quiz-accent': type.color }}
              >
                <div className="quiz-type-icon">
                  {type.icon}
                </div>
                <h3 className="quiz-type-name">
                  {ar ? type.nameAr : type.nameEn}
                </h3>
                <p className="quiz-type-description">
                  {describe(type)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render Topic Selection
  if (!selectedTopic) {
    return (
      <div className="quiz-center">
        <motion.div
          className="quiz-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="back-button" onClick={() => { playClickSound(); setSelectedQuizType(null); }}>
            ← {backLabel}
          </button>
          <h2 className="quiz-title">
            {ar ? selectedQuizType.nameAr : selectedQuizType.nameEn}
          </h2>
          <p className="quiz-subtitle">
            {ar ? 'اختر موضوعًا' : 'Select a topic'}
          </p>
        </motion.div>

        <div className="topics-grid">
          {TOPICS.map((topic, index) => {
            // A topic locks and unlocks with its lesson — see
            // moduleUnlockUtils.js. The reason replaces the name, so a locked
            // tile explains itself instead of just refusing to open.
            const locked = !isTopicUnlocked(userEmail, topic.id, userRole);
            const reason = locked
              ? lockReason(userEmail, topic.id, language, userRole)
              : '';

            return (
              <motion.div
                key={topic.id}
                className={`topic-card ${locked ? 'is-locked' : ''}`}
                role="button"
                tabIndex={0}
                aria-disabled={locked}
                title={reason || undefined}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => handleTopicSelect(topic)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleTopicSelect(topic);
                  }
                }}
                style={{ '--quiz-accent': topic.color }}
              >
                <div className="topic-icon">
                  {locked ? '🔒' : topic.icon}
                </div>
                <h3 className="topic-name">
                  {ar ? topic.nameAr : topic.nameEn}
                </h3>
                {locked && <p className="topic-lock-reason">{reason}</p>}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Results
  if (showResults) {
    const totalQuestions = answers.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    // The same threshold the curriculum uses to unlock the next module, read
    // from one place so the two can never disagree about what "passed" means.
    const passed = percentage >= PASS_PERCENT;
    const missed = answers.filter((answer) => !answer.correct).length;

    return (
      <div className="quiz-center">
        <motion.div
          className="quiz-results"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="results-icon">
            {passed ? '🎉' : '📚'}
          </div>
          <h2 className="results-title">
            {ar ? 'النتيجة النهائية' : 'Test Complete!'}
          </h2>
          <div className="results-score">
            <div className="score-circle" style={{ borderColor: passed ? '#10b981' : '#f59e0b' }}>
              <span className="score-percentage">{percentage}%</span>
              <span className="score-fraction">{score}/{totalQuestions}</span>
            </div>
          </div>
          <p className="results-message">
            {passed
              ? (ar ? 'رائع! لقد نجحت!' : 'Great job! You passed!')
              : (ar
                  ? `تحتاج ${PASS_PERCENT}% للنجاح — حاول مرة أخرى!`
                  : `You need ${PASS_PERCENT}% to pass — give it another go!`)}
          </p>

          {/* Specific, non-judgemental: what to look at, not "you failed". */}
          {!passed && missed > 0 && (
            <p className="results-coverage">
              {ar
                ? `${missed} ${missed === 1 ? 'سؤال واحد' : 'أسئلة'} لم تُجب صحيحاً. ارجع إلى الدرس، ثم جرّب مرة أخرى.`
                : `${missed} ${missed === 1 ? 'question' : 'questions'} to look at again. Revisit the lesson, then try once more.`}
            </p>
          )}

          {/* What the generated test actually covered. Without this the score
              is a bare number with no scope attached. */}
          {isGenerated && (
            <p className="results-coverage">
              {ar
                ? `بُني هذا الاختبار من ${completed.total} عنصراً أكملتها: ${completed.alphabet} حرفاً، ${completed.colors} لوناً، ${completed.words} كلمة، ${completed.sentences} جملة.`
                : `Built from the ${completed.total} items you have finished: ${completed.alphabet} letters, ${completed.colors} colours, ${completed.words} words, ${completed.sentences} sentences.`}
            </p>
          )}

          <div className="results-buttons">
            <button
              className="btn btn-primary"
              onClick={() => {
                playClickSound();
                resetQuiz();
                // A retake of a generated test is regenerated, not replayed:
                // the learner may have finished more since, and a reshuffle
                // stops it being the same paper twice.
                if (isGenerated) startGenerated(selectedQuizType.id);
              }}
            >
              {ar ? 'إعادة المحاولة' : 'Try Again'}
            </button>
            {!selectedQuizType.noTopic && (
              <button className="btn btn-secondary" onClick={() => { playClickSound(); setSelectedTopic(null); }}>
                {ar ? 'اختر موضوعًا آخر' : 'Choose Another Topic'}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => {
                playClickSound();
                setSelectedQuizType(null);
                setSelectedTopic(null);
                setGeneratedTest(null);
              }}
            >
              {ar ? 'العودة إلى الاختبارات' : 'Back to Tests'}
            </button>
          </div>
        </motion.div>

        <CelebrationPopup
          show={showCelebration}
          language={language}
          userEmail={userEmail}
          message={ar ? 'أحسنت! نجحت في الاختبار' : 'You passed the test!'}
          onClose={() => setShowCelebration(false)}
        />
      </div>
    );
  }

  // Handle matching game separately
  if (selectedQuizType.id === 'matching') {
    const matchingContent = QUIZ_CONTENT[selectedTopic.id]?.matching;

    if (!matchingContent) {
      return (
        <div className="quiz-center">
          <div className="quiz-error">
            <p>{ar ? 'هذا الاختبار غير متوفر حاليًا' : 'This test is not available yet'}</p>
            <button className="btn btn-primary" onClick={() => setSelectedTopic(null)}>
              {ar ? 'رجوع' : 'Go Back'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="quiz-center">
        <motion.div
          className="quiz-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="quiz-progress-header">
            <button className="back-button" onClick={() => { playClickSound(); setSelectedTopic(null); }}>
              ← {backLabel}
            </button>
            <h3 className="matching-title">
              {ar ? 'طابق الكلمات' : 'Match the Pairs'}
            </h3>
            <div className="quiz-score-display">
              <span className="score-label">{ar ? 'النقاط:' : 'Score:'}</span>
              <span className="score-value">{score}/{matchingContent.length}</span>
            </div>
          </div>

          <div className="matching-instructions">
            {ar
              ? 'اضغط على البطاقات لمطابقة الكلمات العربية مع معانيها'
              : 'Click on cards to match Arabic words with their English translations'
            }
          </div>

          <div className="matching-grid">
            {matchingPairs.map((card, cardIndex) => (
              <motion.div
                key={card.id}
                className={`matching-card ${
                  isCardSelected(card) ? 'selected' : ''
                } ${isCardMatched(card) ? 'matched' : ''}`}
                role="button"
                tabIndex={isCardMatched(card) ? -1 : 0}
                aria-pressed={isCardSelected(card)}
                onClick={() => handleCardClick(card)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCardClick(card);
                  }
                }}
                whileHover={!isCardMatched(card) ? { y: -6, scale: 1.02 } : {}}
                whileTap={!isCardMatched(card) ? { scale: 0.96 } : {}}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: cardIndex * 0.04 }}
              >
                <div className="card-content">
                  {card.content}
                  {/* Arabic cards carry their phonetic spelling, so matching is
                      reading rather than shape-matching. */}
                  {card.type === 'arabic' && transliterate(card.content) && (
                    <span className="card-phonetic">{transliterate(card.content)}</span>
                  )}
                </div>
                {isCardMatched(card) && (
                  <motion.div
                    className="match-checkmark"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Quiz Questions
  const content = getContent();
  const currentQuestion = content?.[currentQuestionIndex];

  if (!content || !currentQuestion) {
    // The generated tests fail differently from the fixed quizzes: there is
    // nothing wrong with them, the learner just has not finished enough yet.
    // Saying "not available" would read as a bug, so it says what to do.
    return (
      <div className="quiz-center">
        <div className="quiz-error">
          <p>
            {isGenerated
              ? (ar
                  ? `أكمل ${MIN_ITEMS} عناصر على الأقل في أي درس، ثم سيبنى اختبارك منها.`
                  : `Finish at least ${MIN_ITEMS} items in any lesson, and your test will be built from them.`)
              : (ar ? 'هذا الاختبار غير متوفر حاليًا' : 'This test is not available yet')}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedTopic(null);
              setSelectedQuizType(null);
            }}
          >
            {ar ? 'رجوع' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const speakable = (text) => (
    <div
      className="arabic-display-large quiz-speakable"
      role="button"
      tabIndex={0}
      title={ar ? 'انقر لسماع النطق' : 'Click to hear it'}
      onClick={() => voiceOver.speak(text, true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          voiceOver.speak(text, true);
        }
      }}
    >
      {text}
      <span className="quiz-speak-hint" aria-hidden="true">🔊</span>
    </div>
  );

  const renderOptions = (options, correctIndex) => (
    <div className="options-grid">
      {options.map((option, index) => (
        <button
          key={index}
          className={`option-btn ${selectedAnswer === index ? (isCorrect ? 'correct' : 'incorrect') : ''} ${showFeedback && !isCorrect && index === correctIndex ? 'reveal' : ''}`}
          onClick={() => handleAnswerSelect(index, correctIndex)}
          disabled={showFeedback}
        >
          {option}
          {/* Options that are Arabic script get their own phonetic line, so
              choosing is not guesswork. */}
          {transliterate(option) && (
            <span className="option-phonetic">{transliterate(option)}</span>
          )}
        </button>
      ))}
    </div>
  );

  const renderFeedback = (correctAnswerText) => showFeedback && (
    <motion.div
      className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {isCorrect
        ? `✓ ${ar ? 'صحيح!' : 'Correct!'}`
        : `${ar ? 'الإجابة الصحيحة: ' : 'The answer was: '}${correctAnswerText}`}
    </motion.div>
  );

  const fillBlank = selectedQuizType.id === 'fill-blanks'
    ? localizedFillBlank(selectedTopic.id, currentQuestion, currentQuestionIndex, language)
    : null;

  return (
    <div className="quiz-center">
      <motion.div
        className="quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Quiz Header */}
        <div className="quiz-progress-header">
          <button className="back-button" onClick={() => { playClickSound(); setSelectedTopic(null); }}>
            ← {backLabel}
          </button>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{
                width: `${((currentQuestionIndex + 1) / content.length) * 100}%`,
                backgroundColor: selectedTopic.color
              }}
            />
          </div>
          <span className="quiz-progress-text">
            {currentQuestionIndex + 1}/{content.length}
          </span>
        </div>

        {/* Quiz Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            className="quiz-question-container"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* Generated tests — built from the learner's completed items. */}
            {isGenerated && (
              <div className="quiz-question">
                {currentQuestion.promptArabic && (
                  <>
                    {speakable(currentQuestion.promptArabic)}
                    {/* Phonetic spelling under every piece of Arabic script —
                        a learner who cannot read the script yet has no way in
                        without it. */}
                    <div className="quiz-phonetic">
                      {currentQuestion.hint || transliterate(currentQuestion.promptArabic)}
                    </div>
                  </>
                )}
                <h3 className="question-text">{currentQuestion.prompt}</h3>
                {renderOptions(currentQuestion.options, currentQuestion.correct)}
                {renderFeedback(currentQuestion.options[currentQuestion.correct])}
              </div>
            )}

            {/* Multiple Choice Quiz */}
            {selectedQuizType.id === 'multiple-choice' && (
              <div className="quiz-question">
                {speakable(currentQuestion.arabic)}
                {transliterate(currentQuestion.arabic) && (
                  <div className="quiz-phonetic">{transliterate(currentQuestion.arabic)}</div>
                )}
                <h3 className="question-text">{questionText(selectedTopic.id, currentQuestion, language)}</h3>
                {renderOptions(currentQuestion.options, currentQuestion.correct)}
                {renderFeedback(currentQuestion.options[currentQuestion.correct])}
              </div>
            )}

            {/* Scrambled Letters Quiz */}
            {selectedQuizType.id === 'scrambled-letters' && (
              <div className="quiz-question scrambled-quiz">
                {speakable(currentQuestion.arabic)}
                {transliterate(currentQuestion.arabic) && (
                  <div className="quiz-phonetic">{transliterate(currentQuestion.arabic)}</div>
                )}
                <p className="hint-text">💡 {hintText(currentQuestion.hint, language)}</p>
                <h3 className="question-text">
                  {ar ? 'رتب الحروف لتكوين الكلمة' : 'Arrange the letters to form the word'}
                </h3>

                <div className={`answer-display ${ar ? 'answer-display--arabic' : ''}`} dir={ar ? 'rtl' : 'ltr'}>
                  {userAnswer || (
                    <span className="placeholder">
                      {ar ? 'اضغط على الحروف أدناه' : 'Click letters below'}
                    </span>
                  )}
                </div>

                <div className="scrambled-letters" dir={ar ? 'rtl' : 'ltr'}>
                  {scrambledLetters.map((letter, index) => (
                    <button
                      key={index}
                      className="letter-btn"
                      onClick={() => handleLetterClick(letter, index)}
                      disabled={showFeedback}
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                <div className="scrambled-controls">
                  <button
                    className="btn btn-secondary"
                    onClick={handleBackspace}
                    disabled={showFeedback || userAnswer.length === 0}
                  >
                    ⌫ {ar ? 'حذف' : 'Backspace'}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleScrambledSubmit}
                    disabled={showFeedback || userAnswer.length === 0}
                  >
                    ✓ {ar ? 'تحقق' : 'Check'}
                  </button>
                </div>

                {renderFeedback(scrambleTarget(currentQuestion, language))}
              </div>
            )}

            {/* Recall Quiz - Multiple Choice */}
            {selectedQuizType.id === 'recall' && (
              <div className="quiz-question">
                {speakable(currentQuestion.arabic)}
                {transliterate(currentQuestion.arabic) && (
                  <div className="quiz-phonetic">{transliterate(currentQuestion.arabic)}</div>
                )}
                <p className="hint-text">💡 {hintText(currentQuestion.hint, language)}</p>
                <h3 className="question-text">
                  {ar ? 'ما معنى هذه الكلمة؟' : 'What does this mean?'}
                </h3>
                {renderOptions(currentQuestion.options, currentQuestion.correct)}
                {renderFeedback(currentQuestion.english)}
              </div>
            )}

            {/* Fill in the Blanks Quiz */}
            {selectedQuizType.id === 'fill-blanks' && fillBlank && (
              <div className="quiz-question">
                {speakable(currentQuestion.arabic)}
                {transliterate(currentQuestion.arabic) && (
                  <div className="quiz-phonetic">{transliterate(currentQuestion.arabic)}</div>
                )}
                <h3 className="question-text" dir={ar ? 'rtl' : 'ltr'}>{fillBlank.sentence}</h3>
                {renderOptions(fillBlank.options, fillBlank.correct)}
                {renderFeedback(fillBlank.options[fillBlank.correct])}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Score Display */}
        <div className="quiz-score-display">
          <span className="score-label">{ar ? 'النقاط:' : 'Score:'}</span>
          <span className="score-value">{score}/{content.length}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizCenter;
