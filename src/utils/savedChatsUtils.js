// src/utils/savedChatsUtils.js - Saved Chats Management Utilities

const SAVED_CHATS_KEY = "mumayaz_saved_chats";
const MAX_SAVED_CHATS = 50; // Limit to prevent storage overflow

/**
 * Generate a unique ID for saved chats
 */
const generateChatId = () => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all saved chats from localStorage
 */
export const getSavedChats = () => {
  try {
    const saved = localStorage.getItem(SAVED_CHATS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading saved chats:", error);
    return [];
  }
};

/**
 * Save a chat conversation
 */
export const saveChat = (messages, title = null, tags = []) => {
  try {
    const savedChats = getSavedChats();

    // Auto-generate title if not provided
    const chatTitle = title || generateChatTitle(messages);

    const chatData = {
      id: generateChatId(),
      title: chatTitle,
      messages: messages,
      tags: tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: messages.length,
      summary: generateChatSummary(messages)
    };

    // Add to beginning of array (most recent first)
    savedChats.unshift(chatData);

    // Limit the number of saved chats
    if (savedChats.length > MAX_SAVED_CHATS) {
      savedChats.splice(MAX_SAVED_CHATS);
    }

    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(savedChats));
    return { success: true, chatId: chatData.id, title: chatTitle };
  } catch (error) {
    console.error("Error saving chat:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Load a specific saved chat by ID
 */
export const loadSavedChat = (chatId) => {
  try {
    const savedChats = getSavedChats();
    const chat = savedChats.find(c => c.id === chatId);

    if (chat) {
      // Update last accessed time
      chat.lastAccessed = new Date().toISOString();
      updateSavedChat(chatId, chat);
      return { success: true, chat };
    }

    return { success: false, error: "Chat not found" };
  } catch (error) {
    console.error("Error loading chat:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing saved chat
 */
export const updateSavedChat = (chatId, updatedData) => {
  try {
    const savedChats = getSavedChats();
    const chatIndex = savedChats.findIndex(c => c.id === chatId);

    if (chatIndex !== -1) {
      savedChats[chatIndex] = {
        ...savedChats[chatIndex],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(savedChats));
      return { success: true };
    }

    return { success: false, error: "Chat not found" };
  } catch (error) {
    console.error("Error updating chat:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a saved chat
 */
export const deleteSavedChat = (chatId) => {
  try {
    const savedChats = getSavedChats();
    const filteredChats = savedChats.filter(c => c.id !== chatId);

    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(filteredChats));
    return { success: true };
  } catch (error) {
    console.error("Error deleting chat:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Search saved chats by title, tags, or content
 */
export const searchSavedChats = (query) => {
  try {
    const savedChats = getSavedChats();
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) return savedChats;

    return savedChats.filter(chat => {
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
    console.error("Error searching chats:", error);
    return [];
  }
};

/**
 * Get chats by tag
 */
export const getChatsByTag = (tag) => {
  try {
    const savedChats = getSavedChats();
    return savedChats.filter(chat =>
      chat.tags.includes(tag)
    );
  } catch (error) {
    console.error("Error getting chats by tag:", error);
    return [];
  }
};

/**
 * Get all unique tags from saved chats
 */
export const getAllTags = () => {
  try {
    const savedChats = getSavedChats();
    const allTags = savedChats.flatMap(chat => chat.tags);
    return [...new Set(allTags)].sort();
  } catch (error) {
    console.error("Error getting tags:", error);
    return [];
  }
};

/**
 * Export saved chats to JSON
 */
export const exportSavedChats = () => {
  try {
    const savedChats = getSavedChats();
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      chats: savedChats
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `mumayaz_saved_chats_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error("Error exporting chats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Import saved chats from JSON
 */
export const importSavedChats = (jsonData, mergeMode = true) => {
  try {
    const importedData = JSON.parse(jsonData);

    if (!importedData.chats || !Array.isArray(importedData.chats)) {
      throw new Error("Invalid import format");
    }

    const existingChats = mergeMode ? getSavedChats() : [];
    const importedChats = importedData.chats;

    // Merge and deduplicate
    const mergedChats = [...existingChats];

    importedChats.forEach(importedChat => {
      // Check if chat already exists (by title and creation date)
      const exists = existingChats.some(existing =>
        existing.title === importedChat.title &&
        existing.createdAt === importedChat.createdAt
      );

      if (!exists) {
        // Regenerate ID to avoid conflicts
        importedChat.id = generateChatId();
        mergedChats.push(importedChat);
      }
    });

    // Sort by creation date (newest first)
    mergedChats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit total chats
    if (mergedChats.length > MAX_SAVED_CHATS) {
      mergedChats.splice(MAX_SAVED_CHATS);
    }

    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(mergedChats));

    return {
      success: true,
      imported: importedChats.length,
      total: mergedChats.length
    };
  } catch (error) {
    console.error("Error importing chats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a title from chat messages
 */
const generateChatTitle = (messages) => {
  if (!messages || messages.length === 0) {
    return `Chat ${new Date().toLocaleDateString()}`;
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

  return `Chat ${new Date().toLocaleDateString()}`;
};

/**
 * Generate a summary from chat messages
 */
const generateChatSummary = (messages) => {
  if (!messages || messages.length === 0) {
    return "Empty conversation";
  }

  const userMessages = messages.filter(msg => msg.sender === "user").slice(0, 3);
  const topics = userMessages.map(msg => {
    if (msg.text && msg.text.length > 0) {
      return msg.text.substring(0, 100).replace(/\n/g, " ").trim();
    }
    return "";
  }).filter(text => text.length > 0);

  if (topics.length === 0) {
    return `${messages.length} messages exchanged`;
  }

  return topics.join(" • ");
};

/**
 * Get chat statistics
 */
export const getChatStatistics = () => {
  try {
    const savedChats = getSavedChats();

    const stats = {
      totalChats: savedChats.length,
      totalMessages: savedChats.reduce((sum, chat) => sum + chat.messageCount, 0),
      oldestChat: savedChats.length > 0 ?
        savedChats.reduce((oldest, chat) =>
          new Date(chat.createdAt) < new Date(oldest.createdAt) ? chat : oldest
        ).createdAt : null,
      newestChat: savedChats.length > 0 ? savedChats[0].createdAt : null,
      averageMessagesPerChat: savedChats.length > 0 ?
        Math.round(savedChats.reduce((sum, chat) => sum + chat.messageCount, 0) / savedChats.length) : 0,
      allTags: getAllTags()
    };

    return stats;
  } catch (error) {
    console.error("Error getting chat statistics:", error);
    return null;
  }
};

/**
 * Clean up old chats (remove chats older than specified days)
 */
export const cleanupOldChats = (daysToKeep = 365) => {
  try {
    const savedChats = getSavedChats();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredChats = savedChats.filter(chat =>
      new Date(chat.createdAt) > cutoffDate
    );

    const removedCount = savedChats.length - filteredChats.length;

    if (removedCount > 0) {
      localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(filteredChats));
    }

    return { success: true, removedCount };
  } catch (error) {
    console.error("Error cleaning up chats:", error);
    return { success: false, error: error.message };
  }
};