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
  
  console.log("🎯 [Voice] Sending disability-aware prompt to AI:", prompt.substring(0, 200) + "...");
  
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

/** Enhanced mock AI for voice mode with disability-specific responses */
const mockAI = (prompt, disability) => {
  const userInput = (prompt.split("User:").pop() || "").trim();
  
  // Generate disability-specific mock responses optimized for voice
  switch (disability.toLowerCase()) {
    case "adhd":
      return `🧠 ADHD-FRIENDLY RESPONSE:

Voice mode is offline right now, but here's how I'd help you:

• Short, focused responses
• Key points only
• No overwhelming details
• Clear next steps

You said: "${userInput}"

I'd break this down into simple chunks for easy listening.`;

    case "autism":
      return `🌈 AUTISM-FRIENDLY RESPONSE:

Voice system status: Currently in demo mode.

Your input was: "${userInput}"

My response pattern for autism support:
1. Direct, clear language
2. Specific information
3. Consistent voice tone
4. No figurative language
5. Predictable structure

This ensures reliable communication.`;

    case "dyslexia":
    default:
      return `💚 DYSLEXIA-FRIENDLY RESPONSE:

You said: "${userInput}"

Voice mode is in demo right now.

I would speak clearly and slowly for you:
• Simple words
• Short sentences  
• Good pace
• Clear pronunciation

This helps with audio processing.`;
  }
};

/** Enhanced AI response handler for voice mode */
const getAIResponse = async (prompt, disability) => {
  const ready = await waitForPuter(3000);
  
  if (!ready) {
    console.log("🔄 [Voice] Using mock AI response for disability:", disability);
    return mockAI(prompt, disability);
  }
  
  try {
    const rawResponse = await aiChat(prompt, 20000);
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

  console.log("🎯 [Voice] VoiceInterface initialized with disability:", disability);

  /* ---------- State ---------- */
  const [messages, setMessages] = useState([
    {
      sender: "gpt",
      text: getWelcomeMessage(disability) + "\n\nSpeak whenever you're ready!",
      id: Date.now()
    }
  ]);
  const [isListening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState(extVoices || []);
  const [localVoice, setLocalVoice] = useState(selectedVoice || "");
  const [localSpeed, setLocalSpeed] = useState(speed || 1);
  const [localPitch, setLocalPitch] = useState(pitch || 1);
  const [showSettings, setShowSettings] = useState(false);
  const [aiReady, setAiReady] = useState(hasPuter());

  const recognitionRef = useRef(null);
  const messagesRef = useRef(null);
  const buttonControls = useAnimation();

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

  // Update welcome message when disability changes
  useEffect(() => {
    console.log("🔄 [Voice] Disability changed to:", disability);
    setMessages([{
      sender: "gpt",
      text: getWelcomeMessage(disability) + "\n\nSpeak whenever you're ready!",
      id: Date.now()
    }]);
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
      console.log("🎤 [Voice] Started listening for", disability, "mode");
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
      console.log("🎯 [Voice] Processing for disability:", disability);
      
      setMessages((m) => [
        ...m,
        { sender: "user", text: text, confidence, id: Date.now() },
      ]);
      
      // Add loading message
      const loadingId = Date.now() + 1;
      setMessages((m) => [...m, { sender: "gpt", text: `Processing your request in ${disability.toUpperCase()} mode...`, loading: true, id: loadingId }]);
      
      try {
        // Enhanced: Use disability-aware prompting for voice mode
        const enhancedPrompt = createDisabilityAwarePrompt(text, disability, true); // true = voice mode
        
        console.log("🎯 [Voice] Enhanced prompt created for", disability);
        console.log("📝 [Voice] Prompt preview:", enhancedPrompt.substring(0, 300) + "...");

        const raw = await getAIResponse(enhancedPrompt, disability);
        
        setMessages((m) => 
          m.map(msg => 
            msg.id === loadingId ? { sender: "gpt", text: raw, id: loadingId } : msg
          )
        );
        
        console.log("✅ [Voice] Response displayed for", disability);
        
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
  }, [language, aiReady, disability]);

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
      .replace(/(ADHD-FRIENDLY RESPONSE:|AUTISM-FRIENDLY RESPONSE:|DYSLEXIA-FRIENDLY RESPONSE:)/g, '') // Remove prefixes
      .replace(/•/g, '') // Remove bullet points for speech
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
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

  const clearMessages = () => {
    setMessages([{
      sender: "gpt",
      text: getWelcomeMessage(disability) + "\n\nSpeak whenever you're ready!",
      id: Date.now()
    }]);
  };

  /* ---------- UI ---------- */
  const waves = isListening ? (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 0,
        filter: "blur(1px)",
      }}
    >
      {["0s", "0.4s", "0.8s"].map((delay, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 240,
            height: 240,
            borderRadius: "50%",
            border: `2px solid ${theme.waveBorder}`,
            opacity: 0,
            animation: reducedMotion ? "none" : `ring 2.2s ease-out ${delay} infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes ring {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.0; }
          25% { opacity: 0.6; }
          70% { opacity: 0.15; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  ) : null;

  return (
    <motion.div
      className={`voice-area ${highContrast ? "high-contrast" : ""}`}
      style={{
        fontSize: `${fontSize}rem`,
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0",
        background: "linear-gradient(135deg, #0a0a23 0%, #1a001a 50%, #000020 100%)",
        color: theme.textColor,
        overflow: "hidden",
        fontFamily: "'Lexend','Open Dyslexic', Arial, sans-serif",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.6 }}
    >
      {/* Top Navigation Bar */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'rgba(26, 0, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: `2px solid ${theme.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 1000
        }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, type: "spring", stiffness: 100 }}
      >
        {/* Switch to Text Chat Button */}
        {onSwitchMode && (
          <motion.button
            onClick={onSwitchMode}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              border: `2px solid ${theme.borderColor}`,
              borderRadius: '12px',
              color: theme.textColor,
              padding: '0.7rem 1.2rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
              transition: 'all 0.3s ease'
            }}
            whileHover={{ 
              scale: 1.05, 
              y: -2,
              background: theme.bubbleUserBg,
              boxShadow: `0 8px 25px ${theme.primary}30`
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 0.2 }}
          >
            <span>💬</span>
            Switch to Text
          </motion.button>
        )}

        {/* Title in center with disability indicator */}
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: theme.textColor,
            fontWeight: '700',
            fontSize: '1.1rem',
            letterSpacing: '0.02em'
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.4 }}
        >
          {assistantTitle}
          {disability === 'adhd' && ' 🧠'}
          {disability === 'autism' && ' 🌈'}
          {disability === 'dyslexia' && ' 💚'}
          <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>
            {disability.toUpperCase()} Voice Mode Active
          </div>
        </motion.div>

        {/* Sign Out Button */}
        {onSignOut && (
          <motion.button
            onClick={onSignOut}
            style={{
              background: 'linear-gradient(135deg, #ff4757, #ff3838)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              padding: '0.7rem 1.2rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(255, 71, 87, 0.3)',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
              transition: 'all 0.3s ease'
            }}
            whileHover={{ 
              scale: 1.05, 
              y: -2,
              boxShadow: '0 8px 25px rgba(255, 71, 87, 0.5)',
              background: 'linear-gradient(135deg, #ff3838, #ff2525)'
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 0.3 }}
          >
            <span>🚪</span>
            Sign Out
          </motion.button>
        )}
      </motion.div>

      {/* Main Content Area with top padding */}
      <div style={{ 
        paddingTop: '100px', 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '100px 1rem 2rem'
      }}>
        {/* Listening waves */}
        <AnimatePresence>{isListening && waves}</AnimatePresence>

        {/* Voice Controls */}
        <motion.div
          style={{
            display: "flex",
            gap: "1rem",
            margin: "2rem 0",
            flexWrap: "wrap",
            justifyContent: "center",
            zIndex: 2,
          }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.2 }}
        >
          <motion.button
            onClick={startListening}
            disabled={isListening || isSpeaking}
            animate={buttonControls}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.1rem",
              fontWeight: 700,
              background: theme.headerBg,
              border: "none",
              borderRadius: 16,
              color: theme.textColor,
              cursor: isListening || isSpeaking ? "not-allowed" : "pointer",
              minWidth: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              opacity: isListening || isSpeaking ? 0.75 : 1,
              boxShadow: isListening && !reducedMotion ? `0 0 40px ${theme.ringGlow}` : "0 4px 15px rgba(0, 0, 0, 0.2)",
              transition: 'all 0.3s ease'
            }}
            whileHover={!isListening && !isSpeaking && !reducedMotion ? { 
              scale: 1.05, 
              y: -3,
              boxShadow: `0 8px 25px ${theme.primary}50`
            } : {}}
            whileTap={!isListening && !isSpeaking ? { scale: 0.95 } : {}}
          >
            <span>{isListening ? "🎤" : "🗣️"}</span>
            {isListening ? "Listening..." : `Speak (${disability.toUpperCase()} mode)`}
          </motion.button>

          {isSpeaking && (
            <motion.button
              onClick={stopSpeaking}
              style={{
                padding: "0.85rem 1.5rem",
                fontSize: "1rem",
                background: "#f44336",
                border: "none",
                borderRadius: 16,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={!reducedMotion ? { scale: 1.05 } : {}}
            >
              🔇 Stop
            </motion.button>
          )}

          <motion.button
            onClick={() => setShowSettings((v) => !v)}
            style={{
              padding: "0.85rem 1.5rem",
              fontSize: "1rem",
              background: "rgba(255,255,255,0.12)",
              border: `2px solid ${theme.borderColor}`,
              borderRadius: 16,
              color: theme.textColor,
              cursor: "pointer",
              fontWeight: 600,
              backdropFilter: "blur(8px)",
            }}
            whileHover={!reducedMotion ? { scale: 1.05 } : {}}
          >
            ⚙️ Settings
          </motion.button>

          <motion.button
            onClick={clearMessages}
            style={{
              padding: "0.85rem 1.5rem",
              fontSize: "1rem",
              background: "rgba(255,255,255,0.12)",
              border: `2px solid ${theme.borderColor}`,
              borderRadius: 16,
              color: theme.textColor,
              cursor: "pointer",
              fontWeight: 600,
            }}
            whileHover={!reducedMotion ? { scale: 1.05 } : {}}
          >
            🗑️ Clear
          </motion.button>
        </motion.div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              style={{
                background: theme.panelBg,
                backdropFilter: "blur(16px)",
                borderRadius: 16,
                padding: "1.25rem",
                margin: "0.5rem 0 0.5rem",
                minWidth: 320,
                border: `1px solid ${theme.borderColor}`,
              }}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
            >
              <div style={{ marginBottom: "0.85rem" }}>
                <label style={{ display: "block", marginBottom: 6, color: theme.textColor }}>
                  Voice Speed: {localSpeed.toFixed(1)}x
                </label>
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
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "0.85rem" }}>
                <label style={{ display: "block", marginBottom: 6, color: theme.textColor }}>
                  Voice Pitch: {localPitch.toFixed(1)}
                </label>
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
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "0.85rem" }}>
                <label style={{ display: "block", marginBottom: 6, color: theme.textColor }}>Voice</label>
                <select
                  value={localVoice}
                  onChange={(e) => {
                    setLocalVoice(e.target.value);
                    setSelectedVoice?.(e.target.value);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: 10,
                    border: `1px solid ${theme.borderColor}`,
                    background: "rgba(0,0,0,0.35)",
                    color: theme.textColor,
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
                onClick={() => speak(`This is a test of the ${disability} voice assistant settings. Speech has been optimized for your accessibility needs.`)}
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  background: theme.headerBg,
                  border: "none",
                  borderRadius: 10,
                  color: theme.textColor,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                whileHover={!reducedMotion ? { scale: 1.02, y: -2 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                🔊 Test Voice
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation Log */}
        <motion.div
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 840,
            background: theme.panelBg,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: 16,
            padding: "1rem",
            marginTop: "1rem",
            overflowY: "auto",
            maxHeight: "50vh",
          }}
          ref={messagesRef}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.25 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
              paddingBottom: "0.5rem",
              borderBottom: `1px solid ${theme.borderColor}`,
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.15rem", color: theme.textColor }}>
              🎤 Voice History ({disability.toUpperCase()} Mode)
            </h3>
          </div>

          <AnimatePresence mode="popLayout">
            {messages.length === 1 ? (
              <motion.div 
                style={{
                  textAlign: "center",
                  padding: "3rem 1rem",
                  color: theme.textAlt,
                  opacity: 0.7
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.7, scale: 1 }}
                transition={{ duration: reducedMotion ? 0.1 : 0.4 }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎤</div>
                <h4 style={{ margin: "0 0 0.5rem 0" }}>Ready for voice chat!</h4>
                <p style={{ margin: 0 }}>
                  Press "Speak" to start a conversation in <strong>{disability.toUpperCase()}</strong> mode.
                  <br />
                  <small>Your responses will be optimized for {disability} accessibility and spoken aloud.</small>
                </p>
              </motion.div>
            ) : (
              messages.map((m) => (
                <motion.div
                  key={m.id}
                  style={{
                    background: m.sender === "user"
                      ? "rgba(255,255,255,0.06)"
                      : m.sender === "gpt" 
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,152,0,0.08)",
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: 12,
                    padding: "0.85rem 1rem",
                    marginBottom: "0.75rem",
                    position: "relative",
                    color: theme.textAlt,
                  }}
                  initial={{ opacity: 0, x: -40, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.98 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25 }}
                  layout
                  whileHover={!reducedMotion ? { 
                    scale: 1.01, 
                    background: m.sender === "user" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.1)" 
                  } : {}}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: "1.1rem" }}>
                      {m.sender === "user" ? "👤" : m.sender === "gpt" ? "🤖" : "⚙️"}
                    </span>
                    <b>
                      {m.sender === "user" ? "You" : 
                       m.sender === "gpt" ? `${disability.toUpperCase()} Assistant` : 
                       "System"}
                    </b>
                    {typeof m.confidence === "number" && (
                      <span
                        style={{
                          marginLeft: "auto",
                          padding: "0.15rem 0.45rem",
                          borderRadius: 10,
                          fontSize: "0.8rem",
                          background:
                            m.confidence > 0.8
                              ? "rgba(76,175,80,0.22)"
                              : m.confidence > 0.5
                              ? "rgba(255,152,0,0.22)"
                              : "rgba(244,67,54,0.22)",
                          color:
                            m.confidence > 0.8 ? "#4CAF50" : m.confidence > 0.5 ? "#FF9800" : "#F44336",
                        }}
                      >
                        {Math.round(m.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    lineHeight: 1.6, 
                    whiteSpace: "pre-wrap" // Allow formatted responses from AI
                  }}>
                    {m.loading ? `Processing your request in ${disability.toUpperCase()} mode...` : m.text}
                  </div>
                  {m.sender === "gpt" && !m.loading && (
                    <motion.button
                      onClick={() => speak(m.text)}
                      title="Replay message"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "transparent",
                        border: "none",
                        color: theme.textAlt,
                        cursor: "pointer",
                        fontSize: "1.1rem",
                        padding: "0.3rem",
                        borderRadius: "50%",
                        transition: 'all 0.2s ease'
                      }}
                      whileHover={!reducedMotion ? { 
                        scale: 1.2, 
                        background: `${theme.primary}20` 
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
          title={isListening ? "Listening" : isSpeaking ? "Speaking" : "Idle"}
          aria-label={isListening ? "Listening" : isSpeaking ? "Speaking" : "Idle"}
          style={{
            position: "fixed",
            bottom: 10,
            right: 10,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: isListening ? theme.primary : isSpeaking ? "#FF9800" : "#8e2de2",
            boxShadow: `0 0 16px ${theme.ringGlow}`,
          }}
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
      </div>
    </motion.div>
  );
}