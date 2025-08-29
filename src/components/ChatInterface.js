/* global puter */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  getCurrentDisability, 
  getDisabilityTheme,
  getWelcomeMessage,
  createDisabilityAwarePrompt,
  formatAIResponse,
  getDisabilityErrorMessage
} from "../utils/disabilityUtils";

/** ---------- Mobile-optimized AI helpers ---------- */
const hasPuter = () =>
  typeof window !== "undefined" &&
  window.puter &&
  puter.ai &&
  typeof puter.ai.chat === "function";

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

/** Enhanced mock AI with mobile considerations */
const mockAI = (prompt, disability) => {
  const userInput = (prompt.split("User:").pop() || "").trim();
  
  switch (disability.toLowerCase()) {
    case "adhd":
      return `🧠 ADHD-FRIENDLY RESPONSE:

• You said: "${userInput}"
• This is demo mode (AI offline)
• Quick points:
  - Short answers
  - Clear structure  
  - Easy to scan
  - No overwhelm`;

    case "autism":
      return `🌈 AUTISM-FRIENDLY RESPONSE:

Input received: "${userInput}"

Demo mode active. Structured response:
1. Direct communication
2. Clear expectations
3. Consistent format
4. No ambiguous language

This format reduces uncertainty.`;

    case "dyslexia":
    default:
      return `💚 DYSLEXIA-FRIENDLY RESPONSE:

You asked: "${userInput}"

Demo mode is on right now.

Simple response format:
• Easy words
• Short lines
• Good spacing
• Clear meaning

This helps with reading.`;
  }
};

const getAIResponse = async (prompt, disability) => {
  const ready = await waitForPuter(3000);
  
  if (!ready) {
    console.log("🔄 Using mock AI response for disability:", disability);
    return mockAI(prompt, disability);
  }
  
  try {
    const rawResponse = await aiChat(prompt, 20000);
    const formattedResponse = formatAIResponse(rawResponse, disability);
    console.log("✅ Formatted response for", disability, ":", formattedResponse.substring(0, 100) + "...");
    return formattedResponse;
  } catch (err) {
    console.warn("[ChatInterface] AI error:", err);
    return getDisabilityErrorMessage(disability);
  }
};

/** ---------- Mobile Utilities ---------- */
const useViewportHeight = () => {
  const [height, setHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const updateHeight = () => {
      // Use visualViewport API if available (better for mobile)
      if (window.visualViewport) {
        setHeight(window.visualViewport.height);
      } else {
        setHeight(window.innerHeight);
      }
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    } else {
      window.addEventListener('resize', updateHeight);
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(updateHeight, 100);
    });
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      } else {
        window.removeEventListener('resize', updateHeight);
      }
    };
  }, []);
  
  return height;
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                   /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    const checkKeyboard = () => {
      if (window.visualViewport) {
        const heightDiff = window.screen.height - window.visualViewport.height;
        setKeyboardOpen(heightDiff > 150); // Threshold for keyboard detection
      }
    };
    
    checkMobile();
    checkKeyboard();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 100);
    });
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkKeyboard);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkKeyboard);
      }
    };
  }, []);
  
  return { isMobile, isLandscape, keyboardOpen };
};

