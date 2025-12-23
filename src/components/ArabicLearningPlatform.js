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
import ProfileSettings from "./ProfileSettings";
import Leaderboard from "./Leaderboard";
import StreakCounter from "./StreakCounter";
import ProgressDashboard from "./ProgressDashboard";
import ArabicHandwritingPractice from "./ArabicHandwritingPractice";
import InteractiveStoryReader from "./InteractiveStoryReader";
import HomeworkSystem from "./HomeworkSystem";
import ClassManagement from "./ClassManagement";
import OnboardingTutorial from "./OnboardingTutorial";
import StudentProgressReport from "./StudentProgressReport";
import TeacherDashboard from "./TeacherDashboard";
import ParentDashboard from "./ParentDashboard";
import { playClickSound, playWhooshSound } from '../utils/soundEffects';
import './ArabicLearningPlatform.css';

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
  const [chatMode, setChatMode] = useState('text'); // 'text' | 'voice'
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [userProgress, setUserProgress] = useState({
    alphabetProgress: 0,
    colorsProgress: 0,
    totalSessions: 0,
    streak: 0
  });
  const platformRef = useRef(null);

  // Check if first-time user
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('mumayaz_onboarding_completed');
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
    const updateUnreadCount = () => {
      const count = parseInt(localStorage.getItem('mumayaz_unread_messages') || '0', 10);
      setUnreadMessagesCount(count);
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
        const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
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
    setCurrentSection(section);
    if (section === 'alphabet' || section === 'colors') {
      updateSessionCount();
    }
    // Play whoosh for transitions
    if (section !== 'home') {
      setTimeout(() => playWhooshSound(), 100);
    }
  };

  const handleChatModeSwitch = (mode) => {
    setChatMode(mode);
    setCurrentSection(mode === 'text' ? 'chat' : 'voice');
  };

  // Get current user email from session
  const getCurrentUserEmail = () => {
    try {
      const session = JSON.parse(localStorage.getItem('mumayaz_session') || '{}');
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
      if (!userEmail) return null;

      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const user = users[userEmail.toLowerCase()];
      return user?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  };

  // Helper function to animate text letter by letter
  const animateText = (text) => {
    return text.split('').map((char, index) => (
      <span
        key={index}
        className="animated-letter"
        style={{
          animationDelay: `${index * 0.05}s`,
          display: 'inline-block'
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  const renderHomeSection = () => {
    const userRole = getCurrentUserRole();
    const isTeacherOrParent = userRole === 'teacher' || userRole === 'parent';

    return (
      <div className="home-section">
        <motion.div
          className="welcome-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="platform-title"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            lang={language === 'ar' ? 'ar' : 'en'}
          >
            {language === 'ar' ? 'منصة ممتاز لتعلم اللغة العربية' : 'Welcome to Arabic Learning Platform'}
          </h1>
          <p
            className="platform-subtitle"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            lang={language === 'ar' ? 'ar' : 'en'}
          >
            {isTeacherOrParent ? (
              language === 'ar'
                ? 'تعلم واستكشف المحتوى التعليمي، وتواصل مع أولياء الأمور والمعلمين'
                : 'Learn and explore educational content, plus communicate with parents and teachers'
            ) : (
              language === 'ar'
                ? 'تعلم الحروف والألوان العربية بطريقة ممتعة وتفاعلية'
                : 'Learn Arabic letters and colors in a fun and interactive way'
            )}
          </p>
          {isTeacherOrParent && (
            <motion.p
              className="platform-role-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {userRole === 'teacher'
                ? (language === 'ar' ? '👨‍🏫 حساب معلم' : '👨‍🏫 Teacher Account')
                : (language === 'ar' ? '👨‍👩‍👧‍👦 حساب ولي أمر' : '👨‍👩‍👧‍👦 Parent Account')
              }
            </motion.p>
          )}
        </motion.div>

      {/* Enhanced Streak Counter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ marginTop: '30px' }}
      >
        <StreakCounter language={language} />
      </motion.div>

      {/* Learn Section */}
      <motion.div
        className="section-category-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="category-title">
          📚 {language === 'ar' ? 'تعلّم' : 'Learn'}
        </h2>
        <p className="category-subtitle">
          {language === 'ar'
            ? 'ابدأ رحلة التعلم مع الدروس التفاعلية'
            : 'Start your learning journey with interactive lessons'
          }
        </p>
      </motion.div>

      <div className="learning-sections">
        <motion.div
          className="section-card alphabet-card"
          onClick={() => handleSectionChange('alphabet')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-icon">🔤</div>
          <h3 className="card-title">
            {language === 'ar' ? 'تعلم الحروف العربية' : 'Learn Arabic Alphabet'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'اكتشف الحروف العربية الـ 28 مع النطق والأمثلة'
              : 'Discover all 28 Arabic letters with pronunciation and examples'
            }
          </p>
          <div className="card-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${userProgress.alphabetProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{userProgress.alphabetProgress}%</span>
          </div>
        </motion.div>

        <motion.div
          className="section-card colors-card"
          onClick={() => handleSectionChange('colors')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-icon">🎨</div>
          <h3 className="card-title">
            {language === 'ar' ? 'تعلم الألوان العربية' : 'Learn Arabic Colors'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'تعرف على الألوان المختلفة وأسمائها باللغة العربية'
              : 'Explore different colors and their names in Arabic'
            }
          </p>
          <div className="card-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${userProgress.colorsProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{userProgress.colorsProgress}%</span>
          </div>
        </motion.div>

        <motion.div
          className="section-card words-card"
          onClick={() => handleSectionChange('words')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="card-icon">📝</div>
          <h3 className="card-title">
            {language === 'ar' ? 'تعلم الكلمات العربية' : 'Learn Arabic Words'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'تعلم الكلمات الأساسية مع الصور والنطق'
              : 'Learn essential words with pictures and pronunciation'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card sentences-card"
          onClick={() => handleSectionChange('sentences')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="card-icon">💬</div>
          <h3 className="card-title">
            {language === 'ar' ? 'تعلم الجمل العربية' : 'Learn Arabic Sentences'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'تعلم كيفية تكوين الجمل من الكلمات'
              : 'Learn how to form sentences from words'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card handwriting-card"
          onClick={() => handleSectionChange('handwriting')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="card-icon">✍️</div>
          <h3 className="card-title">
            {language === 'ar' ? 'تمرين الكتابة اليدوية' : 'Handwriting Practice'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'تدرب على كتابة الحروف العربية'
              : 'Practice writing Arabic letters'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card story-card"
          onClick={() => handleSectionChange('story')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="card-icon">📖</div>
          <h3 className="card-title">
            {language === 'ar' ? 'قصص تفاعلية' : 'Interactive Stories'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'اقرأ قصصاً ممتعة وتفاعلية'
              : 'Read fun and interactive stories'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card drawing-board-card"
          onClick={() => handleSectionChange('drawing')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
        >
          <div className="card-icon">🎨</div>
          <h3 className="card-title">
            {language === 'ar' ? 'لوحة الرسم التعاونية' : 'Collaborative Drawing Board'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'ارسم واكتب مع المعلمين والطلاب'
              : 'Draw and write with teachers and students'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card chat-card"
          onClick={() => handleSectionChange('chat')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="card-icon">💬</div>
          <h3 className="card-title">
            {language === 'ar' ? 'مساعد التعلم الذكي' : 'Smart Learning Assistant'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'اسأل مساعد التعلم الذكي عن أي شيء متعلق باللغة العربية'
              : 'Ask the smart learning assistant anything about Arabic language'
            }
          </p>
          <div className="chat-modes">
            <button
              className="mode-btn text-mode"
              onClick={(e) => {
                e.stopPropagation();
                handleChatModeSwitch('text');
              }}
            >
              💬 {language === 'ar' ? 'نص' : 'Text'}
            </button>
            <button
              className="mode-btn voice-mode"
              onClick={(e) => {
                e.stopPropagation();
                handleChatModeSwitch('voice');
              }}
            >
              🎤 {language === 'ar' ? 'صوت' : 'Voice'}
            </button>
          </div>
        </motion.div>

        <motion.div
          className="section-card homework-card"
          onClick={() => handleSectionChange('homework')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3 }}
        >
          <div className="card-icon">📚</div>
          <h3 className="card-title">
            {language === 'ar' ? 'مركز الواجبات' : 'Homework Center'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'شاهد واجباتك وأكملها'
              : 'View and complete your homework'
            }
          </p>
        </motion.div>
      </div>

      {/* Test Yourself Section */}
      <motion.div
        className="section-category-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4 }}
        style={{ marginTop: '40px' }}
      >
        <h2 className="category-title">
          🎯 {language === 'ar' ? 'اختبر نفسك' : 'Test Yourself'}
        </h2>
        <p className="category-subtitle">
          {language === 'ar'
            ? 'اختبر معرفتك وحسّن مهاراتك'
            : 'Test your knowledge and improve your skills'
          }
        </p>
      </motion.div>

      <div className="learning-sections">
        <motion.div
          className="section-card quiz-card"
          onClick={() => handleSectionChange('quiz')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 }}
        >
          <div className="card-icon">🎯</div>
          <h3 className="card-title">
            {language === 'ar' ? 'مركز الاختبارات' : 'Quiz Center'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'اختبر معرفتك في جميع المواضيع'
              : 'Test your knowledge on all topics'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card wordbuilder-card"
          onClick={() => handleSectionChange('wordbuilder')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.6 }}
        >
          <div className="card-icon">🔤</div>
          <h3 className="card-title">
            {language === 'ar' ? 'بناء الكلمات' : 'Word Builder'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'شاهد الصورة ورتب الحروف لتكوين الكلمة'
              : 'Look at the picture and arrange letters to form the word'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card letterwordbuilder-card"
          onClick={() => handleSectionChange('letterwordbuilder')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.7 }}
        >
          <div className="card-icon">🔡</div>
          <h3 className="card-title">
            {language === 'ar' ? 'بناء الكلمات' : 'Letter Builder'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'رتب الحروف لتكوين كلمات صحيحة'
              : 'Arrange letters to form correct words'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card sentencebuilder-card"
          onClick={() => handleSectionChange('sentencebuilder')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.8 }}
        >
          <div className="card-icon">📝</div>
          <h3 className="card-title">
            {language === 'ar' ? 'بناء الجمل' : 'Sentence Builder'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'رتب الكلمات لتكوين جمل صحيحة'
              : 'Arrange words to form correct sentences'
            }
          </p>
        </motion.div>

        <motion.div
          className="section-card memory-card"
          onClick={() => handleSectionChange('memory')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.9 }}
        >
          <div className="card-icon">🧠</div>
          <h3 className="card-title">
            {language === 'ar' ? 'لعبة الذاكرة' : 'Memory Match Game'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'طابق الصور مع الكلمات وحسّن ذاكرتك'
              : 'Match pictures with words and improve your memory'
            }
          </p>
        </motion.div>
      </div>

      {/* Progress Section */}
      <motion.div
        className="section-category-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.0 }}
        style={{ marginTop: '40px' }}
      >
        <h2 className="category-title">
          📊 {language === 'ar' ? 'تقدمك' : 'Your Progress'}
        </h2>
      </motion.div>

      <div className="learning-sections">
        <motion.div
          className="section-card progress-card"
          onClick={() => handleSectionChange('progress')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1 }}
        >
          <div className="card-icon">📊</div>
          <h3 className="card-title">
            {language === 'ar' ? 'لوحة التقدم' : 'Progress Dashboard'}
          </h3>
          <p className="card-description">
            {language === 'ar'
              ? 'تابع تقدمك وشاهد إنجازاتك'
              : 'Track your progress and view achievements'
            }
          </p>
        </motion.div>

        {/* Only show Class Management for teachers */}
        {getCurrentUserRole() === 'teacher' && (
          <motion.div
            className="section-card class-card"
            onClick={() => handleSectionChange('classmanagement')}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9 }}
          >
            <div className="card-icon">🏫</div>
            <h3 className="card-title">
              {language === 'ar' ? 'إدارة الصفوف' : 'Class Management'}
            </h3>
            <p className="card-description">
              {language === 'ar'
                ? 'إدارة الصفوف والطلاب'
                : 'Manage classes and students'
              }
            </p>
          </motion.div>
        )}

        {/* Only show Teacher-Parent Communication for teachers and parents */}
        {(getCurrentUserRole() === 'teacher' || getCurrentUserRole() === 'parent') && (
          <motion.div
            className="section-card teacherchat-card"
            onClick={() => handleSectionChange('teacherchat')}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            style={{ position: 'relative' }}
          >
            {unreadMessagesCount > 0 && (
              <div className="card-unread-badge">{unreadMessagesCount}</div>
            )}
            <div className="card-icon">👨‍🏫👨‍👩‍👧‍👦</div>
            <h3 className="card-title">
              {language === 'ar' ? 'التواصل بين المعلمين والأهل' : 'Teacher-Parent Communication'}
            </h3>
            <p className="card-description">
              {language === 'ar'
                ? 'تواصل مع المعلمين والأهل بسهولة'
                : 'Connect with teachers and parents easily'
              }
            </p>
          </motion.div>
        )}

        {/* Only show Student Progress Report for teachers and parents */}
        {(getCurrentUserRole() === 'teacher' || getCurrentUserRole() === 'parent') && (
          <motion.div
            className="section-card progressreport-card"
            onClick={() => handleSectionChange('progressreport')}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
          >
            <div className="card-icon">📄</div>
            <h3 className="card-title">
              {language === 'ar' ? 'تقرير تقدم الطالب' : 'Student Progress Report'}
            </h3>
            <p className="card-description">
              {language === 'ar'
                ? 'عرض تقارير مفصلة عن تقدم الطلاب'
                : 'View detailed student progress reports'
              }
            </p>
          </motion.div>
        )}
      </div>

      <motion.div
        className="fun-facts"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <h3 className="facts-title">
          {language === 'ar' ? 'هل تعلم؟' : 'Did you know?'}
        </h3>
        <div className="facts-grid">
          <div className="fact-item">
            <span className="fact-icon">📖</span>
            <span className="fact-text">
              {language === 'ar'
                ? 'اللغة العربية بها 28 حرفاً'
                : 'Arabic has 28 letters'
              }
            </span>
          </div>
          <div className="fact-item">
            <span className="fact-icon">🌍</span>
            <span className="fact-text">
              {language === 'ar'
                ? 'يتحدث بالعربية أكثر من 400 مليون شخص'
                : 'Over 400 million people speak Arabic'
              }
            </span>
          </div>
          <div className="fact-item">
            <span className="fact-icon">✍️</span>
            <span className="fact-text">
              {language === 'ar'
                ? 'نكتب العربية من اليمين إلى اليسار'
                : 'Arabic is written from right to left'
              }
            </span>
          </div>
        </div>
      </motion.div>
    </div>
    );
  };

  return (
    <div className="arabic-learning-platform" ref={platformRef}>
      {currentSection !== 'learn' && currentSection !== 'chat' && currentSection !== 'voice' && currentSection !== 'teacherchat' && (
        <nav
          className="platform-nav"
          role="navigation"
          aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}
        >
        <div className="nav-brand">
          <h2 className="brand-title" id="platform-title">
            {language === 'ar' ? 'تعلم العربية' : 'Learn Arabic'}
          </h2>
        </div>

        <div className="nav-links" role="menu" aria-labelledby="platform-title">
          <button
            className={`nav-link ${currentSection === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentSection('home')}
            role="menuitem"
            aria-label={language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Go to home page'}
            aria-current={currentSection === 'home' ? 'page' : undefined}
          >
            🏠 {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <button
            className={`nav-link ${['learn', 'alphabet', 'colors', 'words', 'sentences', 'handwriting', 'story', 'homework', 'drawing'].includes(currentSection) ? 'active' : ''}`}
            onClick={() => setCurrentSection('learn')}
            role="menuitem"
            aria-label={language === 'ar' ? 'الانتقال إلى مركز التعلم' : 'Go to learning hub'}
            aria-current={['learn', 'alphabet', 'colors', 'words', 'sentences', 'handwriting', 'story', 'homework', 'drawing'].includes(currentSection) ? 'page' : undefined}
            style={{ background: ['learn', 'alphabet', 'colors', 'words', 'sentences', 'handwriting', 'story', 'homework', 'drawing'].includes(currentSection) ? 'linear-gradient(135deg, #667eea, #764ba2)' : '' }}
          >
            📚 {language === 'ar' ? 'تعلم' : 'Learn'}
          </button>
          <button
            className={`nav-link ${currentSection === 'quiz' ? 'active' : ''}`}
            onClick={() => setCurrentSection('quiz')}
            style={{ background: currentSection === 'quiz' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '' }}
          >
            🎯 {language === 'ar' ? 'اختبر نفسك' : 'Test Yourself'}
          </button>
          <button
            className={`nav-link ${currentSection === 'progress' ? 'active' : ''}`}
            onClick={() => setCurrentSection('progress')}
            style={{ background: currentSection === 'progress' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : '' }}
          >
            📊 {language === 'ar' ? 'تقدمي' : 'Progress'}
          </button>
          <button
            className="nav-link"
            onClick={() => {
              playClickSound();
              setShowLeaderboard(true);
            }}
            aria-label={language === 'ar' ? 'عرض لوحة المتصدرين' : 'View leaderboard'}
            title={language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}
          >
            🏆 {language === 'ar' ? 'المتصدرون' : 'Leaderboard'}
          </button>
          <button
            className={`nav-link ${(currentSection === 'chat' || currentSection === 'voice') ? 'active' : ''}`}
            onClick={() => setCurrentSection(chatMode === 'text' ? 'chat' : 'voice')}
          >
            🤖 {language === 'ar' ? 'المساعد' : 'Assistant'}
          </button>
          {/* Only show Communication link for teachers and parents */}
          {(getCurrentUserRole() === 'teacher' || getCurrentUserRole() === 'parent') && (
            <button
              className={`nav-link ${currentSection === 'teacherchat' ? 'active' : ''}`}
              onClick={() => setCurrentSection('teacherchat')}
              style={{
                background: currentSection === 'teacherchat' ? 'linear-gradient(135deg, #ec4899, #f472b6)' : '',
                position: 'relative'
              }}
            >
              👨‍🏫 {language === 'ar' ? 'التواصل' : 'Communication'}
              {unreadMessagesCount > 0 && (
                <span className="nav-unread-badge">{unreadMessagesCount}</span>
              )}
            </button>
          )}
          {/* Only show Teacher Dashboard for teachers */}
          {getCurrentUserRole() === 'teacher' && (
            <button
              className={`nav-link ${currentSection === 'teacherdashboard' ? 'active' : ''}`}
              onClick={() => setCurrentSection('teacherdashboard')}
              style={{
                background: currentSection === 'teacherdashboard' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : ''
              }}
            >
              📊 {language === 'ar' ? 'لوحة المعلم' : 'Teacher Dashboard'}
            </button>
          )}
          {/* Only show Parent Dashboard for parents */}
          {getCurrentUserRole() === 'parent' && (
            <button
              className={`nav-link ${currentSection === 'parentdashboard' ? 'active' : ''}`}
              onClick={() => setCurrentSection('parentdashboard')}
              style={{
                background: currentSection === 'parentdashboard' ? 'linear-gradient(135deg, #10b981, #059669)' : ''
              }}
            >
              👪 {language === 'ar' ? 'لوحة الأهل' : 'Parent Dashboard'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} role="toolbar" aria-label={language === 'ar' ? 'أدوات المستخدم' : 'User tools'}>
          <button
            className="profile-settings-btn-with-text"
            onClick={() => {
              playClickSound();
              setShowProfileSettings(true);
            }}
            aria-label={language === 'ar' ? 'فتح الإعدادات' : 'Open settings'}
            title={language === 'ar' ? 'الإعدادات' : 'Settings'}
          >
            ⚙️ {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </button>
          <DarkModeToggle language={language} />
          <button
            className="sign-out-btn"
            onClick={onSignOut}
            aria-label={language === 'ar' ? 'تسجيل الخروج من الحساب' : 'Sign out of account'}
          >
            <span aria-hidden="true">🚪</span> {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </nav>
      )}

      <main
        id="main-content"
        className={`platform-content ${(currentSection === 'learn' || currentSection === 'chat' || currentSection === 'voice' || currentSection === 'teacherchat') ? 'fullscreen' : ''}`}
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

          {currentSection === 'memory-game' && (
            <motion.div
              key="memory-game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MemoryGame language={language} />
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
              <ColorMatchingGame language={language} />
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
              <NumberLearningGame language={language} />
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
                teacherEmail={getCurrentUserEmail()}
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
              <TeacherDashboard
                userEmail={getCurrentUserEmail()}
                language={language}
                onClose={() => setCurrentSection('home')}
              />
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
              <ParentDashboard
                userEmail={getCurrentUserEmail()}
                language={language}
                onClose={() => setCurrentSection('home')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Profile Settings Modal - All-in-One (Picture, Name, Password, Data, etc.) */}
      <AnimatePresence>
        {showProfileSettings && (
          <ProfileSettings
            userEmail={getCurrentUserEmail()}
            language={language}
            onUpdate={() => {
              // Reload user data
              const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
              const user = users[getCurrentUserEmail().toLowerCase()];
              if (user?.profilePicture) {
                setCurrentProfilePicture(user.profilePicture);
              }
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