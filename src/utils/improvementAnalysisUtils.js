// src/utils/improvementAnalysisUtils.js - Analysis utilities for identifying areas of improvement

/**
 * Analyze child's learning patterns and identify areas for improvement
 */
export const analyzeAreasForImprovement = (childStats, childData) => {
  const improvements = [];

  if (!childStats || !childData) {
    return improvements;
  }

  const { totalTimeSpent, totalSessions, totalMessages, dailyActivity, averageSessionTime, averageMessagesPerSession } = childStats;

  // 1. Low Engagement Analysis
  if (totalSessions < 5) {
    improvements.push({
      category: 'Engagement',
      issue: 'Low Session Count',
      description: 'Child has participated in very few learning sessions',
      suggestion: 'Encourage more regular practice sessions. Try setting daily learning goals.',
      severity: 'high',
      icon: '📈',
      color: '#ef4444'
    });
  }

  // 2. Session Duration Analysis
  if (averageSessionTime < 10) {
    improvements.push({
      category: 'Focus',
      issue: 'Short Session Duration',
      description: 'Learning sessions are quite brief, which may limit deep learning',
      suggestion: 'Help child build focus by gradually increasing session length. Start with 15-minute goals.',
      severity: 'medium',
      icon: '⏱️',
      color: '#f59e0b'
    });
  } else if (averageSessionTime > 45) {
    improvements.push({
      category: 'Balance',
      issue: 'Very Long Sessions',
      description: 'Sessions might be too long, potentially causing fatigue',
      suggestion: 'Consider breaking learning into shorter, more frequent sessions for better retention.',
      severity: 'medium',
      icon: '🔄',
      color: '#f59e0b'
    });
  }

  // 3. Consistency Analysis
  const recentDays = dailyActivity?.slice(-7) || [];
  const activeDays = recentDays.filter(day => day.timeSpent > 0).length;

  if (activeDays < 3 && totalSessions > 5) {
    improvements.push({
      category: 'Consistency',
      issue: 'Irregular Learning Pattern',
      description: 'Child has been inactive for several days recently',
      suggestion: 'Establish a consistent daily learning routine. Even 10 minutes daily is better than long sporadic sessions.',
      severity: 'high',
      icon: '📅',
      color: '#ef4444'
    });
  }

  // 4. Interaction Quality Analysis
  if (averageMessagesPerSession < 5 && totalSessions > 3) {
    improvements.push({
      category: 'Participation',
      issue: 'Low Interaction Level',
      description: 'Child sends relatively few messages per session',
      suggestion: 'Encourage asking more questions and exploring topics in greater depth.',
      severity: 'medium',
      icon: '💬',
      color: '#f59e0b'
    });
  }

  // 5. Topic Exploration Analysis
  const topicsExplored = childStats.topicsExplored?.length || 0;
  if (topicsExplored < 3 && totalSessions > 5) {
    improvements.push({
      category: 'Exploration',
      issue: 'Limited Topic Variety',
      description: 'Child has explored relatively few different topics',
      suggestion: 'Introduce new subjects and encourage curiosity about different areas of learning.',
      severity: 'medium',
      icon: '🌟',
      color: '#f59e0b'
    });
  }

  // 6. Weekly Progress Analysis
  const thisWeekTime = recentDays.reduce((sum, day) => sum + day.timeSpent, 0);
  if (thisWeekTime < 60 && totalSessions > 0) {
    improvements.push({
      category: 'Progress',
      issue: 'Below Recommended Weekly Time',
      description: 'Child has spent less than 1 hour learning this week',
      suggestion: 'Aim for at least 10-15 minutes of learning per day to build effective habits.',
      severity: 'medium',
      icon: '📊',
      color: '#f59e0b'
    });
  }

  // 7. Achievement Analysis
  const achievements = childData.progressData?.achievements?.length || 0;
  if (achievements === 0 && totalSessions > 3) {
    improvements.push({
      category: 'Motivation',
      issue: 'No Achievements Earned',
      description: 'Child has not earned any achievements yet',
      suggestion: 'Set small, achievable goals to build confidence and motivation.',
      severity: 'low',
      icon: '🏆',
      color: '#10b981'
    });
  }

  // 8. Recent Activity Decline
  if (recentDays.length >= 3) {
    const lastThreeDays = recentDays.slice(-3);
    const firstThreeDays = recentDays.slice(0, 3);

    const recentAverage = lastThreeDays.reduce((sum, day) => sum + day.timeSpent, 0) / 3;
    const earlierAverage = firstThreeDays.reduce((sum, day) => sum + day.timeSpent, 0) / 3;

    if (recentAverage < earlierAverage * 0.5 && earlierAverage > 0) {
      improvements.push({
        category: 'Engagement',
        issue: 'Declining Activity',
        description: 'Child\'s learning activity has decreased significantly recently',
        suggestion: 'Check if there are any obstacles preventing regular learning and provide encouragement.',
        severity: 'high',
        icon: '📉',
        color: '#ef4444'
      });
    }
  }

  // Sort by severity: high -> medium -> low
  const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  improvements.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return improvements.slice(0, 6); // Return top 6 improvements
};

