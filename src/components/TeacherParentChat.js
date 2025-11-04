import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TeacherParentChat.css';
import NewConversationModal from './NewConversationModal';

const TeacherParentChat = ({ currentUserEmail, userRole, language = 'en', onBack }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);

  const translations = {
    en: {
      title: 'Teacher-Parent Communication',
      noConversations: 'No conversations yet',
      selectConversation: 'Select a conversation to start chatting',
      typeMessage: 'Type your message...',
      send: 'Send',
      sending: 'Sending...',
      teacher: 'Teacher',
      parent: 'Parent',
      newConversation: 'New Conversation',
      searchPlaceholder: 'Search conversations...',
      today: 'Today',
      yesterday: 'Yesterday',
      online: 'Online',
      offline: 'Offline',
      typing: 'typing...',
      you: 'You',
      deleteConversation: 'Delete Conversation',
      archiveConversation: 'Archive',
      markAsRead: 'Mark as Read',
      noMessages: 'No messages yet. Start the conversation!',
      messageSent: 'Message sent',
      pressEnter: 'Press Enter to send',
      newMessages: 'new messages',
      attachFile: 'Attach File',
      filesSelected: 'files selected',
      removeFile: 'Remove',
      download: 'Download',
      attachment: 'Attachment'
    },
    ar: {
      title: 'التواصل بين المعلمين والأهل',
      noConversations: 'لا توجد محادثات بعد',
      selectConversation: 'اختر محادثة للبدء',
      typeMessage: 'اكتب رسالتك...',
      send: 'إرسال',
      sending: 'جاري الإرسال...',
      teacher: 'معلم',
      parent: 'ولي أمر',
      newConversation: 'محادثة جديدة',
      searchPlaceholder: 'البحث في المحادثات...',
      today: 'اليوم',
      yesterday: 'أمس',
      online: 'متصل',
      offline: 'غير متصل',
      typing: 'يكتب...',
      you: 'أنت',
      deleteConversation: 'حذف المحادثة',
      archiveConversation: 'أرشفة',
      markAsRead: 'وضع علامة كمقروء',
      noMessages: 'لا توجد رسائل بعد. ابدأ المحادثة!',
      messageSent: 'تم إرسال الرسالة',
      pressEnter: 'اضغط Enter للإرسال',
      newMessages: 'رسائل جديدة',
      attachFile: 'إرفاق ملف',
      filesSelected: 'ملفات محددة',
      removeFile: 'إزالة',
      download: 'تحميل',
      attachment: 'مرفق'
    }
  };

  const t = translations[language] || translations.en;

  // Auto-refresh conversations and messages
  useEffect(() => {
    loadConversations();

    // Set up auto-refresh every 3 seconds
    autoRefreshIntervalRef.current = setInterval(() => {
      loadConversations();
      if (selectedConversation) {
        loadMessages(selectedConversation.id, true); // Silent reload
      }
    }, 3000);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [currentUserEmail, selectedConversation]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calculate total unread count
  useEffect(() => {
    const total = conversations.reduce((sum, conv) => {
      const unread = conv.unreadCount || 0;
      return sum + unread;
    }, 0);
    setTotalUnreadCount(total);

    // Update global storage for nav badge
    try {
      localStorage.setItem('mumayaz_unread_messages', total.toString());
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = useCallback(() => {
    try {
      const stored = localStorage.getItem('mumayaz_conversations') || '{}';
      const allConversations = JSON.parse(stored);

      // Filter and process conversations
      const userConversations = Object.entries(allConversations)
        .filter(([conversationId, conv]) => {
          return conv.participants.includes(currentUserEmail) && !conv.archived;
        })
        .map(([id, conv]) => {
          const otherParticipant = conv.participants.find(email => email !== currentUserEmail);

          // Calculate unread count
          const messagesKey = `mumayaz_messages_${id}`;
          const messagesStored = localStorage.getItem(messagesKey) || '[]';
          const convMessages = JSON.parse(messagesStored);
          const unreadCount = convMessages.filter(msg =>
            !msg.read && msg.sender !== currentUserEmail
          ).length;

          return {
            id,
            ...conv,
            otherParticipant,
            unreadCount
          };
        })
        .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [currentUserEmail]);

  const loadMessages = useCallback((conversationId, silent = false) => {
    try {
      const stored = localStorage.getItem(`mumayaz_messages_${conversationId}`) || '[]';
      const conversationMessages = JSON.parse(stored);

      if (!silent) {
        setMessages(conversationMessages);
      } else {
        // Silent update - only update if there are new messages
        setMessages(prev => {
          if (prev.length !== conversationMessages.length) {
            return conversationMessages;
          }
          return prev;
        });
      }

      // Mark messages as read
      markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  const markMessagesAsRead = useCallback((conversationId) => {
    try {
      const stored = localStorage.getItem(`mumayaz_messages_${conversationId}`) || '[]';
      const conversationMessages = JSON.parse(stored);

      const updatedMessages = conversationMessages.map(msg => ({
        ...msg,
        read: msg.sender !== currentUserEmail ? true : msg.read
      }));

      localStorage.setItem(`mumayaz_messages_${conversationId}`, JSON.stringify(updatedMessages));

      // Update unread count in conversation
      updateConversationUnreadCount(conversationId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [currentUserEmail]);

  const updateConversationUnreadCount = useCallback((conversationId) => {
    try {
      const stored = localStorage.getItem('mumayaz_conversations') || '{}';
      const allConversations = JSON.parse(stored);

      if (allConversations[conversationId]) {
        allConversations[conversationId].unreadCount = 0;
        localStorage.setItem('mumayaz_conversations', JSON.stringify(allConversations));
        loadConversations();
      }
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  }, [loadConversations]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation || isSending) return;

    setIsSending(true);

    try {
      // Convert files to base64
      const attachments = await Promise.all(
        selectedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await convertFileToBase64(file)
        }))
      );

      const message = {
        id: Date.now(),
        sender: currentUserEmail,
        text: newMessage.trim(),
        timestamp: Date.now(),
        read: false,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      // Add message to conversation
      const stored = localStorage.getItem(`mumayaz_messages_${selectedConversation.id}`) || '[]';
      const conversationMessages = JSON.parse(stored);
      conversationMessages.push(message);
      localStorage.setItem(`mumayaz_messages_${selectedConversation.id}`, JSON.stringify(conversationMessages));

      // Update conversation's last message
      const allConversationsStored = localStorage.getItem('mumayaz_conversations') || '{}';
      const allConversations = JSON.parse(allConversationsStored);

      if (allConversations[selectedConversation.id]) {
        allConversations[selectedConversation.id].lastMessage = newMessage.trim();
        allConversations[selectedConversation.id].lastMessageTime = Date.now();
        allConversations[selectedConversation.id].lastSender = currentUserEmail;
        localStorage.setItem('mumayaz_conversations', JSON.stringify(allConversations));
      }

      // Update local state
      setMessages([...messages, message]);
      setNewMessage('');
      setSelectedFiles([]);
      loadConversations();

      // Clear typing indicator
      setIsTyping(false);

      // Success feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Focus back on input
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    // Typing indicator
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit

    if (validFiles.length < files.length) {
      alert(language === 'ar' ? 'بعض الملفات تتجاوز 5 ميجابايت' : 'Some files exceed 5MB limit');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const getParticipantName = (email) => {
    try {
      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const user = users[email?.toLowerCase()];
      return user?.name || email || 'Unknown User';
    } catch (error) {
      return email || 'Unknown User';
    }
  };

  const getParticipantRole = (email) => {
    try {
      const users = JSON.parse(localStorage.getItem('mumayaz_users') || '{}');
      const user = users[email?.toLowerCase()];
      return user?.role || 'user';
    } catch (error) {
      return 'user';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return language === 'ar' ? 'الآن' : 'Just now';
    } else if (diffMins < 60) {
      return language === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays === 1) {
      return t.yesterday;
    } else if (diffDays < 7) {
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const createNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (conversationId) => {
    loadConversations();

    setTimeout(() => {
      const stored = localStorage.getItem('mumayaz_conversations') || '{}';
      const allConversations = JSON.parse(stored);
      const newConv = allConversations[conversationId];

      if (newConv) {
        setSelectedConversation({
          id: conversationId,
          ...newConv,
          otherParticipant: newConv.participants.find(email => email !== currentUserEmail)
        });
      }
    }, 100);
  };

  const handleDeleteConversation = (conversationId) => {
    if (window.confirm(language === 'ar' ? 'هل تريد حذف هذه المحادثة؟' : 'Delete this conversation?')) {
      try {
        const stored = localStorage.getItem('mumayaz_conversations') || '{}';
        const conversations = JSON.parse(stored);
        delete conversations[conversationId];
        localStorage.setItem('mumayaz_conversations', JSON.stringify(conversations));

        localStorage.removeItem(`mumayaz_messages_${conversationId}`);

        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }

        loadConversations();
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm.trim()) return true;
    const name = getParticipantName(conv.otherParticipant).toLowerCase();
    const lastMessage = conv.lastMessage?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || lastMessage.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="teacher-parent-chat" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.header
        className="chat-comm-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          {onBack && (
            <motion.button
              className="back-button"
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{language === 'ar' ? '→' : '←'}</span>
              <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
            </motion.button>
          )}
          <div className="header-title-wrapper">
            <h1 className="chat-comm-title">{t.title}</h1>
            {totalUnreadCount > 0 && (
              <motion.div
                className="header-unread-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                {totalUnreadCount}
              </motion.div>
            )}
          </div>
          <motion.button
            className="new-conversation-btn"
            onClick={createNewConversation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>➕</span>
            <span className="btn-text">{t.newConversation}</span>
          </motion.button>
        </div>
      </motion.header>

      <div className="chat-comm-container">
        {/* Conversations List */}
        <motion.div
          className="conversations-sidebar"
          initial={{ x: language === 'ar' ? 50 : -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Search Bar */}
          <div className="conversation-search">
            <input
              type="text"
              className="search-input-small"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon-small">🔍</span>
          </div>

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="no-conversations">
                <div className="empty-state-icon">💬</div>
                <p>{searchTerm ? (language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found') : t.noConversations}</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredConversations.map((conv, index) => (
                  <motion.div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                    onClick={() => setSelectedConversation(conv)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: language === 'ar' ? -5 : 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="conversation-avatar">
                      {getParticipantRole(conv.otherParticipant) === 'teacher' ? '👨‍🏫' : '👨‍👩‍👧‍👦'}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <span className="conversation-name">
                          {getParticipantName(conv.otherParticipant)}
                        </span>
                        <span className="conversation-role-badge">
                          {getParticipantRole(conv.otherParticipant) === 'teacher' ? t.teacher : t.parent}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <span className="last-message">
                          {conv.lastSender === currentUserEmail ? `${t.you}: ` : ''}
                          {conv.lastMessage || (language === 'ar' ? 'لا توجد رسائل' : 'No messages yet')}
                        </span>
                        {conv.unreadCount > 0 && (
                          <motion.span
                            className="unread-badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' }}
                          >
                            {conv.unreadCount}
                          </motion.span>
                        )}
                      </div>
                      <span className="conversation-time">
                        {formatTime(conv.lastMessageTime || conv.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Messages Area */}
        <motion.div
          className="messages-area"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {!selectedConversation ? (
            <div className="no-conversation-selected">
              <div className="empty-state-icon">💭</div>
              <p>{t.selectConversation}</p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="conversation-header-bar">
                <div className="participant-info">
                  <div className="participant-avatar-large">
                    {getParticipantRole(selectedConversation.otherParticipant) === 'teacher' ? '👨‍🏫' : '👨‍👩‍👧‍👦'}
                  </div>
                  <div className="participant-details">
                    <h3>{getParticipantName(selectedConversation.otherParticipant)}</h3>
                    <span className="participant-role">
                      {getParticipantRole(selectedConversation.otherParticipant) === 'teacher' ? t.teacher : t.parent}
                    </span>
                  </div>
                </div>
                <button
                  className="delete-conversation-btn"
                  onClick={() => handleDeleteConversation(selectedConversation.id)}
                  title={t.deleteConversation}
                >
                  🗑️
                </button>
              </div>

              {/* Messages List */}
              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <div className="empty-state-icon">📨</div>
                    <p>{t.noMessages}</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        className={`message-bubble-container ${msg.sender === currentUserEmail ? 'sent' : 'received'}`}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <div className="message-bubble">
                          {msg.text && <p className="message-text">{msg.text}</p>}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="message-attachments">
                              {msg.attachments.map((attachment, attIndex) => (
                                <div key={attIndex} className="attachment-item">
                                  <span className="attachment-icon">
                                    {attachment.type.startsWith('image/') ? '🖼️' : '📄'}
                                  </span>
                                  <div className="attachment-info">
                                    <span className="attachment-name">{attachment.name}</span>
                                    <span className="attachment-size">
                                      ({Math.round(attachment.size / 1024)}KB)
                                    </span>
                                  </div>
                                  <a
                                    href={attachment.data}
                                    download={attachment.name}
                                    className="download-attachment-btn"
                                    title={t.download}
                                  >
                                    ⬇️
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="message-meta">
                            <span className="message-time">{formatTime(msg.timestamp)}</span>
                            {msg.sender === currentUserEmail && (
                              <span className="message-status">
                                {msg.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="message-input-area">
                {selectedFiles.length > 0 && (
                  <div className="selected-files-preview">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-preview-item">
                        <span className="file-icon">📎</span>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({Math.round(file.size / 1024)}KB)</span>
                        <button
                          className="remove-file-btn"
                          onClick={() => removeFile(index)}
                          title={t.removeFile}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="input-controls">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <motion.button
                    className="attach-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    whileHover={!isSending ? { scale: 1.05 } : {}}
                    whileTap={!isSending ? { scale: 0.95 } : {}}
                    title={t.attachFile}
                  >
                    📎
                  </motion.button>
                  <textarea
                    ref={messageInputRef}
                    className="message-input"
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    placeholder={t.typeMessage}
                    disabled={isSending}
                    rows={1}
                  />
                  <motion.button
                    className="send-message-btn"
                    onClick={handleSendMessage}
                    disabled={isSending || (!newMessage.trim() && selectedFiles.length === 0)}
                    whileHover={!isSending && (newMessage.trim() || selectedFiles.length > 0) ? { scale: 1.05 } : {}}
                    whileTap={!isSending && (newMessage.trim() || selectedFiles.length > 0) ? { scale: 0.95 } : {}}
                  >
                    {isSending ? (
                      <span>⏳</span>
                    ) : (
                      <span>{language === 'ar' ? '📤' : '📤'}</span>
                    )}
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        currentUserEmail={currentUserEmail}
        currentUserRole={userRole}
        language={language}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};

export default TeacherParentChat;
