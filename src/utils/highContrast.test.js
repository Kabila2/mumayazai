/**
 * High contrast is styled entirely from `.high-contrast` on <html>. If the
 * class lands anywhere else — or does not survive a reload — the mode reaches
 * only part of the app, which is the bug this replaced.
 */
import {
  isHighContrastEnabled,
  setHighContrast,
  initHighContrast,
  HIGH_CONTRAST_KEY,
  HIGH_CONTRAST_EVENT
} from './highContrast';

const hasClass = () => document.documentElement.classList.contains('high-contrast');

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
});

it('is off by default', () => {
  expect(initHighContrast()).toBe(false);
  expect(hasClass()).toBe(false);
});

it('marks <html>, not a nested container', () => {
  setHighContrast(true);

  expect(hasClass()).toBe(true);
  expect(document.body.classList.contains('high-contrast')).toBe(false);
});

it('turns back off', () => {
  setHighContrast(true);
  setHighContrast(false);

  expect(hasClass()).toBe(false);
  expect(isHighContrastEnabled()).toBe(false);
});

it('persists, so it is still on after a reload', () => {
  setHighContrast(true);
  document.documentElement.className = ''; // simulate a fresh document

  expect(localStorage.getItem(HIGH_CONTRAST_KEY)).toBe('true');
  expect(initHighContrast()).toBe(true);
  expect(hasClass()).toBe(true);
});

it('leaves dark mode alone', () => {
  document.documentElement.classList.add('dark-mode');
  setHighContrast(true);

  expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
  expect(hasClass()).toBe(true);
});

it('announces the change so other screens can follow', () => {
  const onChange = jest.fn();
  window.addEventListener(HIGH_CONTRAST_EVENT, onChange);

  setHighContrast(true);

  expect(onChange).toHaveBeenCalled();
  expect(onChange.mock.calls[0][0].detail).toEqual({ enabled: true });
  window.removeEventListener(HIGH_CONTRAST_EVENT, onChange);
});
