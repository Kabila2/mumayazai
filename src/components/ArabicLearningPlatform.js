import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LearnHub from "./LearnHub";
import ArabicAlphabetLearning from "./ArabicAlphabetLearning";
import ArabicColorsLearning from "./ArabicColorsLearning";
import ArabicWordsLearning from "./ArabicWordsLearning";
import ArabicSentencesLearning from "./ArabicSentencesLearning";
import ArabicWordBuilder from "./ArabicWordBuilder";
import PointsTracker from "./PointsTracker";
import ChatInterface from "./ChatInterface";
import VoiceInterface from "./VoiceInterface";
import MemoryGame from "./MemoryGame";
import CollaborativeDrawingBoard from "./CollaborativeDrawingBoard";
import SentenceBuilder from "./SentenceBuilder";
import LetterWordBuilder from "./LetterWordBuilder";
import QuizCenter from "./QuizCenter";
import TeacherParentChat from "./TeacherParentChat";
import DarkModeToggle from "./DarkModeToggle";
import SoundToggle from "./SoundToggle";
import ProfilePictureUpload from "./ProfilePictureUpload";
import StreakCounter from "./StreakCounter";
import DataManagement from "./DataManagement";
import { playClickSound, playWhooshSound } from '../utils/soundEffects';
import './ArabicLearningPlatform.css';

