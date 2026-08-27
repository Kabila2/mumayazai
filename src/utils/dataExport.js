/**
 * User Data Export / Import / Delete
 *
 * All three operations are driven by `storageRegistry`, which owns the answer
 * to "which localStorage keys belong to this user?". Keeping them on one
 * resolver is what guarantees that an export captures everything a delete
 * removes, and that an import puts it all back.
 */

import { playSuccessSound, playClickSound } from './soundEffects';
import {
  collectUserData,
  purgeUserData,
  restoreUserData,
  countUserData
} from './storageRegistry';

export const EXPORT_VERSION = '2.0';

/**
 * Get user profile data
 */
const getUserProfile = (userEmail) => {
  try {
    const users = JSON.parse(localStorage.getItem('stellar_users') || '{}');
    const user = users[userEmail.toLowerCase()];
    if (!user) return { email: userEmail };

    return {
      email: userEmail,
      name: user.name || '',
      role: user.role || 'student',
      profilePicture: user.profilePicture || null,
      createdAt: user.createdAt || null
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { email: userEmail };
  }
};

const parseMaybe = (raw, fallback) => {
  try {
    return raw === null || raw === undefined ? fallback : JSON.parse(raw);
  } catch (error) {
    return raw;
  }
};

/**
 * A readable summary of the snapshot.
 *
 * The `storage` block below is what actually gets restored; this exists so the
 * exported file is still meaningful when opened in a text editor.
 */
const buildSummary = (snapshot, userEmail) => {
  const email = userEmail.toLowerCase();
  const { standalone, shared } = snapshot;

  const userKey = (prefix) => standalone[`${prefix}${userEmail}`] ?? standalone[`${prefix}${email}`];

  return {
    progress: parseMaybe(standalone['arabic_learning_progress'], null),
    moduleProgress: shared['stellar_module_progress']?.[email] || null,
    points: parseMaybe(userKey('stellar_points_'), { total: 0, history: [] }),
    streak: parseMaybe(userKey('stellar_streak_'), null),
    achievements: parseMaybe(userKey('stellar_achievements_'), []),
    quizHistory: parseMaybe(userKey('stellar_quiz_history_'), []),
    certificates: parseMaybe(userKey('stellar_certificates_'), []),
    stats: shared['stellar_user_stats']?.[email] || null,
    conversations: Object.keys(shared['stellar_conversations'] || {}).length,
    preferences: {
      darkMode: standalone['stellar_dark_mode'] === 'true',
      soundsEnabled: standalone['stellar_sounds_enabled'] !== 'false',
      language: standalone['stellar_language'] || standalone['app-language'] || 'en',
      font: standalone['stellar_font'] || null,
      textSize: standalone['stellar_text_size'] || null
    }
  };
};

/**
 * Export every piece of data belonging to the user as a downloadable JSON file.
 *
 * @param {string} userEmail
 * @returns {{ success: boolean, entryCount?: number, error?: string }}
 */
export const exportUserData = (userEmail) => {
  try {
    playClickSound();

    if (!userEmail) {
      return { success: false, error: 'No user email found. Please log in again.' };
    }

    const snapshot = collectUserData(userEmail);

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: EXPORT_VERSION,
      platform: 'Stellar Arabic Learning Platform',

      profile: getUserProfile(userEmail),

      // Human-readable overview of what the file contains.
      summary: buildSummary(snapshot, userEmail),

      // The authoritative payload - a complete snapshot of the user's storage.
      storage: snapshot
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `stellar-data-${userEmail.split('@')[0]}-${timestamp}.json`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => playSuccessSound(), 200);

    const entryCount =
      Object.keys(snapshot.standalone).length + Object.keys(snapshot.shared).length;

    return { success: true, entryCount };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore a version 1 export, which stored a handful of decoded fields instead
 * of a storage snapshot. Older backups stay importable.
 */
const restoreLegacyExport = (data, userEmail) => {
  const restoredKeys = [];

  const put = (key, value) => {
    if (value === undefined || value === null) return;
    localStorage.setItem(key, JSON.stringify(value));
    restoredKeys.push(key);
  };

  put('arabic_learning_progress', data.progress);
  put(`stellar_points_${userEmail}`, data.points);
  put(`stellar_streak_${userEmail}`, data.streak);
  put(`stellar_achievements_${userEmail}`, data.achievements);
  put(`stellar_quiz_history_${userEmail}`, data.quizHistory);

  if (data.preferences) {
    if (data.preferences.darkMode !== undefined) {
      localStorage.setItem('stellar_dark_mode', String(data.preferences.darkMode));
      restoredKeys.push('stellar_dark_mode');
    }
    if (data.preferences.soundsEnabled !== undefined) {
      localStorage.setItem('stellar_sounds_enabled', String(data.preferences.soundsEnabled));
      restoredKeys.push('stellar_sounds_enabled');
    }
    if (data.preferences.language) {
      localStorage.setItem('stellar_language', data.preferences.language);
      restoredKeys.push('stellar_language');
    }
  }

  // Version 1 stored messages as a list of conversation objects.
  if (Array.isArray(data.messages) && data.messages.length) {
    const conversations = JSON.parse(localStorage.getItem('stellar_conversations') || '{}');
    data.messages.forEach((entry) => {
      if (!entry?.conversationId) return;
      conversations[entry.conversationId] = {
        id: entry.conversationId,
        participants: entry.participants || [],
        ...(conversations[entry.conversationId] || {})
      };
      localStorage.setItem(
        `stellar_messages_${entry.conversationId}`,
        JSON.stringify(entry.messages || [])
      );
      restoredKeys.push(`stellar_messages_${entry.conversationId}`);
    });
    localStorage.setItem('stellar_conversations', JSON.stringify(conversations));
    restoredKeys.push('stellar_conversations');
  }

  return { restoredKeys, mergedContainers: [] };
};

/**
 * Import user data from a previously exported JSON file.
 *
 * By default this is a *restore*, not a merge: the user's current data is
 * cleared first so the result matches the backup exactly. Pass
 * `{ replace: false }` to merge the file on top of what is already there.
 *
 * @param {File} file
 * @param {string} userEmail
 * @param {{ replace?: boolean, onForeignData?: (fileEmail: string) => boolean }} options
 */
export const importUserData = (file, userEmail, options = {}) => {
  const {
    replace = true,
    onForeignData = (fileEmail) =>
      window.confirm(
        `This file belongs to ${fileEmail}. Import it into ${userEmail} anyway?`
      )
  } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (!userEmail) {
      reject(new Error('No user email found. Please log in again.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (!importedData || !importedData.exportVersion) {
          reject(new Error('Invalid data file format'));
          return;
        }

        const fileEmail = importedData.profile?.email;
        if (fileEmail && fileEmail.toLowerCase() !== userEmail.toLowerCase()) {
          if (!onForeignData(fileEmail)) {
            reject(new Error('Import cancelled'));
            return;
          }
        }

        // Start from a clean slate so leftovers can't survive the restore.
        if (replace) {
          purgeUserData(userEmail, { dropAccount: false });
        }

        const result = importedData.storage
          ? restoreUserData(importedData.storage, userEmail)
          : restoreLegacyExport(importedData, userEmail);

        playSuccessSound();
        window.dispatchEvent(new Event('userDataUpdated'));

        resolve({
          ...importedData,
          restoredCount: result.restoredKeys.length + result.mergedContainers.length,
          restoredKeys: result.restoredKeys,
          mergedContainers: result.mergedContainers
        });
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
 * Delete every piece of data belonging to the user.
 *
 * The account record and login session are kept so the user can immediately
 * import a backup; everything else - progress, points, streaks, achievements,
 * quizzes, certificates, chats, homework, classes and preferences - is removed.
 *
 * @param {string} userEmail
 * @param {{ confirm?: () => boolean, dropAccount?: boolean }} options
 * @returns {{ success: boolean, removedCount?: number, cancelled?: boolean, error?: string }}
 */
export const clearAllUserData = (userEmail, options = {}) => {
  const {
    dropAccount = false,
    confirm = () =>
      (window.prompt(
        'This will permanently delete ALL your data on this device.\n' +
          'Type DELETE to confirm:'
      ) || '').trim().toUpperCase() === 'DELETE'
  } = options;

  if (!userEmail) {
    return { success: false, error: 'No user email found. Please log in again.' };
  }

  if (!confirm()) {
    return { success: false, cancelled: true };
  }

  try {
    // The account record survives unless it is explicitly being dropped, so it
    // doesn't count as leftover data.
    const preserved = dropAccount ? [] : ['stellar_users'];

    const before = countUserData(userEmail, { ignoreKeys: preserved });
    const { removedKeys, clearedContainers } = purgeUserData(userEmail, { dropAccount });

    // A wipe that leaves data behind is the bug this replaced, so verify it.
    const remaining = countUserData(userEmail, { ignoreKeys: preserved });
    if (remaining > 0) {
      console.warn(`clearAllUserData: ${remaining} storage entries survived the wipe`);
    }

    playSuccessSound();
    window.dispatchEvent(new Event('userDataUpdated'));

    return {
      success: true,
      removedCount: removedKeys.length + clearedContainers.length,
      before,
      remaining,
      removedKeys,
      clearedContainers
    };
  } catch (error) {
    console.error('Error clearing user data:', error);
    return { success: false, error: error.message };
  }
};

export default {
  exportUserData,
  importUserData,
  clearAllUserData,
  EXPORT_VERSION
};
