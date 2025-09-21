// src/utils/disabilityUtils.js

// Storage key for disability preference
export const DISABILITY_KEY = "disability";

/**
 * Get current disability preference from localStorage
 */
export const getCurrentDisability = () => {
  return localStorage.getItem(DISABILITY_KEY) || "default";
};

/**
 * Save disability preference to localStorage
 */
export const saveDisability = (disability) => {
  localStorage.setItem(DISABILITY_KEY, disability);
};

/**
 * Get assistant title based on disability
 */
export const getAssistantTitle = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return "Dyslexia-Friendly Chat Assistant";
    default:
      return "Chat Assistant";
  }
};

/**
 * Get voice assistant title based on disability
 */
export const getVoiceAssistantTitle = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return "Dyslexia-Friendly Voice Assistant";
    default:
      return "Voice Assistant";
  }
};

/**
 * Get disability-specific theme colors and styling
 */
export const getDisabilityTheme = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return {
        headerBg: "linear-gradient(135deg, #4CAF50, #45a049)",
        primary: "#4CAF50",
        accent: "#4CAF50",
        textColor: "#e8f5e8",
        bubbleUserBg: "linear-gradient(135deg, #4CAF50, #45a049)",
        bubbleGptBg: "linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(69, 160, 73, 0.1))",
        borderColor: "rgba(76, 175, 80, 0.4)",
        inputBorderColor: "rgba(76, 175, 80, 0.4)",
        focusBorderColor: "#4CAF50",
        waveBorder: "rgba(76, 175, 80, 0.6)",
        ringGlow: "rgba(76, 175, 80, 0.6)",
        panelBg: "rgba(0,0,0,0.65)",
        textAlt: "#e8f5e8"
      };
    default:
      return {
        headerBg: "linear-gradient(135deg, #667eea, #764ba2)",
        primary: "#6366f1",
        accent: "#8b5cf6",
        textColor: "#ffffff",
        bubbleUserBg: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        bubbleGptBg: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))",
        borderColor: "rgba(99, 102, 241, 0.4)",
        inputBorderColor: "rgba(99, 102, 241, 0.4)",
        focusBorderColor: "#6366f1",
        waveBorder: "rgba(99, 102, 241, 0.6)",
        ringGlow: "rgba(99, 102, 241, 0.6)",
        panelBg: "rgba(0,0,0,0.65)",
        textAlt: "#ffffff"
      };
  }
};

/**
 * Get disability-specific welcome message
 */
export const getWelcomeMessage = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return "💚 DYSLEXIA-FRIENDLY RESPONSE:\n\nHi there! I'm your dyslexia-friendly assistant.\n\nI will help with:\n• Clear, simple language\n• Well-spaced text\n• Easy-to-read format\n• Short sentences\n\nWhat would you like to work on today?";
    default:
      return "• Hello! I'm your Chat Assistant\n• I can help you with questions and provide information\n• How can I help you today?";
  }
};

/**
 * Enhanced disability-aware prompt creation with stronger ADHD bullet point enforcement
 */
export const createDisabilityAwarePrompt = (userInput, disability, isVoiceMode = false) => {
  const modeContext = isVoiceMode ?
    "This is a voice interaction, so keep responses conversational and clear for audio." :
    "This is a text chat interaction.";

  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return `You are a dyslexia-friendly AI assistant. Follow these formatting rules STRICTLY:

IMPORTANT: Start EVERY response with "💚 DYSLEXIA-FRIENDLY RESPONSE:"

Format your response using:
• Simple, clear language with common words
• Short paragraphs (maximum 2-3 sentences each)
• Use bullet points for lists and key information
• Avoid complex sentence structures
• Use active voice instead of passive voice
• Break long explanations into smaller chunks
• Good spacing between ideas (use line breaks)
• Consistent formatting throughout

Keep text readable with clear structure and simple vocabulary.
${modeContext}

User: ${userInput}`;
    default:
      return `You are a helpful AI assistant. Please provide clear and informative responses.

Format your response using bullet points for easy reading. Start each main point with • and use clear, concise language.

${modeContext}

User: ${userInput}`;
  }
};

/**
 * Enhanced response formatting with strict ADHD bullet point enforcement
 */
export const formatAIResponse = (response, disability) => {
  if (!response) return response;

  const cleanResponse = response.trim();
  const disabilityPrefix = getDisabilityPrefix(disability);

  // If response doesn't start with the disability prefix, add it
  if (!cleanResponse.startsWith(disabilityPrefix.split(':')[0])) {
    return `${disabilityPrefix}\n\n${cleanResponse}`;
  }

  return cleanResponse;
};


/**
 * Get disability-specific prefix for responses
 */
const getDisabilityPrefix = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return "💚 DYSLEXIA-FRIENDLY RESPONSE:";
    default:
      return "• Hello! I'm your Chat Assistant";
  }
};

/**
 * Enhanced disability-specific error messages with proper formatting
 */
export const getDisabilityErrorMessage = (disability) => {
  const prefix = getDisabilityPrefix(disability);

  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return `${prefix}

Sorry, I'm having trouble connecting right now.

Your message was received okay. This is just a temporary problem.

Please try again in a few seconds. The system should work normally again soon.`;
    default:
      return "• I'm having trouble connecting right now\n• Please try again in a moment";
  }
};

/**
 * Get disability icon/emoji
 */
export const getDisabilityIcon = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return "💚";
    default:
      return "🤖";
  }
};

/**
 * Get disability-specific UI adjustments
 */
export const getDisabilityUISettings = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return {
        enhancedReadability: true,
        increasedSpacing: true,
        dyslexicFriendlyFonts: true,
        colorCodedElements: false,
        improvedLineSpacing: true,
        clearFontChoices: true
      };
    default:
      return {
        enhancedReadability: true,
        increasedSpacing: false
      };
  }
};


/**
 * Get speaking instructions for voice mode based on disability
 */
export const getVoiceSpeakingInstructions = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return {
        rate: 0.85, // Slower for processing
        pitch: 1.0,
        volume: 0.9,
        clearPronunciation: true,
        pauseBetweenSentences: 600
      };
    default:
      return {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.9
      };
  }
};