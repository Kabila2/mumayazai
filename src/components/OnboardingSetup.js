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
        width: "100vw",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
        overflow: "auto", /* Allow scrolling */
        position: "fixed", /* Full viewport coverage */
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      <motion.div
        style={{
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          borderRadius: "28px",
          padding: "4rem 3rem", /* Increased padding */
          maxWidth: "800px", /* Increased from 600px */
          width: "100%",
          maxHeight: "90vh", /* Limit height to allow scrolling */
          overflowY: "auto", /* Allow internal scrolling */
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.25)",
          color: "#333",
          position: "relative"
        }}
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
      >
        {/* Floating particles animation */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          overflow: "hidden",
          borderRadius: "28px"
        }}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: `${selectedDisabilityInfo?.color || "#667eea"}40`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -60, -20],
                x: [-10, 10, -10],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <motion.div
            style={{
              fontSize: "4rem",
              marginBottom: "1rem"
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            ✨
          </motion.div>
          <motion.h1
            style={{
              fontSize: "3rem",
              fontWeight: "800",
              margin: "0 0 1.5rem 0",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to Mumayaz
          </motion.h1>
          <motion.p
            style={{
              fontSize: "1.3rem",
              color: "#666",
              margin: 0,
              lineHeight: 1.6
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Let's personalize your experience for better accessibility
          </motion.p>
        </div>

        {currentStep === 1 ? (
          /* Step 1: Disability Selection */
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.h2
              style={{
                fontSize: "2.2rem",
                fontWeight: "700",
                marginBottom: "2rem",
                textAlign: "center",
                color: "#333"
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Choose Your Accessibility Preference
            </motion.h2>
            
            <div style={{
              display: "grid",
              gap: "2rem",
              marginBottom: "3rem"
            }}>
              {disabilities.map((disability, index) => (
                <motion.div
                  key={disability.id}
                  onClick={() => setSelectedDisability(disability.id)}
                  style={{
                    padding: "2rem",
                    borderRadius: "20px",
                    border: selectedDisability === disability.id 
                      ? `4px solid ${disability.color}` 
                      : "3px solid #e0e0e0",
                    background: selectedDisability === disability.id 
                      ? `${disability.color}20` 
                      : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    overflow: "hidden"
                  }}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1 
                  }}
                  transition={{ 
                    delay: 0.3 + index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -8,
                    boxShadow: `0 20px 40px ${disability.color}30`,
                    borderColor: disability.color
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Animated background gradient */}
                  <motion.div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${disability.color}10, ${disability.color}05)`,
                      opacity: selectedDisability === disability.id ? 1 : 0,
                      transition: "opacity 0.3s ease"
                    }}
                  />
                  
                  <motion.div
                    style={{
                      fontSize: "3rem",
                      minWidth: "80px",
                      textAlign: "center",
                      zIndex: 1
                    }}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {disability.icon}
                  </motion.div>
                  <div style={{ flex: 1, zIndex: 1 }}>
                    <motion.h3
                      style={{
                        margin: "0 0 0.8rem 0",
                        fontSize: "1.6rem",
                        fontWeight: "700",
                        color: selectedDisability === disability.id ? disability.color : "#333"
                      }}
                      animate={{
                        color: selectedDisability === disability.id ? disability.color : "#333"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {disability.name}
                    </motion.h3>
                    <p style={{
                      margin: 0,
                      color: "#666",
                      lineHeight: 1.6,
                      fontSize: "1.1rem"
                    }}>
                      {disability.description}
                    </p>
                  </div>
                  {selectedDisability === disability.id && (
                    <motion.div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: disability.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "bold",
                        zIndex: 1
                      }}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div 
              style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button
                onClick={onCancel}
                style={{
                  padding: "1rem 2.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  border: "3px solid #ddd",
                  borderRadius: "16px",
                  background: "transparent",
                  color: "#666",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.3s ease"
                }}
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: "#999",
                  background: "rgba(0,0,0,0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: "1rem 2.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "16px",
                  background: `linear-gradient(135deg, ${selectedDisabilityInfo?.color || "#667eea"}, ${selectedDisabilityInfo?.color || "#764ba2"}DD)`,
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: `0 8px 25px ${selectedDisabilityInfo?.color || "#667eea"}40`
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -3,
                  boxShadow: `0 12px 35px ${selectedDisabilityInfo?.color || "#667eea"}60`
                }}
                whileTap={{ scale: 0.95 }}
              >
                Next Step →
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          /* Step 2: Language Selection */
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2
              style={{
                fontSize: "2.2rem",
                fontWeight: "700",
                marginBottom: "2rem",
                textAlign: "center",
                color: "#333"
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Select Your Language
            </motion.h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
              marginBottom: "3rem"
            }}>
              {languages.map((lang, index) => (
                <motion.div
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  style={{
                    padding: "2rem 1.5rem",
                    borderRadius: "16px",
                    border: selectedLanguage === lang.code 
                      ? `4px solid ${selectedDisabilityInfo?.color || "#667eea"}` 
                      : "3px solid #e0e0e0",
                    background: selectedLanguage === lang.code 
                      ? `${selectedDisabilityInfo?.color || "#667eea"}20` 
                      : "#ffffff",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -5,
                    boxShadow: `0 15px 30px ${selectedDisabilityInfo?.color || "#667eea"}30`
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div 
                    style={{ fontSize: "2.5rem", marginBottom: "1rem" }}
                    whileHover={{ scale: 1.3, rotate: 15 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {lang.flag}
                  </motion.div>
                  <motion.div
                    style={{
                      fontWeight: "600",
                      fontSize: "1.2rem",
                      color: selectedLanguage === lang.code 
                        ? selectedDisabilityInfo?.color || "#667eea" 
                        : "#333"
                    }}
                    animate={{
                      color: selectedLanguage === lang.code 
                        ? selectedDisabilityInfo?.color || "#667eea" 
                        : "#333"
                    }}
                  >
                    {lang.name}
                  </motion.div>
                  
                  {selectedLanguage === lang.code && (
                    <motion.div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: selectedDisabilityInfo?.color || "#667eea",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 25 }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div 
              style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                onClick={() => setCurrentStep(1)}
                style={{
                  padding: "1rem 2.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  border: "3px solid #ddd",
                  borderRadius: "16px",
                  background: "transparent",
                  color: "#666",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: "#999",
                  background: "rgba(0,0,0,0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back
              </motion.button>
              <motion.button
                onClick={handleComplete}
                style={{
                  padding: "1rem 2.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "16px",
                  background: `linear-gradient(135deg, ${selectedDisabilityInfo?.color || "#667eea"}, ${selectedDisabilityInfo?.color || "#764ba2"}DD)`,
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: `0 8px 25px ${selectedDisabilityInfo?.color || "#667eea"}40`
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -3,
                  boxShadow: `0 12px 35px ${selectedDisabilityInfo?.color || "#667eea"}60`
                }}
                whileTap={{ scale: 0.95 }}
              >
                Complete Setup ✨
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* Enhanced Progress indicator */}
        <motion.div 
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "3rem",
            gap: "1rem",
            alignItems: "center"
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[1, 2].map((step) => (
            <motion.div
              key={step}
              style={{
                width: currentStep >= step ? "40px" : "16px",
                height: "16px",
                borderRadius: "8px",
                background: currentStep >= step 
                  ? `linear-gradient(135deg, ${selectedDisabilityInfo?.color || "#667eea"}, ${selectedDisabilityInfo?.color || "#764ba2"})` 
                  : "#ddd",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "10px",
                fontWeight: "bold"
              }}
              animate={{
                width: currentStep >= step ? "40px" : "16px",
                background: currentStep >= step 
                  ? `linear-gradient(135deg, ${selectedDisabilityInfo?.color || "#667eea"}, ${selectedDisabilityInfo?.color || "#764ba2"})` 
                  : "#ddd"
              }}
              whileHover={{ scale: 1.1 }}
            >
              {currentStep >= step && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {step}
                </motion.span>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Animated completion message */}
        {currentStep === 2 && (
          <motion.div
            style={{
              textAlign: "center",
              marginTop: "2rem",
              padding: "1.5rem",
              background: `${selectedDisabilityInfo?.color || "#667eea"}15`,
              borderRadius: "16px",
              border: `2px solid ${selectedDisabilityInfo?.color || "#667eea"}40`
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            <motion.div
              style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎉
            </motion.div>
            <p style={{
              margin: 0,
              color: selectedDisabilityInfo?.color || "#667eea",
              fontWeight: "600",
              fontSize: "1.1rem"
            }}>
              Almost ready! Your {selectedDisabilityInfo?.name} experience is being prepared.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingSetup;