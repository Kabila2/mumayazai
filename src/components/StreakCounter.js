import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playStreakSound, playAchievementSound } from '../utils/soundEffects';
import { getTotalPoints, POINTS_CHANGED_EVENT } from '../utils/leaderboardUtils';
import {
  getStreak,
  touchStreak,
  armStreakFreeze,
  STREAK_CHANGED_EVENT
} from '../utils/streakUtils';
import './StreakCounter.css';

/**
 * The streak widget on the home page.
 *
 * The streak itself is now computed in utils/streakUtils.js (and advanced by
 * the platform on mount, whatever screen the learner lands on). This widget
 * reads it, shows the milestone celebration the first time a 7 / 30 / 100-day
 * streak is reached, and offers the freeze.
 */
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
      milestone100: '100 Day Legend!'
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
      milestone100: 'أسطورة 100 يوم!'
    }
  };

  const t = translations[language] || translations.en;

  const getCurrentUserEmail = () => {
    try {
      const session = JSON.parse(localStorage.getItem('stellar_session') || '{}');
      return session.email || null;
    } catch (error) {
      return null;
    }
  };

  // Read the streak, advance it for today if the platform has not already, and
  // celebrate a milestone reached right now.
  useEffect(() => {
    const email = getCurrentUserEmail();
    if (!email) return undefined;

    const result = touchStreak(email);
    setStreakData(result.data);
    if (result.milestone) {
      showMilestoneCelebration(`milestone${result.milestone}`);
    } else if (result.extended && result.data.currentStreak > 1) {
      playStreakSound();
    }

    const sync = () => setStreakData(getStreak(email));
    window.addEventListener(STREAK_CHANGED_EVENT, sync);
    return () => window.removeEventListener(STREAK_CHANGED_EVENT, sync);
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
  }, []);

  const showMilestoneCelebration = (type) => {
    setCelebrationType(type);
    setShowCelebration(true);
    playAchievementSound();

    setTimeout(() => {
      setShowCelebration(false);
    }, 4000);
  };

  const handleUseFreeze = () => {
    const email = getCurrentUserEmail();
    if (!email) return;
    setStreakData(armStreakFreeze(email));
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
