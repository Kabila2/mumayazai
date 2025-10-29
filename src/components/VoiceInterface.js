/* global puter */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import ExploreModal from './ExploreModal';
import SaveVoiceChatModal from './SaveVoiceChatModal';
import "./VoiceInterface.css";
import "./ChatInterface.css";

/** ---------- Advanced Voice System ---------- */
const VOICE_STORAGE_KEY = "mumayaz_voice_data";
const MAX_CONVERSATION_LENGTH = 150;
const CONTEXT_WINDOW = 25;
const AUTO_SAVE_DELAY = 800;

/** ---------- Enhanced Memory System (from ChatInterface) ---------- */
const VOICE_MEMORY_STORAGE_KEY = "mumayaz_voice_memory";
const MAX_MEMORY_MESSAGES = 100;
const ENHANCED_CONTEXT_WINDOW = 20;

const saveVoiceConversationMemory = (messages) => {
  try {
    const memoryData = {
      messages: messages.slice(-MAX_MEMORY_MESSAGES),
      timestamp: Date.now(),
      version: "2.0"
    };
    localStorage.setItem(VOICE_MEMORY_STORAGE_KEY, JSON.stringify(memoryData));
    console.log("💾 Voice memory saved:", messages.length, "messages");
    console.log("💾 Saved messages:", messages.map(m => `${m.sender}: ${m.text?.substring(0, 50)}...`));
  } catch (error) {
    console.warn("Failed to save voice conversation memory:", error);
  }
};

const loadVoiceConversationMemory = () => {
  try {
    const stored = localStorage.getItem(VOICE_MEMORY_STORAGE_KEY);
    if (!stored) {
      console.log("💾 No voice memory found in storage");
      return null;
    }

    const memoryData = JSON.parse(stored);
    const isRecent = Date.now() - memoryData.timestamp < 30 * 24 * 60 * 60 * 1000; // 30 days

    console.log("💾 Memory data found:", {
      messageCount: memoryData.messages?.length,
      isRecent,
      timestamp: new Date(memoryData.timestamp).toLocaleString()
    });

    if (isRecent && memoryData.messages?.length) {
      console.log("💾 Voice memory loaded:", memoryData.messages.length, "messages");
      console.log("💾 Loaded messages:", memoryData.messages.map(m => `${m.sender}: ${m.text?.substring(0, 50)}...`));
      return memoryData.messages;
    }
  } catch (error) {
    console.warn("Failed to load voice conversation memory:", error);
  }
  return null;
};

const clearVoiceConversationMemory = () => {
  try {
    localStorage.removeItem(VOICE_MEMORY_STORAGE_KEY);
    console.log("💾 Voice memory cleared");
  } catch (error) {
    console.warn("Failed to clear voice conversation memory:", error);
  }
};

// Enhanced context building with full conversation history (from working chat interface)
const buildConversationContext = (messages) => {
  console.log("🔍 buildConversationContext called with", messages.length, "messages");

  if (messages.length <= 1) {
    console.log("🔍 No context - too few messages");
    return "";
  }

  // Get ALL conversation messages (excluding welcome message)
  const conversationMessages = messages
    .slice(1) // Skip welcome message
    .filter(msg => !msg.loading && msg.text) // Filter out loading/empty messages
    .slice(-ENHANCED_CONTEXT_WINDOW) // Take most recent messages for context
    .map(msg => {
      const role = msg.sender === "user" ? "Human" : "Assistant";
      return `${role}: ${msg.text}`;
    });

  console.log("🔍 Filtered conversation messages:", conversationMessages.length);
  console.log("🔍 Context messages:", conversationMessages);

  if (conversationMessages.length === 0) {
    console.log("🔍 No valid context messages found");
    return "";
  }

  const context = `\n\nConversation History:\n${conversationMessages.join('\n')}\n\nCurrent Request:\n`;
  console.log("🔍 Final built context:", context);
  return context;
};

// Enhanced Voice Selection for Natural AI Speech
const getNaturalVoices = (language, availableVoices) => {
  if (!availableVoices || availableVoices.length === 0) return [];

  // High-quality voices in order of preference
  const naturalVoices = {
    en: [
      // Premium/Neural voices (highest quality)
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft Ava Online (Natural) - English (United States)',
      'Microsoft Brian Online (Natural) - English (United States)',
      'Microsoft Emma Online (Natural) - English (United States)',
      'Google UK English Female',
      'Google UK English Male',
      'Google US English',
      // Standard high-quality voices
      'Microsoft Zira Desktop - English (United States)',
      'Microsoft David Desktop - English (United States)',
      'Microsoft Mark - English (United States)',
      'Microsoft Hazel - English (Great Britain)',
      'Alex', // macOS
      'Samantha', // macOS
      'Victoria', // macOS
      'Karen', // macOS
      // Fallbacks
      'en-US',
      'en-GB'
    ],
    ar: [
      // Premium Neural Arabic voices (highest quality)
      'Microsoft Salma Online (Natural) - Arabic (Egypt)',
      'Microsoft Shakir Online (Natural) - Arabic (Egypt)',
      'Microsoft Hamed Online (Natural) - Arabic (Saudi Arabia)',
      'Microsoft Zariyah Online (Natural) - Arabic (Saudi Arabia)',
      'Microsoft Amina Online (Natural) - Arabic (Saudi Arabia)',
      'Microsoft Bassel Online (Natural) - Arabic (Syria)',

      // Google Arabic voices
      'Google العربية',
      'Google Arabic',
      'Arabic Google',

      // Standard Microsoft Arabic voices
      'Microsoft Naayf - Arabic (Saudi Arabia)',
      'Microsoft Hoda - Arabic (Egypt)',
      'Microsoft Amira - Arabic (Egypt)',

      // Regional variations
      'Arabic (Saudi Arabia)',
      'Arabic (Egypt)',
      'Arabic (UAE)',
      'Arabic (Jordan)',
      'Arabic (Lebanon)',

      // Browser fallbacks
      'ar-SA',
      'ar-EG',
      'ar-AE',
      'ar-JO',
      'ar-LB',
      'ar'
    ]
  };

  const preferredNames = naturalVoices[language] || naturalVoices.en;
  const filtered = [];

  // First pass: Find exact matches
  for (const preferredName of preferredNames) {
    const voice = availableVoices.find(v =>
      v.name === preferredName ||
      v.name.includes(preferredName) ||
      preferredName.includes(v.name)
    );
    if (voice && !filtered.find(f => f.name === voice.name)) {
      filtered.push(voice);
    }
  }

  // Second pass: Find by language if no exact matches
  if (filtered.length === 0) {
    const langCode = language === 'ar' ? 'ar' : 'en';
    const langVoices = availableVoices.filter(v => {
      if (!v.lang) return false;
      const lowerLang = v.lang.toLowerCase();

      if (language === 'ar') {
        // More comprehensive Arabic detection
        return lowerLang.startsWith('ar') ||
               lowerLang.includes('arabic') ||
               lowerLang.includes('عربي') ||
               v.name.toLowerCase().includes('arabic') ||
               v.name.includes('العربية');
      } else {
        return lowerLang.startsWith('en');
      }
    });
    filtered.push(...langVoices);
  }

  // Third pass: Very loose Arabic detection if still nothing found
  if (language === 'ar' && filtered.length === 0) {
    const anyArabicVoice = availableVoices.find(v =>
      v.name.toLowerCase().includes('arab') ||
      v.name.includes('عرب') ||
      v.name.includes('سعود') ||
      v.name.includes('مصر') ||
      v.name.toLowerCase().includes('saudi') ||
      v.name.toLowerCase().includes('egypt')
    );
    if (anyArabicVoice) {
      filtered.push(anyArabicVoice);
    }
  }

  return filtered.slice(0, 10); // Return top 10 natural voices
};

// Force Arabic Voice Creation - Works without installed Arabic voices
const createArabicVoice = () => {
  return {
    name: 'Arabic Synthetic (ar-SA)',
    lang: 'ar-SA',
    voiceURI: 'ar-SA',
    localService: false,
    default: false,
    synthetic: true // Mark as synthetic
  };
};

// Enhanced Arabic Voice Getter - Always returns at least one Arabic voice
const getArabicVoices = (availableVoices) => {
  const arabicVoices = getNaturalVoices('ar', availableVoices);

  // If no Arabic voices found, create synthetic ones
  if (arabicVoices.length === 0) {
    console.log('🚨 No Arabic voices found on system - creating synthetic voices');
    return [
      createArabicVoice(),
      {
        name: 'Arabic Egypt (ar-EG)',
        lang: 'ar-EG',
        voiceURI: 'ar-EG',
        localService: false,
        default: false,
        synthetic: true
      },
      {
        name: 'Arabic UAE (ar-AE)',
        lang: 'ar-AE',
        voiceURI: 'ar-AE',
        localService: false,
        default: false,
        synthetic: true
      }
    ];
  }

  console.log('✅ Found Arabic voices on system:', arabicVoices.length);
  return arabicVoices;
};

// Voice Commands System
const getVoiceCommands = (language) => {
  if (language === 'ar') {
    return {
      'مسح المحادثة': { action: 'clearChat', response: 'تم مسح المحادثة' },
      'حفظ المحادثة': { action: 'saveChat', response: 'جاري حفظ المحادثة' },
      'التبديل للمحادثة': { action: 'switchMode', response: 'التبديل إلى وضع المحادثة' },
      'توقف عن الكلام': { action: 'stopSpeaking', response: null },
      'كرر ذلك': { action: 'repeatLast', response: 'إعادة الرسالة الأخيرة' }
    };
  }

  return {
    'clear chat': { action: 'clearChat', response: 'Chat cleared' },
    'save conversation': { action: 'saveChat', response: 'Saving conversation' },
    'switch to chat': { action: 'switchMode', response: 'Switching to chat mode' },
    'stop speaking': { action: 'stopSpeaking', response: null },
    'repeat that': { action: 'repeatLast', response: 'Repeating last message' }
  };
};

