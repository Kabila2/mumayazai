import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createAssignment,
  getUserAssignments,
  submitAssignment,
  gradeAssignment,
  deleteAssignment
} from '../utils/homeworkSystem';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';
import './HomeworkCenter.css';

const HomeworkCenter = ({ userEmail, userRole, language = 'en', onClose }) => {
  const [assignments, setAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'submitted', 'graded'

  const translations = {
    en: {
      title: 'Homework Center',
      createAssignment: 'Create Assignment',
      myAssignments: 'My Assignments',
      all: 'All',
      pending: 'Pending',
      submitted: 'Submitted',
      graded: 'Graded',
      dueDate: 'Due Date',
      assignedTo: 'Assigned To',
      status: 'Status',
      score: 'Score',
      submit: 'Submit',
      grade: 'Grade',
      delete: 'Delete',
      close: 'Close',
      noAssignments: 'No assignments yet',
      assignmentTitle: 'Assignment Title',
      description: 'Description',
      students: 'students',
      create: 'Create',
      cancel: 'Cancel'
    },
    ar: {
      title: 'مركز الواجبات',
      createAssignment: 'إنشاء واجب',
      myAssignments: 'واجباتي',
      all: 'الكل',
      pending: 'معلق',
      submitted: 'مقدم',
      graded: 'مصحح',
      dueDate: 'تاريخ الاستحقاق',
      assignedTo: 'مخصص لـ',
      status: 'الحالة',
      score: 'الدرجة',
      submit: 'تقديم',
      grade: 'تصحيح',
      delete: 'حذف',
      close: 'إغلاق',
      noAssignments: 'لا توجد واجبات بعد',
      assignmentTitle: 'عنوان الواجب',
      description: 'الوصف',
      students: 'طلاب',
      create: 'إنشاء',
      cancel: 'إلغاء'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadAssignments();
  }, [userEmail, userRole]);

  const loadAssignments = () => {
    const userAssignments = getUserAssignments(userEmail, userRole);
    setAssignments(userAssignments);
  };

  const handleCreateAssignment = (assignmentData) => {
    const newAssignment = createAssignment(userEmail, assignmentData);
    if (newAssignment) {
      loadAssignments();
      setShowCreateModal(false);
    }
  };

  const handleSubmitAssignment = (assignmentId, submissionData) => {
    const success = submitAssignment(assignmentId, userEmail, submissionData);
    if (success) {
      loadAssignments();
      setSelectedAssignment(null);
    }
  };

  const handleGradeAssignment = (assignmentId, studentEmail, gradeData) => {
    const success = gradeAssignment(assignmentId, studentEmail, gradeData);
    if (success) {
      loadAssignments();
    }
  };

  const handleDeleteAssignment = (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      const success = deleteAssignment(assignmentId);
      if (success) {
        loadAssignments();
      }
    }
  };

  const getAssignmentStatus = (assignment) => {
    if (userRole === 'student') {
      const submission = assignment.submissions?.[userEmail];
      if (!submission) return 'pending';
      if (submission.status === 'graded') return 'graded';
      if (submission.submitted) return 'submitted';
    }
    return 'all';
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return getAssignmentStatus(assignment) === filter;
  });

  return (
    <motion.div
      className="homework-center-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="homework-center-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="homework-header">
          <h2>📝 {t.title}</h2>
          <div className="header-actions">
            {userRole === 'teacher' && (
              <button
                className="create-assignment-btn"
                onClick={() => {
                  playClickSound();
                  setShowCreateModal(true);
                }}
              >
                ➕ {t.createAssignment}
              </button>
            )}
            <button className="close-button" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setFilter('all');
            }}
          >
            {t.all}
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setFilter('pending');
            }}
          >
            {t.pending}
          </button>
          <button
            className={`filter-tab ${filter === 'submitted' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setFilter('submitted');
            }}
          >
            {t.submitted}
          </button>
          <button
            className={`filter-tab ${filter === 'graded' ? 'active' : ''}`}
            onClick={() => {
              playClickSound();
              setFilter('graded');
            }}
          >
            {t.graded}
          </button>
        </div>

        <div className="homework-content">
          {filteredAssignments.length > 0 ? (
            <div className="assignments-list">
              {filteredAssignments.map(assignment => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  userEmail={userEmail}
                  userRole={userRole}
                  language={language}
                  onSubmit={handleSubmitAssignment}
                  onGrade={handleGradeAssignment}
                  onDelete={handleDeleteAssignment}
                  onClick={() => setSelectedAssignment(assignment)}
                />
              ))}
            </div>
          ) : (
            <div className="no-assignments">
              <div className="no-assignments-icon">📚</div>
              <p>{t.noAssignments}</p>
            </div>
          )}
        </div>

        {/* Create Assignment Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateAssignmentModal
              language={language}
              onClose={() => setShowCreateModal(false)}
              onCreate={handleCreateAssignment}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const AssignmentCard = ({ assignment, userEmail, userRole, language, onSubmit, onGrade, onDelete, onClick }) => {
  const t = language === 'ar' ? {
    dueDate: 'تاريخ الاستحقاق',
    submit: 'تقديم',
    submitted: 'مقدم',
    graded: 'مصحح',
    delete: 'حذف',
    score: 'الدرجة'
  } : {
    dueDate: 'Due Date',
    submit: 'Submit',
    submitted: 'Submitted',
    graded: 'Graded',
    delete: 'Delete',
    score: 'Score'
  };

  const submission = assignment.submissions?.[userEmail];
  const isOverdue = new Date(assignment.dueDate) < new Date() && !submission?.submitted;

  return (
    <motion.div
      className={`assignment-card ${isOverdue ? 'overdue' : ''}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="assignment-header">
        <h3>{assignment.title}</h3>
        {isOverdue && <span className="overdue-badge">❗ Overdue</span>}
      </div>
      <p className="assignment-description">{assignment.description}</p>
      <div className="assignment-meta">
        <span>📅 {t.dueDate}: {new Date(assignment.dueDate).toLocaleDateString()}</span>
      </div>
      {submission && (
        <div className="submission-status">
          {submission.status === 'graded' ? (
            <span className="status-badge graded">
              ✅ {t.graded} - {t.score}: {submission.score}%
            </span>
          ) : (
            <span className="status-badge submitted">
              📤 {t.submitted}
            </span>
          )}
        </div>
      )}
      {userRole === 'teacher' && (
        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(assignment.id);
          }}
        >
          🗑️ {t.delete}
        </button>
      )}
    </motion.div>
  );
};

const CreateAssignmentModal = ({ language, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const t = language === 'ar' ? {
    createAssignment: 'إنشاء واجب',
    assignmentTitle: 'عنوان الواجب',
    description: 'الوصف',
    dueDate: 'تاريخ الاستحقاق',
    create: 'إنشاء',
    cancel: 'إلغاء'
  } : {
    createAssignment: 'Create Assignment',
    assignmentTitle: 'Assignment Title',
    description: 'Description',
    dueDate: 'Due Date',
    create: 'Create',
    cancel: 'Cancel'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title && description && dueDate) {
      onCreate({
        title,
        description,
        dueDate,
        assignedTo: [] // Can be expanded to select specific students
      });
    }
  };

  return (
    <motion.div
      className="create-assignment-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="create-assignment-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{t.createAssignment}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.assignmentTitle}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>{t.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              required
            />
          </div>
          <div className="form-group">
            <label>{t.dueDate}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="create-btn">
              {t.create}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default HomeworkCenter;
