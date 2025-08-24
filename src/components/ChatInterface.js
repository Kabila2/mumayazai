/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  getCurrentDisability, 
  getDisabilityTheme,
  getWelcomeMessage,
  createDisabilityAwarePrompt,
  formatAIResponse,
  getDisabilityErrorMessage
} from "../utils/disabilityUtils";

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

/** Enhanced AI chat with disability-specific prompting */
const aiChat = async (prompt, ms = 20000) => {
  if (!hasPuter()) throw new Error("Puter SDK not available");
  
  console.log("🎯 Sending disability-aware prompt to AI:", prompt.substring(0, 200) + "...");
  
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("AI request timed out")), ms)
  );
  
  const req = (async () => {
    const resp = await puter.ai.chat(prompt);
    const responseText = typeof resp === "string" ? resp : resp?.message?.content ?? "";
    console.log("🤖 Raw AI response:", responseText.substring(0, 200) + "...");
    return responseText;
  })();
  
  return Promise.race([req, timeout]);
};

/** Enhanced mock AI that demonstrates disability formatting */
const mockAI = (prompt, disability) => {
  const userInput = (prompt.split("User:").pop() || "").trim();
  
  // Generate disability-specific mock responses
  switch (disability.toLowerCase()) {
    case "adhd":
      return `🧠 ADHD-FRIENDLY RESPONSE:

• I understand you said: "${userInput}"
• This is a mock response (AI offline)
• Here are 3 key points:
  - Short, focused answers work best
  - Bullet points help organize thoughts
  - Clear structure reduces overwhelm`;

    case "autism":
      return `🌈 AUTISM-FRIENDLY RESPONSE:

I received your message: "${userInput}"

This is a direct response format designed for autism accessibility:
1. Clear, literal language
2. Specific structure with numbered steps
3. No metaphors or ambiguous phrases
4. Consistent formatting throughout

Note: AI system is currently offline (demo mode).`;

    case "dyslexia":
    default:
      return `💚 DYSLEXIA-FRIENDLY RESPONSE:

You asked: "${userInput}"

I'm in demo mode right now. The AI is offline.

Here's what would normally happen:
• Simple, clear words
• Short sentences
• Good spacing between ideas
• Easy-to-read format

This helps make text more accessible.`;
  }
};

/** Enhanced AI response handler with proper disability formatting */
const getAIResponse = async (prompt, disability) => {
  // Wait up to 3s for the SDK before falling back to mock
  const ready = await waitForPuter(3000);
  
  if (!ready) {
    console.log("🔄 Using mock AI response for disability:", disability);
    return mockAI(prompt, disability);
  }
  
  try {
    const rawResponse = await aiChat(prompt, 20000);
    
    // Enhanced response formatting
    const formattedResponse = formatAIResponse(rawResponse, disability);
    console.log("✅ Formatted response for", disability, ":", formattedResponse.substring(0, 100) + "...");
    
    return formattedResponse;
  } catch (err) {
    console.warn("[ChatInterface] AI error:", err);
    return getDisabilityErrorMessage(disability);
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
  
  // Ensure we always have the current disability
  const activeDisability = currentDisability || getCurrentDisability();
  const theme = getDisabilityTheme(activeDisability);
  
  console.log("🎯 ChatInterface initialized with disability:", activeDisability);
  
  const [messages, setMessages] = useState([
    {
      sender: "gpt",
      text: getWelcomeMessage(activeDisability),
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
    console.log("🔄 Disability changed to:", activeDisability);
    setMessages([{
      sender: "gpt",
      text: getWelcomeMessage(activeDisability),
      id: Date.now()
    }]);
  }, [activeDisability]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    console.log("📤 Sending message with disability context:", activeDisability);
    console.log("💬 User message:", text);

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
      // Create ENHANCED disability-specific prompt
      const enhancedPrompt = createDisabilityAwarePrompt(text, activeDisability, false);
      
      console.log("🎯 Enhanced prompt created for", activeDisability);
      console.log("📝 Prompt preview:", enhancedPrompt.substring(0, 300) + "...");

      const resp = await getAIResponse(enhancedPrompt, activeDisability);

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: resp, id: loadingId } : m
        )
      );
      
      console.log("✅ Response displayed for", activeDisability);
      
    } catch (err) {
      const errorMsg = getDisabilityErrorMessage(activeDisability);
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: errorMsg, id: loadingId } : m
        )
      );
      console.error("[ChatInterface] AI error:", err);
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

        {/* Title in center - PROPERLY CENTERED with disability indicator */}
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
          {activeDisability === 'adhd' && ' 🧠'}
          {activeDisability === 'autism' && ' 🌈'}
          {activeDisability === 'dyslexia' && ' 💚'}
          <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>
            {activeDisability.toUpperCase()} Mode Active
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
                  direction: 'ltr',
                  whiteSpace: 'pre-wrap' // Important for preserving formatting
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
                    <span>Thinking ({activeDisability.toUpperCase()} mode)</span>
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
            placeholder={`Type your message... (${activeDisability.toUpperCase()} mode - responses will be optimized for your needs)`}
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
              minWidth: '100px',
              transition: 'all 0.3s ease'
            }}
            whileHover={!isSending && input.trim() && !reducedMotion ? { 
              scale: 1.05, 
              y: -3,
              boxShadow: `0 8px 25px ${theme.primary}50`
            } : {}}
            whileTap={!isSending && input.trim() ? { scale: 0.95 } : {}}
          >
            {isSending ? "Sending..." : `Send (${activeDisability.toUpperCase()})`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;