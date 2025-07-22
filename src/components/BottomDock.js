// src/components/BottomDock.js
import React from "react";
import { FaCog, FaUser, FaComments } from "react-icons/fa";
import "./BottomDock.css";

export default function BottomDock({ onSelect }) {
  return (
    <div className="bottom-dock">
      <button
        className="dock-item"
        onClick={() => onSelect("settings")}
        aria-label="Settings"
      >
        <FaCog />
      </button>
      <button
        className="dock-item"
        onClick={() => onSelect("profile")}
        aria-label="Profile"
      >
        <FaUser />
      </button>
      <button
        className="dock-item"
        onClick={() => onSelect("chat")}
        aria-label="Chat"
      >
        <FaComments />
      </button>
    </div>
  );
}
