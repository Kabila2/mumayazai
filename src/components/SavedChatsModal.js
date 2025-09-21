// src/components/SavedChatsModal.js - Saved Chats Management Modal

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSavedChats,
  deleteSavedChat,
  updateSavedChat,
  searchSavedChats,
  getChatsByTag,
  getAllTags,
  exportSavedChats,
  importSavedChats,
  getChatStatistics
} from '../utils/savedChatsUtils';

const SavedChatsModal = ({
  isOpen,
  onClose,
  onLoadChat,
  t = {},
  language = "en",
  reducedMotion = false
}) => {
  const [savedChats, setSavedChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingChat, setEditingChat] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);

  // Load saved chats
  const loadChats = useCallback(() => {
    setIsLoading(true);
    try {
      const chats = getSavedChats();
      setSavedChats(chats);
      setFilteredChats(chats);
      setAllTags(getAllTags());
      setStats(getChatStatistics());
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen, loadChats]);

  // Filter chats based on search and tag
  useEffect(() => {
    let filtered = savedChats;

    if (searchQuery.trim()) {
      filtered = searchSavedChats(searchQuery);
    }

    if (selectedTag) {
      filtered = filtered.filter(chat => chat.tags.includes(selectedTag));
    }

    setFilteredChats(filtered);
  }, [searchQuery, selectedTag, savedChats]);

  const handleDeleteChat = async (chatId) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه المحادثة؟' : 'Are you sure you want to delete this chat?')) {
      const result = deleteSavedChat(chatId);
      if (result.success) {
        loadChats();
      }
    }
  };

  const handleRenameChat = (chatId, newTitle) => {
    const result = updateSavedChat(chatId, { title: newTitle });
    if (result.success) {
      loadChats();
      setEditingChat(null);
    }
  };

  const handleLoadChat = (chat) => {
    onLoadChat(chat);
    onClose();
  };

  const handleExport = () => {
    const result = exportSavedChats();
    if (result.success) {
      alert(language === 'ar' ? 'تم تصدير المحادثات بنجاح!' : 'Chats exported successfully!');
    } else {
      alert(language === 'ar' ? 'حدث خطأ في التصدير' : 'Error exporting chats');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = importSavedChats(e.target.result);
          if (result.success) {
            alert(language === 'ar' ?
              `تم استيراد ${result.imported} محادثة بنجاح!` :
              `Successfully imported ${result.imported} chats!`
            );
            loadChats();
          } else {
            alert(language === 'ar' ? 'حدث خطأ في الاستيراد' : 'Error importing chats');
          }
        } catch (error) {
          alert(language === 'ar' ? 'ملف غير صالح' : 'Invalid file format');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = ''; // Reset file input
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return language === 'ar' ? 'اليوم' : 'Today';
    } else if (diffInDays === 1) {
      return language === 'ar' ? 'أمس' : 'Yesterday';
    } else if (diffInDays < 7) {
      return language === 'ar' ? `منذ ${diffInDays} أيام` : `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="saved-chats-overlay"
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
          className="saved-chats-modal"
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
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
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
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#333'
            }}>
              {language === 'ar' ? 'المحادثات المحفوظة' : 'Saved Chats'}
            </h2>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowStats(!showStats)}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
                title={language === 'ar' ? 'الإحصائيات' : 'Statistics'}
              >
                📊
              </button>

              <button
                onClick={handleExport}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
                title={language === 'ar' ? 'تصدير' : 'Export'}
              >
                📤
              </button>

              <label style={{
                padding: '0.5rem',
                background: 'transparent',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}>
                📥
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Statistics Panel */}
          {showStats && stats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(102, 126, 234, 0.1)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#667eea' }}>
                  {stats.totalChats}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {language === 'ar' ? 'إجمالي المحادثات' : 'Total Chats'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#667eea' }}>
                  {stats.totalMessages}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {language === 'ar' ? 'إجمالي الرسائل' : 'Total Messages'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#667eea' }}>
                  {stats.averageMessagesPerChat}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {language === 'ar' ? 'متوسط الرسائل' : 'Avg Messages'}
                </div>
              </div>
            </motion.div>
          )}

          {/* Search and Filter */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'البحث في المحادثات...' : 'Search chats...'}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                minWidth: '200px'
              }}
            />

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                minWidth: '120px'
              }}
            >
              <option value="">
                {language === 'ar' ? 'جميع العلامات' : 'All Tags'}
              </option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Chat List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : filteredChats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                {searchQuery || selectedTag ?
                  (language === 'ar' ? 'لا توجد محادثات مطابقة' : 'No matching chats found') :
                  (language === 'ar' ? 'لا توجد محادثات محفوظة' : 'No saved chats yet')
                }
              </div>
            ) : (
              filteredChats.map((chat) => (
                <motion.div
                  key={chat.id}
                  className="saved-chat-item"
                  whileHover={!reducedMotion ? { scale: 1.02, y: -2 } : {}}
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '16px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onClick={() => handleLoadChat(chat)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: language === 'ar' ? 0 : '1rem', marginLeft: language === 'ar' ? '1rem' : 0 }}>
                      {editingChat === chat.id ? (
                        <input
                          type="text"
                          defaultValue={chat.title}
                          onBlur={(e) => handleRenameChat(chat.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameChat(chat.id, e.target.value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '0.25rem',
                            border: '1px solid #667eea',
                            borderRadius: '4px',
                            fontSize: '1.1rem',
                            fontWeight: '600'
                          }}
                        />
                      ) : (
                        <h3 style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#333',
                          lineHeight: '1.4'
                        }}>
                          {chat.title}
                        </h3>
                      )}

                      <p style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem',
                        color: '#666',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {chat.summary}
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        color: '#888'
                      }}>
                        <span>
                          {chat.messageCount} {language === 'ar' ? 'رسالة' : 'messages'} • {formatDate(chat.createdAt)}
                        </span>

                        {chat.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {chat.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                style={{
                                  background: 'rgba(102, 126, 234, 0.2)',
                                  color: '#667eea',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChat(chat.id);
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontSize: '0.9rem'
                        }}
                        title={language === 'ar' ? 'إعادة تسمية' : 'Rename'}
                      >
                        ✏️
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          color: '#dc3545'
                        }}
                        title={language === 'ar' ? 'حذف' : 'Delete'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SavedChatsModal;