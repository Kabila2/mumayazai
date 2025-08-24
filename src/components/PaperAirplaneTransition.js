// src/components/PaperAirplaneTransition.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaperAirplaneTransition = ({ 
  isTransitioning, 
  fromMode, 
  toMode, 
  onTransitionComplete,
  children 
}) => {
  const [stage, setStage] = useState('idle'); // 'idle', 'folding', 'flying', 'unfolding'
  const [showAirplane, setShowAirplane] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      console.log(`✈️ Starting paper airplane transition: ${fromMode} → ${toMode}`);
      
      // Start the transition sequence
      setStage('folding');
      
      // Show airplane after folding starts
      setTimeout(() => {
        setShowAirplane(true);
        console.log('📄 Paper airplane appearing');
      }, 400);
      
      // Start flying after folding completes
      setTimeout(() => {
        setStage('flying');
        console.log('🚀 Paper airplane flying');
      }, 800);
      
      // Start unfolding after flying
      setTimeout(() => {
        setStage('unfolding');
        setShowAirplane(false);
        console.log('📖 Content unfolding');
      }, 1500);
      
      // Complete transition
      setTimeout(() => {
        setStage('idle');
        console.log('✅ Transition complete');
        onTransitionComplete?.();
      }, 2200);
    }
  }, [isTransitioning, fromMode, toMode, onTransitionComplete]);

  // Paper folding animation variants
  const foldingVariants = {
    idle: { 
      rotateY: 0, 
      rotateX: 0, 
      scale: 1, 
      opacity: 1,
      filter: 'brightness(1)',
      transformOrigin: 'center center',
      transition: { duration: 0 }
    },
    folding: {
      rotateY: [-15, -45, -90, -135, -180],
      rotateX: [0, -10, -20, -15, 0],
      scale: [1, 0.9, 0.7, 0.4, 0.2],
      opacity: [1, 0.9, 0.7, 0.4, 0],
      filter: [
        'brightness(1)', 
        'brightness(0.8)', 
        'brightness(0.6)', 
        'brightness(0.4)', 
        'brightness(0.2)'
      ],
      transformOrigin: 'center center',
      transition: { 
        duration: 0.8, 
        times: [0, 0.2, 0.5, 0.8, 1],
        ease: 'easeInOut'
      }
    },
    unfolding: {
      rotateY: [180, 135, 90, 45, 15, 0],
      rotateX: [0, 15, 20, 10, 0, 0],
      scale: [0.2, 0.4, 0.7, 0.9, 1, 1],
      opacity: [0, 0.4, 0.7, 0.9, 1, 1],
      filter: [
        'brightness(0.2)', 
        'brightness(0.4)', 
        'brightness(0.6)', 
        'brightness(0.8)', 
        'brightness(1)', 
        'brightness(1)'
      ],
      transformOrigin: 'center center',
      transition: { 
        duration: 0.7, 
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        ease: 'easeOut'
      }
    }
  };

  // Paper airplane SVG component
  const PaperAirplane = () => (
    <motion.div
      style={{
        position: 'fixed',
        left: '20%',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
      initial={{ 
        x: 0, 
        y: 0, 
        rotate: 0, 
        scale: 0.5, 
        opacity: 0 
      }}
      animate={{ 
        x: [0, 200, 400, 600, 800], 
        y: [0, -50, -20, -80, -30], 
        rotate: [0, 5, -3, 8, -2], 
        scale: [0.5, 0.8, 1.2, 1, 0.8], 
        opacity: [0, 1, 1, 1, 0] 
      }}
      exit={{ 
        x: 1000, 
        opacity: 0, 
        scale: 0.3 
      }}
      transition={{ 
        duration: 0.7, 
        times: [0, 0.2, 0.5, 0.8, 1],
        ease: 'easeInOut' 
      }}
    >
      <svg
        width="60"
        height="40"
        viewBox="0 0 60 40"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(138, 43, 226, 0.4))'
        }}
      >
        {/* Paper airplane body */}
        <path
          d="M5,20 L55,15 L50,20 L55,25 L5,20 Z"
          fill="url(#airplaneGradient)"
          stroke="rgba(138, 43, 226, 0.8)"
          strokeWidth="1"
        />
        {/* Top wing */}
        <path
          d="M5,20 L25,5 L50,20 L5,20 Z"
          fill="url(#wingGradient)"
          stroke="rgba(138, 43, 226, 0.6)"
          strokeWidth="0.5"
          opacity="0.8"
        />
        {/* Bottom wing */}
        <path
          d="M5,20 L25,35 L50,20 L5,20 Z"
          fill="url(#wingGradient)"
          stroke="rgba(138, 43, 226, 0.6)"
          strokeWidth="0.5"
          opacity="0.8"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="airplaneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8e2de2" />
            <stop offset="50%" stopColor="#4a00e0" />
            <stop offset="100%" stopColor="#667eea" />
          </linearGradient>
          <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Motion trails */}
      <motion.div
        style={{
          position: 'absolute',
          left: -20,
          top: '50%',
          width: 3,
          height: 20,
          background: 'linear-gradient(to bottom, rgba(138, 43, 226, 0.8), transparent)',
          transform: 'translateY(-50%)',
          borderRadius: '0 0 10px 10px'
        }}
        animate={{
          scaleY: [0.5, 1, 0.8, 1.2, 0.6],
          opacity: [0.3, 0.8, 0.6, 0.9, 0.2]
        }}
        transition={{ 
          duration: 0.7, 
          repeat: 0,
          ease: 'easeInOut' 
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          left: -35,
          top: '50%',
          width: 2,
          height: 15,
          background: 'linear-gradient(to bottom, rgba(138, 43, 226, 0.6), transparent)',
          transform: 'translateY(-50%)',
          borderRadius: '0 0 8px 8px'
        }}
        animate={{
          scaleY: [0.3, 0.8, 0.6, 1, 0.4],
          opacity: [0.2, 0.6, 0.4, 0.7, 0.1]
        }}
        transition={{ 
          duration: 0.7, 
          delay: 0.1,
          ease: 'easeInOut' 
        }}
      />
    </motion.div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Main content with folding animation */}
      <motion.div
        variants={foldingVariants}
        animate={stage}
        style={{
          width: '100%',
          height: '100%',
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        {children}
      </motion.div>

      {/* Paper airplane animation */}
      <AnimatePresence>
        {showAirplane && (
          <PaperAirplane key="airplane" />
        )}
      </AnimatePresence>

      {/* Fold lines overlay during transition */}
      <AnimatePresence>
        {stage === 'folding' && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1000
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Vertical fold lines */}
            {[0.25, 0.5, 0.75].map((position, index) => (
              <motion.div
                key={`v-fold-${index}`}
                style={{
                  position: 'absolute',
                  left: `${position * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: 'linear-gradient(to bottom, transparent, rgba(138, 43, 226, 0.4), transparent)',
                  transformOrigin: 'center',
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ 
                  scaleY: [0, 1, 0.8, 0], 
                  opacity: [0, 0.8, 0.6, 0] 
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.1,
                  times: [0, 0.3, 0.7, 1]
                }}
              />
            ))}
            
            {/* Diagonal fold lines */}
            {[0.2, 0.4, 0.6, 0.8].map((position, index) => (
              <motion.div
                key={`d-fold-${index}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: `${position * 100}%`,
                  width: '100%',
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, rgba(138, 43, 226, 0.3), transparent)',
                  transformOrigin: 'center',
                  transform: `rotate(${(index % 2) ? '2deg' : '-2deg'})`
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ 
                  scaleX: [0, 1, 0.9, 0], 
                  opacity: [0, 0.6, 0.4, 0] 
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.1 + 0.2,
                  times: [0, 0.3, 0.7, 1]
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkle effects during flight */}
      <AnimatePresence>
        {stage === 'flying' && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 999 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                style={{
                  position: 'absolute',
                  left: `${20 + (i * 10)}%`,
                  top: `${30 + (i % 3) * 15}%`,
                  width: '6px',
                  height: '6px',
                  background: 'radial-gradient(circle, #ffffff, rgba(138, 43, 226, 0.8))',
                  borderRadius: '50%',
                }}
                initial={{ scale: 0, opacity: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1.5, 1, 0],
                  opacity: [0, 1, 0.8, 0],
                  rotate: [0, 180, 360],
                  x: [0, 50, 100],
                  y: [0, -20, 10]
                }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.05,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Mode indicator during transition */}
      <AnimatePresence>
        {isTransitioning && stage !== 'idle' && (
          <motion.div
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(26, 0, 26, 0.95)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              zIndex: 10000,
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(138, 43, 226, 0.4)',
              boxShadow: '0 8px 32px rgba(138, 43, 226, 0.3)',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif"
            }}
            initial={{ y: -50, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              ✈️ Switching to {toMode === 'voice' ? 'Voice' : 'Text'} Mode...
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaperAirplaneTransition;