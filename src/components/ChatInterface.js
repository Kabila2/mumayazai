/* global puter */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './ChatInterface.css';
import SaveChatModal from './SaveChatModal';
import ExploreModal from './ExploreModal';
import {
  isChildLinkedToParent,
  startChildSession,
  endChildSession,
  updateChildSession,
  isWithinAllowedHours,
  hasExceededDailyLimit
} from '../utils/parentTrackingUtils';
import {
  initializeUserStats,
  recordMessage,
  recordChatSession
} from '../utils/leaderboardUtils';

/** ---------- Enhanced Memory System ---------- */
const MEMORY_STORAGE_KEY = "mumayaz_chat_memory";
const MAX_MEMORY_MESSAGES = 100;
const CONTEXT_WINDOW = 20; // Increased for better memory

const saveConversationMemory = (messages) => {
  try {
    const memoryData = {
      messages: messages.slice(-MAX_MEMORY_MESSAGES),
      timestamp: Date.now(),
      version: "2.0"
    };
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memoryData));
    console.log("💾 Memory saved:", messages.length, "messages");
  } catch (error) {
    console.warn("Failed to save conversation memory:", error);
  }
};

const loadConversationMemory = () => {
  try {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!stored) return null;
    
    const memoryData = JSON.parse(stored);
    const isRecent = Date.now() - memoryData.timestamp < 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (isRecent && memoryData.messages?.length) {
      console.log("💾 Memory loaded:", memoryData.messages.length, "messages");
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
    console.log("💾 Memory cleared");
  } catch (error) {
    console.warn("Failed to clear conversation memory:", error);
  }
};

// Enhanced context building with full conversation history
const buildConversationContext = (messages) => {
  if (messages.length <= 1) return "";
  
  // Get ALL conversation messages (excluding welcome message)
  const conversationMessages = messages
    .slice(1) // Skip welcome message
    .filter(msg => !msg.loading && msg.text) // Filter out loading/empty messages
    .slice(-CONTEXT_WINDOW) // Take most recent messages for context
    .map(msg => {
      const role = msg.sender === "user" ? "Human" : "Assistant";
      return `${role}: ${msg.text}`;
    });
  
  if (conversationMessages.length === 0) return "";
  
  return `\n\nConversation History:\n${conversationMessages.join('\n')}\n\nCurrent Request:\n`;
};

/** ---------- Enhanced Image Analysis Function ---------- */
const analyzeImage = async (imageUrl) => {
  try {
    // Convert image to base64 for analysis
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise(async (resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const imageElement = new Image();

          imageElement.onload = async () => {
            // Create canvas for image processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            ctx.drawImage(imageElement, 0, 0);

            let analysis = `• Image Analysis Complete\n• Dimensions: ${imageElement.width} × ${imageElement.height} pixels\n• File size: ${(blob.size / 1024).toFixed(1)} KB\n• Format: ${blob.type}\n\n`;

            // Basic image characteristics
            const aspectRatio = (imageElement.width / imageElement.height).toFixed(2);
            if (aspectRatio > 1.5) {
              analysis += "• Image orientation: Landscape (wide)\n";
            } else if (aspectRatio < 0.7) {
              analysis += "• Image orientation: Portrait (tall)\n";
            } else {
              analysis += "• Image orientation: Square or standard\n";
            }

            // Analyze image colors and brightness
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let totalBrightness = 0;
            let redSum = 0, greenSum = 0, blueSum = 0;
            const sampleSize = Math.min(10000, pixels.length / 4); // Sample pixels for performance

            for (let i = 0; i < sampleSize * 4; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];

              redSum += r;
              greenSum += g;
              blueSum += b;

              // Calculate brightness using luminance formula
              totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b);
            }

            const avgBrightness = totalBrightness / sampleSize;
            const avgRed = redSum / sampleSize;
            const avgGreen = greenSum / sampleSize;
            const avgBlue = blueSum / sampleSize;

            // Brightness analysis
            if (avgBrightness > 180) {
              analysis += "• Brightness: Very bright/light image\n";
            } else if (avgBrightness > 120) {
              analysis += "• Brightness: Well-lit image\n";
            } else if (avgBrightness > 60) {
              analysis += "• Brightness: Moderately lit\n";
            } else {
              analysis += "• Brightness: Dark image\n";
            }

            // Color analysis
            const dominantColor = Math.max(avgRed, avgGreen, avgBlue);
            if (dominantColor === avgRed && avgRed > avgGreen + 30 && avgRed > avgBlue + 30) {
              analysis += "• Color tone: Predominantly red/warm tones\n";
            } else if (dominantColor === avgBlue && avgBlue > avgRed + 30 && avgBlue > avgGreen + 30) {
              analysis += "• Color tone: Predominantly blue/cool tones\n";
            } else if (dominantColor === avgGreen && avgGreen > avgRed + 20 && avgGreen > avgBlue + 20) {
              analysis += "• Color tone: Predominantly green/natural tones\n";
            } else if (Math.abs(avgRed - avgGreen) < 20 && Math.abs(avgGreen - avgBlue) < 20) {
              analysis += "• Color tone: Balanced/neutral colors or grayscale\n";
            } else {
              analysis += "• Color tone: Mixed color palette\n";
            }

            // Try OCR-like text detection (basic edge detection for text regions)
            try {
              const grayImageData = ctx.createImageData(canvas.width, canvas.height);
              for (let i = 0; i < pixels.length; i += 4) {
                const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
                grayImageData.data[i] = gray;
                grayImageData.data[i + 1] = gray;
                grayImageData.data[i + 2] = gray;
                grayImageData.data[i + 3] = pixels[i + 3];
              }

              // Simple edge detection for text-like regions
              let edgeCount = 0;
              const sampleEdges = Math.min(1000, canvas.width * canvas.height / 100);

              for (let i = 0; i < sampleEdges; i++) {
                const x = Math.floor(Math.random() * (canvas.width - 1));
                const y = Math.floor(Math.random() * (canvas.height - 1));
                const idx = (y * canvas.width + x) * 4;

                if (idx + 4 < grayImageData.data.length) {
                  const current = grayImageData.data[idx];
                  const right = grayImageData.data[idx + 4];
                  const bottom = grayImageData.data[idx + canvas.width * 4];

                  if (Math.abs(current - right) > 50 || Math.abs(current - bottom) > 50) {
                    edgeCount++;
                  }
                }
              }

              const edgeRatio = edgeCount / sampleEdges;
              if (edgeRatio > 0.3) {
                analysis += "• Content: Likely contains text, diagrams, or detailed graphics\n";
              } else if (edgeRatio > 0.15) {
                analysis += "• Content: Moderate detail, may contain some text or structured elements\n";
              } else {
                analysis += "• Content: Appears to be a photo or smooth graphics with minimal text\n";
              }

            } catch (ocrError) {
              analysis += "• Content: Unable to analyze text content\n";
            }

            // Image quality assessment
            const resolution = canvas.width * canvas.height;
            if (resolution > 2000000) {
              analysis += "• Quality: High resolution image\n";
            } else if (resolution > 500000) {
              analysis += "• Quality: Standard resolution\n";
            } else {
              analysis += "• Quality: Lower resolution or thumbnail\n";
            }

            analysis += "\n• What I can help with:\n";
            analysis += "  • Describe what you see in the image\n";
            analysis += "  • Ask questions about specific elements\n";
            analysis += "  • Request analysis of colors, composition, or technical aspects\n";
            analysis += "  • Help identify potential text content or document structure\n";
            analysis += "  • Provide suggestions for image improvement or editing\n";

            resolve(analysis);
          };

          imageElement.onerror = () => {
            resolve("• I can see you've uploaded an image\n• Having trouble processing the image format\n• Could you try a different image or describe what's in it?");
          };

          imageElement.src = base64;

        } catch (processingError) {
          console.error("Image processing error:", processingError);
          resolve("• Image received successfully\n• Basic analysis available\n• Please describe what's in the image for more detailed help");
        }
      };

      reader.onerror = () => {
        resolve("• I can see you've uploaded an image\n• Having trouble reading the file\n• Could you try uploading again or describe the image?");
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    return "• I can see you've uploaded an image\n• I'm having trouble analyzing it right now\n• Could you describe what's in the image so I can better help you?";
  }
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

const aiChat = async (prompt, ms = 30000) => {
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

const mockAI = (prompt, hasContext = false, hasImages = false) => {
  const userInput = prompt.split("Current Request:").pop() ||
                   prompt.split("Human:").pop() ||
                   prompt;
  const cleanInput = userInput.trim().substring(0, 100);

  const contextNote = hasContext ? "\n• I remember our previous conversation" : "";
  const imageNote = hasImages ? "\n• I can see you've shared images with me" : "";

  // Check for common reference patterns
  const hasReference = /\b(that|it|the .+ (I|you) (mentioned|said|talked about)|what (I|you) (said|mentioned)|summarize|explain .+ (mentioned|said))\b/i.test(cleanInput);

  if (hasContext && hasReference) {
    return `• I can see you're referring to something from our conversation${contextNote}\n• In demo mode, I can detect references but need the real AI for full context analysis\n• Your request: "${cleanInput}"\n• The memory system is active and ready for the full AI response\n• Try this with the real AI for complete context awareness${imageNote}`;
  }

  const responses = [
    `• Regarding "${cleanInput}"\n• I'm currently in demo mode with full memory system active\n• I can help you with questions and provide information\n• I maintain conversation history for context-aware responses${contextNote}${imageNote}`,

    `• You mentioned: "${cleanInput}"\n• This is a demonstration of the Chat Assistant with memory\n• I can assist with a wide range of topics\n• I maintain our conversation history for continuity and reference handling${contextNote}${imageNote}`,

    `• About "${cleanInput}"\n• I'm running in demo mode but with full memory capabilities\n• I remember our conversation and can build on previous discussions\n• Ready to assist with context-aware responses${contextNote}${imageNote}`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

const getAIResponse = async (prompt, conversationContext = "", hasImages = false) => {
  const ready = await waitForPuter(3000);

  // Enhanced memory and context instructions
  const memoryInstruction = conversationContext
    ? "\n\nIMPORTANT MEMORY CONTEXT: You have access to our full conversation history above. When the user refers to something they mentioned before (like 'the book I mentioned', 'what I said earlier', 'that thing from before'), look back through the conversation history to find what they're referring to and respond accordingly. Use this context to provide more relevant and connected responses."
    : "";

  // Add bullet point formatting instruction
  const bulletPointInstruction = "\n\nIMPORTANT: Please format your response using bullet points. Start each main point with • and use clear, concise bullet points throughout your response.";

  const enhancedPrompt = conversationContext
    ? prompt + conversationContext + memoryInstruction + bulletPointInstruction
    : prompt + bulletPointInstruction;

  console.log("🧠 Sending enhanced prompt with full memory context and reference handling");

  if (!ready) {
    return mockAI(enhancedPrompt, !!conversationContext, hasImages);
  }

  try {
    const rawResponse = await aiChat(enhancedPrompt, 30000);
    return rawResponse;
  } catch (err) {
    console.warn("[ChatInterface] AI error:", err);
    return "• I'm having trouble connecting right now\n• Please try again in a moment";
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
  assistantTitle,
  t = {},
  language = "en",
  reducedMotion = false,
  onSignOut
}) => {

  // Enhanced translations
  const translations = {
    en: {
      chatAssistant: "Mumayaz Chat Assistant",
      welcomeMessage: "Welcome to Mumayaz Chat Assistant! I'm here to help answer questions, provide information, and assist with various tasks. How can I help you today?",
      placeholder: "Type your message here...",
      send: "Send Message",
      saveChat: "Save Conversation",
      clearChat: "Clear History",
      explore: "Explore",
      voiceMode: "Switch to Voice",
      thinking: "Thinking...",
      memoryEnabled: "Context memory is active",
      chatSaved: "Conversation saved successfully!",
      chatCleared: "Conversation history cleared",
      errorMessage: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
      retrying: "Retrying...",
      connectingMsg: "Connecting to AI service...",
      shortcutHint: "Press Ctrl+Enter to send"
    },
    ar: {
      chatAssistant: "مساعد مميز للمحادثة",
      welcomeMessage: "مرحباً بك في مساعد مميز للمحادثة! أنا هنا لمساعدتك في الإجابة على الأسئلة وتقديم المعلومات والمساعدة في مختلف المهام. كيف يمكنني مساعدتك اليوم؟",
      placeholder: "اكتب رسالتك هنا...",
      send: "إرسال الرسالة",
      saveChat: "حفظ المحادثة",
      clearChat: "مسح المحفوظات",
      explore: "استكشاف",
      voiceMode: "التبديل للصوت",
      thinking: "أفكر...",
      memoryEnabled: "ذاكرة السياق نشطة",
      chatSaved: "تم حفظ المحادثة بنجاح!",
      chatCleared: "تم مسح محفوظات المحادثة",
      errorMessage: "أعتذر، ولكنني أواجه صعوبات تقنية. يرجى المحاولة مرة أخرى بعد قليل.",
      retrying: "إعادة المحاولة...",
      connectingMsg: "الاتصال بخدمة الذكاء الاصطناعي...",
      shortcutHint: "اضغط Ctrl+Enter للإرسال"
    }
  };

  const tr = { ...translations[language] || translations.en, ...t };
  
  const { isMobile, isLandscape, keyboardOpen, viewportHeight } = useMobileDetection();
  
  // Initialize messages with memory or welcome message
  const [messages, setMessages] = useState(() => {
    const savedMessages = loadConversationMemory();
    if (savedMessages && savedMessages.length > 0) {
      console.log("💾 Restored", savedMessages.length, "messages from memory");
      return savedMessages;
    }
    return [{
      sender: "gpt",
      text: tr.welcomeMessage,
      id: Date.now()
    }];
  });
  
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showMemoryStatus, setShowMemoryStatus] = useState(false);
  const [showSaveChatModal, setShowSaveChatModal] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [isChildLinked, setIsChildLinked] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  
  // Save messages to memory whenever they change (with debouncing)
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    if (messages.length > 1) {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout to save after 1 second of no changes
      saveTimeoutRef.current = setTimeout(() => {
        saveConversationMemory(messages);
      }, 1000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages]);
  
  // Enhanced auto-scroll function
  const scrollToBottom = useCallback((immediate = false) => {
    if (bottomRef.current) {
      if (immediate) {
        bottomRef.current.scrollIntoView({ 
          behavior: "auto",
          block: "end"
        });
        if (messagesRef.current) {
          messagesRef.current.parentElement?.classList.add('auto-scroll-active');
        }
      } else {
        bottomRef.current.scrollIntoView({ 
          behavior: reducedMotion ? "auto" : "smooth",
          block: "end"
        });
      }
    }
  }, [reducedMotion]);
  
  // Auto-scroll when messages change
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      if (lastMessage.sender === "user" || lastMessage.loading) {
        scrollToBottom(true);
      } else {
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

  // Initialize child tracking
  useEffect(() => {
    const initChildTracking = () => {
      try {
        // Get user email from session
        const session = JSON.parse(localStorage.getItem("mumayaz_session") || "{}");
        if (session.email) {
          setUserEmail(session.email);

          // Initialize user stats for leaderboard
          const users = JSON.parse(localStorage.getItem("mumayaz_users") || "{}");
          const user = users[session.email.toLowerCase()];
          if (user) {
            initializeUserStats(session.email, user.name);
          }

          // Check if this child is linked to a parent
          const linkInfo = isChildLinkedToParent(session.email);
          if (linkInfo) {
            setIsChildLinked(true);

            // Check time restrictions
            const withinHours = isWithinAllowedHours(session.email);
            const exceedsLimit = hasExceededDailyLimit(session.email);

            if (withinHours && !exceedsLimit) {
              // Start session tracking
              const result = startChildSession(session.email);
              if (result.success) {
                setSessionActive(true);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error initializing child tracking:", error);
      }
    };

    initChildTracking();

    // End session on page unload
    const handleBeforeUnload = () => {
      if (sessionActive && userEmail) {
        endChildSession(userEmail);
      }
      // Record chat session for leaderboard
      if (userEmail && messages.length > 1) {
        const userMessages = messages.filter(msg => msg.sender === "user").length;
        recordChatSession(userEmail, 0, userMessages); // Duration will be calculated elsewhere
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (sessionActive && userEmail) {
        endChildSession(userEmail);
      }
      // Record chat session for leaderboard on cleanup
      if (userEmail && messages.length > 1) {
        const userMessages = messages.filter(msg => msg.sender === "user").length;
        recordChatSession(userEmail, 0, userMessages);
      }
    };
  }, [sessionActive, userEmail, messages]);


  // Clear conversation and memory
  const handleClearConversation = useCallback(() => {
    // Record chat session before clearing if there were messages
    if (userEmail && messages.length > 1) {
      const userMessages = messages.filter(msg => msg.sender === "user").length;
      recordChatSession(userEmail, 0, userMessages);
    }

    clearConversationMemory();
    setMessages([{
      sender: "gpt",
      text: tr.welcomeMessage,
      id: Date.now()
    }]);
  }, [t, userEmail, messages]);

  // Enhanced send message handler
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    // Haptic feedback for mobile
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50);
    }

    setIsSending(true);

    const userId = Date.now();

    const newUserMessage = {
      sender: "user",
      text,
      id: userId
    };

    // Update messages immediately with user message
    setMessages(prev => {
      const updated = [...prev, newUserMessage];
      // Save immediately when user sends message
      saveConversationMemory(updated);
      return updated;
    });

    // Track message for leaderboard
    if (userEmail) {
      recordMessage(userEmail);
    }

    // Track activity for child users
    if (sessionActive && userEmail) {
      updateChildSession(userEmail, {
        type: 'message_sent',
        content: text.substring(0, 100) // First 100 chars for topic analysis
      });
    }

    // Clear input immediately
    setInput("");

    // Blur input to hide keyboard on mobile
    if (isMobile && inputRef.current) {
      inputRef.current.blur();
      setIsInputFocused(false);
    }

    try {
      // Build conversation context from ALL previous messages
      const updatedMessages = [...messages, newUserMessage];
      const conversationContext = buildConversationContext(updatedMessages);

      console.log("💾 Building AI response with full conversation context");
      console.log("📝 Context includes", updatedMessages.length - 1, "previous messages");

      const responseText = await getAIResponse(text, conversationContext, false);

      // Add AI response to messages
      setMessages(prev => {
        const updated = [...prev, { sender: "gpt", text: responseText, id: Date.now() + 1 }];
        // Save after AI response
        saveConversationMemory(updated);
        return updated;
      });

      // Track chat completion for child users
      if (sessionActive && userEmail) {
        updateChildSession(userEmail, {
          type: 'chat_completed',
          responseLength: responseText.length
        });
      }

      // Success haptic feedback
      if (navigator.vibrate && isMobile) {
        navigator.vibrate([50, 50, 50]);
      }

    } catch (err) {
      const errorMsg = "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages(prev => {
        const updated = [...prev, { sender: "gpt", text: errorMsg, id: Date.now() + 1 }];
        saveConversationMemory(updated);
        return updated;
      });

      // Error haptic feedback
      if (navigator.vibrate && isMobile) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, isMobile, messages, sessionActive, userEmail]);

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

  // Save chat handlers
  const handleSaveChat = useCallback(() => {
    if (messages.length > 1) { // Only save if there are actual messages beyond the welcome
      setShowSaveChatModal(true);
    }
  }, [messages.length]);




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
      className="chat-container"
      style={{
        fontSize: `${fontSize}rem`,
        height: isMobile ? `${viewportHeight}px` : '100vh',
        direction: language === 'ar' ? 'rtl' : 'ltr'
      }}
    >
      {/* Floating Particles */}
      <div className="floating-particles">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      {/* Shimmer Effect */}
      <div className="chat-shimmer"></div>

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
            {t.memoryRestored || "Previous conversation restored!"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Header */}
      <motion.header
        className="chat-header"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Header Actions */}
        <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {/* Left side - Mode buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>

            {onSwitchMode && (
              <motion.button
                className="header-button white"
                onClick={onSwitchMode}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: reducedMotion ? 0 : 0.24 }}
              >
                <span>🎤</span>
                <span className="button-text">{tr.voiceMode}</span>
              </motion.button>
            )}
          </div>

          {/* Right side - Chat management buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <motion.button
              className="header-button white"
              onClick={handleClearConversation}
              title="Clear conversation and memory"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.22 }}
            >
              <span>🗑️</span>
              <span className="button-text">{tr.clearChat}</span>
            </motion.button>

            <motion.button
              className="header-button white"
              onClick={handleSaveChat}
              disabled={messages.length <= 1}
              title="Save current chat"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.3 }}
            >
              <span>💾</span>
              <span className="button-text">{tr.saveChat}</span>
            </motion.button>

            <motion.button
              className="header-button white explore-button"
              onClick={() => setShowExploreModal(true)}
              title="Explore features, leaderboard, tasks and learning"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.34 }}
            >
              <span>🌟</span>
              <span className="button-text">{tr.explore}</span>
            </motion.button>
          </div>
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
              className={`message-container ${message.sender}`}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
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
              {/* Message Avatar */}
              <motion.div
                className="message-avatar"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: reducedMotion ? 0 : 0.2, type: "spring" }}
              >
                {message.sender === 'user' ? '👤' : '🤖'}
              </motion.div>

              {/* Message Bubble */}
              <motion.div
                className="chat-bubble"
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
                    {message.images.map((img, imgIndex) => (
                      <motion.img 
                        key={imgIndex}
                        src={img.url} 
                        alt={`${img.name || `attachment-${imgIndex}`}`}
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
                
                {/* Message metadata */}
                {index > 0 && (
                  <div style={{
                    fontSize: '0.75rem',
                    opacity: 0.6,
                    marginTop: '8px',
                    textAlign: message.sender === 'user' ? 'right' : 'left'
                  }}>
                    {message.sender === 'gpt' ? 'AI Response' : 'You'} • {new Date(message.id).toLocaleTimeString()}
                  </div>
                )}
                </motion.div>
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

      {/* Professional Input Area */}
      <motion.div
        className="chat-input-area"
        variants={inputVariants}
        initial="hidden"
        animate="visible"
      >


        <div className="input-container">
          <motion.textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={messages.length > 1 ?
              `${tr.placeholder} (${tr.memoryEnabled})` :
              tr.placeholder}
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


        <motion.button
          className="send-button"
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          whileHover={!isSending && input.trim() && !reducedMotion ? {
            scale: 1.05,
            y: -2,
            transition: { duration: 0.2 }
          } : {}}
          whileTap={!isSending && input.trim() ? { 
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
                <span>{t.sending || "Sending..."}</span>
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>🚀</span>
                <span>{tr.send}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Save Chat Modal */}
      <SaveChatModal
        isOpen={showSaveChatModal}
        onClose={() => setShowSaveChatModal(false)}
        messages={messages}
      />


      {/* Explore Modal */}
      <ExploreModal
        isOpen={showExploreModal}
        onClose={() => setShowExploreModal(false)}
        currentUserEmail={userEmail}
        t={t}
        language={language}
        onSignOut={onSignOut}
      />
    </div>
  );
};

export default ChatInterface;