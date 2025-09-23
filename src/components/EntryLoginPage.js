import React, { useState, useEffect, useRef } from "react";
import Orb from "../blocks/Orb/Orb";
import ShinyTextSwitcher from "../blocks/ShinyTextSwitcher/ShinyTextSwitcher";
import AuthModal from "./AuthModal";
import { motion, AnimatePresence } from "framer-motion";
import "./EntryLoginPage.css";
import { FaUserPlus, FaSignInAlt } from "react-icons/fa";

export default function EntryLoginPage({ onSignIn, onSignUp }) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("signin");
  const [selectedLang, setSelectedLang] = useState("en");

  const textVariants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <>
      <div className="entry-container">
        {/* Arabic buttons on the left */}
        <div className="auth-container left-auth">
          <button className="auth-btn arabic-btn" onClick={() => { setMode("signup"); setSelectedLang("ar"); setShowModal(true); }}>
            <FaUserPlus />
            <span>إنشاء حساب</span>
          </button>
          <button className="auth-btn arabic-btn" onClick={() => { setMode("signin"); setSelectedLang("ar"); setShowModal(true); }}>
            <FaSignInAlt />
            <span>تسجيل الدخول</span>
          </button>
        </div>

        {/* English buttons on the right */}
        <div className="auth-container right-auth">
          <button className="auth-btn english-btn" onClick={() => { setMode("signup"); setSelectedLang("en"); setShowModal(true); }}>
            <FaUserPlus />
            <span>Sign Up</span>
          </button>
          <button className="auth-btn english-btn" onClick={() => { setMode("signin"); setSelectedLang("en"); setShowModal(true); }}>
            <FaSignInAlt />
            <span>Sign In</span>
          </button>
        </div>

        <Orb rotateOnHover hoverIntensity={0.3} />
        <div className="shiny-text-container">
          <ShinyTextSwitcher />
        </div>
      </div>

      {showModal && (
        <AuthModal
          lang={selectedLang}
          mode={mode}
          setMode={setMode}
          onClose={() => setShowModal(false)}
          // Pass through to App; AuthModal will display success or error based on result
          onSubmit={async (type, payload) => {
            if (type === "signup") {
              return await onSignUp(payload);   // {ok, message?}
            }
            return await onSignIn(payload);     // {ok, message?}
          }}
        />
      )}
    </>
  );
}
