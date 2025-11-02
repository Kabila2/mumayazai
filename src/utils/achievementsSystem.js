/**
 * Achievements & Badges System
 * Tracks and rewards user milestones
 */

import { playAchievementSound, playSuccessSound } from './soundEffects';

// Achievement categories and definitions
export const ACHIEVEMENTS = {
  // Learning Achievements
  first_quiz: {
    id: 'first_quiz',
    name: { en: 'Quiz Beginner', ar: 'مبتدئ الاختبارات' },
    description: { en: 'Complete your first quiz', ar: 'أكمل أول اختبار لك' },
    icon: '🎯',
    points: 10,
    category: 'learning',
    rarity: 'common'
  },
  perfect_quiz: {
    id: 'perfect_quiz',
    name: { en: 'Perfect Score', ar: 'الدرجة الكاملة' },
    description: { en: 'Score 100% on any quiz', ar: 'احصل على 100% في أي اختبار' },
    icon: '💯',
    points: 50,
    category: 'learning',
    rarity: 'rare'
  },
  quiz_master: {
    id: 'quiz_master',
    name: { en: 'Quiz Master', ar: 'سيد الاختبارات' },
    description: { en: 'Complete 10 quizzes', ar: 'أكمل 10 اختبارات' },
    icon: '🏆',
    points: 100,
    category: 'learning',
    rarity: 'rare',
    requirement: { type: 'count', target: 10 }
  },

  // Streak Achievements
  streak_week: {
    id: 'streak_week',
    name: { en: 'Week Warrior', ar: 'محارب الأسبوع' },
    description: { en: '7-day learning streak', ar: 'سلسلة 7 أيام متتالية' },
    icon: '🔥',
    points: 100,
    category: 'streak',
    rarity: 'rare'
  },
  streak_month: {
    id: 'streak_month',
    name: { en: 'Monthly Master', ar: 'سيد الشهر' },
    description: { en: '30-day learning streak', ar: 'سلسلة 30 يوم متتالية' },
    icon: '🔥🔥',
    points: 500,
    category: 'streak',
    rarity: 'legendary'
  },
  streak_century: {
    id: 'streak_century',
    name: { en: 'Century Legend', ar: 'أسطورة القرن' },
    description: { en: '100-day learning streak', ar: 'سلسلة 100 يوم متتالية' },
    icon: '👑',
    points: 2000,
    category: 'streak',
    rarity: 'legendary'
  },

  // Alphabet Learning
  alphabet_beginner: {
    id: 'alphabet_beginner',
    name: { en: 'Letter Learner', ar: 'متعلم الحروف' },
    description: { en: 'Learn 5 Arabic letters', ar: 'تعلم 5 حروف عربية' },
    icon: '📝',
    points: 25,
    category: 'alphabet',
    rarity: 'common'
  },
  alphabet_intermediate: {
    id: 'alphabet_intermediate',
    name: { en: 'Alphabet Explorer', ar: 'مستكشف الحروف' },
    description: { en: 'Learn 14 Arabic letters', ar: 'تعلم 14 حرف عربي' },
    icon: '📚',
    points: 75,
    category: 'alphabet',
    rarity: 'common'
  },
  alphabet_master: {
    id: 'alphabet_master',
    name: { en: 'Alphabet Master', ar: 'سيد الحروف' },
    description: { en: 'Learn all 28 Arabic letters', ar: 'تعلم جميع الحروف الـ28' },
    icon: '🎓',
    points: 200,
    category: 'alphabet',
    rarity: 'rare'
  },

  // Points Achievements
  points_100: {
    id: 'points_100',
    name: { en: 'Century Collector', ar: 'جامع المئة' },
    description: { en: 'Earn 100 total points', ar: 'اكسب 100 نقطة إجمالاً' },
    icon: '💰',
    points: 20,
    category: 'points',
    rarity: 'common'
  },
  points_500: {
    id: 'points_500',
    name: { en: 'Point Warrior', ar: 'محارب النقاط' },
    description: { en: 'Earn 500 total points', ar: 'اكسب 500 نقطة إجمالاً' },
    icon: '💎',
    points: 100,
    category: 'points',
    rarity: 'rare'
  },
  points_1000: {
    id: 'points_1000',
    name: { en: 'Point Legend', ar: 'أسطورة النقاط' },
    description: { en: 'Earn 1000 total points', ar: 'اكسب 1000 نقطة إجمالاً' },
    icon: '👑',
    points: 500,
    category: 'points',
    rarity: 'legendary'
  },

  // Social Achievements
  first_message: {
    id: 'first_message',
    name: { en: 'Communicator', ar: 'المتواصل' },
    description: { en: 'Send your first message', ar: 'أرسل أول رسالة لك' },
    icon: '💬',
    points: 10,
    category: 'social',
    rarity: 'common'
  },
  conversation_starter: {
    id: 'conversation_starter',
    name: { en: 'Conversation Starter', ar: 'بادئ المحادثة' },
    description: { en: 'Start 5 conversations', ar: 'ابدأ 5 محادثات' },
    icon: '💭',
    points: 50,
    category: 'social',
    rarity: 'common'
  },

  // Time-based Achievements
  early_bird: {
    id: 'early_bird',
    name: { en: 'Early Bird', ar: 'الطائر المبكر' },
    description: { en: 'Study before 8 AM', ar: 'ادرس قبل الساعة 8 صباحاً' },
    icon: '🌅',
    points: 25,
    category: 'time',
    rarity: 'common'
  },
  night_owl: {
    id: 'night_owl',
    name: { en: 'Night Owl', ar: 'بومة الليل' },
    description: { en: 'Study after 10 PM', ar: 'ادرس بعد الساعة 10 مساءً' },
    icon: '🦉',
    points: 25,
    category: 'time',
    rarity: 'common'
  },
  weekend_learner: {
    id: 'weekend_learner',
    name: { en: 'Weekend Learner', ar: 'متعلم نهاية الأسبوع' },
    description: { en: 'Study on Saturday and Sunday', ar: 'ادرس يومي السبت والأحد' },
    icon: '📅',
    points: 30,
    category: 'time',
    rarity: 'common'
  },

  // Practice Achievements
  practice_makes_perfect: {
    id: 'practice_makes_perfect',
    name: { en: 'Practice Makes Perfect', ar: 'التمرين يصنع الإتقان' },
    description: { en: 'Complete 50 practice sessions', ar: 'أكمل 50 جلسة تمرين' },
    icon: '⚡',
    points: 150,
    category: 'practice',
    rarity: 'rare'
  },
  dedicated_learner: {
    id: 'dedicated_learner',
    name: { en: 'Dedicated Learner', ar: 'المتعلم المخلص' },
    description: { en: 'Complete 100 practice sessions', ar: 'أكمل 100 جلسة تمرين' },
    icon: '🌟',
    points: 300,
    category: 'practice',
    rarity: 'legendary'
  },

  // Special Achievements
  speed_demon: {
    id: 'speed_demon',
    name: { en: 'Speed Demon', ar: 'شيطان السرعة' },
    description: { en: 'Complete a quiz in under 1 minute', ar: 'أكمل اختباراً في أقل من دقيقة' },
    icon: '⚡',
    points: 75,
    category: 'special',
    rarity: 'rare'
  },
  perfectionist: {
    id: 'perfectionist',
    name: { en: 'Perfectionist', ar: 'الكمالي' },
    description: { en: 'Score 100% on 5 quizzes', ar: 'احصل على 100% في 5 اختبارات' },
    icon: '✨',
    points: 200,
    category: 'special',
    rarity: 'legendary'
  },
  explorer: {
    id: 'explorer',
    name: { en: 'Explorer', ar: 'المستكشف' },
    description: { en: 'Try every learning section', ar: 'جرب كل أقسام التعلم' },
    icon: '🗺️',
    points: 100,
    category: 'special',
    rarity: 'rare'
  },
  first_profile_pic: {
    id: 'first_profile_pic',
    name: { en: 'Picture Perfect', ar: 'صورة مثالية' },
    description: { en: 'Set your first profile picture', ar: 'ضع أول صورة شخصية لك' },
    icon: '🖼️',
    points: 15,
    category: 'special',
    rarity: 'common'
  }
};

