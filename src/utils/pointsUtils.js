// src/utils/pointsUtils.js - Enhanced Points System

import { updateUserStats, getUserStats, recordLearningPoints } from './leaderboardUtils';

const POINTS_STORAGE_KEY = "mumayaz_points";
const NOTIFICATION_THRESHOLD = 25; // Show notification every 25 points

// Point values for different activities
export const POINT_VALUES = {
  // Learning Activities
  LETTER_LEARNED: 5,
  WORD_LEARNED: 10,
  SENTENCE_LEARNED: 15,
  COLOR_LEARNED: 5,
  LESSON_COMPLETED: 25,
  MODULE_COMPLETED: 50,

  // Quiz & Tests
  QUIZ_QUESTION_CORRECT: 10,
  QUIZ_PERFECT_SCORE: 50,
  QUIZ_COMPLETED: 20,
  TEST_PASSED: 40,

  // Chat & Interaction
  MESSAGE_SENT: 2,
  CONVERSATION_COMPLETED: 15,
  VOICE_MESSAGE: 5,
  HELPFUL_RESPONSE: 3,

  // Word Builder
  WORD_BUILT_CORRECT: 10,
  WORD_BUILT_PERFECT: 20,
  THREE_WORD_STREAK: 15,
  FIVE_WORD_STREAK: 30,
  TEN_WORD_STREAK: 60,

  // Memory Game
  MEMORY_PAIR_FOUND: 8,
  MEMORY_GAME_COMPLETED: 30,
  MEMORY_PERFECT_GAME: 50,

  // Practice & Repetition
  DAILY_LOGIN: 10,
  PRACTICE_SESSION: 15,
  REVIEW_COMPLETED: 12,
  FLASHCARD_REVIEWED: 3,

  // Engagement
  FAVORITE_ADDED: 2,
  NOTE_CREATED: 5,
  PROGRESS_MILESTONE: 25,
  FIRST_TIME_ACTIVITY: 15,

  // Time-based
  FIVE_MINUTES_ACTIVE: 5,
  TEN_MINUTES_ACTIVE: 12,
  THIRTY_MINUTES_ACTIVE: 35,
  ONE_HOUR_ACTIVE: 75,

  // Social & Collaboration
  SHARED_PROGRESS: 10,
  HELPED_CLASSMATE: 15,
  CLASS_PARTICIPATION: 20,

  // Achievements
  STREAK_3_DAYS: 30,
  STREAK_7_DAYS: 75,
  STREAK_30_DAYS: 200,
  PERFECT_WEEK: 100,

  // Bonus
  COMEBACK_BONUS: 20, // After being inactive
  RANDOM_BONUS: Math.floor(Math.random() * 10) + 5 // 5-15 random
};

/**
 * Award points to a user
 */
export const awardPoints = (userEmail, pointType, multiplier = 1, customAmount = null) => {
  try {
    const points = customAmount || (POINT_VALUES[pointType] * multiplier);
    const currentStats = getUserStats(userEmail);

    if (!currentStats) {
      console.error("User stats not found");
      return { success: false, points: 0 };
    }

    // Update user stats with new points
    const result = recordLearningPoints(userEmail, points, pointType);

    if (result.success) {
      // Store point notification data
      storePointNotification(userEmail, {
        points,
        pointType,
        timestamp: Date.now(),
        totalPoints: (currentStats.totalPoints || 0) + points
      });

      // Check for milestone notifications
      checkMilestoneNotification(userEmail, (currentStats.totalPoints || 0) + points);

      return { success: true, points, totalPoints: (currentStats.totalPoints || 0) + points };
    }

    return { success: false, points: 0 };
  } catch (error) {
    console.error("Error awarding points:", error);
    return { success: false, points: 0, error: error.message };
  }
};

/**
 * Store point notification for display
 */
const storePointNotification = (userEmail, notificationData) => {
  try {
    const key = `${POINTS_STORAGE_KEY}_notifications_${userEmail}`;
    const notifications = JSON.parse(localStorage.getItem(key) || '[]');

    notifications.push(notificationData);

    // Keep only last 10 notifications
    const recentNotifications = notifications.slice(-10);
    localStorage.setItem(key, JSON.stringify(recentNotifications));
  } catch (error) {
    console.error("Error storing notification:", error);
  }
};

/**
 * Get pending notifications for a user
 */
