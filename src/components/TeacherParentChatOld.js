import React, { useState, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef(null);

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
      offline: 'Offline'
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
      offline: 'غير متصل'
    }
  };

  const t = translations[language] || translations.en;

  // Load conversations and messages
  useEffect(() => {
    loadConversations();
  }, [currentUserEmail]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = () => {
    try {
      const stored = localStorage.getItem('mumayaz_conversations') || '{}';
      const allConversations = JSON.parse(stored);

      // Filter conversations for current user
      const userConversations = Object.entries(allConversations)
        .filter(([conversationId, conv]) => {
          return conv.participants.includes(currentUserEmail);
        })
        .map(([id, conv]) => ({
          id,
          ...conv,
          // Get the other participant's info
          otherParticipant: conv.participants.find(email => email !== currentUserEmail)
        }))
        .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = (conversationId) => {
    try {
      const stored = localStorage.getItem(`mumayaz_messages_${conversationId}`) || '[]';
      const conversationMessages = JSON.parse(stored);
      setMessages(conversationMessages);

      // Mark messages as read
      markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = (conversationId) => {
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
  };

  const updateConversationUnreadCount = (conversationId) => {
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
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);

    try {
      const message = {
        id: Date.now(),
        sender: currentUserEmail,
        text: newMessage.trim(),
        timestamp: Date.now(),
        read: false
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

        // Increment unread count for other participant
        const otherParticipant = selectedConversation.participants.find(p => p !== currentUserEmail);
        if (otherParticipant) {
          allConversations[selectedConversation.id].unreadCount =
            (allConversations[selectedConversation.id].unreadCount || 0) + 1;
        }

        localStorage.setItem('mumayaz_conversations', JSON.stringify(allConversations));
      }

      // Update local state
      setMessages([...messages, message]);
      setNewMessage('');
      loadConversations();

      // Success haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
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
    // Reload conversations
    loadConversations();

    // Find and select the newly created conversation
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
          <h1 className="chat-comm-title">{t.title}</h1>
          <motion.button
            className="new-conversation-btn"
            onClick={createNewConversation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>➕</span>
            <span>{t.newConversation}</span>
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
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="no-conversations">
                <div className="empty-state-icon">💬</div>
                <p>{t.noConversations}</p>
              </div>
            ) : (
              <AnimatePresence>
                {conversations.map((conv, index) => (
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
                          {conv.lastSender === currentUserEmail ? 'You: ' : ''}
                          {conv.lastMessage || 'No messages yet'}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="unread-badge">{conv.unreadCount}</span>
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
              </div>

              {/* Messages List */}
              <div className="messages-list">
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
                        <p className="message-text">{msg.text}</p>
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="message-input-area">
                <textarea
                  className="message-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.typeMessage}
                  disabled={isSending}
                  rows={1}
                />
                <motion.button
                  className="send-message-btn"
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                  whileHover={!isSending && newMessage.trim() ? { scale: 1.05 } : {}}
                  whileTap={!isSending && newMessage.trim() ? { scale: 0.95 } : {}}
                >
                  {isSending ? (
                    <span>⏳</span>
                  ) : (
                    <span>{language === 'ar' ? '←' : '→'}</span>
                  )}
                </motion.button>
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