// Enhanced Voice Memory Management
class VoiceMemoryManager {
  static save(conversations, currentSession) {
    try {
      const data = {
        conversations,
        currentSession,
        timestamp: Date.now(),
        version: "3.0"
      };
      localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(data));
      console.log("🔄 Voice memory saved:", conversations.length, "conversations");
    } catch (error) {
      console.warn("Failed to save voice memory:", error);
    }
  }

  static load() {
    try {
      const stored = localStorage.getItem(VOICE_STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      const isRecent = Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000; // 7 days

      if (isRecent && data.version === "3.0") {
        console.log("📂 Voice memory loaded:", data.conversations?.length || 0, "conversations");
        return data;
      }
    } catch (error) {
      console.warn("Failed to load voice memory:", error);
    }
    return null;
  }

  static clear() {
    localStorage.removeItem(VOICE_STORAGE_KEY);
    console.log("🗑️ Voice memory cleared");
  }

  static buildContext(messages) {
    return messages
      .slice(-CONTEXT_WINDOW)
      .filter(m => m.text && !m.isCommand)
      .map(m => `${m.sender === 'user' ? 'Human' : 'Assistant'}: ${m.text}`)
      .join('\n');
  }
}

/** ---------- Enhanced AI Integration (from ChatInterface) ---------- */
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

const aiChat = async (prompt, ms = 30000) => {
  if (!hasPuter()) throw new Error("Puter SDK not available");

  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("AI request timed out")), ms)
  );

  const req = (async () => {
    const resp = await window.puter.ai.chat(prompt);
    return typeof resp === "string" ? resp : resp?.message?.content ?? "";
  })();

  return Promise.race([req, timeout]);
};

const getVoiceAIResponse = async (prompt, conversationContext = "") => {
  const ready = await waitForPuter(3000);

  // Enhanced memory and context instructions
  const memoryInstruction = conversationContext
    ? "\n\nIMPORTANT MEMORY CONTEXT: You have access to our full conversation history above. When the user refers to something they mentioned before (like 'the book I mentioned', 'what I said earlier', 'that thing from before'), look back through the conversation history to find what they're referring to and respond accordingly. Use this context to provide more relevant and connected responses."
    : "";

  // Add bullet point formatting instruction for voice
  const bulletPointInstruction = "\n\nIMPORTANT: Please format your response using bullet points for voice interaction. Start each main point with • and use clear, concise bullet points throughout your response. Keep responses conversational and optimized for voice.";

  const enhancedPrompt = conversationContext
    ? prompt + conversationContext + memoryInstruction + bulletPointInstruction
    : prompt + bulletPointInstruction;

  console.log("🧠 Sending enhanced voice prompt with full memory context and reference handling");

  if (!ready) {
    return mockVoiceAI(enhancedPrompt, !!conversationContext);
  }

  try {
    const rawResponse = await aiChat(enhancedPrompt, 30000);
    return rawResponse;
  } catch (err) {
    console.warn("[VoiceInterface] AI error:", err);
    return "• I'm having trouble connecting right now\n• Please try again in a moment";
  }
};

