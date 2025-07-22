import React from "react";
import { translations } from "../translations";

function LoginPage({ onSelectRole, language }) {
  const t = translations[language];

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>{t.chooseRole}</h2>
      <button onClick={() => onSelectRole("student")}>{t.student}</button>
      <button onClick={() => onSelectRole("parent")}>{t.parent}</button>
    </div>
  );
}

export default LoginPage;
