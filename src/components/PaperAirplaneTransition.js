// src/components/PaperAirplaneTransition.js - Enhanced Version
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaperAirplaneTransition = ({ 
  isTransitioning, 
  fromMode, 
  toMode, 
  onTransitionComplete,
  children 
}) => {
  const [stage, setStage] = useState('idle'); // 'idle', 'shrinking', 'flying', 'expanding'
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      console.log(`✈️ Enhanced transition: ${fromMode} → ${toMode}`);
      
      // Enhanced timing sequence
      setStage('shrinking');
      
      setTimeout(() => {
        setShowEffects(true);
        setStage('flying');
        console.log('🚀 Flying with enhanced effects');
      }, 600);
      
      setTimeout(() => {
        setStage('expanding');
        setShowEffects(false);
        console.log('📖 Expanding with new content');
      }, 1400);
      
      setTimeout(() => {
        setStage('idle');
        console.log('✅ Enhanced transition complete');
        onTransitionComplete?.();
      }, 2100);
    }
  }, [isTransitioning, fromMode, toMode, onTransitionComplete]);

  // Enhanced content animation variants
  const contentVariants = {
    idle: { 
      scale: 1, 
      opacity: 1,
      rotateY: 0,
      rotateX: 0,
      filter: 'brightness(1) blur(0px)',
      transition: { duration: 0.1 }
    },
    shrinking: {
      scale: [1, 0.95, 0.85, 0.7, 0.4, 0.1],
      opacity: [1, 0.9, 0.8, 0.6, 0.3, 0],
      rotateY: [0, -5, -15, -30, -60, -90],
      rotateX: [0, 5, 15, 25, 35, 45],
      filter: [
        'brightness(1) blur(0px)', 
        'brightness(0.9) blur(0.5px)', 
        'brightness(0.8) blur(1px)', 
        'brightness(0.6) blur(2px)', 
        'brightness(0.4) blur(3px)', 
        'brightness(0.2) blur(4px)'
      ],
      transition: { 
        duration: 0.6,
        times: [0, 0.15, 0.35, 0.55, 0.8, 1],
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    expanding: {
      scale: [0.1, 0.4, 0.7, 0.85, 0.95, 1],
      opacity: [0, 0.3, 0.6, 0.8, 0.9, 1],
      rotateY: [90, 60, 30, 15, 5, 0],
      rotateX: [-45, -35, -25, -15, -5, 0],
      filter: [
        'brightness(0.2) blur(4px)', 
        'brightness(0.4) blur(3px)', 
        'brightness(0.6) blur(2px)', 
        'brightness(0.8) blur(1px)', 
        'brightness(0.9) blur(0.5px)', 
        'brightness(1) blur(0px)'
      ],
      transition: { 
        duration: 0.7,
        times: [0, 0.2, 0.45, 0.65, 0.85, 1],
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  // Enhanced Paper Airplane Component
  const EnhancedPaperAirplane = () => (
    <motion.div
      style={{
        position: 'fixed',
        left: '15%',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
      initial={{ 
        x: -100, 
        y: 20, 
        rotate: -10, 
        scale: 0.3, 
        opacity: 0 
      }}
      animate={{ 
        x: [0, 150, 350, 550, 750, 950], 
        y: [0, -30, -60, -40, -20, -10], 
        rotate: [-10, 5, -8, 12, -5, 8], 
        scale: [0.5, 0.8, 1.2, 1.4, 1.1, 0.6], 
        opacity: [0, 0.8, 1, 1, 0.8, 0] 
      }}
      exit={{ 
        x: 1200, 
        y: -100,
        opacity: 0, 
        scale: 0.2,
        rotate: 45
      }}
      transition={{ 
        duration: 0.8, 
        times: [0, 0.15, 0.35, 0.55, 0.75, 1],
        ease: "easeInOut"
      }}
    >
      {/* Enhanced SVG Airplane */}
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 50"
        style={{
          filter: 'drop-shadow(0 6px 12px rgba(138, 43, 226, 0.6)) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))'
        }}
      >
        {/* Main body with gradient */}
        <path
          d="M8,25 L68,18 L72,25 L68,32 L8,25 Z"
          fill="url(#enhancedBodyGradient)"
          stroke="rgba(138, 43, 226, 0.9)"
          strokeWidth="1.5"
        />
        
        {/* Top wing with more detail */}
        <path
          d="M8,25 L30,8 L65,25 L8,25 Z"
          fill="url(#topWingGradient)"
          stroke="rgba(76, 175, 80, 0.7)"
          strokeWidth="1"
          opacity="0.9"
        />
        
        {/* Bottom wing */}
        <path
          d="M8,25 L30,42 L65,25 L8,25 Z"
          fill="url(#bottomWingGradient)"
          stroke="rgba(76, 175, 80, 0.7)"
          strokeWidth="1"
          opacity="0.9"
        />
        
        {/* Nose detail */}
        <circle
          cx="70"
          cy="25"
          r="3"
          fill="url(#noseGradient)"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="0.5"
        />
        
        {/* Wing fold lines for detail */}
        <path
          d="M20,25 L45,15"
          stroke="rgba(138, 43, 226, 0.4)"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />
        <path
          d="M20,25 L45,35"
          stroke="rgba(138, 43, 226, 0.4)"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />
        
        {/* Enhanced gradients */}
        <defs>
          <linearGradient id="enhancedBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8e2de2" />
            <stop offset="30%" stopColor="#4a00e0" />
            <stop offset="70%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
          
          <linearGradient id="topWingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(138, 43, 226, 0.3)" />
            <stop offset="100%" stopColor="rgba(76, 175, 80, 0.2)" />
          </linearGradient>
          
          <linearGradient id="bottomWingGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="50%" stopColor="rgba(138, 43, 226, 0.2)" />
            <stop offset="100%" stopColor="rgba(76, 175, 80, 0.3)" />
          </linearGradient>
          
          <radialGradient id="noseGradient">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#8e2de2" />
          </radialGradient>
        </defs>
      </svg>
      
      {/* Enhanced motion trails */}
      <motion.div
        style={{
          position: 'absolute',
          left: -25,
          top: '50%',
          width: 4,
          height: 30,
          background: 'linear-gradient(to bottom, rgba(138, 43, 226, 0.9), rgba(76, 175, 80, 0.5), transparent)',
          transform: 'translateY(-50%)',
          borderRadius: '0 0 15px 15px'
        }}
        animate={{
          scaleY: [0.3, 1.2, 0.8, 1.5, 0.4],
          opacity: [0.2, 0.9, 0.7, 1, 0.1],
          x: [0, -5, -10, -8, -15]
        }}
        transition={{ 
          duration: 0.8, 
          ease: 'easeInOut' 
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          left: -45,
          top: '50%',
          width: 3,
          height: 25,
          background: 'linear-gradient(to bottom, rgba(76, 175, 80, 0.7), rgba(138, 43, 226, 0.4), transparent)',
          transform: 'translateY(-50%)',
          borderRadius: '0 0 12px 12px'
        }}
        animate={{
          scaleY: [0.2, 1, 0.6, 1.2, 0.3],
          opacity: [0.1, 0.7, 0.5, 0.8, 0.05],
          x: [0, -3, -8, -12, -20]
        }}
        transition={{ 
          duration: 0.8, 
          delay: 0.1,
          ease: 'easeInOut' 
        }}
      />
      
      {/* Turbulence particles */}
      <motion.div
        style={{
          position: 'absolute',
          left: -60,
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <motion.div
            key={`turbulence-${i}`}
            style={{
              position: 'absolute',
              left: i * -8,
              top: (i % 2) * 10 - 5,
              width: '3px',
              height: '3px',
              background: `rgba(${138 + i * 20}, ${43 + i * 15}, 226, ${0.8 - i * 0.1})`,
              borderRadius: '50%',
            }}
            animate={{
              scale: [0, 1.5, 0.8, 1, 0],
              opacity: [0, 0.9, 0.6, 0.3, 0],
              x: [0, -15, -30, -45, -60],
              y: [0, Math.sin(i) * 8, Math.cos(i) * 6, Math.sin(i + 1) * 4, 0]
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.05,
              ease: 'easeOut'
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );

  // Enhanced Background Effects
  const BackgroundEffects = () => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 998 }}>
      {/* Wind waves */}
      <motion.div
        style={{
          position: 'absolute',
          top: '30%',
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.05), transparent)',
          opacity: 0.6
        }}
        animate={{
          scaleX: [0, 1.5, 1, 1.2, 0],
          x: ['-100%', '0%', '20%', '50%', '100%'],
          opacity: [0, 0.3, 0.6, 0.4, 0]
        }}
        transition={{
          duration: 0.8,
          ease: 'easeInOut'
        }}
      />
      
      {/* Flying sparkles */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`bg-sparkle-${i}`}
          style={{
            position: 'absolute',
            left: `${10 + (i * 7)}%`,
            top: `${25 + (i % 4) * 12.5}%`,
            width: '4px',
            height: '4px',
            background: `radial-gradient(circle, #ffffff, rgba(${138 + i * 8}, ${43 + i * 12}, 226, 0.8))`,
            borderRadius: '50%',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 2, 1.5, 2.5, 0],
            opacity: [0, 0.8, 1, 0.6, 0],
            x: [0, 30, 80, 150, 250],
            y: [0, -15, 5, -25, 10],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.03,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* Mode transition glow */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(138, 43, 226, 0.3), rgba(76, 175, 80, 0.2), transparent)',
          borderRadius: '50%'
        }}
        animate={{
          scale: [0, 2, 4, 6],
          opacity: [0, 0.6, 0.3, 0]
        }}
        transition={{
          duration: 0.8,
          ease: 'easeOut'
        }}
      />
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Main content with enhanced animation */}
      <motion.div
        variants={contentVariants}
        animate={stage}
        style={{
          width: '100%',
          height: '100%',
          perspective: '1200px',
          transformStyle: 'preserve-3d'
        }}
      >
        {children}
      </motion.div>

      {/* Enhanced paper airplane */}
      <AnimatePresence>
        {showEffects && (
          <EnhancedPaperAirplane key="enhanced-airplane" />
        )}
      </AnimatePresence>

      {/* Background effects */}
      <AnimatePresence>
        {showEffects && (
          <BackgroundEffects key="bg-effects" />
        )}
      </AnimatePresence>

      {/* Enhanced fold grid during shrinking */}
      <AnimatePresence>
        {stage === 'shrinking' && (
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
            transition={{ duration: 0.2 }}
          >
            {/* Enhanced fold grid */}
            {Array.from({ length: 5 }, (_, i) => (
              <motion.div
                key={`v-fold-${i}`}
                style={{
                  position: 'absolute',
                  left: `${(i + 1) * 16.66}%`,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  background: 'linear-gradient(to bottom, transparent, rgba(138, 43, 226, 0.6), rgba(76, 175, 80, 0.4), transparent)',
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ 
                  scaleY: [0, 1.2, 1, 0.8, 0], 
                  opacity: [0, 0.8, 1, 0.6, 0] 
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.08,
                  times: [0, 0.2, 0.5, 0.8, 1]
                }}
              />
            ))}
            
            {Array.from({ length: 4 }, (_, i) => (
              <motion.div
                key={`h-fold-${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: `${(i + 1) * 20}%`,
                  width: '100%',
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, rgba(76, 175, 80, 0.5), rgba(138, 43, 226, 0.5), transparent)',
                  transform: `rotate(${(i % 2) ? '1deg' : '-1deg'})`
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ 
                  scaleX: [0, 1.1, 1, 0.9, 0], 
                  opacity: [0, 0.7, 0.9, 0.5, 0] 
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.05 + 0.15,
                  times: [0, 0.25, 0.5, 0.75, 1]
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced status indicator */}
      <AnimatePresence>
        {isTransitioning && stage !== 'idle' && (
          <motion.div
            style={{
              position: 'fixed',
              top: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, rgba(26, 0, 26, 0.95), rgba(16, 0, 16, 0.9))',
              color: '#ffffff',
              padding: '16px 32px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              zIndex: 10000,
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(138, 43, 226, 0.5)',
              boxShadow: '0 12px 40px rgba(138, 43, 226, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif"
            }}
            initial={{ y: -80, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 0.4
            }}
          >
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                ✈️
              </motion.span>
              <motion.span
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              >
                Switching to {toMode === 'voice' ? '🎤 Voice' : '💬 Text'} Mode
              </motion.span>
              <motion.div
                style={{ 
                  width: '4px', 
                  height: '4px', 
                  borderRadius: '50%', 
                  background: '#4CAF50' 
                }}
                animate={{ 
                  scale: [1, 1.5, 1], 
                  opacity: [0.5, 1, 0.5] 
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaperAirplaneTransition;