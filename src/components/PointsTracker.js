import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './PointsTracker.css';

const PointsTracker = ({ language }) => {
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    wordBuilderPoints: 0,
    alphabetPoints: 0,
    colorsPoints: 0,
    wordsPoints: 0,
    sentencesPoints: 0,
    memoryPoints: 0,
    bestStreak: 0,
    rank: 'bronze',
    badges: [],
    lastUpdated: null
  });

  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    loadUserStats();
    // Poll every 3 seconds so points/stats update in real time
    const interval = setInterval(loadUserStats, 3000);
    return () => clearInterval(interval);
  }, []);

  // Rebuild leaderboard whenever user's points or rank changes
  useEffect(() => {
    loadLeaderboard();
  }, [userStats.totalPoints, userStats.rank, language]);

  const loadUserStats = () => {
    // Load from all different sources
    const wordBuilderData = JSON.parse(localStorage.getItem('arabic_wordbuilder_progress') || '{}');
    const alphabetData = JSON.parse(localStorage.getItem('arabic_alphabet_progress') || '{}');
    const colorsData = JSON.parse(localStorage.getItem('arabic_colors_progress') || '{}');
    const wordsData = JSON.parse(localStorage.getItem('arabic_words_progress') || '{}');
    const sentencesData = JSON.parse(localStorage.getItem('arabic_sentences_progress') || '{}');
    const memoryData = JSON.parse(localStorage.getItem('arabic_memory_progress') || '{}');

    const wordBuilderPoints = wordBuilderData.totalPoints || 0;
    const alphabetPoints = alphabetData.totalPoints || 0;
    const colorsPoints = colorsData.totalPoints || 0;
    const wordsPoints = wordsData.totalPoints || 0;
    const sentencesPoints = sentencesData.totalPoints || 0;
    const memoryPoints = memoryData.totalPoints || 0;

    const totalPoints = wordBuilderPoints + alphabetPoints + colorsPoints + wordsPoints + sentencesPoints + memoryPoints;
    const bestStreak = Math.max(
      wordBuilderData.bestStreak || 0,
      alphabetData.bestStreak || 0,
      colorsData.bestStreak || 0
    );

    const rank = getRank(totalPoints);
    const badges = calculateBadges({
      totalPoints,
      wordBuilderPoints,
      alphabetPoints,
      colorsPoints,
      wordsPoints,
      sentencesPoints,
      memoryPoints,
      bestStreak
    });

    setUserStats({
      totalPoints,
      wordBuilderPoints,
      alphabetPoints,
      colorsPoints,
      wordsPoints,
      sentencesPoints,
      memoryPoints,
      bestStreak,
      rank,
      badges,
      lastUpdated: new Date().toISOString()
    });
  };

  const getRank = (points) => {
    if (points >= 500) return 'diamond';
    if (points >= 300) return 'platinum';
    if (points >= 200) return 'gold';
    if (points >= 100) return 'silver';
    return 'bronze';
  };

  const getRankInfo = (rank) => {
    const ranks = {
      bronze: { icon: '🥉', name: language === 'ar' ? 'برونزي' : 'Bronze', color: '#cd7f32', minPoints: 0 },
      silver: { icon: '🥈', name: language === 'ar' ? 'فضي' : 'Silver', color: '#c0c0c0', minPoints: 100 },
      gold: { icon: '🥇', name: language === 'ar' ? 'ذهبي' : 'Gold', color: '#ffd700', minPoints: 200 },
      platinum: { icon: '💠', name: language === 'ar' ? 'بلاتيني' : 'Platinum', color: '#e5e4e2', minPoints: 300 },
      diamond: { icon: '💎', name: language === 'ar' ? 'ماسي' : 'Diamond', color: '#b9f2ff', minPoints: 500 }
    };
    return ranks[rank];
  };

  const calculateBadges = (stats) => {
    const badges = [];

    // Points milestones
    if (stats.totalPoints >= 50) badges.push({ icon: '⭐', name: language === 'ar' ? 'محترف' : 'Achiever', desc: language === 'ar' ? '50 نقطة' : '50 Points' });
    if (stats.totalPoints >= 100) badges.push({ icon: '🌟', name: language === 'ar' ? 'متميز' : 'Superstar', desc: language === 'ar' ? '100 نقطة' : '100 Points' });
    if (stats.totalPoints >= 200) badges.push({ icon: '💫', name: language === 'ar' ? 'أسطوري' : 'Legend', desc: language === 'ar' ? '200 نقطة' : '200 Points' });
    if (stats.totalPoints >= 500) badges.push({ icon: '👑', name: language === 'ar' ? 'ملك' : 'Master', desc: language === 'ar' ? '500 نقطة' : '500 Points' });

    // Streak badges
    if (stats.bestStreak >= 5) badges.push({ icon: '🔥', name: language === 'ar' ? 'نار' : 'On Fire', desc: language === 'ar' ? 'سلسلة 5' : '5 Streak' });
    if (stats.bestStreak >= 10) badges.push({ icon: '⚡', name: language === 'ar' ? 'صاعقة' : 'Lightning', desc: language === 'ar' ? 'سلسلة 10' : '10 Streak' });

    // Activity badges
    if (stats.wordBuilderPoints >= 50) badges.push({ icon: '📝', name: language === 'ar' ? 'بناء الكلمات' : 'Word Master', desc: language === 'ar' ? 'بناء الكلمات' : 'Word Builder' });
    if (stats.alphabetPoints >= 50) badges.push({ icon: '🔤', name: language === 'ar' ? 'خبير الحروف' : 'Alphabet Expert', desc: language === 'ar' ? 'الحروف' : 'Alphabet' });

    return badges;
  };

  const loadLeaderboard = () => {
    // In a real app, this would come from a backend
    // For now, we'll create sample data
    const sampleLeaders = [
      { name: language === 'ar' ? 'أحمد' : 'Ahmed', points: 850, rank: 'diamond' },
      { name: language === 'ar' ? 'فاطمة' : 'Fatima', points: 720, rank: 'diamond' },
      { name: language === 'ar' ? 'محمد' : 'Mohammed', points: 650, rank: 'diamond' },
      { name: language === 'ar' ? 'عائشة' : 'Aisha', points: 480, rank: 'platinum' },
      { name: language === 'ar' ? 'أنت' : 'You', points: userStats.totalPoints, rank: userStats.rank }
    ].sort((a, b) => b.points - a.points);

    setLeaderboard(sampleLeaders);
  };

  const getNextRankProgress = () => {
    const currentRankInfo = getRankInfo(userStats.rank);
    const ranks = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentRankIndex = ranks.indexOf(userStats.rank);

    if (currentRankIndex === ranks.length - 1) {
      return { nextRank: null, pointsNeeded: 0, progress: 100 };
    }

    const nextRank = ranks[currentRankIndex + 1];
    const nextRankInfo = getRankInfo(nextRank);
    const pointsNeeded = nextRankInfo.minPoints - userStats.totalPoints;
    const progress = ((userStats.totalPoints - currentRankInfo.minPoints) / (nextRankInfo.minPoints - currentRankInfo.minPoints)) * 100;

    return { nextRank: nextRankInfo, pointsNeeded, progress: Math.min(progress, 100) };
  };

  const rankProgress = getNextRankProgress();
  const currentRankInfo = getRankInfo(userStats.rank);

  return (
    <div className="points-tracker">
      <div className="tracker-header">
        <h1 className="tracker-title">
          {language === 'ar' ? 'نقاطي وإنجازاتي' : 'My Points & Achievements'}
        </h1>
      </div>

      {/* Main Stats */}
      <motion.div
        className="main-stats-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="total-points-display">
          <div className="points-icon">🪙</div>
          <div className="points-info">
            <div className="points-label">{language === 'ar' ? 'مجموع النقاط' : 'Total Points'}</div>
            <div className="points-value">{userStats.totalPoints}</div>
          </div>
        </div>

        <div className="rank-display">
          <div className="rank-icon" style={{ fontSize: '5rem' }}>{currentRankInfo.icon}</div>
          <div className="rank-info">
            <div className="rank-label">{language === 'ar' ? 'الرتبة' : 'Rank'}</div>
            <div className="rank-name" style={{ color: currentRankInfo.color }}>{currentRankInfo.name}</div>
          </div>
        </div>

        {rankProgress.nextRank && (
          <div className="rank-progress-container">
            <div className="progress-label">
              {language === 'ar'
                ? `${rankProgress.pointsNeeded} نقطة للوصول إلى ${rankProgress.nextRank.name}`
                : `${rankProgress.pointsNeeded} points to ${rankProgress.nextRank.name}`
              }
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${rankProgress.progress}%` }}></div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Points Breakdown */}
      <motion.div
        className="points-breakdown"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="section-title">{language === 'ar' ? 'تفصيل النقاط' : 'Points Breakdown'}</h2>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <div className="breakdown-icon">🔤</div>
            <div className="breakdown-label">{language === 'ar' ? 'بناء الكلمات' : 'Word Builder'}</div>
            <div className="breakdown-points">{userStats.wordBuilderPoints}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-icon">🔠</div>
            <div className="breakdown-label">{language === 'ar' ? 'الحروف' : 'Alphabet'}</div>
            <div className="breakdown-points">{userStats.alphabetPoints}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-icon">🎨</div>
            <div className="breakdown-label">{language === 'ar' ? 'الألوان' : 'Colors'}</div>
            <div className="breakdown-points">{userStats.colorsPoints}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-icon">📝</div>
            <div className="breakdown-label">{language === 'ar' ? 'الكلمات' : 'Words'}</div>
            <div className="breakdown-points">{userStats.wordsPoints}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-icon">💬</div>
            <div className="breakdown-label">{language === 'ar' ? 'الجمل' : 'Sentences'}</div>
            <div className="breakdown-points">{userStats.sentencesPoints}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-icon">🧠</div>
            <div className="breakdown-label">{language === 'ar' ? 'الذاكرة' : 'Memory'}</div>
            <div className="breakdown-points">{userStats.memoryPoints}</div>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      {userStats.badges.length > 0 && (
        <motion.div
          className="badges-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="section-title">{language === 'ar' ? 'الأوسمة' : 'Badges'}</h2>
          <div className="badges-grid">
            {userStats.badges.map((badge, index) => (
              <motion.div
                key={index}
                className="badge-item"
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
                <div className="badge-desc">{badge.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      <motion.div
        className="leaderboard-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="section-title">{language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}</h2>
        <div className="leaderboard-list">
          {leaderboard.map((player, index) => (
            <div
              key={index}
              className={`leaderboard-item ${player.name === (language === 'ar' ? 'أنت' : 'You') ? 'current-user' : ''}`}
            >
              <div className="leaderboard-rank">#{index + 1}</div>
              <div className="leaderboard-name">{player.name}</div>
              <div className="leaderboard-points">{player.points} 🪙</div>
              <div className="leaderboard-badge">{getRankInfo(player.rank).icon}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* How to Earn Points */}
      <motion.div
        className="earn-points-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="section-title">{language === 'ar' ? 'كيفية كسب النقاط' : 'How to Earn Points'}</h2>
        <div className="earn-points-grid">
          <div className="earn-item">
            <div className="earn-icon">🔤</div>
            <div className="earn-title">{language === 'ar' ? 'بناء الكلمات' : 'Word Builder'}</div>
            <div className="earn-desc">{language === 'ar' ? '10 نقاط لكل كلمة صحيحة + مكافأة السلسلة' : '10 points per word + streak bonus'}</div>
          </div>
          <div className="earn-item">
            <div className="earn-icon">📚</div>
            <div className="earn-title">{language === 'ar' ? 'التعلم' : 'Learning Activities'}</div>
            <div className="earn-desc">{language === 'ar' ? 'أكمل الدروس في الحروف والكلمات والجمل' : 'Complete lessons in alphabet, words, sentences'}</div>
          </div>
          <div className="earn-item">
            <div className="earn-icon">🎯</div>
            <div className="earn-title">{language === 'ar' ? 'الاختبارات' : 'Tests'}</div>
            <div className="earn-desc">{language === 'ar' ? 'اجتاز الاختبارات بنجاح' : 'Pass tests successfully'}</div>
          </div>
          <div className="earn-item">
            <div className="earn-icon">🔥</div>
            <div className="earn-title">{language === 'ar' ? 'السلسلة' : 'Streaks'}</div>
            <div className="earn-desc">{language === 'ar' ? '+5 نقاط لكل إجابة صحيحة متتالية' : '+5 points per consecutive correct answer'}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PointsTracker;
