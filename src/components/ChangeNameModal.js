import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';
import './ChangeNameModal.css';

const ChangeNameModal = ({ currentUser, onUpdate, onClose, language = 'en' }) => {
  const [newName, setNewName] = useState('');
  const [currentName, setCurrentName] = useState('');
  const [error, setError] = useState('');

  const translations = {
    en: {
      title: 'Change Name',
      currentName: 'Current Name',
      newName: 'New Name',
      placeholder: 'Enter your new name',
      cancel: 'Cancel',
      save: 'Save Name',
      error: {
        empty: 'Please enter a name',
        tooShort: 'Name must be at least 2 characters',
        tooLong: 'Name must be less than 50 characters',
        invalid: 'Name can only contain letters, numbers, and spaces'
      },
      success: 'Name updated successfully!'
    },
    ar: {
      title: 'تغيير الاسم',
      currentName: 'الاسم الحالي',
      newName: 'الاسم الجديد',
      placeholder: 'أدخل اسمك الجديد',
      cancel: 'إلغاء',
      save: 'حفظ الاسم',
      error: {
        empty: 'الرجاء إدخال اسم',
        tooShort: 'يجب أن يكون الاسم حرفين على الأقل',
        tooLong: 'يجب أن يكون الاسم أقل من 50 حرفاً',
        invalid: 'يمكن أن يحتوي الاسم على أحرف وأرقام ومسافات فقط'
      },
      success: 'تم تحديث الاسم بنجاح!'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    // Load current name
    const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
    const user = users[currentUser.toLowerCase()];
    if (user?.name) {
      setCurrentName(user.name);
    }
  }, [currentUser]);

  const validateName = (name) => {
    if (!name.trim()) {
      return t.error.empty;
    }
    if (name.trim().length < 2) {
      return t.error.tooShort;
    }
    if (name.length > 50) {
      return t.error.tooLong;
    }
    // Allow letters (including Arabic), numbers, spaces, and common punctuation
    const validNameRegex = /^[\p{L}\p{N}\s\-'.]+$/u;
    if (!validNameRegex.test(name)) {
      return t.error.invalid;
    }
    return null;
  };

  const handleSave = () => {
    const trimmedName = newName.trim();
    const validationError = validateName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    playSuccessSound();

    // Update user name in localStorage
    const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
    const userKey = currentUser.toLowerCase();
    if (users[userKey]) {
      users[userKey].name = trimmedName;
      localStorage.setItem('mumayaz_users', JSON.stringify(users));
    }

    // Update session if exists
    const session = JSON.parse(localStorage.getItem('mumayaz_session') || '{}');
    if (session.email && session.email.toLowerCase() === userKey) {
      session.name = trimmedName;
      localStorage.setItem('mumayaz_session', JSON.stringify(session));
    }

    // Call parent callback
    if (onUpdate) {
      onUpdate(trimmedName);
    }

    // Dispatch event for other components to update
    window.dispatchEvent(new Event('userNameUpdated'));

    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };

  const handleInputChange = (e) => {
    setNewName(e.target.value);
    setError(''); // Clear error on input change
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <motion.div
      className="change-name-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="change-name-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="change-name-header">
          <h2>✏️ {t.title}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="change-name-content">
          {/* Current Name Display */}
          <div className="current-name-section">
            <label className="name-label">{t.currentName}</label>
            <div className="current-name-display">
              {currentName || 'Not set'}
            </div>
          </div>

          {/* New Name Input */}
          <div className="new-name-section">
            <label className="name-label">{t.newName}</label>
            <input
              type="text"
              className={`name-input ${error ? 'error' : ''}`}
              value={newName}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={t.placeholder}
              maxLength={50}
              autoFocus
            />
            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠️ {error}
              </motion.div>
            )}
          </div>
        </div>

        <div className="change-name-actions">
          <button className="cancel-button" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={!newName.trim()}
          >
            💾 {t.save}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChangeNameModal;
