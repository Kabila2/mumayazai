import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDailyActivity, DAILY_GOAL_EVENT } from '../utils/pointsUtils';
import { POINTS_CHANGED_EVENT } from '../utils/leaderboardUtils';
import './DailyGoalRing.css';

/**
 * Today's goal, as a ring: "3 of 5 things done today".
 *
 * WHY
 * "Finish the alphabet" is weeks away; a child with ADHD cannot feel it.
 * "Do five things today" can be finished before lunch, and the ring filling
 * up is the whole reward loop in one glance. The count is kept by
 * pointsUtils, so every lesson, quiz and game feeds it without knowing.
 */
const SIZE = 92;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DailyGoalRing = ({ userEmail, language = 'en', compact = false }) => {
  const [activity, setActivity] = useState(() => getDailyActivity(userEmail));

  useEffect(() => {
    const read = () => setActivity(getDailyActivity(userEmail));
    read();
    window.addEventListener(DAILY_GOAL_EVENT, read);
    window.addEventListener(POINTS_CHANGED_EVENT, read);
    return () => {
      window.removeEventListener(DAILY_GOAL_EVENT, read);
      window.removeEventListener(POINTS_CHANGED_EVENT, read);
    };
  }, [userEmail]);

  const tr = (en, ar) => (language === 'ar' ? ar : en);
  const done = Math.min(activity.count, activity.goal);
  const offset = CIRCUMFERENCE * (1 - done / activity.goal);

  const label = activity.reached
    ? tr('Goal reached!', 'تحقق الهدف!')
    : tr(`${activity.goal - done} to go`, `بقي ${activity.goal - done}`);

  return (
    <div
      className={`daily-goal ${activity.reached ? 'is-reached' : ''} ${compact ? 'is-compact' : ''}`}
      role="img"
      aria-label={tr(
        `Today's goal: ${done} of ${activity.goal} activities done. ${label}`,
        `هدف اليوم: ${done} من ${activity.goal} أنشطة. ${label}`
      )}
    >
      <svg className="daily-goal-ring" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle
          className="daily-goal-track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
        />
        <motion.circle
          className="daily-goal-fill"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        <text className="daily-goal-count" x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
          {activity.reached ? '✓' : `${done}/${activity.goal}`}
        </text>
      </svg>
      {!compact && (
        <div className="daily-goal-text">
          <span className="daily-goal-title">{tr("Today's goal", 'هدف اليوم')}</span>
          <span className="daily-goal-label">{label}</span>
          <span className="daily-goal-hint">
            {activity.reached
              ? tr('Anything more today is a bonus.', 'كل ما تفعله الآن إضافة رائعة.')
              : tr('Learn, play or take a quiz — each one counts.', 'تعلّم أو العب أو اختبر نفسك — كل واحد يُحسب.')}
          </span>
        </div>
      )}
    </div>
  );
};

export default DailyGoalRing;
