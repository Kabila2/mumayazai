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
import Leaderboard from "./Leaderboard";
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
import { LogOut } from 'lucide-react';
import { playClickSound, playWhooshSound } from '../utils/soundEffects';
import { getTotalUnreadCount, getInitials } from '../utils/conversationUtils';
import { getModuleProgress } from '../utils/progressUtils';
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

/**
 * A home-page tile. Rendered as a real keyboard target (Enter / Space) rather than
 * a bare clickable div; the per-card accent drives its icon tile, hover border and
 * progress bar through --card-accent.
 */
const SectionCard = ({ card, index, onSelect, children }) => (
  <motion.div
    className={`section-card home-card--${card.id}`}
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameDifficulty, setGameDifficulty] = useState(null);
  const [pendingGameSection, setPendingGameSection] = useState(null);
  const [userProgress, setUserProgress] = useState({
    alphabetProgress: 0,
    colorsProgress: 0,
    totalSessions: 0,
    streak: 0
  });
  const platformRef = useRef(null);

  // Check if first-time user
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('stellar_onboarding_completed');
    if (!hasCompletedOnboarding && currentSection === 'home') {
      // Show onboarding after a short delay
      setTimeout(() => setShowOnboarding(true), 1000);
    }
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

    // Check if this is a game section that needs difficulty selection
    const gameSections = ['memory-game', 'color-matching', 'number-learning'];
    if (gameSections.includes(section) && !gameDifficulty) {
      setPendingGameSection(section);
      setCurrentSection('difficulty-selection');
      return;
    }

    setCurrentSection(section);
    if (section === 'alphabet' || section === 'colors') {
      updateSessionCount();
    }
    // Play whoosh for transitions
    if (section !== 'home') {
      setTimeout(() => playWhooshSound(), 100);
    }
  };

  const handleDifficultySelect = (difficulty) => {
    setGameDifficulty(difficulty);
    setCurrentSection(pendingGameSection);
    setPendingGameSection(null);
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
    const isTeacherOrParent = userRole === 'teacher' || userRole === 'parent';
    const firstName = (readCurrentUser()?.name || '').trim().split(/\s+/)[0];
    // Per-user module progress — the same numbers the Progress Dashboard shows
    // (the legacy arabic_learning_progress key never stored topic progress)
    const moduleProgress = getModuleProgress(getCurrentUserEmail());

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
        id: 'progress', icon: '📊', accent: '#8b5cf6', roles: ['student', 'teacher', 'parent'],
        title: tr('Progress Dashboard', 'لوحة التقدم'),
        description: tr('Track your progress and achievements', 'تابع تقدمك وإنجازاتك')
      },
      {
        id: 'classmanagement', icon: '🏫', accent: '#0ea5e9', roles: ['student'],
        title: tr('My Classes', 'صفوفي'),
        description: tr("Join a class with your teacher's code", 'انضم إلى صف باستخدام رمز المعلم')
      }
    ].filter(card => card.roles.includes(userRole || 'student'));

    const renderCards = (cards, offset = 0) => (
      <div className="learning-sections">
        {cards.map((card, index) => (
          <SectionCard
            key={card.id}
            card={card}
            index={offset + index}
            onSelect={handleSectionChange}
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
        ))}
      </div>
    );

    const renderGroup = (key, icon, title, subtitle, cards, offset) => (
      <section className="home-group" key={key} aria-labelledby={`home-group-${key}`}>
        <div className="section-category-header">
          <h2 className="category-title" id={`home-group-${key}`}>
            <span className="category-title-icon" aria-hidden="true">{icon}</span>
            {title}
          </h2>
          {subtitle && <p className="category-subtitle">{subtitle}</p>}
        </div>
        {renderCards(cards, offset)}
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
      toolCards,
      isTeacherOrParent ? 0 : learnCards.length + practiceCards.length
    );

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
            {isTeacherOrParent
              ? tr('Explore the lessons your learners use, and stay connected with families and teachers.',
                   'استكشف الدروس التي يستخدمها المتعلمون، وابقَ على تواصل مع الأهل والمعلمين.')
              : tr('Pick up where you left off — letters, words, stories and games, all in one place.',
                   'تابع من حيث توقفت — حروف وكلمات وقصص وألعاب في مكان واحد.')}
          </p>
          {isTeacherOrParent && (
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
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <StreakCounter language={language} />
        </motion.div>

        {isTeacherOrParent && toolsGroup}

        {renderGroup(
          'learn', '📚', tr('Learn', 'تعلّم'),
          tr('Start your learning journey with interactive lessons', 'ابدأ رحلة التعلم مع الدروس التفاعلية'),
          learnCards, isTeacherOrParent ? toolCards.length : 0
        )}

        {renderGroup(
          'practice', '🎯', tr('Practice & play', 'تدرّب والعب'),
          tr('Quizzes, games and your AI tutor to practise what you learned', 'اختبارات وألعاب ومساعدك الذكي لتتدرب على ما تعلمته'),
          practiceCards, (isTeacherOrParent ? toolCards.length : 0) + learnCards.length
        )}

        {!isTeacherOrParent && toolsGroup}

        <motion.div
          className="fun-facts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="facts-title">
            <span aria-hidden="true">💡</span> {tr('Did you know?', 'هل تعلم؟')}
          </h3>
          <div className="facts-grid">
            {[
              ['📖', tr('Arabic has 28 letters', 'اللغة العربية بها 28 حرفاً')],
              ['🌍', tr('Over 400 million people speak Arabic', 'يتحدث بالعربية أكثر من 400 مليون شخص')],
              ['✍️', tr('Arabic is written from right to left', 'نكتب العربية من اليمين إلى اليسار')]
            ].map(([icon, text]) => (
              <div className="fact-item" key={icon}>
                <span className="fact-icon" aria-hidden="true">{icon}</span>
                <span className="fact-text">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  const userRole = getCurrentUserRole();
  const isCompactNav = userRole === 'teacher' || userRole === 'parent';
  const currentUser = readCurrentUser();
  const hideNav = NAV_HIDDEN_SECTIONS.includes(currentSection);

  const navItems = [
    { id: 'home', icon: '🏠', label: tr('Home', 'الرئيسية'), sections: ['home'] },
    { id: 'learn', icon: '📚', label: tr('Learn', 'تعلّم'), sections: LEARN_SECTIONS },
    { id: 'quiz', icon: '🎯', label: tr('Test Yourself', 'اختبر نفسك'), sections: PRACTICE_SECTIONS },
    { id: 'progress', icon: '📊', label: tr('Progress', 'تقدمي'), sections: ['progress'] },
    { id: 'chat', icon: '💬', label: tr('Chat', 'محادثة'), sections: ['chat'] },
    { id: 'voice', icon: '🎤', label: tr('Voice', 'صوت'), sections: ['voice'] },
    ...(isCompactNav
      ? [{ id: 'teacherchat', icon: '✉️', label: tr('Messages', 'الرسائل'), sections: ['teacherchat'], badge: unreadMessagesCount }]
      : []),
    ...(userRole === 'teacher'
      ? [{ id: 'teacherdashboard', icon: '🖥️', label: tr('Dashboard', 'لوحتي'), sections: ['teacherdashboard', 'classmanagement', 'progressreport'] }]
      : []),
    ...(userRole === 'parent'
      ? [{ id: 'parentdashboard', icon: '👪', label: tr('Dashboard', 'لوحتي'), sections: ['parentdashboard', 'progressreport'] }]
      : [])
  ];

  const handleNavClick = (id) => {
    if (id === 'chat' || id === 'voice') {
      handleChatModeSwitch(id === 'chat' ? 'text' : 'voice');
    } else {
      setCurrentSection(id);
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
            <span className="nav-brand-mark" aria-hidden="true">{tr('S', 'م')}</span>
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
                onSectionSelect={(sectionId) => setCurrentSection(sectionId)}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '70vh',
                padding: '2rem'
              }}
            >
              <h2 style={{
                fontSize: '2.5rem',
                marginBottom: '1rem',
                color: 'var(--mz-text)',
                textAlign: 'center'
              }}>
                {language === 'ar' ? 'اختر مستوى الصعوبة' : 'Select Difficulty Level'}
              </h2>
              <p style={{
                fontSize: '1.2rem',
                marginBottom: '3rem',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                {language === 'ar' ? 'اختر المستوى المناسب لك' : 'Choose the level that suits you'}
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
                maxWidth: '900px',
                width: '100%'
              }}>
                {[
                  { id: 'easy', labelEn: 'Easy', labelAr: 'سهل', emoji: '😊', color: '#10b981' },
                  { id: 'medium', labelEn: 'Medium', labelAr: 'متوسط', emoji: '😎', color: '#f59e0b' },
                  { id: 'hard', labelEn: 'Hard', labelAr: 'صعب', emoji: '😤', color: '#ef4444' }
                ].map((level, index) => (
                  <motion.button
                    key={level.id}
                    onClick={() => handleDifficultySelect(level.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '2rem',
                      borderRadius: '20px',
                      border: `3px solid ${level.color}`,
                      background: `linear-gradient(135deg, ${level.color}15, ${level.color}30)`,
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: 'var(--mz-text)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ fontSize: '4rem' }}>{level.emoji}</span>
                    <span>{language === 'ar' ? level.labelAr : level.labelEn}</span>
                  </motion.button>
                ))}
              </div>
              <motion.button
                onClick={() => {
                  setCurrentSection('quiz');
                  setPendingGameSection(null);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  marginTop: '3rem',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: '1px solid var(--mz-border)',
                  background: 'var(--mz-surface-2)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: 'var(--mz-text)'
                }}
              >
                ← {language === 'ar' ? 'رجوع' : 'Back'}
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
                onClose={() => setCurrentSection('home')}
                language={language}
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

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <Leaderboard
            userEmail={getCurrentUserEmail()}
            language={language}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </AnimatePresence>

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