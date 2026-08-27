// src/utils/leaderboardUtils.js - Leaderboard tracking utilities

const LEADERBOARD_KEY = "stellar_leaderboard";
const USER_STATS_KEY = "stellar_user_stats";

// Achievement bonuses are the one kind of point kept outside user stats:
// achievementsSystem writes them to its own per-user key.
const ACHIEVEMENT_POINTS_PREFIX = "stellar_points_";

/**
 * Fired whenever a user's point total changes, so any screen showing points
 * (progress dashboard, leaderboard, …) can refresh instead of waiting for its
 * next poll or re-open.
 */
export const POINTS_CHANGED_EVENT = "stellar:points-changed";

export const emitPointsChanged = (userEmail) => {
  try {
    window.dispatchEvent(
      new CustomEvent(POINTS_CHANGED_EVENT, { detail: { userEmail } })
    );
  } catch (error) {
    // No window (tests / SSR) — nothing to notify.
  }
};

/**
 * Get current user statistics
 */
export const getUserStats = (userEmail) => {
  try {
    const stats = JSON.parse(localStorage.getItem(USER_STATS_KEY)) || {};
    return stats[userEmail.toLowerCase()] || {
      email: userEmail.toLowerCase(),
      name: getUserName(userEmail),
      totalChats: 0,
      totalMessages: 0,
      totalTimeSpent: 0, // in minutes
      lastActive: null,
      joinedAt: new Date().toISOString(),
      achievements: [],
      streak: 0,
      // Point fields, so every reader gets numbers rather than undefined
      totalPoints: 0,
      learningPoints: 0,
      dailyTaskPoints: 0,
      taskStreak: 0
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return null;
  }
};

/**
 * Achievement bonus points for a user (`stellar_points_<email>.total`).
 *
 * The key is written with whatever casing the caller had, while user stats are
 * keyed lowercase, so the lookup is case-insensitive on the whole key.
 */
export const getAchievementPoints = (userEmail) => {
  if (!userEmail) return 0;

  try {
    const wanted = `${ACHIEVEMENT_POINTS_PREFIX}${userEmail}`.toLowerCase();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key.toLowerCase() !== wanted) continue;
      return JSON.parse(localStorage.getItem(key) || "{}").total || 0;
    }

    return 0;
  } catch (error) {
    console.error("Error reading achievement points:", error);
    return 0;
  }
};

/**
 * The single point total every screen must display.
 *
 * `stats.totalPoints` is a running sum that ALREADY includes learningPoints and
 * dailyTaskPoints — both recorders add to it as well as to their own bucket. So
 * `totalPoints + learningPoints + dailyTaskPoints` (what the leaderboard used
 * to show) counted every learning point twice, which is why the leaderboard and
 * the progress dashboard disagreed. Achievement bonuses are the only points
 * stored elsewhere, so they are the only thing added on top here.
 *
 * Accepts either an email or an already-loaded stats object.
 */
export const getTotalPoints = (userOrEmail) => {
  if (!userOrEmail) return 0;

  const stats =
    typeof userOrEmail === "string" ? getUserStats(userOrEmail) : userOrEmail;
  if (!stats) return 0;

  const email =
    stats.email || (typeof userOrEmail === "string" ? userOrEmail : null);

  return (stats.totalPoints || 0) + getAchievementPoints(email);
};

/**
 * Resolve a stats object for sorting/display: `totalPoints` becomes the
 * canonical total.
 *
 * The result is final — do NOT run it back through getTotalPoints(), which
 * would add the achievement bonus a second time.
 */
const withTotalPoints = (user) => ({ ...user, totalPoints: getTotalPoints(user) });

/**
 * Get user name from users storage
 */
const getUserName = (userEmail) => {
  try {
    const users = JSON.parse(localStorage.getItem("stellar_users")) || {};
    const user = users[userEmail.toLowerCase()];
    return user?.name || userEmail.split('@')[0];
  } catch (error) {
    return userEmail.split('@')[0];
  }
};

/**
 * Update user statistics
 */
