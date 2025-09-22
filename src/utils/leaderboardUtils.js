// src/utils/leaderboardUtils.js - Leaderboard tracking utilities

const LEADERBOARD_KEY = "mumayaz_leaderboard";
const USER_STATS_KEY = "mumayaz_user_stats";

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
      streak: 0
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return null;
  }
};

/**
 * Get user name from users storage
 */
const getUserName = (userEmail) => {
  try {
    const users = JSON.parse(localStorage.getItem("mumayaz_users")) || {};
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
    const users = Object.values(allStats);

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

    return {
      totalUsers: users.length,
      mostActiveUsers,
      mostChats,
      mostMessages,
      recentlyActive
    };
  } catch (error) {
    console.error("Error getting leaderboard data:", error);
    return {
      totalUsers: 0,
      mostActiveUsers: [],
      mostChats: [],
      mostMessages: [],
      recentlyActive: []
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
        streak: 0
      };

      localStorage.setItem(USER_STATS_KEY, JSON.stringify(allStats));
    }

    return { success: true };
  } catch (error) {
    console.error("Error initializing user stats:", error);
    return { success: false, error: error.message };
  }
};