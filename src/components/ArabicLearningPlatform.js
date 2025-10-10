import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ArabicAlphabetLearning from "./ArabicAlphabetLearning";
import ArabicColorsLearning from "./ArabicColorsLearning";
import ArabicWordsLearning from "./ArabicWordsLearning";
import ChatInterface from "./ChatInterface";
import VoiceInterface from "./VoiceInterface";
import MemoryGame from "./MemoryGame";
import './ArabicLearningPlatform.css';

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
  const [currentSection, setCurrentSection] = useState('home'); // 'home', 'alphabet', 'colors', 'words', 'chat', 'voice', 'memory'
  const [chatMode, setChatMode] = useState('text'); // 'text' | 'voice'
  const [userProgress, setUserProgress] = useState({
    alphabetProgress: 0,
    colorsProgress: 0,
    totalSessions: 0,
    streak: 0
  });
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
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

  // Handle scroll indicator
  useEffect(() => {
    const handleScroll = () => {
      const platform = platformRef.current;
      if (platform) {
        const scrollTop = platform.scrollTop;
        const scrollHeight = platform.scrollHeight;
        const clientHeight = platform.clientHeight;

        // Show scroll indicator if content is scrollable and not at bottom
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };

    const platform = platformRef.current;
    if (platform) {
      platform.addEventListener('scroll', handleScroll);
      // Check initial state
      handleScroll();

      return () => platform.removeEventListener('scroll', handleScroll);
    }
  }, [currentSection]);

  // Smooth scroll to bottom function
  const scrollToBottom = () => {
    const platform = platformRef.current;
    if (platform) {
      platform.scrollTo({
        top: platform.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

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
    setCurrentSection(section);
    if (section === 'alphabet' || section === 'colors') {
      updateSessionCount();
    }
  };

  const handleChatModeSwitch = (mode) => {
    setChatMode(mode);
    setCurrentSection(mode === 'text' ? 'chat' : 'voice');
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

  const renderHomeSection = () => (
    <div className="home-section">
      <motion.div
        className="welcome-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="platform-title">
          {language === 'ar' ? 'مرحباً بك في منصة تعلم العربية' : 'Welcome to Arabic Learning Platform'}
        </h1>
        <p className="platform-subtitle">
          {language === 'ar'
            ? 'تعلم الحروف والألوان العربية بطريقة ممتعة وتفاعلية'
            : 'Learn Arabic letters and colors in a fun and interactive way'
          }
        </p>
      </motion.div>

      {renderProgressCard()}

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
          className="section-card memory-card"
          onClick={() => handleSectionChange('memory')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
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
          className="section-card chat-card"
          onClick={() => handleSectionChange('chat')}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
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

  return (
    <div className="arabic-learning-platform" ref={platformRef}>
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
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <button
            className={`nav-link ${currentSection === 'alphabet' ? 'active' : ''}`}
            onClick={() => handleSectionChange('alphabet')}
          >
            {language === 'ar' ? 'الحروف' : 'Alphabet'}
          </button>
          <button
            className={`nav-link ${currentSection === 'colors' ? 'active' : ''}`}
            onClick={() => handleSectionChange('colors')}
          >
            {language === 'ar' ? 'الألوان' : 'Colors'}
          </button>
          <button
            className={`nav-link ${currentSection === 'words' ? 'active' : ''}`}
            onClick={() => handleSectionChange('words')}
          >
            {language === 'ar' ? 'الكلمات' : 'Words'}
          </button>
          <button
            className={`nav-link ${(currentSection === 'chat' || currentSection === 'voice') ? 'active' : ''}`}
            onClick={() => setCurrentSection(chatMode === 'text' ? 'chat' : 'voice')}
          >
            {language === 'ar' ? 'المساعد' : 'Assistant'}
          </button>
        </div>

        <button className="sign-out-btn" onClick={onSignOut}>
          {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </nav>

      <main className="platform-content">
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

          {currentSection === 'alphabet' && (
            <motion.div
              key="alphabet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="section-header">
                <button
                  className="back-btn"
                  onClick={() => setCurrentSection('home')}
                >
                  {language === 'ar' ? '← العودة' : '← Back'}
                </button>
              </div>
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
              <div className="section-header">
                <button
                  className="back-btn"
                  onClick={() => setCurrentSection('home')}
                >
                  {language === 'ar' ? '← العودة' : '← Back'}
                </button>
              </div>
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
              <div className="section-header">
                <button
                  className="back-btn"
                  onClick={() => setCurrentSection('home')}
                >
                  {language === 'ar' ? '← العودة' : '← Back'}
                </button>
              </div>
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

          {currentSection === 'memory' && (
            <motion.div
              key="memory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="section-header">
                <button
                  className="back-btn"
                  onClick={() => setCurrentSection('home')}
                >
                  {language === 'ar' ? '← العودة' : '← Back'}
                </button>
              </div>
              <MemoryGame />
            </motion.div>
          )}

          {currentSection === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="section-header">
                <button
                  className="back-btn"
                  onClick={() => setCurrentSection('home')}
                >
                  {language === 'ar' ? '← العودة' : '← Back'}
                </button>
                <button
                  className="switch-mode-btn"
                  onClick={() => handleChatModeSwitch('voice')}
                >
                  🎤 {language === 'ar' ? 'الوضع الصوتي' : 'Voice Mode'}
                </button>
              </div>
              <ChatInterface
                t={t}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                reducedMotion={reducedMotion}
                assistantTitle={assistantTitle}
                currentPreference={currentPreference}
                onSwitchMode={() => handleChatModeSwitch('voice')}
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
            >
              <div className="section-header">
                <button
                  className="back-btn"
                  onClick={() => setCurrentSection('home')}
                >
                  {language === 'ar' ? '← العودة' : '← Back'}
                </button>
                <button
                  className="switch-mode-btn"
                  onClick={() => handleChatModeSwitch('text')}
                >
                  💬 {language === 'ar' ? 'الوضع النصي' : 'Text Mode'}
                </button>
              </div>
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
                customPrompt={getLearningPrompt('general')}
                isLearningMode={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Scroll Down Indicator */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
          >
            <div className="scroll-arrow">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ↓
              </motion.div>
            </div>
            <div className="scroll-text">
              {language === 'ar' ? 'مرر للأسفل' : 'Scroll down'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArabicLearningPlatform;