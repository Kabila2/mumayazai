// src/components/PaperAirplaneTransition.js - Simplified with Unique Effects
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaperAirplaneTransition = ({ 
  isTransitioning, 
  fromMode, 
  toMode, 
  onTransitionComplete,
  children,
  reducedMotion = false
}) => {
  const [stage, setStage] = useState('idle');
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    if (!isTransitioning) return;
    setStage('launch');
    setShowTransition(true);

    const t1 = setTimeout(() => setStage('warp'), reducedMotion ? 250 : 500);
    const t2 = setTimeout(() => setStage('arrive'), reducedMotion ? 600 : 1200);
    const t3 = setTimeout(() => {
      setShowTransition(false);
      setStage('idle');
      onTransitionComplete?.();
    }, reducedMotion ? 900 : 1600);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isTransitioning, onTransitionComplete, reducedMotion]);

  // Paper airplane morphing shapes
  const PlaneShape = ({ stage }) => {
    const pathVariants = {
      launch: "M12,2 L20,20 L12,17 L4,20 L12,2 Z",
      warp: "M12,2 L22,15 L12,12 L2,15 L12,2 Z", 
      arrive: "M12,2 L18,18 L12,16 L6,18 L12,2 Z"
    };

    return (
      <motion.svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}
      >
        <motion.path
          d={pathVariants[stage] || pathVariants.launch}
          fill="currentColor"
          animate={{
            d: pathVariants[stage] || pathVariants.launch,
            scale: stage === 'warp' ? [1, 1.5, 0.8] : 1,
            rotate: stage === 'warp' ? [0, 180, 360] : 0
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </motion.svg>
    );
  };

  // Warp tunnel effect
  const WarpTunnel = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${100 + i * 80}px`,
            height: `${100 + i * 80}px`,
            border: '2px solid',
            borderColor: `hsl(${200 + i * 20}, 100%, 70%)`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.6 - i * 0.07
          }}
          animate={{
            scale: [0, 2.2],
            opacity: [0.6 - i * 0.07, 0],
            borderWidth: [2, 0]
          }}
          transition={{
            duration: reducedMotion ? 0.5 : 0.9,
            delay: i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );

  // Particle burst effect
  const ParticleBurst = ({ stage }) => (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30) * Math.PI / 180;
        const distance = 150 + Math.random() * 100;
        
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '4px',
              height: '4px',
              background: `hsl(${180 + Math.random() * 80}, 100%, 70%)`,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 1.5,
              delay: stage === 'launch' ? 0.3 : 0,
              ease: 'easeOut'
            }}
          />
        );
      })}
    </>
  );

  // Glitch/digital transition effect
  const GlitchBars = () => (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${i * 16.66}%`,
            height: '16.66%',
            background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent)',
            mixBlendMode: 'screen'
          }}
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 1, 0],
            scaleY: [1, 1.2, 1]
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.05,
            ease: 'easeInOut'
          }}
        />
      ))}
    </>
  );

  // Morphing background gradients
  const backgroundVariants = {
    launch: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    warp: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
    arrive: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
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
        background: backgroundVariants[stage] || backgroundVariants.launch,
        overflow: 'hidden'
      }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        background: backgroundVariants[stage] || backgroundVariants.launch
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Warp tunnel - only during warp stage */}
      {stage === 'warp' && <WarpTunnel />}
      
      {/* Glitch bars - during arrive stage */}
      {stage === 'arrive' && <GlitchBars />}
      
      {/* Particle burst */}
      <ParticleBurst stage={stage} />
      
      {/* Central content */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
          color: '#ffffff',
          textAlign: 'center',
          zIndex: 1
        }}
        animate={{
          scale: stage === 'warp' ? [1, 1.08, 1] : 1,
          y: stage === 'arrive' ? [0, -10, 0] : 0
        }}
        transition={{ duration: reducedMotion ? 0.25 : 0.5 }}
      >
        {/* Animated paper airplane */}
        <motion.div
          style={{
            fontSize: '60px',
            color: '#ffffff',
            filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))'
          }}
          animate={{
            rotate: stage === 'warp' ? [0, 240, 480] : 0,
            scale: stage === 'launch' ? [1, 1.2, 1.05] : 
                   stage === 'warp' ? [1.05, 0.95, 1.1] : 
                   [1.05, 1],
            y: stage === 'launch' ? [0, -14, -6] :
               stage === 'warp' ? [-6, 8, -8] :
               [-8, 0]
          }}
          transition={{ 
            duration: reducedMotion ? 0.25 : (stage === 'warp' ? 0.6 : 0.4),
            ease: 'easeInOut'
          }}
        >
          ✈️
        </motion.div>

        {/* Mode transition message */}
        <motion.div
          style={{
            fontSize: '28px',
            fontWeight: '700',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            fontFamily: "'Lexend', sans-serif"
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [10, 0, 0, -10],
            scale: [0.98, 1, 1, 1.02]
          }}
          transition={{
            duration: reducedMotion ? 0.6 : 1.2,
            times: [0, 0.2, 0.8, 1],
            ease: 'easeInOut'
          }}
        >
          <motion.span
            animate={{
              background: stage === 'launch' ? 
                'linear-gradient(45deg, #ff6b6b, #ffd93d)' :
                stage === 'warp' ?
                'linear-gradient(45deg, #6c5ce7, #fd79a8)' :
                'linear-gradient(45deg, #00b894, #00cec9)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
            transition={{ duration: reducedMotion ? 0.2 : 0.4 }}
          >
            {stage === 'launch' ? 'Launching...' :
             stage === 'warp' ? `Warping to ${toMode === 'voice' ? '🎤 Voice' : '💬 Text'} Mode` :
             stage === 'arrive' ? 'Welcome aboard!' : ''}
          </motion.span>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          style={{
            width: '200px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.8))',
              borderRadius: '2px'
            }}
            animate={{
              width: stage === 'launch' ? '33%' :
                     stage === 'warp' ? '66%' :
                     stage === 'arrive' ? '100%' : '0%',
              opacity: [1, 0.7, 1]
            }}
            transition={{ 
              width: { duration: reducedMotion ? 0.2 : 0.4, ease: 'easeInOut' },
              opacity: { duration: reducedMotion ? 0.3 : 0.5, repeat: Infinity }
            }}
          />
        </motion.div>
      </motion.div>

      {/* Dynamic corner accents */}
      {Array.from({ length: 4 }, (_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4), transparent)',
            borderRadius: '50%',
            ...(i === 0 && { top: 0, left: 0, transform: 'translate(-50%, -50%)' }),
            ...(i === 1 && { top: 0, right: 0, transform: 'translate(50%, -50%)' }),
            ...(i === 2 && { bottom: 0, left: 0, transform: 'translate(-50%, 50%)' }),
            ...(i === 3 && { bottom: 0, right: 0, transform: 'translate(50%, 50%)' })
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 0.6, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </motion.div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Main content with blur effect during transition */}
      <motion.div
        animate={{
          filter: showTransition ? 'blur(8px) brightness(0.3)' : 'blur(0px) brightness(1)',
          scale: showTransition ? 0.95 : 1
        }}
        transition={{ duration: 0.5 }}
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