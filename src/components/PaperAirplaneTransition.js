// src/components/PaperAirplaneTransition.js - Enhanced Professional Transition with Swoosh-off
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
  const [stage, setStage] = useState('idle');
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    if (!isTransitioning) return;
    setStage('takeoff');
    setShowTransition(true);

    // 3 stages: takeoff → flying → landing
    const t1 = setTimeout(() => setStage('flying'), reducedMotion ? 300 : 600);
    const t2 = setTimeout(() => setStage('landing'), reducedMotion ? 600 : 1200);
    const t3 = setTimeout(() => {
      setShowTransition(false);
      setStage('idle');
      onTransitionComplete?.();
    }, reducedMotion ? 900 : 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isTransitioning, onTransitionComplete, reducedMotion]);

  // Horizontal airplane with takeoff/landing
  const HorizontalAirplane = ({ stage }) => {
    return (
      <motion.div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Runway for takeoff/landing */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '50%',
            width: '400px',
            height: '6px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
            borderRadius: '3px',
            transform: 'translateX(-50%)',
            zIndex: -2
          }}
          animate={{
            opacity: stage === 'takeoff' || stage === 'landing' ? 1 : 0,
            scaleX: stage === 'takeoff' ? [0.5, 1] : stage === 'landing' ? [1, 0.5] : 1
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut'
          }}
        />

        {/* Contrail effect - only during flight */}
        <motion.div
          style={{
            position: 'absolute',
            left: '20%',
            top: '50%',
            width: '200px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)',
            borderRadius: '1.5px',
            transform: 'translateY(-50%)',
            transformOrigin: 'left center',
            zIndex: -1
          }}
          animate={{
            opacity: stage === 'flying' ? [0, 1] : 0,
            scaleX: stage === 'flying' ? [0, 2.5] : 0
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut'
          }}
        />

        {/* Airplane emoji */}
        <motion.div
          style={{
            fontSize: '80px',
            filter: 'drop-shadow(0 6px 16px rgba(255, 255, 255, 0.4))',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          animate={{
            // Slight rotation for banking during flight
            rotate: stage === 'takeoff' ? [0, 2, 0] :
                   stage === 'flying' ? [0, -1, 1, 0] :
                   stage === 'landing' ? [0, -2, -3] : 0,

            // Scale changes
            scale: stage === 'takeoff' ? [0.7, 1.2, 1] :
                   stage === 'flying' ? [1, 1.1, 1] :
                   stage === 'landing' ? [1, 0.8, 0.3] : 1,

            // Horizontal movement
            x: stage === 'takeoff' ? [0, -10, 0] :
               stage === 'flying' ? [0, 5, -5, 0] :
               stage === 'landing' ? [0, 100, 250] : 0,

            // Vertical movement
            y: stage === 'takeoff' ? [30, -20, -10] :
               stage === 'flying' ? [-10, -20, -15, -18] :
               stage === 'landing' ? [-18, 5, 60] : 0,

            // Opacity
            opacity: stage === 'takeoff' ? [0.5, 1] :
                    stage === 'flying' ? 1 :
                    stage === 'landing' ? [1, 1, 0] : 1
          }}
          transition={{
            duration: stage === 'takeoff' ? 0.6 :
                     stage === 'flying' ? 0.6 :
                     stage === 'landing' ? 0.6 : 0.4,
            ease: stage === 'takeoff' ? [0.25, 0.46, 0.45, 0.94] :
                  stage === 'flying' ? [0.25, 0.46, 0.45, 0.94] :
                  stage === 'landing' ? [0.55, 0.055, 0.675, 0.19] : 'easeInOut'
          }}
        >
          ✈️
        </motion.div>

        {/* Takeoff dust clouds */}
        {stage === 'takeoff' && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 0
            }}
          >
            {Array.from({ length: 4 }, (_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${15 + i * 5}px`,
                  height: `${10 + i * 3}px`,
                  background: `rgba(255, 255, 255, ${0.6 - i * 0.1})`,
                  borderRadius: '50%',
                  left: `${-30 + i * 15}px`,
                  bottom: '0px'
                }}
                animate={{
                  y: [0, -20, -40],
                  x: [0, Math.random() * 20 - 10],
                  scale: [0.3, 1, 0],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Landing approach lines */}
        {stage === 'landing' && (
          <motion.div
            style={{
              position: 'absolute',
              right: '-100px',
              top: '-30px',
              zIndex: 0
            }}
          >
            {Array.from({ length: 3 }, (_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${120 + i * 20}px`,
                  height: '1px',
                  background: `rgba(255, 255, 255, ${0.5 - i * 0.1})`,
                  borderRadius: '0.5px',
                  top: `${i * 12}px`,
                  right: '0px'
                }}
                animate={{
                  x: [100, -200],
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Simple background particles
  const BackgroundParticles = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${60 + i * 40}px`,
            height: `${60 + i * 40}px`,
            border: '2px solid',
            borderColor: `rgba(255, 255, 255, ${0.4 - i * 0.05})`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [0, 2.5],
            opacity: [0.4 - i * 0.05, 0],
            borderWidth: [2, 0]
          }}
          transition={{
            duration: reducedMotion ? 0.4 : 0.8,
            delay: i * 0.1,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );

  // Landing particle burst
  const ParticleBurst = ({ stage }) => (
    <>
      {stage === 'landing' && Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60) * Math.PI / 180;
        const distance = 80 + Math.random() * 40;

        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '4px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1.2, 0],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              ease: 'easeOut'
            }}
          />
        );
      })}
    </>
  );

  // Removed - not needed for simple 2-scene transition

  // Background gradients for takeoff/flying/landing
  const backgroundVariants = {
    takeoff: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    flying: 'linear-gradient(135deg, #764ba2 0%, #4facfe 100%)',
    landing: 'linear-gradient(135deg, #43e97b 0%, #ffffff 100%)'
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
        background: backgroundVariants[stage] || backgroundVariants.takeoff,
        overflow: 'hidden'
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        background: backgroundVariants[stage] || backgroundVariants.takeoff
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background particles */}
      <BackgroundParticles />

      {/* Particle burst */}
      <ParticleBurst stage={stage} />

      {/* Central content */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          color: stage === 'landing' ? '#333333' : '#ffffff',
          textAlign: 'center',
          zIndex: 1,
          direction: language === 'ar' ? 'rtl' : 'ltr'
        }}
        animate={{
          scale: stage === 'landing' ? [1, 0.9] : 1,
          y: stage === 'landing' ? [0, -20] : 0,
          opacity: stage === 'landing' ? [1, 0.8, 0] : 1
        }}
        transition={{
          duration: reducedMotion ? 0.3 : 0.6,
          ease: stage === 'landing' ? [0.55, 0.055, 0.675, 0.19] : 'easeInOut'
        }}
      >
        {/* Horizontal airplane */}
        <HorizontalAirplane stage={stage} />

        {/* Flight status message */}
        <motion.div
          style={{
            fontSize: '24px',
            fontWeight: '600',
            textShadow: stage === 'landing' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
            fontFamily: "'Lexend', sans-serif"
          }}
          animate={{
            opacity: stage === 'landing' ? [1, 0.8, 0] : [0, 1],
            y: stage === 'landing' ? [0, -15] : [10, 0],
            scale: stage === 'landing' ? [1, 0.9] : [0.95, 1]
          }}
          transition={{
            duration: reducedMotion ? 0.3 : 0.6,
            ease: 'easeInOut'
          }}
        >
          <motion.span
            animate={{
              background: stage === 'takeoff' ?
                'linear-gradient(45deg, #667eea, #764ba2)' :
                stage === 'flying' ?
                'linear-gradient(45deg, #764ba2, #4facfe)' :
                'linear-gradient(45deg, #43e97b, #333333)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
            transition={{ duration: reducedMotion ? 0.2 : 0.3 }}
          >
            {stage === 'takeoff' ? 'Taking off...' :
             stage === 'flying' ?
             (toMode === 'voice' ? (t.warpingToVoice || 'Flying to 🎤 Voice Mode') : (t.warpingToText || 'Flying to 💬 Text Mode')) :
             (t.welcomeAboard || 'Landing... Welcome aboard!')}
          </motion.span>
        </motion.div>

        {/* Flight progress indicator */}
        <motion.div
          style={{
            width: '200px',
            height: '4px',
            background: stage === 'landing' ? 'rgba(51, 51, 51, 0.2)' : 'rgba(255, 255, 255, 0.3)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
          animate={{
            opacity: stage === 'landing' ? [1, 0.8, 0] : 1,
            scale: stage === 'landing' ? [1, 0.95] : 1
          }}
          transition={{
            duration: reducedMotion ? 0.3 : 0.6,
            ease: 'easeInOut'
          }}
        >
          <motion.div
            style={{
              height: '100%',
              background: stage === 'landing' ?
                'linear-gradient(90deg, #43e97b, #333333)' :
                'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.8))',
              borderRadius: '2px'
            }}
            animate={{
              width: stage === 'takeoff' ? '33%' :
                     stage === 'flying' ? '66%' :
                     stage === 'landing' ? '100%' : '0%',
              opacity: [1, 0.8, 1]
            }}
            transition={{
              width: {
                duration: reducedMotion ? 0.3 : 0.6,
                ease: 'easeOut'
              },
              opacity: {
                duration: reducedMotion ? 0.4 : 0.8,
                repeat: Infinity,
                ease: 'easeInOut'
              }
            }}
          />
        </motion.div>
      </motion.div>

      {/* Removed corner accents for cockpit view */}

      {/* Final landing streak */}
      {stage === 'landing' && (
        <motion.div
          style={{
            position: 'absolute',
            top: '60%',
            left: '-100%',
            width: '100%',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
            borderRadius: '1.5px'
          }}
          animate={{
            x: ['0%', '200%'],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 1,
            ease: [0.55, 0.055, 0.675, 0.19]
          }}
        />
      )}
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