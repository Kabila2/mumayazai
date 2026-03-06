// src/components/OnboardingSetup.js
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const OnboardingSetup = ({
  defaultLanguage = "en",
  onComplete,
  onCancel
}) => {
  const [language, setLanguage] = useState(defaultLanguage);
  const [error, setError] = useState("");

  const FONTS = [
    { label: 'OpenDyslexic', value: "'OpenDyslexic', sans-serif" },
    { label: 'Roboto',       value: "'Roboto', sans-serif" },
    { label: 'Cairo',        value: "'Cairo', sans-serif" },
    { label: 'System',       value: 'system-ui, sans-serif' },
  ];
  const [selectedFont, setSelectedFont] = useState("'OpenDyslexic', sans-serif");
  const [textSize, setTextSize] = useState(100);

  // Set initial direction on component mount
  React.useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const handleSubmit = () => {
    if (!language) {
      setError("Please select a language.");
      return;
    }
    setError("");
    // Save and apply appearance preferences
    localStorage.setItem('mumayaz_font', selectedFont);
    localStorage.setItem('mumayaz_text_size', String(textSize));
    document.documentElement.style.setProperty('--font-sans', selectedFont);
    document.documentElement.style.fontSize = textSize + '%';

    const disability = language === "ar" ? "default" : "default";
    onComplete({ disability, lang: language });
  };

  const languageOptions = [
    { value: "en", label: "English", flag: "EN" },
    { value: "ar", label: "العربية", flag: "AR" }
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #8e2de2 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 8s ease infinite",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
        color: "#ffffff",
        overflow: "hidden"
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .floating-shapes {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        
        .shape {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }
        
        .shape:nth-child(1) {
          width: 80px;
          height: 80px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }
        
        .shape:nth-child(2) {
          width: 120px;
          height: 120px;
          top: 60%;
          right: 15%;
          animation-delay: 2s;
        }
        
        .shape:nth-child(3) {
          width: 60px;
          height: 60px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }
        
        .shape:nth-child(4) {
          width: 100px;
          height: 100px;
          top: 10%;
          right: 25%;
          animation-delay: 1s;
        }
      `}</style>

      {/* Floating Background Shapes */}
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      <motion.div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: window.innerWidth <= 480 ? "1.5rem" : "2rem",
          width: "95%",
          maxWidth: "500px",
          minHeight: window.innerWidth <= 480 ? "auto" : "auto",
          color: "#333333",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          position: "relative",
          zIndex: 10,
          direction: language === "ar" ? "rtl" : "ltr",
          margin: window.innerWidth <= 480 ? "1rem" : "2rem"
        }}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: "2rem" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 style={{
            margin: "0 0 0.5rem 0",
            fontSize: window.innerWidth <= 480 ? "1.5rem" : "1.8rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: "1.2"
          }}>
            {language === "ar" ? "مرحباً! دعنا نعدك" : "Welcome! Let's Set You Up"}
          </h2>
          <p style={{
            margin: "0",
            color: "#666",
            fontSize: window.innerWidth <= 480 ? "0.9rem" : "1rem",
            direction: language === "ar" ? "rtl" : "ltr",
            lineHeight: "1.4"
          }}>
            {language === "ar" ? "اختر لغتك وخطك وحجم النص للحصول على أفضل تجربة" : "Choose your language, font, and text size for the best experience"}
          </p>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          style={{ marginBottom: "1.5rem" }}
          initial={{ opacity: 0, x: language === "ar" ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <label style={{
            display: "block",
            marginBottom: "0.75rem",
            fontWeight: "600",
            fontSize: "1.1rem",
            color: "#444",
            direction: language === "ar" ? "rtl" : "ltr"
          }}>
            {language === "ar" ? "اللغة المفضلة" : "Preferred Language"}
          </label>
          <div style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth <= 480 ? "1fr" : "1fr 1fr",
            gap: "0.75rem"
          }}>
            {languageOptions.map((option) => (
              <motion.div
                key={option.value}
                onClick={() => {
                  setLanguage(option.value);
                  // Update UI direction immediately when language changes
                  document.documentElement.dir = option.value === "ar" ? "rtl" : "ltr";
                  document.documentElement.lang = option.value;
                }}
                style={{
                  padding: window.innerWidth <= 480 ? "1.25rem" : "1rem",
                  borderRadius: "16px",
                  border: language === option.value
                    ? "3px solid #667eea"
                    : "2px solid rgba(0, 0, 0, 0.1)",
                  background: language === option.value
                    ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))"
                    : "rgba(0, 0, 0, 0.02)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.3s ease",
                  transform: language === option.value ? "scale(1.02)" : "scale(1)",
                  textAlign: "center",
                  minHeight: window.innerWidth <= 480 ? "100px" : "auto"
                }}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <div style={{ fontSize: "2rem" }}>{option.flag}</div>
                <div style={{ 
                  fontWeight: "600", 
                  fontSize: "1rem",
                  color: language === option.value ? "#667eea" : "#333"
                }}>
                  {option.label}
                </div>
                {language === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "#667eea",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.7rem"
                    }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Font Selection */}
        <motion.div
          style={{ marginBottom: "1.5rem" }}
          initial={{ opacity: 0, x: language === "ar" ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label style={{
            display: "block",
            marginBottom: "0.75rem",
            fontWeight: "600",
            fontSize: "1.1rem",
            color: "#444",
            direction: language === "ar" ? "rtl" : "ltr"
          }}>
            {language === "ar" ? "الخط المفضل" : "Preferred Font"}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {FONTS.map((font) => (
              <motion.div
                key={font.value}
                onClick={() => setSelectedFont(font.value)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "12px",
                  border: selectedFont === font.value ? "3px solid #667eea" : "2px solid rgba(0,0,0,0.1)",
                  background: selectedFont === font.value
                    ? "linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))"
                    : "rgba(0,0,0,0.02)",
                  cursor: "pointer",
                  textAlign: "center",
                  fontFamily: font.value,
                  transition: "all 0.2s ease"
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div style={{
                  fontWeight: "700",
                  fontSize: "1.1rem",
                  color: selectedFont === font.value ? "#667eea" : "#333",
                  fontFamily: font.value
                }}>
                  Aa
                </div>
                <div style={{ fontSize: "0.78rem", color: "#666", marginTop: "4px" }}>
                  {font.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Text Size */}
        <motion.div
          style={{ marginBottom: "1.5rem" }}
          initial={{ opacity: 0, x: language === "ar" ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <label style={{
            display: "block",
            marginBottom: "0.75rem",
            fontWeight: "600",
            fontSize: "1.1rem",
            color: "#444",
            direction: language === "ar" ? "rtl" : "ltr"
          }}>
            {language === "ar" ? "حجم النص" : "Text Size"}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.button
              onClick={() => setTextSize(s => Math.max(80, s - 5))}
              disabled={textSize <= 80}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                border: "2px solid #667eea", background: "white",
                color: "#667eea", fontWeight: "700", fontSize: "1rem",
                cursor: textSize <= 80 ? "not-allowed" : "pointer",
                opacity: textSize <= 80 ? 0.4 : 1, flexShrink: 0
              }}
              whileTap={{ scale: 0.95 }}
            >A-</motion.button>

            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#667eea" }}>
                {textSize}%
              </div>
              <div style={{
                height: "6px", background: "#e5e7eb", borderRadius: "3px",
                marginTop: "6px", overflow: "hidden"
              }}>
                <div style={{
                  height: "100%", borderRadius: "3px",
                  width: `${((textSize - 80) / 70) * 100}%`,
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                  transition: "width 0.2s ease"
                }} />
              </div>
            </div>

            <motion.button
              onClick={() => setTextSize(s => Math.min(150, s + 5))}
              disabled={textSize >= 150}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                border: "2px solid #667eea", background: "white",
                color: "#667eea", fontWeight: "700", fontSize: "1.1rem",
                cursor: textSize >= 150 ? "not-allowed" : "pointer",
                opacity: textSize >= 150 ? 0.4 : 1, flexShrink: 0
              }}
              whileTap={{ scale: 0.95 }}
            >A+</motion.button>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              style={{
                background: "rgba(244, 67, 54, 0.1)",
                color: "#f44336",
                padding: "0.75rem",
                borderRadius: "12px",
                marginBottom: "1.5rem",
                textAlign: "center",
                border: "1px solid rgba(244, 67, 54, 0.3)"
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {language === "ar" ? "يرجى اختيار لغة." : error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <motion.div
          style={{
            display: "flex",
            gap: window.innerWidth <= 480 ? "0.75rem" : "1rem",
            justifyContent: "space-between",
            flexDirection: window.innerWidth <= 480 ? "column" : "row"
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {onCancel && (
            <motion.button
              onClick={onCancel}
              style={{
                padding: window.innerWidth <= 480 ? "1rem 1.5rem" : "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "2px solid rgba(0, 0, 0, 0.1)",
                background: "transparent",
                color: "#666",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: window.innerWidth <= 480 ? "1.1rem" : "1rem",
                transition: "all 0.3s ease",
                flex: window.innerWidth <= 480 ? "none" : 1,
                minHeight: window.innerWidth <= 480 ? "50px" : "auto"
              }}
              whileHover={{ 
                scale: 1.02, 
                background: "rgba(0, 0, 0, 0.05)",
                borderColor: "rgba(0, 0, 0, 0.2)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </motion.button>
          )}
          
          <motion.button
            onClick={handleSubmit}
            style={{
              padding: window.innerWidth <= 480 ? "1rem 2rem" : "0.75rem 2rem",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: window.innerWidth <= 480 ? "1.1rem" : "1rem",
              boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s ease",
              flex: window.innerWidth <= 480 ? "none" : 2,
              minHeight: window.innerWidth <= 480 ? "50px" : "auto"
            }}
            whileHover={{ 
              scale: 1.05, 
              y: -2,
              boxShadow: "0 12px 35px rgba(102, 126, 234, 0.6)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            {language === "ar" ? "متابعة" : "Continue"}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OnboardingSetup;