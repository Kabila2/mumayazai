// src/utils/teacherUtils.js - Teacher Class Management and Student Tracking Utilities

const TEACHER_DATA_KEY = "mumayaz_teacher_data";
const CLASSES_KEY = "mumayaz_classes";
const STUDENT_ENROLLMENTS_KEY = "mumayaz_student_enrollments";
const TEACHER_POINTS_KEY = "mumayaz_teacher_points";

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
 * Initialize teacher account
 */
export const initializeTeacherAccount = (teacherEmail, teacherName) => {
  try {
    const teacherData = {
      id: generateId(),
      email: teacherEmail.toLowerCase(),
      name: teacherName,
      createdAt: new Date().toISOString(),
      classes: [],
      settings: {
        defaultPointValues: {
          excellent: 5,
          good: 3,
          participation: 2,
          homework: 4,
          helpingOthers: 3,
          lateWork: -2,
          disruptive: -3,
          incomplete: -1
        },
        notifications: true,
        theme: 'default'
      }
    };

    localStorage.setItem(TEACHER_DATA_KEY, JSON.stringify(teacherData));
    return { success: true, teacherId: teacherData.id };
  } catch (error) {
    console.error("Error initializing teacher account:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get teacher data
 */
export const getTeacherData = () => {
  try {
    const stored = localStorage.getItem(TEACHER_DATA_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error loading teacher data:", error);
    return null;
  }
};

/**
 * Get all classes
 */
export const getAllClasses = () => {
  try {
    const stored = localStorage.getItem(CLASSES_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      // Migrate old array format to object format
      const obj = {};
      parsed.forEach(c => { if (c.id) obj[c.id] = c; });
      localStorage.setItem(CLASSES_KEY, JSON.stringify(obj));
      return obj;
    }
    return parsed;
  } catch (error) {
    console.error("Error loading classes:", error);
    return {};
  }
};

/**
 * Create a new class
 */
export const createClass = (teacherEmail, className, subject, gradeLevel) => {
  try {
    const teacherData = getTeacherData();
    if (!teacherData || teacherData.email.toLowerCase() !== teacherEmail.toLowerCase()) {
      return { success: false, error: "Teacher account not found" };
    }

    const classes = getAllClasses();
    const classId = generateId();

    const newClass = {
      id: classId,
      name: className,
      subject: subject,
      gradeLevel: gradeLevel,
      teacherEmail: teacherEmail.toLowerCase(),
      teacherName: teacherData.name,
      createdAt: new Date().toISOString(),
      students: [],
      totalStudents: 0,
      isActive: true
    };

    classes[classId] = newClass;
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));

    // Add class to teacher's classes
    teacherData.classes.push(classId);
    localStorage.setItem(TEACHER_DATA_KEY, JSON.stringify(teacherData));

    return { success: true, classId, class: newClass };
  } catch (error) {
    console.error("Error creating class:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get teacher's classes
 */
export const getTeacherClasses = (teacherEmail) => {
  try {
    const allClasses = getAllClasses();
    return Object.values(allClasses).filter(
      cls => cls.teacherEmail.toLowerCase() === teacherEmail.toLowerCase()
    );
  } catch (error) {
    console.error("Error getting teacher classes:", error);
    return [];
  }
};

/**
 * Get a specific class
 */
export const getClass = (classId) => {
  try {
    const classes = getAllClasses();
    return classes[classId] || null;
  } catch (error) {
    console.error("Error getting class:", error);
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
 * Enroll student in a class
 */
export const enrollStudent = (classId, studentEmail) => {
  try {
    // Validate student exists
    const student = getUserFromSystem(studentEmail);
    if (!student) {
      return {
        success: false,
        error: "Student not found. Please ensure the student has registered with this email first."
      };
    }

    if (student.role !== "student") {
      return {
        success: false,
        error: "This email is not registered as a student account."
      };
    }

    const classes = getAllClasses();
    const classData = classes[classId];

    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    // Check if student is already enrolled
    if (classData.students.some(s => s.email.toLowerCase() === studentEmail.toLowerCase())) {
      return { success: false, error: "Student is already enrolled in this class" };
    }

    // Add student to class
    const studentData = {
      email: studentEmail.toLowerCase(),
      name: student.name,
      enrolledAt: new Date().toISOString(),
      totalPoints: 0,
      pointsHistory: [],
      achievements: []
    };

    classData.students.push(studentData);
    classData.totalStudents = classData.students.length;
    classes[classId] = classData;
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));

    // Track student enrollments
    const enrollments = getStudentEnrollments();
    if (!enrollments[studentEmail.toLowerCase()]) {
      enrollments[studentEmail.toLowerCase()] = [];
    }
    enrollments[studentEmail.toLowerCase()].push({
      classId,
      className: classData.name,
      subject: classData.subject,
      teacherName: classData.teacherName,
      enrolledAt: new Date().toISOString()
    });
    localStorage.setItem(STUDENT_ENROLLMENTS_KEY, JSON.stringify(enrollments));

    return { success: true, student: studentData };
  } catch (error) {
    console.error("Error enrolling student:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get student enrollments
 */
export const getStudentEnrollments = () => {
  try {
    const stored = localStorage.getItem(STUDENT_ENROLLMENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error loading student enrollments:", error);
    return {};
  }
};

/**
 * Remove student from class
 */
export const removeStudentFromClass = (classId, studentEmail) => {
  try {
    const classes = getAllClasses();
    const classData = classes[classId];

    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    classData.students = classData.students.filter(
      s => s.email.toLowerCase() !== studentEmail.toLowerCase()
    );
    classData.totalStudents = classData.students.length;
    classes[classId] = classData;
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));

    // Update enrollments
    const enrollments = getStudentEnrollments();
    if (enrollments[studentEmail.toLowerCase()]) {
      enrollments[studentEmail.toLowerCase()] = enrollments[studentEmail.toLowerCase()].filter(
        e => e.classId !== classId
      );
      localStorage.setItem(STUDENT_ENROLLMENTS_KEY, JSON.stringify(enrollments));
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing student from class:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Award points to a student
 */
export const awardPoints = (classId, studentEmail, points, reason, category = 'custom') => {
  try {
    const classes = getAllClasses();
    const classData = classes[classId];

    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    const studentIndex = classData.students.findIndex(
      s => s.email.toLowerCase() === studentEmail.toLowerCase()
    );

    if (studentIndex === -1) {
      return { success: false, error: "Student not found in this class" };
    }

    const student = classData.students[studentIndex];

    // Add points to student
    student.totalPoints = (student.totalPoints || 0) + points;

    // Record in history
    const pointRecord = {
      id: generateId(),
      points: points,
      reason: reason,
      category: category,
      date: new Date().toISOString(),
      dateString: getCurrentDateString()
    };

    if (!student.pointsHistory) {
      student.pointsHistory = [];
    }
    student.pointsHistory.push(pointRecord);

    // Check for achievements
    checkAndAwardAchievements(student, classData);

    // Update class data
    classData.students[studentIndex] = student;
    classes[classId] = classData;
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));

    // Also update teacher points tracking for analytics
    updateTeacherPointsTracking(classId, studentEmail, points, reason, category);

    return { success: true, newTotal: student.totalPoints, pointRecord };
  } catch (error) {
    console.error("Error awarding points:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update teacher points tracking for analytics
 */
const updateTeacherPointsTracking = (classId, studentEmail, points, reason, category) => {
  try {
    let tracking = JSON.parse(localStorage.getItem(TEACHER_POINTS_KEY) || "{}");

    if (!tracking[classId]) {
      tracking[classId] = {
        totalPointsAwarded: 0,
        totalPointsDeducted: 0,
        pointsByCategory: {},
        pointsByDate: {}
      };
    }

    if (points > 0) {
      tracking[classId].totalPointsAwarded += points;
    } else {
      tracking[classId].totalPointsDeducted += Math.abs(points);
    }

    // Track by category
    if (!tracking[classId].pointsByCategory[category]) {
      tracking[classId].pointsByCategory[category] = 0;
    }
    tracking[classId].pointsByCategory[category] += points;

    // Track by date
    const dateString = getCurrentDateString();
    if (!tracking[classId].pointsByDate[dateString]) {
      tracking[classId].pointsByDate[dateString] = 0;
    }
    tracking[classId].pointsByDate[dateString] += points;

    localStorage.setItem(TEACHER_POINTS_KEY, JSON.stringify(tracking));
  } catch (error) {
    console.error("Error updating teacher points tracking:", error);
  }
};

/**
 * Check and award achievements to students
 */
const checkAndAwardAchievements = (student, classData) => {
  if (!student.achievements) {
    student.achievements = [];
  }

  const achievements = [];
  const totalPoints = student.totalPoints || 0;

  // First points achievement
  if (totalPoints >= 1 && !student.achievements.find(a => a.id === 'first_points')) {
    achievements.push({
      id: 'first_points',
      name: 'First Points',
      description: 'Earned your first points!',
      icon: '🌟',
      earnedAt: new Date().toISOString()
    });
  }

  // Point milestones
  const milestones = [
    { points: 50, id: 'points_50', name: '50 Points Star', icon: '⭐' },
    { points: 100, id: 'points_100', name: 'Century Club', icon: '💯' },
    { points: 250, id: 'points_250', name: 'Quarter Master', icon: '🏆' },
    { points: 500, id: 'points_500', name: 'Half Thousand Hero', icon: '🎖️' },
    { points: 1000, id: 'points_1000', name: 'Thousand Points Legend', icon: '👑' }
  ];

  milestones.forEach(milestone => {
    if (totalPoints >= milestone.points && !student.achievements.find(a => a.id === milestone.id)) {
      achievements.push({
        id: milestone.id,
        name: milestone.name,
        description: `Reached ${milestone.points} points!`,
        icon: milestone.icon,
        earnedAt: new Date().toISOString()
      });
    }
  });

  // Consecutive positive points (no deductions in last 10 records)
  if (student.pointsHistory && student.pointsHistory.length >= 10) {
    const last10 = student.pointsHistory.slice(-10);
    if (last10.every(p => p.points > 0) && !student.achievements.find(a => a.id === 'positive_streak')) {
      achievements.push({
        id: 'positive_streak',
        name: 'Perfect Streak',
        description: '10 positive point awards in a row!',
        icon: '🔥',
        earnedAt: new Date().toISOString()
      });
    }
  }

  student.achievements.push(...achievements);
};

/**
 * Get class leaderboard
 */
export const getClassLeaderboard = (classId) => {
  try {
    const classData = getClass(classId);
    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    const leaderboard = classData.students
      .map(student => ({
        email: student.email,
        name: student.name,
        totalPoints: student.totalPoints || 0,
        achievements: student.achievements?.length || 0,
        recentPoints: student.pointsHistory?.slice(-5) || []
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    return { success: true, leaderboard };
  } catch (error) {
    console.error("Error getting class leaderboard:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get student details in a class
 */
export const getStudentInClass = (classId, studentEmail) => {
  try {
    const classData = getClass(classId);
    if (!classData) {
      return null;
    }

    return classData.students.find(
      s => s.email.toLowerCase() === studentEmail.toLowerCase()
    ) || null;
  } catch (error) {
    console.error("Error getting student in class:", error);
    return null;
  }
};

/**
 * Get class statistics
 */
export const getClassStatistics = (classId) => {
  try {
    const classData = getClass(classId);
    if (!classData) {
      return null;
    }

    const tracking = JSON.parse(localStorage.getItem(TEACHER_POINTS_KEY) || "{}");
    const classTracking = tracking[classId] || {
      totalPointsAwarded: 0,
      totalPointsDeducted: 0,
      pointsByCategory: {},
      pointsByDate: {}
    };

    const stats = {
      totalStudents: classData.totalStudents || 0,
      totalPointsAwarded: classTracking.totalPointsAwarded || 0,
      totalPointsDeducted: classTracking.totalPointsDeducted || 0,
      averagePoints: classData.students.length > 0
        ? Math.round(
            classData.students.reduce((sum, s) => sum + (s.totalPoints || 0), 0) /
            classData.students.length
          )
        : 0,
      topStudent: classData.students.length > 0
        ? classData.students.reduce((top, student) =>
            (student.totalPoints || 0) > (top.totalPoints || 0) ? student : top
          )
        : null,
      pointsByCategory: classTracking.pointsByCategory || {},
      recentActivity: Object.entries(classTracking.pointsByDate || {})
        .slice(-7)
        .map(([date, points]) => ({ date, points }))
    };

    return stats;
  } catch (error) {
    console.error("Error getting class statistics:", error);
    return null;
  }
};

/**
 * Delete a class
 */
export const deleteClass = (classId, teacherEmail) => {
  try {
    const classes = getAllClasses();
    const classData = classes[classId];

    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    if (classData.teacherEmail.toLowerCase() !== teacherEmail.toLowerCase()) {
      return { success: false, error: "You don't have permission to delete this class" };
    }

    // Remove class from all enrolled students
    const enrollments = getStudentEnrollments();
    classData.students.forEach(student => {
      if (enrollments[student.email]) {
        enrollments[student.email] = enrollments[student.email].filter(
          e => e.classId !== classId
        );
      }
    });
    localStorage.setItem(STUDENT_ENROLLMENTS_KEY, JSON.stringify(enrollments));

    // Remove class
    delete classes[classId];
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));

    // Remove from teacher data
    const teacherData = getTeacherData();
    if (teacherData) {
      teacherData.classes = teacherData.classes.filter(id => id !== classId);
      localStorage.setItem(TEACHER_DATA_KEY, JSON.stringify(teacherData));
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting class:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update teacher settings
 */
export const updateTeacherSettings = (settings) => {
  try {
    const teacherData = getTeacherData();
    if (!teacherData) {
      return { success: false, error: "Teacher account not found" };
    }

    teacherData.settings = { ...teacherData.settings, ...settings };
    localStorage.setItem(TEACHER_DATA_KEY, JSON.stringify(teacherData));

    return { success: true };
  } catch (error) {
    console.error("Error updating teacher settings:", error);
    return { success: false, error: error.message };
  }
};
