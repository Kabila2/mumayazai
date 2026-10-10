import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LearnHub from "./LearnHub";
import ArabicAlphabetLearning from "./ArabicAlphabetLearning";
import ArabicColorsLearning from "./ArabicColorsLearning";
import ArabicWordsLearning from "./ArabicWordsLearning";
import ArabicSentencesLearning from "./ArabicSentencesLearning";
import ArabicWordBuilder from "./ArabicWordBuilder";
import ChatInterface from "./ChatInterface";
import VoiceInterface from "./VoiceInterface";
import MemoryGame from "./MemoryGame";
import ColorMatchingGame from "./ColorMatchingGame";
import NumberLearningGame from "./NumberLearningGame";
import CollaborativeDrawingBoard from "./CollaborativeDrawingBoard";
import SentenceBuilder from "./SentenceBuilder";
import LetterWordBuilder from "./LetterWordBuilder";
import QuizCenter from "./QuizCenter";
import TeacherParentChat from "./TeacherParentChat";
import DarkModeToggle from "./DarkModeToggle";
import HighContrastToggle from "./HighContrastToggle";
import ProfileSettings from "./ProfileSettings";
import StreakCounter from "./StreakCounter";
import TotalPointsBar from "./TotalPointsBar";
import ProgressDashboard from "./ProgressDashboard";
import ArabicHandwritingPractice from "./ArabicHandwritingPractice";
import InteractiveStoryReader from "./InteractiveStoryReader";
import HomeworkSystem from "./HomeworkSystem";
import ClassManagement from "./ClassManagement";
import OnboardingTutorial from "./OnboardingTutorial";
import StudentProgressReport from "./StudentProgressReport";
import TeacherDashboard from "./TeacherDashboard";
import ParentDashboard from "./ParentDashboard";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import stellarMuiTheme from "../muiTheme";
import { LogOut, Home, SlidersHorizontal, ArrowRight, ArrowLeft } from 'lucide-react';
import HomeLeaderboard from "./HomeLeaderboard";
import RewardsStore from "./RewardsStore";
import CollapsedCardsBox from "./CollapsedCardsBox";
import ComfortPanel from "./ComfortPanel";
import DailyGoalRing from "./DailyGoalRing";
import BreakNudge from "./BreakNudge";
import { playClickSound, playWhooshSound } from '../utils/soundEffects';
import { getTotalUnreadCount, getInitials } from '../utils/conversationUtils';
import { getModuleProgress } from '../utils/progressUtils';
import { touchStreak } from '../utils/streakUtils';
import { recordSectionVisit } from '../utils/achievementsSystem';
import { getComfort, isCalmMode, COMFORT_CHANGED_EVENT } from '../utils/comfortSettings';
import {
  getCurriculumState,
  isSectionUnlocked,
  getNextModule,
  lockReason,
  PASS_PERCENT
} from '../utils/moduleUnlockUtils';
import './ArabicLearningPlatform.css';

/**
 * Sections that keep the total-points bar on screen: everything reachable from
 * the Learn hub, plus the quiz centre and the activities it launches. Deliberately
 * NOT home, progress, chat, voice, comms or the dashboards — the bar is there to
 * show points moving while the learner earns them, and those screens either show
 * the total already or have nothing to do with earning it.
 */
const POINTS_BAR_SECTIONS = [
  // Learning
  'learn', 'alphabet', 'colors', 'words', 'sentences',
  'handwriting', 'story', 'homework', 'drawing',
  'wordbuilder', 'sentencebuilder', 'letterwordbuilder',
  // Quiz & the games it launches
  'quiz', 'difficulty-selection', 'memory-game', 'color-matching', 'number-learning'
];

/** Sections that light up the "Learn" and "Test Yourself" nav links. */
const LEARN_SECTIONS = ['learn', 'alphabet', 'colors', 'words', 'sentences', 'handwriting', 'story', 'homework', 'drawing'];
const PRACTICE_SECTIONS = ['quiz', 'wordbuilder', 'letterwordbuilder', 'sentencebuilder', 'difficulty-selection',
  'memory-game', 'color-matching', 'number-learning'];

/** Immersive screens that bring their own header (and their own way back home). */
const NAV_HIDDEN_SECTIONS = ['chat', 'voice', 'teacherchat'];

/** Games that ask for a difficulty before they start. */
const GAME_SECTIONS = ['memory-game', 'color-matching', 'number-learning'];

/** Where the last chosen game difficulty is remembered between sessions. */
const DIFFICULTY_KEY = 'stellar_game_difficulty';

const DIFFICULTY_LEVELS = [
  { id: 'easy', labelEn: 'Easy', labelAr: 'سهل', emoji: '😊', color: '#10b981',
    hintEn: 'Fewer choices, no timer', hintAr: 'خيارات أقل، بدون مؤقت' },
  { id: 'medium', labelEn: 'Medium', labelAr: 'متوسط', emoji: '😎', color: '#f59e0b',
    hintEn: 'A few more choices', hintAr: 'خيارات أكثر قليلاً' },
  { id: 'hard', labelEn: 'Hard', labelAr: 'صعب', emoji: '🔥', color: '#ef4444',
    hintEn: 'More rounds, with a timer', hintAr: 'جولات أكثر مع مؤقت' }
];

/**
 * Sections a teacher or parent account may open.
 *
 * Both roles used to get the learner's entire app — every lesson, every game,
 * the AI tutor, the student progress dashboard — plus their own tools on top.
 * That is the wrong shape for both of them: a parent opening the app to check
 * on their child had to scroll past sixteen learning tiles first, and a teacher
 * marking homework had a student leaderboard and a quiz centre in the way.
 * These accounts now see their dashboards, their messages and their reports,
 * and nothing else.
 *
 * This is enforced in `handleSectionChange` as well as in what gets rendered,
 * so a stale link or a leftover state value cannot land them on a locked screen.
 */
const STAFF_SECTIONS = [
  'home',
  'teacherdashboard', 'parentdashboard',
  'teacherchat', 'progressreport', 'classmanagement',
  'homework'   // teachers set and mark it; parents see what was set
];

/** True for the two roles that are not learners. */
const isStaffRole = (role) => role === 'teacher' || role === 'parent';

/**
 * A home-page tile whose module is still locked. Shown INSIDE the collapsed
 * "more" box rather than in the main grid, so the page only ever offers what
 * can actually be started — but still visible on demand, because a path you
 * cannot see the end of is demotivating rather than focusing.
 */