/**
 * PLATFORM ACCESS LEVELS:
 *
 * ALL USERS (Students, Teachers, Parents, Children):
 * - Full access to all learning components:
 *   ✓ Alphabet, Colors, Words, Sentences
 *   ✓ Word Builder, Memory Game, Quiz Center
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
  const [currentSection, setCurrentSection] = useState('home'); // 'home', 'learn', 'alphabet', 'colors', 'words', 'sentences', 'wordbuilder', 'points', 'chat', 'voice', 'memory', 'drawing', 'sentencebuilder', 'letterwordbuilder', 'quiz', 'teacherchat'
  const [chatMode, setChatMode] = useState('text'); // 'text' | 'voice'
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState(null);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [userProgress, setUserProgress] = useState({
    alphabetProgress: 0,
    colorsProgress: 0,
    totalSessions: 0,
    streak: 0
  });
  const platformRef = useRef(null);

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

  const renderProgressCard = () => (
    <motion.div
      className="progress-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="progress-title">
        {language === 'ar' ? 'تقدمك في التعلم' : 'Your Learning Progress'}
      </h3>

      <div className="progress-stats">
        <div className="stat-item">
          <div className="stat-number">{userProgress.alphabetProgress}%</div>
          <div className="stat-label">
            {language === 'ar' ? 'الحروف' : 'Alphabet'}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-number">{userProgress.colorsProgress}%</div>
          <div className="stat-label">
            {language === 'ar' ? 'الألوان' : 'Colors'}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-number">{userProgress.totalSessions}</div>
          <div className="stat-label">
            {language === 'ar' ? 'الجلسات' : 'Sessions'}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-number">{userProgress.streak}</div>
          <div className="stat-label">
            {language === 'ar' ? 'الأيام المتتالية' : 'Streak'}
          </div>
        </div>
      </div>
    </motion.div>
  );

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
            {language === 'ar' ? 'مرحباً بك في منصة تعلم العربية' : 'Welcome to Arabic Learning Platform'}
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

      {renderProgressCard()}

      {/* Enhanced Streak Counter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ marginTop: '30px' }}
      >
        <StreakCounter language={language} />
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
          className="section-card wordbuilder-card"
          onClick={() => handleSectionChange('wordbuilder')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
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
          className="section-card memory-card"
          onClick={() => handleSectionChange('memory')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
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

        <motion.div
          className="section-card sentencebuilder-card"
          onClick={() => handleSectionChange('sentencebuilder')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
        >
          <div className="card-icon">🔤</div>
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
          className="section-card letterwordbuilder-card"
          onClick={() => handleSectionChange('letterwordbuilder')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
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
          className="section-card quiz-card"
          onClick={() => handleSectionChange('quiz')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3 }}
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
          className="section-card drawing-board-card"
          onClick={() => handleSectionChange('drawing')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
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
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
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
        <nav className="platform-nav">
        <div className="nav-brand">
          <h2 className="brand-title">
            {language === 'ar' ? 'تعلم العربية' : 'Learn Arabic'}
          </h2>
        </div>

        <div className="nav-links">
          <button
            className={`nav-link ${currentSection === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentSection('home')}
          >
            🏠 {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <button
            className={`nav-link ${['learn', 'alphabet', 'colors', 'words', 'sentences'].includes(currentSection) ? 'active' : ''}`}
            onClick={() => setCurrentSection('learn')}
            style={{ background: ['learn', 'alphabet', 'colors', 'words', 'sentences'].includes(currentSection) ? 'linear-gradient(135deg, #667eea, #764ba2)' : '' }}
          >
            📚 {language === 'ar' ? 'تعلم' : 'Learn'}
          </button>
          <button
            className={`nav-link ${currentSection === 'quiz' ? 'active' : ''}`}
            onClick={() => setCurrentSection('quiz')}
            style={{ background: currentSection === 'quiz' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '' }}
          >
            🎯 {language === 'ar' ? 'اختبارات' : 'Quiz'}
          </button>
          <button
            className={`nav-link ${currentSection === 'points' ? 'active' : ''}`}
            onClick={() => setCurrentSection('points')}
            style={{ background: currentSection === 'points' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '' }}
          >
            🪙 {language === 'ar' ? 'نقاطي' : 'My Points'}
          </button>
          <button
            className={`nav-link ${currentSection === 'drawing' ? 'active' : ''}`}
            onClick={() => setCurrentSection('drawing')}
          >
            🎨 {language === 'ar' ? 'لوحة الرسم' : 'Drawing Board'}
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="profile-picture-btn"
            onClick={() => {
              playClickSound();
              setShowProfilePictureModal(true);
            }}
            title={language === 'ar' ? 'الصورة الشخصية' : 'Profile Picture'}
          >
            {currentProfilePicture ? (
              currentProfilePicture.startsWith('data:') ? (
                <img src={currentProfilePicture} alt="Profile" className="profile-pic-small" />
              ) : (
                <span className="profile-emoji">{currentProfilePicture}</span>
              )
            ) : (
              <span className="profile-emoji">👤</span>
            )}
          </button>
          <button
            className="data-management-btn"
            onClick={() => {
              playClickSound();
              setShowDataManagement(true);
            }}
            title={language === 'ar' ? 'إدارة البيانات' : 'Data Management'}
          >
            💾
          </button>
          <SoundToggle language={language} />
          <DarkModeToggle language={language} />
          <button className="sign-out-btn" onClick={onSignOut}>
            🚪 {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </nav>
      )}

      <main className={`platform-content ${(currentSection === 'learn' || currentSection === 'chat' || currentSection === 'voice' || currentSection === 'teacherchat') ? 'fullscreen' : ''}`}>
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

          {currentSection === 'memory' && (
            <motion.div
              key="memory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MemoryGame />
            </motion.div>
          )}

          {currentSection === 'points' && (
            <motion.div
              key="points"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PointsTracker language={language} />
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
        </AnimatePresence>
      </main>

      {/* Profile Picture Modal */}
      <AnimatePresence>
        {showProfilePictureModal && (
          <ProfilePictureUpload
            currentUser={getCurrentUserEmail()}
            onUpdate={(imageData) => {
              setCurrentProfilePicture(imageData);
            }}
            onClose={() => setShowProfilePictureModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Data Management Modal */}
      <AnimatePresence>
        {showDataManagement && (
          <DataManagement
            userEmail={getCurrentUserEmail()}
            language={language}
            onClose={() => setShowDataManagement(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArabicLearningPlatform;