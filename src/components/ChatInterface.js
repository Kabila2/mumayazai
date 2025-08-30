/* global puter */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getCurrentDisability, 
  getDisabilityTheme,
  getWelcomeMessage,
  createDisabilityAwarePrompt,
  formatAIResponse,
  getDisabilityErrorMessage
} from "../utils/disabilityUtils";
import './ChatInterface.css';

/** ---------- AI Integration ---------- */
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
  
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("AI request timed out")), ms)
  );
  
  const req = (async () => {
    const resp = await puter.ai.chat(prompt);
    return typeof resp === "string" ? resp : resp?.message?.content ?? "";
  })();
  
  return Promise.race([req, timeout]);
};

const mockAI = (prompt, disability) => {
  const userInput = (prompt.split("User:").pop() || "").trim();
  
  switch (disability.toLowerCase()) {
    case "adhd":
      return `ADHD-FRIENDLY RESPONSE:\n\n• You said: "${userInput}"\n• Demo mode active\n• Quick structured response\n• Clear and scannable format`;

    case "autism":
      return `AUTISM-FRIENDLY RESPONSE:\n\nInput: "${userInput}"\n\nDemo mode status: Active\n1. Clear communication\n2. Predictable structure\n3. Direct information\n4. Consistent format`;

    case "dyslexia":
    default:
      return `DYSLEXIA-FRIENDLY RESPONSE:\n\nYour message: "${userInput}"\n\nDemo mode is running.\n\n• Simple language\n• Clear structure\n• Easy to read\n• Helpful format`;
  }
};

const getAIResponse = async (prompt, disability) => {
  const ready = await waitForPuter(3000);
  
  if (!ready) {
    return mockAI(prompt, disability);
  }
  
  try {
    const rawResponse = await aiChat(prompt, 20000);
    return formatAIResponse(rawResponse, disability);
  } catch (err) {
    console.warn("[ChatInterface] AI error:", err);
    return getDisabilityErrorMessage(disability);
  }
};

/** ---------- Mobile Detection Hook ---------- */
const useMobileDetection = () => {
  const [state, setState] = useState({
    isMobile: false,
    isLandscape: false,
    keyboardOpen: false,
    viewportHeight: window.innerHeight
  });
  
  useEffect(() => {
    const updateState = () => {
      const mobile = window.innerWidth <= 768 || 
                   /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const landscape = window.innerWidth > window.innerHeight;
      const height = window.visualViewport?.height || window.innerHeight;
      const keyboard = window.visualViewport ? 
                      (window.screen.height - height > 150) : false;
      
      setState({
        isMobile: mobile,
        isLandscape: landscape,
        keyboardOpen: keyboard,
        viewportHeight: height
      });
    };
    
    updateState();
    
    const events = ['resize', 'orientationchange'];
    events.forEach(event => window.addEventListener(event, updateState));
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateState);
    }
    
    return () => {
      events.forEach(event => window.removeEventListener(event, updateState));
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateState);
      }
    };
  }, []);
  
  return state;
};

/** ---------- Professional Chat Interface Component ---------- */
const ChatInterface = ({ 
  onSwitchMode, 
  fontSize = 1, 
  highContrast = false, 
  assistantTitle = "Professional AI Assistant",
  currentDisability = "dyslexia",
  t = {},
  language = "en",
  reducedMotion = false,
  onSignOut
}) => {
  
  const activeDisability = currentDisability || getCurrentDisability();
  const { isMobile, isLandscape, keyboardOpen, viewportHeight } = useMobileDetection();
  
  const [messages, setMessages] = useState([
    {
      sender: "gpt",
      text: getWelcomeMessage(activeDisability),
      id: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Auto-scroll with smooth animation
  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ 
        behavior: smooth && !reducedMotion ? "smooth" : "auto",
        block: "nearest"
      });
    }
  }, [reducedMotion]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    const timeout = setTimeout(scrollToBottom, keyboardOpen ? 300 : 100);
    return () => clearTimeout(timeout);
  }, [messages, keyboardOpen, scrollToBottom]);

  // Handle scroll indicator visibility
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
    setMessages([{
      sender: "gpt",
      text: getWelcomeMessage(activeDisability),
      id: Date.now()
    }]);
  }, [activeDisability]);

  // Handle file uploads
  const handleFiles = useCallback((files) => {
    const newAttachments = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file: file,
      name: file.name
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((id) => {
    setAttachments(prev => {
      const attachment = prev.find(att => att.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(att => att.id !== id);
    });
  }, []);

  // Send message handler
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || isSending) return;

    // Haptic feedback for mobile
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50);
    }

    setIsSending(true);
    
    const userId = Date.now();
    const sentImages = attachments.map(a => a.url);
    
    setMessages(prev => [
      ...prev,
      { sender: "user", text, images: sentImages, id: userId }
    ]);
    
    // Clear input and attachments
    setAttachments([]);
    setInput("");
    
    // Blur input to hide keyboard on mobile
    if (isMobile && inputRef.current) {
      inputRef.current.blur();
      setIsInputFocused(false);
    }

    // Handle image-only messages
    if (!text && sentImages.length > 0) {
      const imageResponse = activeDisability === 'adhd'
        ? 'ADHD-FRIENDLY RESPONSE:\n\n• I received your image(s)\n• I cannot view images directly\n• Please describe what you see\n• I will help based on your description'
        : activeDisability === 'autism'
          ? 'AUTISM-FRIENDLY RESPONSE:\n\nImage received.\n\n1. I cannot process images\n2. Please describe the content\n3. I will provide assistance\n4. Be specific about details'
          : 'DYSLEXIA-FRIENDLY RESPONSE:\n\nI got your image(s).\n\n• I cannot see pictures\n• Tell me what it shows\n• Share key details\n• I will help from your description';
      
      setMessages(prev => [
        ...prev,
        { sender: 'gpt', text: imageResponse, id: Date.now() + 1 }
      ]);
      setIsSending(false);
      return;
    }

    // Add loading message
    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { sender: "gpt", loading: true, id: loadingId }]);

    try {
      const enhancedPrompt = createDisabilityAwarePrompt(text, activeDisability, false);
      const response = await getAIResponse(enhancedPrompt, activeDisability);

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: response, id: loadingId } : m
        )
      );
      
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
      
      // Error haptic feedback
      if (navigator.vibrate && isMobile) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, activeDisability, isMobile, attachments]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle input focus/blur
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
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

  const inputVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay: reducedMotion ? 0 : 0.3,
        duration: reducedMotion ? 0.1 : 0.6
      }
    }
  };

  return (
    <div 
      className="chat-area"
      style={{
        fontSize: `${fontSize}rem`,
        height: isMobile ? `${viewportHeight}px` : '100vh'
      }}
    >
      <div className="chat-window">
        {/* Professional Header */}
        <motion.header 
          className="chat-header"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Voice Mode Button */}
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
              <span>🎤</span>
              <span className="button-text">Voice Mode</span>
            </motion.button>
          )}

          {/* Assistant Title */}
          <motion.div
            className="assistant-title"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 0.4 }}
          >
            <span className="title-main">
              {assistantTitle} {getDisabilityIcon(activeDisability)}
            </span>
            <span className="title-sub">
              {activeDisability.toUpperCase()} Optimized
            </span>
          </motion.div>

          {/* Sign Out Button */}
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
        </motion.header>

        {/* Messages Container */}
        <div 
          className="chat-messages"
          ref={messagesRef}
          style={{
            height: isMobile ? 
              `calc(${viewportHeight}px - ${isLandscape ? '3.5rem' : '4rem'} - ${keyboardOpen ? '0px' : '120px'})` : 
              'auto'
          }}
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`chat-bubble ${message.sender}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  duration: reducedMotion ? 0.1 : 0.4
                }}
                layout
              >
                {message.loading ? (
                  <div className="loading-dots">
                    <span>Thinking ({activeDisability.toUpperCase()} mode)</span>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                ) : (
                  <div>
                    {message.text && (
                      <div style={{ marginBottom: message.images?.length ? '12px' : 0 }}>
                        {message.text}
                      </div>
                    )}
                    {message.images && message.images.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        flexWrap: 'wrap',
                        marginTop: '8px'
                      }}>
                        {message.images.map((src, index) => (
                          <img 
                            key={index}
                            src={src} 
                            alt={`attachment-${index}`}
                            style={{ 
                              width: '120px', 
                              height: '90px', 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.2)'
                            }} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Scroll Indicator */}
        {isMobile && showScrollIndicator && (
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            whileTap={{ scale: 0.9 }}
            style={{
              bottom: keyboardOpen ? '140px' : '120px'
            }}
          >
            ↓
          </motion.div>
        )}

        {/* Professional Input Area */}
        <motion.div 
          className="chat-input-area"
          variants={inputVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.length) {
                handleFiles(e.target.files);
              }
            }}
          />

          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="attachment-preview">
              {attachments.map(attachment => (
                <div key={attachment.id} className="attachment-item">
                  <img src={attachment.url} alt={attachment.name} />
                  <button
                    className="remove-attachment"
                    onClick={() => removeAttachment(attachment.id)}
                    title="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="input-container">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={`Type your message... (${activeDisability.toUpperCase()} optimized responses)`}
              disabled={isSending}
              rows={1}
              style={{
                fontSize: isMobile ? 'max(16px, 1rem)' : '1rem' // Prevent iOS zoom
              }}
            />
          </div>

          <div className="input-actions">
            <button
              className="action-button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
              type="button"
            >
              📎
            </button>

            <motion.button
              className="send-button"
              onClick={handleSend}
              disabled={isSending || (!input.trim() && attachments.length === 0)}
              whileHover={!isSending && (input.trim() || attachments.length > 0) && !reducedMotion ? { 
                scale: 1.05, 
                y: -2 
              } : {}}
              whileTap={!isSending && (input.trim() || attachments.length > 0) ? { 
                scale: 0.95 
              } : {}}
            >
              {isSending ? (
                <>
                  <div className="loading-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>✈️</span>
                  <span>Send</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;