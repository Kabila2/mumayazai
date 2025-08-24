// src/components/PaperAirplaneTransition.js - Enhanced with Takeoff/Landing & Paper Crumpling
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaperAirplaneTransition = ({ 
  isTransitioning, 
  fromMode, 
  toMode, 
  onTransitionComplete,
  children 
}) => {
  const [stage, setStage] = useState('idle'); // 'idle', 'crumpling', 'takeoff', 'flying', 'landing', 'uncrumpling'
  const [showEffects, setShowEffects] = useState(false);
  const [showPlane, setShowPlane] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      console.log(`✈️ Enhanced transition: ${fromMode} → ${toMode}`);
      
      // Enhanced timing sequence with takeoff/landing
      setStage('crumpling');
      
      setTimeout(() => {
        setShowPlane(true);
        setStage('takeoff');
        console.log('🛫 Plane taking off');
      }, 800);
      
      setTimeout(() => {
        setShowEffects(true);
        setStage('flying');
        console.log('🚀 Flying with enhanced effects');
      }, 1600);
      
      setTimeout(() => {
        setStage('landing');
        console.log('🛬 Plane landing');
      }, 3000);
      
      setTimeout(() => {
        setShowPlane(false);
        setShowEffects(false);
        setStage('uncrumpling');
        console.log('📖 Uncrumpling with new content');
      }, 3800);
      
      setTimeout(() => {
        setStage('idle');
        console.log('✅ Enhanced transition complete');
        onTransitionComplete?.();
      }, 4400);
    }
  }, [isTransitioning, fromMode, toMode, onTransitionComplete]);

  // Enhanced content animation variants with crumpling effect
  const contentVariants = {
    idle: { 
      scale: 1, 
      opacity: 1,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      filter: 'brightness(1) blur(0px)',
      transition: { duration: 0.1 }
    },
    crumpling: {
      scale: [1, 0.98, 0.92, 0.85, 0.7, 0.4, 0.1],
      opacity: [1, 0.95, 0.85, 0.7, 0.5, 0.2, 0],
      rotateX: [0, 2, 8, 15, 25, 40, 60],
      rotateY: [0, -3, -8, -18, -35, -55, -80],
      rotateZ: [0, 1, 3, 8, 15, 25, 35],
      filter: [
        'brightness(1) blur(0px)', 
        'brightness(0.95) blur(0.3px)', 
        'brightness(0.85) blur(0.8px)', 
        'brightness(0.7) blur(1.5px)', 
        'brightness(0.5) blur(2.5px)', 
        'brightness(0.2) blur(4px)', 
        'brightness(0.1) blur(6px)'
      ],
      transition: { 
        duration: 0.8,
        times: [0, 0.1, 0.25, 0.45, 0.65, 0.85, 1],
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    uncrumpling: {
      scale: [0.1, 0.4, 0.7, 0.85, 0.92, 0.98, 1],
      opacity: [0, 0.2, 0.5, 0.7, 0.85, 0.95, 1],
      rotateX: [60, 40, 25, 15, 8, 2, 0],
      rotateY: [80, 55, 35, 18, 8, 3, 0],
      rotateZ: [35, 25, 15, 8, 3, 1, 0],
      filter: [
        'brightness(0.1) blur(6px)', 
        'brightness(0.2) blur(4px)', 
        'brightness(0.5) blur(2.5px)', 
        'brightness(0.7) blur(1.5px)', 
        'brightness(0.85) blur(0.8px)', 
        'brightness(0.95) blur(0.3px)', 
        'brightness(1) blur(0px)'
      ],
      transition: { 
        duration: 0.6,
        times: [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1],
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  // Enhanced Paper Airplane Component - BIGGER and more detailed
  const EnhancedPaperAirplane = () => {
    const stageAnimations = {
      takeoff: {
        x: [0, 50, 150, 300],
        y: [100, 50, -20, -80],
        rotate: [-15, -5, 5, 15],
        scale: [0.8, 1.0, 1.3, 1.6],
        opacity: [0, 0.7, 0.9, 1]
      },
      flying: {
        x: [300, 500, 750, 1000, 1250],
        y: [-80, -120, -100, -130, -110],
        rotate: [15, -8, 12, -10, 8],
        scale: [1.6, 1.8, 2.0, 1.8, 1.6],
        opacity: [1, 1, 1, 1, 1]
      },
      landing: {
        x: [1250, 1400, 1500, 1550],
        y: [-110, -60, -10, 50],
        rotate: [8, -5, -15, -25],
        scale: [1.6, 1.3, 1.0, 0.7],
        opacity: [1, 0.9, 0.7, 0]
      }
    };

    const currentAnimation = stageAnimations[stage] || stageAnimations.takeoff;
    const duration = stage === 'takeoff' ? 0.8 : stage === 'flying' ? 1.4 : 0.8;
    const times = stage === 'takeoff' ? [0, 0.3, 0.7, 1] : 
                  stage === 'flying' ? [0, 0.25, 0.5, 0.75, 1] :
                  [0, 0.3, 0.7, 1];

    return (
      <motion.div
        style={{
          position: 'fixed',
          left: '5%',
          top: '60%',
          transform: 'translateY(-50%)',
          zIndex: 9999,
          pointerEvents: 'none'
        }}
        initial={{ 
          x: 0, 
          y: 100, 
          rotate: -15, 
          scale: 0.8, 
          opacity: 0 
        }}
        animate={currentAnimation}
        transition={{ 
          duration,
          times,
          ease: stage === 'takeoff' ? "easeOut" : 
                stage === 'flying' ? "easeInOut" : 
                "easeIn"
        }}
      >
        {/* Enhanced SVG Airplane - MUCH BIGGER */}
        <svg
          width="160"
          height="100"
          viewBox="0 0 160 100"
          style={{
            filter: 'drop-shadow(0 8px 20px rgba(138, 43, 226, 0.8)) drop-shadow(0 4px 8px rgba(255, 255, 255, 0.4))'
          }}
        >
          {/* Main body with enhanced gradient */}
          <path
            d="M16,50 L136,36 L144,50 L136,64 L16,50 Z"
            fill="url(#enhancedBodyGradient)"
            stroke="rgba(138, 43, 226, 0.9)"
            strokeWidth="2.5"
          />
          
          {/* Top wing with more detail */}
          <path
            d="M16,50 L60,16 L130,50 L16,50 Z"
            fill="url(#topWingGradient)"
            stroke="rgba(76, 175, 80, 0.8)"
            strokeWidth="1.5"
            opacity="0.95"
          />
          
          {/* Bottom wing */}
          <path
            d="M16,50 L60,84 L130,50 L16,50 Z"
            fill="url(#bottomWingGradient)"
            stroke="rgba(76, 175, 80, 0.8)"
            strokeWidth="1.5"
            opacity="0.95"
          />
          
          {/* Enhanced nose with glow */}
          <circle
            cx="140"
            cy="50"
            r="5"
            fill="url(#noseGradient)"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="1"
          />
          
          {/* Wing fold lines for detail */}
          <path
            d="M40,50 L90,30"
            stroke="rgba(138, 43, 226, 0.6)"
            strokeWidth="1.2"
            strokeDasharray="3,3"
          />
          <path
            d="M40,50 L90,70"
            stroke="rgba(138, 43, 226, 0.6)"
            strokeWidth="1.2"
            strokeDasharray="3,3"
          />
          
          {/* Center line */}
          <path
            d="M16,50 L140,50"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="0.8"
            strokeDasharray="4,4"
          />
          
          {/* Enhanced gradients */}
          <defs>
            <linearGradient id="enhancedBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8e2de2" />
              <stop offset="25%" stopColor="#4a00e0" />
              <stop offset="50%" stopColor="#667eea" />
              <stop offset="75%" stopColor="#764ba2" />
              <stop offset="100%" stopColor="#f093fb" />
            </linearGradient>
            
            <linearGradient id="topWingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="30%" stopColor="rgba(138, 43, 226, 0.4)" />
              <stop offset="70%" stopColor="rgba(76, 175, 80, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.2)" />
            </linearGradient>
            
            <linearGradient id="bottomWingGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="30%" stopColor="rgba(76, 175, 80, 0.4)" />
              <stop offset="70%" stopColor="rgba(138, 43, 226, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
            </linearGradient>
            
            <radialGradient id="noseGradient">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#f093fb" />
              <stop offset="100%" stopColor="#8e2de2" />
            </radialGradient>
          </defs>
        </svg>
        
        {/* Enhanced motion trails - longer and more dramatic */}
        <motion.div
          style={{
            position: 'absolute',
            left: -40,
            top: '50%',
            width: 6,
            height: 50,
            background: 'linear-gradient(to bottom, rgba(138, 43, 226, 1), rgba(76, 175, 80, 0.7), rgba(255, 255, 255, 0.3), transparent)',
            transform: 'translateY(-50%)',
            borderRadius: '0 0 25px 25px'
          }}
          animate={{
            scaleY: [0.5, 1.8, 1.2, 2.0, 0.6],
            opacity: [0.3, 1, 0.8, 1, 0.2],
            x: [0, -8, -15, -12, -25],
            height: [30, 50, 40, 60, 25]
          }}
          transition={{ 
            duration: stage === 'flying' ? 1.4 : 0.8,
            ease: 'easeInOut' 
          }}
        />
        
        <motion.div
          style={{
            position: 'absolute',
            left: -70,
            top: '50%',
            width: 4,
            height: 40,
            background: 'linear-gradient(to bottom, rgba(76, 175, 80, 0.9), rgba(138, 43, 226, 0.6), rgba(255, 255, 255, 0.2), transparent)',
            transform: 'translateY(-50%)',
            borderRadius: '0 0 20px 20px'
          }}
          animate={{
            scaleY: [0.3, 1.5, 0.9, 1.7, 0.4],
            opacity: [0.2, 0.9, 0.6, 0.8, 0.1],
            x: [0, -5, -12, -18, -30],
            height: [25, 40, 30, 50, 20]
          }}
          transition={{ 
            duration: stage === 'flying' ? 1.4 : 0.8,
            delay: 0.1,
            ease: 'easeInOut' 
          }}
        />
        
        <motion.div
          style={{
            position: 'absolute',
            left: -100,
            top: '50%',
            width: 3,
            height: 30,
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.7), rgba(138, 43, 226, 0.4), transparent)',
            transform: 'translateY(-50%)',
            borderRadius: '0 0 15px 15px'
          }}
          animate={{
            scaleY: [0.2, 1.2, 0.7, 1.4, 0.3],
            opacity: [0.1, 0.7, 0.4, 0.6, 0.05],
            x: [0, -3, -10, -20, -35]
          }}
          transition={{ 
            duration: stage === 'flying' ? 1.4 : 0.8,
            delay: 0.2,
            ease: 'easeInOut' 
          }}
        />
        
        {/* Enhanced turbulence particles */}
        <motion.div
          style={{
            position: 'absolute',
            left: -120,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={`turbulence-${i}`}
              style={{
                position: 'absolute',
                left: i * -12,
                top: (i % 3) * 15 - 15,
                width: '5px',
                height: '5px',
                background: `rgba(${138 + i * 10}, ${43 + i * 8}, ${226 - i * 5}, ${1 - i * 0.08})`,
                borderRadius: '50%',
              }}
              animate={{
                scale: [0, 2, 1.2, 1.5, 0],
                opacity: [0, 1, 0.7, 0.4, 0],
                x: [0, -25, -50, -75, -100],
                y: [0, Math.sin(i * 0.5) * 12, Math.cos(i * 0.7) * 8, Math.sin(i + 2) * 6, 0]
              }}
              transition={{
                duration: stage === 'flying' ? 1.4 : 0.8,
                delay: i * 0.03,
                ease: 'easeOut'
              }}
            />
          ))}
        </motion.div>

        {/* Jet stream effect for flying stage */}
        {stage === 'flying' && (
          <motion.div
            style={{
              position: 'absolute',
              left: -200,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '200px',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.8), rgba(76, 175, 80, 0.6), transparent)',
              borderRadius: '2px'
            }}
            animate={{
              scaleX: [0, 1.5, 1, 1.8, 0.5],
              opacity: [0, 0.8, 1, 0.9, 0.3]
            }}
            transition={{
              duration: 1.4,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.div>
    );
  };

  // Enhanced Background Effects with sky/clouds
  const BackgroundEffects = () => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 998 }}>
      {/* Sky gradient during flight */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(135, 206, 235, 0.1), rgba(255, 255, 255, 0.05), transparent)',
          opacity: 0
        }}
        animate={{
          opacity: stage === 'flying' ? [0, 0.4, 0.6, 0.4, 0] : 0
        }}
        transition={{
          duration: stage === 'flying' ? 1.4 : 0.3,
          ease: 'easeInOut'
        }}
      />
      
      {/* Wind waves - more dramatic */}
      <motion.div
        style={{
          position: 'absolute',
          top: '25%',
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.1), rgba(76, 175, 80, 0.08), transparent)',
          opacity: 0.8
        }}
        animate={{
          scaleX: [0, 2, 1.5, 2.2, 0],
          x: ['-100%', '-20%', '30%', '80%', '150%'],
          opacity: [0, 0.4, 0.8, 0.6, 0]
        }}
        transition={{
          duration: stage === 'flying' ? 1.4 : 0.8,
          ease: 'easeInOut'
        }}
      />
      
      {/* Cloud particles during flight */}
      {stage === 'flying' && Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`cloud-${i}`}
          style={{
            position: 'absolute',
            left: `${5 + (i * 12)}%`,
            top: `${20 + (i % 3) * 20}%`,
            width: `${20 + i * 3}px`,
            height: `${15 + i * 2}px`,
            background: `radial-gradient(ellipse, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))`,
            borderRadius: '50px',
            opacity: 0
          }}
          animate={{
            opacity: [0, 0.6, 0.8, 0.4, 0],
            x: [0, 50, 120, 200, 300],
            scale: [0.8, 1, 1.2, 1, 0.8]
          }}
          transition={{
            duration: 1.4,
            delay: i * 0.1,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* Flying sparkles - more numerous */}
      {showEffects && Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          style={{
            position: 'absolute',
            left: `${5 + (i * 4.5)}%`,
            top: `${15 + (i % 5) * 14}%`,
            width: '6px',
            height: '6px',
            background: `radial-gradient(circle, #ffffff, rgba(${138 + i * 5}, ${43 + i * 8}, 226, 0.9))`,
            borderRadius: '50%',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 3, 2, 3.5, 0],
            opacity: [0, 0.9, 1, 0.7, 0],
            x: [0, 40, 100, 180, 300],
            y: [0, -20, 8, -30, 15],
            rotate: [0, 180, 360, 540, 720]
          }}
          transition={{
            duration: stage === 'flying' ? 1.4 : 0.8,
            delay: i * 0.02,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* Enhanced mode transition glow */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(138, 43, 226, 0.4), rgba(76, 175, 80, 0.3), transparent)',
          borderRadius: '50%'
        }}
        animate={{
          scale: [0, 3, 6, 8],
          opacity: [0, 0.7, 0.4, 0]
        }}
        transition={{
          duration: stage === 'flying' ? 1.4 : 0.8,
          ease: 'easeOut'
        }}
      />
    </div>
  );

  // Enhanced crumple grid effect
  const CrumpleEffect = () => (
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
      {/* Crumple lines - more chaotic */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`crumple-v-${i}`}
          style={{
            position: 'absolute',
            left: `${10 + (i * 11)}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            background: `linear-gradient(${45 + i * 15}deg, transparent, rgba(138, 43, 226, 0.7), rgba(76, 175, 80, 0.5), transparent)`,
            transform: `rotate(${-5 + i * 2}deg)`,
            transformOrigin: 'center'
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ 
            scaleY: [0, 1.5, 1.2, 0.8, 0], 
            opacity: [0, 0.9, 1, 0.7, 0],
            rotate: [-5 + i * 2, -10 + i * 3, 5 + i * 2, -5 + i * 2]
          }}
          transition={{ 
            duration: 0.8, 
            delay: i * 0.06,
            times: [0, 0.3, 0.6, 0.85, 1]
          }}
        />
      ))}
      
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={`crumple-h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            top: `${15 + (i * 14)}%`,
            width: '100%',
            height: '2px',
            background: `linear-gradient(${-30 + i * 20}deg, transparent, rgba(76, 175, 80, 0.6), rgba(138, 43, 226, 0.6), transparent)`,
            transform: `rotate(${(i % 2 ? 2 : -2) + i}deg)`
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ 
            scaleX: [0, 1.3, 1.1, 0.9, 0], 
            opacity: [0, 0.8, 0.9, 0.6, 0],
            rotate: [(i % 2 ? 2 : -2) + i, (i % 2 ? -3 : 3) + i, (i % 2 ? 2 : -2) + i]
          }}
          transition={{ 
            duration: 0.8, 
            delay: i * 0.04 + 0.2,
            times: [0, 0.35, 0.6, 0.8, 1]
          }}
        />
      ))}
      
      {/* Random crumple spots */}
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={`crumple-spot-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            width: `${8 + Math.random() * 12}px`,
            height: `${8 + Math.random() * 12}px`,
            background: `radial-gradient(circle, rgba(138, 43, 226, 0.4), transparent)`,
            borderRadius: '50%'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 2 + Math.random(), 1.5 + Math.random(), 0],
            opacity: [0, 0.7, 0.5, 0]
          }}
          transition={{
            duration: 0.8,
            delay: Math.random() * 0.4,
            ease: 'easeOut'
          }}
        />
      ))}
    </motion.div>
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
          perspective: '1500px',
          transformStyle: 'preserve-3d'
        }}
      >
        {children}
      </motion.div>

      {/* Enhanced paper airplane */}
      <AnimatePresence>
        {showPlane && (
          <EnhancedPaperAirplane key="enhanced-airplane" />
        )}
      </AnimatePresence>

      {/* Background effects */}
      <AnimatePresence>
        {(showEffects || stage === 'flying') && (
          <BackgroundEffects key="bg-effects" />
        )}
      </AnimatePresence>

      {/* Enhanced crumple grid during crumpling */}
      <AnimatePresence>
        {(stage === 'crumpling' || stage === 'uncrumpling') && (
          <CrumpleEffect key="crumple-effect" />
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
              padding: '18px 36px',
              borderRadius: '30px',
              fontSize: '17px',
              fontWeight: '700',
              zIndex: 10000,
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(138, 43, 226, 0.6)',
              boxShadow: '0 15px 50px rgba(138, 43, 226, 0.5), 0 6px 15px rgba(0, 0, 0, 0.4)',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif"
            }}
            initial={{ y: -100, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.7 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 0.5
            }}
          >
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
            >
              <motion.span
                animate={{ 
                  rotate: stage === 'takeoff' ? [0, 15, -10, 0] : 
                           stage === 'flying' ? [0, 10, -10, 10, 0] :
                           stage === 'landing' ? [0, -15, 5, 0] :
                           [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: stage === 'flying' ? 0.8 : 0.6, 
                  repeat: stage === 'flying' ? Infinity : 1,
                  ease: 'easeInOut' 
                }}
                style={{ fontSize: '1.2em' }}
              >
                {stage === 'crumpling' ? '📄' : 
                 stage === 'takeoff' ? '🛫' :
                 stage === 'flying' ? '✈️' :
                 stage === 'landing' ? '🛬' :
                 stage === 'uncrumpling' ? '📖' : '✈️'}
              </motion.span>
              <motion.span
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {stage === 'crumpling' ? 'Crumpling page...' :
                 stage === 'takeoff' ? 'Taking off...' :
                 stage === 'flying' ? `Flying to ${toMode === 'voice' ? '🎤 Voice' : '💬 Text'} Mode` :
                 stage === 'landing' ? 'Landing...' :
                 stage === 'uncrumpling' ? 'Uncrumpling new page...' :
                 `Switching to ${toMode === 'voice' ? '🎤 Voice' : '💬 Text'} Mode`}
              </motion.span>
              <motion.div
                style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: stage === 'flying' ? '#4CAF50' : 
                             stage === 'takeoff' ? '#FF9800' :
                             stage === 'landing' ? '#2196F3' :
                             '#8e2de2'
                }}
                animate={{ 
                  scale: [1, 1.8, 1], 
                  opacity: [0.6, 1, 0.6] 
                }}
                transition={{ 
                  duration: stage === 'flying' ? 1.0 : 0.8, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Runway lights during takeoff/landing */}
      <AnimatePresence>
        {(stage === 'takeoff' || stage === 'landing') && (
          <motion.div
            style={{
              position: 'fixed',
              bottom: '20%',
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), rgba(138, 43, 226, 0.2), rgba(76, 175, 80, 0.2), rgba(255, 255, 255, 0.1), transparent)',
              zIndex: 997
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ 
              opacity: [0, 0.8, 1, 0.8, 0],
              scaleY: [0, 1, 1.2, 1, 0]
            }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ 
              duration: stage === 'takeoff' ? 0.8 : 0.8,
              ease: 'easeInOut'
            }}
          >
            {/* Runway lights */}
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div
                key={`runway-light-${i}`}
                style={{
                  position: 'absolute',
                  left: `${8 + (i * 7)}%`,
                  top: '-4px',
                  width: '8px',
                  height: '12px',
                  background: i % 2 === 0 ? 
                    'radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(138, 43, 226, 0.3))' :
                    'radial-gradient(circle, rgba(76, 175, 80, 0.9), rgba(255, 255, 255, 0.3))',
                  borderRadius: '50%'
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                  y: [0, -2, 0]
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  repeat: stage === 'takeoff' || stage === 'landing' ? Infinity : 0,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paper texture overlay during crumpling */}
      <AnimatePresence>
        {(stage === 'crumpling' || stage === 'uncrumpling') && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                radial-gradient(circle at 80% 70%, rgba(138, 43, 226, 0.03) 1px, transparent 1px),
                radial-gradient(circle at 40% 80%, rgba(76, 175, 80, 0.02) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px, 40px 40px, 35px 35px',
              opacity: 0,
              zIndex: 999,
              pointerEvents: 'none'
            }}
            animate={{
              opacity: stage === 'crumpling' ? [0, 0.4, 0.6, 0] : [0, 0.6, 0.4, 0]
            }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut'
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaperAirplaneTransition;