import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  isHighContrastEnabled,
  setHighContrast,
  HIGH_CONTRAST_EVENT
} from '../utils/highContrast';
import './HighContrastToggle.css';

const HighContrastToggle = ({ language = 'en' }) => {
  const [enabled, setEnabled] = useState(isHighContrastEnabled);

  const translations = {
    en: { on: 'High contrast on', off: 'High contrast off' },
    ar: { on: 'تباين عالٍ مُفعّل', off: 'تباين عالٍ مُعطّل' }
  };

  const t = translations[language] || translations.en;

  // Another screen (or a restored import) may flip it — stay in sync.
  useEffect(() => {
    const sync = () => setEnabled(isHighContrastEnabled());
    window.addEventListener(HIGH_CONTRAST_EVENT, sync);
    return () => window.removeEventListener(HIGH_CONTRAST_EVENT, sync);
  }, []);

  const toggle = () => {
    setEnabled(setHighContrast(!enabled));

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const label = enabled ? t.on : t.off;

  return (
    <motion.button
      className={`high-contrast-toggle ${enabled ? 'is-on' : ''}`}
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={label}
      aria-label={label}
      aria-pressed={enabled}
    >
      <span className="toggle-icon" aria-hidden="true">◐</span>
    </motion.button>
  );
};

export default HighContrastToggle;
