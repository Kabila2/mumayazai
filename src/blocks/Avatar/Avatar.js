import React from "react";
import "./Avatar.css";

/**
 * Simple Interactive Avatar:
 *  – Hover to pop & make the mouth “speak”
 */
export default function Avatar({ className = "" }) {
  return (
    <div className={`avatar ${className}`}>
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="32" cy="32" r="30" className="avatar-bg" />
        <circle cx="32" cy="24" r="12" className="avatar-head" />
        <ellipse cx="32" cy="36" rx="8" ry="2" className="avatar-mouth" />
        <path
          d="M16,52c0-8.837 7.163-16 16-16s16,7.163 16,16"
          className="avatar-body"
        />
      </svg>
    </div>
  );
}
