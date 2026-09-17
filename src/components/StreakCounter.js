import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playStreakSound, playAchievementSound } from '../utils/soundEffects';
import { getTotalPoints, POINTS_CHANGED_EVENT } from '../utils/leaderboardUtils';
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
  const [totalPoints, setTotalPoints] = useState(0);

  const translations = {
    en: {
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      days: 'days',
      day: 'day',
      keepItUp: 'Keep it up!',
      greatStart: 'Great start! Come back tomorrow.',
      daysActive: 'Days Active',
      totalPoints: 'Total Points',
      freezeHelp: 'A streak freeze protects your streak if you miss one day.',
      comeBackTomorrow: 'Come back tomorrow!',
      freezeAvailable: 'Streak protected',
      useFreeze: 'Protect my streak',
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
      greatStart: 'بداية رائعة! عد غداً.',
      daysActive: 'أيام النشاط',
      totalPoints: 'مجموع النقاط',
      freezeHelp: 'تجميد السلسلة يحميها إذا فاتك يوم واحد.',
      comeBackTomorrow: 'عد غداً!',
      freezeAvailable: 'السلسلة محمية',
      useFreeze: 'احمِ سلسلتي',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Points total for the summary strip (same source as the points bar)
  useEffect(() => {
    const email = getCurrentUserEmail();
    if (!email) return undefined;
    const read = () => setTotalPoints(getTotalPoints(email));
    read();
    window.addEventListener(POINTS_CHANGED_EVENT, read);
    return () => window.removeEventListener(POINTS_CHANGED_EVENT, read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStreakData = () => {
    try {
      const userEmail = getCurrentUserEmail();
      if (!userEmail) return;

      const streakKey = `stellar_streak_${userEmail}`;
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
      const session = JSON.parse(localStorage.getItem('stellar_session') || '{}');
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

      const streakKey = `stellar_streak_${userEmail}`;
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

  const getFlameEmoji = () => {
    if (streakData.currentStreak >= 100) return '👑';
    if (streakData.currentStreak >= 30) return '🏆';
    if (streakData.currentStreak >= 7) return '🔥';
    return '✨';
  };

  const streakWord = (count) => (count === 1 ? t.day : t.days);
  const hint = streakData.currentStreak <= 1 ? t.greatStart : `${t.keepItUp} ${t.comeBackTomorrow}`;

  const stats = [
    { key: 'best', icon: '🏆', value: streakData.longestStreak, label: t.longestStreak },
    { key: 'active', icon: '📅', value: streakData.totalDaysActive, label: t.daysActive },
    { key: 'points', icon: '🪙', value: totalPoints, label: t.totalPoints }
  ];

  return (
    <div className="streak-counter-container">
      <div className="sc-card">
        <div className="sc-hero">
          <motion.span
            className="sc-flame"
            aria-hidden="true"
            animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {getFlameEmoji()}
          </motion.span>
          <div className="sc-hero-text">
            <span className="sc-hero-label">{t.currentStreak}</span>
            <span className="sc-hero-value">
              <motion.strong
                key={streakData.currentStreak}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220 }}
              >
                {streakData.currentStreak}
              </motion.strong>
              {' '}{streakWord(streakData.currentStreak)}
            </span>
            <span className="sc-hero-hint">{hint}</span>
          </div>
        </div>

        <div className="sc-stats">
          {stats.map(stat => (
            <div className="sc-stat" key={stat.key}>
              <span className="sc-stat-icon" aria-hidden="true">{stat.icon}</span>
              <span className="sc-stat-value">{stat.value}</span>
              <span className="sc-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        {streakData.currentStreak >= 3 && !streakData.streakFreeze && (
          <button className="sc-freeze-btn" onClick={handleUseFreeze} title={t.freezeHelp}>
            <span aria-hidden="true">❄️</span> {t.useFreeze}
          </button>
        )}

        {streakData.streakFreeze && (
          <div className="sc-freeze-active" title={t.freezeHelp}>
            <span aria-hidden="true">❄️</span> {t.freezeAvailable}
          </div>
        )}
      </div>

      {/* Milestone Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="sc-celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              className="sc-celebration-content"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="sc-celebration-emoji" aria-hidden="true">
                {celebrationType === 'milestone7' && '🎉'}
                {celebrationType === 'milestone30' && '🏆'}
                {celebrationType === 'milestone100' && '👑'}
              </div>
              <h2 className="sc-celebration-title">{t[celebrationType]}</h2>
              <p className="sc-celebration-message">
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
