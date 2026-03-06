import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playClickSound } from '../utils/soundEffects';
import AnalyticsCharts from './AnalyticsCharts';
import './ProgressDashboard.css';

const ProgressDashboard = ({ userEmail, language = 'en', onClose }) => {
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'all'

  const translations = {
    en: {
      title: 'Progress Dashboard',
      overview: 'Overview',
      performance: 'Performance',
      strengths: 'Strengths',
      weaknesses: 'Areas to Improve',
      recommendations: 'Recommendations',
      totalTime: 'Total Time Spent',
      topicsCompleted: 'Topics Completed',
      avgQuizScore: 'Avg Test Score',
      currentStreak: 'Current Streak',
      totalPoints: 'Total Points',
      points: 'points',
      week: 'This Week',
      month: 'This Month',
      all: 'All Time',
      hours: 'hours',
      days: 'days',
      topics: 'topics',
      close: 'Close',
      exportPDF: 'Export PDF',
      quizPerformance: 'Test Performance',
      learningActivity: 'Learning Activity',
      topAchievements: 'Top Achievements',
      recentActivity: 'Recent Activity',
      noData: 'No data available yet. Start learning to see your progress!',
      excellent: 'Excellent',
      good: 'Good',
      needsWork: 'Needs Work'
    },
    ar: {
      title: 'لوحة التقدم',
      overview: 'نظرة عامة',
      performance: 'الأداء',
      strengths: 'نقاط القوة',
      weaknesses: 'مجالات للتحسين',
      recommendations: 'التوصيات',
      totalTime: 'إجمالي الوقت المستغرق',
      topicsCompleted: 'المواضيع المكتملة',
      avgQuizScore: 'متوسط درجات الاختبار',
      currentStreak: 'السلسلة الحالية',
      totalPoints: 'إجمالي النقاط',
      points: 'نقاط',
      week: 'هذا الأسبوع',
      month: 'هذا الشهر',
      all: 'كل الأوقات',
      hours: 'ساعات',
      days: 'أيام',
      topics: 'مواضيع',
      close: 'إغلاق',
      exportPDF: 'تصدير PDF',
      quizPerformance: 'أداء الاختبارات',
      learningActivity: 'نشاط التعلم',
      topAchievements: 'أفضل الإنجازات',
      recentActivity: 'النشاط الأخير',
      noData: 'لا توجد بيانات بعد. ابدأ التعلم لرؤية تقدمك!',
      excellent: 'ممتاز',
      good: 'جيد',
      needsWork: 'يحتاج تحسين'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadStatistics();
  }, [userEmail, timeRange]);

  const loadStatistics = () => {
    try {
      console.log('📊 [ProgressDashboard] Loading statistics for user:', userEmail);

      // Load progress data with proper defaults
      const progressRaw = localStorage.getItem('arabic_learning_progress');
      const progress = progressRaw ? JSON.parse(progressRaw) : {};
      console.log('📊 [ProgressDashboard] Raw progress data:', progress);

      // Ensure all progress fields have defaults
      const safeProgress = {
        alphabetProgress: progress.alphabetProgress || 0,
        colorsProgress: progress.colorsProgress || 0,
        wordsProgress: progress.wordsProgress || 0,
        sentencesProgress: progress.sentencesProgress || 0,
        totalSessions: progress.totalSessions || 0,
        streak: progress.streak || 0,
        lastSessionDate: progress.lastSessionDate || null
      };
      console.log('📊 [ProgressDashboard] Safe progress data:', safeProgress);

      // Load quiz history
      const quizKey = `mumayaz_quiz_history_${userEmail}`;
      const quizHistoryRaw = localStorage.getItem(quizKey);
      const quizHistory = quizHistoryRaw ? JSON.parse(quizHistoryRaw) : [];

      // Load streak
      const streakKey = `mumayaz_streak_${userEmail}`;
      const streakRaw = localStorage.getItem(streakKey);
      const streakData = streakRaw ? JSON.parse(streakRaw) : { currentStreak: 0, longestStreak: 0 };

      // Load achievements
      const achievementsKey = `mumayaz_achievements_${userEmail}`;
      const achievementsRaw = localStorage.getItem(achievementsKey);
      const achievements = achievementsRaw ? JSON.parse(achievementsRaw) : [];

      // Load user stats (points, time, messages all stored here)
      const allUserStats = JSON.parse(localStorage.getItem('mumayaz_user_stats') || '{}');
      const userStats = allUserStats[userEmail?.toLowerCase()] || {
        totalMessages: 0,
        totalChats: 0,
        totalTimeSpent: 0,
        totalPoints: 0,
        lastActive: null
      };

      // Points come from mumayaz_user_stats
      const pointsData = { total: userStats.totalPoints || 0 };
      console.log('📊 [ProgressDashboard] User stats:', userStats);
      console.log('📊 [ProgressDashboard] Quiz history:', quizHistory.length, 'quizzes');
      console.log('📊 [ProgressDashboard] Points:', pointsData.total);
      console.log('📊 [ProgressDashboard] Streak:', streakData.currentStreak);

      // Calculate statistics
      const filteredQuizzes = filterByTimeRange(quizHistory);
      const avgScore = filteredQuizzes.length > 0
        ? Math.round(filteredQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / filteredQuizzes.length)
        : 0;
      console.log('📊 [ProgressDashboard] Filtered quizzes:', filteredQuizzes.length, 'avg score:', avgScore);

      const topicsCompleted = [
        safeProgress.alphabetProgress >= 100 ? 'Alphabet' : null,
        safeProgress.colorsProgress >= 100 ? 'Colors' : null,
        safeProgress.wordsProgress >= 100 ? 'Words' : null,
        safeProgress.sentencesProgress >= 100 ? 'Sentences' : null,
      ].filter(Boolean).length;

      // Calculate time spent - totalTimeSpent is stored in minutes, convert to hours
      const estimatedTime = userStats.totalTimeSpent > 0
        ? Math.round(userStats.totalTimeSpent / 60 * 10) / 10
        : Math.round((safeProgress.totalSessions || 0) * 5 / 60 * 10) / 10;

      // Analyze strengths and weaknesses
      const analysis = analyzePerformance(quizHistory, safeProgress);

      // Prepare chart data
      const chartData = prepareChartData(filteredQuizzes, safeProgress);

      const finalStats = {
        totalTime: estimatedTime,
        topicsCompleted,
        avgQuizScore: avgScore,
        currentStreak: streakData.currentStreak || 0,
        totalQuizzes: filteredQuizzes.length,
        totalPoints: pointsData.total || 0,
        achievements: achievements.length,
        totalMessages: userStats.totalMessages || 0,
        totalChatSessions: userStats.totalChats || 0,
        quizHistory: filteredQuizzes.slice(0, 10),
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
        progressData: safeProgress,
        chartData
      };

      console.log('📊 [ProgressDashboard] Final stats:', {
        totalTime: finalStats.totalTime,
        topicsCompleted: finalStats.topicsCompleted,
        avgQuizScore: finalStats.avgQuizScore,
        currentStreak: finalStats.currentStreak,
        totalQuizzes: finalStats.totalQuizzes,
        totalPoints: finalStats.totalPoints,
        achievements: finalStats.achievements,
        totalMessages: finalStats.totalMessages,
        totalChatSessions: finalStats.totalChatSessions,
        strengthsCount: finalStats.strengths.length,
        weaknessesCount: finalStats.weaknesses.length,
        recommendationsCount: finalStats.recommendations.length
      });

      setStats(finalStats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setStats({
        totalTime: 0,
        topicsCompleted: 0,
        avgQuizScore: 0,
        currentStreak: 0,
        totalQuizzes: 0,
        totalPoints: 0,
        achievements: 0,
        quizHistory: [],
        strengths: [],
        weaknesses: [],
        recommendations: []
      });
    }
  };

  const filterByTimeRange = (data) => {
    if (!Array.isArray(data)) return [];

    const now = new Date();
    const cutoff = new Date();

    if (timeRange === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      cutoff.setMonth(now.getMonth() - 1);
    } else {
      return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item.completedAt || item.timestamp);
      return itemDate >= cutoff;
    });
  };

  const analyzePerformance = (quizHistory, progress) => {
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    // Ensure quizHistory is an array
    const safeQuizHistory = Array.isArray(quizHistory) ? quizHistory : [];

    // Analyze test performance
    if (safeQuizHistory.length >= 3) {
      const recentScores = safeQuizHistory.slice(0, 3).map(q => q.score || 0);
      const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

      if (avgRecent >= 90) {
        strengths.push({ icon: '🎯', text: 'Excellent test performance!' });
      } else if (avgRecent < 60) {
        weaknesses.push({ icon: '📝', text: 'Test scores need improvement' });
        recommendations.push({ icon: '💡', text: 'Review topics before taking tests' });
      }
    } else if (safeQuizHistory.length === 0) {
      recommendations.push({ icon: '💡', text: 'Take quizzes to test your knowledge' });
    }

    // Analyze alphabet progress
    const alphabetProgress = progress?.alphabetProgress || 0;
    if (alphabetProgress >= 80) {
      strengths.push({ icon: '📚', text: 'Great progress on Arabic alphabet' });
    } else if (alphabetProgress < 30 && alphabetProgress > 0) {
      weaknesses.push({ icon: '🔤', text: 'More practice needed on alphabet' });
      recommendations.push({ icon: '💡', text: 'Spend 10 minutes daily on alphabet lessons' });
    } else if (alphabetProgress === 0) {
      recommendations.push({ icon: '💡', text: 'Start with alphabet learning to build foundation' });
    }

    // Analyze streak
    const streak = progress?.streak || 0;
    if (streak >= 7) {
      strengths.push({ icon: '🔥', text: 'Consistent learning streak!' });
    } else if (streak >= 3) {
      strengths.push({ icon: '🔥', text: 'Building a good learning habit!' });
    } else if (streak === 0) {
      recommendations.push({ icon: '💡', text: 'Build a daily learning habit for better results' });
    }

    // Analyze session count
    const totalSessions = progress?.totalSessions || 0;
    if (totalSessions >= 20) {
      strengths.push({ icon: '⭐', text: 'Dedicated learner with many sessions' });
    } else if (totalSessions >= 10) {
      strengths.push({ icon: '⭐', text: 'Making good progress with regular practice' });
    } else if (totalSessions < 5 && totalSessions > 0) {
      recommendations.push({ icon: '💡', text: 'Try to practice more regularly for faster progress' });
    } else if (totalSessions === 0) {
      recommendations.push({ icon: '💡', text: 'Start your learning journey today!' });
    }

    return { strengths, weaknesses, recommendations };
  };

  const prepareChartData = (quizHistory, progress) => {
    // Ensure quizHistory is an array
    const safeQuizHistory = Array.isArray(quizHistory) ? quizHistory : [];

    // Progress trend (last 8 weeks)
    const progressTrend = [];
    for (let i = 7; i >= 0; i--) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - i * 7);
      const weekQuizzes = safeQuizHistory.filter(q => {
        try {
          const qDate = new Date(q.completedAt || q.timestamp);
          return qDate >= weekAgo && qDate < new Date(weekAgo.getTime() + 7 * 24 * 60 * 60 * 1000);
        } catch (e) {
          return false;
        }
      });
      const avgScore = weekQuizzes.length > 0
        ? weekQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / weekQuizzes.length
        : 0;
      progressTrend.push({
        label: `W${8 - i}`,
        score: Math.round(avgScore)
      });
    }

    // Topic scores - use optional chaining for safety
    const topicScores = [
      { name: 'Alphabet', score: progress?.alphabetProgress || 0, color: '#10b981' },
      { name: 'Colors', score: progress?.colorsProgress || 0, color: '#3b82f6' },
      { name: 'Words', score: progress?.wordsProgress || 0, color: '#f59e0b' },
      { name: 'Sentences', score: progress?.sentencesProgress || 0, color: '#ef4444' }
    ];

    // Skills radar - use optional chaining for safety
    const skills = [
      { name: 'Reading', score: progress?.alphabetProgress || 0 },
      { name: 'Writing', score: Math.round((progress?.alphabetProgress || 0) * 0.8) },
      { name: 'Listening', score: progress?.colorsProgress || 0 },
      { name: 'Speaking', score: Math.round((progress?.colorsProgress || 0) * 0.9) },
      { name: 'Vocabulary', score: progress?.wordsProgress || 0 }
    ];

    return { progressTrend, topicScores, skills };
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return t.excellent;
    if (score >= 70) return t.good;
    return t.needsWork;
  };

  const handleExportPDF = () => {
    playClickSound();
    alert('PDF export will be available soon! For now, use the screenshot feature of your device.');
  };

  if (!stats) {
    return (
      <div className="progress-dashboard-container">
        <div className="progress-dashboard-loading">
          <div className="loading-spinner">⏳</div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="progress-dashboard-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="progress-dashboard-page">
        <div className="progress-dashboard-header">
          <div className="header-left">
            <button className="back-button" onClick={onClose}>
              ← Back
            </button>
            <h2>📊 {t.title}</h2>
          </div>
          <div className="header-actions">
            <button className="export-pdf-btn" onClick={handleExportPDF}>
              📄 {t.exportPDF}
            </button>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="time-range-filter">
          <button
            className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setTimeRange('week');
            }}
          >
            {t.week}
          </button>
          <button
            className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setTimeRange('month');
            }}
          >
            {t.month}
          </button>
          <button
            className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setTimeRange('all');
            }}
          >
            {t.all}
          </button>
        </div>

        <div className="progress-dashboard-content">
          {/* Overview Cards */}
          <section className="overview-section">
            <h3>{t.overview}</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">{stats.totalTime}</div>
                <div className="stat-label">{t.totalTime} ({t.hours})</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-value">{stats.topicsCompleted}</div>
                <div className="stat-label">{t.topicsCompleted}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{stats.avgQuizScore}%</div>
                <div className="stat-label">{t.avgQuizScore}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-value">{stats.currentStreak}</div>
                <div className="stat-label">{t.currentStreak} ({t.days})</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🪙</div>
                <div className="stat-value">{stats.totalPoints}</div>
                <div className="stat-label">{t.totalPoints}</div>
              </div>
            </div>
          </section>

          {/* Strengths */}
          {stats.strengths.length > 0 && (
            <section className="strengths-section">
              <h3>💪 {t.strengths}</h3>
              <div className="insights-list">
                {stats.strengths.map((strength, index) => (
                  <motion.div
                    key={index}
                    className="insight-item strength"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="insight-icon">{strength.icon}</span>
                    <span className="insight-text">{strength.text}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Weaknesses */}
          {stats.weaknesses.length > 0 && (
            <section className="weaknesses-section">
              <h3>📈 {t.weaknesses}</h3>
              <div className="insights-list">
                {stats.weaknesses.map((weakness, index) => (
                  <motion.div
                    key={index}
                    className="insight-item weakness"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="insight-icon">{weakness.icon}</span>
                    <span className="insight-text">{weakness.text}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {stats.recommendations.length > 0 && (
            <section className="recommendations-section">
              <h3>💡 {t.recommendations}</h3>
              <div className="insights-list">
                {stats.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    className="insight-item recommendation"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="insight-icon">{rec.icon}</span>
                    <span className="insight-text">{rec.text}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Analytics Charts */}
          {stats.chartData && (
            <section className="analytics-section">
              <AnalyticsCharts data={stats.chartData} language={language} />
            </section>
          )}

          {/* Recent Quiz Performance */}
          {stats.quizHistory.length > 0 && (
            <section className="quiz-performance-section">
              <h3>📝 {t.quizPerformance}</h3>
              <div className="quiz-list">
                {stats.quizHistory.map((quiz, index) => (
                  <div key={index} className="quiz-item">
                    <div className="quiz-info">
                      <div className="quiz-name">{quiz.quizName || `Test ${index + 1}`}</div>
                      <div className="quiz-date">
                        {new Date(quiz.completedAt || quiz.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="quiz-score-container">
                      <div
                        className="quiz-score"
                        style={{ color: getScoreColor(quiz.score || 0) }}
                      >
                        {quiz.score || 0}%
                      </div>
                      <div
                        className="quiz-label"
                        style={{ color: getScoreColor(quiz.score || 0) }}
                      >
                        {getScoreLabel(quiz.score || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {stats.totalQuizzes === 0 && stats.topicsCompleted === 0 && (
            <div className="no-data-message">
              <div className="no-data-icon">📊</div>
              <p>{t.noData}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressDashboard;
