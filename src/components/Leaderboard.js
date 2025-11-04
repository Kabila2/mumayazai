import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Leaderboard.css';

const Leaderboard = ({ userEmail, language, onClose }) => {
  const [timeFilter, setTimeFilter] = useState('weekly'); // 'weekly' | 'monthly' | 'alltime'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  const t = {
    en: {
      title: 'Leaderboard',
      subtitle: 'Top learners competing for excellence',
      weekly: 'This Week',
      monthly: 'This Month',
      alltime: 'All Time',
      rank: 'Rank',
      student: 'Student',
      points: 'Points',
      you: '(You)',
      noData: 'No leaderboard data available yet',
      startLearning: 'Start learning to appear on the leaderboard!',
      closeBtn: '✕'
    },
    ar: {
      title: 'لوحة المتصدرين',
      subtitle: 'أفضل المتعلمين يتنافسون على التميز',
      weekly: 'هذا الأسبوع',
      monthly: 'هذا الشهر',
      alltime: 'كل الأوقات',
      rank: 'الترتيب',
      student: 'الطالب',
      points: 'النقاط',
      you: '(أنت)',
      noData: 'لا توجد بيانات متاحة بعد',
      startLearning: 'ابدأ التعلم للظهور في لوحة المتصدرين!',
      closeBtn: '✕'
    }
  };

  const currentLang = t[language] || t.en;

  useEffect(() => {
    calculateLeaderboard();
  }, [timeFilter, userEmail]);

  const calculateLeaderboard = () => {
    const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
    const allUserData = [];

    // Get current date for filtering
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    Object.keys(users).forEach(email => {
      const user = users[email];

      // Only include students and children
      if (user.role !== 'student' && user.role !== 'child') return;

      // Calculate points based on various activities
      let points = 0;
      const progressData = user.progressData || {};
      const sessions = progressData.sessions || [];

      // Filter sessions based on time period
      const filteredSessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        if (timeFilter === 'weekly') {
          return sessionDate >= oneWeekAgo;
        } else if (timeFilter === 'monthly') {
          return sessionDate >= oneMonthAgo;
        }
        return true; // all time
      });

      // Calculate points from sessions
      filteredSessions.forEach(session => {
        points += Math.floor(session.timeSpent / 5); // 1 point per 5 minutes
        points += session.messagesCount || 0; // 1 point per message
      });

      // Add bonus points for achievements
      const achievements = progressData.achievements || [];
      const filteredAchievements = achievements.filter(achievement => {
        if (!achievement.date) return timeFilter === 'alltime';
        const achievementDate = new Date(achievement.date);
        if (timeFilter === 'weekly') {
          return achievementDate >= oneWeekAgo;
        } else if (timeFilter === 'monthly') {
          return achievementDate >= oneMonthAgo;
        }
        return true;
      });
      points += filteredAchievements.length * 50; // 50 points per achievement

      // Add bonus for quiz scores
      const quizScores = progressData.quizScores || [];
      const filteredQuizzes = quizScores.filter(quiz => {
        if (!quiz.date) return timeFilter === 'alltime';
        const quizDate = new Date(quiz.date);
        if (timeFilter === 'weekly') {
          return quizDate >= oneWeekAgo;
        } else if (timeFilter === 'monthly') {
          return quizDate >= oneMonthAgo;
        }
        return true;
      });

      filteredQuizzes.forEach(quiz => {
        points += quiz.score * 10; // Points based on quiz score
      });

      // Add streak bonus
      const streak = progressData.streak || 0;
      if (timeFilter === 'alltime') {
        points += streak * 25; // 25 points per day in streak
      }

      if (points > 0 || timeFilter === 'alltime') {
        allUserData.push({
          email,
          name: user.displayName || user.name || email.split('@')[0],
          points,
          profilePicture: user.profilePicture
        });
      }
    });

    // Sort by points descending
    allUserData.sort((a, b) => b.points - a.points);

    // Assign ranks
    const rankedData = allUserData.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    setLeaderboardData(rankedData);

    // Find current user's rank
    const currentUser = rankedData.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    setCurrentUserRank(currentUser || null);
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'transparent';
  };

  return (
    <motion.div
      className="leaderboard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="leaderboard-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="leaderboard-header">
          <div>
            <h2 className="leaderboard-title">{currentLang.title}</h2>
            <p className="leaderboard-subtitle">{currentLang.subtitle}</p>
          </div>
          <button className="leaderboard-close-btn" onClick={onClose} aria-label="Close">
            {currentLang.closeBtn}
          </button>
        </div>

        {/* Time Filter Tabs */}
        <div className="leaderboard-filters">
          <button
            className={`filter-btn ${timeFilter === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeFilter('weekly')}
          >
            📅 {currentLang.weekly}
          </button>
          <button
            className={`filter-btn ${timeFilter === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeFilter('monthly')}
          >
            📆 {currentLang.monthly}
          </button>
          <button
            className={`filter-btn ${timeFilter === 'alltime' ? 'active' : ''}`}
            onClick={() => setTimeFilter('alltime')}
          >
            ⏰ {currentLang.alltime}
          </button>
        </div>

        {/* Current User Rank Highlight */}
        {currentUserRank && (
          <motion.div
            className="current-user-rank"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="rank-badge">
              {getRankEmoji(currentUserRank.rank) || `#${currentUserRank.rank}`}
            </div>
            <div className="rank-info">
              <span className="rank-label">{currentLang.you}</span>
              <span className="rank-points">{currentUserRank.points} {currentLang.points}</span>
            </div>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <div className="leaderboard-content">
          {leaderboardData.length === 0 ? (
            <div className="no-data-message">
              <div className="no-data-icon">🏆</div>
              <p>{currentLang.noData}</p>
              <p className="no-data-subtext">{currentLang.startLearning}</p>
            </div>
          ) : (
            <div className="leaderboard-list">
              {/* Table Header */}
              <div className="leaderboard-list-header">
                <div className="header-rank">{currentLang.rank}</div>
                <div className="header-student">{currentLang.student}</div>
                <div className="header-points">{currentLang.points}</div>
              </div>

              {/* Table Body */}
              <AnimatePresence>
                {leaderboardData.map((user, index) => {
                  const isCurrentUser = user.email.toLowerCase() === userEmail.toLowerCase();

                  return (
                    <motion.div
                      key={user.email}
                      className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}
                      style={{ borderLeftColor: getRankColor(user.rank) }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <div className="item-rank">
                        <span className="rank-number" style={{ color: getRankColor(user.rank) || '#667eea' }}>
                          {getRankEmoji(user.rank) || `#${user.rank}`}
                        </span>
                      </div>

                      <div className="item-student">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="student-avatar"
                          />
                        ) : (
                          <div className="student-avatar-placeholder">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="student-name">
                          {user.name}
                          {isCurrentUser && <span className="you-tag">{currentLang.you}</span>}
                        </span>
                      </div>

                      <div className="item-points">
                        <span className="points-value">{user.points.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Leaderboard;
