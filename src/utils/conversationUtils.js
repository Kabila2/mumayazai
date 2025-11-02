/**
 * Utility functions for managing teacher-parent conversations
 */

/**
 * Create a new conversation between a teacher and a parent
 * @param {string} teacherEmail - Email of the teacher
 * @param {string} parentEmail - Email of the parent
 * @param {string} childName - Name of the child (optional)
 * @returns {Object} - Created conversation object
 */
export const createConversation = (teacherEmail, parentEmail, childName = '') => {
  try {
    // Generate unique conversation ID
    const conversationId = `conv_${teacherEmail}_${parentEmail}_${Date.now()}`;

    // Get existing conversations
    const stored = localStorage.getItem('mumayaz_conversations') || '{}';
    const conversations = JSON.parse(stored);

    // Check if conversation already exists
    const existingConv = Object.values(conversations).find(conv =>
      conv.participants.includes(teacherEmail) &&
      conv.participants.includes(parentEmail)
    );

    if (existingConv) {
      console.log('Conversation already exists:', existingConv);
      return { success: true, conversationId: Object.keys(conversations).find(
        key => conversations[key] === existingConv
      ), existing: true };
    }

    // Create new conversation
    const newConversation = {
      participants: [teacherEmail, parentEmail],
      createdAt: Date.now(),
      lastMessage: '',
      lastMessageTime: Date.now(),
      lastSender: null,
      unreadCount: 0,
      childName: childName || '',
      archived: false
    };

    conversations[conversationId] = newConversation;
    localStorage.setItem('mumayaz_conversations', JSON.stringify(conversations));

    console.log('Created new conversation:', conversationId);
    return { success: true, conversationId, existing: false };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all conversations for a user
 * @param {string} userEmail - Email of the user
 * @returns {Array} - Array of conversation objects
 */
export const getUserConversations = (userEmail) => {
  try {
    const stored = localStorage.getItem('mumayaz_conversations') || '{}';
    const allConversations = JSON.parse(stored);

    const userConversations = Object.entries(allConversations)
      .filter(([_, conv]) => conv.participants.includes(userEmail))
      .map(([id, conv]) => ({
        id,
        ...conv,
        otherParticipant: conv.participants.find(email => email !== userEmail)
      }))
      .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

    return userConversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} senderEmail - Email of the sender
 * @param {string} messageText - Text of the message
 * @returns {Object} - Result of the operation
 */
export const sendMessage = (conversationId, senderEmail, messageText) => {
  try {
    const message = {
      id: Date.now(),
      sender: senderEmail,
      text: messageText.trim(),
      timestamp: Date.now(),
      read: false
    };

    // Add message to conversation messages
    const messagesKey = `mumayaz_messages_${conversationId}`;
    const stored = localStorage.getItem(messagesKey) || '[]';
    const messages = JSON.parse(stored);
    messages.push(message);
    localStorage.setItem(messagesKey, JSON.stringify(messages));

    // Update conversation metadata
    const conversationsStored = localStorage.getItem('mumayaz_conversations') || '{}';
    const conversations = JSON.parse(conversationsStored);

    if (conversations[conversationId]) {
      conversations[conversationId].lastMessage = messageText.trim();
      conversations[conversationId].lastMessageTime = Date.now();
      conversations[conversationId].lastSender = senderEmail;

      // Increment unread count for other participant
      conversations[conversationId].unreadCount =
        (conversations[conversationId].unreadCount || 0) + 1;

      localStorage.setItem('mumayaz_conversations', JSON.stringify(conversations));
    }

    return { success: true, message };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all messages in a conversation
 * @param {string} conversationId - ID of the conversation
 * @returns {Array} - Array of message objects
 */
export const getConversationMessages = (conversationId) => {
  try {
    const messagesKey = `mumayaz_messages_${conversationId}`;
    const stored = localStorage.getItem(messagesKey) || '[]';
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return [];
  }
};

/**
 * Mark all messages in a conversation as read for a user
 * @param {string} conversationId - ID of the conversation
 * @param {string} userEmail - Email of the user
 * @returns {Object} - Result of the operation
 */
export const markConversationAsRead = (conversationId, userEmail) => {
  try {
    const messagesKey = `mumayaz_messages_${conversationId}`;
    const stored = localStorage.getItem(messagesKey) || '[]';
    const messages = JSON.parse(stored);

    const updatedMessages = messages.map(msg => ({
      ...msg,
      read: msg.sender !== userEmail ? true : msg.read
    }));

    localStorage.setItem(messagesKey, JSON.stringify(updatedMessages));

    // Update unread count in conversation
    const conversationsStored = localStorage.getItem('mumayaz_conversations') || '{}';
    const conversations = JSON.parse(conversationsStored);

    if (conversations[conversationId]) {
      conversations[conversationId].unreadCount = 0;
      localStorage.setItem('mumayaz_conversations', JSON.stringify(conversations));
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Archive a conversation
 * @param {string} conversationId - ID of the conversation
 * @returns {Object} - Result of the operation
 */
export const archiveConversation = (conversationId) => {
  try {
    const conversationsStored = localStorage.getItem('mumayaz_conversations') || '{}';
    const conversations = JSON.parse(conversationsStored);

    if (conversations[conversationId]) {
      conversations[conversationId].archived = true;
      localStorage.setItem('mumayaz_conversations', JSON.stringify(conversations));
      return { success: true };
    }

    return { success: false, error: 'Conversation not found' };
  } catch (error) {
    console.error('Error archiving conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a conversation and all its messages
 * @param {string} conversationId - ID of the conversation
 * @returns {Object} - Result of the operation
 */
export const deleteConversation = (conversationId) => {
  try {
    // Delete conversation
    const conversationsStored = localStorage.getItem('mumayaz_conversations') || '{}';
    const conversations = JSON.parse(conversationsStored);
    delete conversations[conversationId];
    localStorage.setItem('mumayaz_conversations', JSON.stringify(conversations));

    // Delete messages
    const messagesKey = `mumayaz_messages_${conversationId}`;
    localStorage.removeItem(messagesKey);

    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unread message count for a user across all conversations
 * @param {string} userEmail - Email of the user
 * @returns {number} - Total unread message count
 */
export const getTotalUnreadCount = (userEmail) => {
  try {
    const conversations = getUserConversations(userEmail);
    return conversations.reduce((total, conv) => {
      // Count unread messages where the user is not the sender
      const messages = getConversationMessages(conv.id);
      const unreadCount = messages.filter(msg =>
        !msg.read && msg.sender !== userEmail
      ).length;
      return total + unreadCount;
    }, 0);
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
};

/**
 * Initialize a demo conversation for testing
 * This can be called to set up a sample conversation between a teacher and parent
 */
export const initializeDemoConversation = () => {
  try {
    // Get all users
    const usersStored = localStorage.getItem('mumayaz_users') || '{}';
    const users = JSON.parse(usersStored);

    // Find a teacher and a parent
    const teacher = Object.entries(users).find(([_, user]) => user.role === 'teacher');
    const parent = Object.entries(users).find(([_, user]) => user.role === 'parent');

    if (teacher && parent) {
      const result = createConversation(teacher[0], parent[0], 'Demo Student');

      if (result.success && !result.existing) {
        // Send a welcome message from the teacher
        sendMessage(
          result.conversationId,
          teacher[0],
          'Hello! Welcome to the Teacher-Parent Communication platform. Feel free to reach out if you have any questions about your child\'s progress.'
        );

        console.log('Demo conversation initialized successfully');
        return { success: true, conversationId: result.conversationId };
      }
    }

    return { success: false, error: 'Could not find teacher and parent users' };
  } catch (error) {
    console.error('Error initializing demo conversation:', error);
    return { success: false, error: error.message };
  }
};
