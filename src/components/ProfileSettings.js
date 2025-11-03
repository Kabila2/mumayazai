import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound, playSuccessSound, playErrorSound } from '../utils/soundEffects';
import { exportUserData, importUserData, clearAllUserData } from '../utils/dataExport';
import { toast } from '../hooks/useToast';
import './ProfileSettings.css';

const DEFAULT_AVATARS = [
  '👤', '🧑‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍💼', '👨‍💻', '👩‍💻',
  '🦁', '🐯', '🐻', '🐼', '🐨', '🐱', '🐶', '🦊', '🐮',
  '🌟', '⭐', '🌙', '☀️', '🌈', '🔥', '💎', '👑', '🎨'
];

const ProfileSettings = ({ userEmail, onClose, onUpdate, language = 'en' }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile picture
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileInputRef = useRef(null);

  // Data management
  const [importing, setImporting] = useState(false);
  const dataFileInputRef = useRef(null);

  const translations = {
    en: {
      title: 'Profile Settings',
      profile: 'Profile',
      security: 'Security',
      picture: 'Picture',
      data: 'Data',
      preferences: 'Preferences',
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      bio: 'Bio',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      changePassword: 'Change Password',
      uploadPhoto: 'Upload Photo',
      chooseAvatar: 'Choose Avatar',
      removePhoto: 'Remove Photo',
      save: 'Save Changes',
      cancel: 'Cancel',
      success: 'Settings saved successfully!',
      error: 'Please check all fields',
      passwordMismatch: 'Passwords do not match',
      passwordWeak: 'Password must be at least 6 characters',
      invalidEmail: 'Invalid email address',
      role: 'Account Type',
      joinedDate: 'Member Since',
      accountInfo: 'Account Information',
      close: 'Close',
      exportTitle: 'Export Your Data',
      exportDesc: 'Download all your learning progress, points, and achievements',
      exportButton: 'Download Data',
      importTitle: 'Import Data',
      importDesc: 'Restore your data from a previously exported file',
      importButton: 'Choose File',
      clearTitle: 'Clear All Data',
      clearDesc: 'Permanently delete all your data (cannot be undone)',
      clearButton: 'Delete All Data',
      importSuccess: 'Data imported successfully!',
      importError: 'Failed to import data',
      exportSuccess: 'Data exported successfully!'
    },
    ar: {
      title: 'إعدادات الملف الشخصي',
      profile: 'الملف الشخصي',
      security: 'الأمان',
      picture: 'الصورة',
      data: 'البيانات',
      preferences: 'التفضيلات',
      name: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      bio: 'نبذة',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
      changePassword: 'تغيير كلمة المرور',
      uploadPhoto: 'تحميل صورة',
      chooseAvatar: 'اختر أفاتار',
      removePhoto: 'إزالة الصورة',
      save: 'حفظ التغييرات',
      cancel: 'إلغاء',
      success: 'تم حفظ الإعدادات بنجاح!',
      error: 'يرجى التحقق من جميع الحقول',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      passwordWeak: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
      invalidEmail: 'عنوان بريد إلكتروني غير صالح',
      role: 'نوع الحساب',
      joinedDate: 'عضو منذ',
      accountInfo: 'معلومات الحساب',
      close: 'إغلاق',
      exportTitle: 'تصدير البيانات',
      exportDesc: 'تحميل جميع تقدمك ونقاطك وإنجازاتك',
      exportButton: 'تحميل البيانات',
      importTitle: 'استيراد البيانات',
      importDesc: 'استعادة بياناتك من ملف محفوظ سابقاً',
      importButton: 'اختر ملف',
      clearTitle: 'مسح جميع البيانات',
      clearDesc: 'حذف جميع بياناتك بشكل نهائي (لا يمكن التراجع)',
      clearButton: 'حذف جميع البيانات',
      importSuccess: 'تم استيراد البيانات بنجاح!',
      importError: 'فشل استيراد البيانات',
      exportSuccess: 'تم تصدير البيانات بنجاح!'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadUserData();
  }, [userEmail]);

  const loadUserData = () => {
    try {
      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const user = users[userEmail.toLowerCase()];

      if (user) {
        setUserData(user);
        setName(user.name || '');
        setEmail(userEmail);
        setPhone(user.phone || '');
        setBio(user.bio || '');
        setProfilePicture(user.profilePicture || null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSaveProfile = () => {
    try {
      if (!name.trim()) {
        toast.error(t.error);
        return;
      }

      setLoading(true);
      playClickSound();

      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const userKey = userEmail.toLowerCase();

      if (users[userKey]) {
        users[userKey] = {
          ...users[userKey],
          name: name.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem('mumayaz_users', JSON.stringify(users));

        // Update session
        const session = JSON.parse(localStorage.getItem('mumayaz_session') || '{}');
        if (session.email && session.email.toLowerCase() === userKey) {
          session.name = name.trim();
          localStorage.setItem('mumayaz_session', JSON.stringify(session));
        }

        playSuccessSound();
        toast.success(t.success);
        loadUserData();

        if (onUpdate) onUpdate();
        window.dispatchEvent(new Event('userDataUpdated'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error(t.error);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error(t.passwordMismatch);
        return;
      }

      if (newPassword.length < 6) {
        toast.warning(t.passwordWeak);
        return;
      }

      setLoading(true);
      playClickSound();

      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const userKey = userEmail.toLowerCase();

      if (users[userKey]) {
        // Verify current password
        if (users[userKey].password !== currentPassword) {
          toast.error('Current password is incorrect');
          setLoading(false);
          return;
        }

        users[userKey].password = newPassword;
        users[userKey].passwordUpdatedAt = new Date().toISOString();
        localStorage.setItem('mumayaz_users', JSON.stringify(users));

        playSuccessSound();
        toast.success('Password changed successfully!');

        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      playClickSound();
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = maxSize;
          canvas.height = maxSize;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, maxSize, maxSize);
          const x = (maxSize - width) / 2;
          const y = (maxSize - height) / 2;
          ctx.drawImage(img, x, y, width, height);

          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          updateProfilePicture(resizedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = (avatar) => {
    playClickSound();
    setSelectedAvatar(avatar);
    updateProfilePicture(avatar);
    setShowAvatarPicker(false);
  };

  const updateProfilePicture = (imageData) => {
    try {
      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const userKey = userEmail.toLowerCase();

      if (users[userKey]) {
        users[userKey].profilePicture = imageData;
        localStorage.setItem('mumayaz_users', JSON.stringify(users));
        setProfilePicture(imageData);
        playSuccessSound();
        window.dispatchEvent(new Event('profilePictureUpdated'));
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  };

  const handleRemovePhoto = () => {
    playClickSound();
    updateProfilePicture(null);
  };

  // Data Management handlers
  const handleExport = () => {
    playClickSound();
    const success = exportUserData(userEmail);
    if (success) {
      playSuccessSound();
      toast.success(t.exportSuccess);
    }
  };

  const handleImportClick = () => {
    playClickSound();
    dataFileInputRef.current?.click();
  };

  const handleDataFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    playClickSound();

    try {
      await importUserData(file, userEmail);
      playSuccessSound();
      toast.success(t.importSuccess);

      // Reload page to reflect imported data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Import error:', error);
      playErrorSound();
      toast.error(`${t.importError}: ${error.message}`);
    } finally {
      setImporting(false);
      // Reset file input
      if (dataFileInputRef.current) {
        dataFileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = () => {
    playClickSound();
    const success = clearAllUserData(userEmail);
    if (success) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      student: language === 'ar' ? 'طالب' : 'Student',
      teacher: language === 'ar' ? 'معلم' : 'Teacher',
      parent: language === 'ar' ? 'ولي أمر' : 'Parent',
      child: language === 'ar' ? 'طفل' : 'Child'
    };
    return roles[role] || role;
  };

  return (
    <motion.div
      className="profile-settings-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="profile-settings-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="profile-settings-header">
          <h2>⚙️ {t.title}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="profile-settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { playClickSound(); setActiveTab('profile'); }}
          >
            👤 {t.profile}
          </button>
          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => { playClickSound(); setActiveTab('security'); }}
          >
            🔒 {t.security}
          </button>
          <button
            className={`tab-btn ${activeTab === 'picture' ? 'active' : ''}`}
            onClick={() => { playClickSound(); setActiveTab('picture'); }}
          >
            🖼️ {t.picture}
          </button>
          <button
            className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => { playClickSound(); setActiveTab('data'); }}
          >
            💾 {t.data}
          </button>
        </div>

        <div className="profile-settings-content">
          {activeTab === 'profile' && (
            <motion.div
              className="settings-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Account Info */}
              <div className="account-info-section">
                <h3>{t.accountInfo}</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>{t.role}</label>
                    <div className="info-value">
                      {getRoleLabel(userData?.role)}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>{t.joinedDate}</label>
                    <div className="info-value">
                      {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="form-section">
                <div className="form-group">
                  <label>{t.name}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.name}
                  />
                </div>

                <div className="form-group">
                  <label>{t.email}</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="disabled-input"
                    title="Email cannot be changed"
                  />
                </div>

                <div className="form-group">
                  <label>{t.phone}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phone}
                  />
                </div>

                <div className="form-group">
                  <label>{t.bio}</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t.bio}
                    rows="4"
                  />
                </div>

                <button
                  className="save-btn"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  💾 {t.save}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              className="settings-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3>{t.changePassword}</h3>

              <div className="form-section">
                <div className="form-group">
                  <label>{t.currentPassword}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t.currentPassword}
                  />
                </div>

                <div className="form-group">
                  <label>{t.newPassword}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.newPassword}
                  />
                </div>

                <div className="form-group">
                  <label>{t.confirmPassword}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPassword}
                  />
                </div>

                <button
                  className="save-btn security-btn"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  🔒 {t.changePassword}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'picture' && (
            <motion.div
              className="settings-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="picture-section">
                <div className="current-picture-display">
                  <h3>Current Picture</h3>
                  <div className="picture-preview-large">
                    {profilePicture ? (
                      profilePicture.startsWith('data:') ? (
                        <img src={profilePicture} alt="Profile" />
                      ) : (
                        <div className="emoji-avatar-large">{profilePicture}</div>
                      )
                    ) : (
                      <div className="no-picture-large">👤</div>
                    )}
                  </div>
                </div>

                <div className="picture-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  <button
                    className="picture-btn upload-btn"
                    onClick={() => {
                      playClickSound();
                      fileInputRef.current?.click();
                    }}
                  >
                    📤 {t.uploadPhoto}
                  </button>

                  <button
                    className="picture-btn avatar-btn"
                    onClick={() => {
                      playClickSound();
                      setShowAvatarPicker(!showAvatarPicker);
                    }}
                  >
                    😀 {t.chooseAvatar}
                  </button>

                  {profilePicture && (
                    <button
                      className="picture-btn remove-btn"
                      onClick={handleRemovePhoto}
                    >
                      🗑️ {t.removePhoto}
                    </button>
                  )}
                </div>

                {showAvatarPicker && (
                  <motion.div
                    className="avatar-picker-section"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h4>{t.chooseAvatar}</h4>
                    <div className="avatars-grid">
                      {DEFAULT_AVATARS.map((avatar, index) => (
                        <motion.button
                          key={index}
                          className={`avatar-option ${profilePicture === avatar ? 'selected' : ''}`}
                          onClick={() => handleAvatarSelect(avatar)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {avatar}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div
              className="settings-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="data-management-section">
                {/* Export Section */}
                <motion.div
                  className="data-option-card export-card"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="data-card-icon">📥</div>
                  <h3>{t.exportTitle}</h3>
                  <p className="data-card-description">{t.exportDesc}</p>
                  <button
                    className="data-action-btn export-btn"
                    onClick={handleExport}
                  >
                    {t.exportButton}
                  </button>
                </motion.div>

                {/* Import Section */}
                <motion.div
                  className="data-option-card import-card"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="data-card-icon">📤</div>
                  <h3>{t.importTitle}</h3>
                  <p className="data-card-description">{t.importDesc}</p>
                  <input
                    type="file"
                    ref={dataFileInputRef}
                    accept=".json"
                    onChange={handleDataFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="data-action-btn import-btn"
                    onClick={handleImportClick}
                    disabled={importing}
                  >
                    {importing ? '⏳ Loading...' : t.importButton}
                  </button>
                </motion.div>

                {/* Clear Data Section */}
                <motion.div
                  className="data-option-card clear-card"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="data-card-icon">🗑️</div>
                  <h3>{t.clearTitle}</h3>
                  <p className="data-card-description danger-text">{t.clearDesc}</p>
                  <button
                    className="data-action-btn clear-btn"
                    onClick={handleClearData}
                  >
                    {t.clearButton}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileSettings;
