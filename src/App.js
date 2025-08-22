// src/App.js
import React, { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import EntryLoginPage from "./components/EntryLoginPage";
import OnboardingSetup from "./components/OnboardingSetup";
import { translations } from "./translations";
import "./App.css";

/* ---------- LocalStorage keys ---------- */
const USERS_KEY = "mumayaz_users";
const SESSION_KEY = "mumayaz_session";
const DISABILITY_KEY = "disability";
const LANGUAGE_KEY = "app-language";

/* ---------- Simple local auth utils (prototype only) ---------- */
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}
function saveUsers(map) { localStorage.setItem(USERS_KEY, JSON.stringify(map)); }
function openSession(email) { localStorage.setItem(SESSION_KEY, JSON.stringify({ email })); }
function closeSession() { localStorage.removeItem(SESSION_KEY); }
function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }

export default function App() {
  // ---------- Auth & flow ----------
  const [isLoggedIn, setIsLoggedIn] = useState(!!getSession());
  const [showSetup, setShowSetup]   = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);

  // ---------- Language / translations ----------
  const [appLanguage, setAppLanguage] = useState(
    localStorage.getItem(LANGUAGE_KEY) || "en"
  );
  const t = translations[appLanguage] || translations.en;

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

  // Reflect UI dir/lang on <html>
  useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = appLanguage === "ar" ? "rtl" : "ltr";
  }, [appLanguage]);

  // Initialize defaults
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
  const handleSignUp = async ({ name, email, password, role }) => {
    const users = loadUsers();
    const key = email.trim().toLowerCase();
    if (users[key]) return { ok: false, message: "This email is already registered." };

    users[key] = { name, email: key, password, role };
    saveUsers(users);

    setPendingEmail(key);
    localStorage.setItem("mumayaz_role", role || "student");
    setShowSetup(true);
    setIsLoggedIn(false);
    return { ok: true };
  };

  const handleSignIn = async ({ email, password }) => {
    const users = loadUsers();
    const key = (email || "").trim().toLowerCase();
    const user = users[key];
    if (!user || user.password !== password) {
      return { ok: false, message: "Invalid email or password." };
    }
    const hasDisability = !!localStorage.getItem(DISABILITY_KEY);
    const hasLanguage   = !!localStorage.getItem(LANGUAGE_KEY);
    if (!hasDisability || !hasLanguage) {
      setPendingEmail(key);
      localStorage.setItem("mumayaz_role", user.role || "student");
      setShowSetup(true);
      setIsLoggedIn(false);
      return { ok: true };
    }
    openSession(key);
    setIsLoggedIn(true);
    localStorage.setItem("mumayaz_role", user.role || "student");
    return { ok: true };
  };

  const handleCompleteSetup = ({ disability, lang }) => {
    localStorage.setItem(DISABILITY_KEY, disability);
    localStorage.setItem(LANGUAGE_KEY, lang);
    setAppLanguage(lang);

    if (pendingEmail) openSession(pendingEmail);

    setShowSetup(false);
    setPendingEmail(null);
    setIsLoggedIn(true);
  };

  // Keep sign-out logic for later use; not rendered anywhere now
  const handleSignOut = () => {
    closeSession();
    setIsLoggedIn(false);
    setMode("text");
    setView("chat");
  };

  /* ===================== RENDER FLOW ===================== */
  if (!isLoggedIn && !showSetup) {
    return (
      <EntryLoginPage
        onSignUp={handleSignUp}
        onSignIn={handleSignIn}
      />
    );
  }

  if (showSetup) {
    return (
      <OnboardingSetup
        defaultDisability={localStorage.getItem(DISABILITY_KEY) || "dyslexia"}
        defaultLanguage={localStorage.getItem(LANGUAGE_KEY) || "en"}
        onComplete={handleCompleteSetup}
        onCancel={() => { setShowSetup(false); setPendingEmail(null); }}
      />
    );
  }

  let content;
  if (view === "chat") {
    content = (
      <div style={{ position: "relative", height: "100%" }}>
        {mode === "text" ? (
          <ChatInterface
            t={t}
            language={appLanguage}
            fontSize={fontSize}
            highContrast={highContrast}
            reducedMotion={reducedMotion}
            onSwitchMode={() => setMode("voice")}
          />
        ) : (
          <VoiceInterface
            t={t}
            language={appLanguage}
            voices={voices}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            speed={speed}
            setSpeed={setSpeed}
            pitch={pitch}
            setPitch={setPitch}
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
        <h2>👤 Profile</h2>
        <p>Manage your preferences and accessibility settings.</p>
        <button onClick={() => setView("chat")}>{t.back}</button>
      </div>
    );
  } else {
    content = (
      <div style={{ position: "relative" }}>
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
