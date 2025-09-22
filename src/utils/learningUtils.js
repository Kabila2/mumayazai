// src/utils/learningUtils.js - Learning content and points system

const LEARNING_PROGRESS_KEY = "mumayaz_learning_progress";
const DAILY_TASKS_KEY = "mumayaz_daily_tasks";
const USER_POINTS_KEY = "mumayaz_user_points";

/**
 * Learning categories and content
 */
export const LEARNING_CATEGORIES = {
  math: {
    id: "math",
    nameEn: "Mathematics",
    nameAr: "الرياضيات",
    icon: "🧮",
    color: "#4CAF50",
    lessons: [
      {
        id: "basic_arithmetic",
        titleEn: "Basic Arithmetic",
        titleAr: "العمليات الحسابية الأساسية",
        description: "Learn addition, subtraction, multiplication and division",
        points: 50,
        difficulty: "beginner"
      },
      {
        id: "fractions",
        titleEn: "Fractions",
        titleAr: "الكسور",
        description: "Understanding fractions and decimal numbers",
        points: 75,
        difficulty: "intermediate"
      },
      {
        id: "geometry_basics",
        titleEn: "Basic Geometry",
        titleAr: "الهندسة الأساسية",
        description: "Shapes, angles, and basic geometric concepts",
        points: 100,
        difficulty: "intermediate"
      }
    ]
  },
  science: {
    id: "science",
    nameEn: "Science",
    nameAr: "العلوم",
    icon: "🔬",
    color: "#2196F3",
    lessons: [
      {
        id: "solar_system",
        titleEn: "Solar System",
        titleAr: "النظام الشمسي",
        description: "Explore planets, moons, and stars",
        points: 60,
        difficulty: "beginner"
      },
      {
        id: "water_cycle",
        titleEn: "Water Cycle",
        titleAr: "دورة الماء",
        description: "How water moves through our environment",
        points: 70,
        difficulty: "beginner"
      },
      {
        id: "human_body",
        titleEn: "Human Body",
        titleAr: "جسم الإنسان",
        description: "Learn about organs and body systems",
        points: 90,
        difficulty: "intermediate"
      }
    ]
  },
  language: {
    id: "language",
    nameEn: "Language Arts",
    nameAr: "فنون اللغة",
    icon: "📚",
    color: "#FF9800",
    lessons: [
      {
        id: "vocabulary_building",
        titleEn: "Vocabulary Building",
        titleAr: "بناء المفردات",
        description: "Expand your vocabulary with new words",
        points: 40,
        difficulty: "beginner"
      },
      {
        id: "reading_comprehension",
        titleEn: "Reading Comprehension",
        titleAr: "فهم المقروء",
        description: "Improve reading and understanding skills",
        points: 80,
        difficulty: "intermediate"
      },
      {
        id: "creative_writing",
        titleEn: "Creative Writing",
        titleAr: "الكتابة الإبداعية",
        description: "Express yourself through creative writing",
        points: 120,
        difficulty: "advanced"
      }
    ]
  },
  history: {
    id: "history",
    nameEn: "History",
    nameAr: "التاريخ",
    icon: "🏛️",
    color: "#795548",
    lessons: [
      {
        id: "ancient_civilizations",
        titleEn: "Ancient Civilizations",
        titleAr: "الحضارات القديمة",
        description: "Discover ancient Egypt, Greece, and Rome",
        points: 85,
        difficulty: "intermediate"
      },
      {
        id: "world_explorers",
        titleEn: "World Explorers",
        titleAr: "مستكشفو العالم",
        description: "Famous explorers and their discoveries",
        points: 75,
        difficulty: "beginner"
      }
    ]
  }
};

/**
 * Daily task types and configurations
 */
export const DAILY_TASK_TYPES = {
  lesson_complete: {
    id: "lesson_complete",
    nameEn: "Complete a Lesson",
    nameAr: "أكمل درساً",
    description: "Finish any learning lesson",
    points: 100,
    icon: "📖",
    maxDaily: 3
  },
  chat_messages: {
    id: "chat_messages",
    nameEn: "Send Messages",
    nameAr: "أرسل رسائل",
    description: "Send 10 messages in chat",
    points: 50,
    icon: "💬",
    target: 10,
    maxDaily: 1
  },
  daily_login: {
    id: "daily_login",
    nameEn: "Daily Login",
    nameAr: "تسجيل دخول يومي",
    description: "Login to the app today",
    points: 25,
    icon: "🌅",
    maxDaily: 1
  },
  time_spent: {
    id: "time_spent",
    nameEn: "Study Time",
    nameAr: "وقت الدراسة",
    description: "Spend 30 minutes learning",
    points: 75,
    icon: "⏰",
    target: 30,
    maxDaily: 1
  },
  streak_maintain: {
    id: "streak_maintain",
    nameEn: "Maintain Streak",
    nameAr: "حافظ على التسلسل",
    description: "Login for 3 consecutive days",
    points: 150,
    icon: "🔥",
    target: 3,
    maxDaily: 1
  }
};

/**
 * Get current date string
 */
const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Initialize user points if not exists
 */
