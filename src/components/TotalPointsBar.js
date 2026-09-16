import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTotalPoints, POINTS_CHANGED_EVENT } from '../utils/leaderboardUtils';
import './TotalPointsBar.css';

/**
 * Always-on point readout for the learning and quiz screens.
 *
 * Reads the canonical total through getTotalPoints() — the same number the
 * progress dashboard and the Explore leaderboard show — so the three can never
 * disagree. Rank thresholds are kept in step with PointsTracker.
 */
const RANKS = [
  { id: 'bronze',   icon: '🥉', minPoints: 0,   en: 'Bronze',   ar: 'برونزي' },
  { id: 'silver',   icon: '🥈', minPoints: 100, en: 'Silver',   ar: 'فضي' },
  { id: 'gold',     icon: '🥇', minPoints: 200, en: 'Gold',     ar: 'ذهبي' },
  { id: 'platinum', icon: '💠', minPoints: 300, en: 'Platinum', ar: 'بلاتيني' },
  { id: 'diamond',  icon: '💎', minPoints: 500, en: 'Diamond',  ar: 'ماسي' }
];

const getRankProgress = (points) => {
  let index = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPoints) { index = i; break; }
  }

  const current = RANKS[index];
  const next = RANKS[index + 1] || null;

  if (!next) return { current, next: null, pointsNeeded: 0, percent: 100 };

  const span = next.minPoints - current.minPoints;
  const percent = Math.min(100, Math.max(0, ((points - current.minPoints) / span) * 100));

  return { current, next, pointsNeeded: next.minPoints - points, percent };
};

const TotalPointsBar = ({ userEmail, language = 'en' }) => {
  const [total, setTotal] = useState(0);
  const [delta, setDelta] = useState(null);
  // Previous total lives in a ref, not state: it only exists to spot an
  // increase, and must not itself trigger a render.
  const lastTotal = useRef(null);

  useEffect(() => {
    if (!userEmail) {
      setTotal(0);
      lastTotal.current = null;
      return undefined;
    }

    // A different user starts from a clean slate — their total is not a gain.
    lastTotal.current = null;

    const read = () => {
      const next = getTotalPoints(userEmail);

      if (lastTotal.current !== null && next > lastTotal.current) {
        setDelta({ amount: next - lastTotal.current, id: Date.now() });
      }

      lastTotal.current = next;
      setTotal(next);
    };

    read();
    // Points announce themselves; poll as a backstop for writes made in another
    // tab or by code that forgets to emit.
    window.addEventListener(POINTS_CHANGED_EVENT, read);
    const interval = setInterval(read, 3000);

    return () => {
      window.removeEventListener(POINTS_CHANGED_EVENT, read);
      clearInterval(interval);
    };
  }, [userEmail]);

  // Retire the "+N" flash on its own so a fresh gain restarts the timer.
  useEffect(() => {
    if (!delta) return undefined;
    const timer = setTimeout(() => setDelta(null), 2500);
    return () => clearTimeout(timer);
  }, [delta]);

  if (!userEmail) return null;

  const { current, next, pointsNeeded, percent } = getRankProgress(total);
  const rankName = language === 'ar' ? current.ar : current.en;
  const label = language === 'ar' ? 'مجموع النقاط' : 'Total Points';

  return (
    // No role="status" / aria-live on the bar itself: App.css visually hides
    // every live region app-wide, which would collapse the bar to 1px. The
    // announcement lives in its own hidden span at the end instead.
    <motion.aside
      className="total-points-bar"
      aria-label={`${label}: ${total}. ${rankName}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="tpb-coin"
        aria-hidden="true"
        animate={delta ? { scale: [1, 1.35, 1], rotate: [0, 15, -15, 0] } : { scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        🪙
      </motion.div>

      <div className="tpb-readout">
        <span className="tpb-label">{label}</span>
        <span className="tpb-value">
          {total}
          <AnimatePresence>
            {delta && (
              <motion.span
                key={delta.id}
                className="tpb-delta"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: -6 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                +{delta.amount}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>

      <div className="tpb-rank">
        <div className="tpb-rank-top">
          <span className="tpb-rank-icon" aria-hidden="true">{current.icon}</span>
          <span className="tpb-rank-name">{rankName}</span>
        </div>
        <div className="tpb-progress-track">
          <div className="tpb-progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="tpb-next">
          {next
            ? (language === 'ar'
                ? `${pointsNeeded} نقطة إلى ${next.ar}`
                : `${pointsNeeded} to ${next.en}`)
            : (language === 'ar' ? 'أعلى رتبة!' : 'Top rank!')
          }
        </span>
      </div>

      {/* Announcer. App.css hides every [aria-live] node app-wide, so this is
          invisible by that rule alone — and it only re-announces when the
          total actually changes, not on every poll. */}
      <span className="tpb-announcement" aria-live="polite">
        {`${label}: ${total}`}
      </span>
    </motion.aside>
  );
};

export default TotalPointsBar;
