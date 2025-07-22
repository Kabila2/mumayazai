import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import { translations } from "../translations";

export default function ParentDashboard({
  children,
  currentChild,
  setCurrentChild,
  language,
}) {
  const [newChildName, setNewChildName] = useState("");
  const [preferences, setPreferences] = useState(() => {
    return JSON.parse(localStorage.getItem("mumayaz_preferences") || "{}");
  });

  const t = translations[language] || {};

  const updatePreferences = (childName, key, value) => {
    const updated = {
      ...preferences,
      [childName]: {
        ...(preferences[childName] || {}),
        [key]: value
      }
    };
    setPreferences(updated);
    localStorage.setItem("mumayaz_preferences", JSON.stringify(updated));
  };

  const addChild = () => {
    if (!newChildName.trim()) return alert("Please enter a name.");
    const updatedChildren = { ...children, [newChildName]: 0 };
    localStorage.setItem("mumayaz_children", JSON.stringify(updatedChildren));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h2 className="text-4xl font-bold mb-6 text-center">👨‍👩‍👧 {t.parentDashboard}</h2>

      <div className="flex justify-center gap-6 mb-10">
        <button
          onClick={() => {
            const current = prompt(t.enterPIN);
            if (current === localStorage.getItem("mumayaz_pin")) {
              const newPin = prompt(t.pinPrompt);
              if (newPin && newPin.length === 4) {
                localStorage.setItem("mumayaz_pin", newPin);
                alert(t.setPINSuccess);
              } else {
                alert(t.pinMustBe4Digits);
              }
            } else {
              alert(t.invalidPIN);
            }
          }}
          className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-500 transition"
        >
          🔐 {t.pinPrompt}
        </button>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t.enterChildName}
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            className="p-2 bg-gray-900 border border-gray-700 rounded text-white"
          />
          <button
            onClick={addChild}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            ➕ {t.addChild}
          </button>
        </div>
      </div>

      <div className="w-full h-72 mb-10">
        <ResponsiveContainer>
          <BarChart
            data={Object.entries(children).map(([name, tasks]) => ({ name, tasks }))}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="tasks" fill="#f5b041" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="w-full table-auto border border-gray-600 text-center text-lg">
        <thead className="bg-yellow-400 text-black">
          <tr>
            <th className="p-3">{t.childName}</th>
            <th className="p-3">{t.completedTasks}</th>
            <th className="p-3">🗣️ TTS</th>
            <th className="p-3">📖 Dyslexia UI</th>
            <th className="p-3">{t.selectChild}</th>
            <th className="p-3">🔄 Reset</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(children).map(([name, tasks]) => (
            <tr key={name} className="border-t border-gray-700">
              <td className="p-3">{name}</td>
              <td className="p-3">{tasks}</td>
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={preferences[name]?.tts || false}
                  onChange={(e) => updatePreferences(name, "tts", e.target.checked)}
                />
              </td>
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={preferences[name]?.dyslexiaUI || false}
                  onChange={(e) => updatePreferences(name, "dyslexiaUI", e.target.checked)}
                />
              </td>
              <td className="p-3">
                <button onClick={() => setCurrentChild(name)} className="text-yellow-300 hover:underline">👶</button>
              </td>
              <td className="p-3">
                <button
                  onClick={() => {
                    if (window.confirm(`Reset progress for ${name}?`)) {
                      const updated = { ...children, [name]: 0 };
                      localStorage.setItem("mumayaz_children", JSON.stringify(updated));
                      window.location.reload();
                    }
                  }}
                  className="text-red-400 hover:underline"
                >
                  🔁
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