export const initializeUserPoints = (userEmail) => {
  try {
    const allPoints = JSON.parse(localStorage.getItem(USER_POINTS_KEY)) || {};

    if (!allPoints[userEmail.toLowerCase()]) {
      allPoints[userEmail.toLowerCase()] = {
        totalPoints: 0,
        dailyPoints: 0,
        weeklyPoints: 0,
        lastPointsReset: getCurrentDateString(),
        pointsHistory: []
      };
      localStorage.setItem(USER_POINTS_KEY, JSON.stringify(allPoints));
    }

    return { success: true };
  } catch (error) {
    console.error("Error initializing user points:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Add points to user
 */
export const addUserPoints = (userEmail, points, source = "general") => {
  try {
    const allPoints = JSON.parse(localStorage.getItem(USER_POINTS_KEY)) || {};
    const userKey = userEmail.toLowerCase();

    if (!allPoints[userKey]) {
      initializeUserPoints(userEmail);
    }

    const userPoints = allPoints[userKey];
    const today = getCurrentDateString();

    // Reset daily/weekly points if needed
    const lastReset = new Date(userPoints.lastPointsReset);
    const currentDate = new Date(today);
    const daysDiff = Math.floor((currentDate - lastReset) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 1) {
      userPoints.dailyPoints = 0;
      userPoints.lastPointsReset = today;
    }

    if (daysDiff >= 7) {
      userPoints.weeklyPoints = 0;
    }

    // Add points
    userPoints.totalPoints += points;
    userPoints.dailyPoints += points;
    userPoints.weeklyPoints += points;

    // Record in history
    userPoints.pointsHistory.unshift({
      date: new Date().toISOString(),
      points,
      source,
      total: userPoints.totalPoints
    });

    // Keep only last 100 entries
    if (userPoints.pointsHistory.length > 100) {
      userPoints.pointsHistory = userPoints.pointsHistory.slice(0, 100);
    }

    allPoints[userKey] = userPoints;
    localStorage.setItem(USER_POINTS_KEY, JSON.stringify(allPoints));

    return {
      success: true,
      newTotal: userPoints.totalPoints,
      dailyTotal: userPoints.dailyPoints
    };
  } catch (error) {
    console.error("Error adding user points:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user points
 */
export const getUserPoints = (userEmail) => {
  try {
    const allPoints = JSON.parse(localStorage.getItem(USER_POINTS_KEY)) || {};
    const userPoints = allPoints[userEmail.toLowerCase()];

    if (!userPoints) {
      initializeUserPoints(userEmail);
      return getUserPoints(userEmail);
    }

    return userPoints;
  } catch (error) {
    console.error("Error getting user points:", error);
    return null;
  }
};

/**
 * Get daily tasks for user
 */
export const getDailyTasks = (userEmail) => {
  try {
    const today = getCurrentDateString();
    const allTasks = JSON.parse(localStorage.getItem(DAILY_TASKS_KEY)) || {};
    const userKey = userEmail.toLowerCase();

    // Initialize if doesn't exist or if new day
    if (!allTasks[userKey] || allTasks[userKey].date !== today) {
      allTasks[userKey] = {
        date: today,
        tasks: {},
        completedTasks: []
      };

      // Generate daily tasks
      Object.values(DAILY_TASK_TYPES).forEach(taskType => {
        allTasks[userKey].tasks[taskType.id] = {
          ...taskType,
          progress: 0,
          completed: false,
          completedAt: null
        };
      });

      localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(allTasks));
    }

    return allTasks[userKey];
  } catch (error) {
    console.error("Error getting daily tasks:", error);
    return null;
  }
};

/**
 * Update task progress
 */
export const updateTaskProgress = (userEmail, taskId, progress = 1) => {
  try {
    const allTasks = JSON.parse(localStorage.getItem(DAILY_TASKS_KEY)) || {};
    const userKey = userEmail.toLowerCase();
    const userTasks = getDailyTasks(userEmail);

    if (!userTasks || !userTasks.tasks[taskId]) {
      return { success: false, error: "Task not found" };
    }

    const task = userTasks.tasks[taskId];

    if (task.completed) {
      return { success: false, error: "Task already completed" };
    }

    // Update progress
    task.progress += progress;

    // Check if task is completed
    const target = task.target || 1;
    if (task.progress >= target) {
      task.completed = true;
      task.completedAt = new Date().toISOString();
      userTasks.completedTasks.push(taskId);

      // Add points
      const pointsResult = addUserPoints(userEmail, task.points, `daily_task_${taskId}`);

      allTasks[userKey] = userTasks;
      localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(allTasks));

      return {
        success: true,
        completed: true,
        pointsEarned: task.points,
        newTotal: pointsResult.newTotal
      };
    }

    allTasks[userKey] = userTasks;
    localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(allTasks));

    return { success: true, completed: false, progress: task.progress };
  } catch (error) {
    console.error("Error updating task progress:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Complete a lesson
 */
export const completeLesson = (userEmail, categoryId, lessonId) => {
  try {
    const progress = JSON.parse(localStorage.getItem(LEARNING_PROGRESS_KEY)) || {};
    const userKey = userEmail.toLowerCase();

    if (!progress[userKey]) {
      progress[userKey] = {
        completedLessons: [],
        categoryProgress: {}
      };
    }

    const lessonKey = `${categoryId}_${lessonId}`;

    if (progress[userKey].completedLessons.includes(lessonKey)) {
      return { success: false, error: "Lesson already completed" };
    }

    // Find the lesson
    const category = LEARNING_CATEGORIES[categoryId];
    const lesson = category?.lessons.find(l => l.id === lessonId);

    if (!lesson) {
      return { success: false, error: "Lesson not found" };
    }

    // Mark as completed
    progress[userKey].completedLessons.push(lessonKey);

    // Update category progress
    if (!progress[userKey].categoryProgress[categoryId]) {
      progress[userKey].categoryProgress[categoryId] = 0;
    }
    progress[userKey].categoryProgress[categoryId]++;

    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(progress));

    // Add points for lesson completion
    const pointsResult = addUserPoints(userEmail, lesson.points, `lesson_${lessonKey}`);

    // Update daily task progress
    updateTaskProgress(userEmail, "lesson_complete", 1);

    return {
      success: true,
      pointsEarned: lesson.points,
      newTotal: pointsResult.newTotal
    };
  } catch (error) {
    console.error("Error completing lesson:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get learning progress for user
 */
export const getLearningProgress = (userEmail) => {
  try {
    const progress = JSON.parse(localStorage.getItem(LEARNING_PROGRESS_KEY)) || {};
    const userKey = userEmail.toLowerCase();

    return progress[userKey] || {
      completedLessons: [],
      categoryProgress: {}
    };
  } catch (error) {
    console.error("Error getting learning progress:", error);
    return {
      completedLessons: [],
      categoryProgress: {}
    };
  }
};

/**
 * Get points leaderboard
 */
export const getPointsLeaderboard = () => {
  try {
    const allPoints = JSON.parse(localStorage.getItem(USER_POINTS_KEY)) || {};
    const users = Object.entries(allPoints).map(([email, data]) => ({
      email,
      ...data
    }));

    const totalPointsLeaderboard = [...users]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    const dailyPointsLeaderboard = [...users]
      .sort((a, b) => b.dailyPoints - a.dailyPoints)
      .slice(0, 10);

    const weeklyPointsLeaderboard = [...users]
      .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
      .slice(0, 10);

    return {
      totalPoints: totalPointsLeaderboard,
      dailyPoints: dailyPointsLeaderboard,
      weeklyPoints: weeklyPointsLeaderboard
    };
  } catch (error) {
    console.error("Error getting points leaderboard:", error);
    return {
      totalPoints: [],
      dailyPoints: [],
      weeklyPoints: []
    };
  }
};