const LockedCard = ({ card, reason }) => (
  <div
    className="section-card section-card--locked"
    style={{ '--card-accent': card.accent }}
    aria-disabled="true"
  >
    <div className="card-icon card-icon--locked" aria-hidden="true">🔒</div>
    <h3 className="card-title">{card.title}</h3>
    <p className="card-description card-description--locked">{reason}</p>
  </div>
);

/**
 * A home-page tile. Rendered as a real keyboard target (Enter / Space) rather than
 * a bare clickable div; the per-card accent drives its icon tile, hover border and
 * progress bar through --card-accent.
 */
const SectionCard = ({ card, index, onSelect, children, isNext = false, nextLabel }) => (
  <motion.div
    className={`section-card home-card--${card.id} ${isNext ? 'section-card--next' : ''}`}
    style={{ '--card-accent': card.accent }}
    role="button"
    tabIndex={0}
    onClick={() => onSelect(card.id)}
    onKeyDown={(event) => {
      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onSelect(card.id);
      }
    }}
    whileHover={{ y: -3 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(0.1 + index * 0.03, 0.6), duration: 0.3 }}
  >
    {card.badge > 0 && <span className="card-unread-badge">{card.badge}</span>}
    {/* The one lesson the learner should do next. With the rest of the path
        locked behind it, saying so removes the last bit of guesswork. */}
    {isNext && nextLabel && <span className="card-next-badge">{nextLabel}</span>}
    <div className="card-icon" aria-hidden="true">{card.icon}</div>
    <h3 className="card-title">{card.title}</h3>
    <p className="card-description">{card.description}</p>
    {children}
  </motion.div>
);

/**
 * PLATFORM ACCESS LEVELS:
 *
 * ALL USERS (Students, Teachers, Parents, Children):
 * - Full access to all learning components:
 *   ✓ Alphabet, Colors, Words, Sentences
 *   ✓ Word Builder, Memory Game, Test Yourself
 *   ✓ Drawing Board, Chat Assistant, Voice Assistant
 *   ✓ Points Tracker, Leaderboard
 *
 * TEACHERS & PARENTS ONLY (Additional Features):
 * - Teacher-Parent Communication (exclusive messaging system)
 * - Unread message notifications
 * - Account role badges
 *
 * This ensures teachers and parents can:
 * 1. Learn and explore content just like students
 * 2. PLUS communicate with each other about student progress
 */
