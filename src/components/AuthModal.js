import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./AuthModal.css";

export default function AuthModal({ lang, onToggleLang, mode, setMode, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [serverError, setServerError] = useState("");

  const stopLangToggle = () => onToggleLang(false);

  const validate = () => {
    const newErrors = {};
    if (mode === "signup" && /\d/.test(name)) newErrors.name = "Name cannot contain numbers.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email address.";
    if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setServerError("");
    setSuccess(null);

    try {
      const res = await onSubmit(mode, { name, email, password, role });
      if (res && res.ok) {
        setSuccess("🎉 Success! Redirecting...");
        setTimeout(() => onClose(), 900); // close modal -> App shows main UI
      } else {
        setServerError(res?.message || "Authentication failed. Please try again.");
      }
    } catch (e) {
      setServerError("Unexpected error. Please try again.");
    }
  };

  const textVariants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>{lang === "en" ? (mode === "signup" ? "Sign Up" : "Sign In") : (mode === "signup" ? "إنشاء حساب" : "تسجيل الدخول")}</h2>

        {mode === "signup" && (
          <>
            <AnimatePresence mode="wait">
              <motion.input
                key={lang + "-name"}
                type="text"
                value={name}
                placeholder={lang === "en" ? "Name" : "الاسم"}
                className="modal-input"
                onFocus={stopLangToggle}
                onChange={(e) => setName(e.target.value)}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
              />
            </AnimatePresence>
            {errors.name && <div className="error-text">{errors.name}</div>}
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.input
            key={lang + "-email" + mode}
            type="email"
            value={email}
            placeholder={lang === "en" ? "Email" : "البريد الإلكتروني"}
            className="modal-input"
            onFocus={stopLangToggle}
            onChange={(e) => setEmail(e.target.value)}
            variants={textVariants}
            initial="enter"
            animate="center"
            exit="exit"
          />
        </AnimatePresence>
        {errors.email && <div className="error-text">{errors.email}</div>}

        <AnimatePresence mode="wait">
          <motion.input
            key={lang + "-password" + mode}
            type="password"
            value={password}
            placeholder={lang === "en" ? "Password" : "كلمة المرور"}
            className="modal-input"
            onFocus={stopLangToggle}
            onChange={(e) => setPassword(e.target.value)}
            variants={textVariants}
            initial="enter"
            animate="center"
            exit="exit"
          />
        </AnimatePresence>
        {errors.password && <div className="error-text">{errors.password}</div>}

        {mode === "signup" && (
          <div style={{ marginTop: 10 }}>
            <label>
              <input
                type="radio"
                name="role"
                value="parent"
                checked={role === "parent"}
                onChange={() => setRole("parent")}
              /> {lang === "en" ? "Parent" : "ولي أمر"}
            </label>
            <label style={{ marginLeft: 20 }}>
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === "student"}
                onChange={() => setRole("student")}
              /> {lang === "en" ? "Child" : "طفل"}
            </label>
          </div>
        )}

        {success && <div className="success-message success">{success}</div>}
        {serverError && <div className="success-message error">{serverError}</div>}

        <button className="modal-submit" onClick={handleSubmit}>
          {lang === "en" ? (mode === "signup" ? "Register" : "Login") : (mode === "signup" ? "تسجيل" : "دخول")}
        </button>

        <div style={{ marginTop: 10, fontSize: "0.9rem", textAlign: "center" }}>
          {lang === "en"
            ? mode === "signup"
              ? "Already have an account?"
              : "Don’t have an account?"
            : mode === "signup"
              ? "هل لديك حساب؟"
              : "ليس لديك حساب؟"}{" "}
          <span
            onClick={() => { setServerError(""); setSuccess(null); setMode(mode === "signup" ? "signin" : "signup"); }}
            style={{ color: "#0ff", cursor: "pointer", textDecoration: "underline" }}
          >
            {lang === "en"
              ? mode === "signup" ? "Sign In" : "Sign Up"
              : mode === "signup" ? "تسجيل الدخول" : "إنشاء حساب"}
          </span>
        </div>
      </div>
    </div>
  );
}
