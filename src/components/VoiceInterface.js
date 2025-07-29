/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import "./VoiceInterface.css";
import { translations } from "../translations";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const messageVariants = {
  hidden: { opacity: 0, x: -50, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.9,
    transition: { duration: 0.3 }
  }
};

export default function VoiceInterface() {
  const [messages, setMessages] = useState([]);
  const [isListening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");
  const [summary, setSummary] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState("standard");
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  const recognitionRef = useRef(null);
  const buttonControls = useAnimation();
  const messagesRef = useRef(null);

  const t = (key) => translations.en[key] ?? key;

  useEffect(() => {
    const savedAccessibility = localStorage.getItem("accessibility-mode");
    const savedContrast = localStorage.getItem("high-contrast");
    const savedTextSize = localStorage.getItem("large-text");
    if (savedAccessibility) setAccessibilityMode(savedAccessibility);
    if (savedContrast === "true") setHighContrast(true);
    if (savedTextSize === "true") setLargeText(true);
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const all = synth.getVoices();
      const filtered = all.filter((v) => v.lang.startsWith("en"));
      setVoices(filtered);
      if (!selectedVoice && filtered.length) {
        setSelectedVoice(filtered[0].name);
      }
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => { synth.onvoiceschanged = null };
  }, [selectedVoice]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.lang = language;
    recog.interimResults = false;
    recog.continuous = false;

    recog.onstart = () => {
      setListening(true);
      if (navigator.vibrate) navigator.vibrate(100);
    };

    recog.onend = () => {
      setListening(false);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    };

    recog.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
      setMessages((m) => [...m, {
        sender: "system",
        text: `❌ Speech recognition error: ${event.error}. Please try again.`,
        id: Date.now()
      }]);
    };

    recog.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      const confidence = e.results[0][0].confidence;
      const confidenceIcon = confidence > 0.8 ? "✅" : confidence > 0.5 ? "⚠️" : "❓";

      setMessages((m) => [...m, {
        sender: "user",
        text: `${confidenceIcon} ${text}`,
        confidence,
        id: Date.now()
      }]);

      try {
        const disability = localStorage.getItem("disability") || "none";
        const prompt = `You are helping a user with ${disability}. Answer simply and supportively. Keep responses concise for voice interaction.\n\nUser: ${text}`;
        const resp = await puter.ai.chat(prompt);
        const reply = typeof resp === "string" ? resp : resp.message?.content ?? "";
        const cleanReply = reply.trim().replace(/[*_#]/g, '');

        setMessages((m) => [...m, {
          sender: "gpt",
          text: cleanReply,
          id: Date.now() + 1
        }]);

        speak(cleanReply);
      } catch {
        const errorMsg = "I'm sorry, I'm having trouble connecting right now. Please try again.";
        setMessages((m) => [...m, {
          sender: "gpt",
          text: `⚠️ ${errorMsg}`,
          id: Date.now() + 1
        }]);
        speak(errorMsg);
      }
    };

    recognitionRef.current = recog;
  }, [language]);

  const startListening = async () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    buttonControls.start({
      scale: [1, 0.95, 1.1, 1],
      transition: { duration: 0.3 }
    });
    recognitionRef.current.start();
  };

  const speak = (text) => {
    if (!window.speechSynthesis) {
      alert("Sorry, your browser does not support speech synthesis.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceObj = voices.find((v) => v.name === selectedVoice);
    if (voiceObj) {
      utterance.voice = voiceObj;
      utterance.lang = voiceObj.lang;
    } else {
      utterance.lang = language;
    }
    utterance.rate = speed;
    utterance.pitch = pitch;
    utterance.volume = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const generateSummary = async () => {
    if (messages.length === 0) return;
    const prompt = `Summarize this conversation in 3 simple bullet points for a person with disabilities:\n${messages
      .filter(m => m.sender !== "system")
      .map((m) => `${m.sender}: ${m.text.replace(/[✅⚠️❓❌]/g, '')}`)
      .join("\n")}`;
    try {
      const resp = await puter.ai.chat(prompt);
      const text = typeof resp === "string" ? resp : resp.message?.content;
      setSummary(text.trim());
    } catch {
      setSummary("⚠️ Unable to generate summary. Please try again later.");
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setSummary("");
  };

  const toggleAccessibility = (feature) => {
    switch (feature) {
      case "contrast":
        setHighContrast(!highContrast);
        localStorage.setItem("high-contrast", (!highContrast).toString());
        break;
      case "text":
        setLargeText(!largeText);
        localStorage.setItem("large-text", (!largeText).toString());
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      className={`voice-area ${highContrast ? 'high-contrast' : ''} ${largeText ? 'large-text' : ''}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="accessibility-controls" variants={itemVariants}>
        <motion.button
          className={`accessibility-btn ${highContrast ? 'active' : ''}`}
          onClick={() => toggleAccessibility('contrast')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎨 High Contrast
        </motion.button>
        <motion.button
          className={`accessibility-btn ${largeText ? 'active' : ''}`}
          onClick={() => toggleAccessibility('text')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📝 Large Text
        </motion.button>
      </motion.div>

      <motion.div className="voice-controls" variants={itemVariants}>
        <motion.button
          className={`primary-btn ${isListening ? 'listening' : ''}`}
          onClick={startListening}
          disabled={isListening || isSpeaking}
          animate={buttonControls}
          whileHover={!isListening ? { scale: 1.05, y: -3 } : {}}
          whileTap={!isListening ? { scale: 0.95 } : {}}
        >
          <motion.span
            animate={isListening ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: isListening ? 2 : 0.3, repeat: isListening ? Infinity : 0, ease: "linear" }}
          >
            {isListening ? "🎤" : "🗣️"}
          </motion.span>
          {isListening ? "Listening..." : "Speak Now"}
        </motion.button>

        {isSpeaking && (
          <motion.button
            className="secondary-btn stop-btn"
            onClick={stopSpeaking}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            🔇 Stop
          </motion.button>
        )}

        <motion.button
          className="secondary-btn"
          onClick={() => setShowSettings(!showSettings)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ⚙️ Settings
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="quick-settings"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <div className="setting-group">
              <label>Voice Speed: {speed.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
              />
            </div>
            <div className="setting-group">
              <label>Voice Pitch: {pitch.toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
              />
            </div>
            <motion.button
              className="test-btn"
              onClick={() => speak("This is a test of the voice settings.")}
            >
              🔊 Test Voice
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="voice-log" variants={itemVariants} ref={messagesRef}>
        <div className="log-header">
          <h3>Conversation History</h3>
          <div className="log-controls">
            {messages.length > 0 && (
              <>
                <motion.button className="summary-btn" onClick={generateSummary}>
                  📋 Summary
                </motion.button>
                <motion.button className="clear-btn" onClick={clearMessages}>
                  🗑️ Clear
                </motion.button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className={`log-message ${m.sender}`}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <div className="message-header">
                <span className="sender-icon">
                  {m.sender === "user" ? "👤" : m.sender === "gpt" ? "🤖" : "⚙️"}
                </span>
                <span className="sender-name">
                  {m.sender === "user" ? "You" : m.sender === "gpt" ? "Assistant" : "System"}
                </span>
                {m.confidence && (
                  <span className={`confidence ${m.confidence > 0.8 ? 'high' : m.confidence > 0.5 ? 'medium' : 'low'}`}>
                    {Math.round(m.confidence * 100)}%
                  </span>
                )}
              </div>
              <div className="message-content">{m.text}</div>
              {m.sender === "gpt" && (
                <motion.button
                  className="replay-btn"
                  onClick={() => speak(m.text.replace(/[⚠️❌]/g, ''))}
                >
                  🔄
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length === 0 && (
          <motion.div className="empty-state" variants={itemVariants}>
            <div className="empty-icon">🎙️</div>
            <h3>Ready to chat!</h3>
            <p>Click "Speak Now" to start your voice conversation.</p>
          </motion.div>
        )}

        {summary && (
          <motion.div className="summary-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h4>📋 Conversation Summary</h4>
            <div className="summary-content">{summary}</div>
            <motion.button
              className="speak-summary-btn"
              onClick={() => speak(summary)}
            >
              🔊 Read Summary
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
