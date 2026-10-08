/**
 * Comfort settings are the learner's sensory controls. They must round-trip
 * through storage, land on <html> for the stylesheets, and keep the voice
 * settings object that useVoiceOver owns intact.
 */
import {
  getComfort,
  setComfort,
  applyComfort,
  setCalmMode,
  isCalmMode,
  READING_TINTS,
  COMFORT_CHANGED_EVENT
} from './comfortSettings';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  document.documentElement.removeAttribute('data-stellar-tint');
  document.documentElement.removeAttribute('data-stellar-focus');
});

describe('comfort settings', () => {
  it('defaults to a lively app: sounds and read-aloud on, nothing reduced', () => {
    expect(getComfort()).toEqual({
      sounds: true,
      readAloud: true,
      reducedMotion: false,
      readingTint: 'none',
      quietCelebrations: false,
      focusMode: false
    });
  });

  it('writes the existing storage keys so older readers still work', () => {
    setComfort({ sounds: false, reducedMotion: true });
    expect(localStorage.getItem('stellar_sounds_enabled')).toBe('false');
    expect(localStorage.getItem('reduced-motion')).toBe('true');
  });

  it('only touches the enabled flag inside the voice settings object', () => {
    localStorage.setItem('stellar_voice_settings', JSON.stringify({ enabled: true, speed: 0.8, pitch: 1.2 }));
    setComfort({ readAloud: false });
    expect(JSON.parse(localStorage.getItem('stellar_voice_settings'))).toEqual({
      enabled: false,
      speed: 0.8,
      pitch: 1.2
    });
    expect(getComfort().readAloud).toBe(false);
  });

  it('puts the visual settings on <html> for the stylesheets', () => {
    setComfort({ reducedMotion: true, readingTint: 'cream', focusMode: true });
    const root = document.documentElement;
    expect(root.classList.contains('reduced-motion')).toBe(true);
    expect(root.getAttribute('data-stellar-tint')).toBe('cream');
    expect(root.getAttribute('data-stellar-focus')).toBe('true');

    setComfort({ reducedMotion: false, readingTint: 'none', focusMode: false });
    expect(root.classList.contains('reduced-motion')).toBe(false);
    expect(root.getAttribute('data-stellar-tint')).toBe('none');
  });

  it('ignores an unknown tint rather than painting garbage', () => {
    localStorage.setItem('stellar_reading_tint', 'neon');
    expect(getComfort().readingTint).toBe('none');
    expect(READING_TINTS.map((t) => t.id)).toContain('cream');
  });

  it('announces every change', () => {
    const listener = jest.fn();
    window.addEventListener(COMFORT_CHANGED_EVENT, listener);
    setComfort({ sounds: false });
    window.removeEventListener(COMFORT_CHANGED_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail.sounds).toBe(false);
  });

  it('calm mode flips the four stimulation settings together and back', () => {
    expect(isCalmMode()).toBe(false);
    setCalmMode(true);
    expect(isCalmMode()).toBe(true);
    expect(getComfort()).toMatchObject({
      sounds: false,
      reducedMotion: true,
      quietCelebrations: true,
      focusMode: true
    });
    setCalmMode(false);
    expect(isCalmMode()).toBe(false);
    expect(getComfort().sounds).toBe(true);
  });

  it('applyComfort is safe to call before anything is saved', () => {
    expect(() => applyComfort()).not.toThrow();
    expect(document.documentElement.getAttribute('data-stellar-tint')).toBe('none');
  });
});
