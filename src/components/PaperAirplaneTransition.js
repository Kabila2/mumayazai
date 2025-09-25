// src/components/PaperAirplaneTransition.js - Enhanced Mode Switching Transition
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
  const [animationPhase, setAnimationPhase] = useState('entering'); // 'entering', 'flying', 'exiting'

  useEffect(() => {
    if (!isTransitioning) return;
    setShowTransition(true);
    setAnimationPhase('entering');

    // Phase timing: entering -> flying -> exiting
    const enterTimer = setTimeout(() => setAnimationPhase('flying'), 800);
    const flyTimer = setTimeout(() => setAnimationPhase('exiting'), 1800);
    const exitTimer = setTimeout(() => {
      setShowTransition(false);
      onTransitionComplete?.();
    }, 2600);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(flyTimer);
      clearTimeout(exitTimer);
    };
  }, [isTransitioning, onTransitionComplete]);

  // Get transition text based on mode switching
  const getTransitionText = () => {
    if (toMode === 'voice') {
      return language === 'ar' ? 'التبديل إلى الصوت' : 'Switching to Voice';
    } else if (toMode === 'text') {
      return language === 'ar' ? 'التبديل إلى النص' : 'Switching to Text';
    }
    return language === 'ar' ? 'مرحباً بك' : 'Welcome Aboard';
  };

  const TransitionOverlay = () => (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: toMode === 'voice'
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        overflow: 'hidden'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated clouds background */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: '120px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50px',
          filter: 'blur(2px)'
        }}
        animate={{
          x: [0, 200, 400],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          ease: 'easeInOut',
          times: [0, 0.5, 1]
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '60%',
          right: '-5%',
          width: '80px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '30px',
          filter: 'blur(1px)'
        }}
        animate={{
          x: [-300, -100, 100],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 2.5,
          ease: 'easeInOut',
          delay: 0.5
        }}
      />

      {/* Paper airplane animation */}
      <motion.div
        style={{
          position: 'absolute',
          fontSize: '4rem',
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
        }}
        initial={{
          x: -100,
          y: 50,
          rotate: -15,
          scale: 0.8,
          opacity: 0
        }}
        animate={animationPhase === 'entering' ? {
          x: -50,
          y: 20,
          rotate: -10,
          scale: 1,
          opacity: 1
        } : animationPhase === 'flying' ? {
          x: [null, 100, 300, 500],
          y: [null, -20, -40, -80],
          rotate: [null, 5, 15, 25],
          scale: [null, 1.1, 1.2, 0.6],
          opacity: [null, 1, 0.8, 0]
        } : {
          x: 600,
          y: -100,
          rotate: 30,
          scale: 0.4,
          opacity: 0
        }}
        transition={animationPhase === 'flying' ? {
          duration: 1.2,
          ease: [0.25, 0.1, 0.25, 1],
          times: [0, 0.3, 0.7, 1]
        } : {
          duration: reducedMotion ? 0.3 : 0.8,
          ease: 'easeOut'
        }}
      >
        ✈️
      </motion.div>

      {/* Enhanced transition text */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          color: 'white',
          fontFamily: "'Lexend', sans-serif"
        }}
      >
        <motion.div
          style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            textShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.9
          }}
          animate={animationPhase === 'entering' ? {
            opacity: 1,
            y: 0,
            scale: 1
          } : animationPhase === 'flying' ? {
            opacity: [null, 1, 1, 0.8],
            y: [null, -10, -20, -30],
            scale: [null, 1.05, 1.1, 1]
          } : {
            opacity: 0,
            y: -50,
            scale: 0.95
          }}
          transition={{
            duration: reducedMotion ? 0.3 : 0.8,
            ease: 'easeOut',
            delay: animationPhase === 'entering' ? 0.2 : 0
          }}
        >
          {getTransitionText()}
        </motion.div>

        {/* Animated subtitle */}
        <motion.div
          style={{
            fontSize: '1.2rem',
            fontWeight: '500',
            opacity: 0.9,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={animationPhase === 'entering' ? {
            opacity: 0.9,
            y: 0
          } : animationPhase === 'flying' ? {
            opacity: [null, 0.9, 0.7, 0.5],
            y: [null, -5, -10, -15]
          } : {
            opacity: 0,
            y: -20
          }}
          transition={{
            duration: reducedMotion ? 0.2 : 0.6,
            ease: 'easeOut',
            delay: animationPhase === 'entering' ? 0.5 : 0.1
          }}
        >
          {language === 'ar' ? '✨ تجربة محسّنة' : '✨ Enhanced Experience'}
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 100%)',
              borderRadius: '2px'
            }}
            initial={{ x: '-100%', width: '50%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 2.2,
              ease: 'easeInOut',
              delay: 0.4
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Main content with enhanced effects during transition */}
      <motion.div
        animate={showTransition ? {
          filter: 'blur(8px) brightness(0.3) contrast(0.8)',
          scale: 0.94,
          opacity: 0.6,
          rotateX: 2,
          rotateY: 1
        } : {
          filter: 'blur(0px) brightness(1) contrast(1)',
          scale: 1,
          opacity: 1,
          rotateX: 0,
          rotateY: 0
        }}
        transition={{
          duration: reducedMotion ? 0.3 : 0.6,
          ease: [0.25, 0.1, 0.25, 1]
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