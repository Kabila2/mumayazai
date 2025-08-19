/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import "./VoiceInterface.css";
import { translations } from "../translations";

// ---------- Helpers: robust AI call with checks + timeout ----------
const hasPuter = () =>
  typeof window !== "undefined" &&
  window.puter &&
  puter.ai &&
  typeof puter.ai.chat === "function";

/**
 * Call puter.ai.chat safely, with a timeout and descriptive errors.
 * @param {string} prompt
 * @param {number} ms timeout in ms
 */
const aiChat = async (prompt, ms = 20000) => {
  if (!hasPuter()) {
    throw new Error(
      "Puter AI not available. Ensure sdk <script> is loaded and you are online."
    );
  }
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("AI request timed out")), ms)
  );
  const req = (async () => {
    const resp = await puter.ai.chat(prompt);
    return typeof resp === "string" ? resp : resp?.message?.content ?? "";
  })();
  return Promise.race([req, timeout]);
};

// ---------- Animations ----------
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 12 }
  }
};

const messageVariants = {
  hidden: { opacity: 0, x: -50, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 15 }
  },
  exit: { opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.3 } }
};

export default function VoiceInterface() {
  const [messages, setMessages] = useState([]);
  const [isListening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);

  // Pull language from LS, fallback to cookie, then default
  const initialLang =
    localStorage.getItem("language") ||
    Cookies.get("mumayaz_language") ||
    "en-US";
  const [language, setLanguage] = useState(initialLang === "en" ? "en-US" : initialLang);

  const [summary, setSummary] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // NEW: show AI availability status
  const [aiReady, setAiReady] = useState(hasPuter());

  const recognitionRef = useRef(null);
  const buttonControls = useAnimation();
  const messagesRef = useRef(null);

  const t = (key) => translations.en[key] ?? key;

  // Detect AI readiness on mount & on window focus (SDK might load late)
  useEffect(() => {
    const check = () => setAiReady(hasPuter());
    check();
    const id = setInterval(check, 1500);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
    };
  }, []);

  // Accessibility prefs
  useEffect(() => {
    const savedContrast = localStorage.getItem("high-contrast");
    const savedTextSize = localStorage.getItem("large-text");
    if (savedContrast === "true") setHighContrast(true);
    if (savedTextSize === "true") setLargeText(true);
  }, []);

  // Load system voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const all = synth.getVoices();
      const filtered = all.filter((v) => v.lang.startsWith("en"));
      setVoices(filtered);
      if (!selectedVoice && filtered.length) setSelectedVoice(filtered[0].name);
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Auto-scroll
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Speech Recognition setup
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
      setListening(false);
      setMessages((m) => [
        ...m,
        {
          sender: "system",
          text: `❌ Speech recognition error: ${event.error}.`,
          id: Date.now()
        }
      ]);
    };

    recog.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      const confidence = e.results[0][0].confidence;
      const confidenceIcon = confidence > 0.8 ? "✅" : confidence > 0.5 ? "⚠️" : "❓";

      setMessages((m) => [
        ...m,
        { sender: "user", text: `${confidenceIcon} ${text}`, confidence, id: Date.now() }
      ]);

      // Get disability from LS, fallback cookie, default dyslexia
      const storedDisability =
        localStorage.getItem("disability") ||
        Cookies.get("mumayaz_disability") ||
        "dyslexia";

      // ---- Robust AI call with explicit diagnostics ----
      try {
        const prompt = `You are helping a user with ${storedDisability}. Answer simply and supportively. Keep responses concise for voice interaction.\n\nUser: ${text}`;
        const reply = await aiChat(prompt);
        const cleanReply = reply.trim().replace(/[*_#]/g, "");

        setMessages((m) => [...m, { sender: "gpt", text: cleanReply, id: Date.now() + 1 }]);
        speak(cleanReply);
      } catch (err) {
        const msg =
          typeof err === "object" && err?.message
            ? err.message
            : String(err || "Unknown error");

        const helpful =
          !aiReady
            ? "Puter SDK not detected. Make sure the script https://sdk.puter.com/v1/sdk.js is loaded in index.html."
            : "Network/API issue. Check internet connection and API availability.";

        const errorMsg = `Connection error: ${msg}\n${helpful}`;
        setMessages((m) => [
          ...m,
          { sender: "gpt", text: `⚠️ ${errorMsg}`, id: Date.now() + 1 }
        ]);
        speak("I'm having trouble connecting to the AI right now. Please check your setup.");
      }
    };

    recognitionRef.current = recog;
  }, [language, aiReady]);

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
      .filter((m) => m.sender !== "system")
      .map((m) => `${m.sender}: ${m.text.replace(/[✅⚠️❓❌]/g, "")}`)
      .join("\n")}`;

    try {
      const resp = await aiChat(prompt, 20000);
      setSummary(resp.trim());
    } catch (err) {
      const msg =
        typeof err === "object" && err?.message
          ? err.message
          : String(err || "Unknown error");
      const helpful =
        !aiReady
          ? "Puter SDK not detected. Ensure the SDK script is loaded."
          : "Network/API issue. Check your connection or API status.";
      setSummary(`⚠️ Unable to generate summary. ${msg}. ${helpful}`);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setSummary("");
  };

  const toggleAccessibility = (feature) => {
    switch (feature) {
      case "contrast": {
        const nv = !highContrast;
        setHighContrast(nv);
        localStorage.setItem("high-contrast", String(nv));
        break;
      }
      case "text": {
        const nv = !largeText;
        setLargeText(nv);
        localStorage.setItem("large-text", String(nv));
        break;
      }
      default:
        break;
    }
  };

  return (
    <motion.div
      className={`voice-area ${highContrast ? "high-contrast" : ""} ${largeText ? "large-text" : ""}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* AI Status Banner */}
      {!aiReady && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            position: "fixed",
            top: 8,
            left: 8,
            right: 8,
            zIndex: 20,
            padding: "0.6rem 0.9rem",
            borderRadius: 12,
            background: "rgba(244,67,54,0.15)",
            border: "1px solid rgba(244,67,54,0.45)",
            color: "#fff",
            fontSize: "0.95rem",
            backdropFilter: "blur(8px)"
          }}
        >
          ⚠️ AI not ready: make sure the Puter SDK script is included and loaded before the app.
        </motion.div>
      )}

      {/* Listening Waves */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="voice-waves"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="wave w1" />
            <div className="wave w2" />
            <div className="wave w3" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility Controls */}
      <motion.div className="accessibility-controls" variants={itemVariants}>
        <motion.button
          className={`accessibility-btn ${highContrast ? "active" : ""}`}
          onClick={() => toggleAccessibility("contrast")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎨 High Contrast
        </motion.button>
        <motion.button
          className={`accessibility-btn ${largeText ? "active" : ""}`}
          onClick={() => toggleAccessibility("text")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📝 Large Text
        </motion.button>
      </motion.div>

      {/* Voice Controls */}
      <motion.div className="voice-controls" variants={itemVariants}>
        <motion.button
          className={`primary-btn ${isListening ? "listening" : ""}`}
          onClick={startListening}
          disabled={isListening || isSpeaking}
          animate={buttonControls}
          whileHover={!isListening ? { scale: 1.05, y: -3 } : {}}
          whileTap={!isListening ? { scale: 0.95 } : {}}
        >
          <motion.span
            animate={isListening ? { rotate: 360 } : { rotate: 0 }}
            transition={{
              duration: isListening ? 2 : 0.3,
              repeat: isListening ? Infinity : 0,
              ease: "linear"
            }}
          >
            {isListening ? "🎤" : "🗣️"}
          </motion.span>
          {isListening ? "Listening..." : "Speak Now"}
        </motion.button>

        <AnimatePresence>
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
        </AnimatePresence>

        <motion.button
          className="secondary-btn"
          onClick={() => setShowSettings(!showSettings)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ⚙️ Settings
        </motion.button>
      </motion.div>

      {/* Quick Settings */}
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
            <motion.button className="test-btn" onClick={() => speak("This is a test of the voice settings.")}>
              🔊 Test Voice
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation Log */}
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
                  <span
                    className={`confidence ${
                      m.confidence > 0.8 ? "high" : m.confidence > 0.5 ? "medium" : "low"
                    }`}
                  >
                    {Math.round(m.confidence * 100)}%
                  </span>
                )}
              </div>
              <div className="message-content">{m.text}</div>
              {m.sender === "gpt" && (
                <motion.button
                  className="replay-btn"
                  onClick={() => speak(m.text.replace(/[⚠️❌]/g, ""))}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
          <motion.div
            className="summary-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h4>📋 Conversation Summary</h4>
            <div className="summary-content">{summary}</div>
            <motion.button className="speak-summary-btn" onClick={() => speak(summary)}>
              🔊 Read Summary
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Status Indicator */}
      <motion.div
        className={`status-indicator ${isListening ? "listening" : isSpeaking ? "speaking" : "idle"}`}
        aria-label={isListening ? "Listening" : isSpeaking ? "Speaking" : "Idle"}
        title={isListening ? "Listening" : isSpeaking ? "Speaking" : "Idle"}
        initial={{ scale: 0.9, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
      />
    </motion.div>
  );
}
