import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDailyTasks, getUserPoints, updateTaskProgress } from "../utils/learningUtils";
import "./DailyTasksModal.css";

export default function DailyTasksModal({ isOpen, onClose, userEmail, t, language }) {
  const [dailyTasks, setDailyTasks] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [completedTaskId, setCompletedTaskId] = useState(null);

  useEffect(() => {
    if (isOpen && userEmail) {
      loadTasks();
    }
  }, [isOpen, userEmail]);

  const loadTasks = () => {
    const tasks = getDailyTasks(userEmail);
    const points = getUserPoints(userEmail);
    setDailyTasks(tasks);
    setUserPoints(points);
  };

  const handleTaskAction = async (taskId) => {
    // This would be called when user completes a task manually
    const result = updateTaskProgress(userEmail, taskId, 1);

    if (result.success && result.completed) {
      setCompletedTaskId(taskId);
      setTimeout(() => setCompletedTaskId(null), 2000);
      loadTasks(); // Refresh data
    }
  };

  if (!isOpen || !dailyTasks || !userPoints) return null;

  const completedCount = dailyTasks.completedTasks.length;
  const totalTasks = Object.keys(dailyTasks.tasks).length;
  const completionPercentage = (completedCount / totalTasks) * 100;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  const taskVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    completed: {
      scale: 1.05,
      backgroundColor: "#4CAF50",
      transition: { duration: 0.3 }
    }
  };

  const getDifficultyColor = (points) => {
    if (points <= 50) return "#4CAF50";
    if (points <= 100) return "#FF9800";
    return "#F44336";
  };

  const getProgressBarColor = () => {
    if (completionPercentage === 100) return "#4CAF50";
    if (completionPercentage >= 50) return "#FF9800";
    return "#2196F3";
  };

  return (
    <div className="daily-tasks-overlay" onClick={onClose}>
      <motion.div
        className="daily-tasks-modal"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <div className="tasks-header">
          <div className="header-content">
            <h2>
              📋 {language === "en" ? "Daily Tasks" : "المهام اليومية"}
            </h2>
            <div className="points-display">
              <div className="total-points">
                <span className="points-value">{userPoints.totalPoints.toLocaleString()}</span>
                <span className="points-label">{language === "en" ? "Total Points" : "إجمالي النقاط"}</span>
              </div>
              <div className="daily-points">
                <span className="points-value">{userPoints.dailyPoints}</span>
                <span className="points-label">{language === "en" ? "Today" : "اليوم"}</span>
              </div>
            </div>
          </div>
          <button className="tasks-close" onClick={onClose}>×</button>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <h3>{language === "en" ? "Daily Progress" : "التقدم اليومي"}</h3>
            <span className="progress-text">
              {completedCount}/{totalTasks} {language === "en" ? "completed" : "مكتملة"}
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: getProgressBarColor()
              }}
            />
          </div>
          {completionPercentage === 100 && (
            <div className="completion-badge">
              🎉 {language === "en" ? "All tasks completed!" : "جميع المهام مكتملة!"}
            </div>
          )}
        </div>

        <div className="tasks-list">
          <AnimatePresence>
            {Object.values(dailyTasks.tasks).map((task, index) => (
              <motion.div
                key={task.id}
                className={`task-item ${task.completed ? "completed" : ""} ${completedTaskId === task.id ? "just-completed" : ""}`}
                variants={taskVariants}
                initial="hidden"
                animate={task.completed ? "completed" : "visible"}
                transition={{ delay: index * 0.1 }}
              >
                <div className="task-icon">
                  {task.completed ? "✅" : task.icon}
                </div>

                <div className="task-content">
                  <div className="task-title">
                    {language === "en" ? task.nameEn : task.nameAr}
                  </div>
                  <div className="task-description">
                    {task.description}
                  </div>

                  {task.target && task.target > 1 && !task.completed && (
                    <div className="task-progress">
                      <div className="progress-info">
                        <span>{task.progress}/{task.target}</span>
                        <div className="mini-progress-bar">
                          <div
                            className="mini-progress-fill"
                            style={{ width: `${(task.progress / task.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="task-reward">
                  <div
                    className="points-badge"
                    style={{ backgroundColor: getDifficultyColor(task.points) }}
                  >
                    +{task.points}
                  </div>

                  {!task.completed && task.id === "daily_login" && (
                    <button
                      className="complete-task-btn"
                      onClick={() => handleTaskAction(task.id)}
                    >
                      {language === "en" ? "Claim" : "استلم"}
                    </button>
                  )}
                </div>

                {task.completed && (
                  <div className="completion-time">
                    ✨ {language === "en" ? "Completed" : "مكتمل"} {new Date(task.completedAt).toLocaleTimeString()}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="tasks-footer">
          <div className="next-reset">
            🔄 {language === "en" ? "Tasks reset daily at midnight" : "تتجدد المهام يومياً في منتصف الليل"}
          </div>
          <div className="tips">
            💡 {language === "en"
              ? "Complete lessons and chat to earn more points!"
              : "أكمل الدروس وتحدث لكسب المزيد من النقاط!"
            }
          </div>
        </div>
      </motion.div>
    </div>
  );
}