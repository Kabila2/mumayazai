/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import "./VoiceInterface.css";

// Enhanced: Import disability utilities
import { 
  getCurrentDisability, 
  getVoiceAssistantTitle, 
  getDisabilityTheme,
  createDisabilityAwarePrompt,
  formatAIResponse,
  getDisabilityErrorMessage,
  getWelcomeMessage
} from "../utils/disabilityUtils";

/** ---------- Voice Memory System ---------- */
const VOICE_MEMORY_STORAGE_KEY = "mumayaz_voice_memory";
const MAX_VOICE_MEMORY_MESSAGES = 30; // Smaller limit for voice conversations
const VOICE_CONTEXT_WINDOW = 8; // Fewer messages for voice context

// Save voice conversation to localStorage
const saveVoiceMemory = (messages, disability) => {
  try {
    const memoryData = {
      messages: messages.slice(-MAX_VOICE_MEMORY_MESSAGES),
      disability,
      timestamp: Date.now(),
      version: "1.0",
      mode: "voice"
    };
    localStorage.setItem(VOICE_MEMORY_STORAGE_KEY, JSON.stringify(memoryData));
  } catch (error) {
    console.warn("Failed to save voice memory:", error);
  }
};

// Load voice conversation from localStorage
const loadVoiceMemory = (currentDisability) => {
  try {
    const stored = localStorage.getItem(VOICE_MEMORY_STORAGE_KEY);
    if (!stored) return null;
    
    const memoryData = JSON.parse(stored);
    
    // Check if memory matches current disability and is recent (within 7 days)
    const isRecent = Date.now() - memoryData.timestamp < 7 * 24 * 60 * 60 * 1000;
    const matchesDisability = memoryData.disability === currentDisability;
    
    if (isRecent && matchesDisability && memoryData.messages?.length) {
      return memoryData.messages;
    }
  } catch (error) {
    console.warn("Failed to load voice memory:", error);
  }
  return null;
};

// Clear voice conversation memory
const clearVoiceMemory = () => {
  try {
    localStorage.removeItem(VOICE_MEMORY_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear voice memory:", error);
  }
};

// Build voice context from conversation history
const buildVoiceContext = (messages, disability) => {
  if (messages.length <= 1) return "";
  
  // Get recent messages for context (excluding the welcome message)
  const recentMessages = messages
    .slice(1) // Skip welcome message
    .slice(-VOICE_CONTEXT_WINDOW) // Get last N messages
    .filter(msg => !msg.loading) // Exclude loading messages
    .map(msg => {
      const role = msg.sender === "user" ? "User" : "Assistant";
      return `${role}: ${msg.text}`;
    });
  
  if (recentMessages.length === 0) return "";
  
  return `\n\nVoice conversation history (${disability.toUpperCase()} mode):\n${recentMessages.join('\n')}\n\nCurrent voice input:\n`;
};

/* ---------- Enhanced Puter helpers ---------- */
const hasPuter = () =>
  typeof window !== "undefined" &&
  window.puter &&
  window.puter.ai &&
  typeof window.puter.ai.chat === "function";

const waitForPuter = (timeoutMs = 3000) =>
  new Promise((resolve) => {
    if (hasPuter()) return resolve(true);
    const t0 = Date.now();
    const id = setInterval(() => {
      if (hasPuter() || Date.now() - t0 > timeoutMs) {
        clearInterval(id);
        resolve(hasPuter());
      }
    }, 100);
  });

const aiChat = async (prompt, ms = 20000) => {
  if (!hasPuter()) throw new Error("Puter AI not available");
  
  console.log("🎯 [Voice] Sending disability-aware prompt with memory to AI:", prompt.substring(0, 200) + "...");
  
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("AI request timed out")), ms)
  );
  
  const req = (async () => {
    const resp = await window.puter.ai.chat(prompt);
    const responseText = typeof resp === "string" ? resp : resp?.message?.content ?? "";
    console.log("🤖 [Voice] Raw AI response:", responseText.substring(0, 200) + "...");
    return responseText;
  })();
  
  return Promise.race([req, timeout]);
};

