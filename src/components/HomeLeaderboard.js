import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getLeaderboardData,
  getPointsStanding,
  POINTS_CHANGED_EVENT
} from '../utils/leaderboardUtils';
import { getInitials } from '../utils/conversationUtils';
import './HomeLeaderboard.css';

/**
 * The leaderboard, on the home page.
 *
 * It used to be reachable only from inside the Explore modal (and a second,
 * unrelated `Leaderboard` modal in the platform was wired to a `showLeaderboard`
 * flag nothing ever set, so it was dead code). Two clicks deep behind a modal
 * is no place for the one screen that answers "am I doing well?", so it lives
 * on the home page now.
 *
 * It is deliberately SMALL: a top five and the learner's own row. The home
 * page is already the busiest screen in the app, and a full eight-tab
 * leaderboard there would be exactly the overload this pass is trying to undo.
 * The full version is still one tap away via "See all".
 */
const PODIUM = ['🥇', '🥈', '🥉'];
const VISIBLE_ROWS = 5;

const HomeLeaderboard = ({ userEmail, language = 'en', onSeeAll }) => {
  const [rows, setRows] = useState([]);
  const [standing, setStanding] = useState({ rank: null, total: 0, points: 0 });

  const tr = (en, ar) => (language === 'ar' ? ar : en);

  const load = useCallback(() => {
    const data = getLeaderboardData();
    const top = (data.topPointsTotal || []).filter((user) => user.totalPoints > 0);
    setRows(top.slice(0, VISIBLE_ROWS));
    setStanding(getPointsStanding(userEmail));
  }, [userEmail]);

  useEffect(() => {
    load();
    // Stay in step when points land while the home page is open — every
    // awardPoints() call emits this.
    window.addEventListener(POINTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(POINTS_CHANGED_EVENT, load);
  }, [load]);

  const isMe = (email) => userEmail && email?.toLowerCase() === userEmail.toLowerCase();
  const inTopRows = rows.some((row) => isMe(row.email));

  return (
    <motion.section
      className="home-leaderboard"
      aria-labelledby="home-leaderboard-title"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="home-leaderboard-header">
        <h3 className="home-leaderboard-title" id="home-leaderboard-title">
          <span aria-hidden="true">🏆</span> {tr('Leaderboard', 'لوحة المتصدرين')}
        </h3>
        {onSeeAll && rows.length > 0 && (
          <button type="button" className="home-leaderboard-all" onClick={onSeeAll}>
            {tr('See all', 'عرض الكل')}
          </button>
        )}
      </header>

      {rows.length === 0 ? (
        <p className="home-leaderboard-empty">
          {tr(
            'Learn a letter or a word to take the first place.',
            'تعلم حرفاً أو كلمة لتحتل المركز الأول.'
          )}
        </p>
      ) : (
        <ol className="home-leaderboard-list">
          {rows.map((user, index) => (
            <li
              key={user.email || index}
              className={`home-leaderboard-row ${isMe(user.email) ? 'is-me' : ''}`}
            >
              <span className="home-leaderboard-rank" aria-hidden="true">
                {PODIUM[index] || index + 1}
              </span>
              <span className="home-leaderboard-avatar" aria-hidden="true">
                {getInitials(user.name || user.email || '')}
              </span>
              <span className="home-leaderboard-name">
                {user.name || user.email?.split('@')[0] || tr('Learner', 'متعلم')}
                {isMe(user.email) && (
                  <span className="home-leaderboard-you">{tr('you', 'أنت')}</span>
                )}
              </span>
              <span className="home-leaderboard-points">
                {user.totalPoints}
                <span className="home-leaderboard-points-unit">
                  {tr('pts', 'نقطة')}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* Own standing, when the learner is not already in the visible rows —
          otherwise the board tells everyone outside the top five nothing. */}
      {!inTopRows && standing.rank && (
        <p className="home-leaderboard-mine">
          {tr(
            `You are #${standing.rank} of ${standing.total} with ${standing.points} points.`,
            `أنت في المركز ${standing.rank} من ${standing.total} بـ ${standing.points} نقطة.`
          )}
        </p>
      )}
    </motion.section>
  );
};

export default HomeLeaderboard;
