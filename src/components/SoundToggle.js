import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { areSoundsEnabled, toggleSounds, playSuccessSound } from '../utils/soundEffects';
import './SoundToggle.css';

const SoundToggle = ({ language = 'en' }) => {
  const [soundsEnabled, setSoundsEnabled] = useState(areSoundsEnabled());

  const translations = {
    en: {
      enabled: 'Sound On',
      disabled: 'Sound Off'
    },
    ar: {
      enabled: 'الصوت مفعل',
      disabled: 'الصوت مغلق'
    }
  };

  const t = translations[language] || translations.en;

  const handleToggle = () => {
    const newState = toggleSounds();
    setSoundsEnabled(newState);

    // Play a test sound if enabling
    if (newState) {
      setTimeout(() => playSuccessSound(), 100);
    }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <motion.button
      className="sound-toggle"
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={soundsEnabled ? t.enabled : t.disabled}
    >
      <motion.div
        className="sound-icon"
        initial={false}
        animate={{
          scale: soundsEnabled ? 1 : 0.9,
          opacity: soundsEnabled ? 1 : 0.5
        }}
        transition={{ duration: 0.3 }}
      >
        {soundsEnabled ? '🔊' : '🔇'}
      </motion.div>
      <span className="sound-label">{soundsEnabled ? t.enabled : t.disabled}</span>
    </motion.button>
  );
};

export default SoundToggle;
