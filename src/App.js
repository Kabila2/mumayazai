// src/App.js
import React, { useState, useEffect } from "react";
import EntryLoginPage from "./components/EntryLoginPage";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import BottomDock from "./components/BottomDock";
import "./App.css";

export default function App() {
  // --- authentication state ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- mode & view state ---
  const [mode, setMode] = useState("text");             // "text" | "voice"
  const [view, setView] = useState("chat");             // "chat" | "profile" | "settings"

  // --- TTS settings ---
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");

  // Load system voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const all = synth.getVoices();
      const en = all.filter((v) => v.lang.startsWith("en"));
      setVoices(en);
      if (!selectedVoice && en.length) setSelectedVoice(en[0].name);
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => { synth.onvoiceschanged = null; };
  }, [selectedVoice]);

  // Voice synthesis function
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    const vObj = voices.find((v) => v.name === selectedVoice);
    if (vObj) {
      utter.voice = vObj;
      utter.lang = vObj.lang;
    } else {
      utter.lang = language;
    }
    utter.rate = speed;
    utter.pitch = pitch;
    window.speechSynthesis.speak(utter);
  };

  // --- main content renderer ---
  let content;
  if (!isLoggedIn) {
    content = <EntryLoginPage onLogin={() => setIsLoggedIn(true)} />;
  } else if (view === "chat") {
    content = mode === "text" ? <ChatInterface /> : <VoiceInterface />;
  } else if (view === "profile") {
    content = <div className="placeholder">Profile Page</div>;
  } else {
    content = (
      <VoiceSettings
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
      />
    );
  }

  return (
    <div className="app-container">
      {isLoggedIn && (
        <div className="mode-switcher">
          <button
            className={mode === "text" ? "active" : ""}
            onClick={() => {
              setMode("text");
              setView("chat");
            }}
          >
            Text Chat
          </button>
          <button
            className={mode === "voice" ? "active" : ""}
            onClick={() => {
              setMode("voice");
              setView("chat");
            }}
          >
            Voice Chat
          </button>
        </div>
      )}

      <div className="main-content">{content}</div>

      {isLoggedIn && <BottomDock onSelect={setView} />}
    </div>
  );
}
