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
      // Load progress data
      const progress = JSON.parse(localStorage.getItem('arabic_learning_progress') || '{}');

      // Load quiz history
      const quizKey = `mumayaz_quiz_history_${userEmail}`;
      const quizHistory = JSON.parse(localStorage.getItem(quizKey) || '[]');

      // Load points
      const pointsKey = `mumayaz_points_${userEmail}`;
      const pointsData = JSON.parse(localStorage.getItem(pointsKey) || '{"total": 0, "history": []}');

      // Load streak
      const streakKey = `mumayaz_streak_${userEmail}`;
      const streakData = JSON.parse(localStorage.getItem(streakKey) || '{"currentStreak": 0}');

      // Load achievements
      const achievementsKey = `mumayaz_achievements_${userEmail}`;
      const achievements = JSON.parse(localStorage.getItem(achievementsKey) || '[]');

      // Calculate statistics
      const filteredQuizzes = filterByTimeRange(quizHistory);
      const avgScore = filteredQuizzes.length > 0
        ? Math.round(filteredQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / filteredQuizzes.length)
        : 0;

      const topicsCompleted = [
        progress.alphabetProgress >= 100 ? 'Alphabet' : null,
        progress.colorsProgress >= 100 ? 'Colors' : null,
      ].filter(Boolean).length;

      // Estimate time spent (5 minutes per session)
      const estimatedTime = Math.round((progress.totalSessions || 0) * 5 / 60 * 10) / 10;

      // Analyze strengths and weaknesses
      const analysis = analyzePerformance(quizHistory, progress);

      // Prepare chart data
      const chartData = prepareChartData(filteredQuizzes, progress);

      setStats({
        totalTime: estimatedTime,
        topicsCompleted,
        avgQuizScore: avgScore,
        currentStreak: streakData.currentStreak || 0,
        totalQuizzes: filteredQuizzes.length,
        totalPoints: pointsData.total || 0,
        achievements: achievements.length,
        quizHistory: filteredQuizzes.slice(0, 10),
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
        progressData: progress,
        chartData
      });
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

    // Analyze test performance
    if (quizHistory.length >= 3) {
      const recentScores = quizHistory.slice(0, 3).map(q => q.score || 0);
      const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

      if (avgRecent >= 90) {
        strengths.push({ icon: '🎯', text: 'Excellent test performance!' });
      } else if (avgRecent < 60) {
        weaknesses.push({ icon: '📝', text: 'Test scores need improvement' });
        recommendations.push({ icon: '💡', text: 'Review topics before taking tests' });
      }
    }

    // Analyze alphabet progress
    if (progress.alphabetProgress >= 80) {
      strengths.push({ icon: '📚', text: 'Great progress on Arabic alphabet' });
    } else if (progress.alphabetProgress < 30) {
      weaknesses.push({ icon: '🔤', text: 'More practice needed on alphabet' });
      recommendations.push({ icon: '💡', text: 'Spend 10 minutes daily on alphabet lessons' });
    }

    // Analyze streak
    if ((progress.streak || 0) >= 7) {
      strengths.push({ icon: '🔥', text: 'Consistent learning streak!' });
    } else if ((progress.streak || 0) === 0) {
      recommendations.push({ icon: '💡', text: 'Build a daily learning habit' });
    }

    // Analyze session count
    if ((progress.totalSessions || 0) >= 20) {
      strengths.push({ icon: '⭐', text: 'Dedicated learner with many sessions' });
    } else if ((progress.totalSessions || 0) < 5) {
      recommendations.push({ icon: '💡', text: 'Try to practice more regularly' });
    }

    return { strengths, weaknesses, recommendations };
  };

  const prepareChartData = (quizHistory, progress) => {
    // Progress trend (last 8 weeks)
    const progressTrend = [];
    for (let i = 7; i >= 0; i--) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - i * 7);
      const weekQuizzes = quizHistory.filter(q => {
        const qDate = new Date(q.completedAt || q.timestamp);
        return qDate >= weekAgo && qDate < new Date(weekAgo.getTime() + 7 * 24 * 60 * 60 * 1000);
      });
      const avgScore = weekQuizzes.length > 0
        ? weekQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / weekQuizzes.length
        : 0;
      progressTrend.push({
        label: `W${8 - i}`,
        score: Math.round(avgScore)
      });
    }

    // Topic scores
    const topicScores = [
      { name: 'Alphabet', score: progress.alphabetProgress || 0, color: '#10b981' },
      { name: 'Colors', score: progress.colorsProgress || 0, color: '#3b82f6' },
      { name: 'Words', score: progress.wordsProgress || 0, color: '#f59e0b' },
      { name: 'Sentences', score: progress.sentencesProgress || 0, color: '#ef4444' }
    ];

    // Skills radar
    const skills = [
      { name: 'Reading', score: progress.alphabetProgress || 0 },
      { name: 'Writing', score: (progress.alphabetProgress || 0) * 0.8 },
      { name: 'Listening', score: progress.colorsProgress || 0 },
      { name: 'Speaking', score: (progress.colorsProgress || 0) * 0.9 },
      { name: 'Vocabulary', score: progress.wordsProgress || 0 }
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
      <div className="progress-dashboard-loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="progress-dashboard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="progress-dashboard-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="progress-dashboard-header">
          <h2>📊 {t.title}</h2>
          <div className="header-actions">
            <button className="export-pdf-btn" onClick={handleExportPDF}>
              📄 {t.exportPDF}
            </button>
            <button className="close-button" onClick={onClose}>✕</button>
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
      </motion.div>
    </motion.div>
  );
};

export default ProgressDashboard;
