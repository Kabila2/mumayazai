import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { playPopSound } from '../utils/soundEffects';
import './BreakNudge.css';

/**
 * A gentle "brain break" suggestion after a stretch of continuous learning.
 *
 * WHY
 * Sustained attention is the thing many of these learners find hardest, and
 * hyperfocus followed by a crash is the common failure. A short movement
 * break every twenty minutes or so is what their teachers and OTs ask for.
 * This is a suggestion, not a lock: it never blocks the screen, it can be
 * dismissed in one tap, and it only appears once per sitting.
 *
 * Time is counted while a learning or practice screen is open (the platform
 * passes `active`) and the tab is visible — sitting on the home page or
 * switching away does not count.
 */
const BREAK_AFTER_MS = 20 * 60 * 1000;
const TICK_MS = 15 * 1000;

const BreakNudge = ({ active, language = 'en' }) => {
  const [show, setShow] = useState(false);
  const [stretching, setStretching] = useState(false);
  const elapsed = useRef(0);
  const shownOnce = useRef(false);

  const tr = (en, ar) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (!active || shownOnce.current) return undefined;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      elapsed.current += TICK_MS;
      if (elapsed.current >= BREAK_AFTER_MS) {
        shownOnce.current = true;
        setShow(true);
        playPopSound();
      }
    };

    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, [active]);

  // The stretch itself: a 30-second guided breather, then it goes away.
  useEffect(() => {
    if (!stretching) return undefined;
    const timer = setTimeout(() => {
      setStretching(false);
      setShow(false);
    }, 30000);
    return () => clearTimeout(timer);
  }, [stretching]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.aside
          className={`break-nudge ${stretching ? 'is-stretching' : ''}`}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
          aria-label={tr('Break suggestion', 'اقتراح استراحة')}
        >
          {stretching ? (
            <>
              <motion.span
                className="break-nudge-icon"
                aria-hidden="true"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                🫧
              </motion.span>
              <div className="break-nudge-text">
                <strong>{tr('Breathe in… and out.', 'شهيق… وزفير.')}</strong>
                <span>{tr('Roll your shoulders. Look out of a window. Thirty seconds.', 'حرّك كتفيك. انظر من النافذة. ثلاثون ثانية.')}</span>
              </div>
              <button type="button" className="break-nudge-btn" onClick={() => { setStretching(false); setShow(false); }}>
                {tr('Done', 'تم')}
              </button>
            </>
          ) : (
            <>
              <span className="break-nudge-icon" aria-hidden="true">🌿</span>
              <div className="break-nudge-text">
                <strong>{tr("You've been focused for 20 minutes!", 'ركّزت لمدة 20 دقيقة!')}</strong>
                <span>{tr('A short stretch helps your brain keep what it learned.', 'استراحة قصيرة تساعد دماغك على حفظ ما تعلمته.')}</span>
              </div>
              <div className="break-nudge-actions">
                <button type="button" className="break-nudge-btn break-nudge-btn--primary" onClick={() => setStretching(true)}>
                  {tr('Take a breather', 'خذ نفساً')}
                </button>
                <button type="button" className="break-nudge-btn" onClick={() => setShow(false)}>
                  {tr('Keep going', 'أكمل')}
                </button>
              </div>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BreakNudge;
