import { render, screen } from '@testing-library/react';
import App from './App';

// The entry page's animated orb is WebGL (via the ESM-only `ogl` package),
// which neither Jest's transform nor jsdom can run — stub it out.
jest.mock('./blocks/Orb/Orb', () => () => null);
jest.mock('./blocks/Ribbons/Ribbons', () => () => null);

beforeAll(() => {
  // jsdom has no Web Speech API; the app reads the voice list on startup.
  window.speechSynthesis = {
    getVoices: () => [],
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onvoiceschanged: null
  };
  window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
    this.text = text;
  };
});

beforeEach(() => {
  localStorage.clear();
});

test('signed-out visitors land on the entry page with sign-in and sign-up', () => {
  render(<App />);
  expect(screen.getAllByRole('button', { name: /sign in/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole('button', { name: /sign up/i }).length).toBeGreaterThan(0);
});
