// src/App.js - Enhanced Mobile-Optimized with Auto Screen Adaptation
import React, { useState, useEffect, useCallback, useRef } from "react";
import ChatInterface from "./components/ChatInterface";
import VoiceInterface from "./components/VoiceInterface";
import VoiceSettings from "./blocks/VoiceSettings/VoiceSettings";
import EntryLoginPage from "./components/EntryLoginPage";
import OnboardingSetup from "./components/OnboardingSetup";
import PaperAirplaneTransition from "./components/PaperAirplaneTransition";
import { translations } from "./translations";
import "./App.css";
import "./Mobile.css"; 

/* ---------- LocalStorage keys ---------- */
const USERS_KEY = "mumayaz_users";
const SESSION_KEY = "mumayaz_session";
const DISABILITY_KEY = "disability";
const LANGUAGE_KEY = "app-language";
const ACCESSIBILITY_KEY = "accessibility_prefs";

/* ---------- Screen size detection hook ---------- */
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
    orientation: typeof window !== 'undefined' ? 
      (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape') : 'portrait',
    isSmallScreen: typeof window !== 'undefined' ? window.innerWidth < 480 : false,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
  });

  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setScreenSize({
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      orientation: height > width ? 'portrait' : 'landscape',
      isSmallScreen: width < 480,
      devicePixelRatio: window.devicePixelRatio || 1
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    updateScreenSize();
    
    // Debounced resize handler for better performance
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', () => {
      // Delay to allow browser to update dimensions
      setTimeout(updateScreenSize, 100);
    });

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', updateScreenSize);
      clearTimeout(timeoutId);
    };
  }, [updateScreenSize]);

  return screenSize;
};

/* ---------- Viewport height fix hook for mobile ---------- */
const useViewportHeight = () => {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100);
    });

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
};

/* ---------- Simple local auth utils (prototype only) ---------- */
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}
function saveUsers(map) { localStorage.setItem(USERS_KEY, JSON.stringify(map)); }
function openSession(email) { localStorage.setItem(SESSION_KEY, JSON.stringify({ email })); }
function closeSession() { localStorage.removeItem(SESSION_KEY); }
function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }

