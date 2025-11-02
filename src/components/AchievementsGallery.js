import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS, getUserAchievements, getAchievementStats } from '../utils/achievementsSystem';
import { playClickSound, playPopSound } from '../utils/soundEffects';
import './AchievementsGallery.css';

const AchievementsGallery = ({ userEmail, language = 'en', onClose }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unlocked', 'locked', or category
  const [stats, setStats] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  const translations = {
    en: {
      title: 'Achievements & Badges',
      all: 'All',
      unlocked: 'Unlocked',
      locked: 'Locked',
      categories: {
        learning: 'Learning',
        streak: 'Streak',
        alphabet: 'Alphabet',
        points: 'Points',
        social: 'Social',
        time: 'Time',
        practice: 'Practice',
        special: 'Special'
      },
      rarity: {
        common: 'Common',
        rare: 'Rare',
        legendary: 'Legendary'
      },
      progress: 'Progress',
      points: 'points',
      unlockedOn: 'Unlocked on',
      notUnlocked: 'Not unlocked yet',
      close: 'Close'
    },
    ar: {
      title: 'الإنجازات والشارات',
      all: 'الكل',
      unlocked: 'مفتوح',
      locked: 'مغلق',
      categories: {
        learning: 'التعلم',
        streak: 'السلسلة',
        alphabet: 'الحروف',
        points: 'النقاط',
        social: 'الاجتماعي',
        time: 'الوقت',
        practice: 'التمرين',
        special: 'خاص'
      },
      rarity: {
        common: 'عادي',
        rare: 'نادر',
        legendary: 'أسطوري'
      },
      progress: 'التقدم',
      points: 'نقطة',
      unlockedOn: 'فتح في',
      notUnlocked: 'لم يفتح بعد',
      close: 'إغلاق'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadAchievements();
  }, [userEmail]);

  const loadAchievements = () => {
    const unlocked = getUserAchievements(userEmail);
    const achievementStats = getAchievementStats(userEmail);
    setUnlockedAchievements(unlocked);
    setStats(achievementStats);
  };

  const isUnlocked = (achievementId) => {
    return unlockedAchievements.some(a => a.id === achievementId);
  };

  const getUnlockedDate = (achievementId) => {
    const achievement = unlockedAchievements.find(a => a.id === achievementId);
    return achievement?.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : null;
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const filteredAchievements = Object.values(ACHIEVEMENTS).filter(achievement => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return isUnlocked(achievement.id);
    if (filter === 'locked') return !isUnlocked(achievement.id);
    return achievement.category === filter;
  });

  const handleAchievementClick = (achievement) => {
    playPopSound();
    setSelectedAchievement(achievement);
  };

  return (
    <motion.div
      className="achievements-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="achievements-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="achievements-header">
          <h2>🏆 {t.title}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="achievements-stats">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">{stats.unlocked}/{stats.total}</div>
              <div className="stat-label">{t.unlocked}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{stats.percentage}%</div>
              <div className="stat-label">{t.progress}</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setFilter('all');
            }}
          >
            {t.all}
          </button>
          <button
            className={`filter-tab ${filter === 'unlocked' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setFilter('unlocked');
            }}
          >
            ✅ {t.unlocked}
          </button>
          <button
            className={`filter-tab ${filter === 'locked' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setFilter('locked');
            }}
          >
            🔒 {t.locked}
          </button>
        </div>

        {/* Category Filters */}
        <div className="category-filters">
          {Object.keys(t.categories).map(category => (
            <button
              key={category}
              className={`category-filter ${filter === category ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setFilter(category);
              }}
            >
              {t.categories[category]}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="achievements-grid">
          {filteredAchievements.map(achievement => {
            const unlocked = isUnlocked(achievement.id);
            const unlockedDate = getUnlockedDate(achievement.id);

            return (
              <motion.div
                key={achievement.id}
                className={`achievement-card ${unlocked ? 'unlocked' : 'locked'} rarity-${achievement.rarity}`}
                whileHover={{ scale: unlocked ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAchievementClick(achievement)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  borderColor: unlocked ? getRarityColor(achievement.rarity) : '#e5e7eb'
                }}
              >
                <div className={`achievement-icon ${unlocked ? '' : 'grayscale'}`}>
                  {achievement.icon}
                </div>
                <h4 className="achievement-name">
                  {achievement.name[language] || achievement.name.en}
                </h4>
                <p className="achievement-description">
                  {achievement.description[language] || achievement.description.en}
                </p>
                <div className="achievement-footer">
                  <span className="achievement-points">
                    💰 {achievement.points} {t.points}
                  </span>
                  <span
                    className="achievement-rarity"
                    style={{ color: getRarityColor(achievement.rarity) }}
                  >
                    {t.rarity[achievement.rarity]}
                  </span>
                </div>
                {unlocked && unlockedDate && (
                  <div className="achievement-unlocked-date">
                    ✓ {unlockedDate}
                  </div>
                )}
                {!unlocked && (
                  <div className="achievement-locked-overlay">
                    <div className="lock-icon">🔒</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="no-achievements">
            <div className="no-achievements-icon">🎯</div>
            <p>No achievements found</p>
          </div>
        )}

        {/* Achievement Detail Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <motion.div
              className="achievement-detail-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAchievement(null)}
            >
              <motion.div
                className="achievement-detail"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  borderColor: getRarityColor(selectedAchievement.rarity)
                }}
              >
                <div className="detail-icon">{selectedAchievement.icon}</div>
                <h3>{selectedAchievement.name[language] || selectedAchievement.name.en}</h3>
                <p className="detail-description">
                  {selectedAchievement.description[language] || selectedAchievement.description.en}
                </p>
                <div className="detail-stats">
                  <div className="detail-stat">
                    <span>💰 {selectedAchievement.points} {t.points}</span>
                  </div>
                  <div className="detail-stat">
                    <span style={{ color: getRarityColor(selectedAchievement.rarity) }}>
                      {t.rarity[selectedAchievement.rarity]}
                    </span>
                  </div>
                </div>
                {isUnlocked(selectedAchievement.id) ? (
                  <div className="detail-unlocked">
                    ✅ {t.unlockedOn}: {getUnlockedDate(selectedAchievement.id)}
                  </div>
                ) : (
                  <div className="detail-locked">
                    🔒 {t.notUnlocked}
                  </div>
                )}
                <button
                  className="detail-close-btn"
                  onClick={() => setSelectedAchievement(null)}
                >
                  {t.close}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AchievementsGallery;
