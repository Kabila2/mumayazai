// src/components/OnboardingSetup.js
import React, { useState } from "react";
import { motion } from "framer-motion";

const DISABILITIES = [
  { value: "dyslexia", label: "Dyslexia" },
  { value: "adhd", label: "ADHD" },
  { value: "autism", label: "Autism" },
  { value: "apd", label: "Auditory Processing" },
  { value: "vision", label: "Vision Support" }
];

const LANGS = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية (Arabic)" }
];

export default function OnboardingSetup({
  defaultDisability = "dyslexia",
  defaultLanguage = "en",
  onComplete,
  onCancel
}) {
  const [disability, setDisability] = useState(defaultDisability);
  const [lang, setLang] = useState(defaultLanguage);

  const handleContinue = () => {
    if (!disability || !lang) return;
    onComplete({ disability, lang });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a001a, #000020, #100018)",
        color: "#e0d6ff",
        fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
        padding: "2rem"
      }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(178, 132, 255, 0.35)",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)"
        }}
      >
        <h2 style={{ margin: 0, marginBottom: "0.75rem", color: "#fff", fontSize: "1.6rem" }}>
          Quick Setup
        </h2>
        <p style={{ marginTop: 0, opacity: 0.9 }}>
          Choose your <strong>learning support</strong> and <strong>interface language</strong>. You can change these later.
        </p>

        {/* Disability */}
        <div style={{ marginTop: "1.25rem" }}>
          <label style={{ display: "block", marginBottom: 8, color: "#b199ff", fontWeight: 600 }}>
            Disability Support
          </label>
          <div style={{ display: "grid", gap: 10 }}>
            {DISABILITIES.map((d) => (
              <label
                key={d.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0.6rem 0.8rem",
                  background: disability === d.value ? "rgba(142,45,226,0.25)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${disability === d.value ? "rgba(142,45,226,0.6)" : "rgba(255,255,255,0.15)"}`,
                  borderRadius: 10,
                  cursor: "pointer"
                }}
              >
                <input
                  type="radio"
                  name="disability"
                  value={d.value}
                  checked={disability === d.value}
                  onChange={() => setDisability(d.value)}
                />
                <span style={{ color: "#fff" }}>{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Language */}
        <div style={{ marginTop: "1.25rem" }}>
          <label style={{ display: "block", marginBottom: 8, color: "#b199ff", fontWeight: 600 }}>
            Interface Language
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {LANGS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLang(l.value)}
                style={{
                  padding: "0.6rem 0.9rem",
                  background: lang === l.value ? "linear-gradient(135deg, #8e2de2, #4a00e0)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${lang === l.value ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)"}`,
                  color: "#fff",
                  borderRadius: 10,
                  cursor: "pointer",
                  minWidth: 120
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: "1.5rem", display: "flex", gap: 12, justifyContent: "flex-end" }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "0.6rem 1rem",
                borderRadius: 10,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleContinue}
            style={{
              background: "linear-gradient(135deg, #4CAF50, #45a049)",
              border: "none",
              color: "#fff",
              padding: "0.7rem 1.2rem",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              minWidth: 120
            }}
          >
            Continue →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
