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
      return "🧠 ADHD-FRIENDLY RESPONSE:\n\n• Hi! I'm your ADHD-friendly assistant\n• I'll keep responses in short bullet points\n• Each point focuses on one clear idea\n• Ready to help you stay organized and focused\n\nWhat would you like to work on today?";
    case "autism":
      return "🌈 AUTISM-FRIENDLY RESPONSE:\n\nHello! I'm your autism-friendly assistant.\n\nI will provide:\n1. Direct, clear communication\n2. Consistent response patterns\n3. Specific, literal information\n4. Step-by-step guidance when needed\n\nWhat can I help you with today?";
    case "dyslexia":
      return "💚 DYSLEXIA-FRIENDLY RESPONSE:\n\nHi there! I'm your dyslexia-friendly assistant.\n\nI will help with:\n• Clear, simple language\n• Well-spaced text\n• Easy-to-read format\n• Short sentences\n\nWhat would you like to work on today?";
    default:
      return "Hi there! I'm here to help you in an accessible way. What would you like to work on today?";
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
    case "adhd":
      return `You are an ADHD-friendly AI assistant. This is CRITICAL: You MUST follow these formatting rules with NO EXCEPTIONS:

🎯 MANDATORY RESPONSE FORMAT:
1. ALWAYS start with "🧠 ADHD-FRIENDLY RESPONSE:" as the first line
2. Leave ONE blank line after the header
3. Use ONLY bullet points (•) for ALL content - NO paragraphs, NO sentences outside bullets
4. Maximum 4 bullet points per response
5. Each bullet point must be 15 words or less
6. Each bullet addresses ONE clear idea only
7. Use simple, direct language
8. NO complex explanations - break them into separate bullets

EXAMPLE FORMAT:
🧠 ADHD-FRIENDLY RESPONSE:

• First key point in simple words
• Second important detail briefly explained  
• Third actionable step or information
• Final summary or next step

${modeContext}

CRITICAL: If you provide ANY text that is not in bullet point format, you have failed. Every piece of information must be a bullet point.

User question: ${userInput}`;

    case "autism":
      return `You are an autism-friendly AI assistant. Follow these formatting rules STRICTLY:

IMPORTANT: Start EVERY response with "🌈 AUTISM-FRIENDLY RESPONSE:"

Format your response using:
• Direct, literal language (avoid metaphors and idioms)
• Clear step-by-step structure when explaining processes
• Specific and precise information
• Consistent formatting throughout
• Numbered lists for sequences or procedures
• Avoid ambiguous phrases like "might," "could," "perhaps"
• Provide concrete examples when helpful
• Use the same sentence structure patterns

Be straightforward, predictable, and consistent in your communication style.
${modeContext}

User: ${userInput}`;

    case "dyslexia":
    default:
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
  }
};

/**
 * Enhanced response formatting with strict ADHD bullet point enforcement
 */
export const formatAIResponse = (response, disability) => {
  if (!response) return response;
  
  const cleanResponse = response.trim();
  const disabilityPrefix = getDisabilityPrefix(disability);
  
  // Special handling for ADHD responses
  if ((disability || "").toLowerCase() === "adhd") {
    return enforceADHDBulletPoints(cleanResponse, disabilityPrefix);
  }
  
  // If response doesn't start with the disability prefix, add it
  if (!cleanResponse.startsWith(disabilityPrefix.split(':')[0])) {
    return `${disabilityPrefix}\n\n${cleanResponse}`;
  }
  
  return cleanResponse;
};

/**
 * Enforce ADHD bullet point formatting - convert any non-bullet content to bullets
 */
const enforceADHDBulletPoints = (response, prefix) => {
  // If response already starts with ADHD prefix, extract the content part
  let content = response;
  if (response.includes("ADHD-FRIENDLY RESPONSE:")) {
    const parts = response.split("ADHD-FRIENDLY RESPONSE:");
    content = parts.length > 1 ? parts[1].trim() : response;
  }
  
  // Split content into lines and process each one
  const lines = content.split('\n').filter(line => line.trim());
  const bulletPoints = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Skip if it's already a proper bullet point
    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      // Ensure it uses the standard bullet symbol
      const cleanBullet = line.replace(/^[-*]\s*/, '• ');
      bulletPoints.push(cleanBullet);
      continue;
    }
    
    // Convert numbered lists to bullets
    if (/^\d+\.?\s+/.test(line)) {
      const cleanBullet = '• ' + line.replace(/^\d+\.?\s+/, '');
      bulletPoints.push(cleanBullet);
      continue;
    }
    
    // Convert regular text to bullet points
    // Split long sentences at logical break points
    const sentences = line.split(/[.!?]+/).filter(s => s.trim());
    
    for (let sentence of sentences) {
      sentence = sentence.trim();
      if (!sentence) continue;
      
      // If sentence is too long (>15 words), try to split it
      const words = sentence.split(' ');
      if (words.length > 15) {
        // Split at conjunctions or commas
        const splitPoints = [', ', ' and ', ' but ', ' or ', ' so ', ' because ', ' when ', ' if '];
        let split = false;
        
        for (let splitPoint of splitPoints) {
          if (sentence.includes(splitPoint)) {
            const parts = sentence.split(splitPoint);
            if (parts.length === 2 && parts[0].split(' ').length <= 15) {
              bulletPoints.push('• ' + parts[0].trim());
              bulletPoints.push('• ' + parts[1].trim());
              split = true;
              break;
            }
          }
        }
        
        if (!split) {
          // If we can't split nicely, just use the first 15 words
          bulletPoints.push('• ' + words.slice(0, 15).join(' ') + '...');
        }
      } else {
        bulletPoints.push('• ' + sentence);
      }
    }
  }
  
  // Limit to maximum 4 bullet points for ADHD
  const limitedBullets = bulletPoints.slice(0, 4);
  
  // Ensure we have at least one bullet point
  if (limitedBullets.length === 0) {
    limitedBullets.push('• Got your message - let me help with that');
  }
  
  return `${prefix}\n\n${limitedBullets.join('\n')}`;
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
 * Enhanced disability-specific error messages with proper formatting
 */
export const getDisabilityErrorMessage = (disability) => {
  const prefix = getDisabilityPrefix(disability);
  
  switch ((disability || "").toLowerCase()) {
    case "adhd":
      return `${prefix}

• Connection issue - trying to reconnect
• Your message was received successfully  
• Please wait a moment and try again
• System will restore shortly`;

    case "autism":
      return `${prefix}

I'm experiencing a technical problem right now. Here's the status:

1. Your message was received and processed
2. The AI connection is temporarily unavailable
3. This is a temporary technical issue
4. Please try asking your question again in a moment
5. The system should restore normal function shortly`;

    case "dyslexia":
    default:
      return `${prefix}

Sorry, I'm having trouble connecting right now.

Your message was received okay. This is just a temporary problem.

Please try again in a few seconds. The system should work normally again soon.`;
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
        preferLargerButtons: true,
        enforceStructuredContent: true,
        limitInformationDensity: true
      };
    case "autism":
      return {
        consistentLayout: true,
        predictableAnimations: true,
        clearHierarchy: true,
        reducedSensoryLoad: true,
        maintainStructure: true,
        avoidUnexpectedChanges: true
      };
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
        increasedSpacing: true
      };
  }
};

/**
 * Validate ADHD response format - check if response follows bullet point rules
 */
export const validateADHDResponse = (response) => {
  if (!response || typeof response !== 'string') return false;
  
  // Check if it starts with the ADHD prefix
  if (!response.includes("🧠 ADHD-FRIENDLY RESPONSE:")) return false;
  
  // Extract content after prefix
  const parts = response.split("🧠 ADHD-FRIENDLY RESPONSE:");
  if (parts.length < 2) return false;
  
  const content = parts[1].trim();
  const lines = content.split('\n').filter(line => line.trim());
  
  // Check that all non-empty lines are bullet points
  let bulletCount = 0;
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Must start with bullet symbol
    if (!line.startsWith('•')) return false;
    
    bulletCount++;
    
    // Check word count (should be 15 words or less)
    const words = line.replace('•', '').trim().split(' ');
    if (words.length > 15) return false;
  }
  
  // Should have 1-4 bullet points
  return bulletCount >= 1 && bulletCount <= 4;
};

/**
 * Get speaking instructions for voice mode based on disability
 */
export const getVoiceSpeakingInstructions = (disability) => {
  switch ((disability || "").toLowerCase()) {
    case "adhd":
      return {
        rate: 1.1, // Slightly faster for energy
        pitch: 1.0,
        volume: 0.9,
        pauseBetweenBullets: 800, // Longer pauses between bullet points
        emphasizeStructure: true,
        announceFormat: true // Announce "First point", "Second point", etc.
      };
    case "autism":
      return {
        rate: 0.95, // Slightly slower for clarity
        pitch: 1.0,
        volume: 0.9,
        consistent: true, // Very consistent delivery
        clearEnunciation: true,
        predictablePacing: true
      };
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