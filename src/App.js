// src/App.js — Sign-in flow, app-wide preferences, and the platform shell
import React, { useState, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import EntryLoginPage from "./components/EntryLoginPage";
import OnboardingSetup from "./components/OnboardingSetup";
import ArabicLearningPlatform from "./components/ArabicLearningPlatform";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import ErrorBoundary from "./components/ErrorBoundary";
import { translations } from "./translations";
import {
  initializeParentAccount,
  linkChildToParent
} from "./utils/parentTrackingUtils";
import { initializeTeacherAccount } from "./utils/teacherUtils";
import {
  initHighContrast,
  applyHighContrast,
  HIGH_CONTRAST_EVENT
} from "./utils/highContrast";
import { applyRewards, REWARDS_CHANGED_EVENT } from "./utils/rewardsStore";
import { POINTS_CHANGED_EVENT } from "./utils/leaderboardUtils";
import {
  applyComfort,
  getComfort,
  shouldReduceMotion,
  COMFORT_CHANGED_EVENT
} from "./utils/comfortSettings";
import "./App.css";
import "./dark-mode-global.css";

/* ---------- LocalStorage keys ---------- */
const USERS_KEY = "stellar_users";
const SESSION_KEY = "stellar_session";
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
  // Reduced motion is true if EITHER the learner switched it on in the Comfort
  // panel or the operating system asks for it.
  const [reducedMotion, setReducedMotion] = useState(() => shouldReduceMotion());

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

    // Load accessibility preferences. High contrast is applied to <html> so it
    // also covers the page background and the full-screen chat/voice screens.
    setHighContrast(initHighContrast());
    const fs = localStorage.getItem("font-size");
    if (fs) setFontSize(parseFloat(fs));

    // Comfort settings (sounds, read-aloud, motion, tint, focus) live on <html>
    // too — see utils/comfortSettings.js.
    applyComfort(getComfort());

    // Load appearance preferences
    const savedFont = localStorage.getItem('stellar_font');
    const savedTextSize = localStorage.getItem('stellar_text_size');
    if (savedFont) document.documentElement.style.setProperty('--font-sans', savedFont);
    if (savedTextSize) document.documentElement.style.fontSize = savedTextSize + '%';

    // Load voice settings
    const savedSpeed = localStorage.getItem("voice-speed");
    const savedPitch = localStorage.getItem("voice-pitch");
    const savedVoice = localStorage.getItem("voice-selected");
    if (savedSpeed) setSpeed(parseFloat(savedSpeed));
    if (savedPitch) setPitch(parseFloat(savedPitch));
    if (savedVoice) setSelectedVoice(savedVoice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep React state in step with the toggle, wherever it is rendered.
  useEffect(() => {
    const sync = (event) => setHighContrast(!!event.detail?.enabled);
    window.addEventListener(HIGH_CONTRAST_EVENT, sync);
    return () => window.removeEventListener(HIGH_CONTRAST_EVENT, sync);
  }, []);

  // The class on <html> is what styles the app; mirroring it here keeps the
  // two from drifting if state is ever set some other way.
  useEffect(() => {
    applyHighContrast(highContrast);
  }, [highContrast]);

  // Reduced motion: follow the Comfort panel and the OS preference.
  useEffect(() => {
    const sync = () => setReducedMotion(shouldReduceMotion());
    window.addEventListener(COMFORT_CHANGED_EVENT, sync);

    const media = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    if (media && typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
    }

    return () => {
      window.removeEventListener(COMFORT_CHANGED_EVENT, sync);
      if (media && typeof media.removeEventListener === "function") {
        media.removeEventListener("change", sync);
      }
    };
  }, []);

  // Apply the signed-in learner's unlocked rewards (accent colour, background
  // effect, avatar frame) to <html>. Done here rather than in the platform
  // because the rewards are also meant to be visible on the full-screen chat
  // and voice screens, which the platform does not wrap. Re-runs on sign-in and
  // sign-out so one account's theme never leaks into the next session.
  useEffect(() => {
    applyRewards(getSession()?.email || null);
  }, [isLoggedIn]);

  // And again whenever a reward is switched on from the rewards screen, or
  // points land that unlock one.
  useEffect(() => {
    const sync = () => applyRewards(getSession()?.email || null);
    window.addEventListener(REWARDS_CHANGED_EVENT, sync);
    window.addEventListener(POINTS_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener(REWARDS_CHANGED_EVENT, sync);
      window.removeEventListener(POINTS_CHANGED_EVENT, sync);
    };
  }, []);

  // Load voices for the voice-chat screen's settings.
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return undefined;

    const load = () => {
      const all = synth.getVoices();
      const en = all.filter(v => v.lang.startsWith("en"));
      setVoices(en);
      if (!selectedVoice && en.length) setSelectedVoice(en[0].name);
    };
    load();

    // addEventListener rather than `onvoiceschanged =`: other hooks listen for
    // the same event, and assigning the property would clobber them.
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", load);
      return () => synth.removeEventListener("voiceschanged", load);
    }
    return undefined;
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
  const handleSignUp = async ({ name, email, password, role, parentEmail }) => {
    const users = loadUsers();
    const key = email.trim().toLowerCase();
    if (users[key]) return { ok: false, message: "This email is already registered." };

    users[key] = { name, email: key, password, role, parentEmail, createdAt: new Date().toISOString() };
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

    localStorage.removeItem('stellar_onboarding_completed');
    setPendingEmail(key);
    localStorage.setItem("stellar_role", role || "student");
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
      localStorage.setItem("stellar_role", user.role || "student");
      setShowSetup(true);
      setIsLoggedIn(false);
      return { ok: true };
    }
    openSession(key);
    setIsLoggedIn(true);
    localStorage.setItem("stellar_role", user.role || "student");

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
  };

  /* ===================== RENDER FLOW ===================== */
  if (!isLoggedIn && !showSetup) {
    return (
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
        <EntryLoginPage
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
        />
      </MotionConfig>
    );
  }

  if (showSetup) {
    return (
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
        <OnboardingSetup
          defaultLanguage={localStorage.getItem(LANGUAGE_KEY) || "en"}
          onComplete={handleCompleteSetup}
          onCancel={() => { setShowSetup(false); setPendingEmail(null); }}
        />
      </MotionConfig>
    );
  }

  // All users (students, teachers, parents) go through ArabicLearningPlatform.
  // Teachers get a "Teacher Dashboard" nav item; parents get a "Parent Dashboard" nav item.
  return (
    <ErrorBoundary language={appLanguage}>
      {/* MotionConfig makes every framer-motion animation in the tree honour
          the reduced-motion setting — both the OS preference ("user") and the
          in-app Comfort switch ("always") — without each component checking. */}
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
        {/* High contrast and reduced motion are not in this className: their
            classes go on <html> (see utils/highContrast.js and
            utils/comfortSettings.js) so they also cover the page background,
            portalled popups and the full-screen chat/voice screens. */}
        <div
          className={`app-container ${currentPreference === "dyslexia" ? "dyslexia-friendly" : ""}`}
          style={{ fontSize: `${fontSize}rem` }}
        >
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
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
}
