// PreferenceSetup.js
import React, { useState } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";

export default function PreferenceSetup({ onComplete }) {
  const [disability, setDisability] = useState("");
  const [language, setLanguage] = useState("en"); // default EN
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!disability || !language) {
      setError("Please select both options.");
      return;
    }

    // --- Cookies (7 days)
    Cookies.set("mumayaz_language", language, { expires: 7 });
    Cookies.set("mumayaz_disability", disability, { expires: 7 });

    // --- LocalStorage (primary lookup in app)
    localStorage.setItem("language", language);
    localStorage.setItem("disability", disability);

    // Per-child preferences in cookies (existing behavior)
    const prefs = JSON.parse(Cookies.get("mumayaz_preferences") || "{}");
    const role = Cookies.get("mumayaz_role");
    const currentChild = Object.keys(prefs)[0] || "default";

    prefs[currentChild] = {
      ...prefs[currentChild],
      language,
      disability,
      tts: disability === "dyslexia",
      dyslexiaUI: disability === "dyslexia",
      adhdMode: disability === "adhd",
      role: role || "child"
    };
    Cookies.set("mumayaz_preferences", JSON.stringify(prefs), { expires: 7 });

    setError("");
    onComplete(language, disability);
  };

  return (
    <motion.div
      style={{ color: "#fff", textAlign: "center", paddingTop: "50px" }}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } }}
    >
      <motion.h2
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.1 } }}
      >
        Select Your Preferences
      </motion.h2>

      <motion.div
        style={{ margin: "20px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
      >
        <label style={{ marginRight: 8 }}>Disability: </label>
        <select
          value={disability}
          onChange={(e) => setDisability(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(26,0,26,0.6)",
            color: "#fff"
          }}
        >
          <option value="">--Select--</option>
          <option value="adhd">ADHD</option>
          <option value="dyslexia">Dyslexia</option>
          <option value="autism">Autism</option>
        </select>
      </motion.div>

      <motion.div
        style={{ margin: "20px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
      >
        <label style={{ marginRight: 8 }}>Preferred Language: </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(26,0,26,0.6)",
            color: "#fff"
          }}
        >
          <option value="">--Select--</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{ color: "#ffbaba", marginBottom: 12 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleSubmit}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: "12px 18px",
          borderRadius: 12,
          border: "none",
          background:
            "linear-gradient(135deg, rgba(142,45,226,1), rgba(74,0,224,1))",
          color: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          cursor: "pointer"
        }}
      >
        Save and Continue
      </motion.button>
    </motion.div>
  );
}
