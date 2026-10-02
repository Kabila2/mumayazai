import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CollapsedCardsBox.css';

/**
 * The "…" tile: everything the learner cannot start yet, folded into one box
 * that opens on hover.
 *
 * WHY
 * The home page offered every lesson, game, builder and tool at once — upwards
 * of sixteen tiles for a student, twenty-two for a teacher. For an app whose
 * learners specifically include children who find a crowded screen hard, that
 * is the first thing to fix. So the grid now shows only what is actually
 * available, and the locked remainder collapses to a single tile.
 *
 * HOVER IS NOT THE ONLY WAY IN
 * A hover-only disclosure is unusable with a keyboard, unreachable on a touch
 * screen and invisible to a screen reader, so this opens on hover, on focus,
 * and on click/tap, and closes on Escape or on moving away. The content is
 * always in the DOM behind `aria-expanded`, never conditionally mounted, so
 * assistive technology can find it either way.
 */
const CollapsedCardsBox = ({ count, label, hint, children }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on Escape, and on a click anywhere outside — the two things a user
  // reaches for when a panel is in the way.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  if (!count) return null;

  return (
    <div
      className={`collapsed-box ${open ? 'is-open' : ''}`}
      ref={containerRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="collapsed-box-trigger"
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="collapsed-box-panel"
      >
        {/* Drawn in CSS rather than typed as "•••": the app's OpenDyslexic
            face has no U+2022 glyph, so the characters rendered as three
            tofu boxes that ran together into one solid block. */}
        <span className="collapsed-box-dots" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="collapsed-box-count">{count}</span>
        <span className="collapsed-box-label">{label}</span>
        {hint && <span className="collapsed-box-hint">{hint}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="collapsed-box-panel"
            id="collapsed-box-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="collapsed-box-grid">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsedCardsBox;