/**
 * Get user's unlocked achievements
 */
export const getUserAchievements = (userEmail) => {
  try {
    const achievementsKey = `mumayaz_achievements_${userEmail}`;
    const saved = localStorage.getItem(achievementsKey);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

/**
 * Save user achievements
 */
const saveUserAchievements = (userEmail, achievements) => {
  try {
    const achievementsKey = `mumayaz_achievements_${userEmail}`;
    localStorage.setItem(achievementsKey, JSON.stringify(achievements));
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
};

/**
 * Check if achievement is already unlocked
 */
export const isAchievementUnlocked = (userEmail, achievementId) => {
  const achievements = getUserAchievements(userEmail);
  return achievements.some(a => a.id === achievementId);
};

/**
 * Unlock an achievement
 */
export const unlockAchievement = (userEmail, achievementId) => {
  if (isAchievementUnlocked(userEmail, achievementId)) {
    return null; // Already unlocked
  }

  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) {
    console.warn(`Achievement ${achievementId} not found`);
    return null;
  }

  const achievements = getUserAchievements(userEmail);
  const unlockedAchievement = {
    ...achievement,
    unlockedAt: new Date().toISOString()
  };

  achievements.push(unlockedAchievement);
  saveUserAchievements(userEmail, achievements);

  // Award points
  if (achievement.points > 0) {
    awardPoints(userEmail, achievement.points);
  }

  // Play achievement sound
  playAchievementSound();

  // Trigger haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200]);
  }

  // Dispatch event for UI to show notification
  window.dispatchEvent(new CustomEvent('achievementUnlocked', {
    detail: unlockedAchievement
  }));

  return unlockedAchievement;
};

/**
 * Award points to user
 */
const awardPoints = (userEmail, points) => {
  try {
    const pointsKey = `mumayaz_points_${userEmail}`;
    const saved = localStorage.getItem(pointsKey);
    const pointsData = saved ? JSON.parse(saved) : { total: 0, history: [] };

    pointsData.total += points;
    pointsData.history.push({
      amount: points,
      reason: 'Achievement',
      timestamp: new Date().toISOString()
    });

    localStorage.setItem(pointsKey, JSON.stringify(pointsData));
  } catch (error) {
    console.error('Error awarding points:', error);
  }
};

/**
 * Check achievements based on user action
 */
export const checkAchievements = (userEmail, action, data = {}) => {
  const newAchievements = [];

  switch (action) {
    case 'quiz_completed':
      if (!isAchievementUnlocked(userEmail, 'first_quiz')) {
        newAchievements.push(unlockAchievement(userEmail, 'first_quiz'));
      }
      if (data.score === 100 && !isAchievementUnlocked(userEmail, 'perfect_quiz')) {
        newAchievements.push(unlockAchievement(userEmail, 'perfect_quiz'));
      }
      if (data.completionTime < 60 && !isAchievementUnlocked(userEmail, 'speed_demon')) {
        newAchievements.push(unlockAchievement(userEmail, 'speed_demon'));
      }
      checkCountAchievement(userEmail, 'quiz_master', data.totalQuizzes, 10, newAchievements);
      checkPerfectQuizCount(userEmail, data.perfectQuizCount, newAchievements);
      break;

    case 'streak_updated':
      if (data.streak === 7) {
        newAchievements.push(unlockAchievement(userEmail, 'streak_week'));
      }
      if (data.streak === 30) {
        newAchievements.push(unlockAchievement(userEmail, 'streak_month'));
      }
      if (data.streak === 100) {
        newAchievements.push(unlockAchievement(userEmail, 'streak_century'));
      }
      break;

    case 'message_sent':
      if (!isAchievementUnlocked(userEmail, 'first_message')) {
        newAchievements.push(unlockAchievement(userEmail, 'first_message'));
      }
      checkCountAchievement(userEmail, 'conversation_starter', data.conversationCount, 5, newAchievements);
      break;

    case 'profile_picture_set':
      if (!isAchievementUnlocked(userEmail, 'first_profile_pic')) {
        newAchievements.push(unlockAchievement(userEmail, 'first_profile_pic'));
      }
      break;

    case 'points_earned':
      checkPointsAchievements(userEmail, data.totalPoints, newAchievements);
      break;

    case 'section_visited':
      checkExplorerAchievement(userEmail, data.sectionsVisited, newAchievements);
      checkTimeBasedAchievements(userEmail, newAchievements);
      break;

    case 'alphabet_progress':
      checkAlphabetAchievements(userEmail, data.lettersLearned, newAchievements);
      break;

    default:
      console.warn(`Unknown action: ${action}`);
  }

  return newAchievements.filter(a => a !== null);
};

// Helper functions for specific achievement checks
const checkCountAchievement = (userEmail, achievementId, currentCount, targetCount, achievements) => {
  if (currentCount >= targetCount && !isAchievementUnlocked(userEmail, achievementId)) {
    achievements.push(unlockAchievement(userEmail, achievementId));
  }
};

const checkPerfectQuizCount = (userEmail, perfectCount, achievements) => {
  if (perfectCount >= 5 && !isAchievementUnlocked(userEmail, 'perfectionist')) {
    achievements.push(unlockAchievement(userEmail, 'perfectionist'));
  }
};

const checkPointsAchievements = (userEmail, totalPoints, achievements) => {
  if (totalPoints >= 100 && !isAchievementUnlocked(userEmail, 'points_100')) {
    achievements.push(unlockAchievement(userEmail, 'points_100'));
  }
  if (totalPoints >= 500 && !isAchievementUnlocked(userEmail, 'points_500')) {
    achievements.push(unlockAchievement(userEmail, 'points_500'));
  }
  if (totalPoints >= 1000 && !isAchievementUnlocked(userEmail, 'points_1000')) {
    achievements.push(unlockAchievement(userEmail, 'points_1000'));
  }
};

const checkAlphabetAchievements = (userEmail, lettersLearned, achievements) => {
  if (lettersLearned >= 5 && !isAchievementUnlocked(userEmail, 'alphabet_beginner')) {
    achievements.push(unlockAchievement(userEmail, 'alphabet_beginner'));
  }
  if (lettersLearned >= 14 && !isAchievementUnlocked(userEmail, 'alphabet_intermediate')) {
    achievements.push(unlockAchievement(userEmail, 'alphabet_intermediate'));
  }
  if (lettersLearned >= 28 && !isAchievementUnlocked(userEmail, 'alphabet_master')) {
    achievements.push(unlockAchievement(userEmail, 'alphabet_master'));
  }
};

const checkExplorerAchievement = (userEmail, sectionsVisited, achievements) => {
  const requiredSections = ['alphabet', 'colors', 'words', 'sentences', 'quiz', 'drawing'];
  const allVisited = requiredSections.every(section => sectionsVisited.includes(section));

  if (allVisited && !isAchievementUnlocked(userEmail, 'explorer')) {
    achievements.push(unlockAchievement(userEmail, 'explorer'));
  }
};

const checkTimeBasedAchievements = (userEmail, achievements) => {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();

  // Early bird (before 8 AM)
  if (currentHour < 8 && !isAchievementUnlocked(userEmail, 'early_bird')) {
    achievements.push(unlockAchievement(userEmail, 'early_bird'));
  }

  // Night owl (after 10 PM)
  if (currentHour >= 22 && !isAchievementUnlocked(userEmail, 'night_owl')) {
    achievements.push(unlockAchievement(userEmail, 'night_owl'));
  }

  // Weekend learner (Saturday=6, Sunday=0)
  if ((currentDay === 0 || currentDay === 6) && !isAchievementUnlocked(userEmail, 'weekend_learner')) {
    const weekendKey = `mumayaz_weekend_studied_${userEmail}`;
    const weekendData = JSON.parse(localStorage.getItem(weekendKey) || '{}');

    if (currentDay === 6) weekendData.saturday = true;
    if (currentDay === 0) weekendData.sunday = true;

    localStorage.setItem(weekendKey, JSON.stringify(weekendData));

    if (weekendData.saturday && weekendData.sunday) {
      achievements.push(unlockAchievement(userEmail, 'weekend_learner'));
    }
  }
};

/**
 * Get achievement statistics
 */
export const getAchievementStats = (userEmail) => {
  const unlocked = getUserAchievements(userEmail);
  const total = Object.keys(ACHIEVEMENTS).length;

  const byCategory = {};
  const byRarity = {};

  unlocked.forEach(achievement => {
    byCategory[achievement.category] = (byCategory[achievement.category] || 0) + 1;
    byRarity[achievement.rarity] = (byRarity[achievement.rarity] || 0) + 1;
  });

  return {
    unlocked: unlocked.length,
    total,
    percentage: Math.round((unlocked.length / total) * 100),
    byCategory,
    byRarity
  };
};

export default {
  ACHIEVEMENTS,
  getUserAchievements,
  isAchievementUnlocked,
  unlockAchievement,
  checkAchievements,
  getAchievementStats
};
