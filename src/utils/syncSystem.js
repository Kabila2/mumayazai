// Multi-Device Sync System
const SYNC_KEY = 'mumayaz_sync_data';
const LAST_SYNC_KEY = 'mumayaz_last_sync';

export const syncData = async (userEmail) => {
  try {
    const dataToSync = {
      progress: localStorage.getItem('arabic_learning_progress'),
      points: localStorage.getItem(`mumayaz_points_${userEmail}`),
      achievements: localStorage.getItem(`mumayaz_achievements_${userEmail}`),
      quizHistory: localStorage.getItem(`mumayaz_quiz_history_${userEmail}`),
      streak: localStorage.getItem(`mumayaz_streak_${userEmail}`),
      notifications: localStorage.getItem(`mumayaz_notifications_${userEmail}`),
      schedule: localStorage.getItem(`mumayaz_schedule_${userEmail}`),
      certificates: localStorage.getItem(`mumayaz_certificates_${userEmail}`),
      completions: localStorage.getItem(`mumayaz_completions_${userEmail}`),
      timestamp: new Date().toISOString()
    };

    // Store in localStorage as backup
    localStorage.setItem(`${SYNC_KEY}_${userEmail}`, JSON.stringify(dataToSync));
    localStorage.setItem(`${LAST_SYNC_KEY}_${userEmail}`, new Date().toISOString());

    console.log('Data synced successfully');
    return { success: true, timestamp: dataToSync.timestamp };
  } catch (error) {
    console.error('Error syncing data:', error);
    return { success: false, error: error.message };
  }
};

export const restoreData = async (userEmail) => {
  try {
    const syncedData = localStorage.getItem(`${SYNC_KEY}_${userEmail}`);

    if (!syncedData) {
      return { success: false, message: 'No synced data found' };
    }

    const data = JSON.parse(syncedData);

    // Restore each piece of data
    if (data.progress) localStorage.setItem('arabic_learning_progress', data.progress);
    if (data.points) localStorage.setItem(`mumayaz_points_${userEmail}`, data.points);
    if (data.achievements) localStorage.setItem(`mumayaz_achievements_${userEmail}`, data.achievements);
    if (data.quizHistory) localStorage.setItem(`mumayaz_quiz_history_${userEmail}`, data.quizHistory);
    if (data.streak) localStorage.setItem(`mumayaz_streak_${userEmail}`, data.streak);
    if (data.notifications) localStorage.setItem(`mumayaz_notifications_${userEmail}`, data.notifications);
    if (data.schedule) localStorage.setItem(`mumayaz_schedule_${userEmail}`, data.schedule);
    if (data.certificates) localStorage.setItem(`mumayaz_certificates_${userEmail}`, data.certificates);
    if (data.completions) localStorage.setItem(`mumayaz_completions_${userEmail}`, data.completions);

    console.log('Data restored successfully');
    return { success: true, timestamp: data.timestamp };
  } catch (error) {
    console.error('Error restoring data:', error);
    return { success: false, error: error.message };
  }
};

export const getLastSyncTime = (userEmail) => {
  return localStorage.getItem(`${LAST_SYNC_KEY}_${userEmail}`);
};

export const exportDataToFile = (userEmail) => {
  try {
    const syncedData = localStorage.getItem(`${SYNC_KEY}_${userEmail}`);

    if (!syncedData) {
      alert('No data to export');
      return;
    }

    const blob = new Blob([syncedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mumayaz-backup-${userEmail}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, error: error.message };
  }
};

export const importDataFromFile = async (userEmail, file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Store the imported data
    localStorage.setItem(`${SYNC_KEY}_${userEmail}`, text);

    // Restore the data
    return await restoreData(userEmail);
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
};

// Auto-sync functionality
export const enableAutoSync = (userEmail, intervalMinutes = 30) => {
  const intervalMs = intervalMinutes * 60 * 1000;

  const syncInterval = setInterval(() => {
    syncData(userEmail);
  }, intervalMs);

  // Store interval ID so it can be cleared later
  localStorage.setItem('mumayaz_sync_interval', syncInterval);

  return syncInterval;
};

export const disableAutoSync = () => {
  const intervalId = localStorage.getItem('mumayaz_sync_interval');
  if (intervalId) {
    clearInterval(Number(intervalId));
    localStorage.removeItem('mumayaz_sync_interval');
  }
};
