import React, { useState } from "react";
import Cookies from "js-cookie";
export default function PreferenceSetup({ onComplete }) {
  const [disability, setDisability] = useState("");
  const [language, setLanguage] = useState("");

  const handleSubmit = () => {
    if (!disability || !language) return alert("Please select both options.");

    Cookies.set("mumayaz_language", language, { expires: 7 });
    Cookies.set("mumayaz_disability", disability, { expires: 7 });

    // Store preferences per child/account (you can also store them in localStorage if needed)
    const prefs = JSON.parse(Cookies.get("mumayaz_preferences") || "{}");
    const role = Cookies.get("mumayaz_role");
    const currentChild = Object.keys(prefs)[0] || "default";

    prefs[currentChild] = {
      ...prefs[currentChild],
      language,
      disability,
      tts: disability === "dyslexia",
      dyslexiaUI: disability === "dyslexia",
      adhdMode: disability === "adhd"
    };

    Cookies.set("mumayaz_preferences", JSON.stringify(prefs), { expires: 7 });

    onComplete(language, disability);
  };

  return (
    <div style={{ color: "#fff", textAlign: "center", paddingTop: "50px" }}>
      <h2>Select Your Preferences</h2>

      <div style={{ margin: "20px" }}>
        <label>Disability: </label>
        <select value={disability} onChange={(e) => setDisability(e.target.value)}>
          <option value="">--Select--</option>
          <option value="adhd">ADHD</option>
          <option value="dyslexia">Dyslexia</option>
          <option value="autism">Autism</option>
        </select>
      </div>

      <div style={{ margin: "20px" }}>
        <label>Preferred Language: </label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">--Select--</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      <button onClick={handleSubmit}>Save and Continue</button>
    </div>
  );
}
