import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playClickSound } from '../utils/soundEffects';
import { toast } from '../hooks/useToast';
import './StudentProgressReport.css';

const StudentProgressReport = ({ userEmail, language = 'en', onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'all'
  const [isGenerating, setIsGenerating] = useState(false);

  const translations = {
    en: {
      title: 'Student Progress Report',
      generate: 'Generate Report',
      download: 'Download PDF',
      close: 'Close',
      timeRange: 'Time Range',
      week: 'This Week',
      month: 'This Month',
      all: 'All Time',
      overview: 'Overview',
      totalTime: 'Total Learning Time',
      lessonsCompleted: 'Lessons Completed',
      quizzesTaken: 'Quizzes Taken',
      avgScore: 'Average Score',
      streak: 'Current Streak',
      achievements: 'Achievements Unlocked',
      topicsProgress: 'Topics Progress',
      alphabet: 'Alphabet',
      colors: 'Colors',
      words: 'Words',
      sentences: 'Sentences',
      strengths: 'Strengths',
      areasToImprove: 'Areas to Improve',
      recommendations: 'Recommendations',
      activity: 'Learning Activity',
      noData: 'No data available for the selected time range',
      hours: 'hours',
      days: 'days',
      generating: 'Generating report...',
      studentName: 'Student',
      reportDate: 'Report Date',
      performance: 'Performance Analysis'
    },
    ar: {
      title: 'تقرير تقدم الطالب',
      generate: 'إنشاء التقرير',
      download: 'تحميل PDF',
      close: 'إغلاق',
      timeRange: 'الفترة الزمنية',
      week: 'هذا الأسبوع',
      month: 'هذا الشهر',
      all: 'كل الوقت',
      overview: 'نظرة عامة',
      totalTime: 'إجمالي وقت التعلم',
      lessonsCompleted: 'الدروس المكتملة',
      quizzesTaken: 'الاختبارات المأخوذة',
      avgScore: 'متوسط الدرجات',
      streak: 'السلسلة الحالية',
      achievements: 'الإنجازات المفتوحة',
      topicsProgress: 'تقدم المواضيع',
      alphabet: 'الحروف',
      colors: 'الألوان',
      words: 'الكلمات',
      sentences: 'الجمل',
      strengths: 'نقاط القوة',
      areasToImprove: 'مجالات التحسين',
      recommendations: 'التوصيات',
      activity: 'نشاط التعلم',
      noData: 'لا توجد بيانات متاحة للفترة المحددة',
      hours: 'ساعات',
      days: 'أيام',
      generating: 'جاري إنشاء التقرير...',
      studentName: 'الطالب',
      reportDate: 'تاريخ التقرير',
      performance: 'تحليل الأداء'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadReportData();
  }, [timeRange, userEmail]);

  const loadReportData = () => {
    try {
      // Gather data from various localStorage keys
      const pointsData = JSON.parse(localStorage.getItem(`mumayaz_points_${userEmail}`) || '{"total": 0, "history": []}');
      const achievements = JSON.parse(localStorage.getItem(`mumayaz_achievements_${userEmail}`) || '[]');
      const quizHistory = JSON.parse(localStorage.getItem(`mumayaz_quiz_history_${userEmail}`) || '[]');
      const streak = parseInt(localStorage.getItem(`mumayaz_streak_${userEmail}`) || '0');
      const learningTime = parseFloat(localStorage.getItem(`mumayaz_learning_time_${userEmail}`) || '0');
      const topicsProgress = JSON.parse(localStorage.getItem(`mumayaz_topics_progress_${userEmail}`) || '{}');

      // Calculate statistics
      const totalQuizzes = quizHistory.length;
      const avgScore = totalQuizzes > 0
        ? Math.round(quizHistory.reduce((sum, q) => sum + (q.score || 0), 0) / totalQuizzes)
        : 0;

      // Topics progress
      const topics = [
        { name: t.alphabet, progress: topicsProgress.alphabet || 0, icon: '📝' },
        { name: t.colors, progress: topicsProgress.colors || 0, icon: '🎨' },
        { name: t.words, progress: topicsProgress.words || 0, icon: '📚' },
        { name: t.sentences, progress: topicsProgress.sentences || 0, icon: '💬' }
      ];

      // Identify strengths and weaknesses
      const sortedTopics = [...topics].sort((a, b) => b.progress - a.progress);
      const strengths = sortedTopics.slice(0, 2).filter(t => t.progress > 50);
      const weaknesses = sortedTopics.slice(-2).filter(t => t.progress < 70);

      // Generate recommendations
      const recommendations = [];
      if (avgScore < 70) {
        recommendations.push(language === 'ar'
          ? 'ننصح بمزيد من الممارسة في الاختبارات'
          : 'More quiz practice recommended');
      }
      if (streak < 7) {
        recommendations.push(language === 'ar'
          ? 'حاول التعلم يومياً لبناء سلسلة أطول'
          : 'Try to learn daily to build a longer streak');
      }
      weaknesses.forEach(topic => {
        recommendations.push(language === 'ar'
          ? `يحتاج ${topic.name} إلى مزيد من الاهتمام`
          : `${topic.name} needs more attention`);
      });
      if (recommendations.length === 0) {
        recommendations.push(language === 'ar'
          ? 'أداء ممتاز! استمر في التعلم'
          : 'Excellent performance! Keep learning');
      }

      setReportData({
        overview: {
          totalTime: (learningTime / 60).toFixed(1), // Convert to hours
          lessonsCompleted: topicsProgress.lessonsCompleted || 0,
          quizzesTaken: totalQuizzes,
          avgScore,
          streak,
          achievements: achievements.length,
          points: pointsData.total
        },
        topics,
        strengths,
        weaknesses,
        recommendations,
        recentActivity: quizHistory.slice(-10).reverse()
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    }
  };

  const generatePDFReport = () => {
    playClickSound();
    setIsGenerating(true);

    try {
      // Create a simple text-based report
      const userName = getUserName(userEmail);
      const reportDate = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let reportText = `
========================================
${t.title}
========================================

${t.studentName}: ${userName}
${t.reportDate}: ${reportDate}
${t.timeRange}: ${t[timeRange]}

========================================
${t.overview}
========================================

${t.totalTime}: ${reportData.overview.totalTime} ${t.hours}
${t.lessonsCompleted}: ${reportData.overview.lessonsCompleted}
${t.quizzesTaken}: ${reportData.overview.quizzesTaken}
${t.avgScore}: ${reportData.overview.avgScore}%
${t.streak}: ${reportData.overview.streak} ${t.days}
${t.achievements}: ${reportData.overview.achievements}

========================================
${t.topicsProgress}
========================================

${reportData.topics.map(topic =>
  `${topic.icon} ${topic.name}: ${topic.progress}%`
).join('\n')}

========================================
${t.strengths}
========================================

${reportData.strengths.length > 0
  ? reportData.strengths.map(s => `• ${s.name} (${s.progress}%)`).join('\n')
  : language === 'ar' ? 'استمر في التعلم لتحديد نقاط القوة' : 'Continue learning to identify strengths'}

========================================
${t.areasToImprove}
========================================

${reportData.weaknesses.length > 0
  ? reportData.weaknesses.map(w => `• ${w.name} (${w.progress}%)`).join('\n')
  : language === 'ar' ? 'أداء جيد في جميع المجالات!' : 'Good performance in all areas!'}

========================================
${t.recommendations}
========================================

${reportData.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

========================================
Generated by Mumayaz Platform
${new Date().toLocaleString()}
========================================
      `;

      // Create and download the file
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `progress-report-${userName}-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(language === 'ar' ? 'تم تحميل التقرير بنجاح' : 'Report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(language === 'ar' ? 'فشل إنشاء التقرير' : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const getUserName = (email) => {
    try {
      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const user = users[email.toLowerCase()];
      return user?.name || email.split('@')[0];
    } catch {
      return email.split('@')[0];
    }
  };

  if (!reportData) {
    return (
      <div className="student-progress-report-loading">
        <div className="spinner"></div>
        <p>{t.generating}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="student-progress-report-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <motion.div
        className="student-progress-report-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-header">
          <h2>{t.title}</h2>
          <button className="close-btn" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        <div className="report-controls">
          <div className="time-range-selector">
            <label>{t.timeRange}:</label>
            <div className="range-buttons">
              {['week', 'month', 'all'].map(range => (
                <button
                  key={range}
                  className={`range-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => {
                    playClickSound();
                    setTimeRange(range);
                  }}
                >
                  {t[range]}
                </button>
              ))}
            </div>
          </div>
          <button
            className="download-btn"
            onClick={generatePDFReport}
            disabled={isGenerating}
          >
            📥 {t.download}
          </button>
        </div>

        <div className="report-content">
          {/* Overview Section */}
          <section className="report-section overview-section">
            <h3>{t.overview}</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">{reportData.overview.totalTime}</div>
                <div className="stat-label">{t.hours}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-value">{reportData.overview.lessonsCompleted}</div>
                <div className="stat-label">{t.lessonsCompleted}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{reportData.overview.quizzesTaken}</div>
                <div className="stat-label">{t.quizzesTaken}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{reportData.overview.avgScore}%</div>
                <div className="stat-label">{t.avgScore}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-value">{reportData.overview.streak}</div>
                <div className="stat-label">{t.days}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{reportData.overview.achievements}</div>
                <div className="stat-label">{t.achievements}</div>
              </div>
            </div>
          </section>

          {/* Topics Progress */}
          <section className="report-section">
            <h3>{t.topicsProgress}</h3>
            <div className="topics-list">
              {reportData.topics.map((topic, index) => (
                <div key={index} className="topic-item">
                  <div className="topic-header">
                    <span className="topic-icon">{topic.icon}</span>
                    <span className="topic-name">{topic.name}</span>
                    <span className="topic-percentage">{topic.progress}%</span>
                  </div>
                  <div className="topic-progress-bar">
                    <div
                      className="topic-progress-fill"
                      style={{ width: `${topic.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Strengths and Weaknesses */}
          <div className="insights-row">
            <section className="report-section half-section">
              <h3>✅ {t.strengths}</h3>
              <div className="insights-list">
                {reportData.strengths.length > 0 ? (
                  reportData.strengths.map((strength, index) => (
                    <div key={index} className="insight-item strength">
                      {strength.icon} {strength.name} ({strength.progress}%)
                    </div>
                  ))
                ) : (
                  <div className="no-data-message">
                    {language === 'ar' ? 'استمر في التعلم!' : 'Keep learning!'}
                  </div>
                )}
              </div>
            </section>

            <section className="report-section half-section">
              <h3>📈 {t.areasToImprove}</h3>
              <div className="insights-list">
                {reportData.weaknesses.length > 0 ? (
                  reportData.weaknesses.map((weakness, index) => (
                    <div key={index} className="insight-item weakness">
                      {weakness.icon} {weakness.name} ({weakness.progress}%)
                    </div>
                  ))
                ) : (
                  <div className="no-data-message">
                    {language === 'ar' ? 'أداء رائع!' : 'Great performance!'}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Recommendations */}
          <section className="report-section recommendations-section">
            <h3>💡 {t.recommendations}</h3>
            <div className="recommendations-list">
              {reportData.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <span className="rec-number">{index + 1}</span>
                  <span className="rec-text">{rec}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentProgressReport;
