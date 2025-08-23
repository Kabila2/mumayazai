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
      return "Hi there! 👋 I'm your ADHD-friendly assistant. I'll keep things clear, focused, and bite-sized. What would you like to work on today?";
    case "autism":
      return "Hello! 👋 I'm your autism-friendly assistant. I'll be direct, clear, and consistent in my responses. What can I help you with today?";
    case "dyslexia":
      return "Hi there! 👋 I'll keep things dyslexia-friendly with clear formatting and simple language. What would you like to work on today?";
    default:
      return "Hi there! 👋 I'm here to help you in an accessible way. What would you like to work on today?";
  }
};

/**
 * Get disability-specific AI prompt context
 */
export const getAIPromptContext = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia":
      return "Keep responses clear and well-structured. Use simple language, short paragraphs, and bullet points when helpful. Avoid complex jargon.";
    case "adhd":
      return "Keep responses focused and concise. Break information into clear, manageable chunks. Stay on topic and avoid overwhelming details.";
    case "autism":
      return "Be direct and literal in responses. Avoid metaphors or ambiguous language. Provide clear, step-by-step information when needed.";
    default:
      return "Keep responses clear and accessible. Use simple language and well-structured formatting.";
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