/* global puter */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './ChatInterface.css';

/** ---------- Enhanced Memory System ---------- */
const MEMORY_STORAGE_KEY = "mumayaz_chat_memory";
const MAX_MEMORY_MESSAGES = 100;
const CONTEXT_WINDOW = 15;

const saveConversationMemory = (messages) => {
  try {
    const memoryData = {
      messages: messages.slice(-MAX_MEMORY_MESSAGES),
      timestamp: Date.now(),
      version: "1.1"
    };
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memoryData));
  } catch (error) {
    console.warn("Failed to save conversation memory:", error);
  }
};

const loadConversationMemory = () => {
  try {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!stored) return null;
    
    const memoryData = JSON.parse(stored);
    const isRecent = Date.now() - memoryData.timestamp < 7 * 24 * 60 * 60 * 1000;
    
    if (isRecent && memoryData.messages?.length) {
      return memoryData.messages;
    }
  } catch (error) {
    console.warn("Failed to load conversation memory:", error);
  }
  return null;
};

const clearConversationMemory = () => {
  try {
    localStorage.removeItem(MEMORY_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear conversation memory:", error);
  }
};

const buildConversationContext = (messages) => {
  if (messages.length <= 1) return "";
  
  // Get recent messages excluding the welcome message, including both user and AI responses
  const recentMessages = messages
    .slice(1) // Skip welcome message
    .slice(-CONTEXT_WINDOW) // Get last N messages
    .filter(msg => !msg.loading) // Exclude loading states
    .map(msg => {
      const role = msg.sender === "user" ? "User" : "AI Response";
      return `${role}: ${msg.text}`;
    });
  
  if (recentMessages.length === 0) return "";
  
  return `\n\nPrevious conversation context:\n${recentMessages.join('\n')}\n\nCurrent message:\n`;
};

/** ---------- AI Integration with Enhanced Memory ---------- */
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

const mockAI = (prompt, hasContext = false) => {
  const userInput = (prompt.split("Current message:").pop() || prompt.split("User:").pop() || "").trim();
  
  const responses = [
    `You said: "${userInput}"\n\nDemo mode is active. I can help you with various tasks, questions, and image analysis. I remember our conversation history and will provide helpful responses tailored to your needs.`,
    `I understand you're asking about: "${userInput}"\n\nThis is a demonstration of the Chat Assistant. I maintain conversation context including both your messages and my responses, and can assist with a wide range of topics while providing clear, structured responses.`,
    `Your message: "${userInput}"\n\nI'm currently running in demo mode with full conversation memory. I can help with questions, analyze images, provide information, assist with tasks, and maintain our conversation history for better continuity.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

const getAIResponse = async (prompt, conversationContext = "") => {
  const ready = await waitForPuter(3000);
  
  const enhancedPrompt = conversationContext 
    ? prompt + conversationContext 
    : prompt;
  
  if (!ready) {
    return mockAI(enhancedPrompt, !!conversationContext);
  }
  
  try {
    const rawResponse = await aiChat(enhancedPrompt, 20000);
    return rawResponse;
  } catch (err) {
    console.warn("[ChatInterface] AI error:", err);
    return "I'm having trouble connecting right now. Please try again in a moment.";
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

/** ---------- Enhanced Chat Interface Component ---------- */
const ChatInterface = ({ 
  onSwitchMode, 
  fontSize = 1, 
  highContrast = false, 
  assistantTitle = "Chat Assistant",
  t = {},
  language = "en",
  reducedMotion = false,
  onSignOut
}) => {
  
  const { isMobile, isLandscape, keyboardOpen, viewportHeight } = useMobileDetection();
  
  // Initialize messages with memory or welcome message
  const [messages, setMessages] = useState(() => {
    const savedMessages = loadConversationMemory();
    if (savedMessages && savedMessages.length > 0) {
      return savedMessages;
    }
    return [{
      sender: "gpt",
      text: "Hello! I'm your Chat Assistant. I can help you with questions, provide information, analyze images, and assist with various tasks. I'll remember our entire conversation to provide better context-aware responses. How can I help you today?",
      id: Date.now()
    }];
  });
  
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showMemoryStatus, setShowMemoryStatus] = useState(false);
  
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Save messages to memory whenever they change
  useEffect(() => {
    if (messages.length > 1) {
      saveConversationMemory(messages);
    }
  }, [messages]);
  
  // Enhanced auto-scroll function with immediate and smooth scroll
  const scrollToBottom = useCallback((immediate = false) => {
    if (bottomRef.current) {
      if (immediate) {
        // Immediate scroll first
        bottomRef.current.scrollIntoView({ 
          behavior: "auto",
          block: "end"
        });
        // Add smooth scroll class for next scroll
        if (messagesRef.current) {
          messagesRef.current.parentElement?.classList.add('auto-scroll-active');
        }
      } else {
        // Smooth scroll
        bottomRef.current.scrollIntoView({ 
          behavior: reducedMotion ? "auto" : "smooth",
          block: "end"
        });
      }
    }
  }, [reducedMotion]);
  
  // Auto-scroll when messages change - immediate for user messages, smooth for AI responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      if (lastMessage.sender === "user" || lastMessage.loading) {
        // Immediate scroll for user messages and loading states
        scrollToBottom(true);
      } else {
        // Smooth scroll for AI responses
        const timeout = setTimeout(() => scrollToBottom(false), 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [messages, scrollToBottom]);

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

  // Show memory status notification
  useEffect(() => {
    const savedMessages = loadConversationMemory();
    if (savedMessages && savedMessages.length > 1) {
      setShowMemoryStatus(true);
      const timer = setTimeout(() => setShowMemoryStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

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

  // Clear conversation and memory
  const handleClearConversation = useCallback(() => {
    clearConversationMemory();
    setMessages([{
      sender: "gpt",
      text: "Hello! I'm your Chat Assistant. I can help you with questions, provide information, analyze images, and assist with various tasks. I'll remember our entire conversation to provide better context-aware responses. How can I help you today?",
      id: Date.now()
    }]);
  }, []);

  // Send message handler with enhanced auto-scroll and image analysis
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
    
    const newUserMessage = { sender: "user", text, images: sentImages, id: userId };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Clear input and attachments immediately
    setAttachments([]);
    setInput("");
    
    // Blur input to hide keyboard on mobile
    if (isMobile && inputRef.current) {
      inputRef.current.blur();
      setIsInputFocused(false);
    }

    // Handle image-only messages with proper analysis
    if (!text && sentImages.length > 0) {
      const imageAnalysisPrompt = `Please analyze this image that the user has shared. Describe what you see in detail, including objects, people, text, colors, composition, and any other relevant details. Be comprehensive and helpful.`;
      
      try {
        const conversationContext = buildConversationContext([...messages, newUserMessage]);
        const response = await getAIResponse(imageAnalysisPrompt, conversationContext);
        
        setMessages(prev => [
          ...prev,
          { sender: 'gpt', text: response, id: Date.now() + 1 }
        ]);
      } catch (err) {
        const imageResponse = 'I can see you\'ve shared an image. While I cannot directly analyze images in this demo mode, I can help if you describe what you see or ask questions about it.';
        setMessages(prev => [
          ...prev,
          { sender: 'gpt', text: imageResponse, id: Date.now() + 1 }
        ]);
      }
      
      setIsSending(false);
      return;
    }

    try {
      // Build conversation context from previous messages
      const updatedMessages = [...messages, newUserMessage];
      const conversationContext = buildConversationContext(updatedMessages);
      
      // Enhanced prompt for messages with images
      let enhancedPrompt = text;
      if (sentImages.length > 0) {
        enhancedPrompt = `The user has shared ${sentImages.length} image(s) along with this message: "${text}"\n\nPlease respond to their message. If relevant to their question, describe what you can observe in the image(s) they've shared, but focus primarily on addressing their specific question or request.`;
      }
      
      const response = await getAIResponse(enhancedPrompt, conversationContext);

      setMessages(prev => [
        ...prev,
        { sender: "gpt", text: response, id: Date.now() + 1 }
      ]);
      
      // Success haptic feedback
      if (navigator.vibrate && isMobile) {
        navigator.vibrate([50, 50, 50]);
      }
      
    } catch (err) {
      const errorMsg = "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages(prev => [
        ...prev,
        { sender: "gpt", text: errorMsg, id: Date.now() + 1 }
      ]);
      
      // Error haptic feedback
      if (navigator.vibrate && isMobile) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, isMobile, attachments, messages]);

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
              💾 Previous conversation restored
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Header */}
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
              {assistantTitle}
            </span>
            <span className="title-sub">
              AI Assistant • Memory Active
            </span>
          </motion.div>

          {/* Clear Chat & Sign Out Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button
              className="header-button"
              onClick={handleClearConversation}
              title="Clear conversation and memory"
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

        {/* Messages Container */}
        <div 
          className="chat-messages"
          ref={messagesRef}
          style={{
            height: isMobile ? 
              `calc(${viewportHeight}px - ${isLandscape ? '3.5rem' : '4rem'} - ${keyboardOpen ? '0px' : '140px'})` : 
              'auto'
          }}
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
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
                whileHover={!reducedMotion ? { 
                  y: -2, 
                  scale: 1.01,
                  transition: { duration: 0.2 }
                } : {}}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.1 }}
                >
                  {message.text && (
                    <div 
                      style={{ marginBottom: message.images?.length ? '12px' : 0 }}
                      dangerouslySetInnerHTML={{
                        __html: message.text.replace(/\n/g, '<br/>').replace(/•/g, '<span style="display: inline-block; margin-right: 8px;">•</span>')
                      }}
                    />
                  )}
                  {message.images && message.images.length > 0 && (
                    <motion.div 
                      style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        flexWrap: 'wrap',
                        marginTop: '8px'
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reducedMotion ? 0 : 0.2 }}
                    >
                      {message.images.map((src, imgIndex) => (
                        <motion.img 
                          key={imgIndex}
                          src={src} 
                          alt={`attachment-${imgIndex}`}
                          style={{ 
                            width: '120px', 
                            height: '90px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            border: '1px solid rgba(209, 213, 219, 0.3)'
                          }}
                          whileHover={!reducedMotion ? { scale: 1.05 } : {}}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: imgIndex * 0.1 }}
                        />
                      ))}
                    </motion.div>
                  )}
                  
                  {/* Message timestamp for reference */}
                  {message.sender !== 'gpt' || index === 0 ? null : (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      opacity: 0.6, 
                      marginTop: '8px', 
                      textAlign: 'right' 
                    }}>
                      Message #{index} • {new Date(message.id).toLocaleTimeString()}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Scroll Indicator */}
        <AnimatePresence>
          {isMobile && showScrollIndicator && (
            <motion.div
              className="scroll-indicator"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollToBottom(true)}
              whileTap={{ scale: 0.9 }}
              whileHover={!reducedMotion ? { scale: 1.1, y: -2 } : {}}
              style={{
                bottom: keyboardOpen ? '140px' : '120px'
              }}
            >
              ↓
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Input Area */}
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

          {/* Enhanced Attachment Preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div 
                className="attachment-preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: reducedMotion ? 0.1 : 0.3 }}
              >
                {attachments.map((attachment, index) => (
                  <motion.div 
                    key={attachment.id} 
                    className="attachment-item"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ 
                      delay: index * 0.1,
                      duration: reducedMotion ? 0.1 : 0.3,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={!reducedMotion ? { 
                      scale: 1.05, 
                      rotate: 1,
                      transition: { duration: 0.2 }
                    } : {}}
                  >
                    <img src={attachment.url} alt={attachment.name} />
                    <motion.button
                      className="remove-attachment"
                      onClick={() => removeAttachment(attachment.id)}
                      title="Remove attachment"
                      whileHover={!reducedMotion ? { 
                        scale: 1.1, 
                        rotate: 90,
                        transition: { duration: 0.2 }
                      } : {}}
                      whileTap={{ scale: 0.9 }}
                    >
                      ×
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-container">
            <motion.textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={`Type your message... (Full memory active)`}
              disabled={isSending}
              rows={1}
              style={{
                fontSize: isMobile ? 'max(16px, 1rem)' : '1rem',
                fontFamily: 'var(--font-family)'
              }}
              whileFocus={!reducedMotion ? { 
                scale: 1.01,
                transition: { duration: 0.2 }
              } : {}}
            />
          </div>

          <div className="input-actions">
            <motion.button
              className="action-button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image for analysis"
              type="button"
              whileHover={!reducedMotion ? { 
                scale: 1.05, 
                y: -2,
                transition: { duration: 0.2 }
              } : {}}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.4 }}
            >
              📎
            </motion.button>

            <motion.button
              className="send-button"
              onClick={handleSend}
              disabled={isSending || (!input.trim() && attachments.length === 0)}
              whileHover={!isSending && (input.trim() || attachments.length > 0) && !reducedMotion ? { 
                scale: 1.05, 
                y: -2,
                transition: { duration: 0.2 }
              } : {}}
              whileTap={!isSending && (input.trim() || attachments.length > 0) ? { 
                scale: 0.95 
              } : {}}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.5 }}
            >
              <AnimatePresence mode="wait">
                {isSending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <div className="loading-dots">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                    <span>Sending...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span>✈️</span>
                    <span>Send</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;