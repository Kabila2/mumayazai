import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './NewConversationModal.css';
import { createConversation } from '../utils/conversationUtils';

const NewConversationModal = ({ isOpen, onClose, currentUserEmail, currentUserRole, language = 'en', onConversationCreated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const translations = {
    en: {
      title: 'Start New Conversation',
      searchPlaceholder: 'Search by name...',
      noUsers: 'No users found',
      selectUser: 'Select a user to start chatting',
      cancel: 'Cancel',
      startChat: 'Start Chat',
      teacher: 'Teacher',
      parent: 'Parent',
      student: 'Student',
      creating: 'Creating...'
    },
    ar: {
      title: 'بدء محادثة جديدة',
      searchPlaceholder: 'البحث بالاسم...',
      noUsers: 'لم يتم العثور على مستخدمين',
      selectUser: 'اختر مستخدمًا لبدء المحادثة',
      cancel: 'إلغاء',
      startChat: 'بدء المحادثة',
      teacher: 'معلم',
      parent: 'ولي أمر',
      student: 'طالب',
      creating: 'جاري الإنشاء...'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen, currentUserEmail]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, availableUsers]);

  const loadAvailableUsers = () => {
    try {
      const usersStored = localStorage.getItem('mumayaz_users') || '{}';
      const allUsers = JSON.parse(usersStored);

      // Filter users based on current user role
      const users = Object.entries(allUsers)
        .filter(([email, user]) => {
          // Don't show current user
          if (email === currentUserEmail) return false;

          // Teachers can message parents and other teachers
          if (currentUserRole === 'teacher') {
            return user.role === 'parent' || user.role === 'teacher';
          }

          // Parents can message teachers
          if (currentUserRole === 'parent') {
            return user.role === 'teacher';
          }

          return false;
        })
        .map(([email, user]) => ({
          email,
          name: user.name,
          role: user.role
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser) return;

    setIsCreating(true);

    try {
      const result = createConversation(currentUserEmail, selectedUser.email);

      if (result.success) {
        // Close modal and notify parent component
        onConversationCreated(result.conversationId);
        onClose();
        setSelectedUser(null);
        setSearchTerm('');
      } else {
        alert('Failed to create conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'teacher':
        return '#8b5cf6';
      case 'parent':
        return '#ec4899';
      case 'student':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'teacher':
        return '👨‍🏫';
      case 'parent':
        return '👨‍👩‍👧‍👦';
      case 'student':
        return '👤';
      default:
        return '👤';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="new-conversation-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="modal-header">
            <h2 className="modal-title">{t.title}</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="users-list">
              {filteredUsers.length === 0 ? (
                <div className="no-users">
                  <div className="empty-icon">🔍</div>
                  <p>{t.noUsers}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.email}
                      className={`user-item ${selectedUser?.email === user.email ? 'selected' : ''}`}
                      onClick={() => setSelectedUser(user)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: language === 'ar' ? -5 : 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="user-avatar">
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div
                          className="user-role-badge"
                          style={{ background: getRoleBadgeColor(user.role) }}
                        >
                          {t[user.role] || user.role}
                        </div>
                      </div>
                      {selectedUser?.email === user.email && (
                        <div className="selected-indicator">✓</div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <motion.button
              className="modal-btn cancel-btn"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t.cancel}
            </motion.button>
            <motion.button
              className="modal-btn create-btn"
              onClick={handleCreateConversation}
              disabled={!selectedUser || isCreating}
              whileHover={selectedUser && !isCreating ? { scale: 1.05 } : {}}
              whileTap={selectedUser && !isCreating ? { scale: 0.95 } : {}}
            >
              {isCreating ? t.creating : t.startChat}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewConversationModal;
