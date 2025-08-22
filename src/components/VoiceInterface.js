/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import "./VoiceInterface.css";

/* ---------- Helper: map disability → assistant title ---------- */
const getAssistantTitleByDisability = (d) => {
  const key = (d || "").toLowerCase();
  if (key === "adhd") return "ADHD-Friendly Chat Assistant";
  if (key === "autism") return "Autism-Friendly Chat Assistant";
  if (key === "dyslexia") return "Dyslexia-Friendly Chat Assistant";
  return "Accessible Chat Assistant";
};

const getCurrentDisability = () =>
  (localStorage.getItem("disability") || "dyslexia").toLowerCase();

/* ---------- AI helpers ---------- */
const hasPuter = () =>
  typeof window !== "undefined" &&
  window.puter &&
  puter.ai &&
  typeof puter.ai.chat === "function";

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

const mockAI = (prompt) => {
  const lastUser = (prompt.split("\n").pop() || "").replace(/^User:\s*/i, "");
  return `Echo: ${lastUser}`;
};

/* ---------- Component ---------- */
export default function VoiceInterface({
  t,
  language,
  voices,
  selectedVoice,
  setSelectedVoice,
  speed,
  setSpeed,
  pitch,
  setPitch,
  setLanguage,
  speak,
  highContrast,
  fontSize,
  reducedMotion,
  onSwitchMode,
}) {
  const disability = getCurrentDisability();
  const assistantTitle = getAssistantTitleByDisability(disability);

  /* ---------- State ---------- */
  const [listening, setListening] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [summary, setSummary] = useState("");
  const [aiOk, setAiOk] = useState(true);

  const recognitionRef = useRef(null);
  const controls = useAnimation();
  const logEndRef = useRef(null);

  /* ---------- Speech Recognition ---------- */
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new Recognition();
    recog.lang = language || "en-US";
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      addMessage("user", transcript);
      handleAIResponse(transcript);
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);
    recognitionRef.current = recog;
  }, [language]);

  const startListening = () => {
    recognitionRef.current?.start();
    setListening(true);
  };
  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  /* ---------- Conversation ---------- */
  const addMessage = (sender, text) => {
    setConversation((prev) => [...prev, { sender, text, id: Date.now() }]);
  };

  const handleAIResponse = async (userText) => {
    try {
      const prompt = [
        `Disability mode: ${disability}`,
        "Conversation so far:",
        ...conversation.map((m) => `${m.sender}: ${m.text}`),
        `User: ${userText}`,
        "Assistant:",
      ].join("\n");

      const reply = hasPuter() ? await aiChat(prompt) : mockAI(prompt);
      addMessage("gpt", reply);
      speak(reply);
      setAiOk(true);
    } catch (e) {
      addMessage("gpt", "⚠️ Unable to fetch AI response.");
      setAiOk(false);
    }
  };

  /* ---------- Summaries ---------- */
  const summarize = () => {
    const text = conversation.map((m) => `${m.sender}: ${m.text}`).join("\n");
    setSummary(text || "No conversation yet.");
  };

  const replay = () => {
    conversation.forEach((m) => {
      if (m.sender === "gpt") speak(m.text);
    });
  };

  /* ---------- Auto scroll ---------- */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  /* ---------- Animations ---------- */
  useEffect(() => {
    controls.start({
      scale: listening ? [1, 1.15, 1] : 1,
      transition: { repeat: listening ? Infinity : 0, duration: 1.2 },
    });
  }, [listening]);

  /* ---------- Render ---------- */
  return (
    <motion.div
      className={`voice-area ${highContrast ? "high-contrast" : ""} ${
        fontSize > 1.1 ? "large-text" : ""
      }`}
      style={{ fontSize: `${fontSize}rem` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* AI status banner */}
      {!aiOk && (
        <div className="ai-status-banner">⚠️ AI connection unavailable</div>
      )}

      {/* Dynamic disability-based title */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "10px 14px",
          textAlign: "center",
          color: "#fff",
          background:
            "linear-gradient(135deg, rgba(142,45,226,.35), rgba(74,0,224,.35))",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <strong>{assistantTitle}</strong>
      </div>

      {/* Conversation log */}
      <div className="voice-log">
        <AnimatePresence>
          {conversation.map((m) => (
            <motion.div
              key={m.id}
              className={`voice-msg ${m.sender}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.25 }}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logEndRef} />
      </div>

      {/* Controls */}
      <div className="voice-controls">
        {!listening ? (
          <motion.button
            className="listen-btn"
            animate={controls}
            onClick={startListening}
          >
            🎤 Start Talking
          </motion.button>
        ) : (
          <button className="listen-btn stop" onClick={stopListening}>
            ⏹ Stop
          </button>
        )}
        <button className="secondary-btn" onClick={summarize}>
          📋 Summarize
        </button>
        <button className="secondary-btn" onClick={replay}>
          🔊 Replay
        </button>
        <button className="secondary-btn" onClick={onSwitchMode}>
          ⌨️ Text Mode
        </button>
      </div>

      {/* Summary display */}
      {summary && (
        <div className="summary-box">
          <strong>Summary:</strong> {summary}
        </div>
      )}
    </motion.div>
  );
}
