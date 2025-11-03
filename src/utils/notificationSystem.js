// Smart Notification System
export const createNotification = (userEmail, notification) => {
  try {
    const notificationsKey = `mumayaz_notifications_${userEmail}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
    
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    notifications.unshift(newNotification);
    localStorage.setItem(notificationsKey, JSON.stringify(notifications.slice(0, 50))); // Keep last 50
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png'
      });
    }
    
    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getNotifications = (userEmail) => {
  try {
    const notificationsKey = `mumayaz_notifications_${userEmail}`;
    return JSON.parse(localStorage.getItem(notificationsKey) || '[]');
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const markAsRead = (userEmail, notificationId) => {
  try {
    const notificationsKey = `mumayaz_notifications_${userEmail}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
    
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    
    localStorage.setItem(notificationsKey, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const getUnreadCount = (userEmail) => {
  const notifications = getNotifications(userEmail);
  return notifications.filter(n => !n.read).length;
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};