/** Enhanced mock AI for voice mode with memory-aware responses */
const mockAI = (prompt, disability, hasContext = false) => {
  const userInput = (prompt.split("Current voice input:").pop() || prompt.split("User:").pop() || "").trim();
  
  const contextNote = hasContext ? "\n\n(I remember our voice conversation)" : "";
  
  // Generate disability-specific mock responses optimized for voice with memory context
  switch (disability.toLowerCase()) {
    case "adhd":
      return `ADHD-FRIENDLY VOICE RESPONSE:

Voice mode is offline right now, but here's how I'd help you:

• Short, focused responses
• Key points only  
• No overwhelming details
• Clear next steps
• I remember what we discussed${contextNote}

You said: "${userInput}"

I'd break this down into simple chunks for easy listening, building on our previous conversation.`;

    case "autism":
      return `AUTISM-FRIENDLY VOICE RESPONSE:

Voice system status: Currently in demo mode.
Memory status: Previous conversation stored${contextNote}

Your voice input was: "${userInput}"

My response pattern for autism support:
1. Direct, clear language
2. Specific information 
3. Consistent voice tone
4. No figurative language
5. Predictable structure
6. Reference to previous context when relevant

This ensures reliable communication with conversation continuity.`;

    case "dyslexia":
    default:
      return `DYSLEXIA-FRIENDLY VOICE RESPONSE:

You said: "${userInput}"

Voice mode is in demo right now.
I remember our chat from before.${contextNote}

I would speak clearly and slowly for you:
• Simple words
• Short sentences  
• Good pace
• Clear pronunciation
• Reference previous topics

This helps with audio processing and conversation flow.`;
  }
};

/** Enhanced AI response handler for voice mode with memory */
const getVoiceAIResponse = async (prompt, disability, conversationContext = "") => {
  const ready = await waitForPuter(3000);
  
  // Add conversation context to the prompt if available
  const enhancedPrompt = conversationContext 
    ? prompt + conversationContext 
    : prompt;
  
  if (!ready) {
    console.log("🔄 [Voice] Using mock AI response for disability:", disability);
    return mockAI(enhancedPrompt, disability, !!conversationContext);
  }
  
  try {
    const rawResponse = await aiChat(enhancedPrompt, 20000);
    const formattedResponse = formatAIResponse(rawResponse, disability);
    console.log("✅ [Voice] Formatted response for", disability, ":", formattedResponse.substring(0, 100) + "...");
    return formattedResponse;
  } catch (err) {
    console.warn("[VoiceInterface] AI error:", err);
    return getDisabilityErrorMessage(disability);
  }
};

