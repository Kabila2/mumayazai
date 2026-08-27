// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/opendyslexic'; // 400 normal
import '@fontsource/opendyslexic/700.css'; // 700 bold
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
// Unified design system — imported LAST so its tokens win over the older,
// conflicting :root blocks in the component stylesheets.
import './theme.css';
// High contrast redefines those same tokens, so it has to come after them.
import './high-contrast.css';

// One-time migration: the app was rebranded from "mumayaz" to "stellar" and
// its localStorage key prefix changed to match. Carry forward any data saved
// under the old prefix so existing users don't lose progress/sessions.
;(function migrateLegacyStorageKeys() {
  const OLD_PREFIX = 'mumayaz_';
  const NEW_PREFIX = 'stellar_';
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(OLD_PREFIX))
      .forEach((oldKey) => {
        const newKey = NEW_PREFIX + oldKey.slice(OLD_PREFIX.length);
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, localStorage.getItem(oldKey));
        }
        localStorage.removeItem(oldKey);
      });
  } catch {
    // localStorage unavailable (e.g. privacy mode) — nothing to migrate.
  }
})();

// Dynamically load Puter.js so `puter` is available globally
;(function loadPuter() {
  const script = document.createElement('script');
  script.src = 'https://js.puter.com/v2/';
  script.async = true;
  document.head.appendChild(script);
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results or send to an analytics endpoint: reportWebVitals(console.log)
reportWebVitals();
