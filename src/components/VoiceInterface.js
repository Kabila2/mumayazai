/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import "./VoiceInterface.css";

/** ---------- Voice Memory System ---------- */
const VOICE_MEMORY_STORAGE_KEY = "mumayaz_voice_memory";
const MAX_VOICE_MEMORY_MESSAGES = 30;
const VOICE_CONTEXT_WINDOW = 8;

// Save voice conversation to localStorage
const saveVoiceMemory = (messages) => {
  try {
    const memoryData = {
      messages: messages.slice(-MAX_VOICE_MEMORY_MESSAGES),
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
const loadVoiceMemory = () => {
  try {
    const stored = localStorage.getItem(VOICE_MEMORY_STORAGE_KEY);
    if (!stored) return null;
    
    const memoryData = JSON.parse(stored);
    
    // Check if memory is recent (within 7 days)
    const isRecent = Date.now() - memoryData.timestamp < 7 * 24 * 60 * 60 * 1000;
    
    if (isRecent && memoryData.messages?.length) {
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
const buildVoiceContext = (messages) => {
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
  
  return `\n\nVoice conversation history:\n${recentMessages.join('\n')}\n\nCurrent voice input:\n`;
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
  
  console.log("🎯 [Voice] Sending prompt with memory to AI:", prompt.substring(0, 200) + "...");
  
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
const mockAI = (prompt, hasContext = false) => {
  const userInput = (prompt.split("Current voice input:").pop() || prompt.split("User:").pop() || "").trim();
  
  const contextNote = hasContext ? "\n\n(I remember our voice conversation)" : "";
  
  const responses = [
    `You said: "${userInput}"\n\nVoice mode is currently in demo. I can help you with questions and tasks, and I'll remember our conversation for better continuity.${contextNote}`,
    `I understand you're asking about: "${userInput}"\n\nThis is voice demonstration mode. I maintain conversation history and provide clear, spoken responses optimized for voice interaction.${contextNote}`,
    `Your voice input: "${userInput}"\n\nI'm running in demo mode right now. I can assist with various topics while maintaining our conversation history for better context.${contextNote}`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

/** Enhanced AI response handler for voice mode with memory */
const getVoiceAIResponse = async (prompt, conversationContext = "") => {
  const ready = await waitForPuter(3000);
  
  // Add conversation context to the prompt if available
  const enhancedPrompt = conversationContext 
    ? prompt + conversationContext 
    : prompt;
  
  if (!ready) {
    console.log("🔄 [Voice] Using mock AI response");
    return mockAI(enhancedPrompt, !!conversationContext);
  }
  
  try {
    const rawResponse = await aiChat(enhancedPrompt, 20000);
    console.log("✅ [Voice] Formatted response:", rawResponse.substring(0, 100) + "...");
    return rawResponse;
  } catch (err) {
    console.warn("[VoiceInterface] AI error:", err);
    return "I'm having trouble connecting right now. Please try speaking again in a moment.";
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
  onSignOut
}) {

  const assistantTitle = "AI Voice Assistant";

  console.log("🎯 [Voice] VoiceInterface initialized with memory");

  /* ---------- State with Memory ---------- */
  // Initialize messages with memory or welcome message
  const [messages, setMessages] = useState(() => {
    const savedMessages = loadVoiceMemory();
    if (savedMessages && savedMessages.length > 0) {
      return savedMessages;
    }
    return [{
      sender: "gpt",
      text: "Hello! I'm your AI voice assistant. I can help you with questions, provide information, and assist with various tasks. Speak whenever you're ready! I'll remember our conversation.",
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
      saveVoiceMemory(messages);
    }
  }, [messages]);

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        // Immediate scroll for user messages and loading states
        if (lastMessage.sender === "user" || lastMessage.loading) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        } else {
          // Smooth scroll for AI responses
          setTimeout(() => {
            if (messagesRef.current) {
              messagesRef.current.scrollTo({
                top: messagesRef.current.scrollHeight,
                behavior: reducedMotion ? 'auto' : 'smooth'
              });
            }
          }, 100);
        }
      }
    }
  }, [messages, reducedMotion]);

  // Show memory status notification
  useEffect(() => {
    const savedMessages = loadVoiceMemory();
    if (savedMessages && savedMessages.length > 1) {
      setShowMemoryStatus(true);
      const timer = setTimeout(() => setShowMemoryStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

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
      console.log("🎤 [Voice] Started listening with memory");
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
      console.log("🎯 [Voice] Processing with memory");
      
      const newUserMessage = { sender: "user", text: text, confidence, id: Date.now() };
      setMessages((m) => [...m, newUserMessage]);
      
      try {
        // Build conversation context from previous messages
        const updatedMessages = messages.concat([newUserMessage]);
        const conversationContext = buildVoiceContext(updatedMessages);
        
        console.log("🎯 [Voice] Enhanced prompt with memory created");
        console.log("📝 [Voice] Context preview:", conversationContext.substring(0, 200) + "...");

        const raw = await getVoiceAIResponse(text, conversationContext);
        
        setMessages((m) => [
          ...m,
          { sender: "gpt", text: raw, id: Date.now() + 1 }
        ]);
        
        console.log("✅ [Voice] Response with memory displayed");
        
        // Speak the response
        speak(raw);
        
      } catch (err) {
        const errorMsg = "I'm having trouble connecting to the AI right now. Please try speaking again.";
        setMessages((m) => [
          ...m,
          { sender: "gpt", text: errorMsg, id: Date.now() + 1 }
        ]);
        speak("I'm having trouble connecting to the AI right now.");
        console.error("[VoiceInterface] AI error:", err);
      }
    };

    recognitionRef.current = recog;
  }, [language, aiReady, messages]);

  /* ---------- Enhanced Speech Function ---------- */
  const speak = (text) => {
    console.log("🔊 [Voice] Speaking response");
    
    // Prefer external speak if passed from App
    if (typeof extSpeak === "function") {
      extSpeak(text);
      return;
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Enhanced text cleaning for better speech
    let cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/[📋🎯✨🧠🌈💚⚠️⚙️]/g, '') // Remove emojis
      .replace(/•/g, '') // Remove bullet points for speech
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .replace(/Memory status:[^.]+\./g, '') // Remove memory status lines
      .replace(/Voice system status:[^.]+\./g, '') // Remove system status
      .replace(/\(I remember [^)]+\)/g, '') // Remove memory notes in parentheses
      .trim();
    
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
      text: "Hello! I'm your AI voice assistant. I can help you with questions, provide information, and assist with various tasks. Speak whenever you're ready! I'll remember our conversation.",
      id: Date.now()
    }]);
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
      className="voice-area"
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

        {/* Title in center */}
        <motion.div
          className="assistant-title"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.4 }}
        >
          <span className="title-main">
            {assistantTitle} 🤖
          </span>
          <span className="title-sub">
            Voice Mode • Memory Active
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
            <span>{isListening ? "Listening..." : "Speak"}</span>
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
                onClick={() => speak(`This is a test of the voice assistant with memory. Speech has been optimized for accessibility and I remember our previous conversations.`)}
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
            <h3>🎤 Voice History • Memory Active</h3>
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
                  Press "Speak" to start a conversation.
                  <br />
                  Your responses will be optimized for voice interaction and I'll remember our conversation history.
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
                       m.sender === "gpt" ? "AI Assistant" : 
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
                    {m.text}
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