/**
 * Calculate improvement progress score (0-100)
 */
export const calculateImprovementScore = (childStats, childData) => {
  if (!childStats || !childData) return 0;

  let score = 50; // Start with base score

  const { totalTimeSpent, totalSessions, averageSessionTime, averageMessagesPerSession, dailyActivity } = childStats;

  // Session frequency bonus
  if (totalSessions >= 10) score += 15;
  else if (totalSessions >= 5) score += 10;
  else if (totalSessions >= 3) score += 5;

  // Session duration optimization
  if (averageSessionTime >= 15 && averageSessionTime <= 35) score += 10;
  else if (averageSessionTime >= 10) score += 5;

  // Consistency bonus
  const recentDays = dailyActivity?.slice(-7) || [];
  const activeDays = recentDays.filter(day => day.timeSpent > 0).length;
  if (activeDays >= 5) score += 15;
  else if (activeDays >= 3) score += 10;
  else if (activeDays >= 1) score += 5;

  // Interaction quality
  if (averageMessagesPerSession >= 10) score += 10;
  else if (averageMessagesPerSession >= 5) score += 5;

  // Topic exploration
  const topicsExplored = childStats.topicsExplored?.length || 0;
  if (topicsExplored >= 5) score += 10;
  else if (topicsExplored >= 3) score += 5;

  // Achievement bonus
  const achievements = childData.progressData?.achievements?.length || 0;
  score += Math.min(achievements * 2, 10);

  return Math.min(Math.max(score, 0), 100);
};

/**
 * Generate personalized learning recommendations
 */
export const generateLearningRecommendations = (childStats, childData) => {
  const recommendations = [];

  if (!childStats || !childData) {
    return recommendations;
  }

  const { totalTimeSpent, totalSessions, averageSessionTime, dailyActivity } = childStats;
  const recentDays = dailyActivity?.slice(-7) || [];
  const activeDays = recentDays.filter(day => day.timeSpent > 0).length;

  // Time-based recommendations
  if (averageSessionTime < 15) {
    recommendations.push({
      title: 'Extend Learning Sessions',
      description: 'Gradually increase session length to 15-20 minutes for better learning outcomes',
      priority: 'medium',
      icon: '⏰'
    });
  }

  // Consistency recommendations
  if (activeDays < 4) {
    recommendations.push({
      title: 'Build Daily Habits',
      description: 'Try to establish a daily learning routine, even if just 10 minutes per day',
      priority: 'high',
      icon: '📅'
    });
  }

  // Engagement recommendations
  if (childStats.averageMessagesPerSession < 7) {
    recommendations.push({
      title: 'Encourage More Interaction',
      description: 'Motivate your child to ask more questions and explore topics deeply',
      priority: 'medium',
      icon: '💬'
    });
  }

  // Topic variety recommendations
  if ((childStats.topicsExplored?.length || 0) < 4) {
    recommendations.push({
      title: 'Explore New Topics',
      description: 'Introduce your child to new subjects to broaden their learning experience',
      priority: 'low',
      icon: '🌟'
    });
  }

  return recommendations.slice(0, 4);
};

/**
 * Get learning insights and trends
 */
export const getLearningInsights = (childStats) => {
  const insights = [];

  if (!childStats || !childStats.dailyActivity) {
    return insights;
  }

  const dailyActivity = childStats.dailyActivity;
  const recentWeek = dailyActivity.slice(-7);
  const previousWeek = dailyActivity.slice(-14, -7);

  // Weekly comparison
  const thisWeekTime = recentWeek.reduce((sum, day) => sum + day.timeSpent, 0);
  const lastWeekTime = previousWeek.reduce((sum, day) => sum + day.timeSpent, 0);

  if (previousWeek.length > 0) {
    const weeklyChange = ((thisWeekTime - lastWeekTime) / lastWeekTime) * 100;

    if (weeklyChange > 20) {
      insights.push({
        type: 'positive',
        title: 'Great Progress!',
        description: `Learning time increased by ${Math.round(weeklyChange)}% this week`,
        icon: '📈'
      });
    } else if (weeklyChange < -20) {
      insights.push({
        type: 'concern',
        title: 'Decreased Activity',
        description: `Learning time decreased by ${Math.round(Math.abs(weeklyChange))}% this week`,
        icon: '📉'
      });
    }
  }

  // Streak analysis
  let currentStreak = 0;
  for (let i = recentWeek.length - 1; i >= 0; i--) {
    if (recentWeek[i].timeSpent > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  if (currentStreak >= 3) {
    insights.push({
      type: 'positive',
      title: `${currentStreak}-Day Learning Streak!`,
      description: 'Consistent daily practice is building great learning habits',
      icon: '🔥'
    });
  }

  // Peak day analysis
  const bestDay = recentWeek.reduce((max, day) =>
    day.timeSpent > max.timeSpent ? day : max, recentWeek[0]);

  if (bestDay?.timeSpent > 30) {
    const dayName = new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long' });
    insights.push({
      type: 'info',
      title: 'Peak Learning Day',
      description: `Best performance was on ${dayName} with ${bestDay.timeSpent} minutes`,
      icon: '⭐'
    });
  }

  return insights;
};