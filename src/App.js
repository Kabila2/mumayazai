// src/App.js - Enhanced with Universal Accessibility
import React, { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import EntryLoginPage from "./components/EntryLoginPage";
import OnboardingSetup from "./components/OnboardingSetup";
import PaperAirplaneTransition from "./components/PaperAirplaneTransition";
import ParentDashboard from "./components/ParentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import ArabicLearningPlatform from "./components/ArabicLearningPlatform";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import ErrorBoundary from "./components/ErrorBoundary";
import { translations } from "./translations";
import {
  initializeParentAccount,
  linkChildToParent,
  isChildLinkedToParent,
  startChildSession,
  endChildSession
} from "./utils/parentTrackingUtils";
import {
  initializeTeacherAccount
} from "./utils/teacherUtils";
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

// Universal assistant title - now uses translations
function getAssistantTitle(t) {
  return t.chatAssistant || "Chat Assistant";
}

// Get current preference with fallback
function getCurrentPreference() {
  return localStorage.getItem(DISABILITY_KEY) || "default";
}

// Save preference
function savePreference(preference) {
  localStorage.setItem(DISABILITY_KEY, preference);
}

export default function App() {
  // ---------- Toast notifications ----------
  const { toasts, removeToast } = useToast();

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

  // ---------- Transition state ----------
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  // ---------- User preference state ----------
  const [currentPreference, setCurrentPreference] = useState(getCurrentPreference());

  // ---------- TTS & accessibility ----------
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");
  const [fontSize, setFontSize] = useState(1.1);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // ---------- Assistant title (universal) ----------
  const [assistantTitle, setAssistantTitle] = useState(getAssistantTitle(t));

  // Reflect UI dir/lang on <html>
  useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = appLanguage === "ar" ? "rtl" : "ltr";
    setAssistantTitle(getAssistantTitle(t));
  }, [appLanguage, t]);

  // Initialize defaults and sync preference
  useEffect(() => {
    const preference = getCurrentPreference();
    setCurrentPreference(preference);
    setAssistantTitle(getAssistantTitle(t));

    // Load accessibility preferences
    const hc = localStorage.getItem("high-contrast");
    const fs = localStorage.getItem("font-size");
    const rm = localStorage.getItem("reduced-motion");
    if (hc === "true") setHighContrast(true);
    if (fs) setFontSize(parseFloat(fs));
    if (rm === "true") setReducedMotion(true);

    // Load voice settings
    const savedSpeed = localStorage.getItem("voice-speed");
    const savedPitch = localStorage.getItem("voice-pitch");
    const savedVoice = localStorage.getItem("voice-selected");
    if (savedSpeed) setSpeed(parseFloat(savedSpeed));
    if (savedPitch) setPitch(parseFloat(savedPitch));
    if (savedVoice) setSelectedVoice(savedVoice);
  }, []);

  // Watch for preference changes and update title
  useEffect(() => {
    setAssistantTitle(getAssistantTitle(t));
  }, [currentPreference, t]);

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

  /* ===================== MODE SWITCHING WITH TRANSITION ===================== */
  const handleModeSwitch = (newMode) => {
    if (isTransitioning || newMode === mode) return;
    
    console.log(`Transitioning from ${mode} to ${newMode} mode`);
    setPendingMode(newMode);
    setIsTransitioning(true);
  };

  const handleTransitionComplete = () => {
    console.log(`Transition completed to ${pendingMode} mode`);
    setMode(pendingMode);
    setPendingMode(null);
    setIsTransitioning(false);
  };

  /* ===================== AUTH HANDLERS ===================== */
  const handleSignUp = async ({ name, email, password, role, parentEmail }) => {
    const users = loadUsers();
    const key = email.trim().toLowerCase();
    if (users[key]) return { ok: false, message: "This email is already registered." };

    users[key] = { name, email: key, password, role, parentEmail };
    saveUsers(users);

    // If this is a parent account, initialize parent data
    if (role === "parent") {
      const result = initializeParentAccount(key, name);
      if (!result.success) {
        return { ok: false, message: "Failed to initialize parent account." };
      }
    }

    // If this is a teacher account, initialize teacher data
    if (role === "teacher") {
      const result = initializeTeacherAccount(key, name);
      if (!result.success) {
        return { ok: false, message: "Failed to initialize teacher account." };
      }
    }

    // If this is a child and has parent email, try to link
    if (role === "student" && parentEmail) {
      const result = linkChildToParent(key, name, parentEmail.trim().toLowerCase());
      if (!result.success) {
        console.warn("Failed to link child to parent:", result.error);
        // Don't fail registration, just log the issue
      }
    }

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
    const hasPreference = !!localStorage.getItem(DISABILITY_KEY);
    const hasLanguage   = !!localStorage.getItem(LANGUAGE_KEY);
    if (!hasPreference || !hasLanguage) {
      setPendingEmail(key);
      localStorage.setItem("mumayaz_role", user.role || "student");
      setShowSetup(true);
      setIsLoggedIn(false);
      return { ok: true };
    }
    openSession(key);
    setIsLoggedIn(true);
    localStorage.setItem("mumayaz_role", user.role || "student");
    
    // Sync preference on login
    const preference = getCurrentPreference();
    setCurrentPreference(preference);
    setAssistantTitle(getAssistantTitle(t));

    return { ok: true };
  };

  const handleCompleteSetup = ({ disability, lang }) => {
    // Save preference
    savePreference(disability);
    localStorage.setItem(LANGUAGE_KEY, lang);
    setAppLanguage(lang);

    // Update current preference state
    setCurrentPreference(disability);
    setAssistantTitle(getAssistantTitle(t));

    // Ensure proper direction is set immediately
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

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
    // Reset transition state on sign out
    setIsTransitioning(false);
    setPendingMode(null);
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
        defaultLanguage={localStorage.getItem(LANGUAGE_KEY) || "en"}
        onComplete={handleCompleteSetup}
        onCancel={() => { setShowSetup(false); setPendingEmail(null); }}
      />
    );
  }

  // All users (students, teachers, parents) get the same learning platform
  // Teachers and parents get EXTRA features (communication) built into the platform
  const userRole = localStorage.getItem("mumayaz_role");

  let content;
  if (view === "chat") {
    content = (
      <ArabicLearningPlatform
        t={t}
        language={appLanguage}
        fontSize={fontSize}
        highContrast={highContrast}
        reducedMotion={reducedMotion}
        assistantTitle={assistantTitle}
        currentPreference={currentPreference}
        onSignOut={handleSignOut}
        voices={voices}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        speed={speed}
        setSpeed={setSpeed}
        pitch={pitch}
        setPitch={setPitch}
        setLanguage={setLanguage}
        speak={speak}
      />
    );
  } else if (view === "profile") {
    content = (
      <div className="placeholder" style={{ position: "relative" }}>
        <button
          onClick={handleSignOut}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "linear-gradient(135deg, #ff4757, #ff3838)",
            border: "none",
            color: "#ffffff",
            padding: "0.6rem 1.2rem",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
            zIndex: 10,
            boxShadow: "0 4px 15px rgba(255, 71, 87, 0.3)"
          }}
        >
          Sign Out
        </button>
        
        <h2>Profile</h2>
        <p>Current preference: <strong>{currentPreference.toUpperCase()}</strong></p>
        <p>Manage your preferences and accessibility settings.</p>
        <button onClick={() => setView("chat")}>{t.back}</button>
      </div>
    );
  } else {
    content = (
      <div style={{ position: "relative" }}>
        <button
          onClick={handleSignOut}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "linear-gradient(135deg, #ff4757, #ff3838)",
            border: "none",
            color: "#ffffff",
            padding: "0.6rem 1.2rem",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
            zIndex: 10,
            boxShadow: "0 4px 15px rgba(255, 71, 87, 0.3)"
          }}
        >
          Sign Out
        </button>
        
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
    <ErrorBoundary language={appLanguage}>
      <div
        className={`app-container ${highContrast ? "high-contrast" : ""} ${reducedMotion ? "reduced-motion" : ""} ${currentPreference === "dyslexia" ? "dyslexia-friendly" : ""}`}
        style={{ fontSize: `${fontSize}rem` }}
      >
        {content}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </ErrorBoundary>
  );
}