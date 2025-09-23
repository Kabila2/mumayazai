// src/components/SaveVoiceChatModal.js - Save Voice Chat Dialog

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveVoiceChat, getAllVoiceTags } from '../utils/savedVoiceChatsUtils';

const SaveVoiceChatModal = ({
  isOpen,
  onClose,
  onSave,
  messages = [],
  t = {},
  language = "en",
  reducedMotion = false
}) => {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [existingTags] = useState(() => getAllVoiceTags());

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = saveVoiceChat(messages, title.trim() || null, tags);

      if (result.success) {
        onSave?.({
          success: true,
          chatId: result.chatId,
          title: result.title
        });
        onClose();

        // Reset form
        setTitle('');
        setTags([]);
        setNewTag('');
      } else {
        alert(language === 'ar' ? 'حدث خطأ في حفظ المحادثة الصوتية' : 'Error saving voice chat');
      }
    } catch (error) {
      console.error('Error saving voice chat:', error);
      alert(language === 'ar' ? 'حدث خطأ في حفظ المحادثة الصوتية' : 'Error saving voice chat');
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (tagName) => {
    const trimmedTag = tagName.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleNewTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="save-voice-chat-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <motion.div
          className="save-voice-chat-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🎤 {language === 'ar' ? 'حفظ المحادثة الصوتية' : 'Save Voice Chat'}
            </h2>

            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '1.2rem',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              ✕
            </button>
          </div>

          {/* Voice Chat Info */}
          <div style={{
            background: 'rgba(138, 43, 226, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎙️ {language === 'ar' ?
                `${messages.length} رسالة صوتية في هذه المحادثة` :
                `${messages.length} voice messages in this conversation`
              }
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Title Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#444'
            }}>
              {language === 'ar' ? 'عنوان المحادثة الصوتية' : 'Voice Chat Title'}
              <span style={{ color: '#888', fontWeight: '400', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                ({language === 'ar' ? 'اختياري' : 'optional'})
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ar' ?
                'سيتم إنشاء عنوان تلقائياً إذا ترك فارغاً' :
                'Auto-generated if left empty'
              }
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                opacity: isSaving ? 0.7 : 1
              }}
            />
          </div>

          {/* Tags Section */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#444'
            }}>
              {language === 'ar' ? 'العلامات' : 'Tags'}
              <span style={{ color: '#888', fontWeight: '400', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                ({language === 'ar' ? 'اختياري' : 'optional'})
              </span>
            </label>

            {/* Selected Tags */}
            {tags.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                {tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      background: 'rgba(138, 43, 226, 0.2)',
                      color: '#8a2be2',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '16px',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      disabled={isSaving}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8a2be2',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        padding: 0,
                        opacity: isSaving ? 0.5 : 1
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleNewTagKeyPress}
                placeholder={language === 'ar' ? 'أضف علامة جديدة...' : 'Add a tag...'}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  opacity: isSaving ? 0.7 : 1
                }}
              />
              <button
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim() || isSaving}
                style={{
                  padding: '0.5rem 1rem',
                  background: newTag.trim() && !isSaving ? '#8a2be2' : 'rgba(0, 0, 0, 0.1)',
                  color: newTag.trim() && !isSaving ? 'white' : '#999',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newTag.trim() && !isSaving ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                +
              </button>
            </div>

            {/* Existing Tags Suggestions */}
            {existingTags.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#666',
                  marginBottom: '0.25rem'
                }}>
                  {language === 'ar' ? 'العلامات المتاحة:' : 'Available tags:'}
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem'
                }}>
                  {existingTags.filter(tag => !tags.includes(tag)).slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      disabled={isSaving}
                      style={{
                        background: 'rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        color: '#666',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isSaving ? 0.5 : 1
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                color: '#666',
                borderRadius: '12px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || messages.length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                background: !isSaving && messages.length > 0 ?
                  'linear-gradient(135deg, #8a2be2, #9932cc)' :
                  'rgba(0, 0, 0, 0.1)',
                color: !isSaving && messages.length > 0 ? 'white' : '#999',
                border: 'none',
                borderRadius: '12px',
                cursor: !isSaving && messages.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '1rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSaving && (
                <span style={{
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block'
                }}>
                  ⏳
                </span>
              )}
              {isSaving ?
                (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') :
                (language === 'ar' ? 'حفظ المحادثة الصوتية' : 'Save Voice Chat')
              }
            </button>
          </div>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SaveVoiceChatModal;