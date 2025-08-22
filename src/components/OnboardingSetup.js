// src/components/OnboardingSetup.js
import React, { useState } from "react";
import { motion } from "framer-motion";

const OnboardingSetup = ({ 
  defaultDisability = "dyslexia", 
  defaultLanguage = "en", 
  onComplete, 
  onCancel 
}) => {
  const [selectedDisability, setSelectedDisability] = useState(defaultDisability);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [currentStep, setCurrentStep] = useState(1);

  const disabilities = [
    {
      id: "dyslexia",
      name: "Dyslexia",
      description: "Optimized for reading difficulties with clear fonts and spacing",
      icon: "📖",
      color: "#4CAF50"
    },
    {
      id: "adhd",
      name: "ADHD",
      description: "Focused interface with minimal distractions and clear structure",
      icon: "🧠",
      color: "#FF8F00"
    },
    {
      id: "autism",
      name: "Autism",
      description: "Consistent, predictable interface with clear communication",
      icon: "🌈",
      color: "#26A69A"
    }
  ];

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" }
  ];

  const handleComplete = () => {
    onComplete({ 
      disability: selectedDisability, 
      lang: selectedLanguage 
    });
  };

  const selectedDisabilityInfo = disabilities.find(d => d.id === selectedDisability);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif"
      }}
    >
      <motion.div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "3rem",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
          color: "#333"
        }}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <motion.h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "800",
              margin: "0 0 1rem 0",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to Mumayaz
          </motion.h1>
          <p style={{
            fontSize: "1.1rem",
            color: "#666",
            margin: 0,
            lineHeight: 1.6
          }}>
            Let's personalize your experience for better accessibility
          </p>
        </div>

        {currentStep === 1 ? (
          /* Step 1: Disability Selection */
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 style={{
              fontSize: "1.8rem",
              fontWeight: "700",
              marginBottom: "1.5rem",
              textAlign: "center",
              color: "#333"
            }}>
              Choose Your Accessibility Preference
            </h2>
            
            <div style={{
              display: "grid",
              gap: "1.5rem",
              marginBottom: "2rem"
            }}>
              {disabilities.map((disability) => (
                <motion.div
                  key={disability.id}
                  onClick={() => setSelectedDisability(disability.id)}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "16px",
                    border: selectedDisability === disability.id 
                      ? `3px solid ${disability.color}` 
                      : "2px solid #e0e0e0",
                    background: selectedDisability === disability.id 
                      ? `${disability.color}15` 
                      : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem"
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: `0 8px 25px ${disability.color}25` 
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{
                    fontSize: "2.5rem",
                    minWidth: "60px",
                    textAlign: "center"
                  }}>
                    {disability.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "1.4rem",
                      fontWeight: "600",
                      color: selectedDisability === disability.id ? disability.color : "#333"
                    }}>
                      {disability.name}
                    </h3>
                    <p style={{
                      margin: 0,
                      color: "#666",
                      lineHeight: 1.5,
                      fontSize: "0.95rem"
                    }}>
                      {disability.description}
                    </p>
                  </div>
                  {selectedDisability === disability.id && (
                    <motion.div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: disability.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "bold"
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <motion.button
                onClick={onCancel}
                style={{
                  padding: "0.8rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  border: "2px solid #ddd",
                  borderRadius: "12px",
                  background: "transparent",
                  color: "#666",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
                whileHover={{ scale: 1.05, borderColor: "#999" }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: "0.8rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "12px",
                  background: selectedDisabilityInfo?.color || "#667eea",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Next Step →
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Step 2: Language Selection */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 style={{
              fontSize: "1.8rem",
              fontWeight: "700",
              marginBottom: "1.5rem",
              textAlign: "center",
              color: "#333"
            }}>
              Select Your Language
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              {languages.map((lang) => (
                <motion.div
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  style={{
                    padding: "1.2rem",
                    borderRadius: "12px",
                    border: selectedLanguage === lang.code 
                      ? `3px solid ${selectedDisabilityInfo?.color || "#667eea"}` 
                      : "2px solid #e0e0e0",
                    background: selectedLanguage === lang.code 
                      ? `${selectedDisabilityInfo?.color || "#667eea"}15` 
                      : "#ffffff",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.3s ease"
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: `0 8px 20px ${selectedDisabilityInfo?.color || "#667eea"}25` 
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                    {lang.flag}
                  </div>
                  <div style={{
                    fontWeight: "600",
                    color: selectedLanguage === lang.code 
                      ? selectedDisabilityInfo?.color || "#667eea" 
                      : "#333"
                  }}>
                    {lang.name}
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <motion.button
                onClick={() => setCurrentStep(1)}
                style={{
                  padding: "0.8rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  border: "2px solid #ddd",
                  borderRadius: "12px",
                  background: "transparent",
                  color: "#666",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
                whileHover={{ scale: 1.05, borderColor: "#999" }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back
              </motion.button>
              <motion.button
                onClick={handleComplete}
                style={{
                  padding: "0.8rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "12px",
                  background: selectedDisabilityInfo?.color || "#667eea",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Complete Setup ✨
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Progress indicator */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "2rem",
          gap: "0.5rem"
        }}>
          {[1, 2].map((step) => (
            <div
              key={step}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: currentStep >= step 
                  ? selectedDisabilityInfo?.color || "#667eea" 
                  : "#ddd",
                transition: "all 0.3s ease"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingSetup;