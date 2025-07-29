import React, { useState, useEffect, useRef } from "react";
import Orb from "../blocks/Orb/Orb";
import ShinyTextSwitcher from "../blocks/ShinyTextSwitcher/ShinyTextSwitcher";
import AuthModal from "./AuthModal";
import { motion, AnimatePresence } from "framer-motion";
import "./EntryLoginPage.css";
import { FaUserPlus, FaSignInAlt } from "react-icons/fa";

export default function EntryLoginPage({ onSignIn, onSignUp }) {
  const [lang, setLang] = useState("en");
  const [langEnabled, setLangEnabled] = useState(true);
  const intervalRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("signin");

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (langEnabled) {
      intervalRef.current = setInterval(() => {
        setLang((l) => (l === "en" ? "ar" : "en"));
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [langEnabled]);

  const handleSubmit = (type, userData) => {
    // Store role for later use if needed
    localStorage.setItem("mumayaz_role", userData.role);
    
    if (type === "signup") {
      setSuccess(true); // Show success message first
      // Call onSignUp after a brief delay to show success message
      setTimeout(() => {
        onSignUp(userData); // Pass userData to parent
      }, 1500);
    } else {
      setSuccess(true); // Show success message first
      // Call onSignIn after a brief delay to show success message
      setTimeout(() => {
        onSignIn(userData); // Pass userData to parent
      }, 1500);
    }
  };

  const textVariants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <>
      <div className="entry-container">
        <div className="auth-container">
          <button className="auth-btn" onClick={() => { setMode("signup"); setShowModal(true); }}>
            <FaUserPlus />
            <AnimatePresence mode="wait">
              <motion.span
                key={lang + "-signup"}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                style={{ display: "inline-block", marginLeft: 4 }}
              >
                {lang === "en" ? "Sign Up" : "إنشاء حساب"}
              </motion.span>
            </AnimatePresence>
          </button>
          <button className="auth-btn" onClick={() => { setMode("signin"); setShowModal(true); }}>
            <FaSignInAlt />
            <AnimatePresence mode="wait">
              <motion.span
                key={lang + "-signin"}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                style={{ display: "inline-block", marginLeft: 4 }}
              >
                {lang === "en" ? "Sign In" : "تسجيل الدخول"}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <Orb rotateOnHover hoverIntensity={0.3} />
        <div className="shiny-text-container">
          {success ? (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="success-message"
            >
              ✅ Success! Redirecting...
            </motion.p>
          ) : (
            <ShinyTextSwitcher />
          )}
        </div>
      </div>

      {showModal && (
        <AuthModal
          lang={lang}
          onToggleLang={setLangEnabled}
          mode={mode}
          setMode={setMode}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}