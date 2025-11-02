import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playStreakSound, playAchievementSound } from '../utils/soundEffects';
import './StreakCounter.css';

const StreakCounter = ({ language = 'en' }) => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    streakFreeze: false,
    totalDaysActive: 0
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState('');

  const translations = {
    en: {
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      days: 'days',
      day: 'day',
      keepItUp: 'Keep it up!',
      comeBackTomorrow: 'Come back tomorrow!',
      freezeAvailable: 'Freeze Available',
      useFreeze: 'Use Freeze',
      milestone7: '7 Day Warrior!',
      milestone30: '30 Day Champion!',
      milestone100: '100 Day Legend!',
      streakBroken: 'Streak Broken',
      startAgain: 'Start a new streak today!'
    },
    ar: {
      currentStreak: 'السلسلة الحالية',
      longestStreak: 'أطول سلسلة',
      days: 'أيام',
      day: 'يوم',
      keepItUp: 'واصل التقدم!',
      comeBackTomorrow: 'عد غداً!',
      freezeAvailable: 'التجميد متاح',
      useFreeze: 'استخدم التجميد',
      milestone7: 'محارب 7 أيام!',
      milestone30: 'بطل 30 يوم!',
      milestone100: 'أسطورة 100 يوم!',
      streakBroken: 'انقطعت السلسلة',
      startAgain: 'ابدأ سلسلة جديدة اليوم!'
    }
  };

  const t = translations[language] || translations.en;

  // Load streak data from localStorage
  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = () => {
    try {
      const userEmail = getCurrentUserEmail();
      if (!userEmail) return;

      const streakKey = `mumayaz_streak_${userEmail}`;
      const savedStreak = localStorage.getItem(streakKey);

      if (savedStreak) {
        const data = JSON.parse(savedStreak);
        setStreakData(data);
        checkAndUpdateStreak(data);
      } else {
        // Initialize new streak
        const newStreak = {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          streakFreeze: false,
          totalDaysActive: 0
        };
        saveStreakData(newStreak);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  const getCurrentUserEmail = () => {
    try {
      const session = JSON.parse(localStorage.getItem('mumayaz_session') || '{}');
      return session.email || null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  };

  const saveStreakData = (data) => {
    try {
      const userEmail = getCurrentUserEmail();
      if (!userEmail) return;

      const streakKey = `mumayaz_streak_${userEmail}`;
      localStorage.setItem(streakKey, JSON.stringify(data));
      setStreakData(data);
    } catch (error) {
      console.error('Error saving streak data:', error);
    }
  };

  const checkAndUpdateStreak = (data) => {
    const today = new Date().toDateString();
    const lastActive = data.lastActiveDate ? new Date(data.lastActiveDate).toDateString() : null;

    if (!lastActive) {
      // First time user
      const updatedData = {
        ...data,
        currentStreak: 1,
        longestStreak: Math.max(1, data.longestStreak),
        lastActiveDate: today,
        totalDaysActive: data.totalDaysActive + 1
      };
      saveStreakData(updatedData);
      checkMilestone(1);
      return;
    }

    if (lastActive === today) {
      // Already counted for today
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastActive === yesterdayStr) {
      // Consecutive day
      const newStreak = data.currentStreak + 1;
      const updatedData = {
        ...data,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, data.longestStreak),
        lastActiveDate: today,
        totalDaysActive: data.totalDaysActive + 1,
        streakFreeze: false // Reset freeze after use
      };
      saveStreakData(updatedData);
      checkMilestone(newStreak);
    } else {
      // Check if freeze is available
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toDateString();

      if (lastActive === twoDaysAgoStr && data.streakFreeze) {
        // Use freeze to save streak
        const updatedData = {
          ...data,
          lastActiveDate: today,
          totalDaysActive: data.totalDaysActive + 1,
          streakFreeze: false
        };
        saveStreakData(updatedData);
      } else {
        // Streak broken
        const updatedData = {
          ...data,
          currentStreak: 1,
          lastActiveDate: today,
          totalDaysActive: data.totalDaysActive + 1,
          streakFreeze: false
        };
        saveStreakData(updatedData);
      }
    }
  };

  const checkMilestone = (streak) => {
    if (streak === 7) {
      showMilestoneCelebration('milestone7');
    } else if (streak === 30) {
      showMilestoneCelebration('milestone30');
    } else if (streak === 100) {
      showMilestoneCelebration('milestone100');
    } else if (streak > 1) {
      playStreakSound();
    }
  };

  const showMilestoneCelebration = (type) => {
    setCelebrationType(type);
    setShowCelebration(true);
    playAchievementSound();

    setTimeout(() => {
      setShowCelebration(false);
    }, 4000);
  };

  const handleUseFreeze = () => {
    const updatedData = {
      ...streakData,
      streakFreeze: true
    };
    saveStreakData(updatedData);
  };

  const getStreakColor = () => {
    if (streakData.currentStreak >= 100) return '#ff6b6b';
    if (streakData.currentStreak >= 30) return '#f59e0b';
    if (streakData.currentStreak >= 7) return '#10b981';
    return '#6b7280';
  };

  const getFlameEmoji = () => {
    if (streakData.currentStreak >= 100) return '🔥🔥🔥';
    if (streakData.currentStreak >= 30) return '🔥🔥';
    if (streakData.currentStreak >= 7) return '🔥';
    return '✨';
  };

  return (
    <div className="streak-counter-container">
      <motion.div
        className="streak-display"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="streak-flame-icon">
          <motion.span
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{ fontSize: '3rem' }}
          >
            {getFlameEmoji()}
          </motion.span>
        </div>

        <div className="streak-info">
          <h3 className="streak-label">{t.currentStreak}</h3>
          <motion.div
            className="streak-number"
            style={{ color: getStreakColor() }}
            key={streakData.currentStreak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {streakData.currentStreak}
          </motion.div>
          <p className="streak-days-label">
            {streakData.currentStreak === 1 ? t.day : t.days}
          </p>
        </div>

        <div className="streak-stats">
          <div className="stat-box">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{streakData.longestStreak}</div>
            <div className="stat-label">{t.longestStreak}</div>
          </div>
        </div>

        {streakData.currentStreak > 0 && (
          <motion.p
            className="streak-encouragement"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t.keepItUp} {t.comeBackTomorrow}
          </motion.p>
        )}

        {streakData.currentStreak >= 3 && !streakData.streakFreeze && (
          <motion.button
            className="freeze-button"
            onClick={handleUseFreeze}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            ❄️ {t.useFreeze}
          </motion.button>
        )}

        {streakData.streakFreeze && (
          <div className="freeze-active">
            ❄️ {t.freezeAvailable}
          </div>
        )}
      </motion.div>

      {/* Milestone Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="milestone-celebration"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div
              className="celebration-content"
              animate={{
                rotate: [0, 5, -5, 5, -5, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ duration: 0.8, repeat: 3 }}
            >
              <div className="celebration-emoji">
                {celebrationType === 'milestone7' && '🎉'}
                {celebrationType === 'milestone30' && '🏆'}
                {celebrationType === 'milestone100' && '👑'}
              </div>
              <h2 className="celebration-title">{t[celebrationType]}</h2>
              <p className="celebration-message">
                {streakData.currentStreak} {t.days} {t.currentStreak}!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreakCounter;
