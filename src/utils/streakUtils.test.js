/**
 * The streak is advanced by touchStreak() once per day. It used to live in a
 * widget and never award the streak badges or bonuses; now it is data.
 */
import { getStreak, touchStreak, armStreakFreeze } from './streakUtils';
import { getUserAchievements } from './achievementsSystem';
import { getTotalPoints, initializeUserStats } from './leaderboardUtils';
import { POINT_VALUES } from './pointsUtils';

const ALI = 'ali@x.com';

const dayString = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toDateString();
};

const seed = (data) => localStorage.setItem(`stellar_streak_${ALI}`, JSON.stringify(data));

beforeEach(() => {
  localStorage.clear();
  initializeUserStats(ALI, 'Ali');
});

describe('touchStreak', () => {
  it('starts a streak of one on the first visit', () => {
    const result = touchStreak(ALI);
    expect(result.extended).toBe(true);
    expect(result.data.currentStreak).toBe(1);
    expect(result.data.totalDaysActive).toBe(1);
  });

  it('counts a day only once', () => {
    touchStreak(ALI);
    const again = touchStreak(ALI);
    expect(again.extended).toBe(false);
    expect(again.data.currentStreak).toBe(1);
    expect(again.data.totalDaysActive).toBe(1);
  });

  it('extends a streak from yesterday', () => {
    seed({ currentStreak: 4, longestStreak: 4, lastActiveDate: dayString(1), streakFreeze: false, totalDaysActive: 4 });
    const result = touchStreak(ALI);
    expect(result.data.currentStreak).toBe(5);
    expect(result.data.longestStreak).toBe(5);
  });

  it('restarts after a gap with no freeze', () => {
    seed({ currentStreak: 4, longestStreak: 4, lastActiveDate: dayString(3), streakFreeze: false, totalDaysActive: 4 });
    const result = touchStreak(ALI);
    expect(result.broken).toBe(true);
    expect(result.data.currentStreak).toBe(1);
    expect(result.data.longestStreak).toBe(4);
  });

  it('a freeze absorbs exactly one missed day and is then spent', () => {
    seed({ currentStreak: 4, longestStreak: 4, lastActiveDate: dayString(2), streakFreeze: true, totalDaysActive: 4 });
    const result = touchStreak(ALI);
    expect(result.data.currentStreak).toBe(4);
    expect(result.data.streakFreeze).toBe(false);
    expect(result.broken).toBe(false);
  });

  it('awards the week badge and bonus points on day seven', () => {
    seed({ currentStreak: 6, longestStreak: 6, lastActiveDate: dayString(1), streakFreeze: false, totalDaysActive: 6 });
    const before = getTotalPoints(ALI);
    const result = touchStreak(ALI);
    expect(result.milestone).toBe(7);
    const badges = getUserAchievements(ALI).map((a) => a.id);
    expect(badges).toContain('streak_week');
    // The streak bonus plus the badge's own 100 points takes the learner past
    // 100 total, which unlocks the "Century Collector" points badge (+20) on
    // the way — that badge was previously unreachable, so this is the point
    // wiring being exercised end to end.
    expect(badges).toContain('points_100');
    expect(getTotalPoints(ALI)).toBe(before + POINT_VALUES.STREAK_7_DAYS + 100 + 20);
  });

  it('armStreakFreeze sets the flag without touching the count', () => {
    touchStreak(ALI);
    const data = armStreakFreeze(ALI);
    expect(data.streakFreeze).toBe(true);
    expect(getStreak(ALI).currentStreak).toBe(1);
  });
});
