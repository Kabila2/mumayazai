import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';
import './HomeworkSystem.css';

const HomeworkSystem = ({ userEmail, userRole, language = 'en', onClose }) => {
  const [homework, setHomework] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  const translations = {
    en: {
      title: 'Homework System',
      createHomework: 'Create Homework',
      myHomework: 'My Homework',
      pending: 'Pending',
      completed: 'Completed',
      all: 'All',
      dueDate: 'Due Date',
      status: 'Status',
      complete: 'Complete',
      view: 'View',
      delete: 'Delete',
      noHomework: 'No homework assignments yet',
      assignedBy: 'Assigned by',
      description: 'Description',
      close: 'Close'
    },
    ar: {
      title: 'نظام الواجبات المنزلية',
      createHomework: 'إنشاء واجب منزلي',
      myHomework: 'واجباتي المنزلية',
      pending: 'قيد الانتظار',
      completed: 'مكتمل',
      all: 'الكل',
      dueDate: 'تاريخ الاستحقاق',
      status: 'الحالة',
      complete: 'إكمال',
      view: 'عرض',
      delete: 'حذف',
      noHomework: 'لا توجد واجبات منزلية حتى الآن',
      assignedBy: 'تعيين من قبل',
      description: 'الوصف',
      close: 'إغلاق'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadHomework();
  }, [userEmail, userRole]);

  const loadHomework = () => {
    try {
      const homeworkKey = 'mumayaz_homework';
      const allHomework = JSON.parse(localStorage.getItem(homeworkKey) || '[]');

      // Filter based on role
      let filtered;
      if (userRole === 'teacher') {
        filtered = allHomework.filter(hw => hw.createdBy === userEmail);
      } else {
        filtered = allHomework.filter(hw =>
          hw.assignedTo === 'all' ||
          hw.assignedTo === userEmail ||
          (hw.assignedToGroup && hw.assignedToGroup.includes(userEmail))
        );
      }

      setHomework(filtered);
    } catch (error) {
      console.error('Error loading homework:', error);
    }
  };

  const createHomework = (homeworkData) => {
    try {
      const newHomework = {
        id: Date.now().toString(),
        ...homeworkData,
        createdBy: userEmail,
        createdAt: new Date().toISOString(),
        completions: []
      };

      const homeworkKey = 'mumayaz_homework';
      const allHomework = JSON.parse(localStorage.getItem(homeworkKey) || '[]');
      allHomework.push(newHomework);
      localStorage.setItem(homeworkKey, JSON.stringify(allHomework));

      playSuccessSound();
      loadHomework();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating homework:', error);
    }
  };

  const completeHomework = (homeworkId) => {
    try {
      const homeworkKey = 'mumayaz_homework';
      const allHomework = JSON.parse(localStorage.getItem(homeworkKey) || '[]');

      const hwIndex = allHomework.findIndex(hw => hw.id === homeworkId);
      if (hwIndex !== -1) {
        if (!allHomework[hwIndex].completions) {
          allHomework[hwIndex].completions = [];
        }

        allHomework[hwIndex].completions.push({
          studentEmail: userEmail,
          completedAt: new Date().toISOString()
        });

        localStorage.setItem(homeworkKey, JSON.stringify(allHomework));
        playSuccessSound();
        loadHomework();
      }
    } catch (error) {
      console.error('Error completing homework:', error);
    }
  };

  const deleteHomework = (homeworkId) => {
    try {
      const homeworkKey = 'mumayaz_homework';
      const allHomework = JSON.parse(localStorage.getItem(homeworkKey) || '[]');
      const filtered = allHomework.filter(hw => hw.id !== homeworkId);
      localStorage.setItem(homeworkKey, JSON.stringify(filtered));
      playClickSound();
      loadHomework();
    } catch (error) {
      console.error('Error deleting homework:', error);
    }
  };

  const isCompleted = (hw) => {
    return hw.completions?.some(c => c.studentEmail === userEmail);
  };

  const filteredHomework = homework.filter(hw => {
    if (filter === 'pending') return !isCompleted(hw);
    if (filter === 'completed') return isCompleted(hw);
    return true;
  });

  return (
    <motion.div
      className="homework-system-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="homework-system-page"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="homework-system-header">
          <div className="header-left">
            <button className="back-button" onClick={onClose}>
              ← {t.close}
            </button>
            <h2>📚 {t.title}</h2>
          </div>
        </div>

        <div className="homework-system-actions">
          {userRole === 'teacher' && (
            <button
              className="create-homework-btn"
              onClick={() => {
                playClickSound();
                setShowCreateModal(true);
              }}
            >
              ➕ {t.createHomework}
            </button>
          )}

          <div className="homework-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => { playClickSound(); setFilter('all'); }}
            >
              {t.all}
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => { playClickSound(); setFilter('pending'); }}
            >
              {t.pending}
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => { playClickSound(); setFilter('completed'); }}
            >
              {t.completed}
            </button>
          </div>
        </div>

        <div className="homework-list">
          {filteredHomework.length === 0 ? (
            <div className="no-homework">
              <div className="no-homework-icon">📝</div>
              <p>{t.noHomework}</p>
            </div>
          ) : (
            filteredHomework.map((hw, index) => (
              <motion.div
                key={hw.id}
                className={`homework-card ${isCompleted(hw) ? 'completed' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="homework-card-header">
                  <h3>{hw.title}</h3>
                  <div className={`homework-status ${isCompleted(hw) ? 'completed' : 'pending'}`}>
                    {isCompleted(hw) ? '✓ ' + t.completed : '⏳ ' + t.pending}
                  </div>
                </div>

                <p className="homework-description">{hw.description}</p>

                <div className="homework-card-footer">
                  <div className="homework-meta">
                    <span>📅 {t.dueDate}: {new Date(hw.dueDate).toLocaleDateString()}</span>
                    {userRole !== 'teacher' && (
                      <span>👨‍🏫 {t.assignedBy}: {hw.createdBy}</span>
                    )}
                  </div>

                  <div className="homework-actions">
                    {!isCompleted(hw) && userRole !== 'teacher' && (
                      <button
                        className="action-btn complete-btn"
                        onClick={() => completeHomework(hw.id)}
                      >
                        ✓ {t.complete}
                      </button>
                    )}
                    {userRole === 'teacher' && (
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteHomework(hw.id)}
                      >
                        🗑️ {t.delete}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create Homework Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateHomeworkModal
            onClose={() => setShowCreateModal(false)}
            onCreate={createHomework}
            language={language}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CreateHomeworkModal = ({ onClose, onCreate, language }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignTo, setAssignTo] = useState('all');

  const translations = {
    en: {
      createNew: 'Create New Homework',
      title: 'Title',
      description: 'Description',
      dueDate: 'Due Date',
      assignTo: 'Assign To',
      allStudents: 'All Students',
      cancel: 'Cancel',
      create: 'Create'
    },
    ar: {
      createNew: 'إنشاء واجب منزلي جديد',
      title: 'العنوان',
      description: 'الوصف',
      dueDate: 'تاريخ الاستحقاق',
      assignTo: 'تعيين إلى',
      allStudents: 'جميع الطلاب',
      cancel: 'إلغاء',
      create: 'إنشاء'
    }
  };

  const t = translations[language] || translations.en;

  const handleSubmit = () => {
    if (!title || !description || !dueDate) {
      alert('Please fill all fields');
      return;
    }

    onCreate({
      title,
      description,
      dueDate,
      assignedTo: assignTo
    });
  };

  return (
    <motion.div
      className="create-homework-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="create-homework-modal"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <h3>➕ {t.createNew}</h3>

        <div className="form-group">
          <label>{t.title}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.title}
          />
        </div>

        <div className="form-group">
          <label>{t.description}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.description}
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>{t.dueDate}</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>{t.assignTo}</label>
          <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
            <option value="all">{t.allStudents}</option>
          </select>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>{t.cancel}</button>
          <button className="create-btn" onClick={handleSubmit}>✓ {t.create}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomeworkSystem;
