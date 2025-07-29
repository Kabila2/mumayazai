// src/App.js
import React, { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import BottomDock from "./components/BottomDock";
import EntryLoginPage from "./components/EntryLoginPage"; // Add this import
import "./App.css";

export default function App() {
  // --- login state ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // --- mode & view state ---
  const [mode, setMode] = useState("voice"); // Default to voice mode
  const [view, setView] = useState("chat"); // "chat" | "profile" | "settings"

  // --- TTS state for VoiceSettings ---
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");

  // Load voices once
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
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Handle TTS
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

  // Check for stored login on app start
  useEffect(() => {
    const storedLogin = localStorage.getItem("isLoggedIn");
    const storedRole = localStorage.getItem("mumayaz_role");
    if (storedLogin === "true") {
      setIsLoggedIn(true);
      setUserRole(storedRole);
    }
  }, []);

  // Handle sign in
  const handleSignIn = (userData) => {
    setIsLoggedIn(true);
    setUserRole(userData.role);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("mumayaz_role", userData.role);
    
    // Set default mode based on role if needed
    if (userData.role === "parent") {
      setView("profile"); // or whatever view you want for parents
    } else {
      setMode("voice"); // Default to voice chat for students
      setView("chat");
    }
  };

  // Handle sign up
  const handleSignUp = (userData) => {
    setIsLoggedIn(true);
    setUserRole(userData.role);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("mumayaz_role", userData.role);
    
    // Set default mode based on role if needed
    if (userData.role === "parent") {
      setView("profile"); // or whatever view you want for parents
    } else {
      setMode("voice"); // Default to voice chat for students
      setView("chat");
    }
  };

  // Handle logout (you can add this functionality later)
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("mumayaz_role");
  };

  // --- content rendering ---
  let content;
  if (!isLoggedIn) {
    content = (
      <EntryLoginPage 
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    );
  } else if (view === "chat") {
    content = mode === "text" ? <ChatInterface /> : <VoiceInterface />;
  } else if (view === "profile") {
    content = (
      <div className="placeholder">
        <h2>Profile Page</h2>
        <p>Welcome, {userRole}!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
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