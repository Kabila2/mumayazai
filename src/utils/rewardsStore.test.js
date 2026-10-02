/**
 * Points used to be write-only; rewards give them a purpose. The invariant
 * that matters is that a reward can never be applied unless it has been
 * earned — including when the stored selection is stale, which happens if
 * points are reset or the catalogue changes under a saved choice.
 */
import {
  ACCENT_THEMES,
  BACKGROUNDS,
  getSelection,
  isRewardUnlocked,
  selectReward,
  applyRewards,
  getCelebrationStyle,
  getRewardsOverview
} from './rewardsStore';
import { initializeUserStats, recordLearningPoints } from './leaderboardUtils';

const LEARNER = 'kid@x.com';

/** Give the learner a points total, through the real scoring path. */
const givePoints = (points) => {
  initializeUserStats(LEARNER, 'Kid');
  recordLearningPoints(LEARNER, points, 'test');
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.cssText = '';
  ['data-stellar-bg', 'data-stellar-celebration', 'data-stellar-frame']
    .forEach((attr) => document.documentElement.removeAttribute(attr));
});

describe('defaults', () => {
  it('starts every learner on the free options', () => {
    expect(getSelection(LEARNER)).toEqual({
      accent: 'default',
      background: 'none',
      celebration: 'calm',
      avatarFrame: 'none'
    });
  });

  it('treats a zero-cost option as always unlocked', () => {
    expect(isRewardUnlocked(LEARNER, 'accent', 'default')).toBe(true);
    expect(isRewardUnlocked(LEARNER, 'background', 'none')).toBe(true);
    expect(isRewardUnlocked(LEARNER, 'celebration', 'calm')).toBe(true);
  });

  it('defaults the celebration to calm, not to a louder style', () => {
    // The calm popup is the deliberate default — the loud ones are opt-in.
    expect(getCelebrationStyle(LEARNER)).toBe('calm');
  });
});

describe('thresholds', () => {
  const ocean = ACCENT_THEMES.find((t) => t.id === 'ocean');

  it('keeps a reward locked below its cost', () => {
    givePoints(ocean.cost - 1);
    expect(isRewardUnlocked(LEARNER, 'accent', ocean.id)).toBe(false);
  });

  it('unlocks a reward at exactly its cost', () => {
    givePoints(ocean.cost);
    expect(isRewardUnlocked(LEARNER, 'accent', ocean.id)).toBe(true);
  });

  it('does not deduct the cost when the reward is used', () => {
    // Saving up for a theme must not push the learner down the leaderboard.
    givePoints(ocean.cost);
    selectReward(LEARNER, 'accent', ocean.id);
    expect(getRewardsOverview(LEARNER).totalPoints).toBe(ocean.cost);
  });

  it('reports how many more points a locked reward needs', () => {
    givePoints(100);
    const row = getRewardsOverview(LEARNER).accent.find((r) => r.id === ocean.id);
    expect(row.unlocked).toBe(false);
    expect(row.remaining).toBe(ocean.cost - 100);
  });

  it('never reports a negative remaining', () => {
    givePoints(99999);
    getRewardsOverview(LEARNER).accent.forEach((row) => {
      expect(row.remaining).toBe(0);
      expect(row.unlocked).toBe(true);
    });
  });
});

describe('selecting', () => {
  const ocean = ACCENT_THEMES.find((t) => t.id === 'ocean');

  it('refuses a selection that has not been earned', () => {
    selectReward(LEARNER, 'accent', ocean.id);
    expect(getSelection(LEARNER).accent).toBe('default');
  });

  it('stores a selection that has been earned', () => {
    givePoints(ocean.cost);
    selectReward(LEARNER, 'accent', ocean.id);
    expect(getSelection(LEARNER).accent).toBe(ocean.id);
  });

  it('ignores an unknown category', () => {
    givePoints(99999);
    selectReward(LEARNER, 'nonsense', 'whatever');
    expect(getSelection(LEARNER).nonsense).toBeUndefined();
  });

  it('keeps each learner\'s choices separate', () => {
    givePoints(ocean.cost);
    selectReward(LEARNER, 'accent', ocean.id);
    expect(getSelection('other@x.com').accent).toBe('default');
  });
});

describe('applying to the document', () => {
  const ocean = ACCENT_THEMES.find((t) => t.id === 'ocean');
  const sparkles = BACKGROUNDS.find((b) => b.id === 'sparkles');

  it('writes the accent variables onto <html>', () => {
    givePoints(ocean.cost);
    selectReward(LEARNER, 'accent', ocean.id);
    applyRewards(LEARNER);

    expect(document.documentElement.style.getPropertyValue('--mz-accent'))
      .toBe(ocean.vars['--mz-accent']);
  });

  it('clears the previous theme when switching, so nothing is inherited', () => {
    givePoints(99999);
    selectReward(LEARNER, 'accent', ocean.id);
    applyRewards(LEARNER);
    selectReward(LEARNER, 'accent', 'default');
    applyRewards(LEARNER);

    expect(document.documentElement.style.getPropertyValue('--mz-accent')).toBe('');
  });

  it('sets the background attribute the stylesheet keys off', () => {
    givePoints(sparkles.cost);
    selectReward(LEARNER, 'background', sparkles.id);
    applyRewards(LEARNER);

    expect(document.documentElement.getAttribute('data-stellar-bg')).toBe('sparkles');
  });

  it('falls back to the free option when a stored choice is no longer earned', () => {
    // Earn it, choose it, then lose the points (a reset, or a different device
    // with a lower total). A stale selection must not keep applying.
    givePoints(99999);
    selectReward(LEARNER, 'accent', ocean.id);
    selectReward(LEARNER, 'background', sparkles.id);

    localStorage.removeItem('stellar_user_stats');
    applyRewards(LEARNER);

    expect(document.documentElement.style.getPropertyValue('--mz-accent')).toBe('');
    expect(document.documentElement.getAttribute('data-stellar-bg')).toBe('none');
    expect(getCelebrationStyle(LEARNER)).toBe('calm');
  });

  it('applies nothing for a signed-out visitor', () => {
    applyRewards(null);
    expect(document.documentElement.getAttribute('data-stellar-bg')).toBe('none');
    expect(document.documentElement.style.getPropertyValue('--mz-accent')).toBe('');
  });
});

describe('the overview the screen renders', () => {
  it('marks the active choice in each category', () => {
    givePoints(99999);
    selectReward(LEARNER, 'accent', 'ocean');
    const overview = getRewardsOverview(LEARNER);

    expect(overview.accent.find((r) => r.active).id).toBe('ocean');
    expect(overview.background.find((r) => r.active).id).toBe('none');
  });

  it('returns every category', () => {
    const overview = getRewardsOverview(LEARNER);
    ['accent', 'background', 'celebration', 'avatarFrame'].forEach((key) => {
      expect(Array.isArray(overview[key])).toBe(true);
      expect(overview[key].length).toBeGreaterThan(0);
    });
  });
});
