// src/App.js
import React, { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import EntryLoginPage from "./components/EntryLoginPage";
import OnboardingSetup from "./components/OnboardingSetup"; // ✅ NEW
import "./App.css";

/* ---------- LocalStorage keys ---------- */
const USERS_KEY = "mumayaz_users";
const SESSION_KEY = "mumayaz_session";
const DISABILITY_KEY = "disability";
const LANGUAGE_KEY = "app-language";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
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
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

export default function App() {
  // ---------- Auth & flow ----------
  const [isLoggedIn, setIsLoggedIn] = useState(!!getSession());
  const [showSetup, setShowSetup]   = useState(false);  // ✅ Show onboarding selectors
  const [pendingEmail, setPendingEmail] = useState(null);

  // ---------- Main UI state ----------
  const [mode, setMode] = useState("text");   // "text" | "voice"
  const [view, setView] = useState("chat");   // "chat" | "profile" | "settings"

  // ---------- TTS & accessibility ----------
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");
  const [fontSize, setFontSize] = useState(1.1);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Initialize preferences (safe defaults)
  useEffect(() => {
    if (!localStorage.getItem(DISABILITY_KEY)) localStorage.setItem(DISABILITY_KEY, "dyslexia");
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

  /* ===================== AUTH HANDLERS ===================== */
  // After Sign Up → save user → go to SETUP (don’t open session yet)
  const handleSignUp = async ({ name, email, password, role }) => {
    const users = loadUsers();
    const key = email.trim().toLowerCase();
    if (users[key]) return { ok: false, message: "This email is already registered." };

    // NOTE: plain-text passwords in localStorage are not secure (prototype only)
    users[key] = { name, email: key, password, role };
    saveUsers(users);

    // Defer session until setup is complete
    setPendingEmail(key);
    localStorage.setItem("mumayaz_role", role || "student");
    setShowSetup(true);
    setIsLoggedIn(false);

    return { ok: true };
  };

  // Sign In → if missing prefs, go to SETUP; else open session → main
  const handleSignIn = async ({ email, password }) => {
    const users = loadUsers();
    const key = (email || "").trim().toLowerCase();
    const user = users[key];
    if (!user || user.password !== password) {
      return { ok: false, message: "Invalid email or password." };
    }

    // If user has no disability/language saved, force setup
    const hasDisability = !!localStorage.getItem(DISABILITY_KEY);
    const hasLanguage   = !!localStorage.getItem(LANGUAGE_KEY);
    if (!hasDisability || !hasLanguage) {
      setPendingEmail(key);
      localStorage.setItem("mumayaz_role", user.role || "student");
      setShowSetup(true);
      setIsLoggedIn(false);
      return { ok: true };
    }

    // Otherwise go straight in
    openSession(key);
    setIsLoggedIn(true);
    localStorage.setItem("mumayaz_role", user.role || "student");
    return { ok: true };
  };

  const handleCompleteSetup = ({ disability, lang }) => {
    // Persist selections
    localStorage.setItem(DISABILITY_KEY, disability);
    localStorage.setItem(LANGUAGE_KEY, lang);

    // Start session (for sign-up or sign-in path)
    if (pendingEmail) openSession(pendingEmail);

    setShowSetup(false);
    setPendingEmail(null);
    setIsLoggedIn(true);
  };

  const handleSignOut = () => {
    closeSession();
    setIsLoggedIn(false);
    setMode("text");
    setView("chat");
  };

  /* ===================== RENDER FLOW ===================== */
  // 1) Entry (not logged in) → show EntryLoginPage
  if (!isLoggedIn && !showSetup) {
    return (
      <EntryLoginPage
        onSignUp={handleSignUp}
        onSignIn={handleSignIn}
      />
    );
  }

  // 2) Setup (disability + language)
  if (showSetup) {
    return (
      <OnboardingSetup
        defaultDisability={localStorage.getItem(DISABILITY_KEY) || "dyslexia"}
        defaultLanguage={localStorage.getItem(LANGUAGE_KEY) || "en"}
        onComplete={handleCompleteSetup}
        onCancel={() => { setShowSetup(false); setPendingEmail(null); }} // optional
      />
    );
  }

  // 3) Main app after login
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
