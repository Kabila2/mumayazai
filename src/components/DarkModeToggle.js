import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './DarkModeToggle.css';

const DarkModeToggle = ({ language = 'en' }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const translations = {
    en: {
      dark: 'Dark',
      light: 'Light'
    },
    ar: {
      dark: 'داكن',
      light: 'فاتح'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    // Load dark mode preference
    const savedMode = localStorage.getItem('mumayaz_dark_mode');
    const prefersDark = savedMode === 'true';
    setIsDarkMode(prefersDark);
    applyDarkMode(prefersDark);
  }, []);

  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('mumayaz_dark_mode', newMode.toString());
    applyDarkMode(newMode);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <motion.button
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDarkMode ? t.light : t.dark}
    >
      <motion.div
        className="toggle-icon"
        initial={false}
        animate={{
          rotate: isDarkMode ? 180 : 0,
          scale: isDarkMode ? 1 : 1
        }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {isDarkMode ? '🌙' : '☀️'}
      </motion.div>
    </motion.button>
  );
};

export default DarkModeToggle;
