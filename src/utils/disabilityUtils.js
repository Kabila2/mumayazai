// src/utils/disabilityUtils.js

// Storage key for disability preference
export const DISABILITY_KEY = "disability";

/**
 * Get current disability preference from localStorage
 */
export const getCurrentDisability = () => {
  return localStorage.getItem(DISABILITY_KEY) || "dyslexia";
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
    case "adhd":     
      return "ADHD-Friendly Chat Assistant";
    case "autism":   
      return "Autism-Friendly Chat Assistant";
    default:         
      return "Accessible Chat Assistant";
  }
};

/**
 * Get voice assistant title based on disability
 */
export const getVoiceAssistantTitle = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia": 
      return "Dyslexia-Friendly Voice Assistant";
    case "adhd":     
      return "ADHD-Friendly Voice Assistant";
    case "autism":   
      return "Autism-Friendly Voice Assistant";
    default:         
      return "Accessible Voice Assistant";
  }
};

/**
 * Get disability-specific theme colors and styling
 */
export const getDisabilityTheme = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "adhd":
      return {
        headerBg: "linear-gradient(135deg, #FF6F00, #FF8F00)",
        primary: "#FF8F00",
        accent: "#FF6F00",
        textColor: "#ffffff",
        bubbleUserBg: "linear-gradient(135deg, #FF6F00, #FF8F00)",
        bubbleGptBg: "linear-gradient(135deg, rgba(255, 143, 0, 0.15), rgba(255, 111, 0, 0.1))",
        borderColor: "rgba(255, 143, 0, 0.4)",
        inputBorderColor: "rgba(255, 143, 0, 0.4)",
        focusBorderColor: "#FF8F00",
        waveBorder: "rgba(255, 143, 0, 0.6)",
        ringGlow: "rgba(255, 200, 0, 0.6)",
        panelBg: "rgba(0,0,0,0.65)",
        textAlt: "#FFF9E6"
      };
    case "autism":
      return {
        headerBg: "linear-gradient(135deg, #26A69A, #00796B)",
        primary: "#26A69A",
        accent: "#26A69A",
        textColor: "#E0F2F1",
        bubbleUserBg: "linear-gradient(135deg, #26A69A, #00796B)",
        bubbleGptBg: "linear-gradient(135deg, rgba(38, 166, 154, 0.15), rgba(0, 121, 107, 0.1))",
        borderColor: "rgba(38, 166, 154, 0.4)",
        inputBorderColor: "rgba(38, 166, 154, 0.4)",
        focusBorderColor: "#26A69A",
        waveBorder: "rgba(38, 166, 154, 0.6)",
        ringGlow: "rgba(0, 150, 136, 0.6)",
        panelBg: "rgba(0,0,0,0.65)",
        textAlt: "#E0F7FA"
      };
    case "dyslexia":
    default:
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
  }
};

/**
 * Get disability-specific welcome message
 */
export const getWelcomeMessage = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "adhd":
      return "Hi! I'm your ADHD-friendly assistant. I'll keep things clear, focused, and bite-sized. What would you like to work on today?";
    case "autism":
      return "Hello! I'm your autism-friendly assistant. I'll be direct, clear, and consistent in my responses. What can I help you with today?";
    case "dyslexia":
      return "Hi there! I'll keep things dyslexia-friendly with clear formatting and simple language. What would you like to work on today?";
    default:
      return "Hi there! I'm here to help you in an accessible way. What would you like to work on today?";
  }
};

/**
 * Create disability-specific AI prompt with clear formatting instructions
 */
export const createDisabilityAwarePrompt = (userInput, disability, isVoiceMode = false) => {
  const modeContext = isVoiceMode ? "This is a voice interaction, so keep responses conversational and clear." : "";
  
  switch ((disability || "").toLowerCase()) {
    case "adhd":
      return `You are an ADHD-friendly AI assistant. Follow these formatting rules STRICTLY:

IMPORTANT: Start EVERY response with "🧠 ADHD-FRIENDLY RESPONSE:"

Format your response using:
• Short bullet points for main ideas
• Maximum 3-4 bullet points per response
• Each bullet point should be 1-2 sentences maximum
• Use clear, direct language
• Avoid overwhelming details
• Stay focused on ONE main topic

Keep responses concise and well-organized. Break complex information into digestible chunks.
${modeContext}

User: ${userInput}`;

    case "autism":
      return `You are an autism-friendly AI assistant. Follow these formatting rules STRICTLY:

IMPORTANT: Start EVERY response with "🌈 AUTISM-FRIENDLY RESPONSE:"

Format your response using:
• Direct, literal language (avoid metaphors)
• Clear step-by-step structure when explaining things
• Be specific and precise
• Use consistent formatting
• Avoid ambiguous phrases
• Provide concrete examples when helpful

Be straightforward and predictable in your communication style.
${modeContext}

User: ${userInput}`;

    case "dyslexia":
    default:
      return `You are a dyslexia-friendly AI assistant. Follow these formatting rules STRICTLY:

IMPORTANT: Start EVERY response with "💚 DYSLEXIA-FRIENDLY RESPONSE:"

Format your response using:
• Simple, clear language
• Short paragraphs (2-3 sentences max)
• Use bullet points for lists
• Avoid complex sentence structures
• Use common words instead of jargon
• Good spacing between ideas

Keep text readable with clear structure and simple vocabulary.
${modeContext}

User: ${userInput}`;
  }
};

/**
 * Format AI response to ensure disability-specific formatting
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
    case "adhd":
      return "🧠 ADHD-FRIENDLY RESPONSE:";
    case "autism":
      return "🌈 AUTISM-FRIENDLY RESPONSE:";
    case "dyslexia":
    default:
      return "💚 DYSLEXIA-FRIENDLY RESPONSE:";
  }
};

/**
 * Get disability-specific error message
 */
export const getDisabilityErrorMessage = (disability) => {
  const prefix = getDisabilityPrefix(disability);
  
  switch ((disability || "").toLowerCase()) {
    case "adhd":
      return `${prefix}

• Connection issue - trying to reconnect
• Please wait a moment and try again
• Your question was received successfully`;
    case "autism":
      return `${prefix}

I'm having a technical problem right now. Here's what happened:
1. Your message was received
2. The AI connection is temporarily down  
3. Please try asking your question again in a moment`;
    case "dyslexia":
    default:
      return `${prefix}

Sorry, I'm having trouble connecting right now. 

Please try again in a few seconds. Your message was received okay.`;
  }
};

/**
 * Get disability icon/emoji
 */
export const getDisabilityIcon = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "adhd":
      return "🧠";
    case "autism":
      return "🌈";
    case "dyslexia":
      return "💚";
    default:
      return "♿";
  }
};

/**
 * Get disability-specific UI adjustments
 */
export const getDisabilityUISettings = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "adhd":
      return {
        reducedAnimations: true,
        focusMode: true,
        highlightInteractives: true,
        preferLargerButtons: true
      };
    case "autism":
      return {
        consistentLayout: true,
        predictableAnimations: true,
        clearHierarchy: true,
        reducedSensoryLoad: true
      };
    case "dyslexia":
      return {
        enhancedReadability: true,
        increasedSpacing: true,
        dyslexicFriendlyFonts: true,
        colorCodedElements: false
      };
    default:
      return {
        enhancedReadability: true,
        increasedSpacing: true
      };
  }
};