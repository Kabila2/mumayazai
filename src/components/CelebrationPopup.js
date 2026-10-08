import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCelebrationStyle } from '../utils/rewardsStore';
import { getComfort, shouldReduceMotion } from '../utils/comfortSettings';
import { playSuccessSound } from '../utils/soundEffects';
import './CelebrationPopup.css';

/**
 * The "Great Job!" popup, shown by every learning module and the quiz centre.
 *
 * TWO THINGS WERE WRONG WITH THE OLD ONE
 *
 * 1. IT WAS CLIPPED. The popup was rendered inside whichever module raised it,
 *    and `.arabic-words-learning` / `.arabic-sentences-learning` set
 *    `contain: layout style`. Per spec, `contain: layout` makes an element the
 *    containing block for fixed-position descendants — so the overlay's
 *    `position: fixed; height: 100vh` was measured from the module's padded
 *    top edge instead of the viewport, which is exactly why the words module
 *    only animated across the top half of the screen. Those modules also style
 *    `.celebration-emoji` for their own inline banner, and those descendant
 *    rules silently overrode this component's.
 *
 *    Both problems are structural, so the fix is structural: the popup is
 *    portalled to <body>. It is then nobody's descendant, so no ancestor's
 *    containment can crop it and no module's stylesheet can reach it. Every
 *    module now gets the identical animation.
 *
 * 2. IT WAS TOO MUCH. Eight balloons, thirty confetti pieces and fifteen stars
 *    all at once, the box spinning in through 180°, and the icon and five
 *    emoji wiggling on `repeat: Infinity` — which never stops, because the
 *    popup unmounts before the loop does. For a learner who is here *because*
 *    they find a busy screen hard, a reward that thrashes is a punishment.
 *
 *    The default is now `calm`: a soft scale-and-lift, a gentle confetti fall
 *    that settles, one breath of movement on the icon, and no infinite loops.
 *    Louder styles are a reward the learner can choose to unlock
 *    (see rewardsStore.js) rather than the thing everyone is given.
 *
 * Reduced motion removes the particles entirely and cross-fades the box.
 */

/** Particle counts and timings per celebration style. */
const STYLE_PRESETS = {
  // `quiet` is the Comfort panel's setting, not a reward: no particles at all,
  // a shorter hold, and no sound. For a learner who finds sudden visual
  // bursts distressing, the praise still arrives — just gently.
  quiet: { confetti: 0, balloons: 0, stars: 0, hold: 1500, spread: 0 },
  calm: { confetti: 10, balloons: 0, stars: 0, hold: 2200, spread: 0.5 },
  cheerful: { confetti: 22, balloons: 5, stars: 6, hold: 2800, spread: 0.7 },
  fireworks: { confetti: 40, balloons: 8, stars: 14, hold: 3400, spread: 0.9 }
};

const PALETTE = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

const MESSAGES = {
  excellent: { en: 'Excellent!', ar: 'ممتاز!' },
  great: { en: 'Great Job!', ar: 'عمل رائع!' },
  wellDone: { en: 'Well Done!', ar: 'أحسنت!' },
  amazing: { en: 'Amazing!', ar: 'رائع!' },
  perfect: { en: 'Perfect!', ar: 'مثالي!' },
  keepGoing: { en: 'Keep Going!', ar: 'استمر!' }
};

const CelebrationPopup = ({
  show,
  message,
  onClose,
  language = 'en',
  type = 'success',
  userEmail = null
}) => {
  const [style, setStyle] = useState('calm');
  // The in-app Comfort switch counts as well as the OS preference.
  const reduceMotion = shouldReduceMotion();

  // Read the learner's chosen celebration style when the popup opens, not on
  // every render — switching style mid-animation would restart it. The
  // Comfort panel's "quiet celebrations" overrides any reward style.
  useEffect(() => {
    if (!show) return;
    const comfort = getComfort();
    setStyle(comfort.quietCelebrations ? 'quiet' : getCelebrationStyle(userEmail));
    if (!comfort.quietCelebrations) playSuccessSound();
  }, [show, userEmail]);

  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.calm;

  useEffect(() => {
    if (!show) return undefined;
    const timer = setTimeout(() => onClose?.(), preset.hold);
    return () => clearTimeout(timer);
  }, [show, onClose, preset.hold]);

  // The message is picked once per opening. Re-randomising on every render
  // made the heading flicker between words while the popup was on screen.
  const displayMessage = useMemo(() => {
    if (message) return message;
    const keys = Object.keys(MESSAGES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return MESSAGES[key][language] || MESSAGES[key].en;
  }, [message, language, show]); // eslint-disable-line react-hooks/exhaustive-deps

  // Particles are generated once per opening, for the same reason.
  const particles = useMemo(() => {
    if (reduceMotion) return { confetti: [], balloons: [], stars: [] };

    const make = (count, builder) => Array.from({ length: count }, (_, i) => builder(i));

    return {
      confetti: make(preset.confetti, (i) => ({
        id: i,
        left: `${(i / Math.max(preset.confetti, 1)) * 96 + Math.random() * 4}%`,
        delay: Math.random() * preset.spread,
        drift: Math.random() * 40 - 20,
        color: PALETTE[i % PALETTE.length],
        duration: 1.6 + Math.random() * 0.8
      })),
      balloons: make(preset.balloons, (i) => ({
        id: i,
        left: `${10 + (i / Math.max(preset.balloons, 1)) * 76}%`,
        delay: Math.random() * preset.spread,
        color: PALETTE[i % PALETTE.length]
      })),
      stars: make(preset.stars, (i) => ({
        id: i,
        left: `${Math.random() * 90 + 5}%`,
        top: `${Math.random() * 70 + 10}%`,
        delay: Math.random() * preset.spread
      }))
    };
  }, [preset, reduceMotion, show]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nothing to portal into during a server render or before <body> exists.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className={`celebration-popup-overlay celebration-popup-overlay--${style}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onClose}
        >
          {/*
            The announcement lives on its own hidden element, NOT on this
            overlay. App.css visually hides every `[role="status"]`,
            `[role="alert"]` and `[aria-live]` element (1x1, clipped) on the
            assumption that anything carrying one is a screen-reader-only
            announcer. Putting those attributes on the overlay therefore
            collapsed the entire popup to a single clipped pixel — visible to
            nobody. The message still needs announcing, so it gets a real
            announcer instead.
          */}
          <span className="sr-only" role="status">{displayMessage}</span>

          {/* Confetti — falls once and settles, rather than looping. */}
          {particles.confetti.map((piece) => (
            <motion.span
              key={`confetti-${piece.id}`}
              className="celebration-confetti"
              style={{ left: piece.left, backgroundColor: piece.color }}
              initial={{ top: '-5%', opacity: 0, x: 0 }}
              animate={{ top: '105%', opacity: [0, 1, 1, 0], x: piece.drift }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeIn'
              }}
            />
          ))}

          {particles.balloons.map((balloon) => (
            <motion.span
              key={`balloon-${balloon.id}`}
              className="celebration-balloon"
              style={{ left: balloon.left, backgroundColor: balloon.color }}
              initial={{ bottom: '-15%', opacity: 0 }}
              animate={{ bottom: '110%', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.6, delay: balloon.delay, ease: 'easeOut' }}
            />
          ))}

          {particles.stars.map((star) => (
            <motion.span
              key={`star-${star.id}`}
              className="celebration-star"
              style={{ left: star.left, top: star.top }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0.9], opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, delay: star.delay, ease: 'easeOut' }}
            >
              ⭐
            </motion.span>
          ))}

          <motion.div
            className="celebration-message-box"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : { type: 'spring', stiffness: 260, damping: 24, mass: 0.8 }
            }
            onClick={(e) => e.stopPropagation()}
          >
            {/* One slow breath, not an endless wiggle. */}
            <motion.div
              className="celebration-icon"
              aria-hidden="true"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={reduceMotion ? { scale: 1, opacity: 1 } : { scale: [0.7, 1.08, 1], opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.34, 1.26, 0.64, 1] }}
            >
              {type === 'success' ? '🎉' : '🌟'}
            </motion.div>

            <motion.h2
              className="celebration-message"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.3 }}
            >
              {displayMessage}
            </motion.h2>

            <motion.button
              type="button"
              className="celebration-close-btn"
              onClick={onClose}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.25 }}
            >
              {language === 'ar' ? 'استمر' : 'Continue'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CelebrationPopup;
