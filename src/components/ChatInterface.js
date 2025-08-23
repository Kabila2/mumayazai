/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

/** ---------- Shared AI helpers ---------- */
const hasPuter = () =>
  typeof window !== "undefined" &&
  window.puter &&
  puter.ai &&
  typeof puter.ai.chat === "function";

/** wait briefly for Puter SDK to attach before giving up */
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

/** timeout + puter presence check */
const aiChat = async (prompt, ms = 20000) => {
  if (!hasPuter()) throw new Error("Puter SDK not available");
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("AI request timed out")), ms)
  );
  const req = (async () => {
    const resp = await puter.ai.chat(prompt);
    return typeof resp === "string" ? resp : resp?.message?.content ?? "";
  })();
  return Promise.race([req, timeout]);
};

/** graceful fallback so UI still works offline */
const mockAI = (prompt, disability) => {
  const lastUser = (prompt.split("\n").pop() || "").replace(/^User:\s*/i, "");
  return (
    `⚠️ AI offline (mock mode).\n` +
    `• I received: "${lastUser}"\n` +
    `• This is ${disability.toUpperCase()}-friendly mode\n` +
    `• Tip: ensure the Puter SDK script is loaded before your app.\n` +
    `• Dev: open console for details.`
  );
};

const getAIResponse = async (prompt, disability) => {
  // 👇 Wait up to 3s for the SDK before falling back to mock
  const ready = await waitForPuter(3000);
  if (!ready) return mockAI(prompt, disability);
  try {
    return await aiChat(prompt, 20000);
  } catch (err) {
    console.warn("[ChatInterface] AI error:", err);
    return mockAI(prompt, disability);
  }
};

/** ---------- Disability-specific themes ---------- */
const getDisabilityTheme = (disability) => {
  switch (disability?.toLowerCase()) {
    case "adhd":
      return {
        headerBg: "linear-gradient(135deg, #FF6F00, #FF8F00)",
        primary: "#FF8F00",
        accentColor: "#FF6F00",
        textColor: "#ffffff",
        bubbleUserBg: "linear-gradient(135deg, #FF6F00, #FF8F00)",
        bubbleGptBg: "linear-gradient(135deg, rgba(255, 143, 0, 0.15), rgba(255, 111, 0, 0.1))",
        borderColor: "rgba(255, 143, 0, 0.4)",
        inputBorderColor: "rgba(255, 143, 0, 0.4)",
        focusBorderColor: "#FF8F00"
      };
    case "autism":
      return {
        headerBg: "linear-gradient(135deg, #26A69A, #00796B)",
        primary: "#26A69A",
        accentColor: "#26A69A",
        textColor: "#E0F2F1",
        bubbleUserBg: "linear-gradient(135deg, #26A69A, #00796B)",
        bubbleGptBg: "linear-gradient(135deg, rgba(38, 166, 154, 0.15), rgba(0, 121, 107, 0.1))",
        borderColor: "rgba(38, 166, 154, 0.4)",
        inputBorderColor: "rgba(38, 166, 154, 0.4)",
        focusBorderColor: "#26A69A"
      };
    case "dyslexia":
    default:
      return {
        headerBg: "linear-gradient(135deg, #4CAF50, #45a049)",
        primary: "#4CAF50",
        accentColor: "#4CAF50",
        textColor: "#e8f5e8",
        bubbleUserBg: "linear-gradient(135deg, #4CAF50, #45a049)",
        bubbleGptBg: "linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(69, 160, 73, 0.1))",
        borderColor: "rgba(76, 175, 80, 0.4)",
        inputBorderColor: "rgba(76, 175, 80, 0.4)",
        focusBorderColor: "#4CAF50"
      };
  }
};

/** ---------- Get disability-specific welcome message ---------- */
const getWelcomeMessage = (disability) => {
  switch (disability?.toLowerCase()) {
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

/** ---------- Text Chat Interface ---------- */
const ChatInterface = ({ 
  onSwitchMode, 
  fontSize, 
  highContrast, 
  assistantTitle,
  currentDisability = "dyslexia",
  t = {},
  language = "en",
  reducedMotion = false,
  onSignOut
}) => {
  
  const theme = getDisabilityTheme(currentDisability);
  
  const [messages, setMessages] = useState([
    {
      sender: "gpt",
      text: getWelcomeMessage(currentDisability),
      id: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const controls = useAnimation();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update welcome message when disability changes
  useEffect(() => {
    setMessages([{
      sender: "gpt",
      text: getWelcomeMessage(currentDisability),
      id: Date.now()
    }]);
  }, [currentDisability]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    if (!reducedMotion) {
      await controls.start({ scale: 0.95, transition: { duration: 0.1 } });
      controls.start({ scale: 1, transition: { type: "spring", stiffness: 300, damping: 15 } });
    }

    const userId = Date.now();
    setMessages(prev => [...prev, { sender: "user", text, id: userId }]);
    setInput("");

    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { sender: "gpt", loading: true, id: loadingId }]);

    try {
      // Create disability-specific prompt
      const disabilityContext = {
        dyslexia: "Keep responses clear and well-structured. Use simple language, short paragraphs, and bullet points when helpful. Avoid complex jargon.",
        adhd: "Keep responses focused and concise. Break information into clear, manageable chunks. Stay on topic and avoid overwhelming details.",
        autism: "Be direct and literal in responses. Avoid metaphors or ambiguous language. Provide clear, step-by-step information when needed."
      };
      
      const context = disabilityContext[currentDisability.toLowerCase()] || disabilityContext.dyslexia;
      
      const prompt = `You are helping a user with ${currentDisability}. ${context}

User: ${text}`;
      
      const resp = await getAIResponse(prompt, currentDisability);
      const clean = resp.trim().replace(/[*_#]/g, '');

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: clean, id: loadingId } : m
        )
      );
    } catch (err) {
      const msg = err?.message || String(err);
      const helpful = hasPuter()
        ? "Network/API issue."
        : "Puter SDK not detected. Load https://sdk.puter.com/v1/sdk.js before your app.";
      const fallback = `⚠️ Connection error: ${msg}\n${helpful}`;
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: fallback, id: loadingId } : m
        )
      );
      console.warn("[ChatInterface] AI error:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        fontSize: `${fontSize}rem`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0',
        background: 'linear-gradient(135deg, #1a001a, #000020, #100018)',
        minHeight: '100vh',
        fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif"
      }}
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
        {/* Switch to Voice Button */}
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
            <span>🎤</span>
            Switch to Voice
          </motion.button>
        )}

        {/* Title in center - PROPERLY CENTERED */}
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: theme.textColor,
            fontWeight: '700',
            fontSize: '1.1rem',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap'
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.4 }}
        >
          {assistantTitle}
          {currentDisability === 'adhd' && ' 🧠'}
          {currentDisability === 'autism' && ' 🌈'}
          {currentDisability === 'dyslexia' && ' 💚'}
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

      <div
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(26, 0, 26, 0.8)',
          backdropFilter: 'blur(15px)',
          overflow: 'hidden',
          paddingTop: '80px' // Account for fixed header
        }}
      >
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          direction: 'ltr'
        }}>
          <AnimatePresence mode="popLayout">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                style={{
                  maxWidth: '80%',
                  padding: '1rem 1.5rem',
                  borderRadius: '16px',
                  background: msg.sender === 'user' ? theme.bubbleUserBg : theme.bubbleGptBg,
                  color: msg.sender === 'user' ? '#ffffff' : theme.textColor,
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  border: `2px solid ${theme.borderColor}`,
                  lineHeight: 1.8,
                  letterSpacing: '0.05em',
                  wordSpacing: '0.15em',
                  textAlign: 'left',
                  direction: 'ltr'
                }}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 20,
                  duration: reducedMotion ? 0.1 : 0.4
                }}
                whileHover={!reducedMotion ? { 
                  y: -2, 
                  boxShadow: `0 8px 25px ${theme.primary}30` 
                } : {}}
              >
                {msg.loading ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>Thinking</span>
                    {[0,1,2].map(i => (
                      <motion.div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: theme.primary
                        }}
                        animate={{ 
                          scale: reducedMotion ? 1 : [1, 1.5, 1], 
                          opacity: reducedMotion ? 0.7 : [0.4, 1, 0.4] 
                        }}
                        transition={{ 
                          duration: reducedMotion ? 0 : 1.4, 
                          repeat: reducedMotion ? 0 : Infinity, 
                          delay: reducedMotion ? 0 : i * 0.2 
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <span>{msg.text}</span>
                )}
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </AnimatePresence>
        </div>

        <motion.div 
          style={{
            padding: '1rem',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            gap: '0.75rem',
            borderTop: `2px solid ${theme.borderColor}`,
            direction: 'ltr'
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: reducedMotion ? 0 : 0.5, 
            duration: reducedMotion ? 0.1 : 0.6,
            type: "spring",
            stiffness: 100
          }}
        >
          <motion.input
            value={input}
            disabled={isSending}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Type your message... (${currentDisability.toUpperCase()} mode)`}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: `2px solid ${theme.inputBorderColor}`,
              background: 'rgba(26, 0, 26, 0.9)',
              color: theme.textColor,
              outline: 'none',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
              fontSize: '1rem',
              letterSpacing: '0.05em',
              lineHeight: 1.6,
              textAlign: 'left',
              direction: 'ltr',
              transition: 'all 0.3s ease'
            }}
            whileFocus={{
              borderColor: theme.focusBorderColor,
              boxShadow: `0 0 0 3px ${theme.primary}33`,
              scale: !reducedMotion ? 1.01 : 1
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            animate={controls}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: theme.bubbleUserBg,
              color: '#ffffff',
              cursor: isSending || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: isSending || !input.trim() ? 0.6 : 1,
              fontWeight: '600',
              fontSize: '1rem',
              minWidth: '80px',
              transition: 'all 0.3s ease'
            }}
            whileHover={!isSending && input.trim() && !reducedMotion ? { 
              scale: 1.05, 
              y: -3,
              boxShadow: `0 8px 25px ${theme.primary}50`
            } : {}}
            whileTap={!isSending && input.trim() ? { scale: 0.95 } : {}}
          >
            {isSending ? "Sending..." : "Send"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;