// src/components/PaperAirplaneTransition.js - Simplified First-Person Pilot View
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaperAirplaneTransition = ({ 
  isTransitioning, 
  fromMode, 
  toMode, 
  onTransitionComplete,
  children 
}) => {
  const [stage, setStage] = useState('idle'); // 'idle', 'takeoff', 'flying', 'landing'
  const [showCockpit, setShowCockpit] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      console.log(`✈️ First-person transition: ${fromMode} → ${toMode}`);
      
      // Simplified timing sequence
      setStage('takeoff');
      setShowCockpit(true);
      
      setTimeout(() => {
        setStage('flying');
        console.log('🚀 Flying in first-person view');
      }, 1000);
      
      setTimeout(() => {
        setStage('landing');
        console.log('🛬 Landing at destination');
      }, 2500);
      
      setTimeout(() => {
        setShowCockpit(false);
        setStage('idle');
        console.log('✅ First-person transition complete');
        onTransitionComplete?.();
      }, 3500);
    }
  }, [isTransitioning, fromMode, toMode, onTransitionComplete]);

  // Content fade-out during transition
  const contentVariants = {
    idle: { 
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.3 }
    },
    takeoff: {
      opacity: 0,
      scale: 0.95,
      filter: 'blur(2px)',
      transition: { duration: 0.5 }
    },
    flying: {
      opacity: 0,
      scale: 0.95,
      filter: 'blur(2px)'
    },
    landing: {
      opacity: [0, 0.3, 1],
      scale: [0.95, 0.98, 1],
      filter: ['blur(2px)', 'blur(1px)', 'blur(0px)'],
      transition: { duration: 1.0, times: [0, 0.5, 1] }
    }
  };

  // First-Person Cockpit View Component
  const FirstPersonCockpit = () => {
    return (
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 10000,
          background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 30%, #FFFFFF 70%, #F0F8FF 100%)',
          overflow: 'hidden'
        }}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          background: stage === 'takeoff' ? 
            'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 30%, #FFFFFF 70%, #F0F8FF 100%)' :
            stage === 'flying' ?
            'linear-gradient(to bottom, #001f3f 0%, #0074D9 30%, #87CEEB 70%, #E0F6FF 100%)' :
            'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 30%, #FFFFFF 70%, #F0F8FF 100%)'
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Cockpit Dashboard */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '25%',
            background: 'linear-gradient(to top, #2c3e50, #34495e)',
            borderTop: '3px solid #3498db'
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Control Panel */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '20px',
            alignItems: 'center'
          }}>
            {/* Altitude Display */}
            <motion.div
              style={{
                background: '#000',
                color: '#00ff00',
                padding: '8px 16px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
                border: '2px solid #333'
              }}
              animate={{
                color: stage === 'takeoff' ? '#ffff00' : stage === 'flying' ? '#00ff00' : '#ff6600'
              }}
            >
              ALT: {stage === 'takeoff' ? '1000ft' : stage === 'flying' ? '35000ft' : '500ft'}
            </motion.div>
            
            {/* Speed Display */}
            <motion.div
              style={{
                background: '#000',
                color: '#00ff00',
                padding: '8px 16px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
                border: '2px solid #333'
              }}
              animate={{
                color: stage === 'takeoff' ? '#ffff00' : stage === 'flying' ? '#00ff00' : '#ff6600'
              }}
            >
              SPD: {stage === 'takeoff' ? '150kts' : stage === 'flying' ? '450kts' : '120kts'}
            </motion.div>
            
            {/* Mode Display */}
            <motion.div
              style={{
                background: '#3498db',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              animate={{
                background: stage === 'takeoff' ? '#f39c12' : stage === 'flying' ? '#27ae60' : '#e74c3c'
              }}
            >
              {stage === 'takeoff' ? 'TAKEOFF' : stage === 'flying' ? 'CRUISE' : 'LANDING'}
            </motion.div>
          </div>
        </motion.div>

        {/* Horizon and Clouds */}
        <motion.div
          style={{
            position: 'absolute',
            top: '40%',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #fff, transparent)',
            transform: 'translateY(-50%)'
          }}
          animate={{
            y: stage === 'takeoff' ? [0, -100] : stage === 'landing' ? [0, 100] : 0,
            opacity: stage === 'flying' ? 0.3 : 0.8
          }}
          transition={{ duration: stage === 'takeoff' ? 1.5 : stage === 'landing' ? 1.0 : 0.5 }}
        />

        {/* Clouds Animation */}
        {Array.from({ length: 6 }, (_, i) => (
          <motion.div
            key={`cloud-${i}`}
            style={{
              position: 'absolute',
              left: `${-10 + (i * 25)}%`,
              top: `${20 + (i % 3) * 15}%`,
              width: `${80 + i * 10}px`,
              height: `${40 + i * 5}px`,
              background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2))',
              borderRadius: '50px',
              filter: `blur(${1 + i * 0.5}px)`
            }}
            animate={{
              x: stage === 'takeoff' ? [0, 300] : 
                 stage === 'flying' ? [0, 400] : 
                 [0, 200],
              scale: stage === 'flying' ? [1, 1.5] : 1,
              opacity: stage === 'flying' ? [0.8, 0.4] : 0.8
            }}
            transition={{
              duration: stage === 'takeoff' ? 1.5 : stage === 'flying' ? 1.5 : 1.0,
              delay: i * 0.1,
              ease: 'easeOut'
            }}
          />
        ))}

        {/* Ground/Runway (during takeoff and landing) */}
        {(stage === 'takeoff' || stage === 'landing') && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: '25%',
              left: 0,
              right: 0,
              height: '300px',
              background: stage === 'takeoff' ? 
                'linear-gradient(to bottom, #228B22, #32CD32, #90EE90)' :
                'linear-gradient(to bottom, #228B22, #32CD32, #90EE90)',
              transformOrigin: 'bottom'
            }}
            initial={{ 
              scaleY: stage === 'takeoff' ? 1 : 0,
              y: stage === 'takeoff' ? 0 : 300
            }}
            animate={{ 
              scaleY: stage === 'takeoff' ? [1, 0.2, 0] : [0, 0.2, 1],
              y: stage === 'takeoff' ? [0, -200, -400] : [300, 100, 0],
              rotateX: stage === 'takeoff' ? [0, -45, -90] : [-90, -45, 0]
            }}
            transition={{ 
              duration: stage === 'takeoff' ? 1.5 : 1.0,
              ease: 'easeInOut'
            }}
          >
            {/* Runway lines */}
            {Array.from({ length: 5 }, (_, i) => (
              <motion.div
                key={`runway-line-${i}`}
                style={{
                  position: 'absolute',
                  left: '45%',
                  top: `${i * 15}%`,
                  width: '10%',
                  height: '5px',
                  background: '#fff',
                  transformOrigin: 'center'
                }}
                animate={{
                  scaleY: stage === 'takeoff' ? [1, 0.5, 0] : [0, 0.5, 1],
                  opacity: stage === 'takeoff' ? [1, 0.5, 0] : [0, 0.5, 1]
                }}
                transition={{
                  duration: stage === 'takeoff' ? 1.5 : 1.0,
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Speed Lines during flying */}
        {stage === 'flying' && Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={`speed-line-${i}`}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60 + 10}%`,
              width: '2px',
              height: `${20 + Math.random() * 30}px`,
              background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.8), transparent)',
              transform: `rotate(${-20 + Math.random() * 40}deg)`
            }}
            animate={{
              x: [-50, window.innerWidth + 50],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.05,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}

        {/* Destination Sign */}
        <motion.div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '20px 40px',
            borderRadius: '10px',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [-50, 0, 0, 50],
            scale: [0.8, 1, 1, 0.8]
          }}
          transition={{
            duration: 3.5,
            times: [0, 0.2, 0.8, 1],
            ease: 'easeInOut'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '1.5em' }}
            >
              ✈️
            </motion.span>
            <div>
              <div style={{ fontSize: '0.8em', opacity: 0.8, marginBottom: '5px' }}>
                Flying to
              </div>
              <div style={{ fontSize: '1.2em' }}>
                {toMode === 'voice' ? '🎤 Voice Mode' : '💬 Text Mode'}
              </div>
            </div>
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }}
              style={{ fontSize: '1.5em' }}
            >
              {toMode === 'voice' ? '🎤' : '💬'}
            </motion.span>
          </div>
        </motion.div>

        {/* Engine Sound Visualization */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: 0,
            right: 0,
            height: '10px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            transformOrigin: 'center'
          }}
          animate={{
            scaleY: stage === 'takeoff' ? [1, 3, 2] : 
                    stage === 'flying' ? [2, 4, 3] : 
                    [3, 2, 1],
            opacity: [0.3, 0.8, 0.5]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Main content */}
      <motion.div
        variants={contentVariants}
        animate={stage}
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        {children}
      </motion.div>

      {/* First-person cockpit view */}
      <AnimatePresence>
        {showCockpit && (
          <FirstPersonCockpit key="cockpit-view" />
        )}
      </AnimatePresence>

      {/* Simple status indicator */}
      <AnimatePresence>
        {isTransitioning && stage !== 'idle' && (
          <motion.div
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#ffffff',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              zIndex: 10001,
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif"
            }}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: '1.2em' }}
              >
                ✈️
              </motion.span>
              <span>
                {stage === 'takeoff' ? 'Taking off...' :
                 stage === 'flying' ? `Flying to ${toMode === 'voice' ? '🎤 Voice' : '💬 Text'} Mode` :
                 stage === 'landing' ? 'Landing...' :
                 'Preparing for flight...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaperAirplaneTransition;