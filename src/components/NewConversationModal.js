import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MessageCirclePlus, Search, SearchX, UsersRound, X } from 'lucide-react';
import './NewConversationModal.css';
import { createConversation, getInitials } from '../utils/conversationUtils';

// Rendered inside TeacherParentChat, so it reuses that screen's shared
// `tpc-` primitives (avatar, search field, buttons) from TeacherParentChat.css.
const NewConversationModal = ({ isOpen, onClose, currentUserEmail, currentUserRole, language = 'en', onConversationCreated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const translations = {
    en: {
      title: 'New message',
      subtitleParent: 'Choose a teacher to message',
      subtitleTeacher: 'Choose a parent or teacher to message',
      searchPlaceholder: 'Search by name or email',
      noUsers: 'No one matches your search',
      noContactsParent: 'No teachers have joined yet',
      noContactsTeacher: 'No parents or teachers have joined yet',
      cancel: 'Cancel',
      close: 'Close',
      startChat: 'Start chat',
      teacher: 'Teacher',
      parent: 'Parent',
      student: 'Student',
      creating: 'Opening…',
      createFailed: "Couldn't start the conversation. Please try again."
    },
    ar: {
      title: 'رسالة جديدة',
      subtitleParent: 'اختر معلمًا لمراسلته',
      subtitleTeacher: 'اختر ولي أمر أو معلمًا لمراسلته',
      searchPlaceholder: 'ابحث بالاسم أو البريد الإلكتروني',
      noUsers: 'لا توجد نتائج مطابقة',
      noContactsParent: 'لم ينضم أي معلم بعد',
      noContactsTeacher: 'لم ينضم أي ولي أمر أو معلم بعد',
      cancel: 'إلغاء',
      close: 'إغلاق',
      startChat: 'بدء المحادثة',
      teacher: 'معلم',
      parent: 'ولي أمر',
      student: 'طالب',
      creating: 'جاري الفتح…',
      createFailed: 'تعذر بدء المحادثة. حاول مرة أخرى.'
    }
  };

  const t = translations[language] || translations.en;

  const loadAvailableUsers = useCallback(() => {
    try {
      const allUsers = JSON.parse(localStorage.getItem('stellar_users') || '{}');

      const users = Object.entries(allUsers)
        .filter(([email, user]) => {
          // Don't show current user
          if (email === currentUserEmail) return false;

          // Teachers can message parents and other teachers
          if (currentUserRole === 'teacher') {
            return user?.role === 'parent' || user?.role === 'teacher';
          }

          // Parents can message teachers
          if (currentUserRole === 'parent') {
            return user?.role === 'teacher';
          }

          return false;
        })
        .map(([email, user]) => ({
          email,
          name: user.name || email,
          role: user.role,
          picture: user.profilePicture || null
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableUsers(users);
    } catch (loadError) {
      console.error('Error loading users:', loadError);
      setAvailableUsers([]);
    }
  }, [currentUserEmail, currentUserRole]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen, loadAvailableUsers]);

  const handleClose = useCallback(() => {
    setSelectedUser(null);
    setSearchTerm('');
    setError('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return availableUsers;
    return availableUsers.filter(user =>
      user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    );
  }, [searchTerm, availableUsers]);

  const handleCreateConversation = (user = selectedUser) => {
    if (!user || isCreating) return;

    setIsCreating(true);
    setError('');

    const result = createConversation(currentUserEmail, user.email);
    setIsCreating(false);

    if (result.success) {
      onConversationCreated(result.conversationId);
      handleClose();
    } else {
      setError(t.createFailed);
    }
  };

  const roleClass = (role) => (role === 'teacher' || role === 'parent' ? role : 'other');
  const emptyText = availableUsers.length === 0
    ? (currentUserRole === 'parent' ? t.noContactsParent : t.noContactsTeacher)
    : t.noUsers;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="tpc-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="ncm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ncm-title"
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="ncm-header">
              <span className="ncm-header-icon" aria-hidden="true">
                <MessageCirclePlus size={22} />
              </span>
              <div className="ncm-header-text">
                <h2 id="ncm-title" className="ncm-title">{t.title}</h2>
                <p className="ncm-subtitle">
                  {currentUserRole === 'parent' ? t.subtitleParent : t.subtitleTeacher}
                </p>
              </div>
              <button type="button" className="tpc-icon-btn ncm-close" onClick={handleClose} aria-label={t.close}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="ncm-body">
              <label className="tpc-search">
                <Search size={16} aria-hidden="true" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoFocus
                />
              </label>

              <div className="ncm-list">
                {filteredUsers.length === 0 ? (
                  <div className="ncm-empty">
                    <span className="ncm-empty-icon" aria-hidden="true">
                      {availableUsers.length === 0 ? <UsersRound size={24} /> : <SearchX size={24} />}
                    </span>
                    <p>{emptyText}</p>
                  </div>
                ) : (
                  filteredUsers.map(user => {
                    const isSelected = selectedUser?.email === user.email;
                    return (
                      <button
                        key={user.email}
                        type="button"
                        className={`ncm-user ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setSelectedUser(user)}
                        onDoubleClick={() => handleCreateConversation(user)}
                        aria-pressed={isSelected}
                      >
                        <span className="ncm-user-inner">
                          <span className={`tpc-avatar tpc-avatar--md tpc-avatar--${roleClass(user.role)}`} aria-hidden="true">
                            {user.picture ? <img src={user.picture} alt="" /> : getInitials(user.name)}
                          </span>
                          <span className="ncm-user-info">
                            <span className="ncm-user-name">{user.name}</span>
                            {user.name !== user.email && <span className="ncm-user-email">{user.email}</span>}
                          </span>
                          <span className={`tpc-role-chip tpc-role-chip--${roleClass(user.role)}`}>
                            {t[user.role] || user.role}
                          </span>
                          <span className="ncm-check" aria-hidden="true">
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {error && <p className="ncm-error" role="alert">{error}</p>}
            </div>

            <div className="ncm-footer">
              <button type="button" className="tpc-secondary-btn" onClick={handleClose}>
                {t.cancel}
              </button>
              <button
                type="button"
                className="tpc-primary-btn"
                onClick={() => handleCreateConversation()}
                disabled={!selectedUser || isCreating}
              >
                {isCreating ? t.creating : t.startChat}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewConversationModal;
