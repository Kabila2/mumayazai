import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';
import './ClassManagement.css';

const ClassManagement = ({ userEmail, userRole, language = 'en', onClose }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);

  const translations = {
    en: {
      title: 'Class Management',
      createClass: 'Create Class',
      myClasses: 'My Classes',
      className: 'Class Name',
      description: 'Description',
      students: 'Students',
      create: 'Create',
      cancel: 'Cancel',
      delete: 'Delete',
      addStudents: 'Add Students',
      noClasses: 'No classes yet',
      studentCount: 'students',
      viewClass: 'View Class',
      classCode: 'Class Code',
      copyCode: 'Copy Code',
      removeStudent: 'Remove',
      close: 'Close',
      grade: 'Grade',
      performance: 'Performance',
      email: 'Email',
      confirmDelete: 'Delete Class',
      confirmDeleteMessage: 'Are you sure you want to delete this class? This action cannot be undone.',
      confirmYes: 'Yes, Delete',
      confirmNo: 'Cancel'
    },
    ar: {
      title: 'إدارة الصفوف',
      createClass: 'إنشاء صف',
      myClasses: 'صفوفي',
      className: 'اسم الصف',
      description: 'الوصف',
      students: 'الطلاب',
      create: 'إنشاء',
      cancel: 'إلغاء',
      delete: 'حذف',
      addStudents: 'إضافة طلاب',
      noClasses: 'لا توجد صفوف بعد',
      studentCount: 'طالب',
      viewClass: 'عرض الصف',
      classCode: 'رمز الصف',
      copyCode: 'نسخ الرمز',
      removeStudent: 'إزالة',
      close: 'إغلاق',
      grade: 'الصف',
      performance: 'الأداء',
      email: 'البريد الإلكتروني',
      confirmDelete: 'حذف الصف',
      confirmDeleteMessage: 'هل أنت متأكد من حذف هذا الصف؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmYes: 'نعم، احذف',
      confirmNo: 'إلغاء'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, [userEmail]);

  const loadClasses = () => {
    try {
      const classesKey = 'mumayaz_classes';
      const allClasses = JSON.parse(localStorage.getItem(classesKey) || '[]');

      // Filter classes by teacher
      const teacherClasses = allClasses.filter(c => c.teacherEmail === userEmail);
      setClasses(teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = () => {
    try {
      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const studentList = Object.entries(users)
        .filter(([email, user]) => user.role === 'student' || user.role === 'child')
        .map(([email, user]) => ({ email, ...user }));
      setStudents(studentList);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const createClass = (classData) => {
    try {
      const newClass = {
        id: Date.now().toString(),
        ...classData,
        teacherEmail: userEmail,
        createdAt: new Date().toISOString(),
        students: [],
        classCode: generateClassCode()
      };

      const classesKey = 'mumayaz_classes';
      const allClasses = JSON.parse(localStorage.getItem(classesKey) || '[]');
      allClasses.push(newClass);
      localStorage.setItem(classesKey, JSON.stringify(allClasses));

      playSuccessSound();
      loadClasses();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const deleteClass = (classId) => {
    try {
      const classesKey = 'mumayaz_classes';
      const allClasses = JSON.parse(localStorage.getItem(classesKey) || '[]');
      const filtered = allClasses.filter(c => c.id !== classId);
      localStorage.setItem(classesKey, JSON.stringify(filtered));
      playClickSound();
      loadClasses();
      setSelectedClass(null);
      setClassToDelete(null);
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const addStudentToClass = (classId, studentEmail) => {
    try {
      const classesKey = 'mumayaz_classes';
      const allClasses = JSON.parse(localStorage.getItem(classesKey) || '[]');

      const classIndex = allClasses.findIndex(c => c.id === classId);
      if (classIndex !== -1) {
        if (!allClasses[classIndex].students.includes(studentEmail)) {
          allClasses[classIndex].students.push(studentEmail);
          localStorage.setItem(classesKey, JSON.stringify(allClasses));
          playSuccessSound();
          loadClasses();
        }
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const removeStudentFromClass = (classId, studentEmail) => {
    try {
      const classesKey = 'mumayaz_classes';
      const allClasses = JSON.parse(localStorage.getItem(classesKey) || '[]');

      const classIndex = allClasses.findIndex(c => c.id === classId);
      if (classIndex !== -1) {
        allClasses[classIndex].students = allClasses[classIndex].students.filter(
          email => email !== studentEmail
        );
        localStorage.setItem(classesKey, JSON.stringify(allClasses));
        playClickSound();
        loadClasses();
      }
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const copyClassCode = (code) => {
    navigator.clipboard.writeText(code);
    playClickSound();
    // Class code copied notification shown via clipboard API
  };

  const getStudentInfo = (email) => {
    return students.find(s => s.email === email) || { name: email, email };
  };

  return (
    <motion.div
      className="class-management-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="class-management-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="class-management-header">
          <h2>🏫 {t.title}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {!selectedClass ? (
          <>
            <div className="class-management-actions">
              <button
                className="create-class-btn"
                onClick={() => {
                  playClickSound();
                  setShowCreateModal(true);
                }}
              >
                ➕ {t.createClass}
              </button>
            </div>

            <div className="classes-list">
              {classes.length === 0 ? (
                <div className="no-classes">
                  <div className="no-classes-icon">🏫</div>
                  <p>{t.noClasses}</p>
                </div>
              ) : (
                classes.map((cls, index) => (
                  <motion.div
                    key={cls.id}
                    className="class-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="class-card-header">
                      <h3>{cls.name}</h3>
                      <div className="class-code-badge">
                        🔑 {cls.classCode}
                      </div>
                    </div>

                    <p className="class-description">{cls.description}</p>

                    <div className="class-card-footer">
                      <div className="class-stats">
                        <span>👥 {cls.students.length} {t.studentCount}</span>
                        <span>📅 {new Date(cls.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="class-actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => setSelectedClass(cls)}
                        >
                          👁️ {t.viewClass}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => setClassToDelete(cls)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          <ClassDetail
            classData={selectedClass}
            students={students}
            onBack={() => setSelectedClass(null)}
            onAddStudent={(studentEmail) => addStudentToClass(selectedClass.id, studentEmail)}
            onRemoveStudent={(studentEmail) => removeStudentFromClass(selectedClass.id, studentEmail)}
            onCopyCode={copyClassCode}
            language={language}
            t={t}
            getStudentInfo={getStudentInfo}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateClassModal
            onClose={() => setShowCreateModal(false)}
            onCreate={createClass}
            language={language}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {classToDelete && (
          <motion.div
            className="confirmation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setClassToDelete(null)}
          >
            <motion.div
              className="confirmation-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{t.confirmDelete}</h3>
              <p>{t.confirmDeleteMessage}</p>
              <div className="confirmation-actions">
                <button
                  className="confirm-btn delete"
                  onClick={() => deleteClass(classToDelete.id)}
                >
                  {t.confirmYes}
                </button>
                <button
                  className="confirm-btn cancel"
                  onClick={() => setClassToDelete(null)}
                >
                  {t.confirmNo}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ClassDetail = ({
  classData,
  students,
  onBack,
  onAddStudent,
  onRemoveStudent,
  onCopyCode,
  language,
  t,
  getStudentInfo
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const availableStudents = students.filter(
    s => !classData.students.includes(s.email)
  );

  return (
    <div className="class-detail">
      <div className="class-detail-header">
        <button className="back-btn" onClick={onBack}>← {t.myClasses}</button>
        <h3>{classData.name}</h3>
        <div className="class-code-display">
          <span>🔑 {classData.classCode}</span>
          <button
            className="copy-code-btn"
            onClick={() => onCopyCode(classData.classCode)}
          >
            📋 {t.copyCode}
          </button>
        </div>
      </div>

      <div className="class-detail-content">
        <div className="students-section">
          <div className="section-header">
            <h4>👥 {t.students} ({classData.students.length})</h4>
            <button
              className="add-student-btn"
              onClick={() => setShowAddModal(true)}
            >
              ➕ {t.addStudents}
            </button>
          </div>

          <div className="students-grid">
            {classData.students.length === 0 ? (
              <p className="no-students">No students enrolled yet</p>
            ) : (
              classData.students.map((studentEmail) => {
                const student = getStudentInfo(studentEmail);
                return (
                  <div key={studentEmail} className="student-card">
                    <div className="student-info">
                      <div className="student-avatar">
                        {student.profilePicture ? (
                          student.profilePicture.startsWith('data:') ? (
                            <img src={student.profilePicture} alt={student.name} />
                          ) : (
                            <span>{student.profilePicture}</span>
                          )
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div>
                        <div className="student-name">{student.name}</div>
                        <div className="student-email">{student.email}</div>
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => onRemoveStudent(studentEmail)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddStudentModal
            students={availableStudents}
            onClose={() => setShowAddModal(false)}
            onAdd={(email) => {
              onAddStudent(email);
              setShowAddModal(false);
            }}
            language={language}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const CreateClassModal = ({ onClose, onCreate, language, t }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');

  const handleSubmit = () => {
    if (!name || !description) {
      alert('Please fill all fields');
      return;
    }

    onCreate({ name, description, grade });
  };

  return (
    <motion.div
      className="create-class-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="create-class-modal"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <h3>➕ {t.createClass}</h3>

        <div className="form-group">
          <label>{t.className}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.className}
          />
        </div>

        <div className="form-group">
          <label>{t.description}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.description}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>{t.grade}</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder={t.grade}
          />
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>{t.cancel}</button>
          <button className="create-btn" onClick={handleSubmit}>✓ {t.create}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AddStudentModal = ({ students, onClose, onAdd, language, t }) => {
  return (
    <motion.div
      className="add-student-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="add-student-modal"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <h3>➕ {t.addStudents}</h3>

        <div className="available-students-list">
          {students.length === 0 ? (
            <p className="no-students">No available students</p>
          ) : (
            students.map((student) => (
              <div key={student.email} className="available-student-item">
                <div className="student-info">
                  <span className="student-avatar">
                    {student.profilePicture || '👤'}
                  </span>
                  <div>
                    <div className="student-name">{student.name}</div>
                    <div className="student-email">{student.email}</div>
                  </div>
                </div>
                <button
                  className="add-btn"
                  onClick={() => onAdd(student.email)}
                >
                  ➕ Add
                </button>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>{t.close}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClassManagement;
