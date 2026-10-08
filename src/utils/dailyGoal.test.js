/**
 * The daily goal ring counts "activities" — awards worth at least five points —
 * and pays a one-off bonus the moment the goal is reached. Everything feeds it
 * through awardPoints, so nothing else has to know it exists.
 */
import { awardPoints, getDailyActivity, DAILY_GOAL, POINT_VALUES } from './pointsUtils';
import { getTotalPoints, initializeUserStats } from './leaderboardUtils';

const ALI = 'ali@x.com';

beforeEach(() => {
  localStorage.clear();
  initializeUserStats(ALI, 'Ali');
});

describe('daily goal', () => {
  it('starts empty', () => {
    expect(getDailyActivity(ALI)).toMatchObject({ count: 0, goal: DAILY_GOAL, percent: 0, reached: false });
  });

  it('counts a real learning award', () => {
    awardPoints(ALI, 'LETTER_LEARNED');
    expect(getDailyActivity(ALI).count).toBe(1);
  });

  it('does not count paging through a lesson or sending a chat message', () => {
    awardPoints(ALI, 'LETTER_LEARNED', 0.2); // the one-point "viewed" award
    awardPoints(ALI, 'MESSAGE_SENT');         // two points
    expect(getDailyActivity(ALI).count).toBe(0);
  });

  it('pays the goal bonus once, exactly when the goal is reached', () => {
    for (let i = 0; i < DAILY_GOAL - 1; i += 1) awardPoints(ALI, 'LETTER_LEARNED');
    const before = getTotalPoints(ALI);
    expect(getDailyActivity(ALI).reached).toBe(false);

    awardPoints(ALI, 'LETTER_LEARNED');
    expect(getDailyActivity(ALI).reached).toBe(true);
    expect(getTotalPoints(ALI)).toBe(before + POINT_VALUES.LETTER_LEARNED + POINT_VALUES.DAILY_GOAL_REACHED);

    const afterGoal = getTotalPoints(ALI);
    awardPoints(ALI, 'LETTER_LEARNED');
    expect(getTotalPoints(ALI)).toBe(afterGoal + POINT_VALUES.LETTER_LEARNED);
  });

  it('keeps learners separate', () => {
    initializeUserStats('sara@x.com', 'Sara');
    awardPoints(ALI, 'WORD_LEARNED');
    expect(getDailyActivity('sara@x.com').count).toBe(0);
  });
});
