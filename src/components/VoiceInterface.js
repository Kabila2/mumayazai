/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import "./VoiceInterface.css";

/* ---------- Helpers: disability → title + theme ---------- */
const getCurrentDisability = () =>
  (localStorage.getItem("disability") || Cookies.get("mumayaz_disability") || "dyslexia").toLowerCase();

const getAssistantTitleByDisability = (d) => {
  switch ((d || "").toLowerCase()) {
    case "adhd":
      return "ADHD-Friendly Voice Assistant";
    case "autism":
      return "Autism-Friendly Voice Assistant";
    case "dyslexia":
      return "Dyslexia-Friendly Voice Assistant";
    default:
      return "Accessible Voice Assistant";
  }
};

const getTheme = (d) => {
  const key = (d || "").toLowerCase();
  if (key === "adhd") {
    return {
      headerBg: "linear-gradient(135deg, #FF6F00, #FF8F00)",
      primary: "#FF8F00",
      waveBorder: "rgba(255, 143, 0, 0.6)",
      btnGradient: "linear-gradient(135deg, #FF6F00, #FF8F00)",
      stopBg: "#e53935",
      panelBg: "rgba(0,0,0,0.65)",
      text: "#fff",
      textAlt: "#FFF9E6",
      ringGlow: "rgba(255, 200, 0, 0.6)",
      accentBorder: "rgba(255, 143, 0, 0.35)",
    };
  }
  if (key === "autism") {
    return {
      headerBg: "linear-gradient(135deg, #26A69A, #00796B)",
      primary: "#26A69A",
      waveBorder: "rgba(38, 166, 154, 0.6)",
      btnGradient: "linear-gradient(135deg, #26A69A, #00796B)",
      stopBg: "#c62828",
      panelBg: "rgba(0,0,0,0.65)",
      text: "#E0F2F1",
      textAlt: "#E0F7FA",
      ringGlow: "rgba(0, 150, 136, 0.6)",
      accentBorder: "rgba(38, 166, 154, 0.35)",
    };
  }
  // default: dyslexia
  return {
    headerBg: "linear-gradient(135deg, #4CAF50, #45a049)",
    primary: "#4CAF50",
    waveBorder: "rgba(76, 175, 80, 0.6)",
    btnGradient: "linear-gradient(135deg, #4CAF50, #45a049)",
    stopBg: "#d32f2f",
    panelBg: "rgba(0,0,0,0.65)",
    text: "#ffffff",
    textAlt: "#e8f5e8",
    ringGlow: "rgba(76, 175, 80, 0.6)",
    accentBorder: "rgba(76, 175, 80, 0.35)",
  };
};

/* ---------- Puter helpers ---------- */
const hasPuter = () =>
  typeof window !== "undefined" &&
  window.puter &&
  window.puter.ai &&
  typeof window.puter.ai.chat === "function";

const aiChat = async (prompt, ms = 20000) => {
  if (!hasPuter()) throw new Error("Puter AI not available");
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("AI request timed out")), ms)
  );
  const req = (async () => {
    const resp = await window.puter.ai.chat(prompt);
    return typeof resp === "string" ? resp : resp?.message?.content ?? "";
  })();
  return Promise.race([req, timeout]);
};

const mockAI = (prompt) => {
  const last = (prompt.split("\n").pop() || "").replace(/^User:\s*/i, "");
  return `⚠️ AI offline (mock). You said: "${last}"`;
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
}) {
  const disability = getCurrentDisability();
  const theme = getTheme(disability);
  const assistantTitle = getAssistantTitleByDisability(disability);

  /* ---------- State ---------- */
  const [messages, setMessages] = useState([]);
  const [isListening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState(extVoices || []);
  const [localVoice, setLocalVoice] = useState(selectedVoice || "");
  const [localSpeed, setLocalSpeed] = useState(speed || 1);
  const [localPitch, setLocalPitch] = useState(pitch || 1);
  const [showSettings, setShowSettings] = useState(false);
  const [aiReady, setAiReady] = useState(hasPuter());

  const recognitionRef = useRef(null);
  const messagesRef = useRef(null);
  const buttonControls = useAnimation();

  /* ---------- Effects ---------- */
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

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const all = synth.getVoices();
      const filtered = all.filter((v) => v.lang?.startsWith("en"));
      setVoices(filtered);
      if (!localVoice && filtered.length) setLocalVoice(filtered[0].name);
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [localVoice]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.lang = language || "en-US";
    recog.interimResults = false;
    recog.continuous = false;

    recog.onstart = () => {
      setListening(true);
      if (navigator.vibrate) navigator.vibrate(80);
    };
    recog.onend = () => setListening(false);
    recog.onerror = (event) => {
      setListening(false);
      setMessages((m) => [
        ...m,
        { sender: "system", text: `❌ Speech recognition error: ${event.error}`, id: Date.now() },
      ]);
    };
    recog.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      const confidence = e.results[0][0].confidence;
      setMessages((m) => [
        ...m,
        { sender: "user", text: text, confidence, id: Date.now() },
      ]);
      try {
        const prompt = `You are helping a user with ${disability}. Keep answers clear and concise for voice.\n\nUser: ${text}`;
        const raw = aiReady ? await aiChat(prompt) : mockAI(prompt);
        const clean = (raw || "").toString().trim().replace(/[*_#`]/g, "");
        setMessages((m) => [...m, { sender: "gpt", text: clean, id: Date.now() + 1 }]);
        speak(clean);
      } catch (err) {
        setMessages((m) => [
          ...m,
          { sender: "gpt", text: "⚠️ Connection issue. Please check AI SDK.", id: Date.now() + 1 },
        ]);
        speak("I'm having trouble connecting to the AI right now.");
      }
    };

    recognitionRef.current = recog;
  }, [language, aiReady, disability]);

  /* ---------- Speech ---------- */
  const speak = (text) => {
    // Prefer external speak if passed from App
    if (typeof extSpeak === "function") {
      extSpeak(text);
      return;
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceObj = voices.find((v) => v.name === localVoice);
    if (voiceObj) {
      utterance.voice = voiceObj;
      utterance.lang = voiceObj.lang;
    } else {
      utterance.lang = language || "en-US";
    }
    utterance.rate = localSpeed;
    utterance.pitch = localPitch;
    utterance.volume = 0.92;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported. Try Chrome, Edge, or Safari.");
      return;
    }
    buttonControls.start({
      scale: [1, 0.95, 1.1, 1],
      transition: { duration: 0.3 },
    });
    recognitionRef.current.start();
  };

  const clearMessages = () => setMessages([]);

  /* ---------- UI ---------- */
  const waves = isListening ? (
    <div
      style={{
        position: "fixed",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 0,
        filter: "blur(1px)",
      }}
    >
      {["0s", "0.4s", "0.8s"].map((delay, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 240,
            height: 240,
            borderRadius: "50%",
            border: `2px solid ${theme.waveBorder}`,
            opacity: 0,
            animation: `ring 2.2s ease-out ${delay} infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes ring {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.0; }
          25% { opacity: 0.6; }
          70% { opacity: 0.15; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  ) : null;

  return (
    <motion.div
      className={`voice-area ${highContrast ? "high-contrast" : ""}`}
      style={{
        fontSize: `${fontSize}rem`,
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "2rem 1rem",
        background: "linear-gradient(135deg, #0a0a23 0%, #1a001a 50%, #000020 100%)",
        color: theme.text,
        overflow: "hidden",
        fontFamily: "'Lexend','Open Dyslexic', Arial, sans-serif",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.6 }}
    >
      {/* Title */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "10px 14px",
          textAlign: "center",
          color: theme.text,
          background: theme.headerBg,
          borderBottom: `2px solid ${theme.accentBorder}`,
          width: "100%",
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        {assistantTitle}
      </div>

      {/* Switch */}
      {onSwitchMode && (
        <motion.button
          onClick={onSwitchMode}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: theme.text,
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Switch to Text Chat
        </motion.button>
      )}

      {/* Listening waves */}
      <AnimatePresence>{isListening && waves}</AnimatePresence>

      {/* Controls */}
      <motion.div
        style={{
          display: "flex",
          gap: "1rem",
          margin: "2rem 0",
          flexWrap: "wrap",
          justifyContent: "center",
          zIndex: 2,
        }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          onClick={startListening}
          disabled={isListening || isSpeaking}
          animate={buttonControls}
          style={{
            padding: "1rem 2rem",
            fontSize: "1.1rem",
            fontWeight: 700,
            background: isListening ? theme.btnGradient : theme.btnGradient,
            border: "none",
            borderRadius: 16,
            color: theme.text,
            cursor: isListening || isSpeaking ? "not-allowed" : "pointer",
            minWidth: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            opacity: isListening || isSpeaking ? 0.75 : 1,
            boxShadow: isListening ? `0 0 40px ${theme.ringGlow}` : "none",
          }}
          whileHover={!isListening && !isSpeaking ? { scale: 1.05, y: -3 } : {}}
          whileTap={!isListening && !isSpeaking ? { scale: 0.95 } : {}}
          transition={{ duration: 2, repeat: isListening ? Infinity : 0 }}
        >
          <span>{isListening ? "🎤" : "🗣️"}</span>
          {isListening ? "Listening..." : "Speak Now"}
        </motion.button>

        {isSpeaking && (
          <motion.button
            onClick={stopSpeaking}
            style={{
              padding: "0.85rem 1.5rem",
              fontSize: "1rem",
              background: theme.stopBg,
              border: "none",
              borderRadius: 16,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
          >
            🔇 Stop
          </motion.button>
        )}

        <motion.button
          onClick={() => setShowSettings((v) => !v)}
          style={{
            padding: "0.85rem 1.5rem",
            fontSize: "1rem",
            background: "rgba(255,255,255,0.12)",
            border: `2px solid ${theme.accentBorder}`,
            borderRadius: 16,
            color: theme.text,
            cursor: "pointer",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
          }}
          whileHover={{ scale: 1.05 }}
        >
          ⚙️ Settings
        </motion.button>

        <motion.button
          onClick={clearMessages}
          style={{
            padding: "0.85rem 1.5rem",
            fontSize: "1rem",
            background: "rgba(255,255,255,0.12)",
            border: `2px solid ${theme.accentBorder}`,
            borderRadius: 16,
            color: theme.text,
            cursor: "pointer",
            fontWeight: 600,
          }}
          whileHover={{ scale: 1.05 }}
        >
          🗑️ Clear
        </motion.button>
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            style={{
              background: theme.panelBg,
              backdropFilter: "blur(16px)",
              borderRadius: 16,
              padding: "1.25rem",
              margin: "0.5rem 0 0.5rem",
              minWidth: 320,
              border: `1px solid ${theme.accentBorder}`,
            }}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
          >
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Voice Speed: {localSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={localSpeed}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setLocalSpeed(v);
                  setSpeed?.(v);
                }}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Voice Pitch: {localPitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={localPitch}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setLocalPitch(v);
                  setPitch?.(v);
                }}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ display: "block", marginBottom: 6 }}>Voice</label>
              <select
                value={localVoice}
                onChange={(e) => {
                  setLocalVoice(e.target.value);
                  setSelectedVoice?.(e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: 10,
                  border: `1px solid ${theme.accentBorder}`,
                  background: "rgba(0,0,0,0.35)",
                  color: theme.text,
                }}
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => speak("This is a test of the voice settings.")}
              style={{
                width: "100%",
                padding: "0.8rem",
                background: theme.headerBg,
                border: "none",
                borderRadius: 10,
                color: theme.text,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🔊 Test Voice
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation Log */}
      <motion.div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 840,
          background: theme.panelBg,
          border: `1px solid ${theme.accentBorder}`,
          borderRadius: 16,
          padding: "1rem",
          marginTop: "1rem",
          overflowY: "auto",
          maxHeight: "50vh",
        }}
        ref={messagesRef}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: `1px solid ${theme.accentBorder}`,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.15rem", color: theme.text }}>Conversation History</h3>
        </div>

        <AnimatePresence mode="popLayout">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              style={{
                background:
                  m.sender === "user"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.08)",
                border: `1px solid ${theme.accentBorder}`,
                borderRadius: 12,
                padding: "0.85rem 1rem",
                marginBottom: "0.75rem",
                position: "relative",
                color: theme.textAlt,
              }}
              initial={{ opacity: 0, x: -40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{ duration: reducedMotion ? 0 : 0.25 }}
              layout
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "1.1rem" }}>
                  {m.sender === "user" ? "👤" : m.sender === "gpt" ? "🤖" : "⚙️"}
                </span>
                <b>{m.sender === "user" ? "You" : m.sender === "gpt" ? "Assistant" : "System"}</b>
                {typeof m.confidence === "number" && (
                  <span
                    style={{
                      marginLeft: "auto",
                      padding: "0.15rem 0.45rem",
                      borderRadius: 10,
                      fontSize: "0.8rem",
                      background:
                        m.confidence > 0.8
                          ? "rgba(76,175,80,0.22)"
                          : m.confidence > 0.5
                          ? "rgba(255,152,0,0.22)"
                          : "rgba(244,67,54,0.22)",
                      color:
                        m.confidence > 0.8 ? "#4CAF50" : m.confidence > 0.5 ? "#FF9800" : "#F44336",
                    }}
                  >
                    {Math.round(m.confidence * 100)}%
                  </span>
                )}
              </div>
              <div style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</div>
              {m.sender === "gpt" && (
                <button
                  onClick={() => speak(m.text.replace(/[⚠️❌]/g, ""))}
                  title="Replay message"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "transparent",
                    border: "none",
                    color: theme.textAlt,
                    cursor: "pointer",
                    fontSize: "1.1rem",
                  }}
                >
                  🔄
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Status indicator */}
      <motion.div
        title={isListening ? "Listening" : isSpeaking ? "Speaking" : "Idle"}
        aria-label={isListening ? "Listening" : isSpeaking ? "Speaking" : "Idle"}
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isListening ? theme.primary : isSpeaking ? "#FF9800" : "#8e2de2",
          boxShadow: `0 0 16px ${theme.ringGlow}`,
        }}
        initial={{ scale: 0.95, opacity: 0.9 }}
        animate={{ scale: 1, opacity: 1 }}
      />
    </motion.div>
  );
}