/* ---------- Accessibility preferences ---------- */
function loadAccessibilityPrefs() {
  try {
    return JSON.parse(localStorage.getItem(ACCESSIBILITY_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAccessibilityPrefs(prefs) {
  localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(prefs));
}

function getAssistantTitle(disability) {
  switch ((disability || "").toLowerCase()) {
    case "dyslexia": return "Dyslexia-Friendly Chat Assistant";
    case "adhd":     return "ADHD-Friendly Chat Assistant";
    case "autism":   return "Autism-Friendly Chat Assistant";
    default:         return "Accessible Chat Assistant";
  }
}

// Get current disability preference with fallback
function getCurrentDisability() {
  return localStorage.getItem(DISABILITY_KEY) || "dyslexia";
}

// Save disability preference
function saveDisability(disability) {
  localStorage.setItem(DISABILITY_KEY, disability);
}

export default function App() {
  // ---------- Screen adaptation hooks ----------
  const screenSize = useScreenSize();
  useViewportHeight();
  
  // ---------- Auth & flow ----------
  const [isLoggedIn, setIsLoggedIn] = useState(!!getSession());
  const [showSetup, setShowSetup] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);

  // ---------- Language / translations ----------
  const [appLanguage, setAppLanguage] = useState(
    localStorage.getItem(LANGUAGE_KEY) || "en"
  );
  const t = translations[appLanguage] || translations.en;

  // ---------- Main UI state ----------
  const [mode, setMode] = useState("text");
  const [view, setView] = useState("chat");

  // ---------- Transition state ----------
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  // ---------- Disability state ----------
  const [currentDisability, setCurrentDisability] = useState(getCurrentDisability());

  // ---------- Accessibility preferences ----------
  const [accessibilityPrefs, setAccessibilityPrefs] = useState(() => {
    const prefs = loadAccessibilityPrefs();
    return {
      fontSize: prefs.fontSize || (screenSize.isMobile ? 1.0 : 1.1),
      highContrast: prefs.highContrast || false,
      reducedMotion: prefs.reducedMotion || false,
      largeButtons: prefs.largeButtons || screenSize.isMobile,
      autoAdjust: prefs.autoAdjust !== false, // Default to true
      ...prefs
    };
  });

  // ---------- TTS & accessibility ----------
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");

  // ---------- Assistant title (reactive to disability) ----------
  const [assistantTitle, setAssistantTitle] = useState(getAssistantTitle(currentDisability));

  // ---------- Auto-adjust based on screen size ----------
  useEffect(() => {
    if (!accessibilityPrefs.autoAdjust) return;

    const newPrefs = { ...accessibilityPrefs };
    let hasChanges = false;

    // Auto-adjust font size based on screen
    const optimalFontSize = screenSize.isSmallScreen ? 0.9 : 
                           screenSize.isMobile ? 1.0 : 
                           screenSize.isTablet ? 1.1 : 1.2;
    
    if (Math.abs(newPrefs.fontSize - optimalFontSize) > 0.05) {
      newPrefs.fontSize = optimalFontSize;
      hasChanges = true;
    }

    // Auto-enable large buttons on mobile/touch devices
    const shouldUseLargeButtons = screenSize.isMobile || screenSize.isSmallScreen;
    if (newPrefs.largeButtons !== shouldUseLargeButtons) {
      newPrefs.largeButtons = shouldUseLargeButtons;
      hasChanges = true;
    }

    // Auto-enable reduced motion on low-end devices or user preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !newPrefs.reducedMotion) {
      newPrefs.reducedMotion = true;
      hasChanges = true;
    }

    // Auto-adjust for landscape mode on small screens
    if (screenSize.orientation === 'landscape' && screenSize.height < 500) {
      if (newPrefs.fontSize > 0.95) {
        newPrefs.fontSize = 0.95;
        hasChanges = true;
      }
      if (!newPrefs.reducedMotion) {
        newPrefs.reducedMotion = true;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setAccessibilityPrefs(newPrefs);
      saveAccessibilityPrefs(newPrefs);
    }
  }, [screenSize, accessibilityPrefs.autoAdjust]);

  // ---------- Apply accessibility preferences to DOM ----------
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font size
    root.style.setProperty('--user-font-size', `${accessibilityPrefs.fontSize}rem`);
    
    // Apply contrast mode
    root.classList.toggle('high-contrast', accessibilityPrefs.highContrast);
    
    // Apply reduced motion
    root.classList.toggle('reduced-motion', accessibilityPrefs.reducedMotion);
    
    // Apply large buttons
    root.classList.toggle('large-buttons', accessibilityPrefs.largeButtons);
    
    // Apply screen size classes for CSS targeting
    root.classList.toggle('is-mobile', screenSize.isMobile);
    root.classList.toggle('is-tablet', screenSize.isTablet);
    root.classList.toggle('is-desktop', screenSize.isDesktop);
    root.classList.toggle('is-small-screen', screenSize.isSmallScreen);
    root.classList.toggle('is-portrait', screenSize.orientation === 'portrait');
    root.classList.toggle('is-landscape', screenSize.orientation === 'landscape');
    
    // Set custom properties for dynamic sizing
    root.style.setProperty('--screen-width', `${screenSize.width}px`);
    root.style.setProperty('--screen-height', `${screenSize.height}px`);
    root.style.setProperty('--device-pixel-ratio', screenSize.devicePixelRatio);
  }, [accessibilityPrefs, screenSize]);

  // Reflect UI dir/lang on <html>
  useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = appLanguage === "ar" ? "rtl" : "ltr";
  }, [appLanguage]);

  // Initialize defaults and sync disability
  useEffect(() => {
    const disability = getCurrentDisability();
    setCurrentDisability(disability);
    setAssistantTitle(getAssistantTitle(disability));
  }, []);

  // Watch for disability changes and update title
  useEffect(() => {
    setAssistantTitle(getAssistantTitle(currentDisability));
  }, [currentDisability]);

  // Load voices with mobile optimization
  useEffect(() => {
    const synth = window.speechSynthesis;
    const load = () => {
      const all = synth.getVoices();
      // Prioritize local voices on mobile for better performance
      const filtered = screenSize.isMobile ? 
        all.filter(v => v.localService && v.lang.startsWith("en")) :
        all.filter(v => v.lang.startsWith("en"));
      
      setVoices(filtered);
      if (!selectedVoice && filtered.length) {
        // Choose the best voice for the device
        const preferredVoice = filtered.find(v => v.default) || filtered[0];
        setSelectedVoice(preferredVoice.name);
      }
    };
    load();
    synth.onvoiceschanged = load;
    return () => (synth.onvoiceschanged = null);
  }, [selectedVoice, screenSize.isMobile]);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const vObj = voices.find(v => v.name === selectedVoice);
    if (vObj) { u.voice = vObj; u.lang = vObj.lang; } else { u.lang = language; }
    u.rate = speed; u.pitch = pitch;
    
    // Mobile optimization: reduce utterance length for better performance
    if (screenSize.isMobile && text.length > 200) {
      u.text = text.substring(0, 200) + "...";
    }
    
    window.speechSynthesis.speak(u);
  }, [voices, selectedVoice, language, speed, pitch, screenSize.isMobile]);

  /* ===================== MODE SWITCHING WITH TRANSITION ===================== */
  const handleModeSwitch = useCallback((newMode) => {
    if (isTransitioning || newMode === mode) return;
    
    console.log(`🔄 Starting transition from ${mode} to ${newMode} mode`);
    setPendingMode(newMode);
    setIsTransitioning(true);
  }, [isTransitioning, mode]);

  const handleTransitionComplete = useCallback(() => {
    console.log(`✅ Transition completed to ${pendingMode} mode`);
    setMode(pendingMode);
    setPendingMode(null);
    setIsTransitioning(false);
  }, [pendingMode]);

  /* ===================== ACCESSIBILITY HANDLERS ===================== */
  const updateAccessibilityPref = useCallback((key, value) => {
    const newPrefs = { ...accessibilityPrefs, [key]: value };
    setAccessibilityPrefs(newPrefs);
    saveAccessibilityPrefs(newPrefs);
  }, [accessibilityPrefs]);

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
    
    // Sync disability on login
    const disability = getCurrentDisability();
    setCurrentDisability(disability);
    setAssistantTitle(getAssistantTitle(disability));
    
    return { ok: true };
  };

  const handleCompleteSetup = ({ disability, lang }) => {
    // Save disability preference
    saveDisability(disability);
    localStorage.setItem(LANGUAGE_KEY, lang);
    setAppLanguage(lang);

    // Update current disability state
    setCurrentDisability(disability);
    setAssistantTitle(getAssistantTitle(disability));

    if (pendingEmail) openSession(pendingEmail);

    setShowSetup(false);
    setPendingEmail(null);
    setIsLoggedIn(true);
  };

  const handleSignOut = useCallback(() => {
    closeSession();
    setIsLoggedIn(false);
    setMode("text");
    setView("chat");
    // Reset transition state on sign out
    setIsTransitioning(false);
    setPendingMode(null);
    // Optional: Clear some app state but keep accessibility preferences
  }, []);

  // ---------- Dynamic CSS class generation ----------
  const getAppClasses = () => {
    const classes = ['app-container'];
    
    if (accessibilityPrefs.highContrast) classes.push('high-contrast');
    if (accessibilityPrefs.reducedMotion) classes.push('reduced-motion');
    if (accessibilityPrefs.largeButtons) classes.push('large-buttons');
    if (screenSize.isMobile) classes.push('mobile-layout');
    if (screenSize.isTablet) classes.push('tablet-layout');
    if (screenSize.isDesktop) classes.push('desktop-layout');
    if (screenSize.isSmallScreen) classes.push('small-screen');
    if (screenSize.orientation === 'landscape' && screenSize.height < 500) {
      classes.push('cramped-landscape');
    }
    
    return classes.join(' ');
  };

  // ---------- Mobile-optimized style object ----------
  const getAppStyles = () => ({
    fontSize: `${accessibilityPrefs.fontSize}rem`,
    '--dynamic-vh': `${screenSize.height}px`,
    '--dynamic-vw': `${screenSize.width}px`,
    '--safe-area-top': screenSize.isMobile ? 'env(safe-area-inset-top)' : '0px',
    '--safe-area-bottom': screenSize.isMobile ? 'env(safe-area-inset-bottom)' : '0px',
    '--safe-area-left': screenSize.isMobile ? 'env(safe-area-inset-left)' : '0px',
    '--safe-area-right': screenSize.isMobile ? 'env(safe-area-inset-right)' : '0px',
  });

  /* ===================== RENDER FLOW ===================== */
  if (!isLoggedIn && !showSetup) {
    return (
      <EntryLoginPage
        onSignUp={handleSignUp}
        onSignIn={handleSignIn}
        screenSize={screenSize}
        accessibilityPrefs={accessibilityPrefs}
      />
    );
  }

  if (showSetup) {
    return (
      <OnboardingSetup
        defaultDisability={getCurrentDisability()}
        defaultLanguage={localStorage.getItem(LANGUAGE_KEY) || "en"}
        onComplete={handleCompleteSetup}
        onCancel={() => { setShowSetup(false); setPendingEmail(null); }}
        screenSize={screenSize}
        accessibilityPrefs={accessibilityPrefs}
      />
    );
  }

  let content;
  if (view === "chat") {
    content = (
      <PaperAirplaneTransition
        isTransitioning={isTransitioning}
        fromMode={mode}
        toMode={pendingMode}
        onTransitionComplete={handleTransitionComplete}
        screenSize={screenSize}
        reducedMotion={accessibilityPrefs.reducedMotion}
      >
        <div style={{ position: "relative", height: "100%" }}>
          {mode === "text" ? (
            <ChatInterface
              t={t}
              language={appLanguage}
              fontSize={accessibilityPrefs.fontSize}
              highContrast={accessibilityPrefs.highContrast}
              reducedMotion={accessibilityPrefs.reducedMotion}
              assistantTitle={assistantTitle}
              currentDisability={currentDisability}
              screenSize={screenSize}
              onSwitchMode={() => handleModeSwitch("voice")}
              onSignOut={handleSignOut}
              onUpdateAccessibility={updateAccessibilityPref}
              accessibilityPrefs={accessibilityPrefs}
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
              highContrast={accessibilityPrefs.highContrast}
              fontSize={accessibilityPrefs.fontSize}
              reducedMotion={accessibilityPrefs.reducedMotion}
              assistantTitle={assistantTitle}
              currentDisability={currentDisability}
              screenSize={screenSize}
              onSwitchMode={() => handleModeSwitch("text")}
              onSignOut={handleSignOut}
              onUpdateAccessibility={updateAccessibilityPref}
              accessibilityPrefs={accessibilityPrefs}
            />
          )}
        </div>
      </PaperAirplaneTransition>
    );
  } else if (view === "profile") {
    content = (
      <div className="placeholder adaptive-content" style={{ position: "relative" }}>
        {/* Adaptive Sign Out Button */}
        <button
          onClick={handleSignOut}
          className={`sign-out-btn ${screenSize.isMobile ? 'mobile-btn' : ''}`}
          style={{
            position: "absolute",
            top: screenSize.isMobile ? "0.5rem" : "1rem",
            right: screenSize.isMobile ? "0.5rem" : "1rem",
            background: "linear-gradient(135deg, #ff4757, #ff3838)",
            border: "none",
            color: "#ffffff",
            padding: screenSize.isMobile ? "0.5rem 1rem" : "0.6rem 1.2rem",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem",
            zIndex: 10,
            minHeight: accessibilityPrefs.largeButtons ? "48px" : "auto",
            minWidth: accessibilityPrefs.largeButtons ? "48px" : "auto",
            boxShadow: "0 4px 15px rgba(255, 71, 87, 0.3)"
          }}
          aria-label="Sign out of application"
        >
          {screenSize.isSmallScreen ? "🚪" : "🚪 Sign Out"}
        </button>
        
        <h2 style={{ fontSize: screenSize.isMobile ? '1.5rem' : '2rem' }}>👤 Profile</h2>
        <p>Screen: {screenSize.width}×{screenSize.height} ({screenSize.isMobile ? 'Mobile' : screenSize.isTablet ? 'Tablet' : 'Desktop'})</p>
        <p>Orientation: {screenSize.orientation}</p>
        <p>Current disability preference: <strong>{currentDisability.toUpperCase()}</strong></p>
        <p>Font size: {accessibilityPrefs.fontSize}rem</p>
        <p>Auto-adjust: {accessibilityPrefs.autoAdjust ? 'Enabled' : 'Disabled'}</p>
        <button 
          onClick={() => setView("chat")}
          style={{
            minHeight: accessibilityPrefs.largeButtons ? "48px" : "auto",
            padding: screenSize.isMobile ? "0.75rem 1.5rem" : "0.5rem 1rem",
            fontSize: accessibilityPrefs.fontSize + 'rem'
          }}
        >
          {t.back}
        </button>
      </div>
    );
  } else {
    content = (
      <div style={{ position: "relative", height: "100%" }}>
        {/* Adaptive Sign Out Button in settings */}
        <button
          onClick={handleSignOut}
          className={`sign-out-btn ${screenSize.isMobile ? 'mobile-btn' : ''}`}
          style={{
            position: "absolute",
            top: screenSize.isMobile ? "0.5rem" : "1rem",
            right: screenSize.isMobile ? "0.5rem" : "1rem",
            background: "linear-gradient(135deg, #ff4757, #ff3838)",
            border: "none",
            color: "#ffffff",
            padding: screenSize.isMobile ? "0.5rem 1rem" : "0.6rem 1.2rem",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem",
            zIndex: 10,
            minHeight: accessibilityPrefs.largeButtons ? "48px" : "auto",
            minWidth: accessibilityPrefs.largeButtons ? "48px" : "auto",
            boxShadow: "0 4px 15px rgba(255, 71, 87, 0.3)"
          }}
          aria-label="Sign out of application"
        >
          {screenSize.isSmallScreen ? "🚪" : "🚪 Sign Out"}
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
          screenSize={screenSize}
          accessibilityPrefs={accessibilityPrefs}
          onUpdateAccessibility={updateAccessibilityPref}
        />
      </div>
    );
  }

  return (
    <div
      className={getAppClasses()}
      style={getAppStyles()}
      data-screen-size={screenSize.isMobile ? 'mobile' : screenSize.isTablet ? 'tablet' : 'desktop'}
      data-orientation={screenSize.orientation}
    >
      {content}
      
      {/* Screen size indicator for debugging (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {screenSize.width}×{screenSize.height} | {screenSize.isMobile ? 'Mobile' : screenSize.isTablet ? 'Tablet' : 'Desktop'} | {screenSize.orientation}
        </div>
      )}
    </div>
  );
}