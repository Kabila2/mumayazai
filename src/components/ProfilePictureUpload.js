import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound, playSuccessSound, playPopSound } from '../utils/soundEffects';
import './ProfilePictureUpload.css';

const DEFAULT_AVATARS = [
  '👤', '🧑‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍💼', '👨‍💻', '👩‍💻',
  '🦁', '🐯', '🐻', '🐼', '🐨', '🐱', '🐶', '🦊', '🐮',
  '🌟', '⭐', '🌙', '☀️', '🌈', '🔥', '💎', '👑', '🎨'
];

const ProfilePictureUpload = ({ currentUser, onUpdate, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentPicture, setCurrentPicture] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'avatars'
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load current profile picture
    const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
    const user = users[currentUser.toLowerCase()];
    if (user?.profilePicture) {
      setCurrentPicture(user.profilePicture);
    }
  }, [currentUser]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      playClickSound();
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Resize image to max 300x300
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

          // Center the image
          const x = (maxSize - width) / 2;
          const y = (maxSize - height) / 2;

          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, maxSize, maxSize);

          // Draw image
          ctx.drawImage(img, x, y, width, height);

          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setSelectedImage(resizedDataUrl);
          setPreviewUrl(resizedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = (avatar) => {
    playClickSound();
    setSelectedImage(avatar);
    setPreviewUrl(null);
  };

  const handleSave = () => {
    if (!selectedImage) {
      alert('Please select an image or avatar');
      return;
    }

    playSuccessSound();

    // Update user profile in localStorage
    const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
    const userKey = currentUser.toLowerCase();
    if (users[userKey]) {
      users[userKey].profilePicture = selectedImage;
      localStorage.setItem('mumayaz_users', JSON.stringify(users));
    }

    // Call parent callback
    if (onUpdate) {
      onUpdate(selectedImage);
    }

    // Dispatch event for other components to update
    window.dispatchEvent(new Event('profilePictureUpdated'));

    if (onClose) {
      onClose();
    }
  };

  const handleRemove = () => {
    playClickSound();

    const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
    const userKey = currentUser.toLowerCase();
    if (users[userKey]) {
      delete users[userKey].profilePicture;
      localStorage.setItem('mumayaz_users', JSON.stringify(users));
    }

    setCurrentPicture(null);
    setSelectedImage(null);
    setPreviewUrl(null);

    if (onUpdate) {
      onUpdate(null);
    }

    window.dispatchEvent(new Event('profilePictureUpdated'));
  };

  return (
    <motion.div
      className="profile-picture-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="profile-picture-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-picture-header">
          <h2>🖼️ Profile Picture</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="profile-picture-tabs">
          <button
            className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('upload');
              playClickSound();
            }}
          >
            📤 Upload Image
          </button>
          <button
            className={`tab-button ${activeTab === 'avatars' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('avatars');
              playClickSound();
            }}
          >
            😀 Choose Avatar
          </button>
        </div>

        <div className="profile-picture-content">
          {/* Current Picture Preview */}
          <div className="current-picture-preview">
            <h3>Current Picture</h3>
            <div className="picture-display">
              {currentPicture ? (
                currentPicture.startsWith('data:') ? (
                  <img src={currentPicture} alt="Current" />
                ) : (
                  <div className="emoji-avatar">{currentPicture}</div>
                )
              ) : (
                <div className="no-picture">No picture set</div>
              )}
            </div>
          </div>

          {activeTab === 'upload' ? (
            <div className="upload-section">
              <h3>Upload New Picture</h3>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                className="upload-button"
                onClick={() => {
                  fileInputRef.current?.click();
                  playClickSound();
                }}
              >
                📁 Choose File
              </button>
              <p className="upload-hint">Max size: 5MB • JPG, PNG, GIF</p>

              {previewUrl && (
                <div className="preview-section">
                  <h3>Preview</h3>
                  <div className="picture-display">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="avatars-section">
              <h3>Choose Avatar</h3>
              <div className="avatars-grid">
                {DEFAULT_AVATARS.map((avatar, index) => (
                  <motion.button
                    key={index}
                    className={`avatar-option ${selectedImage === avatar ? 'selected' : ''}`}
                    onClick={() => handleAvatarSelect(avatar)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {avatar}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="profile-picture-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          {currentPicture && (
            <button className="remove-button" onClick={handleRemove}>
              🗑️ Remove
            </button>
          )}
          <button
            className="save-button"
            onClick={handleSave}
            disabled={!selectedImage}
          >
            💾 Save Picture
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePictureUpload;
