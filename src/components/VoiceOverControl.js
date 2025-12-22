import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VoiceOverControl.css';

/**
 * Voice Over Control Component
 * Provides a floating button to toggle voice over on/off
 */
const VoiceOverControl = ({
  isEnabled,
  isSpeaking,
  onToggle,
  language = 'en',
  position = 'bottom-right',
  showLabel = true
}) => {
  const translations = {
    en: {
      voiceOver: 'Voice Over',
      enabled: 'On',
      disabled: 'Off',
      speaking: 'Speaking...'
    },
    ar: {
      voiceOver: 'التعليق الصوتي',
      enabled: 'مُفعّل',
      disabled: 'مُعطّل',
      speaking: 'يتحدث...'
    }
  };

  const t = translations[language] || translations.en;

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { bottom: '20px', right: '20px' };
    }
  };

  return (
    <motion.div
      className="voice-over-control"
      style={{
        position: 'fixed',
        zIndex: 999,
        ...getPositionStyles()
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <motion.button
        className={`voice-over-button ${isEnabled ? 'enabled' : 'disabled'} ${isSpeaking ? 'speaking' : ''}`}
        onClick={onToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={`${t.voiceOver}: ${isEnabled ? t.enabled : t.disabled}`}
      >
        <motion.div
          className="voice-icon"
          animate={isSpeaking ? {
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{
            repeat: isSpeaking ? Infinity : 0,
            duration: 1
          }}
        >
          {isEnabled ? '🔊' : '🔇'}
        </motion.div>

        <AnimatePresence>
          {showLabel && (
            <motion.span
              className="voice-label"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
            >
              {isSpeaking ? t.speaking : isEnabled ? t.enabled : t.disabled}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="speaking-indicator"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.5, 1] }}
            exit={{ scale: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VoiceOverControl;
