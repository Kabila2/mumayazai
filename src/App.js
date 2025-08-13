// src/App.js
import React, { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import EntryLoginPage from "./components/EntryLoginPage"; // ✅ Import the entry page
import "./App.css";

export default function App() {
  // --- App state ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState("text"); // "text" | "voice"
  const [view, setView] = useState("chat"); // "chat" | "profile" | "settings"

  // --- TTS & accessibility ---
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");
  const [fontSize, setFontSize] = useState(1.1);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Initialize accessibility preferences
  useEffect(() => {
    if (!localStorage.getItem("disability")) localStorage.setItem("disability", "dyslexia");
    const hc = localStorage.getItem("high-contrast");
    const fs = localStorage.getItem("font-size");
    const rm = localStorage.getItem("reduced-motion");
    if (hc === "true") setHighContrast(true);
    if (fs) setFontSize(parseFloat(fs));
    if (rm === "true") setReducedMotion(true);
  }, []);

  // Load available voices
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

  // Speak helper
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

  // If not logged in, show entry login page
  if (!isLoggedIn) {
    return (
      <EntryLoginPage
        onSignIn={() => setIsLoggedIn(true)}
        onSignUp={() => setIsLoggedIn(true)}
      />
    );
  }

  // Main content after login
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
