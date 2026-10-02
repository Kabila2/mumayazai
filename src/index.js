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
// Reward effects read the design tokens, so they come after theme.css…
import './rewards-effects.css';
// …and high contrast redefines those tokens AND stands the effects down, so it
// has to come after both.
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

// Apply the saved dark-mode preference before the first paint. The toggle that
// owns this setting lives in the platform nav, so without this the login screen
// and a fresh reload would flash light until the nav mounted.
;(function applySavedTheme() {
  try {
    if (localStorage.getItem('stellar_dark_mode') === 'true') {
      document.documentElement.classList.add('dark-mode');
    }
  } catch {
    // localStorage unavailable — keep the default light theme.
  }
})();

// The AI assistant no longer needs a third-party script on the page: it goes
// through src/utils/aiClient.js, which picks its provider on the first request
// (your own backend, Anthropic directly, or the built-in offline tutor).

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