const ArabicLearningPlatform = ({
  t,
  language,
  fontSize,
  highContrast,
  reducedMotion,
  assistantTitle,
  currentPreference,
  onSignOut,
  voices,
  selectedVoice,
  setSelectedVoice,
  speed,
  setSpeed,
  pitch,
  setPitch,
  setLanguage,
  speak
}) => {
  const [currentSection, setCurrentSection] = useState('home'); // 'home', 'learn', 'alphabet', 'colors', 'words', 'sentences', 'wordbuilder', 'chat', 'voice', 'memory-game', 'color-matching', 'number-learning', 'drawing', 'sentencebuilder', 'letterwordbuilder', 'quiz', 'teacherchat', 'progress', 'handwriting', 'story', 'homework', 'classmanagement', 'progressreport', 'teacherdashboard', 'parentdashboard'
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  // The difficulty the learner picked last time is only a default: every game
  // asks again on the way in. It used to be asked once per session and then
  // silently reused, so a learner who picked "hard" to try it could not get
  // back to "easy" without reloading.
  const [gameDifficulty, setGameDifficulty] = useState(
    () => localStorage.getItem(DIFFICULTY_KEY) || null
  );
  const [pendingGameSection, setPendingGameSection] = useState(null);
  const [showComfort, setShowComfort] = useState(false);
  const [calmMode, setCalmMode] = useState(() => isCalmMode(getComfort()));
  // A letter the learner asked to practise writing, carried from the alphabet
  // lesson into the handwriting screen.
  const [handwritingLetterIndex, setHandwritingLetterIndex] = useState(null);
  const [userProgress, setUserProgress] = useState({
    alphabetProgress: 0,
    colorsProgress: 0,
    totalSessions: 0,
    streak: 0
  });
  const platformRef = useRef(null);
  const comfortButtonRef = useRef(null);

  // Check if first-time user
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('stellar_onboarding_completed');
    if (hasCompletedOnboarding || currentSection !== 'home' || showOnboarding) return undefined;
    // Show onboarding after a short delay
    const timer = setTimeout(() => setShowOnboarding(true), 1000);
    return () => clearTimeout(timer);
  }, [currentSection, showOnboarding]);

  // Count today towards the streak as soon as the app opens, on whatever
  // screen — it used to only happen when the streak widget rendered.
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('stellar_session') || '{}');
      if (session.email) touchStreak(session.email);
    } catch (error) {
      // No session.
    }
  }, []);

  // The comfort button in the nav shows whether calm mode is on.
  useEffect(() => {
    const sync = () => setCalmMode(isCalmMode(getComfort()));
    window.addEventListener(COMFORT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COMFORT_CHANGED_EVENT, sync);
  }, []);

  // Moving to another screen closes the comfort panel: a settings sheet
  // hanging over a lesson the learner just opened is one more thing in the way.
  useEffect(() => {
    setShowComfort(false);
  }, [currentSection]);

  // Load user progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('arabic_learning_progress');
    if (savedProgress) {
      try {
        setUserProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.warn('Failed to load user progress:', error);
      }
    }
  }, []);

  // Monitor unread messages count
  useEffect(() => {
    // Counted from the signed-in user's own conversations, so the badge is
    // right before the chat screen is ever opened and never shows another account's count
    const updateUnreadCount = () => {
      try {
        const session = JSON.parse(localStorage.getItem('stellar_session') || '{}');
        setUnreadMessagesCount(session.email ? getTotalUnreadCount(session.email) : 0);
      } catch (error) {
        setUnreadMessagesCount(0);
      }
    };

    // Initial load
    updateUnreadCount();

    // Listen for storage changes
    window.addEventListener('storage', updateUnreadCount);

    // Poll every 3 seconds as backup
    const interval = setInterval(updateUnreadCount, 3000);

    return () => {
      window.removeEventListener('storage', updateUnreadCount);
      clearInterval(interval);
    };
  }, []);

  // Load and monitor profile picture
  useEffect(() => {
    const loadProfilePicture = () => {
      const userEmail = getCurrentUserEmail();
      if (userEmail) {
        const users = JSON.parse(localStorage.getItem('stellar_users') || '{}');
        const user = users[userEmail.toLowerCase()];
        setCurrentProfilePicture(user?.profilePicture || null);
      }
    };

    // Initial load
    loadProfilePicture();

    // Listen for profile picture updates
    const handleProfileUpdate = () => {
      loadProfilePicture();
    };

    window.addEventListener('profilePictureUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
    };
  }, []);


  // Save user progress to localStorage
  const saveProgress = (newProgress) => {
    const updatedProgress = { ...userProgress, ...newProgress };
    setUserProgress(updatedProgress);
    localStorage.setItem('arabic_learning_progress', JSON.stringify(updatedProgress));
  };

  const updateSessionCount = () => {
    saveProgress({
      totalSessions: userProgress.totalSessions + 1,
      streak: userProgress.streak + 1
    });
  };

  const getLearningPrompt = (section) => {
    const basePrompt = language === 'ar'
      ? 'أنت مساعد تعليمي للغة العربية. ساعد الطلاب في تعلم'
      : 'You are an Arabic learning assistant. Help students learn';

    const sectionPrompts = {
      alphabet: language === 'ar'
        ? `${basePrompt} الحروف العربية. قدم شرحاً مبسطاً ومناسباً للأطفال مع أمثلة تفاعلية.`
        : `${basePrompt} the Arabic alphabet. Provide simple, child-friendly explanations with interactive examples.`,
      colors: language === 'ar'
        ? `${basePrompt} الألوان العربية. اربط الألوان بأشياء من الحياة اليومية واجعل التعلم ممتعاً.`
        : `${basePrompt} Arabic colors. Connect colors to everyday objects and make learning fun.`,
      general: language === 'ar'
        ? `${basePrompt} اللغة العربية بطريقة تفاعلية وممتعة. استخدم أمثلة من الحياة اليومية.`
        : `${basePrompt} Arabic in an interactive and fun way. Use everyday life examples.`
    };

    return sectionPrompts[section] || sectionPrompts.general;
  };

  const handleSectionChange = (section) => {
    playClickSound(); // Play click sound on section change

    const role = getCurrentUserRole();

    // Teachers and parents are held to their own screens. Enforced here as
    // well as in what the home page offers, so a stale state value or a tile
    // that slipped through cannot drop them into the learner's app.
    if (isStaffRole(role) && !STAFF_SECTIONS.includes(section)) {
      setCurrentSection('home');
      return;
    }

    // Rewards is a modal, not a section — it has to stay reachable from any
    // screen, and pushing it into the section switch would unmount whatever
    // the learner was doing.
    if (section === 'rewards') {
      setShowRewards(true);
      return;
    }

    // A locked lesson is never offered on the home page, but a learner can
    // still reach one through the Learn hub or a stale link.
    if (!isSectionUnlocked(getCurrentUserEmail(), section, role || 'student')) {
      setCurrentSection('learn');
      return;
    }

    // Games always ask for a difficulty on the way in (the last choice is
    // pre-selected), so the learner is never stuck with an old pick.
    if (GAME_SECTIONS.includes(section)) {
      setPendingGameSection(section);
      setCurrentSection('difficulty-selection');
      return;
    }

    setCurrentSection(section);
    if (section === 'alphabet' || section === 'colors') {
      updateSessionCount();
    }

    // The Explorer badge, and the time-of-day badges, are checked on every
    // section visit — they existed but were never triggered from anywhere.
    const email = getCurrentUserEmail();
    if (email && section !== 'home' && !isStaffRole(role)) {
      recordSectionVisit(email, section);
    }

    // Play whoosh for transitions
    if (section !== 'home') {
      setTimeout(() => playWhooshSound(), 100);
    }
  };

  const handleDifficultySelect = (difficulty) => {
    playClickSound();
    setGameDifficulty(difficulty);
    try {
      localStorage.setItem(DIFFICULTY_KEY, difficulty);
    } catch (error) {
      // Storage unavailable — it still applies for this session.
    }
    const email = getCurrentUserEmail();
    if (email && pendingGameSection) recordSectionVisit(email, pendingGameSection);
    setCurrentSection(pendingGameSection);
    setPendingGameSection(null);
    setTimeout(() => playWhooshSound(), 100);
  };

  /** From the alphabet lesson: open handwriting on this letter. */
  const handlePracticeWriting = (letterIndex) => {
    setHandwritingLetterIndex(typeof letterIndex === 'number' ? letterIndex : null);
    handleSectionChange('handwriting');
  };

  const handleChatModeSwitch = (mode) => {
    setCurrentSection(mode === 'text' ? 'chat' : 'voice');
  };

  // Get current user email from session
  const getCurrentUserEmail = () => {
    try {
      const session = JSON.parse(localStorage.getItem('stellar_session') || '{}');
      return session.email || null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  };

  // Get current user role
  const getCurrentUserRole = () => {
    try {
      const userEmail = getCurrentUserEmail();
      const storedRole = localStorage.getItem('stellar_role');
      if (!userEmail) return storedRole || null;

      const users = JSON.parse(localStorage.getItem('stellar_users') || '{}');
      const user = users[userEmail.toLowerCase()];
      return user?.role || storedRole || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return localStorage.getItem('stellar_role') || null;
    }
  };

  const readCurrentUser = () => {
    try {
      const email = getCurrentUserEmail();
      if (!email) return null;
      const users = JSON.parse(localStorage.getItem('stellar_users') || '{}');
      return users[email.toLowerCase()] || null;
    } catch (error) {
      return null;
    }
  };

  const tr = (en, ar) => (language === 'ar' ? ar : en);

  const renderHomeSection = () => {
    const userRole = getCurrentUserRole();
    const isTeacherOrParent = isStaffRole(userRole);
    const userEmail = getCurrentUserEmail();
    const firstName = (readCurrentUser()?.name || '').trim().split(/\s+/)[0];
    // Per-user module progress — the same numbers the Progress Dashboard shows
    // (the legacy arabic_learning_progress key never stored topic progress)
    const moduleProgress = getModuleProgress(userEmail);
    // Lock state for the sequenced lessons, and the one the learner is on.
    const curriculum = getCurriculumState(userEmail, userRole || 'student');
    const nextModule = getNextModule(userEmail, userRole || 'student');

    const learnCards = [
      {
        id: 'alphabet', icon: '🔤', accent: '#8b5cf6',
        title: tr('Arabic Alphabet', 'الحروف العربية'),
        description: tr('Discover all 28 letters with pronunciation and examples', 'اكتشف الحروف العربية الـ 28 مع النطق والأمثلة'),
        progress: moduleProgress.alphabetProgress
      },
      {
        id: 'colors', icon: '🎨', accent: '#ec4899',
        title: tr('Colors', 'الألوان'),
        description: tr('Learn color names in Arabic with real-world pictures', 'تعرف على أسماء الألوان بالعربية مع صور من الحياة'),
        progress: moduleProgress.colorsProgress
      },
      {
        id: 'words', icon: '📝', accent: '#10b981',
        title: tr('Words', 'الكلمات'),
        description: tr('Build your vocabulary with pictures and pronunciation', 'ابنِ مفرداتك مع الصور والنطق'),
        progress: moduleProgress.wordsProgress
      },
      {
        id: 'sentences', icon: '💬', accent: '#0ea5e9',
        title: tr('Sentences', 'الجمل'),
        description: tr('Put words together into everyday sentences', 'كوّن جملاً يومية من الكلمات'),
        progress: moduleProgress.sentencesProgress
      },
      {
        id: 'handwriting', icon: '✍️', accent: '#f59e0b',
        title: tr('Handwriting', 'الكتابة اليدوية'),
        description: tr('Trace and write Arabic letters step by step', 'تتبّع الحروف العربية واكتبها خطوة بخطوة')
      },
      {
        id: 'story', icon: '📖', accent: '#14b8a6',
        title: tr('Interactive Stories', 'قصص تفاعلية'),
        description: tr('Read short illustrated stories in Arabic', 'اقرأ قصصاً قصيرة مصورة بالعربية')
      },
      {
        id: 'drawing', icon: '🖌️', accent: '#f472b6',
        title: tr('Drawing Board', 'لوحة الرسم'),
        description: tr('Draw and write together with your class', 'ارسم واكتب مع صفك')
      },
      {
        id: 'homework', icon: '📚', accent: '#6366f1',
        title: tr('Homework', 'الواجبات'),
        description: userRole === 'teacher'
          ? tr('Create and review assignments for your classes', 'أنشئ الواجبات وراجعها لصفوفك')
          : tr('See and complete your assignments', 'شاهد واجباتك وأكملها')
      }
    ];

    const practiceCards = [
      {
        id: 'quiz', icon: '🎯', accent: '#6366f1',
        title: tr('Quiz Center', 'مركز الاختبارات'),
        description: tr('Multiple choice, matching, fill in the blanks and more', 'اختيار من متعدد، مطابقة، املأ الفراغ والمزيد')
      },
      {
        id: 'wordbuilder', icon: '🧩', accent: '#3b82f6',
        title: tr('Word Builder', 'بناء الكلمات'),
        description: tr('Look at the picture and arrange letters to form the word', 'شاهد الصورة ورتب الحروف لتكوين الكلمة')
      },
      {
        id: 'letterwordbuilder', icon: '🔡', accent: '#8b5cf6',
        title: tr('Letter Builder', 'ترتيب الحروف'),
        description: tr('Arrange letters to spell correct words', 'رتب الحروف لتكوين كلمات صحيحة')
      },
      {
        id: 'sentencebuilder', icon: '🧱', accent: '#0ea5e9',
        title: tr('Sentence Builder', 'بناء الجمل'),
        description: tr('Arrange words to form correct sentences', 'رتب الكلمات لتكوين جمل صحيحة')
      },
      {
        id: 'memory-game', icon: '🧠', accent: '#f59e0b',
        title: tr('Memory Match', 'لعبة الذاكرة'),
        description: tr('Match pictures with their Arabic words', 'طابق الصور مع كلماتها العربية')
      },
      {
        id: 'color-matching', icon: '🌈', accent: '#ec4899',
        title: tr('Color Matching', 'مطابقة الألوان'),
        description: tr('Pick the right color and learn its Arabic name', 'اختر اللون الصحيح وتعلم اسمه بالعربية')
      },
      {
        id: 'number-learning', icon: '🔢', accent: '#10b981',
        title: tr('Numbers', 'الأرقام'),
        description: tr('Count objects and learn Arabic numbers', 'عُدّ الأشياء وتعلم الأرقام العربية')
      },
      {
        id: 'chat', icon: '🤖', accent: '#3b82f6',
        title: tr('AI Learning Assistant', 'المساعد الذكي'),
        description: tr('Ask anything about Arabic — by text or voice', 'اسأل أي شيء عن العربية — بالكتابة أو بالصوت'),
        chatModes: true
      }
    ];

    const toolCards = [
      {
        id: 'teacherdashboard', icon: '🖥️', accent: '#3b82f6', roles: ['teacher'],
        title: tr('Teacher Dashboard', 'لوحة تحكم المعلم'),
        description: tr('Manage classes, students, points and analytics', 'إدارة الصفوف والطلاب والنقاط والتحليلات')
      },
      {
        id: 'parentdashboard', icon: '👪', accent: '#10b981', roles: ['parent'],
        title: tr('Parent Dashboard', 'لوحة تحكم ولي الأمر'),
        description: tr("Follow your children's learning and activity", 'تابع تعلم أطفالك ونشاطهم')
      },
      {
        id: 'teacherchat', icon: '✉️', accent: '#ec4899', roles: ['teacher', 'parent'],
        title: tr('Messages', 'الرسائل'),
        description: userRole === 'parent'
          ? tr("Talk with your child's teachers", 'تواصل مع معلمي طفلك')
          : tr('Keep families in the loop', 'أبقِ الأهل على اطلاع دائم'),
        badge: unreadMessagesCount
      },
      {
        id: 'progressreport', icon: '📄', accent: '#8b5cf6', roles: ['teacher', 'parent'],
        title: tr('Progress Report', 'تقرير التقدم'),
        description: tr('Detailed, printable learning reports', 'تقارير تعلم مفصلة وقابلة للطباعة')
      },
      {
        id: 'homework', icon: '📚', accent: '#6366f1', roles: ['teacher', 'parent'],
        title: tr('Homework', 'الواجبات'),
        description: userRole === 'teacher'
          ? tr('Create and review assignments for your classes', 'أنشئ الواجبات وراجعها لصفوفك')
          : tr("See what your child has been set", 'شاهد ما أُسند إلى طفلك')
      },
      {
        // The student progress dashboard, for students only. Teachers and
        // parents get the richer Progress Report instead — this one shows
        // *your own* learning, which neither of them is doing here.
        id: 'progress', icon: '📊', accent: '#8b5cf6', roles: ['student'],
        title: tr('Progress Dashboard', 'لوحة التقدم'),
        description: tr('Track your progress and achievements', 'تابع تقدمك وإنجازاتك')
      },
      {
        id: 'rewards', icon: '🎁', accent: '#f59e0b', roles: ['student'],
        title: tr('Rewards', 'المكافآت'),
        description: tr('Use your points to change how the app looks', 'استخدم نقاطك لتغيير شكل التطبيق')
      },
      {
        id: 'classmanagement', icon: '🏫', accent: '#0ea5e9', roles: ['student'],
        title: tr('My Classes', 'صفوفي'),
        description: tr("Join a class with your teacher's code", 'انضم إلى صف باستخدام رمز المعلم')
      }
    ].filter(card => card.roles.includes(userRole || 'student'));

    /**
     * Split a set of cards into the ones that can be started now and the ones
     * that are still locked. Only sequenced lessons (alphabet → colors → words
     * → sentences) are ever locked; the practice activities and tools stay open
     * so a learner who stalls always has somewhere to go.
     */
    const partitionByLock = (cards) => {
      const available = [];
      const locked = [];
      cards.forEach((card) => {
        const state = curriculum[card.id];
        if (state && !state.unlocked) {
          locked.push(card);
        } else {
          available.push(card);
        }
      });
      return { available, locked };
    };

    /** One tile. Pulled out so it can be rendered inside the "…" box too. */
    const renderCard = (card, index) => (
      <SectionCard
        key={card.id}
        card={card}
        index={index}
        onSelect={handleSectionChange}
        isNext={card.id === nextModule?.id && !isTeacherOrParent}
        nextLabel={tr('Start here', 'ابدأ هنا')}
      >
        {typeof card.progress === 'number' && (
          <div className="card-progress" aria-label={tr(`${card.progress}% complete`, `${card.progress}% مكتمل`)}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${card.progress}%` }}></div>
            </div>
            <span className="progress-text">{card.progress}%</span>
          </div>
        )}
        {card.chatModes && (
          <div className="chat-modes">
            <button
              className="mode-btn text-mode"
              onClick={(e) => {
                e.stopPropagation();
                handleChatModeSwitch('text');
              }}
            >
              💬 {tr('Text', 'نص')}
            </button>
            <button
              className="mode-btn voice-mode"
              onClick={(e) => {
                e.stopPropagation();
                handleChatModeSwitch('voice');
              }}
            >
              🎤 {tr('Voice', 'صوت')}
            </button>
          </div>
        )}
      </SectionCard>
    );

    /**
     * A grid of tiles, plus at most one "…" box holding everything that is not
     * shown: the locked lessons, and anything past `maxVisible`.
     *
     * Capping the visible count is the other half of not overwhelming the page.
     * Locking alone does not help the practice row, where nothing is sequenced
     * and all eight activities are legitimately available — showing four and
     * folding the rest keeps the page readable without taking anything away.
     */
    const renderCards = ({ cards, offset = 0, lockedCards = [], maxVisible = Infinity }) => {
      const visible = cards.slice(0, maxVisible);
      const overflow = cards.slice(maxVisible);
      const hiddenCount = overflow.length + lockedCards.length;

      return (
        <div className="learning-sections">
          {visible.map((card, index) => renderCard(card, offset + index))}

          {/* Collapses into one tile that opens on hover, focus or tap — see
              CollapsedCardsBox for why all three. */}
          <CollapsedCardsBox
            count={hiddenCount}
            label={
              lockedCards.length && !overflow.length
                ? tr('more to unlock', 'المزيد للفتح')
                : tr('more', 'المزيد')
            }
            hint={tr('Hover or tap to see them', 'مرر المؤشر أو اضغط لرؤيتها')}
          >
            {overflow.map((card, index) =>
              renderCard(card, offset + visible.length + index))}
            {lockedCards.map((card) => (
              <LockedCard
                key={card.id}
                card={card}
                reason={lockReason(userEmail, card.id, language, userRole || 'student')}
              />
            ))}
          </CollapsedCardsBox>
        </div>
      );
    };

    const renderGroup = (key, icon, title, subtitle, options) => (
      <section className="home-group" key={key} aria-labelledby={`home-group-${key}`}>
        <div className="section-category-header">
          <h2 className="category-title" id={`home-group-${key}`}>
            <span className="category-title-icon" aria-hidden="true">{icon}</span>
            {title}
          </h2>
          {subtitle && <p className="category-subtitle">{subtitle}</p>}
        </div>
        {renderCards(options)}
      </section>
    );

    const toolsGroup = renderGroup(
      'tools',
      isTeacherOrParent ? '🧰' : '📊',
      isTeacherOrParent
        ? (userRole === 'teacher' ? tr('Teaching tools', 'أدوات المعلم') : tr('Family tools', 'أدوات الأهل'))
        : tr('Your progress', 'تقدمك'),
      isTeacherOrParent
        ? tr('Everything you need to support your learners', 'كل ما تحتاجه لدعم المتعلمين')
        : null,
      { cards: toolCards, offset: 0 }
    );

    const { available: openLearnCards, locked: lockedLearnCards } =
      partitionByLock(learnCards);

    /**
     * Teachers and parents get their tools and nothing else. They are not
     * learners here, and the learning grid was the bulk of what they had to
     * scroll past to reach the dashboard they came for.
     */
    if (isTeacherOrParent) {
      return (
        <div className="home-section">
          <motion.div
            className="welcome-header"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1
              className="platform-title"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              lang={language === 'ar' ? 'ar' : 'en'}
            >
              {firstName
                ? tr(`Welcome back, ${firstName}!`, `مرحباً بعودتك يا ${firstName}!`)
                : tr('Welcome to Stellar', 'مرحباً بك في مميّز')}
            </h1>
            <p
              className="platform-subtitle"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              lang={language === 'ar' ? 'ar' : 'en'}
            >
              {userRole === 'teacher'
                ? tr('Your classes, your learners and their progress, all in one place.',
                     'صفوفك ومتعلموك وتقدمهم، في مكان واحد.')
                : tr("Follow your children's learning and stay in touch with their teachers.",
                     'تابع تعلم أطفالك وابقَ على تواصل مع معلميهم.')}
            </p>
            <motion.p
              className="platform-role-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {userRole === 'teacher'
                ? tr('👨‍🏫 Teacher account', '👨‍🏫 حساب معلم')
                : tr('👨‍👩‍👧 Parent account', '👨‍👩‍👧 حساب ولي أمر')}
            </motion.p>
          </motion.div>

          {toolsGroup}
        </div>
      );
    }

    return (
      <div className="home-section">
        <motion.div
          className="welcome-header"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1
            className="platform-title"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            lang={language === 'ar' ? 'ar' : 'en'}
          >
            {firstName
              ? tr(`Welcome back, ${firstName}!`, `مرحباً بعودتك يا ${firstName}!`)
              : tr('Welcome to Stellar', 'مرحباً بك في مميّز')}
          </h1>
          <p
            className="platform-subtitle"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            lang={language === 'ar' ? 'ar' : 'en'}
          >
            {tr('Pick up where you left off — letters, words, stories and games, all in one place.',
                'تابع من حيث توقفت — حروف وكلمات وقصص وألعاب في مكان واحد.')}
          </p>

          {/* The two things a learner needs on arrival: how today is going,
              and the ONE button that continues the path. Everything else on
              the page is optional; this row is the plan. */}
          <div className="home-hero-row">
            <DailyGoalRing userEmail={userEmail} language={language} />
            {nextModule && (
              <motion.button
                type="button"
                className="home-continue-btn"
                onClick={() => handleSectionChange(nextModule.complete ? 'quiz' : nextModule.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="home-continue-kicker">
                  {nextModule.complete
                    ? tr('All lessons open', 'كل الدروس مفتوحة')
                    : (nextModule.percent > 0 ? tr('Continue', 'تابع') : tr('Start here', 'ابدأ هنا'))}
                </span>
                <span className="home-continue-title">
                  {nextModule.complete
                    ? tr('Test yourself', 'اختبر نفسك')
                    : (language === 'ar' ? nextModule.titleAr : nextModule.titleEn)}
                </span>
                {!nextModule.complete && (
                  <span className="home-continue-progress" aria-hidden="true">
                    <span style={{ width: `${nextModule.percent}%` }} />
                  </span>
                )}
                <span className="home-continue-arrow" aria-hidden="true">
                  {language === 'ar' ? <ArrowLeft size={22} /> : <ArrowRight size={22} />}
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Streak and standing side by side: the two "how am I doing?" answers
            together at the top, instead of the streak here and the leaderboard
            two clicks deep inside a modal. */}
        <motion.div
          className="home-status-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
        >
          <StreakCounter language={language} />
          <HomeLeaderboard userEmail={userEmail} language={language} />
        </motion.div>

        {renderGroup(
          'learn', '📚', tr('Learn', 'تعلّم'),
          nextModule && !nextModule.complete
            ? tr(
                `Your next step is ${nextModule.titleEn} — reach ${PASS_PERCENT}% to open the one after it.`,
                `خطوتك التالية هي ${nextModule.titleAr} — اصل إلى ${PASS_PERCENT}% لفتح التالية.`
              )
            : tr('You have opened every lesson — keep practising to master them.',
                 'لقد فتحت كل الدروس — واصل التدرب لإتقانها.'),
          { cards: openLearnCards, offset: 0, lockedCards: lockedLearnCards }
        )}

        {/* Practice sits below the lesson path and shows four of its eight
            activities, with the rest in the "…" box — enough choice to be
            useful, not enough to compete with the lesson in hand. */}
        {renderGroup(
          'practice', '🎯', tr('Practice & play', 'تدرّب والعب'),
          tr('Quizzes, games and your AI tutor to practise what you learned', 'اختبارات وألعاب ومساعدك الذكي لتتدرب على ما تعلمته'),
          { cards: practiceCards, offset: openLearnCards.length, maxVisible: 4 }
        )}

        {toolsGroup}
      </div>
    );
  };

  const userRole = getCurrentUserRole();
  const isStaff = isStaffRole(userRole);
  const isCompactNav = isStaff;
  const currentUser = readCurrentUser();
  const hideNav = NAV_HIDDEN_SECTIONS.includes(currentSection);

  /**
   * Navigation is built per role rather than filtered after the fact.
   *
   * Teachers and parents previously carried the learner's whole nav — Learn,
   * Test Yourself, Progress, Chat, Voice — plus their own dashboard at the far
   * end. Those five links went to screens that are not for them, and on a
   * teacher account the dashboard they actually use was the last item in the
   * row. They now get four links, all theirs.
   */
  const navItems = isStaff
    ? [
      { id: 'home', icon: '🏠', label: tr('Home', 'الرئيسية'), sections: ['home'] },
      ...(userRole === 'teacher'
        ? [{ id: 'teacherdashboard', icon: '🖥️', label: tr('Dashboard', 'لوحتي'), sections: ['teacherdashboard', 'classmanagement'] }]
        : [{ id: 'parentdashboard', icon: '👪', label: tr('Dashboard', 'لوحتي'), sections: ['parentdashboard'] }]),
      { id: 'progressreport', icon: '📄', label: tr('Reports', 'التقارير'), sections: ['progressreport'] },
      { id: 'homework', icon: '📚', label: tr('Homework', 'الواجبات'), sections: ['homework'] },
      { id: 'teacherchat', icon: '✉️', label: tr('Messages', 'الرسائل'), sections: ['teacherchat'], badge: unreadMessagesCount }
    ]
    : [
      { id: 'home', icon: '🏠', label: tr('Home', 'الرئيسية'), sections: ['home'] },
      { id: 'learn', icon: '📚', label: tr('Learn', 'تعلّم'), sections: LEARN_SECTIONS },
      { id: 'quiz', icon: '🎯', label: tr('Test Yourself', 'اختبر نفسك'), sections: PRACTICE_SECTIONS },
      { id: 'progress', icon: '📊', label: tr('Progress', 'تقدمي'), sections: ['progress'] },
      { id: 'chat', icon: '💬', label: tr('Chat', 'محادثة'), sections: ['chat'] },
      { id: 'voice', icon: '🎤', label: tr('Voice', 'صوت'), sections: ['voice'] }
    ];

  const handleNavClick = (id) => {
    if (id === 'chat' || id === 'voice') {
      handleChatModeSwitch(id === 'chat' ? 'text' : 'voice');
    } else {
      // Through handleSectionChange, not setCurrentSection directly, so nav
      // clicks go through the same role and unlock guards the tiles do.
      handleSectionChange(id);
    }
  };

  return (
    <div className="arabic-learning-platform" ref={platformRef}>
      {!hideNav && (
        <nav
          className={`platform-nav ${isCompactNav ? 'platform-nav--compact' : ''}`}
          aria-label={tr('Main navigation', 'التنقل الرئيسي')}
        >
          <button
            type="button"
            className="nav-brand"
            onClick={() => setCurrentSection('home')}
            aria-label={tr('Stellar — go to home page', 'مميّز — العودة إلى الصفحة الرئيسية')}
          >
            <span className="nav-brand-mark" aria-hidden="true"><Home size={20} strokeWidth={2.5} /></span>
            <span className="brand-title">{tr('Stellar', 'مميّز')}</span>
          </button>

          <div className="nav-links">
            {navItems.map(item => {
              const isActive = item.sections.includes(currentSection);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                >
                  <span className="nav-link-icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav-link-label">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="nav-unread-badge" aria-label={tr(`${item.badge} unread`, `${item.badge} غير مقروءة`)}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="nav-user-tools" role="toolbar" aria-label={tr('User tools', 'أدوات المستخدم')}>
            <button
              type="button"
              className="nav-profile-btn"
              onClick={() => {
                playClickSound();
                setShowProfileSettings(true);
              }}
              aria-label={tr('Open profile and settings', 'فتح الملف الشخصي والإعدادات')}
              title={tr('Profile & settings', 'الملف الشخصي والإعدادات')}
            >
              <span className="nav-avatar" aria-hidden="true">
                {currentProfilePicture
                  ? <img src={currentProfilePicture} alt="" />
                  : getInitials(currentUser?.name || getCurrentUserEmail() || '')}
              </span>
              <span className="nav-avatar-gear" aria-hidden="true">⚙️</span>
            </button>
            {/* Comfort: sounds, read-aloud, motion, celebrations, reading
                tint, text size. One tap from every screen, for the learner
                who is overwhelmed right now. */}
            <button
              type="button"
              ref={comfortButtonRef}
              className={`comfort-nav-btn ${calmMode ? 'is-calm' : ''}`}
              onClick={() => { playClickSound(); setShowComfort((value) => !value); }}
              aria-expanded={showComfort}
              aria-haspopup="dialog"
              aria-label={tr('Comfort settings: sound, motion, reading tint', 'إعدادات الراحة: الصوت والحركة ولون القراءة')}
              title={calmMode ? tr('Comfort (calm mode on)', 'الراحة (وضع الهدوء مفعّل)') : tr('Comfort', 'الراحة')}
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
            </button>
            <DarkModeToggle language={language} />
            <HighContrastToggle language={language} />
            <button
              type="button"
              className="sign-out-btn"
              onClick={onSignOut}
              aria-label={tr('Sign out of account', 'تسجيل الخروج من الحساب')}
              title={tr('Sign out', 'تسجيل الخروج')}
            >
              <LogOut size={18} aria-hidden="true" />
              <span className="sign-out-label">{tr('Sign out', 'خروج')}</span>
            </button>
          </div>
        </nav>
      )}

      <main
        id="main-content"
        className={`platform-content ${hideNav ? 'fullscreen' : ''} ${POINTS_BAR_SECTIONS.includes(currentSection) ? 'has-points-bar' : ''}`}
        role="main"
        aria-label={language === 'ar' ? 'المحتوى الرئيسي' : 'Main content'}
        tabIndex="-1"
      >
        <AnimatePresence mode="wait">
          {currentSection === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {renderHomeSection()}
            </motion.div>
          )}

          {currentSection === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LearnHub
                language={language}
                userEmail={getCurrentUserEmail()}
                userRole={getCurrentUserRole()}
                onSectionSelect={handleSectionChange}
              />
            </motion.div>
          )}

          {currentSection === 'alphabet' && (
            <motion.div
              key="alphabet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ArabicAlphabetLearning
                t={t}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                reducedMotion={reducedMotion}
                speak={speak}
                onPracticeWriting={handlePracticeWriting}
              />
            </motion.div>
          )}

          {currentSection === 'colors' && (
            <motion.div
              key="colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ArabicColorsLearning
                t={t}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                reducedMotion={reducedMotion}
                speak={speak}
              />
            </motion.div>
          )}

          {currentSection === 'words' && (
            <motion.div
              key="words"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ArabicWordsLearning
                t={t}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                reducedMotion={reducedMotion}
                speak={speak}
              />
            </motion.div>
          )}

          {currentSection === 'sentences' && (
            <motion.div
              key="sentences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ArabicSentencesLearning
                t={t}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                reducedMotion={reducedMotion}
                speak={speak}
              />
            </motion.div>
          )}

          {currentSection === 'wordbuilder' && (
            <motion.div
              key="wordbuilder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ArabicWordBuilder
                t={t}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                reducedMotion={reducedMotion}
                speak={speak}
              />
            </motion.div>
          )}

          {currentSection === 'difficulty-selection' && (
            <motion.div
              key="difficulty-selection"
              className="difficulty-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="difficulty-title">
                {language === 'ar' ? 'اختر مستوى الصعوبة' : 'Choose a difficulty'}
              </h2>
              <p className="difficulty-subtitle">
                {language === 'ar'
                  ? 'يمكنك تغييره في أي وقت — لا توجد إجابة خاطئة.'
                  : 'You can change it any time — there is no wrong choice.'}
              </p>
              <div className="difficulty-grid" role="group" aria-label={tr('Difficulty', 'الصعوبة')}>
                {DIFFICULTY_LEVELS.map((level, index) => {
                  const isLast = gameDifficulty === level.id;
                  return (
                    <motion.button
                      key={level.id}
                      type="button"
                      className={`difficulty-option ${isLast ? 'is-last' : ''}`}
                      style={{ '--level-color': level.color }}
                      onClick={() => handleDifficultySelect(level.id)}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      aria-pressed={isLast}
                    >
                      {isLast && (
                        <span className="difficulty-last">
                          {language === 'ar' ? 'اختيارك السابق' : 'Last time'}
                        </span>
                      )}
                      <span className="difficulty-emoji" aria-hidden="true">{level.emoji}</span>
                      <span className="difficulty-label">{language === 'ar' ? level.labelAr : level.labelEn}</span>
                      <span className="difficulty-hint">{language === 'ar' ? level.hintAr : level.hintEn}</span>
                    </motion.button>
                  );
                })}
              </div>
              <motion.button
                type="button"
                className="difficulty-back"
                onClick={() => {
                  playClickSound();
                  setCurrentSection('quiz');
                  setPendingGameSection(null);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {language === 'ar' ? '→ رجوع' : '← Back'}
              </motion.button>
            </motion.div>
          )}

          {currentSection === 'memory-game' && (
            <motion.div
              key="memory-game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MemoryGame language={language} difficulty={gameDifficulty || 'medium'} />
            </motion.div>
          )}

          {currentSection === 'color-matching' && (
            <motion.div
              key="color-matching"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ColorMatchingGame language={language} difficulty={gameDifficulty || 'medium'} />
            </motion.div>
          )}

          {currentSection === 'number-learning' && (
            <motion.div
              key="number-learning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NumberLearningGame language={language} difficulty={gameDifficulty || 'medium'} />
            </motion.div>
          )}

          {currentSection === 'sentencebuilder' && (
            <motion.div
              key="sentencebuilder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SentenceBuilder
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
              />
            </motion.div>
          )}

          {currentSection === 'letterwordbuilder' && (
            <motion.div
              key="letterwordbuilder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LetterWordBuilder
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
              />
            </motion.div>
          )}

          {currentSection === 'drawing' && (
            <motion.div
              key="drawing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CollaborativeDrawingBoard
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
              />
            </motion.div>
          )}

          {currentSection === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QuizCenter
                t={t}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                reducedMotion={reducedMotion}
                speak={speak}
                userEmail={getCurrentUserEmail()}
                userRole={getCurrentUserRole()}
                onSectionSelect={handleSectionChange}
              />
            </motion.div>
          )}

          {currentSection === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}
            >
              <ChatInterface
                t={t}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                reducedMotion={reducedMotion}
                assistantTitle={assistantTitle}
                currentPreference={currentPreference}
                onSwitchMode={() => handleChatModeSwitch('voice')}
                onSignOut={onSignOut}
                onBack={() => setCurrentSection('home')}
                customPrompt={getLearningPrompt('general')}
                isLearningMode={true}
              />
            </motion.div>
          )}

          {currentSection === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}
            >
              <VoiceInterface
                t={t}
                language={language}
                voices={voices}
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
                speed={speed}
                setSpeed={setSpeed}
                pitch={pitch}
                setPitch={setPitch}
                setLanguage={setLanguage}
                speak={speak}
                highContrast={highContrast}
                fontSize={fontSize}
                reducedMotion={reducedMotion}
                assistantTitle={assistantTitle}
                currentPreference={currentPreference}
                onSwitchMode={() => handleChatModeSwitch('text')}
                onSignOut={onSignOut}
                onBack={() => setCurrentSection('home')}
                customPrompt={getLearningPrompt('general')}
                isLearningMode={true}
              />
            </motion.div>
          )}

          {currentSection === 'teacherchat' && (
            <motion.div
              key="teacherchat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}
            >
              <TeacherParentChat
                currentUserEmail={getCurrentUserEmail()}
                userRole={getCurrentUserRole()}
                language={language}
                onBack={() => setCurrentSection('home')}
              />
            </motion.div>
          )}

          {currentSection === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProgressDashboard
                userEmail={getCurrentUserEmail()}
                language={language}
                onClose={() => setCurrentSection('home')}
              />
            </motion.div>
          )}

          {currentSection === 'handwriting' && (
            <motion.div
              key="handwriting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ArabicHandwritingPractice
                onClose={() => { setHandwritingLetterIndex(null); setCurrentSection('home'); }}
                language={language}
                initialLetterIndex={handwritingLetterIndex}
              />
            </motion.div>
          )}

          {currentSection === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InteractiveStoryReader
                language={language}
                onClose={() => setCurrentSection('home')}
              />
            </motion.div>
          )}

          {currentSection === 'homework' && (
            <motion.div
              key="homework"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <HomeworkSystem
                userEmail={getCurrentUserEmail()}
                userRole={getCurrentUserRole()}
                language={language}
                onClose={() => setCurrentSection('home')}
              />
            </motion.div>
          )}

          {currentSection === 'classmanagement' && (
            <motion.div
              key="classmanagement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ClassManagement
                userEmail={getCurrentUserEmail()}
                userRole={getCurrentUserRole()}
                language={language}
                onClose={() => setCurrentSection('home')}
              />
            </motion.div>
          )}

          {currentSection === 'progressreport' && (
            <motion.div
              key="progressreport"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StudentProgressReport
                userEmail={getCurrentUserEmail()}
                language={language}
                onClose={() => setCurrentSection('home')}
              />
            </motion.div>
          )}

          {currentSection === 'teacherdashboard' && (
            <motion.div
              key="teacherdashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MuiThemeProvider theme={stellarMuiTheme}>
                <TeacherDashboard
                  userEmail={getCurrentUserEmail()}
                  language={language}
                  onClose={() => setCurrentSection('home')}
                  onSignOut={onSignOut}
                />
              </MuiThemeProvider>
            </motion.div>
          )}

          {currentSection === 'parentdashboard' && (
            <motion.div
              key="parentdashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MuiThemeProvider theme={stellarMuiTheme}>
                <ParentDashboard
                  userEmail={getCurrentUserEmail()}
                  language={language}
                  onClose={() => setCurrentSection('home')}
                  onSignOut={onSignOut}
                />
              </MuiThemeProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Total points — pinned for the whole time the learner is in a learning
          or quiz section, so points landing are visible wherever they scroll. */}
      {POINTS_BAR_SECTIONS.includes(currentSection) && (
        <TotalPointsBar userEmail={getCurrentUserEmail()} language={language} />
      )}

      {/* Profile Settings Modal - All-in-One (Picture, Name, Password, Data, etc.) */}
      <AnimatePresence>
        {showProfileSettings && (
          <ProfileSettings
            userEmail={getCurrentUserEmail()}
            language={language}
            onUpdate={() => {
              // Reload user data
              const users = JSON.parse(localStorage.getItem('stellar_users') || '{}');
              const user = users[getCurrentUserEmail().toLowerCase()];
              setCurrentProfilePicture(user?.profilePicture || null);
            }}
            onClose={() => setShowProfileSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Rewards — what the points are for. A modal rather than a section so
          it stays reachable without unmounting the lesson in progress. */}
      <AnimatePresence>
        {showRewards && (
          <RewardsStore
            userEmail={getCurrentUserEmail()}
            language={language}
            onClose={() => setShowRewards(false)}
          />
        )}
      </AnimatePresence>

      {/* Comfort panel — anchored to its nav button, portalled to <body>. */}
      <ComfortPanel
        open={showComfort}
        onClose={() => setShowComfort(false)}
        language={language}
        anchorRef={comfortButtonRef}
      />

      {/* A gentle break suggestion after twenty minutes on learning screens.
          Learners only: a teacher marking homework does not need it. */}
      {!isStaff && (
        <BreakNudge
          active={POINTS_BAR_SECTIONS.includes(currentSection) && currentSection !== 'learn'}
          language={language}
        />
      )}

      {/* Onboarding Tutorial for First-Time Users */}
      {showOnboarding && (
        <OnboardingTutorial
          language={language}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default ArabicLearningPlatform;