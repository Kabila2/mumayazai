// src/blocks/VoiceSettings/VoiceSettings.js
import React, { useEffect, useState } from "react";
import "../../components/VoiceInterface.css";
import { translations } from "../../translations";

export default function VoiceSettings({
  language, setLanguage,
  voices, selectedVoice, setSelectedVoice,
  speed, setSpeed,
  pitch, setPitch,
  speak
}) {
  const t = (key) => translations.en[key] ?? key;

  const [disability, setDisability] = useState(() => {
    return localStorage.getItem("disability") || "none";
  });

  useEffect(() => {
    localStorage.setItem("disability", disability);
  }, [disability]);

  return (
    <div className="settings-panel">
      <h2 className="settings-title">{t("settings")}</h2>

      <div className="control-group">
        <label>Disability</label>
        <select value={disability} onChange={e => setDisability(e.target.value)}>
          <option value="none">None</option>
          <option value="adhd">ADHD</option>
          <option value="dyslexia">Dyslexia</option>
          <option value="autism">Autism</option>
          <option value="visual_impairment">Visual Impairment</option>
        </select>
      </div>

      <div className="control-group">
        <label>{t("language")}</label>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="en-US">English</option>
        </select>
      </div>

      <div className="control-group">
        <label>{t("voice")}</label>
        <select
          value={selectedVoice || ""}
          onChange={e => setSelectedVoice(e.target.value)}
        >
          {voices.map(v => (
            <option key={v.name} value={v.name}>{v.name}</option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <button className="test-btn" onClick={() => speak(t("welcome_ai"))}>
          {t("test")}
        </button>
      </div>

      <div className="control-group">
        <label>{t("speed")} {speed}</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>{t("pitch")} {pitch}</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={pitch}
          onChange={e => setPitch(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