export default function VoiceInterface({
  t,
  language,
  voices: extVoices,
  selectedVoice,
  setSelectedVoice,
  speed,
  setSpeed,
  pitch,
  setPitch,
  setLanguage,
  speak: extSpeak,
  highContrast,
  fontSize,
  reducedMotion,
  onSwitchMode,
  currentDisability: propDisability,
  onSignOut
}) {
  // Get disability from props or localStorage
  const disability = propDisability || getCurrentDisability();
  const theme = getDisabilityTheme(disability);
  const assistantTitle = getVoiceAssistantTitle(disability);

  console.log("🎯 [Voice] VoiceInterface initialized with disability and memory:", disability);

  /* ---------- State with Memory ---------- */
  // Initialize messages with memory or welcome message
  const [messages, setMessages] = useState(() => {
    const savedMessages = loadVoiceMemory(disability);
    if (savedMessages && savedMessages.length > 0) {
      return savedMessages;
    }
    return [{
      sender: "gpt",
      text: getWelcomeMessage(disability) + "\n\nSpeak whenever you're ready! I'll remember our conversation.",
      id: Date.now()
    }];
  });
  
  const [isListening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState(extVoices || []);
  const [localVoice, setLocalVoice] = useState(selectedVoice || "");
  const [localSpeed, setLocalSpeed] = useState(speed || 1);
  const [localPitch, setLocalPitch] = useState(pitch || 1);
  const [showSettings, setShowSettings] = useState(false);
  const [aiReady, setAiReady] = useState(hasPuter());
  const [showMemoryStatus, setShowMemoryStatus] = useState(false);

  const recognitionRef = useRef(null);
  const messagesRef = useRef(null);
  const buttonControls = useAnimation();

  // Save messages to memory whenever they change
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the welcome message
      saveVoiceMemory(messages, disability);
    }
  }, [messages, disability]);

  /* ---------- Mobile Detection Hook ---------- */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /* ---------- Effects ---------- */
  useEffect(() => {
    const check = () => setAiReady(hasPuter());
    check();
    const id = setInterval(check, 1500);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
    };
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const all = synth.getVoices();
      const filtered = all.filter((v) => v.lang?.startsWith("en"));
      setVoices(filtered);
      if (!localVoice && filtered.length) setLocalVoice(filtered[0].name);
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [localVoice]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Update welcome message and load memory when disability changes
  useEffect(() => {
    console.log("🔄 [Voice] Disability changed to:", disability);
    const savedMessages = loadVoiceMemory(disability);
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      setMessages([{
        sender: "gpt",
        text: getWelcomeMessage(disability) + "\n\nSpeak whenever you're ready! I'll remember our conversation.",
        id: Date.now()
      }]);
    }
  }, [disability]);

  // Show memory status notification
  useEffect(() => {
    const savedMessages = loadVoiceMemory(disability);
    if (savedMessages && savedMessages.length > 1) {
      setShowMemoryStatus(true);
      const timer = setTimeout(() => setShowMemoryStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [disability]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.lang = language || "en-US";
    recog.interimResults = false;
    recog.continuous = false;

    recog.onstart = () => {
      setListening(true);
      if (navigator.vibrate) navigator.vibrate(80);
      console.log("🎤 [Voice] Started listening for", disability, "mode with memory");
    };
    
    recog.onend = () => {
      setListening(false);
      console.log("🔇 [Voice] Stopped listening");
    };
    
    recog.onerror = (event) => {
      setListening(false);
      const errorMsg = `⚠️ Speech recognition error: ${event.error}`;
      setMessages((m) => [
        ...m,
        { sender: "system", text: errorMsg, id: Date.now() },
      ]);
      console.error("[Voice] Speech recognition error:", event.error);
    };
    
    recog.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      const confidence = e.results[0][0].confidence;
      
      console.log("📤 [Voice] User said:", text, "with confidence:", confidence);
      console.log("🎯 [Voice] Processing for disability with memory:", disability);
      
      const newUserMessage = { sender: "user", text: text, confidence, id: Date.now() };
      setMessages((m) => [...m, newUserMessage]);
      
      // Add loading message
      const loadingId = Date.now() + 1;
      setMessages((m) => [...m, { sender: "gpt", text: `Processing your voice message in ${disability.toUpperCase()} mode using conversation memory...`, loading: true, id: loadingId }]);
      
      try {
        // Enhanced: Use disability-aware prompting for voice mode with memory context
        const enhancedPrompt = createDisabilityAwarePrompt(text, disability, true); // true = voice mode
        
        // Build conversation context from previous messages
        const updatedMessages = messages.concat([newUserMessage]);
        const conversationContext = buildVoiceContext(updatedMessages, disability);
        
        console.log("🎯 [Voice] Enhanced prompt with memory created for", disability);
        console.log("🔍 [Voice] Context preview:", conversationContext.substring(0, 200) + "...");

        const raw = await getVoiceAIResponse(enhancedPrompt, disability, conversationContext);
        
        setMessages((m) => 
          m.map(msg => 
            msg.id === loadingId ? { sender: "gpt", text: raw, id: loadingId } : msg
          )
        );
        
        console.log("✅ [Voice] Response with memory displayed for", disability);
        
        // Speak the response
        speak(raw);
        
      } catch (err) {
        const errorMsg = getDisabilityErrorMessage(disability);
        setMessages((m) => 
          m.map(msg => 
            msg.id === loadingId ? { sender: "gpt", text: errorMsg, id: loadingId } : msg
          )
        );
        speak("I'm having trouble connecting to the AI right now.");
        console.error("[VoiceInterface] AI error:", err);
      }
    };

    recognitionRef.current = recog;
  }, [language, aiReady, disability, messages]);

  /* ---------- Enhanced Speech Function ---------- */
  const speak = (text) => {
    console.log("🔊 [Voice] Speaking response for", disability, "mode");
    
    // Prefer external speak if passed from App
    if (typeof extSpeak === "function") {
      extSpeak(text);
      return;
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Enhanced text cleaning for disability-specific responses
    let cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/[🔋🎯✨🧠🌈💚⚠️⚙️]/g, '') // Remove emojis
      .replace(/(ADHD-FRIENDLY (?:VOICE )?RESPONSE:|AUTISM-FRIENDLY (?:VOICE )?RESPONSE:|DYSLEXIA-FRIENDLY (?:VOICE )?RESPONSE:)/g, '') // Remove prefixes
      .replace(/•/g, '') // Remove bullet points for speech
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .replace(/Memory status:[^.]+\./g, '') // Remove memory status lines
      .replace(/Voice system status:[^.]+\./g, '') // Remove system status
      .replace(/\(I remember [^)]+\)/g, '') // Remove memory notes in parentheses
      .trim();
    
    // Disability-specific speech adjustments
    switch (disability.toLowerCase()) {
      case "adhd":
        // Slightly faster, more energetic delivery
        localSpeed = Math.max(localSpeed, 1.1);
        cleanText = cleanText.replace(/\.\s+/g, '. '); // Ensure pauses between points
        break;
      case "autism":
        // Clear, consistent delivery
        localSpeed = Math.min(localSpeed, 1.0); // Not too fast
        cleanText = cleanText.replace(/(\d+\.)/g, 'Step $1'); // Make numbered lists clearer
        break;
      case "dyslexia":
        // Slower, clearer pronunciation
        localSpeed = Math.min(localSpeed, 0.9);
        break;
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voiceObj = voices.find((v) => v.name === localVoice);
    if (voiceObj) {
      utterance.voice = voiceObj;
      utterance.lang = voiceObj.lang;
    } else {
      utterance.lang = language || "en-US";
    }
    utterance.rate = localSpeed;
    utterance.pitch = localPitch;
    utterance.volume = 0.92;
    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log("🗣️ [Voice] Started speaking");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      console.log("🔇 [Voice] Finished speaking");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      console.error("[Voice] Speech synthesis error");
    };
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported. Try Chrome, Edge, or Safari.");
      return;
    }
    if (!reducedMotion) {
      buttonControls.start({
        scale: [1, 0.95, 1.1, 1],
        transition: { duration: 0.3 },
      });
    }
    recognitionRef.current.start();
  };

  // Clear conversation and memory
  const clearMessages = () => {
    clearVoiceMemory();
    setMessages([{
      sender: "gpt",
      text: getWelcomeMessage(disability) + "\n\nSpeak whenever you're ready! I'll remember our conversation.",
      id: Date.now()
    }]);
  };

  // Get disability icon
  const getDisabilityIcon = (disability) => {
    switch (disability.toLowerCase()) {
      case 'adhd': return '🧠';
      case 'autism': return '🌈';
      case 'dyslexia': return '💚';
      default: return '🤖';
    }
  };

  // Animation variants
  const headerVariants = {
    hidden: { y: -80, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        duration: reducedMotion ? 0.1 : 0.6
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: reducedMotion ? 0.1 : 0.6,
        delay: reducedMotion ? 0 : 0.2
      }
    }
  };

  // Apply dyslexia-specific class
  const containerClasses = `voice-area ${disability === 'dyslexia' ? 'dyslexia-mode' : ''}`;

  /* ---------- Listening Waves Component ---------- */
  const ListeningWaves = () => (
    <AnimatePresence>
      {isListening && (
        <motion.div
          className="voice-waves"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {["0s", "0.4s", "0.8s"].map((delay, i) => (
            <div
              key={i}
              className={`wave w${i + 1}`}
              style={{
                animationDelay: reducedMotion ? '0s' : delay
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      className={containerClasses}
      style={{
        fontSize: `${fontSize}rem`
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.6 }}
    >
      {/* Memory Status Notification */}
      <AnimatePresence>
        {showMemoryStatus && (
          <motion.div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'rgba(16, 185, 129, 0.9)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '500',
              zIndex: 1001,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            🎤 Voice conversation restored
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar - Matching ChatInterface */}
      <motion.header
        className="voice-header"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Switch to Text Chat Button */}
        {onSwitchMode && (
          <motion.button
            className="header-button primary"
            onClick={onSwitchMode}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 0.2 }}
          >
            <span>💬</span>
            <span className="button-text">Text Mode</span>
          </motion.button>
        )}

        {/* Title in center with disability indicator */}
        <motion.div
          className="assistant-title"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.4 }}
        >
          <span className="title-main">
            {assistantTitle} {getDisabilityIcon(disability)}
          </span>
          <span className="title-sub">
            {disability.toUpperCase()} Voice Mode • Memory Active
          </span>
        </motion.div>

        {/* Clear & Sign Out Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            className="header-button"
            onClick={clearMessages}
            title="Clear voice conversation and memory"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 0.25 }}
          >
            <span>🗑️</span>
            <span className="button-text">Clear</span>
          </motion.button>

          {onSignOut && (
            <motion.button
              className="header-button danger"
              onClick={onSignOut}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.3 }}
            >
              <span>🚪</span>
              <span className="button-text">Sign Out</span>
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Main Content Area */}
      <motion.div 
        className="voice-content"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Listening waves */}
        <ListeningWaves />

        {/* Voice Controls */}
        <motion.div
          className="voice-controls"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.3 }}
        >
          <motion.button
            className={`primary-btn ${isListening ? 'listening' : ''}`}
            onClick={startListening}
            disabled={isListening || isSpeaking}
            animate={buttonControls}
            whileHover={!isListening && !isSpeaking && !reducedMotion ? { 
              scale: 1.05, 
              y: -3
            } : {}}
            whileTap={!isListening && !isSpeaking ? { scale: 0.95 } : {}}
          >
            <span>{isListening ? "🎤" : "🗣️"}</span>
            <span>{isListening ? "Listening..." : `Speak (${disability.toUpperCase()} mode)`}</span>
          </motion.button>

          <AnimatePresence>
            {isSpeaking && (
              <motion.button
                className="secondary-btn stop-btn"
                onClick={stopSpeaking}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={!reducedMotion ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.95 }}
              >
                🔇 Stop
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            className="secondary-btn"
            onClick={() => setShowSettings((v) => !v)}
            whileHover={!reducedMotion ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
          >
            ⚙️ Settings
          </motion.button>
        </motion.div>

        {/* Enhanced Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="quick-settings"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: reducedMotion ? 0.1 : 0.3 }}
            >
              <div className="setting-group">
                <label>Voice Speed: {localSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={localSpeed}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setLocalSpeed(v);
                    setSpeed?.(v);
                  }}
                />
              </div>
              
              <div className="setting-group">
                <label>Voice Pitch: {localPitch.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={localPitch}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setLocalPitch(v);
                    setPitch?.(v);
                  }}
                />
              </div>
              
              <div className="setting-group">
                <label>Voice</label>
                <select
                  value={localVoice}
                  onChange={(e) => {
                    setLocalVoice(e.target.value);
                    setSelectedVoice?.(e.target.value);
                  }}
                >
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
              
              <motion.button
                className="test-btn"
                onClick={() => speak(`This is a test of the ${disability} voice assistant with memory. Speech has been optimized for your accessibility needs and I remember our previous conversations.`)}
                whileHover={!reducedMotion ? { scale: 1.02, y: -2 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                🔊 Test Voice
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Conversation Log with Memory */}
        <motion.div
          className="voice-log"
          ref={messagesRef}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.4 }}
        >
          <div className="log-header">
            <h3>🎤 Voice History ({disability.toUpperCase()} Mode) • Memory Active</h3>
            <div className="log-controls">
              <motion.button
                className="clear-btn"
                onClick={clearMessages}
                title="Clear voice conversation and memory"
                whileHover={!reducedMotion ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.95 }}
              >
                Clear All
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {messages.length === 1 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reducedMotion ? 0.1 : 0.4 }}
              >
                <div className="empty-icon">🎤</div>
                <h3>Ready for voice chat with memory!</h3>
                <p>
                  Press "Speak" to start a conversation in <strong>{disability.toUpperCase()}</strong> mode.
                  <br />
                  Your responses will be optimized for {disability} accessibility and I'll remember our conversation history.
                </p>
              </motion.div>
            ) : (
              messages.map((m, index) => (
                <motion.div
                  key={m.id}
                  className={`log-message ${m.sender}`}
                  initial={{ opacity: 0, x: -40, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.98 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25 }}
                  layout
                  whileHover={!reducedMotion ? { 
                    scale: 1.01,
                    transition: { duration: 0.2 }
                  } : {}}
                >
                  <div className="message-header">
                    <span className="sender-icon">
                      {m.sender === "user" ? "👤" : m.sender === "gpt" ? "🤖" : "⚙️"}
                    </span>
                    <span className="sender-name">
                      {m.sender === "user" ? "You" : 
                       m.sender === "gpt" ? `${disability.toUpperCase()} Assistant` : 
                       "System"}
                    </span>
                    {typeof m.confidence === "number" && (
                      <span
                        className={`confidence ${
                          m.confidence > 0.8 ? 'high' : 
                          m.confidence > 0.5 ? 'medium' : 'low'
                        }`}
                      >
                        {Math.round(m.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="message-content">
                    {m.loading ? `Processing your voice message in ${disability.toUpperCase()} mode using conversation memory...` : m.text}
                  </div>
                  
                  {/* Message timestamp and index for reference */}
                  {m.sender !== 'gpt' || index === 0 ? null : (
                    <div style={{ 
                      fontSize: '0.7rem', 
                      opacity: 0.5, 
                      marginTop: '6px', 
                      textAlign: 'right' 
                    }}>
                      Voice #{index} • {new Date(m.id).toLocaleTimeString()}
                    </div>
                  )}
                  
                  {m.sender === "gpt" && !m.loading && (
                    <motion.button
                      className="replay-btn"
                      onClick={() => speak(m.text)}
                      title="Replay message"
                      whileHover={!reducedMotion ? { 
                        scale: 1.2,
                        transition: { duration: 0.2 }
                      } : {}}
                      whileTap={{ scale: 0.9 }}
                    >
                      🔄
                    </motion.button>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          className={`status-indicator ${
            isListening ? 'listening' : 
            isSpeaking ? 'speaking' : 'idle'
          }`}
          title={
            isListening ? "Listening - Memory Active" : 
            isSpeaking ? "Speaking" : 
            "Idle - Ready with Memory"
          }
          aria-label={
            isListening ? "Listening with memory active" : 
            isSpeaking ? "Speaking" : 
            "Idle and ready with conversation memory"
          }
          initial={{ scale: 0.95, opacity: 0.9 }}
          animate={{ 
            scale: isListening && !reducedMotion ? [1, 1.2, 1] : 1, 
            opacity: 1 
          }}
          transition={{ 
            duration: isListening && !reducedMotion ? 1.5 : 0.3, 
            repeat: isListening && !reducedMotion ? Infinity : 0 
          }}
        />
      </motion.div>
    </motion.div>
  );
}