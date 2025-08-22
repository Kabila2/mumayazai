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
  reducedMotion = false
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
      {onSwitchMode && (
        <motion.button
          onClick={onSwitchMode}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            zIndex: 10
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          → Switch to Voice Chat
        </motion.button>
      )}

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
          overflow: 'hidden'
        }}
      >
        <motion.div
          style={{
            padding: '1rem',
            fontWeight: 'bold',
            background: theme.headerBg,
            color: theme.textColor,
            textAlign: 'center',
            fontSize: '1.2rem'
          }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          {assistantTitle} 
          {currentDisability === 'adhd' && ' 🧠'}
          {currentDisability === 'autism' && ' 🌈'}
          {currentDisability === 'dyslexia' && ' 💚'}
        </motion.div>

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
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
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
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

        <div style={{
          padding: '1rem',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          gap: '0.75rem',
          borderTop: `2px solid ${theme.borderColor}`,
          direction: 'ltr'
        }}>
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
              direction: 'ltr'
            }}
            whileFocus={{
              borderColor: theme.focusBorderColor,
              boxShadow: `0 0 0 3px ${theme.primary}33`
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
              minWidth: '80px'
            }}
            whileHover={!isSending && input.trim() ? { scale: 1.05, y: -3 } : {}}
            whileTap={!isSending && input.trim() ? { scale: 0.95 } : {}}
          >
            {isSending ? "Sending..." : "Send"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;