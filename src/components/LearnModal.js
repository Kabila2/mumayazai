import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LEARNING_CATEGORIES,
  getLearningProgress,
  completeLesson,
  getUserPoints
} from "../utils/learningUtils";
import "./LearnModal.css";

export default function LearnModal({ isOpen, onClose, userEmail, t, language }) {
  const [activeCategory, setActiveCategory] = useState("math");
  const [learningProgress, setLearningProgress] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [completedLessonId, setCompletedLessonId] = useState(null);

  useEffect(() => {
    if (isOpen && userEmail) {
      loadProgress();
    }
  }, [isOpen, userEmail]);

  const loadProgress = () => {
    const progress = getLearningProgress(userEmail);
    const points = getUserPoints(userEmail);
    setLearningProgress(progress);
    setUserPoints(points);
  };

  const handleLessonComplete = async (categoryId, lessonId) => {
    const result = completeLesson(userEmail, categoryId, lessonId);

    if (result.success) {
      setCompletedLessonId(lessonId);
      setTimeout(() => setCompletedLessonId(null), 2000);
      loadProgress(); // Refresh data
      setSelectedLesson(null);
    }
  };

  if (!isOpen || !learningProgress || !userPoints) return null;

  const categories = Object.values(LEARNING_CATEGORIES);
  const currentCategory = LEARNING_CATEGORIES[activeCategory];

  const isLessonCompleted = (categoryId, lessonId) => {
    return learningProgress.completedLessons.includes(`${categoryId}_${lessonId}`);
  };

  const getCategoryProgress = (categoryId) => {
    const totalLessons = LEARNING_CATEGORIES[categoryId].lessons.length;
    const completed = learningProgress.categoryProgress[categoryId] || 0;
    return { completed, total: totalLessons, percentage: (completed / totalLessons) * 100 };
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  const categoryVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const lessonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner": return "#4CAF50";
      case "intermediate": return "#FF9800";
      case "advanced": return "#F44336";
      default: return "#2196F3";
    }
  };

  const getDifficultyLabel = (difficulty) => {
    if (language === "ar") {
      switch (difficulty) {
        case "beginner": return "مبتدئ";
        case "intermediate": return "متوسط";
        case "advanced": return "متقدم";
        default: return "عام";
      }
    } else {
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
  };

  return (
    <div className="learn-overlay" onClick={onClose}>
      <motion.div
        className="learn-modal"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <div className="learn-header">
          <div className="header-content">
            <h2>
              🎓 {language === "en" ? "Learn & Grow" : "تعلم وانمُ"}
            </h2>
            <div className="points-display">
              <div className="total-points">
                <span className="points-value">{userPoints.totalPoints.toLocaleString()}</span>
                <span className="points-label">{language === "en" ? "Total Points" : "إجمالي النقاط"}</span>
              </div>
            </div>
          </div>
          <button className="learn-close" onClick={onClose}>×</button>
        </div>

        <div className="learn-content">
          {/* Categories Sidebar */}
          <div className="categories-sidebar">
            <h3>{language === "en" ? "Categories" : "الفئات"}</h3>
            {categories.map((category, index) => {
              const progress = getCategoryProgress(category.id);
              return (
                <motion.div
                  key={category.id}
                  className={`category-item ${activeCategory === category.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                  variants={categoryVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="category-icon" style={{ color: category.color }}>
                    {category.icon}
                  </div>
                  <div className="category-info">
                    <div className="category-name">
                      {language === "en" ? category.nameEn : category.nameAr}
                    </div>
                    <div className="category-progress">
                      {progress.completed}/{progress.total} {language === "en" ? "lessons" : "دروس"}
                    </div>
                    <div className="progress-bar-mini">
                      <div
                        className="progress-fill-mini"
                        style={{
                          width: `${progress.percentage}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Lessons Content */}
          <div className="lessons-content">
            <div className="category-header">
              <div className="category-title">
                <span className="category-icon-large" style={{ color: currentCategory.color }}>
                  {currentCategory.icon}
                </span>
                <h3>{language === "en" ? currentCategory.nameEn : currentCategory.nameAr}</h3>
              </div>
              <div className="category-stats">
                {getCategoryProgress(activeCategory).completed}/{currentCategory.lessons.length} {language === "en" ? "completed" : "مكتمل"}
              </div>
            </div>

            <div className="lessons-grid">
              <AnimatePresence mode="wait">
                {currentCategory.lessons.map((lesson, index) => {
                  const completed = isLessonCompleted(activeCategory, lesson.id);
                  const justCompleted = completedLessonId === lesson.id;

                  return (
                    <motion.div
                      key={lesson.id}
                      className={`lesson-card ${completed ? "completed" : ""} ${justCompleted ? "just-completed" : ""}`}
                      variants={lessonVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                      onClick={() => !completed && setSelectedLesson(lesson)}
                    >
                      <div className="lesson-status">
                        {completed ? "✅" : "📚"}
                      </div>

                      <div className="lesson-content">
                        <h4 className="lesson-title">
                          {language === "en" ? lesson.titleEn : lesson.titleAr}
                        </h4>
                        <p className="lesson-description">
                          {lesson.description}
                        </p>

                        <div className="lesson-meta">
                          <div
                            className="difficulty-badge"
                            style={{ backgroundColor: getDifficultyColor(lesson.difficulty) }}
                          >
                            {getDifficultyLabel(lesson.difficulty)}
                          </div>
                          <div className="points-badge">
                            +{lesson.points} {language === "en" ? "pts" : "نقطة"}
                          </div>
                        </div>
                      </div>

                      {!completed && (
                        <div className="lesson-action">
                          <button
                            className="start-lesson-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLesson(lesson);
                            }}
                          >
                            {language === "en" ? "Start" : "ابدأ"}
                          </button>
                        </div>
                      )}

                      {completed && (
                        <div className="completion-badge">
                          <span>🏆 {language === "en" ? "Completed" : "مكتمل"}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Lesson Detail Modal */}
        <AnimatePresence>
          {selectedLesson && (
            <div className="lesson-detail-overlay" onClick={() => setSelectedLesson(null)}>
              <motion.div
                className="lesson-detail-modal"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="lesson-detail-header">
                  <h3>{language === "en" ? selectedLesson.titleEn : selectedLesson.titleAr}</h3>
                  <button onClick={() => setSelectedLesson(null)}>×</button>
                </div>

                <div className="lesson-detail-content">
                  <div className="lesson-info">
                    <p><strong>{language === "en" ? "Category:" : "الفئة:"}</strong> {language === "en" ? currentCategory.nameEn : currentCategory.nameAr}</p>
                    <p><strong>{language === "en" ? "Difficulty:" : "الصعوبة:"}</strong> {getDifficultyLabel(selectedLesson.difficulty)}</p>
                    <p><strong>{language === "en" ? "Points:" : "النقاط:"}</strong> {selectedLesson.points}</p>
                  </div>

                  <div className="lesson-description-full">
                    <p>{selectedLesson.description}</p>
                    <p>{language === "en"
                      ? "This lesson will help you understand and practice key concepts. Complete it to earn points and unlock new challenges!"
                      : "سيساعدك هذا الدرس على فهم وممارسة المفاهيم الأساسية. أكمله لكسب النقاط وفتح تحديات جديدة!"
                    }</p>
                  </div>

                  <div className="lesson-actions">
                    <button
                      className="complete-lesson-btn"
                      onClick={() => handleLessonComplete(activeCategory, selectedLesson.id)}
                    >
                      {language === "en" ? "Complete Lesson" : "أكمل الدرس"} (+{selectedLesson.points} {language === "en" ? "points" : "نقطة"})
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}