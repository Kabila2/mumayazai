// src/App.js - Enhanced with Mode Switcher
import React, { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import "./App.css";

export default function App() {
  // --- Core state management ---
  const [mode, setMode] = useState("text"); // "text" | "voice"
  const [view, setView] = useState("chat");  // "chat" | "profile" | "settings"

  // --- TTS state for VoiceSettings ---
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");

  // --- Accessibility state ---
  const [fontSize, setFontSize] = useState(1.1);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Initialize preferences & default disability
  useEffect(() => {
    if (!localStorage.getItem("disability")) localStorage.setItem("disability", "dyslexia");
    const hc = localStorage.getItem("high-contrast");
    const fs = localStorage.getItem("font-size");
    const rm = localStorage.getItem("reduced-motion");
    if (hc === "true") setHighContrast(true);
    if (fs) setFontSize(parseFloat(fs));
    if (rm === "true") setReducedMotion(true);
    if (window.matchMedia('(prefers-contrast: high)').matches) setHighContrast(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setReducedMotion(true);
  }, []);

  // Load voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    const load = () => {
      const all = synth.getVoices();
      const en = all.filter(v => v.lang.startsWith("en"));
      setVoices(en);
      if (!selectedVoice && en.length) setSelectedVoice(en[0].name);
    };
    load();
    synth.onvoiceschanged = load;
    return () => (synth.onvoiceschanged = null);
  }, [selectedVoice]);

  // TTS speak
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const vObj = voices.find(v => v.name === selectedVoice);
    if (vObj) {
      u.voice = vObj;
      u.lang = vObj.lang;
    } else u.lang = language;
    u.rate = speed;
    u.pitch = pitch;
    window.speechSynthesis.speak(u);
  };

  // Accessibility toggles
  const toggleHighContrast = () => { const v = !highContrast; setHighContrast(v); localStorage.setItem("high-contrast", v); };
  const adjustFontSize = (d) => { const n = Math.max(0.8, Math.min(2.0, fontSize + d)); setFontSize(n); localStorage.setItem("font-size", n); };
  const toggleReducedMotion = () => { const v = !reducedMotion; setReducedMotion(v); localStorage.setItem("reduced-motion", v); };

  // Render content
  let content;
  if (view === "chat") {
    content = mode === "text"
      ? <ChatInterface
          fontSize={fontSize}
          highContrast={highContrast}
          reducedMotion={reducedMotion}
          onSwitchMode={() => setMode("voice")}
        />
      : <VoiceInterface
          voices={voices}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          speed={speed}
          setSpeed={setSpeed}
          pitch={pitch}
          setPitch={setPitch}
          language={language}
          setLanguage={setLanguage}
          speak={speak}
          highContrast={highContrast}
          fontSize={fontSize}
          reducedMotion={reducedMotion}
          onSwitchMode={() => setMode("text")}
        />;
  } else if (view === "profile") {
    content = (<div className="placeholder">
      <h2>👤 User Profile</h2>
      <p>Manage your preferences and accessibility settings.</p>
      <button onClick={() => setView("chat")}>Back to Chat</button>
    </div>);
  } else {
    content = (<VoiceSettings
      voices={voices}
      selectedVoice={selectedVoice}
      setSelectedVoice={setSelectedVoice}
      speed={speed}
      setSpeed={setSpeed}
      pitch={pitch}
      setPitch={setPitch}
      language={language}
      setLanguage={setLanguage}
      speak={speak}
      onClose={() => setView("chat")}
    />);
  }

  return (
    <div
      className={`app-container ${highContrast ? 'high-contrast' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
      style={{ fontSize: `${fontSize}rem` }}
    >
      {content}
    </div>
  );
}
