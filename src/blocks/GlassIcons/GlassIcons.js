import React from "react";
import "./GlassIcons.css";

const defaultIcons = [
  { label: "Learn", icon: "📘" },
  { label: "Speak", icon: "🗣️" },
  { label: "Understand", icon: "🧠" },
];

export default function GlassIcons({ icons = defaultIcons }) {
  return (
    <div className="glass-icons-container">
      {icons.map((item, idx) => (
        <div key={idx} className="glass-icon-card">
          <span className="icon">{item.icon}</span>
          <p>{item.label}</p>
        </div>
      ))}
    </div>
  );
}