/** ---------- Mobile-Optimized Chat Interface ---------- */
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
  
  const activeDisability = currentDisability || getCurrentDisability();
  const theme = getDisabilityTheme(activeDisability);
  const viewportHeight = useViewportHeight();
  const { isMobile, isLandscape, keyboardOpen } = useMobileDetection();
  const headerHeight = isLandscape && isMobile ? 56 : 80;
  
  console.log("🎯 ChatInterface initialized with disability:", activeDisability);
  console.log("📱 Mobile detection:", { isMobile, isLandscape, keyboardOpen });
  
  const [messages, setMessages] = useState([
    {
      sender: "gpt",
      text: getWelcomeMessage(activeDisability),
      id: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const controls = useAnimation();
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to bottom with mobile optimizations
  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ 
        behavior: smooth && !reducedMotion ? "smooth" : "auto",
        block: "nearest"
      });
    }
  }, [reducedMotion]);
  
  useEffect(() => {
    // Delay scroll to allow for keyboard animations
    const timeout = setTimeout(scrollToBottom, keyboardOpen ? 300 : 100);
    return () => clearTimeout(timeout);
  }, [messages, keyboardOpen, scrollToBottom]);

  // Handle viewport changes for mobile keyboards
  useEffect(() => {
    if (isMobile && isInputFocused) {
      document.body.style.height = `${viewportHeight}px`;
      return () => {
        document.body.style.height = '';
      };
    }
  }, [viewportHeight, isMobile, isInputFocused]);

  // Scroll indicator for mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      if (messagesRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollIndicator(!isNearBottom && messages.length > 3);
      }
    };
    
    const container = messagesRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages.length, isMobile]);

  // Update welcome message when disability changes
  useEffect(() => {
    console.log("🔄 Disability changed to:", activeDisability);
    setMessages([{
      sender: "gpt",
      text: getWelcomeMessage(activeDisability),
      id: Date.now()
    }]);
  }, [activeDisability]);

  // Mobile-optimized send handler
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    console.log("📤 Sending message with disability context:", activeDisability);
    console.log("💬 User message:", text);

    // Haptic feedback for mobile
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50);
    }

    setIsSending(true);
    if (!reducedMotion) {
      await controls.start({ scale: 0.95, transition: { duration: 0.1 } });
      controls.start({ scale: 1, transition: { type: "spring", stiffness: 300, damping: 15 } });
    }

    const userId = Date.now();
    setMessages(prev => [...prev, { sender: "user", text, id: userId }]);
    setInput("");
    
    // Blur input to hide keyboard on mobile
    if (isMobile && inputRef.current) {
      inputRef.current.blur();
      setIsInputFocused(false);
    }

    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { sender: "gpt", loading: true, id: loadingId }]);

    try {
      const enhancedPrompt = createDisabilityAwarePrompt(text, activeDisability, false);
      
      console.log("🎯 Enhanced prompt created for", activeDisability);
      console.log("🔍 Prompt preview:", enhancedPrompt.substring(0, 300) + "...");

      const resp = await getAIResponse(enhancedPrompt, activeDisability);

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: resp, id: loadingId } : m
        )
      );
      
      console.log("✅ Response displayed for", activeDisability);
      
      // Success haptic feedback
      if (navigator.vibrate && isMobile) {
        navigator.vibrate([50, 50, 50]);
      }
      
    } catch (err) {
      const errorMsg = getDisabilityErrorMessage(activeDisability);
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: errorMsg, id: loadingId } : m
        )
      );
      console.error("[ChatInterface] AI error:", err);
      
      // Error haptic feedback
      if (navigator.vibrate && isMobile) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, activeDisability, controls, reducedMotion, isMobile]);

  // Mobile keyboard handlers
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    // Scroll to input area on focus for mobile
    if (isMobile) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 300);
    }
  }, [isMobile]);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  // Dynamic styles based on mobile state
  const dynamicStyles = {
    container: {
      height: isMobile ? `${viewportHeight}px` : '100vh',
      '--mobile-keyboard-offset': keyboardOpen ? '20px' : '0px',
    },
    messagesContainer: {
      paddingBottom: keyboardOpen ? '20px' : '16px',
    },
    inputArea: {
      position: keyboardOpen ? 'fixed' : 'relative',
      bottom: keyboardOpen ? '0' : 'auto',
      left: keyboardOpen ? '0' : 'auto',
      right: keyboardOpen ? '0' : 'auto',
      zIndex: keyboardOpen ? 1000 : 'auto',
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
        fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
        ...dynamicStyles.container
      }}
    >
      {/* Top Navigation Bar - Mobile Optimized */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: `${headerHeight}px`,
          background: 'rgba(26, 0, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: `2px solid ${theme.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(0.5rem, 2vw, 1rem)',
          zIndex: 1000,
          // Safe area handling for mobile
          paddingTop: isMobile ? 'max(0.5rem, env(safe-area-inset-top))' : '0.5rem',
          paddingLeft: isMobile ? 'max(1rem, env(safe-area-inset-left))' : '1rem',
          paddingRight: isMobile ? 'max(1rem, env(safe-area-inset-right))' : '1rem',
        }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, type: "spring", stiffness: 100 }}
      >
        {/* Switch to Voice Button - Mobile Optimized */}
        {onSwitchMode && (
          <motion.button
            onClick={onSwitchMode}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              border: `2px solid ${theme.borderColor}`,
              borderRadius: '12px',
              color: theme.textColor,
              padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.2rem',
              cursor: 'pointer',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
              transition: 'all 0.3s ease',
              minHeight: '44px', // Touch target
              minWidth: '44px',
              whiteSpace: 'nowrap'
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
            {!isMobile || !isLandscape ? 'Voice' : '🎤'}
          </motion.button>
        )}

        {/* Title - Mobile Optimized */}
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: theme.textColor,
            fontWeight: '700',
            fontSize: isMobile ? (isLandscape ? '0.9rem' : '1rem') : '1.1rem',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            maxWidth: '60%',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.4 }}
        >
          <div>
            {isMobile && isLandscape ? 
              `${activeDisability.toUpperCase()} Chat` :
              assistantTitle
            }
            {activeDisability === 'adhd' && ' 🧠'}
            {activeDisability === 'autism' && ' 🌈'}
            {activeDisability === 'dyslexia' && ' 💚'}
          </div>
          {(!isMobile || !isLandscape) && (
            <div style={{ 
              fontSize: '0.6rem', 
              opacity: 0.8, 
              marginTop: '2px' 
            }}>
              {activeDisability.toUpperCase()} Mode
            </div>
          )}
        </motion.div>

        {/* Sign Out Button - Mobile Optimized */}
        {onSignOut && (
          <motion.button
            onClick={onSignOut}
            style={{
              background: 'linear-gradient(135deg, #ff4757, #ff3838)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.2rem',
              cursor: 'pointer',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 15px rgba(255, 71, 87, 0.3)',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
              transition: 'all 0.3s ease',
              minHeight: '44px',
              minWidth: '44px',
              whiteSpace: 'nowrap'
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
            {!isMobile || !isLandscape ? 'Sign Out' : '🚪'}
          </motion.button>
        )}
      </motion.div>

      {/* Main Chat Container */}
      <div
        style={{
          width: '100vw',
          height: isMobile ? `${Math.max(0, viewportHeight - headerHeight)}px` : `calc(100vh - ${headerHeight}px)`,
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(26, 0, 26, 0.8)',
          backdropFilter: 'blur(15px)',
          overflow: 'hidden',
          paddingTop: `${headerHeight}px`
        }}
      >
        {/* Messages Area - Mobile Optimized */}
        <div 
          ref={messagesRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? 'clamp(0.5rem, 2vw, 1rem)' : '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.75rem' : '1rem',
            direction: 'ltr',
            // Mobile scroll optimizations
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            scrollPadding: '1rem',
            overscrollBehavior: 'contain',
            ...dynamicStyles.messagesContainer
          }}
        >
          <AnimatePresence mode="popLayout">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                style={{
                  maxWidth: isMobile ? '85%' : '80%',
                  padding: isMobile ? 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)' : '1rem 1.5rem',
                  borderRadius: isMobile ? '12px' : '16px',
                  background: msg.sender === 'user' ? theme.bubbleUserBg : theme.bubbleGptBg,
                  color: msg.sender === 'user' ? '#ffffff' : theme.textColor,
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  border: `2px solid ${theme.borderColor}`,
                  lineHeight: isMobile ? 1.6 : 1.8,
                  letterSpacing: '0.04em',
                  wordSpacing: '0.12em',
                  textAlign: 'left',
                  direction: 'ltr',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  fontSize: isMobile ? 'clamp(15px, 4vw, 16px)' : 'inherit',
                  // Touch-friendly margins
                  marginBottom: isMobile ? '0.75rem' : '1rem'
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
                whileTap={isMobile ? { scale: 0.98 } : {}}
                layout
              >
                {msg.loading ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>Thinking ({activeDisability.toUpperCase()} mode)</span>
                    {[0,1,2].map(i => (
                      <motion.div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: theme.primary
                        }}
                        animate={{ 
                          scale: reducedMotion ? 1 : [1, 1.4, 1], 
                          opacity: reducedMotion ? 0.7 : [0.4, 1, 0.4] 
                        }}
                        transition={{ 
                          duration: reducedMotion ? 0 : 1.2, 
                          repeat: reducedMotion ? 0 : Infinity, 
                          delay: reducedMotion ? 0 : i * 0.15 
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
          
          {/* Mobile Scroll Indicator */}
          {isMobile && showScrollIndicator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                right: '8px',
                bottom: keyboardOpen ? '120px' : '100px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: theme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '14px',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              onClick={scrollToBottom}
              whileTap={{ scale: 0.9 }}
            >
              ↓
            </motion.div>
          )}
        </div>

        {/* Input Area - Mobile Optimized */}
        <motion.div 
          style={{
            padding: isMobile ? 'clamp(0.5rem, 2vw, 1rem)' : '1rem',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.75rem',
            borderTop: `2px solid ${theme.borderColor}`,
            direction: 'ltr',
            flexShrink: 0,
            // Safe area for mobile
            paddingBottom: isMobile ? 'max(clamp(0.5rem, 2vw, 1rem), env(safe-area-inset-bottom))' : '1rem',
            paddingLeft: isMobile ? 'max(clamp(0.5rem, 2vw, 1rem), env(safe-area-inset-left))' : '1rem',
            paddingRight: isMobile ? 'max(clamp(0.5rem, 2vw, 1rem), env(safe-area-inset-right))' : '1rem',
            // Handle mobile keyboard
            ...dynamicStyles.inputArea
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
            ref={inputRef}
            value={input}
            disabled={isSending}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={isMobile && isLandscape ? 
              `${activeDisability.toUpperCase()} mode...` :
              `Type your message... (${activeDisability.toUpperCase()} mode - responses optimized for your needs)`
            }
            style={{
              flex: 1,
              padding: isMobile ? 'clamp(0.75rem, 3vw, 1rem)' : '0.75rem 1rem',
              borderRadius: '12px',
              border: `2px solid ${theme.inputBorderColor}`,
              background: 'rgba(26, 0, 26, 0.9)',
              color: theme.textColor,
              outline: 'none',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
              fontSize: isMobile ? 'max(16px, clamp(16px, 4vw, 18px))' : '1rem', // Prevent zoom on iOS
              letterSpacing: '0.04em',
              lineHeight: 1.6,
              textAlign: 'left',
              direction: 'ltr',
              transition: 'all 0.3s ease',
              minHeight: isMobile ? '48px' : 'auto',
              // Mobile-specific input styles
              WebkitAppearance: 'none',
              WebkitBorderRadius: '12px'
            }}
            whileFocus={{
              borderColor: theme.focusBorderColor,
              boxShadow: `0 0 0 3px ${theme.primary}33`,
              scale: !reducedMotion && !isMobile ? 1.01 : 1
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            animate={controls}
            style={{
              padding: isMobile ? 'clamp(0.75rem, 3vw, 1rem)' : '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: theme.bubbleUserBg,
              color: '#ffffff',
              cursor: isSending || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: isSending || !input.trim() ? 0.6 : 1,
              fontWeight: '600',
              fontSize: isMobile ? 'clamp(14px, 3.5vw, 16px)' : '1rem',
              minWidth: isMobile ? '60px' : '100px',
              minHeight: isMobile ? '48px' : 'auto',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              // Mobile touch optimizations
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
            }}
            whileHover={!isSending && input.trim() && !reducedMotion && !isMobile ? { 
              scale: 1.05, 
              y: -3,
              boxShadow: `0 8px 25px ${theme.primary}50`
            } : {}}
            whileTap={!isSending && input.trim() ? { scale: 0.95 } : {}}
          >
            {isSending ? (
              isMobile ? "..." : "Sending..."
            ) : (
              isMobile && isLandscape ? "Send" : `Send (${activeDisability.toUpperCase()})`
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;