export const updateUserStats = (userEmail, updates) => {
  try {
    const allStats = JSON.parse(localStorage.getItem(USER_STATS_KEY)) || {};
    const currentStats = getUserStats(userEmail);

    if (!currentStats) return { success: false, error: "Failed to get current stats" };

    const updatedStats = {
      ...currentStats,
      ...updates,
      lastActive: new Date().toISOString()
    };

    allStats[userEmail.toLowerCase()] = updatedStats;
    localStorage.setItem(USER_STATS_KEY, JSON.stringify(allStats));

    emitPointsChanged(userEmail);

    return { success: true, stats: updatedStats };
  } catch (error) {
    console.error("Error updating user stats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Record a new chat session
 */
export const recordChatSession = (userEmail, duration = 0, messageCount = 0) => {
  try {
    const currentStats = getUserStats(userEmail);
    if (!currentStats) return { success: false };

    const updates = {
      totalChats: currentStats.totalChats + 1,
      totalMessages: currentStats.totalMessages + messageCount,
      totalTimeSpent: currentStats.totalTimeSpent + duration
    };

    return updateUserStats(userEmail, updates);
  } catch (error) {
    console.error("Error recording chat session:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Record a message sent
 */
export const recordMessage = (userEmail) => {
  try {
    const currentStats = getUserStats(userEmail);
    if (!currentStats) return { success: false };

    const updates = {
      totalMessages: currentStats.totalMessages + 1
    };

    return updateUserStats(userEmail, updates);
  } catch (error) {
    console.error("Error recording message:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get leaderboard data
 */
export const getLeaderboardData = () => {
  try {
    const allStats = JSON.parse(localStorage.getItem(USER_STATS_KEY)) || {};

    // Resolve the canonical total once, so EVERY list carries a display-ready
    // `totalPoints`. Callers read that field directly rather than re-deriving.
    const users = Object.values(allStats).map(withTotalPoints);

    // Sort by different criteria
    const mostActiveUsers = [...users]
      .sort((a, b) => b.totalTimeSpent - a.totalTimeSpent)
      .slice(0, 10);

    const mostChats = [...users]
      .sort((a, b) => b.totalChats - a.totalChats)
      .slice(0, 10);

    const mostMessages = [...users]
      .sort((a, b) => b.totalMessages - a.totalMessages)
      .slice(0, 10);

    const recentlyActive = [...users]
      .filter(user => user.lastActive)
      .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
      .slice(0, 10);

    // New leaderboards for points
    const topPointsTotal = [...users]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    const topLearningPoints = [...users]
      .sort((a, b) => (b.learningPoints || 0) - (a.learningPoints || 0))
      .slice(0, 10);

    const topDailyTaskPoints = [...users]
      .sort((a, b) => (b.dailyTaskPoints || 0) - (a.dailyTaskPoints || 0))
      .slice(0, 10);

    const topStreaks = [...users]
      .sort((a, b) => (b.taskStreak || 0) - (a.taskStreak || 0))
      .filter(user => (user.taskStreak || 0) > 0)
      .slice(0, 10);

    return {
      totalUsers: users.length,
      mostActiveUsers,
      mostChats,
      mostMessages,
      recentlyActive,
      // New categories
      topPointsTotal,
      topLearningPoints,
      topDailyTaskPoints,
      topStreaks
    };
  } catch (error) {
    console.error("Error getting leaderboard data:", error);
    return {
      totalUsers: 0,
      mostActiveUsers: [],
      mostChats: [],
      mostMessages: [],
      recentlyActive: [],
      topPointsTotal: [],
      topLearningPoints: [],
      topDailyTaskPoints: [],
      topStreaks: []
    };
  }
};

/**
 * Format time duration for display
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) { // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
};

/**
 * Format relative time for last active
 */
export const formatRelativeTime = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  } catch (error) {
    return "Unknown";
  }
};

/**
 * Get user rank in a specific category
 */
export const getUserRank = (userEmail, category = "totalTimeSpent") => {
  try {
    const allStats = JSON.parse(localStorage.getItem(USER_STATS_KEY)) || {};
    const users = Object.values(allStats);
    const sortedUsers = users.sort((a, b) => b[category] - a[category]);

    const userIndex = sortedUsers.findIndex(user => user.email === userEmail.toLowerCase());
    return userIndex >= 0 ? userIndex + 1 : null;
  } catch (error) {
    console.error("Error getting user rank:", error);
    return null;
  }
};

/**
 * Record learning points
 */
export const recordLearningPoints = (userEmail, points, activityType = "general") => {
  try {
    const currentStats = getUserStats(userEmail);
    if (!currentStats) return { success: false };

    // `totalPoints` is the running total across every bucket; `learningPoints`
    // is the per-bucket breakdown. Read them with getTotalPoints(), never by
    // summing the buckets back onto the total.
    const updates = {
      learningPoints: (currentStats.learningPoints || 0) + points,
      totalPoints: ((currentStats.totalPoints || 0) + points),
      totalMessages: currentStats.totalMessages + 1 // Count as engagement
    };

    // Track activity type
    if (!currentStats.learningActivities) {
      updates.learningActivities = {};
    } else {
      updates.learningActivities = { ...currentStats.learningActivities };
    }

    if (!updates.learningActivities[activityType]) {
      updates.learningActivities[activityType] = 0;
    }
    updates.learningActivities[activityType] += points;

    return updateUserStats(userEmail, updates);
  } catch (error) {
    console.error("Error recording learning points:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Record daily task points
 */
export const recordDailyTaskPoints = (userEmail, points, taskType = "general") => {
  try {
    const currentStats = getUserStats(userEmail);
    if (!currentStats) return { success: false };

    const today = new Date().toDateString();

    const updates = {
      dailyTaskPoints: (currentStats.dailyTaskPoints || 0) + points,
      totalPoints: ((currentStats.totalPoints || 0) + points),
      totalMessages: currentStats.totalMessages + 1 // Count as engagement
    };

    // Track daily points by date
    if (!currentStats.dailyPointsByDate) {
      updates.dailyPointsByDate = {};
    } else {
      updates.dailyPointsByDate = { ...currentStats.dailyPointsByDate };
    }

    if (!updates.dailyPointsByDate[today]) {
      updates.dailyPointsByDate[today] = 0;
    }
    updates.dailyPointsByDate[today] += points;

    return updateUserStats(userEmail, updates);
  } catch (error) {
    console.error("Error recording daily task points:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get comprehensive user rank including all point types
 */
export const getComprehensiveUserRank = (userEmail) => {
  try {
    const allStats = JSON.parse(localStorage.getItem(USER_STATS_KEY)) || {};
    const users = Object.values(allStats);

    // Calculate total points for each user
    const usersWithTotalPoints = users.map(withTotalPoints);

    const sortedUsers = usersWithTotalPoints.sort((a, b) => b.totalPoints - a.totalPoints);
    const userIndex = sortedUsers.findIndex(user => user.email === userEmail.toLowerCase());

    return {
      rank: userIndex >= 0 ? userIndex + 1 : null,
      totalUsers: users.length,
      userStats: sortedUsers.find(user => user.email === userEmail.toLowerCase())
    };
  } catch (error) {
    console.error("Error getting comprehensive user rank:", error);
    return { rank: null, totalUsers: 0, userStats: null };
  }
};

/**
 * Initialize user stats if not exists
 */
export const initializeUserStats = (userEmail, userName) => {
  try {
    const allStats = JSON.parse(localStorage.getItem(USER_STATS_KEY)) || {};

    if (!allStats[userEmail.toLowerCase()]) {
      allStats[userEmail.toLowerCase()] = {
        email: userEmail.toLowerCase(),
        name: userName || userEmail.split('@')[0],
        totalChats: 0,
        totalMessages: 0,
        totalTimeSpent: 0,
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        achievements: [],
        streak: 0,
        // New point tracking fields
        learningPoints: 0,
        dailyTaskPoints: 0,
        totalPoints: 0,
        learningActivities: {},
        dailyPointsByDate: {},
        taskStreak: 0,
        // Additional tracking
        quizzesPassed: 0,
        lessonsCompleted: 0,
        wordsLearned: 0,
        lettersLearned: 0,
        sentencesLearned: 0
      };

      localStorage.setItem(USER_STATS_KEY, JSON.stringify(allStats));
    }

    return { success: true };
  } catch (error) {
    console.error("Error initializing user stats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get class leaderboard
 */
export const getClassLeaderboard = (className) => {
  try {
    const teacherData = JSON.parse(localStorage.getItem('stellar_teachers') || '{}');
    const allStats = JSON.parse(localStorage.getItem(USER_STATS_KEY) || '{}');

    // Find students in this class
    const classStudents = [];

    Object.values(teacherData).forEach(teacher => {
      if (teacher.classes && teacher.classes[className]) {
        const studentEmails = teacher.classes[className].students || [];
        studentEmails.forEach(email => {
          const emailLower = email.toLowerCase();
          if (allStats[emailLower]) {
            classStudents.push(withTotalPoints(allStats[emailLower]));
          }
        });
      }
    });

    // Sort by total points
    const leaderboard = classStudents.sort((a, b) => b.totalPoints - a.totalPoints);

    return {
      success: true,
      leaderboard,
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

/**
 * Get user's class rank
 */
export const getUserClassRank = (userEmail, className) => {
  try {
    const classData = getClassLeaderboard(className);
    if (!classData.success) return { rank: null, totalStudents: 0 };

    const userIndex = classData.leaderboard.findIndex(
      student => student.email === userEmail.toLowerCase()
    );

    return {
      rank: userIndex >= 0 ? userIndex + 1 : null,
      totalStudents: classData.totalStudents,
      leaderboard: classData.leaderboard.slice(0, 10)
    };
  } catch (error) {
    console.error("Error getting user class rank:", error);
    return { rank: null, totalStudents: 0, leaderboard: [] };
  }
};