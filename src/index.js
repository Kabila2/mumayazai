// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

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