export const getPendingNotifications = (userEmail) => {
  try {
    const key = `${POINTS_STORAGE_KEY}_notifications_${userEmail}`;
    const notifications = JSON.parse(localStorage.getItem(key) || '[]');

    // Filter notifications from last 30 seconds
    const now = Date.now();
    const recent = notifications.filter(n => now - n.timestamp < 30000);

    return recent;
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

/**
 * Clear notifications after display
 */
export const clearNotifications = (userEmail) => {
  try {
    const key = `${POINTS_STORAGE_KEY}_notifications_${userEmail}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
};

/**
 * Check for milestone notifications
 */
const checkMilestoneNotification = (userEmail, newTotalPoints) => {
  try {
    const milestones = [50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 5000];
    const previousTotal = (getUserStats(userEmail).totalPoints || 0);

    // Check if crossed a milestone
    const crossedMilestone = milestones.find(m => previousTotal < m && newTotalPoints >= m);

    if (crossedMilestone) {
      storeMilestoneNotification(userEmail, crossedMilestone);
    }

    // Check for threshold notifications (every NOTIFICATION_THRESHOLD points)
    const previousThreshold = Math.floor(previousTotal / NOTIFICATION_THRESHOLD);
    const newThreshold = Math.floor(newTotalPoints / NOTIFICATION_THRESHOLD);

    if (newThreshold > previousThreshold) {
      storeThresholdNotification(userEmail, newTotalPoints);
    }
  } catch (error) {
    console.error("Error checking milestone:", error);
  }
};

/**
 * Store milestone notification
 */
const storeMilestoneNotification = (userEmail, milestone) => {
  try {
    const key = `${POINTS_STORAGE_KEY}_milestone_${userEmail}`;
    const data = {
      milestone,
      timestamp: Date.now(),
      type: 'milestone'
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error storing milestone:", error);
  }
};

/**
 * Store threshold notification
 */
const storeThresholdNotification = (userEmail, totalPoints) => {
  try {
    const key = `${POINTS_STORAGE_KEY}_threshold_${userEmail}`;
    const data = {
      totalPoints,
      timestamp: Date.now(),
      type: 'threshold'
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error storing threshold:", error);
  }
};

/**
 * Get milestone notification
 */
export const getMilestoneNotification = (userEmail) => {
  try {
    const key = `${POINTS_STORAGE_KEY}_milestone_${userEmail}`;
    const data = localStorage.getItem(key);

    if (data) {
      const notification = JSON.parse(data);
      // Check if notification is recent (within last 5 seconds)
      if (Date.now() - notification.timestamp < 5000) {
        localStorage.removeItem(key); // Clear after reading
        return notification;
      }
      localStorage.removeItem(key);
    }
    return null;
  } catch (error) {
    console.error("Error getting milestone notification:", error);
    return null;
  }
};

/**
 * Get threshold notification
 */
export const getThresholdNotification = (userEmail) => {
  try {
    const key = `${POINTS_STORAGE_KEY}_threshold_${userEmail}`;
    const data = localStorage.getItem(key);

    if (data) {
      const notification = JSON.parse(data);
      // Check if notification is recent (within last 3 seconds)
      if (Date.now() - notification.timestamp < 3000) {
        localStorage.removeItem(key); // Clear after reading
        return notification;
      }
      localStorage.removeItem(key);
    }
    return null;
  } catch (error) {
    console.error("Error getting threshold notification:", error);
    return null;
  }
};

/**
 * Award streak bonus
 */
export const awardStreakBonus = (userEmail, streakCount) => {
  try {
    let pointType = 'STREAK_BONUS';
    let points = 0;

    if (streakCount === 3) {
      points = POINT_VALUES.THREE_WORD_STREAK;
    } else if (streakCount === 5) {
      points = POINT_VALUES.FIVE_WORD_STREAK;
    } else if (streakCount >= 10) {
      points = POINT_VALUES.TEN_WORD_STREAK;
    } else {
      points = streakCount * 3; // 3 points per streak
    }

    return awardPoints(userEmail, pointType, 1, points);
  } catch (error) {
    console.error("Error awarding streak bonus:", error);
    return { success: false, points: 0 };
  }
};

/**
 * Award time-based points
 */
export const awardTimeBonusPoints = (userEmail, minutesActive) => {
  try {
    let pointType;

    if (minutesActive >= 60) {
      pointType = 'ONE_HOUR_ACTIVE';
    } else if (minutesActive >= 30) {
      pointType = 'THIRTY_MINUTES_ACTIVE';
    } else if (minutesActive >= 10) {
      pointType = 'TEN_MINUTES_ACTIVE';
    } else if (minutesActive >= 5) {
      pointType = 'FIVE_MINUTES_ACTIVE';
    } else {
      return { success: false, points: 0 };
    }

    return awardPoints(userEmail, pointType);
  } catch (error) {
    console.error("Error awarding time bonus:", error);
    return { success: false, points: 0 };
  }
};

/**
 * Get friendly point description
 */
export const getPointDescription = (pointType, language = 'en') => {
  const descriptions = {
    en: {
      LETTER_LEARNED: 'Letter Learned',
      WORD_LEARNED: 'Word Learned',
      SENTENCE_LEARNED: 'Sentence Learned',
      COLOR_LEARNED: 'Color Learned',
      LESSON_COMPLETED: 'Lesson Completed',
      MODULE_COMPLETED: 'Module Completed',
      QUIZ_QUESTION_CORRECT: 'Correct Answer',
      QUIZ_PERFECT_SCORE: 'Perfect Quiz Score',
      QUIZ_COMPLETED: 'Quiz Completed',
      MESSAGE_SENT: 'Message Sent',
      WORD_BUILT_CORRECT: 'Word Built',
      MEMORY_PAIR_FOUND: 'Pair Found',
      MEMORY_GAME_COMPLETED: 'Memory Game Completed',
      DAILY_LOGIN: 'Daily Login',
      PRACTICE_SESSION: 'Practice Session',
      FAVORITE_ADDED: 'Favorite Added',
      STREAK_BONUS: 'Streak Bonus',
      MILESTONE_REACHED: 'Milestone Reached'
    },
    ar: {
      LETTER_LEARNED: 'حرف مُتعلم',
      WORD_LEARNED: 'كلمة مُتعلمة',
      SENTENCE_LEARNED: 'جملة مُتعلمة',
      COLOR_LEARNED: 'لون مُتعلم',
      LESSON_COMPLETED: 'درس مكتمل',
      MODULE_COMPLETED: 'وحدة مكتملة',
      QUIZ_QUESTION_CORRECT: 'إجابة صحيحة',
      QUIZ_PERFECT_SCORE: 'درجة كاملة',
      QUIZ_COMPLETED: 'اختبار مكتمل',
      MESSAGE_SENT: 'رسالة مرسلة',
      WORD_BUILT_CORRECT: 'كلمة مبنية',
      MEMORY_PAIR_FOUND: 'زوج وُجد',
      MEMORY_GAME_COMPLETED: 'لعبة الذاكرة مكتملة',
      DAILY_LOGIN: 'تسجيل دخول يومي',
      PRACTICE_SESSION: 'جلسة تدريب',
      FAVORITE_ADDED: 'مفضل مُضاف',
      STREAK_BONUS: 'مكافأة السلسلة',
      MILESTONE_REACHED: 'معلم بارز'
    }
  };

  return descriptions[language][pointType] || pointType;
};

/**
 * Get class leaderboard with points
 */
export const getClassLeaderboard = (className) => {
  try {
    const teacherData = JSON.parse(localStorage.getItem('mumayaz_teachers') || '{}');
    const userStats = JSON.parse(localStorage.getItem('mumayaz_user_stats') || '{}');

    // Find students in this class
    const classStudents = [];

    Object.values(teacherData).forEach(teacher => {
      if (teacher.classes && teacher.classes[className]) {
        const studentEmails = teacher.classes[className].students || [];
        studentEmails.forEach(email => {
          if (userStats[email]) {
            classStudents.push({
              ...userStats[email],
              totalPoints: (userStats[email].totalPoints || 0) +
                          (userStats[email].learningPoints || 0) +
                          (userStats[email].dailyTaskPoints || 0)
            });
          }
        });
      }
    });

    // Sort by total points
    const leaderboard = classStudents.sort((a, b) => b.totalPoints - a.totalPoints);

    return {
      success: true,
      leaderboard: leaderboard.slice(0, 10),
      totalStudents: classStudents.length
    };
  } catch (error) {
    console.error("Error getting class leaderboard:", error);
    return {
      success: false,
      leaderboard: [],
      totalStudents: 0
    };
  }
};

export default {
  awardPoints,
  awardStreakBonus,
  awardTimeBonusPoints,
  getPendingNotifications,
  clearNotifications,
  getMilestoneNotification,
  getThresholdNotification,
  getPointDescription,
  getClassLeaderboard,
  POINT_VALUES
};
