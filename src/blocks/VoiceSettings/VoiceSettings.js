// src/blocks/VoiceSettings/VoiceSettings.js
import React from "react";
// pull in your shared styles for voice controls
import "../../components/VoiceInterface.css";
// pull in your translations from the project root
import { translations } from "../../translations";

export default function VoiceSettings({
  voices,
  selectedVoice,
  setSelectedVoice,
  speed,
  setSpeed,
  pitch,
  setPitch,
  language,
  setLanguage,
  speak,
}) {
  const t = (key) => translations.en[key] ?? key;

  return (
    <div className="settings-panel">
      <h2 className="settings-title">{t("settings")}</h2>

      <div className="control-group">
        <label>{t("language")}</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en-US">English</option>
        </select>
      </div>

      <div className="control-group">
        <label>{t("voice")}</label>
        <select
          value={selectedVoice || ""}
          onChange={(e) => setSelectedVoice(e.target.value)}
        >
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label>
          {t("speed")}: {speed}
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>
          {t("pitch")}: {pitch}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <button
          className="test-btn"
          onClick={() => speak(t("welcome_ai"))}
        >
          {t("test")}
        </button>
      </div>
    </div>
  );
}
