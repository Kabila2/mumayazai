import React from "react";
import { translations } from "../translations";

function DisabilitySelector({ onSelect, language }) {
  const t = translations[language];

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>{t.selectDisability}</h2>
      <button onClick={() => onSelect("adhd")}>{t.adhd}</button>
      <button onClick={() => onSelect("autism")}>{t.autism}</button>
      <button onClick={() => onSelect("dyslexia")}>{t.dyslexia}</button>
    </div>
  );
}

export default DisabilitySelector;
