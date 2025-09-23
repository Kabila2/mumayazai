/* global puter */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import MobileNavigation from './MobileNavigation';
import ExploreModal from './ExploreModal';
import SaveVoiceChatModal from './SaveVoiceChatModal';
import { useResponsive } from '../hooks/useResponsive';
import "./VoiceInterface.css";
import "./ChatInterface.css";

/** ---------- Advanced Voice System ---------- */
const VOICE_STORAGE_KEY = "mumayaz_voice_data";
const MAX_CONVERSATION_LENGTH = 150;
const CONTEXT_WINDOW = 25;
const AUTO_SAVE_DELAY = 800;

// Voice Commands System
const VOICE_COMMANDS = {
  'clear chat': { action: 'clearChat', response: 'Chat cleared' },
  'open settings': { action: 'openSettings', response: 'Settings opened' },
  'close settings': { action: 'closeSettings', response: 'Settings closed' },
  'save conversation': { action: 'saveChat', response: 'Saving conversation' },
  'switch to chat': { action: 'switchMode', response: 'Switching to chat mode' },
  'stop speaking': { action: 'stopSpeaking', response: null },
  'repeat that': { action: 'repeatLast', response: 'Repeating last message' },
  'help': { action: 'showHelp', response: 'Here are available voice commands' }
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

// Enhanced Puter Integration
class PuterVoiceAPI {
  static isAvailable() {
    return typeof window !== "undefined" &&
           window.puter?.ai?.chat &&
           typeof window.puter.ai.chat === "function";
  }

  static async waitForConnection(timeout = 5000) {
    if (this.isAvailable()) return true;

    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.isAvailable() || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(this.isAvailable());
        }
      }, 100);
    });
  }

  static async sendMessage(prompt, context = "") {
    if (!this.isAvailable()) {
      throw new Error("Puter AI not available");
    }

    const enhancedPrompt = context
      ? `${prompt}\n\nContext:\n${context}\n\nPlease provide a conversational response optimized for voice interaction.`
      : `${prompt}\n\nPlease provide a conversational response optimized for voice interaction.`;

    console.log("🚀 Sending enhanced voice prompt");

    const response = await window.puter.ai.chat(enhancedPrompt);
    const responseText = typeof response === "string" ? response : response?.message?.content ?? "";

    console.log("✅ Received AI response");
    return responseText;
  }
}

// Mock AI for development
const mockAIResponse = (input, hasContext) => {
  const responses = [
    `I understand you said: "${input.substring(0, 50)}...". This is a demonstration of the new voice interface with enhanced features.`,
    `Regarding "${input.substring(0, 50)}...", I'm running in demo mode with advanced voice capabilities and conversation management.`,
    `You mentioned "${input.substring(0, 50)}...". The new voice system includes smart command recognition and contextual responses.`
  ];

  const contextNote = hasContext ? " I'm maintaining our conversation history for better continuity." : "";
  return responses[Math.floor(Math.random() * responses.length)] + contextNote;
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
  console.log("🎯 New VoiceInterface initialized");

  // Core State
  const [conversations, setConversations] = useState(() => {
    const saved = VoiceMemoryManager.load();
    return saved?.conversations || [];
  });

  const [currentSession, setCurrentSession] = useState(() => {
    const saved = VoiceMemoryManager.load();
    return saved?.currentSession || {
      id: Date.now(),
      messages: [{
        id: Date.now(),
        sender: "assistant",
        text: "🎙️ Welcome to the new Mumayaz Voice Assistant! I'm equipped with advanced features including voice commands, conversation management, and enhanced AI interactions. Try saying 'help' to see what I can do!",
        timestamp: new Date().toISOString()
      }],
      title: "New Voice Session",
      createdAt: new Date().toISOString()
    };
  });

  // Voice System State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [lastTranscript, setLastTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // Responsive
  const { isMobile, isTablet, shouldUseHamburgerMenu, isCompact } = useResponsive();

  // Auto-save conversations
  useEffect(() => {
    if (currentSession.messages.length > 1) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const updatedConversations = conversations.some(c => c.id === currentSession.id)
          ? conversations.map(c => c.id === currentSession.id ? currentSession : c)
          : [...conversations, currentSession];

        VoiceMemoryManager.save(updatedConversations, currentSession);
        setConversations(updatedConversations);
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentSession, conversations]);

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification("Speech recognition not supported in this browser", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setLastTranscript("");
      setConfidence(0);
      console.log("🎤 Voice recognition started");
    };

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      setLastTranscript(transcript);
      setConfidence(confidence);

      if (result.isFinal) {
        handleVoiceInput(transcript, confidence);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceLevel(0);
      console.log("🔇 Voice recognition ended");
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setVoiceLevel(0);
      console.error("Speech recognition error:", event.error);
      showNotification(`Voice recognition error: ${event.error}`, "error");
    };

    recognitionRef.current = recognition;

    return () => {
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
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isListening]);

  // Voice Synthesis
  const speak = useCallback((text) => {
    if (!text || !autoSpeak) return;

    if (extSpeak) {
      extSpeak(text);
      return;
    }

    if (!window.speechSynthesis) return;

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

    const voice = voices.find(v => v.name === selectedVoiceLocal);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.rate = speedLocal;
    utterance.pitch = pitchLocal;
    utterance.volume = volumeLocal;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [extSpeak, autoSpeak, voices, selectedVoiceLocal, speedLocal, pitchLocal, volumeLocal]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Voice Command Processing
  const processVoiceCommand = useCallback((text) => {
    const lowerText = text.toLowerCase().trim();

    for (const [command, config] of Object.entries(VOICE_COMMANDS)) {
      if (lowerText.includes(command)) {
        if (config.response) {
          showNotification(config.response, "success");
        }

        switch (config.action) {
          case 'clearChat':
            clearCurrentSession();
            break;
          case 'openSettings':
            setShowSettings(true);
            break;
          case 'closeSettings':
            setShowSettings(false);
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
          case 'showHelp':
            showVoiceCommands();
            break;
        }
        return true;
      }
    }
    return false;
  }, [onSwitchMode, stopSpeaking]);

  // Handle Voice Input
  const handleVoiceInput = useCallback(async (transcript, confidence) => {
    if (!transcript.trim()) return;

    console.log("🗣️ Voice input:", transcript, "confidence:", confidence);

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: transcript,
      confidence: confidence,
      timestamp: new Date().toISOString()
    };

    // Update current session with user message
    setCurrentSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // Check for voice commands
    if (commandMode && processVoiceCommand(transcript)) {
      const commandMessage = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "Voice command executed successfully.",
        isCommand: true,
        timestamp: new Date().toISOString()
      };

      setCurrentSession(prev => ({
        ...prev,
        messages: [...prev.messages, commandMessage]
      }));
      return;
    }

    // Process as AI query
    setIsProcessing(true);

    try {
      const context = VoiceMemoryManager.buildContext(currentSession.messages);
      const isReady = await PuterVoiceAPI.waitForConnection(3000);

      let response;
      if (isReady) {
        response = await PuterVoiceAPI.sendMessage(transcript, context);
      } else {
        response = mockAIResponse(transcript, !!context);
      }

      const assistantMessage = {
        id: Date.now() + 2,
        sender: "assistant",
        text: response,
        timestamp: new Date().toISOString()
      };

      setCurrentSession(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage]
      }));

      if (autoSpeak) {
        speak(response);
      }

    } catch (error) {
      console.error("AI processing error:", error);
      const errorMessage = {
        id: Date.now() + 2,
        sender: "assistant",
        text: "I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };

      setCurrentSession(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));

      showNotification("Failed to process voice input", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [currentSession.messages, commandMode, processVoiceCommand, speak, autoSpeak]);

  // Utility Functions
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const clearCurrentSession = () => {
    setCurrentSession({
      id: Date.now(),
      messages: [{
        id: Date.now(),
        sender: "assistant",
        text: "New voice session started. How can I help you today?",
        timestamp: new Date().toISOString()
      }],
      title: "New Voice Session",
      createdAt: new Date().toISOString()
    });
    showNotification("Chat cleared", "success");
  };

  const repeatLastMessage = () => {
    const lastAssistantMessage = [...currentSession.messages]
      .reverse()
      .find(m => m.sender === "assistant" && !m.isCommand);

    if (lastAssistantMessage) {
      speak(lastAssistantMessage.text);
    }
  };

  const showVoiceCommands = () => {
    setShowCommands(true);
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

  // Navigation Configuration
  const navigationButtons = [
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings',
      onClick: () => setShowSettings(!showSettings),
      variant: 'secondary'
    },
    {
      id: 'commands',
      icon: '🎯',
      label: 'Commands',
      onClick: () => setShowCommands(true),
      variant: 'secondary'
    },
    {
      id: 'save',
      icon: '💾',
      label: 'Save',
      onClick: () => setShowSaveModal(true),
      variant: 'secondary',
      disabled: currentSession.messages.length <= 1
    },
    {
      id: 'chat-mode',
      icon: '💬',
      label: 'Chat Mode',
      onClick: () => onSwitchMode?.('chat'),
      variant: 'tertiary'
    }
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

      {/* Navigation Header - Matching ChatInterface */}
      <motion.header
        className="chat-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.6, ease: 'easeOut' }}
      >
        {/* Large Centered Title */}
        <motion.div
          className="assistant-title"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.4 }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
            zIndex: 10
          }}
        >
          <span className="title-main" style={{
            fontSize: 'clamp(2rem, 5.5vw, 4rem)',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 20%, #e2e8f0 40%, #cbd5e1 60%, #94a3b8 80%, #64748b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s ease-in-out infinite',
            display: 'block',
            letterSpacing: '-0.03em',
            lineHeight: '0.95',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)',
            filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.3))'
          }}>
            Voice Assistant
          </span>
          <span style={{
            fontSize: shouldUseHamburgerMenu ? '0.8rem' : '0.9rem',
            color: 'var(--text-light)',
            fontWeight: '500',
            opacity: 0.8,
            marginTop: '0.5rem'
          }}>
            {isListening ? "🎤 Listening..." :
             isSpeaking ? "🔊 Speaking..." :
             isProcessing ? "⚡ Processing..." : "Ready"}
          </span>
          {isListening && (
            <motion.div
              style={{
                width: shouldUseHamburgerMenu ? '120px' : '200px',
                height: '3px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '0.5rem'
              }}
            >
              <motion.div
                style={{
                  width: `${voiceLevel * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                  borderRadius: '2px'
                }}
                animate={{ width: `${voiceLevel * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Header Actions - Same as ChatInterface */}
        <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {/* Left side - spacer */}
          <div style={{ display: 'flex', gap: '0.5rem' }}></div>

          {/* Right side - Navigation buttons */}
          <div style={{
            display: 'flex',
            gap: shouldUseHamburgerMenu ? '0.5rem' : '0.75rem',
            alignItems: 'center'
          }}>
            {!shouldUseHamburgerMenu && navigationButtons.map((button, index) => (
              <motion.button
                key={button.id}
                className="header-button"
                onClick={button.onClick}
                disabled={button.disabled}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index + 1) * 0.1, duration: reducedMotion ? 0.1 : 0.3 }}
                whileHover={!button.disabled && !reducedMotion ? { scale: 1.02, y: -1 } : {}}
                whileTap={!button.disabled ? { scale: 0.98 } : {}}
                style={{
                  opacity: button.disabled ? 0.5 : 1
                }}
              >
                <span>{button.icon}</span>
                <span>{button.label}</span>
              </motion.button>
            ))}

            {shouldUseHamburgerMenu && (
              <motion.button
                className="hamburger-btn"
                onClick={() => setShowSettings(!showSettings)}
                whileHover={!reducedMotion ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: isCompact ? '40px' : '44px',
                  height: isCompact ? '40px' : '44px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  gap: '3px',
                  padding: 0
                }}
              >
                <div style={{ width: '18px', height: '2px', background: 'var(--text-light)', borderRadius: '1px' }} />
                <div style={{ width: '18px', height: '2px', background: 'var(--text-light)', borderRadius: '1px' }} />
                <div style={{ width: '18px', height: '2px', background: 'var(--text-light)', borderRadius: '1px' }} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Voice Controls */}
      <motion.div
        className="voice-main-controls"
        style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          marginTop: '80px'
        }}
      >
        <motion.button
          className="voice-main-button"
          onClick={startListening}
          disabled={isListening || isProcessing}
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
            cursor: isListening || isProcessing ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
          whileHover={!isListening && !isProcessing ? { scale: 1.05 } : {}}
          whileTap={!isListening && !isProcessing ? { scale: 0.95 } : {}}
          animate={isListening ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 8px 25px rgba(0,0,0,0.3)',
              '0 12px 35px rgba(239, 68, 68, 0.4)',
              '0 8px 25px rgba(0,0,0,0.3)'
            ]
          } : {}}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
        >
          {isListening ? '🎤' : isProcessing ? '⚡' : '🗣️'}
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
              🔇 Stop
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
              cursor: 'pointer'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🗑️ Clear
          </motion.button>
        </div>
      </motion.div>

      {/* Enhanced Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="voice-settings-panel"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '2rem',
              width: '90vw',
              maxWidth: '500px',
              zIndex: 1000,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
            initial={{ opacity: 0, scale: 0.9, y: '-40%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-40%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Voice Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-color)'
                }}
              >
                ×
              </button>
            </div>

            <div className="settings-grid" style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label>Auto Speak Responses</label>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  style={{ marginLeft: '0.5rem' }}
                />
              </div>

              <div>
                <label>Voice Command Mode</label>
                <input
                  type="checkbox"
                  checked={commandMode}
                  onChange={(e) => setCommandMode(e.target.checked)}
                  style={{ marginLeft: '0.5rem' }}
                />
              </div>

              <div>
                <label>Speech Speed: {speedLocal.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speedLocal}
                  onChange={(e) => setSpeedLocal(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
              </div>

              <div>
                <label>Speech Pitch: {pitchLocal.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitchLocal}
                  onChange={(e) => setPitchLocal(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
              </div>

              <div>
                <label>Volume: {Math.round(volumeLocal * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volumeLocal}
                  onChange={(e) => setVolumeLocal(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
              </div>

              <button
                onClick={() => speak("This is a test of the voice settings")}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid var(--glass-border)',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                🔊 Test Voice
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Commands Help */}
      <AnimatePresence>
        {showCommands && (
          <>
            {/* Backdrop */}
            <motion.div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999,
                backdropFilter: 'blur(4px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommands(false)}
            />

            <motion.div
              className="voice-commands-panel"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '2rem',
                width: '90vw',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}
              initial={{ opacity: 0, scale: 0.8, y: '-40%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%' }}
              exit={{ opacity: 0, scale: 0.8, y: '-40%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Voice Commands</h3>
              <button
                onClick={() => setShowCommands(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-color)'
                }}
              >
                ×
              </button>
            </div>

            <div className="commands-list" style={{ display: 'grid', gap: '0.75rem' }}>
              {Object.entries(VOICE_COMMANDS).map(([command, config]) => (
                <div key={command} style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <strong>"{command}"</strong>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    {config.response || `Executes ${config.action}`}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
        )}
      </AnimatePresence>

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
          border: '1px solid var(--glass-border)'
        }}
      >
        <AnimatePresence mode="popLayout">
          {currentSession.messages.map((message, index) => (
            <motion.div
              key={message.id}
              className={`message ${message.sender}`}
              style={{
                padding: '0.75rem',
                margin: '0.5rem 0',
                borderRadius: '8px',
                background: message.sender === 'user'
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${message.sender === 'user' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {message.sender === 'user' ? '👤 You' : '🤖 Assistant'}
                </span>
                {message.confidence && (
                  <span style={{
                    fontSize: '0.8rem',
                    opacity: 0.7,
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}>
                    {Math.round(message.confidence * 100)}%
                  </span>
                )}
              </div>
              <div>{message.text}</div>
              {message.sender === 'assistant' && !message.isCommand && (
                <button
                  onClick={() => speak(message.text)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    opacity: 0.7,
                    marginTop: '0.5rem'
                  }}
                  title="Replay message"
                >
                  🔄
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
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
        messages={currentSession.messages}
        t={t}
        language={language}
        reducedMotion={reducedMotion}
      />

      <ExploreModal
        isOpen={showExploreModal}
        onClose={() => setShowExploreModal(false)}
        currentUserEmail={null}
        t={t}
        language={language}
        onSignOut={onSignOut}
        onLoadVoiceChat={(messages) => {
          setCurrentSession(prev => ({ ...prev, messages }));
          setShowExploreModal(false);
        }}
      />
    </motion.div>
  );
}