import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CelebrationPopup.css';

const CelebrationPopup = ({ show, message, onClose, language = 'en', type = 'success' }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const messages = {
    excellent: {
      en: 'Excellent!',
      ar: 'ممتاز!'
    },
    great: {
      en: 'Great Job!',
      ar: 'عمل رائع!'
    },
    wellDone: {
      en: 'Well Done!',
      ar: 'أحسنت!'
    },
    amazing: {
      en: 'Amazing!',
      ar: 'رائع!'
    },
    perfect: {
      en: 'Perfect!',
      ar: 'مثالي!'
    },
    keepGoing: {
      en: 'Keep Going!',
      ar: 'استمر!'
    }
  };

  const getRandomMessage = () => {
    const messageKeys = Object.keys(messages);
    const randomKey = messageKeys[Math.floor(Math.random() * messageKeys.length)];
    return messages[randomKey][language];
  };

  const displayMessage = message || getRandomMessage();

  // Generate random balloon positions
  const balloons = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 80 + 10}%`,
    delay: Math.random() * 0.5,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'][i]
  }));

  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.3,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'][i % 8],
    rotation: Math.random() * 360
  }));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="celebration-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Balloons */}
          {balloons.map(balloon => (
            <motion.div
              key={`balloon-${balloon.id}`}
              className="celebration-balloon"
              style={{
                left: balloon.left,
                backgroundColor: balloon.color
              }}
              initial={{ bottom: '-100px', opacity: 0 }}
              animate={{
                bottom: '120%',
                opacity: [0, 1, 1, 0],
                x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: balloon.delay,
                ease: 'easeOut'
              }}
            >
              <div className="balloon-string" style={{ backgroundColor: balloon.color }} />
            </motion.div>
          ))}

          {/* Confetti */}
          {confetti.map(piece => (
            <motion.div
              key={`confetti-${piece.id}`}
              className="celebration-confetti"
              style={{
                left: piece.left,
                backgroundColor: piece.color
              }}
              initial={{ top: '-20px', opacity: 1, rotate: 0 }}
              animate={{
                top: '120%',
                opacity: [1, 1, 0],
                rotate: piece.rotation + 720
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: piece.delay,
                ease: 'easeIn'
              }}
            />
          ))}

          {/* Stars */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="celebration-star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              initial={{ scale: 0, rotate: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 1],
                rotate: 360,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: Math.random() * 0.5,
                repeat: 1
              }}
            >
              ⭐
            </motion.div>
          ))}

          {/* Main Message Box */}
          <motion.div
            className="celebration-message-box"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="celebration-icon"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
            >
              🎉
            </motion.div>

            <motion.h2
              className="celebration-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {displayMessage}
            </motion.h2>

            <motion.div
              className="celebration-emoji-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {['🎈', '🌟', '✨', '🎊', '🎁'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="celebration-emoji"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>

            <motion.button
              className="celebration-close-btn"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {language === 'ar' ? 'استمر' : 'Continue'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationPopup;