// Enhanced Mock AI for development (from ChatInterface)
const mockVoiceAI = (prompt, hasContext = false) => {
  const userInput = prompt.split("Current Request:").pop() ||
                   prompt.split("Human:").pop() ||
                   prompt;
  const cleanInput = userInput.trim().substring(0, 100);

  const contextNote = hasContext ? "\n• I remember our previous conversation" : "";

  // Check for common reference patterns
  const hasReference = /\b(that|it|the .+ (I|you) (mentioned|said|talked about)|what (I|you) (said|mentioned)|summarize|explain .+ (mentioned|said))\b/i.test(cleanInput);

  if (hasContext && hasReference) {
    return `• I can see you're referring to something from our conversation${contextNote}\n• In demo mode, I can detect references but need the real AI for full context analysis\n• Your request: "${cleanInput}"\n• The memory system is active and ready for the full AI response\n• Try this with the real AI for complete context awareness`;
  }

  const responses = [
    `• Regarding "${cleanInput}"\n• I'm currently in demo mode with full memory system active\n• I can help you with questions and provide information\n• I maintain conversation history for context-aware responses${contextNote}`,

    `• You mentioned: "${cleanInput}"\n• This is a demonstration of the Voice Assistant with memory\n• I can assist with a wide range of topics\n• I maintain our conversation history for continuity and reference handling${contextNote}`,

    `• About "${cleanInput}"\n• I'm running in demo mode but with full memory capabilities\n• I remember our conversation and can build on previous discussions\n• Ready to assist with context-aware voice responses${contextNote}`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

export default function VoiceInterface({
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
  onSignOut,
  onBack
}) {
  console.log("🎯 New VoiceInterface initialized");

  // Translations for Arabic/English
  const translations = {
    en: {
      voiceAssistant: "Mumayaz Voice Assistant",
      listening: "Listening...",
      speaking: "Speaking...",
      processing: "Processing...",
      ready: "Ready to Listen",
      save: "Save Conversation",
      explore: "Explore",
      chatMode: "Switch to Chat",
      stop: "Stop Speaking",
      clear: "Clear History",
      welcomeMessage: "Welcome to Mumayaz Voice Assistant! I'm ready to help with voice-powered conversations. You can speak naturally and I'll respond to your questions.",
      newSession: "Voice session started. What would you like to discuss today?",
      chatCleared: "Conversation history cleared",
      conversationSaved: "Your conversation has been saved successfully!",
      memoryRestored: "Previous conversation restored!"
    },
    ar: {
      voiceAssistant: "مساعد مميز الصوتي",
      listening: "جاري الاستماع...",
      speaking: "أتحدث الآن...",
      processing: "جاري المعالجة...",
      ready: "جاهز للاستماع",
      save: "حفظ المحادثة",
      explore: "استكشاف",
      chatMode: "التبديل للمحادثة",
      stop: "إيقاف التحدث",
      clear: "مسح المحادثات",
      welcomeMessage: "مرحباً بك في مساعد مميز الصوتي! أنا جاهز للمساعدة في المحادثات الصوتية. يمكنك التحدث بشكل طبيعي وسأجيب على أسئلتك.",
      newSession: "تم بدء جلسة صوتية جديدة. ما الذي تود مناقشته اليوم؟",
      chatCleared: "تم مسح محفوظات المحادثة",
      conversationSaved: "تم حفظ محادثتك بنجاح!",
      memoryRestored: "تم استعادة المحادثة السابقة!"
    }
  };

  const t = translations[language] || translations.en;

  // Core State
  const [conversations, setConversations] = useState(() => {
    const saved = VoiceMemoryManager.load();
    return saved?.conversations || [];
  });

  // Initialize messages with memory or welcome message (simplified like chat interface)
  const [messages, setMessages] = useState(() => {
    const savedMessages = loadVoiceConversationMemory();
    if (savedMessages && savedMessages.length > 0) {
      console.log("💾 Restored", savedMessages.length, "voice messages from memory");
      return savedMessages;
    }

    const welcomeMsg = language === 'ar'
      ? "مرحباً! أنا مساعدك في المحادثة\n• يمكنني مساعدتك في الأسئلة وتقديم المعلومات\n• كيف يمكنني مساعدتك اليوم؟"
      : "Hello! I'm your Chat Assistant\n• I can help you with questions and provide information\n• How can I help you today?";

    return [{
      sender: "assistant",
      text: welcomeMsg,
      id: Date.now()
    }];
  });

  // Voice System State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [lastTranscript, setLastTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);

  // UI State
  const [showConversations, setShowConversations] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showMemoryStatus, setShowMemoryStatus] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  // Voice Settings
  const [voices, setVoices] = useState(extVoices || []);
  const [selectedVoiceLocal, setSelectedVoiceLocal] = useState(selectedVoice || "");
  const [speedLocal, setSpeedLocal] = useState(speed || 1.0);
  const [pitchLocal, setPitchLocal] = useState(pitch || 1.0);
  const [volumeLocal, setVolumeLocal] = useState(0.9);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [commandMode, setCommandMode] = useState(true);

  // Refs
  const recognitionRef = useRef(null);
  const messagesRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const bottomRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const finalTranscriptRef = useRef("");

  // Save messages to memory whenever they change (like chat interface)
  useEffect(() => {
    if (messages.length > 1) {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to save after 1 second of no changes
      saveTimeoutRef.current = setTimeout(() => {
        saveVoiceConversationMemory(messages);
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages]);

  // Auto-scroll function for voice chat
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

  // Show memory status notification
  useEffect(() => {
    const savedMessages = loadVoiceConversationMemory();
    if (savedMessages && savedMessages.length > 1) {
      setShowMemoryStatus(true);
      const timer = setTimeout(() => setShowMemoryStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Arabic voice status notification
  const [showArabicVoiceInfo, setShowArabicVoiceInfo] = useState(false);
  useEffect(() => {
    if (language === 'ar') {
      const arabicVoices = getNaturalVoices('ar', voices);
      if (arabicVoices.length === 0) {
        setShowArabicVoiceInfo(true);
        const timer = setTimeout(() => setShowArabicVoiceInfo(false), 8000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowArabicVoiceInfo(false);
    }
  }, [language, voices]);

  // Initialize user email from session
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("mumayaz_session") || "{}");
      if (session.email) {
        setUserEmail(session.email);
      }
    } catch (error) {
      console.error("Error loading user session:", error);
    }
  }, []);

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification("Speech recognition not supported in this browser", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Enable continuous listening
    recognition.interimResults = true;
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.maxAlternatives = 3;

    console.log(`🎤 Voice recognition set to: ${recognition.lang}`);

    recognition.onstart = () => {
      setIsListening(true);
      setLastTranscript("");
      setConfidence(0);
      finalTranscriptRef.current = "";
      console.log("🎤 Voice recognition started with 0.8-second buffer");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          finalTranscriptRef.current = finalTranscript;
          console.log("🎤 Final speech detected:", transcript);

          // Start 0.8-second silence timer
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          silenceTimeoutRef.current = setTimeout(() => {
            console.log("🔇 0.8-second silence detected, processing speech");
            if (finalTranscriptRef.current.trim()) {
              handleVoiceInput(finalTranscriptRef.current.trim(), confidence);
              finalTranscriptRef.current = "";
            }
            // Stop listening after processing
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }, 800); // 0.8-second buffer
        } else {
          interimTranscript += transcript;
          setLastTranscript(finalTranscriptRef.current + interimTranscript);
          setConfidence(confidence);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceLevel(0);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      console.log("🔇 Voice recognition ended");
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setVoiceLevel(0);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      console.error("Speech recognition error:", event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
      }
    };
  }, [language]);

  // Audio Level Monitoring
  useEffect(() => {
    if (!isListening) return;

    const setupAudioContext = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!isListening) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setVoiceLevel(Math.min(average / 128, 1));

          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (error) {
        console.warn("Failed to setup audio monitoring:", error);
      }
    };

    setupAudioContext();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => {
          console.warn("AudioContext cleanup error:", err);
        });
      }
    };
  }, [isListening]);

  // Enhanced Voice Synthesis for Arabic/English
  const speak = useCallback((text) => {
    if (!text || !autoSpeak) return;

    if (extSpeak) {
      extSpeak(text);
      return;
    }

    if (!window.speechSynthesis) {
      console.warn('🚨 SpeechSynthesis not supported in this browser');
      return;
    }

    // Ensure voices are loaded (important for Arabic voices)
    if (voices.length === 0) {
      console.log('🔄 Loading voices...');
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) {
        // Wait for voices to load
        setTimeout(() => {
          console.log('⏰ Retrying speech after voice loading delay');
          speak(text);
        }, 100);
        return;
      }
    }

    // Stop any ongoing speech recognition when starting to speak
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    // Clean text for better speech
    const cleanText = text
      .replace(/🎙️|📱|⚙️|🔊|🎯|✨|💬|📋|🗑️|💾|🧭/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\n+/g, '. ')
      .replace(/\. \. +/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Get voices for current language (enhanced for Arabic)
    let naturalVoices;
    if (language === 'ar') {
      naturalVoices = getArabicVoices(voices); // Always returns at least synthetic Arabic voices
    } else {
      naturalVoices = getNaturalVoices(language, voices);
    }

    console.log(`🔍 Available voices for ${language}:`, voices.length);
    console.log(`🔍 Natural voices found:`, naturalVoices.length, naturalVoices.map(v => v.name));

    let selectedVoice = null;

    // First try to use user's selected voice if it's natural
    if (selectedVoiceLocal && naturalVoices.find(v => v.name === selectedVoiceLocal)) {
      selectedVoice = voices.find(v => v.name === selectedVoiceLocal);
      console.log(`🎯 Using user-selected voice: ${selectedVoice.name}`);
    }
    // Otherwise use the best natural voice available
    else if (naturalVoices.length > 0) {
      selectedVoice = naturalVoices[0]; // Use the highest quality voice
      console.log(`🎯 Auto-selected natural voice: ${selectedVoice.name}`);
    }
    // Enhanced fallback for Arabic
    else if (language === 'ar') {
      // Try any Arabic voice
      selectedVoice = voices.find(v =>
        v.lang?.toLowerCase().includes('ar') ||
        v.name.toLowerCase().includes('arab') ||
        v.name.includes('العربية')
      );

      if (selectedVoice) {
        console.log(`🎯 Arabic fallback voice: ${selectedVoice.name}`);
      } else {
        console.warn('🚨 No Arabic voices found! Creating synthetic voice.');
        // Create a synthetic Arabic voice entry
        selectedVoice = {
          name: 'Arabic Synthetic',
          lang: 'ar-SA',
          voiceURI: 'ar-SA'
        };
      }
    }
    // Final fallback to any voice in the language
    else {
      selectedVoice = voices.find(v => {
        return v.lang?.startsWith('en');
      });
    }

    if (selectedVoice) {
      // Handle synthetic Arabic voices specially
      if (selectedVoice.synthetic && language === 'ar') {
        utterance.lang = selectedVoice.lang;
        console.log(`🎭 Using synthetic Arabic voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      } else if (!selectedVoice.synthetic) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log(`🔊 Using system voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      }
    } else {
      // Absolute fallback to language setting
      if (language === 'ar') {
        utterance.lang = 'ar-SA';
        console.log(`🔊 Arabic fallback - forcing lang to: ${utterance.lang}`);
      } else {
        utterance.lang = 'en-US';
        console.log(`🔊 English fallback - using lang: ${utterance.lang}`);
      }
    }

    // Ensure Arabic text is properly handled
    if (language === 'ar' && cleanText) {
      console.log(`📝 Arabic text to speak:`, cleanText.substring(0, 100) + '...');
      // Force Arabic language settings for better pronunciation
      if (!utterance.lang || !utterance.lang.startsWith('ar')) {
        utterance.lang = 'ar-SA';
        console.log(`🔧 Corrected language to ar-SA for Arabic text`);
      }
    }

    // Natural speech settings for AI responses
    utterance.rate = Math.max(0.8, Math.min(speedLocal, 1.1)); // Constrain speed for naturalness
    utterance.pitch = Math.max(0.8, Math.min(pitchLocal, 1.2)); // Natural pitch range
    utterance.volume = volumeLocal;

    // Enhanced settings for premium voices
    if (selectedVoice && selectedVoice.name.includes('Natural')) {
      utterance.rate = Math.max(0.85, Math.min(speedLocal, 1.0)); // Slower for premium voices
      utterance.pitch = Math.max(0.9, Math.min(pitchLocal, 1.1)); // More natural pitch
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log(`🗣️ AI speaking with ${selectedVoice?.name || 'default'} voice`);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log(`🔇 AI finished speaking`);
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      console.warn(`Speech synthesis error: ${event.error}`);
    };

    window.speechSynthesis.speak(utterance);
  }, [extSpeak, autoSpeak, voices, selectedVoiceLocal, speedLocal, pitchLocal, volumeLocal, language, isListening]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Voice Command Processing
  const processVoiceCommand = useCallback((text) => {
    const lowerText = text.toLowerCase().trim();
    const voiceCommands = getVoiceCommands(language);

    for (const [command, config] of Object.entries(voiceCommands)) {
      if (lowerText.includes(command.toLowerCase())) {
        if (config.response) {
          showNotification(config.response, "success");
        }

        switch (config.action) {
          case 'clearChat':
            clearCurrentSession();
            break;
          case 'saveChat':
            setShowSaveModal(true);
            break;
          case 'switchMode':
            onSwitchMode?.('chat');
            break;
          case 'stopSpeaking':
            stopSpeaking();
            break;
          case 'repeatLast':
            repeatLastMessage();
            break;
        }
        return true;
      }
    }
    return false;
  }, [onSwitchMode, stopSpeaking, language]);

  // Handle Voice Input (rewritten to match working chat interface pattern)
  const handleVoiceInput = useCallback(async (transcript, confidence) => {
    if (!transcript.trim()) return;

    console.log("🗣️ Voice input:", transcript, "confidence:", confidence);

    // Check for voice commands first
    if (commandMode && processVoiceCommand(transcript)) {
      return;
    }

    setIsProcessing(true);

    const newUserMessage = {
      sender: "user",
      text: transcript,
      id: Date.now(),
      confidence: confidence
    };

    // Update messages immediately with user message (like chat interface)
    setMessages(prev => {
      const updated = [...prev, newUserMessage];
      // Save immediately when user sends message
      saveVoiceConversationMemory(updated);
      return updated;
    });

    try {
      // Build conversation context from ALL previous messages (like chat interface)
      const updatedMessages = [...messages, newUserMessage];
      const conversationContext = buildConversationContext(updatedMessages);

      console.log("💾 Building AI response with full conversation context");
      console.log("📝 Context includes", updatedMessages.length - 1, "previous messages");

      const responseText = await getVoiceAIResponse(transcript, conversationContext);

      // Add AI response to messages (like chat interface)
      setMessages(prev => {
        const updated = [...prev, { sender: "assistant", text: responseText, id: Date.now() + 1 }];
        // Save after AI response
        saveVoiceConversationMemory(updated);
        return updated;
      });

      if (autoSpeak) {
        speak(responseText);
      }

    } catch (error) {
      console.error("AI processing error:", error);
      const errorMsg = "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages(prev => {
        const updated = [...prev, { sender: "assistant", text: errorMsg, id: Date.now() + 1 }];
        saveVoiceConversationMemory(updated);
        return updated;
      });

      showNotification("Failed to process voice input", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [messages, commandMode, processVoiceCommand, speak, autoSpeak]);

  // Utility Functions
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const clearCurrentSession = () => {
    const welcomeMsg = language === 'ar'
      ? "مرحباً! أنا مساعدك في المحادثة\n• يمكنني مساعدتك في الأسئلة وتقديم المعلومات\n• كيف يمكنني مساعدتك اليوم؟"
      : "Hello! I'm your Chat Assistant\n• I can help you with questions and provide information\n• How can I help you today?";

    // Clear enhanced memory system
    clearVoiceConversationMemory();

    // Reset to just welcome message (like chat interface)
    setMessages([{
      sender: "assistant",
      text: welcomeMsg,
      id: Date.now()
    }]);
  };

  const repeatLastMessage = () => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find(m => m.sender === "assistant" && !m.isCommand);

    if (lastAssistantMessage) {
      speak(lastAssistantMessage.text);
    }
  };


  const startListening = () => {
    if (!recognitionRef.current) {
      showNotification("Speech recognition not available", "error");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
    }

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    // Process any accumulated speech before stopping
    if (finalTranscriptRef.current.trim()) {
      console.log("🔇 Manual stop - processing accumulated speech");
      handleVoiceInput(finalTranscriptRef.current.trim(), confidence);
      finalTranscriptRef.current = "";
    }

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Navigation Configuration - Split into left and right groups
  const leftButtons = [
    ...(onBack ? [{
      id: 'home',
      icon: '🏠',
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      onClick: onBack,
      variant: 'white'
    }] : []),
    {
      id: 'chat-mode',
      icon: '💬',
      label: t.chatMode,
      onClick: () => onSwitchMode?.('chat'),
      variant: 'white'
    }
  ];

  const rightButtons = [
    {
      id: 'save',
      icon: '💾',
      label: t.save,
      onClick: () => setShowSaveModal(true),
      variant: 'white',
      disabled: messages.length <= 1
    },
    {
      id: 'explore',
      icon: '🌟',
      label: t.explore || 'Explore',
      onClick: () => setShowExploreModal(true),
      variant: 'white',
      className: 'explore-button'
    },
    ...(onBack ? [{
      id: 'exit',
      icon: '✕',
      label: language === 'ar' ? 'إغلاق' : 'Exit',
      onClick: onBack,
      variant: 'white',
      className: 'exit-fullscreen-button'
    }] : [])
  ];

  return (
    <motion.div
      className="voice-area"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.6 }}
    >
      {/* Notification System */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`voice-notification ${notification.type}`}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              padding: '12px 16px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '500',
              background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)'
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Status Notification */}
      <AnimatePresence>
        {showMemoryStatus && (
          <motion.div
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
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
            💾 {t.memoryRestored}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arabic Voice Information */}
      <AnimatePresence>
        {showArabicVoiceInfo && (
          <motion.div
            style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(59, 130, 246, 0.9)',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '500',
              zIndex: 1001,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              maxWidth: '90%',
              textAlign: 'center'
            }}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            🎙️ {language === 'ar' ?
              'استخدام صوت عربي اصطناعي - لتحسين الجودة، قم بتثبيت أصوات عربية من إعدادات النظام' :
              'Using synthetic Arabic voice - Install Arabic voices in system settings for better quality'
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Navigation Buttons */}
      <motion.div
        className="floating-nav-buttons-left"
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          zIndex: 1000,
          direction: language === 'ar' ? 'rtl' : 'ltr'
        }}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.6, ease: 'easeOut' }}
      >
        {leftButtons.map((button, index) => (
          <motion.button
            key={button.id}
            className={`header-button ${button.variant || ''} ${button.className || ''}`}
            onClick={button.onClick}
            disabled={button.disabled}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (index + 1) * 0.1, duration: reducedMotion ? 0.1 : 0.3 }}
            whileHover={!button.disabled && !reducedMotion ? { scale: 1.05, y: -2 } : {}}
            whileTap={!button.disabled ? { scale: 0.95 } : {}}
            style={{
              opacity: button.disabled ? 0.5 : 1,
              minWidth: '100px',
              justifyContent: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{button.icon}</span>
            <span>{button.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Right Navigation Buttons */}
      <motion.div
        className="floating-nav-buttons-right"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          zIndex: 1000,
          direction: language === 'ar' ? 'rtl' : 'ltr'
        }}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.6, ease: 'easeOut' }}
      >
        {rightButtons.map((button, index) => (
          <motion.button
            key={button.id}
            className={`header-button ${button.variant || ''} ${button.className || ''}`}
            onClick={button.onClick}
            disabled={button.disabled}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (index + 1) * 0.1, duration: reducedMotion ? 0.1 : 0.3 }}
            whileHover={!button.disabled && !reducedMotion ? { scale: 1.05, y: -2 } : {}}
            whileTap={!button.disabled ? { scale: 0.95 } : {}}
            style={{
              opacity: button.disabled ? 0.5 : 1,
              minWidth: '100px',
              justifyContent: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{button.icon}</span>
            <span>{button.label}</span>
          </motion.button>
        ))}
      </motion.div>



      {/* Main Voice Controls */}
      <motion.div
        className="voice-main-controls"
        style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          marginTop: '20px'
        }}
      >
        <motion.button
          className="voice-main-button"
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: 'none',
            background: isListening
              ? 'linear-gradient(45deg, #ef4444, #dc2626)'
              : 'linear-gradient(45deg, #10b981, #059669)',
            color: 'white',
            fontSize: '2.5rem',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
          whileHover={!isProcessing ? { scale: 1.05 } : {}}
          whileTap={!isProcessing ? { scale: 0.95 } : {}}
          animate={isListening ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 8px 25px rgba(0,0,0,0.3)',
              '0 12px 35px rgba(239, 68, 68, 0.4)',
              '0 8px 25px rgba(0,0,0,0.3)'
            ]
          } : {}}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
          title={isListening ? 'Click to stop listening (or wait 0.8 seconds after speaking)' : 'Click to start listening'}
        >
          {isListening ? '🔴' : isProcessing ? '⚡' : '🗣️'}
        </motion.button>

        <div className="voice-controls-row" style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {isSpeaking && (
            <motion.button
              onClick={stopSpeaking}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                cursor: 'pointer'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              🔇 {t.stop}
            </motion.button>
          )}

          <motion.button
            onClick={clearCurrentSession}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '2px solid rgba(156, 163, 175, 0.3)',
              background: 'rgba(156, 163, 175, 0.1)',
              color: 'var(--text-color)',
              cursor: 'pointer',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🗑️ {t.clear}
          </motion.button>
        </div>

        {/* Natural Voice Selector */}
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '1rem'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            opacity: 0.8,
            fontWeight: '500'
          }}>
            🎙️ AI Voice
          </span>
          <select
            value={selectedVoiceLocal}
            onChange={(e) => setSelectedVoiceLocal(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '0.9rem',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              minWidth: '200px',
              textAlign: 'center'
            }}
          >
            <option value="" style={{ background: '#1a1a1a', color: 'white' }}>
              Auto-select best voice
            </option>
            {(language === 'ar' ? getArabicVoices(voices) : getNaturalVoices(language, voices)).map(voice => (
              <option
                key={voice.name}
                value={voice.name}
                style={{ background: '#1a1a1a', color: 'white' }}
              >
                {voice.name.includes('Natural') ? '⭐ ' : ''}
                {voice.name.length > 40 ? voice.name.substring(0, 40) + '...' : voice.name}
              </option>
            ))}
          </select>
        </motion.div>
      </motion.div>


      {/* Conversation History */}
      <motion.div
        className="voice-conversation"
        ref={messagesRef}
        style={{
          margin: '2rem',
          maxHeight: '40vh',
          overflowY: 'auto',
          padding: '1rem',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          /* Hide scrollbar but keep functionality */
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
          WebkitScrollbar: { display: 'none' } /* Chrome, Safari, Opera - handled below */
        }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              className={`message ${message.sender}`}
              style={{
                padding: '1.25rem',
                margin: '0.75rem 0',
                borderRadius: '12px',
                background: message.sender === 'user'
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                border: `1px solid ${message.sender === 'user' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
              }}
              initial={{
                opacity: 0,
                y: 30,
                scale: 0.95,
                rotateX: -15
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0
              }}
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.98
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.6
              }}
              whileHover={!reducedMotion ? {
                scale: 1.02,
                y: -2,
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                transition: { duration: 0.2 }
              } : {}}
              layout
            >
              {/* Shine effect overlay */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
                initial={{ left: '-100%' }}
                whileHover={{
                  left: '100%',
                  transition: { duration: 0.6, ease: "easeInOut" }
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', position: 'relative', zIndex: 2 }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {message.sender === 'user' ? '👤 You' : '🤖 Assistant'}
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  color: 'var(--text-color)',
                  fontWeight: '500'
                }}
                dangerouslySetInnerHTML={{
                  __html: message.text.replace(/\n/g, '<br/>').replace(/•/g, '<span style="display: inline-block; margin-right: 8px;">•</span>')
                }}
              />
              {message.sender === 'assistant' && !message.isCommand && (
                <motion.button
                  onClick={() => speak(message.text)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    opacity: 0.8,
                    marginTop: '1rem',
                    position: 'relative',
                    zIndex: 2,
                    backdropFilter: 'blur(5px)',
                    fontWeight: '500'
                  }}
                  whileHover={!reducedMotion ? {
                    scale: 1.05,
                    opacity: 1,
                    background: 'rgba(16, 185, 129, 0.2)',
                    transition: { duration: 0.2 }
                  } : {}}
                  whileTap={{ scale: 0.95 }}
                  title="Replay message"
                >
                  🔄 Replay
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </motion.div>

      {/* Modals */}
      <SaveVoiceChatModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={(result) => {
          if (result.success) {
            showNotification('Conversation saved successfully!', 'success');
          }
        }}
        messages={messages}
        t={t}
        language={language}
        reducedMotion={reducedMotion}
      />

      <ExploreModal
        isOpen={showExploreModal}
        onClose={() => setShowExploreModal(false)}
        currentUserEmail={userEmail}
        t={t}
        language={language}
        onSignOut={onSignOut}
        onLoadVoiceChat={(loadedMessages) => {
          setMessages(loadedMessages);
          setShowExploreModal(false);
        }}
      />
    </motion.div>
  );
}