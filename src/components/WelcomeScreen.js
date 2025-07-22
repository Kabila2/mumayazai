import React from "react";
import { translations } from "../translations";

function WelcomeScreen({ onStart, language }) {
  const t = translations[language];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f0f8ff",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ fontSize: "2.5rem", color: "#333" }}>{t.welcome}</h1>
      <button 
        onClick={onStart} 
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          fontSize: "1.2rem",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        {t.start}
      </button>
    </div>
  );
}

export default WelcomeScreen;
