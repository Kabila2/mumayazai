// src/components/PaperAirplaneTransition.js - Simple Welcome Aboard Transition
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaperAirplaneTransition = ({
  isTransitioning,
  fromMode,
  toMode,
  onTransitionComplete,
  children,
  reducedMotion = false,
  t = {},
  language = 'en'
}) => {
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    if (!isTransitioning) return;
    setShowTransition(true);

    // Show welcome message for exactly 3 seconds
    const timer = setTimeout(() => {
      setShowTransition(false);
      onTransitionComplete?.();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [isTransitioning, onTransitionComplete]);

  const TransitionOverlay = () => (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overflow: 'hidden'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Simple Welcome Message */}
      <motion.div
        style={{
          fontSize: '3rem',
          fontWeight: '700',
          color: 'white',
          textAlign: 'center',
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          fontFamily: "'Lexend', sans-serif"
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1
        }}
        transition={{
          duration: 0.5,
          ease: 'easeOut'
        }}
      >
        Welcome Aboard
      </motion.div>
    </motion.div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Main content with simple blur effect during transition */}
      <motion.div
        animate={{
          filter: showTransition ? 'blur(6px) brightness(0.4)' : 'blur(0px) brightness(1)',
          scale: showTransition ? 0.96 : 1,
          opacity: showTransition ? 0.8 : 1
        }}
        transition={{
          duration: reducedMotion ? 0.2 : 0.4,
          ease: 'easeInOut'
        }}
      >
        {children}
      </motion.div>

      {/* Transition overlay */}
      <AnimatePresence>
        {showTransition && <TransitionOverlay />}
      </AnimatePresence>
    </div>
  );
};

export default PaperAirplaneTransition;