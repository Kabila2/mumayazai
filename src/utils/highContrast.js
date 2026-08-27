// src/utils/highContrast.js - High contrast mode
//
// The class lives on <html>, not on .app-container, for two reasons:
//   1. html/body paint the page background, so a container-scoped class leaves
//      the page behind the app in the normal theme.
//   2. Full-screen surfaces (text chat, voice chat) and anything portalled out
//      of the container are still descendants of <html>, so one class covers
//      every screen instead of only the ones inside the container.
//
// All the styling lives in high-contrast.css, which redefines the design
// tokens rather than patching individual components. Same pattern as dark mode
// (see DarkModeToggle), which uses `dark-mode` on <html>.

export const HIGH_CONTRAST_KEY = "high-contrast";
export const HIGH_CONTRAST_CLASS = "high-contrast";
export const HIGH_CONTRAST_EVENT = "stellar:high-contrast-changed";

/** Whether high contrast is switched on, per the saved preference. */
export const isHighContrastEnabled = () => {
  try {
    return localStorage.getItem(HIGH_CONTRAST_KEY) === "true";
  } catch (error) {
    return false;
  }
};

/** Put the class on <html> (or take it off) without touching the preference. */
export const applyHighContrast = (enabled) => {
  document.documentElement.classList.toggle(HIGH_CONTRAST_CLASS, !!enabled);
};

/** Save the preference, apply it, and tell every listening screen. */
export const setHighContrast = (enabled) => {
  try {
    localStorage.setItem(HIGH_CONTRAST_KEY, String(!!enabled));
  } catch (error) {
    // Storage unavailable — still apply it for this session.
  }

  applyHighContrast(enabled);

  window.dispatchEvent(
    new CustomEvent(HIGH_CONTRAST_EVENT, { detail: { enabled: !!enabled } })
  );

  return !!enabled;
};

/** Read the saved preference and apply it. Call once on start-up. */
export const initHighContrast = () => {
  const enabled = isHighContrastEnabled();
  applyHighContrast(enabled);
  return enabled;
};
