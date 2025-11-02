/**
 * User Data Export Utility
 * Allows users to export all their platform data as JSON
 */

import { playSuccessSound, playClickSound } from './soundEffects';

/**
 * Get user profile data
 */
const getUserProfile = (userEmail) => {
  try {
    const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
    const user = users[userEmail.toLowerCase()];
    if (!user) return null;

    return {
      email: userEmail,
      name: user.name || '',
      role: user.role || 'student',
      profilePicture: user.profilePicture || null,
      createdAt: user.createdAt || null
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Get user progress data
 */
const getProgress = (userEmail) => {
  try {
    const progress = localStorage.getItem('arabic_learning_progress');
    return progress ? JSON.parse(progress) : null;
  } catch (error) {
    console.error('Error getting progress:', error);
    return null;
  }
};

/**
 * Get user points data
 */
const getPoints = (userEmail) => {
  try {
    const pointsKey = `mumayaz_points_${userEmail}`;
    const points = localStorage.getItem(pointsKey);
    return points ? JSON.parse(points) : { total: 0, history: [] };
  } catch (error) {
    console.error('Error getting points:', error);
    return null;
  }
};

/**
 * Get user streak data
 */
const getStreakData = (userEmail) => {
  try {
    const streakKey = `mumayaz_streak_${userEmail}`;
    const streak = localStorage.getItem(streakKey);
    return streak ? JSON.parse(streak) : null;
  } catch (error) {
    console.error('Error getting streak data:', error);
    return null;
  }
};

/**
 * Get user quiz history
 */
const getQuizHistory = (userEmail) => {
  try {
    const quizKey = `mumayaz_quiz_history_${userEmail}`;
    const history = localStorage.getItem(quizKey);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting quiz history:', error);
    return [];
  }
};

/**
 * Get user messages (if teacher or parent)
 */
const getMessages = (userEmail) => {
  try {
    const conversations = JSON.parse(localStorage.getItem('mumayaz_conversations') || '{}');
    const messages = JSON.parse(localStorage.getItem('mumayaz_messages') || '{}');

    const userConversations = Object.values(conversations).filter(conv =>
      conv.participants.includes(userEmail.toLowerCase())
    );

    const userMessages = userConversations.map(conv => ({
      conversationId: conv.id,
      participants: conv.participants,
      messages: messages[conv.id] || []
    }));

    return userMessages;
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

/**
 * Get user achievements
 */
const getAchievements = (userEmail) => {
  try {
    const achievementsKey = `mumayaz_achievements_${userEmail}`;
    const achievements = localStorage.getItem(achievementsKey);
    return achievements ? JSON.parse(achievements) : [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

/**
 * Get user preferences
 */
const getUserPreferences = () => {
  try {
    return {
      darkMode: localStorage.getItem('mumayaz_dark_mode') === 'true',
      soundsEnabled: localStorage.getItem('mumayaz_sounds_enabled') !== 'false',
      language: localStorage.getItem('mumayaz_language') || 'en'
    };
  } catch (error) {
    console.error('Error getting preferences:', error);
    return null;
  }
};

/**
 * Main export function
 * Collects all user data and generates a downloadable JSON file
 */
export const exportUserData = (userEmail) => {
  try {
    playClickSound();

    if (!userEmail) {
      alert('No user email found. Please log in again.');
      return;
    }

    // Collect all user data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      platform: 'Mumayaz Arabic Learning Platform',

      profile: getUserProfile(userEmail),
      progress: getProgress(userEmail),
      points: getPoints(userEmail),
      streak: getStreakData(userEmail),
      achievements: getAchievements(userEmail),
      quizHistory: getQuizHistory(userEmail),
      messages: getMessages(userEmail),
      preferences: getUserPreferences()
    };

    // Convert to JSON with pretty formatting
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create download URL
    const url = URL.createObjectURL(blob);

    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `mumayaz-data-${userEmail.split('@')[0]}-${timestamp}.json`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Play success sound
    setTimeout(() => playSuccessSound(), 200);

    // Show success message
    return true;
  } catch (error) {
    console.error('Error exporting user data:', error);
    alert('Failed to export data. Please try again.');
    return false;
  }
};

/**
 * Import user data from JSON file
 * Allows users to restore their data
 */
export const importUserData = (file, userEmail) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // Validate data structure
        if (!importedData.profile || !importedData.exportVersion) {
          reject(new Error('Invalid data file format'));
          return;
        }

        // Verify email matches (security check)
        if (importedData.profile.email.toLowerCase() !== userEmail.toLowerCase()) {
          const confirmImport = window.confirm(
            'This data belongs to a different user. Do you still want to import it?'
          );
          if (!confirmImport) {
            reject(new Error('Import cancelled by user'));
            return;
          }
        }

        // Restore data to localStorage
        if (importedData.progress) {
          localStorage.setItem('arabic_learning_progress', JSON.stringify(importedData.progress));
        }

        if (importedData.points) {
          const pointsKey = `mumayaz_points_${userEmail}`;
          localStorage.setItem(pointsKey, JSON.stringify(importedData.points));
        }

        if (importedData.streak) {
          const streakKey = `mumayaz_streak_${userEmail}`;
          localStorage.setItem(streakKey, JSON.stringify(importedData.streak));
        }

        if (importedData.achievements) {
          const achievementsKey = `mumayaz_achievements_${userEmail}`;
          localStorage.setItem(achievementsKey, JSON.stringify(importedData.achievements));
        }

        if (importedData.quizHistory) {
          const quizKey = `mumayaz_quiz_history_${userEmail}`;
          localStorage.setItem(quizKey, JSON.stringify(importedData.quizHistory));
        }

        if (importedData.preferences) {
          if (importedData.preferences.darkMode !== undefined) {
            localStorage.setItem('mumayaz_dark_mode', importedData.preferences.darkMode.toString());
          }
          if (importedData.preferences.soundsEnabled !== undefined) {
            localStorage.setItem('mumayaz_sounds_enabled', importedData.preferences.soundsEnabled.toString());
          }
        }

        playSuccessSound();
        resolve(importedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Clear all user data (with confirmation)
 */
export const clearAllUserData = (userEmail) => {
  const confirmation = window.prompt(
    'This will delete ALL your data permanently. Type "DELETE" to confirm:'
  );

  if (confirmation !== 'DELETE') {
    alert('Data deletion cancelled');
    return false;
  }

  try {
    // Remove user-specific data
    const keysToRemove = [
      'arabic_learning_progress',
      `mumayaz_points_${userEmail}`,
      `mumayaz_streak_${userEmail}`,
      `mumayaz_achievements_${userEmail}`,
      `mumayaz_quiz_history_${userEmail}`
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    alert('All user data has been deleted');
    playSuccessSound();
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    alert('Failed to clear data. Please try again.');
    return false;
  }
};

export default {
  exportUserData,
  importUserData,
  clearAllUserData
};
