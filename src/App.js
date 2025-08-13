// src/App.js
import React, { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import EntryLoginPage from "./components/EntryLoginPage";
import "./App.css";

const USERS_KEY = "mumayaz_users";
const SESSION_KEY = "mumayaz_session";

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}
function saveUsers(map) {
  localStorage.setItem(USERS_KEY, JSON.stringify(map));
}
function openSession(email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
}
function closeSession() {
  localStorage.removeItem(SESSION_KEY);
}
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export default function App() {
  // --- App state ---
  const [isLoggedIn, setIsLoggedIn] = useState(!!getSession());
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

  // Initialize preferences
  useEffect(() => {
    if (!localStorage.getItem("disability")) localStorage.setItem("disability", "dyslexia");
    const hc = localStorage.getItem("high-contrast");
    const fs = localStorage.getItem("font-size");
    const rm = localStorage.getItem("reduced-motion");
    if (hc === "true") setHighContrast(true);
    if (fs) setFontSize(parseFloat(fs));
    if (rm === "true") setReducedMotion(true);
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

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const vObj = voices.find(v => v.name === selectedVoice);
    if (vObj) { u.voice = vObj; u.lang = vObj.lang; } else { u.lang = language; }
    u.rate = speed; u.pitch = pitch;
    window.speechSynthesis.speak(u);
  };

  // ---------- Auth handlers passed to EntryLoginPage ----------
  const handleSignUp = async ({ name, email, password, role }) => {
    const users = loadUsers();
    const key = email.trim().toLowerCase();
    if (users[key]) {
      return { ok: false, message: "This email is already registered." };
    }
    // NOTE: Storing plain text password in localStorage is NOT secure.
    users[key] = { name, email: key, password, role };
    saveUsers(users);
    openSession(key);
    setIsLoggedIn(true);
    localStorage.setItem("mumayaz_role", role || "student");
    return { ok: true };
  };

  const handleSignIn = async ({ email, password }) => {
    const users = loadUsers();
    const key = (email || "").trim().toLowerCase();
    const user = users[key];
    if (!user || user.password !== password) {
      return { ok: false, message: "Invalid email or password." };
    }
    openSession(key);
    setIsLoggedIn(true);
    localStorage.setItem("mumayaz_role", user.role || "student");
    return { ok: true };
  };

  const handleSignOut = () => {
    closeSession();
    setIsLoggedIn(false);
    setMode("text");
    setView("chat");
  };

  // If not logged in, show entry login page
  if (!isLoggedIn) {
    return (
      <EntryLoginPage
        onSignUp={handleSignUp}
        onSignIn={handleSignIn}
      />
    );
  }

  // Sign out button
  const signOutButton = (
    <button
      style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.24)",
        color: "#fff",
        padding: "0.5rem 1rem",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "0.9rem",
        zIndex: 100,
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)"
      }}
      onClick={handleSignOut}
    >
      🔒 Sign Out
    </button>
  );

  // Main content after login
  let content;
  if (view === "chat") {
    content = (
      <div style={{ position: "relative", height: "100%" }}>
        {signOutButton}
        {mode === "text" ? (
          <ChatInterface
            fontSize={fontSize}
            highContrast={highContrast}
            reducedMotion={reducedMotion}
            onSwitchMode={() => setMode("voice")}
          />
        ) : (
          <VoiceInterface
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
          />
        )}
      </div>
    );
  } else if (view === "profile") {
    content = (
      <div className="placeholder" style={{ position: "relative" }}>
        {signOutButton}
        <h2>👤 User Profile</h2>
        <p>Manage your preferences and accessibility settings.</p>
        <button onClick={() => setView("chat")}>Back to Chat</button>
      </div>
    );
  } else {
    content = (
      <div style={{ position: "relative" }}>
        {signOutButton}
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
          onClose={() => setView("chat")}
        />
      </div>
    );
  }

  return (
    <div
      className={`app-container ${highContrast ? "high-contrast" : ""} ${reducedMotion ? "reduced-motion" : ""}`}
      style={{ fontSize: `${fontSize}rem` }}
    >
      {content}
    </div>
  );
}
