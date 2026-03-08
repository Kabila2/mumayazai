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
  const [joinMessage, setJoinMessage] = useState(null); // { type: 'success'|'error', text: string }

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
      confirmNo: 'Cancel',
      joinClass: 'Join a Class',
      enterCode: 'Enter class code',
      join: 'Join',
      joinSuccess: 'You have joined the class!',
      joinError: 'Invalid class code. Please try again.',
      alreadyJoined: 'You are already in this class.',
      myEnrolledClasses: 'My Classes'
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
      confirmNo: 'إلغاء',
      joinClass: 'انضم إلى صف',
      enterCode: 'أدخل رمز الصف',
      join: 'انضم',
      joinSuccess: 'لقد انضممت إلى الصف!',
      joinError: 'رمز الصف غير صحيح. يرجى المحاولة مرة أخرى.',
      alreadyJoined: 'أنت مسجل بالفعل في هذا الصف.',
      myEnrolledClasses: 'صفوفي'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, [userEmail]);

  const getClassesObject = () => {
    try {
      const raw = localStorage.getItem('mumayaz_classes');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Migrate old array format to object format
        const obj = {};
        parsed.forEach(c => { if (c.id) obj[c.id] = c; });
        localStorage.setItem('mumayaz_classes', JSON.stringify(obj));
        return obj;
      }
      return parsed;
    } catch (error) {
      return {};
    }
  };

  const loadClasses = () => {
    try {
      const allClassesObj = getClassesObject();
      const teacherClasses = Object.values(allClassesObj).filter(c => c.teacherEmail === userEmail);
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

      const allClasses = getClassesObject();
      allClasses[newClass.id] = newClass;
      localStorage.setItem('mumayaz_classes', JSON.stringify(allClasses));

      playSuccessSound();
      loadClasses();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const deleteClass = (classId) => {
    try {
      const allClasses = getClassesObject();
      delete allClasses[classId];
      localStorage.setItem('mumayaz_classes', JSON.stringify(allClasses));
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
      const email = studentEmail.trim().toLowerCase();
      if (!email) return;

      const allClasses = getClassesObject();
      if (!allClasses[classId]) return;

      const currentStudents = allClasses[classId].students || [];

      // Support both string and object formats in the students array
      const alreadyEnrolled = currentStudents.some(s =>
        typeof s === 'string' ? s === email : s.email === email
      );

      if (alreadyEnrolled) return;

      // Look up the student's full data from registered users
      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const userData = users[email];

      // Store as an object (consistent with teacherUtils.enrollStudent)
      const studentData = {
        email,
        name: userData ? userData.name : email,
        enrolledAt: new Date().toISOString(),
        totalPoints: 0,
        pointsHistory: [],
        achievements: []
      };

      allClasses[classId].students.push(studentData);
      allClasses[classId].totalStudents = allClasses[classId].students.length;
      localStorage.setItem('mumayaz_classes', JSON.stringify(allClasses));
      playSuccessSound();
      loadClasses();
      setSelectedClass({ ...allClasses[classId] });
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const removeStudentFromClass = (classId, studentEmail) => {
    try {
      const allClasses = getClassesObject();

      if (allClasses[classId]) {
        allClasses[classId].students = allClasses[classId].students.filter(s =>
          typeof s === 'string' ? s !== studentEmail : s.email !== studentEmail
        );
        localStorage.setItem('mumayaz_classes', JSON.stringify(allClasses));
        playClickSound();
        loadClasses();
        setSelectedClass({ ...allClasses[classId] });
      }
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const joinByCode = (code) => {
    try {
      const allClasses = getClassesObject();
      const match = Object.values(allClasses).find(
        c => c.classCode && c.classCode.toUpperCase() === code.trim().toUpperCase()
      );

      if (!match) {
        setJoinMessage({ type: 'error', text: t.joinError });
        return;
      }

      const email = userEmail.trim().toLowerCase();
      const alreadyIn = (match.students || []).some(s =>
        typeof s === 'string' ? s === email : s.email === email
      );

      if (alreadyIn) {
        setJoinMessage({ type: 'error', text: t.alreadyJoined });
        return;
      }

      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const userData = users[email];
      const studentData = {
        email,
        name: userData ? userData.name : email,
        enrolledAt: new Date().toISOString(),
        totalPoints: 0,
        pointsHistory: [],
        achievements: []
      };

      allClasses[match.id].students = allClasses[match.id].students || [];
      allClasses[match.id].students.push(studentData);
      allClasses[match.id].totalStudents = allClasses[match.id].students.length;
      localStorage.setItem('mumayaz_classes', JSON.stringify(allClasses));
      playSuccessSound();
      setJoinMessage({ type: 'success', text: t.joinSuccess });
      loadClasses();
    } catch (error) {
      console.error('Error joining class:', error);
      setJoinMessage({ type: 'error', text: t.joinError });
    }
  };

  const getEnrolledClasses = () => {
    try {
      const allClasses = getClassesObject();
      const email = userEmail.trim().toLowerCase();
      return Object.values(allClasses).filter(c =>
        (c.students || []).some(s =>
          typeof s === 'string' ? s === email : s.email === email
        )
      );
    } catch {
      return [];
    }
  };

  const copyClassCode = (code) => {
    navigator.clipboard.writeText(code);
    playClickSound();
    // Class code copied notification shown via clipboard API
  };

  const getStudentEmail = (s) => (typeof s === 'string' ? s : s.email);

  const getStudentInfo = (student) => {
    const email = getStudentEmail(student);
    // If student is already a full object (from teacherUtils), use it directly
    if (typeof student === 'object' && student.name) return { ...student, email };
    // Otherwise look up from registered users
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
            {userRole !== 'teacher' ? (
              // ── Student view: join by code + enrolled classes ──
              <StudentJoinView
                t={t}
                language={language}
                joinMessage={joinMessage}
                onJoin={joinByCode}
                enrolledClasses={getEnrolledClasses()}
              />
            ) : (
              // ── Teacher view: create + manage classes ──
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
            )}
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

  const enrolledEmails = new Set(
    classData.students.map(s => typeof s === 'string' ? s : s.email)
  );
  const availableStudents = students.filter(s => !enrolledEmails.has(s.email));

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
              classData.students.map((entry) => {
                const student = getStudentInfo(entry);
                const email = typeof entry === 'string' ? entry : entry.email;
                return (
                  <div key={email} className="student-card">
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
                        <div className="student-email">{email}</div>
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => onRemoveStudent(email)}
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
  const [emailInput, setEmailInput] = useState('');

  const handleEmailAdd = () => {
    const email = emailInput.trim().toLowerCase();
    if (email) {
      onAdd(email);
      setEmailInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleEmailAdd();
  };

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

        <div className="add-by-email-section">
          <div className="email-input-row">
            <input
              type="email"
              className="email-input"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني للطالب' : 'Enter student email address'}
              autoFocus
            />
            <button
              className="add-btn"
              onClick={handleEmailAdd}
              disabled={!emailInput.trim()}
            >
              ➕ {language === 'ar' ? 'إضافة' : 'Add'}
            </button>
          </div>
        </div>

        {students.length > 0 && (
          <>
            <p className="or-divider">{language === 'ar' ? '— أو اختر من القائمة —' : '— or choose from registered students —'}</p>
            <div className="available-students-list">
              {students.map((student) => (
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
                    ➕ {language === 'ar' ? 'إضافة' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>{t.close}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const StudentJoinView = ({ t, language, joinMessage, onJoin, enrolledClasses }) => {
  const [codeInput, setCodeInput] = useState('');

  const handleJoin = () => {
    if (codeInput.trim()) {
      onJoin(codeInput.trim());
      setCodeInput('');
    }
  };

  return (
    <div className="student-join-view" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="join-class-section">
        <h3>🔑 {t.joinClass}</h3>
        <div className="join-code-row">
          <input
            type="text"
            className="code-input"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            placeholder={t.enterCode}
            maxLength={8}
            style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}
          />
          <button
            className="join-btn"
            onClick={handleJoin}
            disabled={!codeInput.trim()}
          >
            {t.join}
          </button>
        </div>
        {joinMessage && (
          <motion.p
            className={`join-message ${joinMessage.type}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {joinMessage.type === 'success' ? '✅' : '❌'} {joinMessage.text}
          </motion.p>
        )}
      </div>

      {enrolledClasses.length > 0 && (
        <div className="enrolled-classes-section">
          <h3>📚 {t.myEnrolledClasses}</h3>
          <div className="classes-list">
            {enrolledClasses.map((cls, index) => (
              <motion.div
                key={cls.id}
                className="class-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="class-card-header">
                  <h3>{cls.name}</h3>
                </div>
                <p className="class-description">{cls.description}</p>
                <div className="class-card-footer">
                  <div className="class-stats">
                    <span>👥 {(cls.students || []).length} {t.studentCount}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
