// src/utils/parentTrackingUtils.js - Parent Mode Tracking and Management Utilities

const PARENT_DATA_KEY = "mumayaz_parent_data";
const CHILD_ACTIVITY_KEY = "mumayaz_child_activity";
const PARENT_CHILD_LINKS_KEY = "mumayaz_parent_child_links";

/**
 * Generate a unique ID for tracking
 */
const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get current date string in YYYY-MM-DD format
 */
const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Initialize parent account
 */
export const initializeParentAccount = (parentEmail, parentName) => {
  try {
    const parentData = {
      id: generateId(),
      email: parentEmail.toLowerCase(),
      name: parentName,
      createdAt: new Date().toISOString(),
      children: [],
      settings: {
        allowedHours: { start: "09:00", end: "21:00" },
        contentFilter: "moderate",
        notifications: true,
        weeklyReports: true
      }
    };

    localStorage.setItem(PARENT_DATA_KEY, JSON.stringify(parentData));
    return { success: true, parentId: parentData.id };
  } catch (error) {
    console.error("Error initializing parent account:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get parent data
 */
export const getParentData = () => {
  try {
    const stored = localStorage.getItem(PARENT_DATA_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error loading parent data:", error);
    return null;
  }
};

/**
 * Check if a user exists in the system
 */
const getUserFromSystem = (email) => {
  try {
    const users = JSON.parse(localStorage.getItem("mumayaz_users") || "{}");
    return users[email.toLowerCase()] || null;
  } catch (error) {
    console.error("Error getting user from system:", error);
    return null;
  }
};

/**
 * Link child to parent account
 */
export const linkChildToParent = (childEmail, childName, parentEmail) => {
  try {
    const parentData = getParentData();
    if (!parentData) {
      return { success: false, error: "Parent account not found" };
    }

    // Check if parent email matches
    if (parentData.email.toLowerCase() !== parentEmail.toLowerCase()) {
      return { success: false, error: "Parent email does not match" };
    }

    // VALIDATION: Check if child is actually registered in the system
    const childUser = getUserFromSystem(childEmail);
    if (!childUser) {
      return {
        success: false,
        error: "Child not found. Please ensure the child has registered with this email first."
      };
    }

    // VALIDATION: Check if the user is a student (not a parent or teacher)
    if (childUser.role !== "student") {
      return {
        success: false,
        error: "This email is not registered as a student account. Only students can be added to parent dashboard."
      };
    }

    // OPTIONAL: Check if the child has set a parent's email during registration
    // If they did, make sure it matches the current parent
    if (childUser.parentEmail && childUser.parentEmail.trim() !== "") {
      if (childUser.parentEmail.toLowerCase() !== parentEmail.toLowerCase()) {
        return {
          success: false,
          error: "This student is already linked to a different parent account. Please ask them to update their parent email in their profile."
        };
      }
    }
    // If no parent email was set during registration, any parent can add them

    // Check if child already exists in parent's dashboard
    const existingChild = parentData.children.find(
      child => child.email.toLowerCase() === childEmail.toLowerCase()
    );

    if (existingChild) {
      return { success: false, error: "Child already linked to this account" };
    }

    // Use the actual name from the registered user account
    const actualChildName = childUser.name || childName;

    // Add child to parent's account
    const childData = {
      id: generateId(),
      email: childEmail.toLowerCase(),
      name: actualChildName,
      linkedAt: new Date().toISOString(),
      status: 'active',
      totalTimeSpent: 0,
      totalSessions: 0,
      lastActivity: null,
      progressData: {
        messagesExchanged: 0,
        chatsCompleted: 0,
        topicsExplored: [],
        skillsImproved: [],
        achievements: []
      }
    };

    parentData.children.push(childData);
    localStorage.setItem(PARENT_DATA_KEY, JSON.stringify(parentData));

    // Create parent-child link record
    const links = getParentChildLinks();
    links[childEmail.toLowerCase()] = {
      parentEmail: parentEmail.toLowerCase(),
      childId: childData.id,
      linkedAt: new Date().toISOString()
    };
    localStorage.setItem(PARENT_CHILD_LINKS_KEY, JSON.stringify(links));

    // Update child's user record to set parent email if not already set
    if (!childUser.parentEmail || childUser.parentEmail.trim() === "") {
      const users = JSON.parse(localStorage.getItem("mumayaz_users") || "{}");
      if (users[childEmail.toLowerCase()]) {
        users[childEmail.toLowerCase()].parentEmail = parentEmail.toLowerCase();
        localStorage.setItem("mumayaz_users", JSON.stringify(users));
      }
    }

    return { success: true, childId: childData.id };
  } catch (error) {
    console.error("Error linking child to parent:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get parent-child links
 */
export const getParentChildLinks = () => {
  try {
    const stored = localStorage.getItem(PARENT_CHILD_LINKS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error loading parent-child links:", error);
    return {};
  }
};

/**
 * Check if child is linked to a parent
 */
export const isChildLinkedToParent = (childEmail) => {
  try {
    const links = getParentChildLinks();
    return links[childEmail.toLowerCase()] || null;
  } catch (error) {
    console.error("Error checking child link:", error);
    return null;
  }
};

/**
 * Start tracking child session
 */
export const startChildSession = (childEmail) => {
  try {
    const sessionData = {
      childEmail: childEmail.toLowerCase(),
      sessionId: generateId(),
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      messagesCount: 0,
      activitiesPerformed: [],
      topicsDiscussed: []
    };

    // Store active session
    localStorage.setItem(`child_session_${childEmail.toLowerCase()}`, JSON.stringify(sessionData));

    return { success: true, sessionId: sessionData.sessionId };
  } catch (error) {
    console.error("Error starting child session:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update child session activity
 */
export const updateChildSession = (childEmail, activity) => {
  try {
    const sessionKey = `child_session_${childEmail.toLowerCase()}`;
    const stored = localStorage.getItem(sessionKey);

    if (!stored) {
      return { success: false, error: "No active session found" };
    }

    const sessionData = JSON.parse(stored);

    // Update activity based on type
    switch (activity.type) {
      case 'message_sent':
        sessionData.messagesCount++;
        break;
      case 'chat_completed':
        sessionData.activitiesPerformed.push({
          type: 'chat_completed',
          timestamp: new Date().toISOString()
        });
        break;
      case 'topic_explored':
        if (!sessionData.topicsDiscussed.includes(activity.topic)) {
          sessionData.topicsDiscussed.push(activity.topic);
        }
        break;
      default:
        sessionData.activitiesPerformed.push({
          ...activity,
          timestamp: new Date().toISOString()
        });
    }

    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
    return { success: true };
  } catch (error) {
    console.error("Error updating child session:", error);
    return { success: false, error: error.message };
  }
};

/**
 * End child session and save to parent dashboard
 */
export const endChildSession = (childEmail) => {
  try {
    const sessionKey = `child_session_${childEmail.toLowerCase()}`;
    const stored = localStorage.getItem(sessionKey);

    if (!stored) {
      return { success: false, error: "No active session found" };
    }

    const sessionData = JSON.parse(stored);
    const endTime = new Date();
    const startTime = new Date(sessionData.startTime);
    const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes

    sessionData.endTime = endTime.toISOString();
    sessionData.duration = duration;

    // Save session to child activity history
    const activityHistory = getChildActivityHistory();
    const dateKey = getCurrentDateString();

    if (!activityHistory[childEmail.toLowerCase()]) {
      activityHistory[childEmail.toLowerCase()] = {};
    }

    if (!activityHistory[childEmail.toLowerCase()][dateKey]) {
      activityHistory[childEmail.toLowerCase()][dateKey] = [];
    }

    activityHistory[childEmail.toLowerCase()][dateKey].push(sessionData);
    localStorage.setItem(CHILD_ACTIVITY_KEY, JSON.stringify(activityHistory));

    // Update parent data with child progress
    updateChildProgressInParentData(childEmail, sessionData);

    // Clean up active session
    localStorage.removeItem(sessionKey);

    return { success: true, sessionData };
  } catch (error) {
    console.error("Error ending child session:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get child activity history
 */
export const getChildActivityHistory = () => {
  try {
    const stored = localStorage.getItem(CHILD_ACTIVITY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error loading child activity history:", error);
    return {};
  }
};

/**
 * Update child progress in parent data
 */
const updateChildProgressInParentData = (childEmail, sessionData) => {
  try {
    const parentData = getParentData();
    if (!parentData) return;

    const childIndex = parentData.children.findIndex(
      child => child.email.toLowerCase() === childEmail.toLowerCase()
    );

    if (childIndex === -1) return;

    const child = parentData.children[childIndex];

    // Update totals
    child.totalTimeSpent += sessionData.duration;
    child.totalSessions++;
    child.lastActivity = sessionData.endTime;

    // Update progress data
    child.progressData.messagesExchanged += sessionData.messagesCount;
    child.progressData.chatsCompleted++;

    // Add new topics
    sessionData.topicsDiscussed.forEach(topic => {
      if (!child.progressData.topicsExplored.includes(topic)) {
        child.progressData.topicsExplored.push(topic);
      }
    });

    // Check for achievements
    checkAndAddAchievements(child, sessionData);

    parentData.children[childIndex] = child;
    localStorage.setItem(PARENT_DATA_KEY, JSON.stringify(parentData));
  } catch (error) {
    console.error("Error updating child progress:", error);
  }
};

/**
 * Check and add achievements for child
 */
const checkAndAddAchievements = (child, sessionData) => {
  const achievements = [];

  // First chat achievement
  if (child.totalSessions === 1) {
    achievements.push({
      id: 'first_chat',
      name: 'First Conversation',
      description: 'Completed first chat session',
      earnedAt: sessionData.endTime,
      icon: '🎉'
    });
  }

  // Time-based achievements
  if (child.totalTimeSpent >= 60 && !child.progressData.achievements.find(a => a.id === 'hour_explorer')) {
    achievements.push({
      id: 'hour_explorer',
      name: 'Hour Explorer',
      description: 'Spent over 1 hour learning',
      earnedAt: sessionData.endTime,
      icon: '⏰'
    });
  }

  // Message-based achievements
  if (child.progressData.messagesExchanged >= 50 && !child.progressData.achievements.find(a => a.id === 'chatty_learner')) {
    achievements.push({
      id: 'chatty_learner',
      name: 'Chatty Learner',
      description: 'Exchanged 50 messages',
      earnedAt: sessionData.endTime,
      icon: '💬'
    });
  }

  // Topic exploration achievements
  if (child.progressData.topicsExplored.length >= 5 && !child.progressData.achievements.find(a => a.id === 'curious_mind')) {
    achievements.push({
      id: 'curious_mind',
      name: 'Curious Mind',
      description: 'Explored 5 different topics',
      earnedAt: sessionData.endTime,
      icon: '🧠'
    });
  }

  // Add new achievements
  child.progressData.achievements.push(...achievements);
};

/**
 * Get child statistics for parent dashboard
 */
export const getChildStatistics = (childEmail, days = 7) => {
  try {
    const activityHistory = getChildActivityHistory();
    const childHistory = activityHistory[childEmail.toLowerCase()] || {};

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let totalTime = 0;
    let totalSessions = 0;
    let totalMessages = 0;
    const dailyActivity = [];
    const topicsExplored = new Set();

    // Process each day in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayData = childHistory[dateKey] || [];

      let dayTime = 0;
      let dayMessages = 0;
      let daySessions = dayData.length;

      dayData.forEach(session => {
        dayTime += session.duration || 0;
        dayMessages += session.messagesCount || 0;
        session.topicsDiscussed?.forEach(topic => topicsExplored.add(topic));
      });

      totalTime += dayTime;
      totalMessages += dayMessages;
      totalSessions += daySessions;

      dailyActivity.push({
        date: dateKey,
        timeSpent: dayTime,
        sessions: daySessions,
        messages: dayMessages
      });
    }

    return {
      totalTimeSpent: totalTime,
      totalSessions,
      totalMessages,
      topicsExplored: Array.from(topicsExplored),
      dailyActivity,
      averageSessionTime: totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0,
      averageMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0
    };
  } catch (error) {
    console.error("Error getting child statistics:", error);
    return null;
  }
};

/**
 * Update parent settings
 */
export const updateParentSettings = (settings) => {
  try {
    const parentData = getParentData();
    if (!parentData) {
      return { success: false, error: "Parent account not found" };
    }

    parentData.settings = { ...parentData.settings, ...settings };
    localStorage.setItem(PARENT_DATA_KEY, JSON.stringify(parentData));

    return { success: true };
  } catch (error) {
    console.error("Error updating parent settings:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove child from parent account
 */
export const removeChildFromParent = (childEmail) => {
  try {
    const parentData = getParentData();
    if (!parentData) {
      return { success: false, error: "Parent account not found" };
    }

    // Remove child from parent data
    parentData.children = parentData.children.filter(
      child => child.email.toLowerCase() !== childEmail.toLowerCase()
    );
    localStorage.setItem(PARENT_DATA_KEY, JSON.stringify(parentData));

    // Remove parent-child link
    const links = getParentChildLinks();
    delete links[childEmail.toLowerCase()];
    localStorage.setItem(PARENT_CHILD_LINKS_KEY, JSON.stringify(links));

    // Remove child activity history
    const activityHistory = getChildActivityHistory();
    delete activityHistory[childEmail.toLowerCase()];
    localStorage.setItem(CHILD_ACTIVITY_KEY, JSON.stringify(activityHistory));

    return { success: true };
  } catch (error) {
    console.error("Error removing child from parent:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if current time is within allowed hours
 */
export const isWithinAllowedHours = (childEmail) => {
  try {
    const parentData = getParentData();
    if (!parentData) return true; // Allow if no parent restrictions

    const child = parentData.children.find(
      child => child.email.toLowerCase() === childEmail.toLowerCase()
    );

    if (!child) return true;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const { start, end } = parentData.settings.allowedHours;

    return currentTime >= start && currentTime <= end;
  } catch (error) {
    console.error("Error checking allowed hours:", error);
    return true;
  }
};

