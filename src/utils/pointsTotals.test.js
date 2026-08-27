/**
 * The Explore leaderboard and the progress dashboard must always show the same
 * number for the same user. They used to disagree: the leaderboard added
 * `learningPoints` and `dailyTaskPoints` on top of `totalPoints`, which already
 * includes both, and it ignored achievement bonuses entirely.
 */
import {
  getTotalPoints,
  getLeaderboardData,
  initializeUserStats,
  recordLearningPoints,
  recordDailyTaskPoints
} from './leaderboardUtils';
import { awardPoints, POINT_VALUES } from './pointsUtils';

const ALI = 'ali@x.com';
const SARA = 'sara@x.com';

/** What the Explore leaderboard's "Top Points" tab renders for a user. */
const leaderboardTotal = (email) =>
  getLeaderboardData().topPointsTotal.find((u) => u.email === email)?.totalPoints;

/** What the progress dashboard's "Total Points" tile renders for a user. */
const dashboardTotal = (email) => getTotalPoints(email);

const setAchievementPoints = (email, total) =>
  localStorage.setItem(`stellar_points_${email}`, JSON.stringify({ total, history: [] }));

beforeEach(() => {
  localStorage.clear();
  initializeUserStats(ALI, 'Ali');
  initializeUserStats(SARA, 'Sara');
});

describe('point totals', () => {
  it('counts a learning activity exactly once', () => {
    recordLearningPoints(ALI, 30, 'lesson_math_1');

    expect(dashboardTotal(ALI)).toBe(30);
    expect(leaderboardTotal(ALI)).toBe(30);
  });

  it('counts a daily task exactly once', () => {
    recordDailyTaskPoints(ALI, 20, 'daily_streak');

    expect(dashboardTotal(ALI)).toBe(20);
    expect(leaderboardTotal(ALI)).toBe(20);
  });

  it('includes achievement bonuses, and only once', () => {
    recordLearningPoints(ALI, 30, 'lesson_math_1');
    setAchievementPoints(ALI, 50);

    expect(dashboardTotal(ALI)).toBe(80);
    expect(leaderboardTotal(ALI)).toBe(80);
  });

  it('matches the dashboard after every kind of activity', () => {
    recordLearningPoints(ALI, 30, 'lesson_math_1');
    recordDailyTaskPoints(ALI, 20, 'daily_streak');
    awardPoints(ALI, 'QUIZ_COMPLETED');
    setAchievementPoints(ALI, 50);

    const expected = 30 + 20 + POINT_VALUES.QUIZ_COMPLETED + 50;
    expect(dashboardTotal(ALI)).toBe(expected);
    expect(leaderboardTotal(ALI)).toBe(expected);
  });

  it('keeps one user achievement points off another user total', () => {
    recordLearningPoints(ALI, 30, 'lesson_math_1');
    setAchievementPoints(SARA, 500);

    expect(dashboardTotal(ALI)).toBe(30);
    expect(leaderboardTotal(ALI)).toBe(30);
    expect(dashboardTotal(SARA)).toBe(500);
  });

  it('ranks by the canonical total, so achievement bonuses count', () => {
    recordLearningPoints(ALI, 30, 'lesson_math_1');
    recordLearningPoints(SARA, 40, 'lesson_math_1');
    setAchievementPoints(ALI, 100);

    expect(getLeaderboardData().topPointsTotal.map((u) => u.email)).toEqual([ALI, SARA]);
  });
});

describe('awardPoints', () => {
  it('reports the new total, matching what both screens will show', () => {
    setAchievementPoints(ALI, 50);

    const result = awardPoints(ALI, 'WORD_LEARNED');

    expect(result.success).toBe(true);
    expect(result.points).toBe(POINT_VALUES.WORD_LEARNED);
    expect(result.totalPoints).toBe(50 + POINT_VALUES.WORD_LEARNED);
    expect(dashboardTotal(ALI)).toBe(result.totalPoints);
    expect(leaderboardTotal(ALI)).toBe(result.totalPoints);
  });

  it('rounds fractional multipliers to whole points', () => {
    // The alphabet module awards 0.2x for a letter that was only viewed.
    const result = awardPoints(ALI, 'LETTER_LEARNED', 0.2);

    expect(result.points).toBe(1);
    expect(dashboardTotal(ALI)).toBe(1);
  });

  it('announces the change so open screens can refresh', () => {
    const onChange = jest.fn();
    window.addEventListener('stellar:points-changed', onChange);

    awardPoints(ALI, 'WORD_LEARNED');

    expect(onChange).toHaveBeenCalled();
    window.removeEventListener('stellar:points-changed', onChange);
  });
});
