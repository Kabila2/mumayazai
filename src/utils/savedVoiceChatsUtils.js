// src/utils/savedVoiceChatsUtils.js - Saved Voice Chats Management Utilities

const SAVED_VOICE_CHATS_KEY = "mumayaz_saved_voice_chats";
const MAX_SAVED_VOICE_CHATS = 50; // Limit to prevent storage overflow

/**
 * Generate a unique ID for saved voice chats
 */
const generateVoiceChatId = () => {
  return `voice_chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all saved voice chats from localStorage
 */
export const getSavedVoiceChats = () => {
  try {
    const saved = localStorage.getItem(SAVED_VOICE_CHATS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading saved voice chats:", error);
    return [];
  }
};

/**
 * Save a voice chat conversation
 */
export const saveVoiceChat = (messages, title = null, tags = []) => {
  try {
    const savedVoiceChats = getSavedVoiceChats();

    // Auto-generate title if not provided
    const chatTitle = title || generateVoiceChatTitle(messages);

    const voiceChatData = {
      id: generateVoiceChatId(),
      title: chatTitle,
      messages: messages,
      tags: tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: messages.length,
      summary: generateVoiceChatSummary(messages),
      type: "voice" // Distinguish from text chats
    };

    // Add to beginning of array (most recent first)
    savedVoiceChats.unshift(voiceChatData);

    // Limit the number of saved voice chats
    if (savedVoiceChats.length > MAX_SAVED_VOICE_CHATS) {
      savedVoiceChats.splice(MAX_SAVED_VOICE_CHATS);
    }

    localStorage.setItem(SAVED_VOICE_CHATS_KEY, JSON.stringify(savedVoiceChats));
    return { success: true, chatId: voiceChatData.id, title: chatTitle };
  } catch (error) {
    console.error("Error saving voice chat:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Load a specific saved voice chat by ID
 */
export const loadSavedVoiceChat = (chatId) => {
  try {
    const savedVoiceChats = getSavedVoiceChats();
    const chat = savedVoiceChats.find(c => c.id === chatId);

    if (chat) {
      // Update last accessed time
      chat.lastAccessed = new Date().toISOString();
      updateSavedVoiceChat(chatId, chat);
      return { success: true, chat };
    }

    return { success: false, error: "Voice chat not found" };
  } catch (error) {
    console.error("Error loading voice chat:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing saved voice chat
 */
export const updateSavedVoiceChat = (chatId, updatedData) => {
  try {
    const savedVoiceChats = getSavedVoiceChats();
    const chatIndex = savedVoiceChats.findIndex(c => c.id === chatId);

    if (chatIndex !== -1) {
      savedVoiceChats[chatIndex] = {
        ...savedVoiceChats[chatIndex],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(SAVED_VOICE_CHATS_KEY, JSON.stringify(savedVoiceChats));
      return { success: true };
    }

    return { success: false, error: "Voice chat not found" };
  } catch (error) {
    console.error("Error updating voice chat:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a saved voice chat
 */
export const deleteSavedVoiceChat = (chatId) => {
  try {
    const savedVoiceChats = getSavedVoiceChats();
    const filteredChats = savedVoiceChats.filter(c => c.id !== chatId);

    localStorage.setItem(SAVED_VOICE_CHATS_KEY, JSON.stringify(filteredChats));
    return { success: true };
  } catch (error) {
    console.error("Error deleting voice chat:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Search saved voice chats by title, tags, or content
 */
export const searchSavedVoiceChats = (query) => {
  try {
    const savedVoiceChats = getSavedVoiceChats();
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) return savedVoiceChats;

    return savedVoiceChats.filter(chat => {
      // Search in title
      if (chat.title.toLowerCase().includes(searchTerm)) return true;

      // Search in tags
      if (chat.tags.some(tag => tag.toLowerCase().includes(searchTerm))) return true;

      // Search in summary
      if (chat.summary.toLowerCase().includes(searchTerm)) return true;

      // Search in message content (first few messages only for performance)
      const messagesToSearch = chat.messages.slice(0, 10);
      return messagesToSearch.some(msg =>
        msg.text && msg.text.toLowerCase().includes(searchTerm)
      );
    });
  } catch (error) {
    console.error("Error searching voice chats:", error);
    return [];
  }
};

/**
 * Get voice chats by tag
 */
export const getVoiceChatsByTag = (tag) => {
  try {
    const savedVoiceChats = getSavedVoiceChats();
    return savedVoiceChats.filter(chat =>
      chat.tags.includes(tag)
    );
  } catch (error) {
    console.error("Error getting voice chats by tag:", error);
    return [];
  }
};

/**
 * Get all unique tags from saved voice chats
 */
export const getAllVoiceTags = () => {
  try {
    const savedVoiceChats = getSavedVoiceChats();
    const allTags = savedVoiceChats.flatMap(chat => chat.tags);
    return [...new Set(allTags)].sort();
  } catch (error) {
    console.error("Error getting voice tags:", error);
    return [];
  }
};

/**
 * Generate a title from voice chat messages
 */
const generateVoiceChatTitle = (messages) => {
  if (!messages || messages.length === 0) {
    return `Voice Chat ${new Date().toLocaleDateString()}`;
  }

  // Find the first user message
  const firstUserMessage = messages.find(msg => msg.sender === "user");

  if (firstUserMessage && firstUserMessage.text) {
    // Take first 50 characters and clean up
    let title = firstUserMessage.text
      .substring(0, 50)
      .replace(/\n/g, " ")
      .trim();

    if (firstUserMessage.text.length > 50) {
      title += "...";
    }

    return title;
  }

  return `Voice Chat ${new Date().toLocaleDateString()}`;
};

/**
 * Generate a summary from voice chat messages
 */
const generateVoiceChatSummary = (messages) => {
  if (!messages || messages.length === 0) {
    return "Empty voice conversation";
  }

  const userMessages = messages.filter(msg => msg.sender === "user").slice(0, 3);
  const topics = userMessages.map(msg => {
    if (msg.text && msg.text.length > 0) {
      return msg.text.substring(0, 100).replace(/\n/g, " ").trim();
    }
    return "";
  }).filter(text => text.length > 0);

  if (topics.length === 0) {
    return `${messages.length} voice messages exchanged`;
  }

  return topics.join(" • ");
};

/**
 * Export saved voice chats to JSON
 */
export const exportSavedVoiceChats = () => {
  try {
    const savedVoiceChats = getSavedVoiceChats();
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      voiceChats: savedVoiceChats
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `mumayaz_saved_voice_chats_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error("Error exporting voice chats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get voice chat statistics
 */
export const getVoiceChatStatistics = () => {
  try {
    const savedVoiceChats = getSavedVoiceChats();

    const stats = {
      totalVoiceChats: savedVoiceChats.length,
      totalVoiceMessages: savedVoiceChats.reduce((sum, chat) => sum + chat.messageCount, 0),
      oldestVoiceChat: savedVoiceChats.length > 0 ?
        savedVoiceChats.reduce((oldest, chat) =>
          new Date(chat.createdAt) < new Date(oldest.createdAt) ? chat : oldest
        ).createdAt : null,
      newestVoiceChat: savedVoiceChats.length > 0 ? savedVoiceChats[0].createdAt : null,
      averageMessagesPerVoiceChat: savedVoiceChats.length > 0 ?
        Math.round(savedVoiceChats.reduce((sum, chat) => sum + chat.messageCount, 0) / savedVoiceChats.length) : 0,
      allVoiceTags: getAllVoiceTags()
    };

    return stats;
  } catch (error) {
    console.error("Error getting voice chat statistics:", error);
    return null;
  }
};