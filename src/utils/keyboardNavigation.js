/**
 * Keyboard Navigation Utilities
 * Provides helpers for keyboard accessibility
 */

// Common keyboard codes
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
};

/**
 * Handle keyboard navigation for clickable elements
 */
export const handleKeyboardClick = (event, callback) => {
  if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
    event.preventDefault();
    callback(event);
  }
};

/**
 * Handle escape key to close modals/dialogs
 */
export const handleEscapeKey = (event, callback) => {
  if (event.key === KEYS.ESCAPE) {
    callback(event);
  }
};

/**
 * Trap focus within a modal/dialog
 */
export const trapFocus = (element) => {
  if (!element) return null;

  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== KEYS.TAB) return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Handle arrow key navigation in lists
 */
export const handleArrowNavigation = (event, items, currentIndex, onSelect) => {
  let newIndex = currentIndex;

  switch (event.key) {
    case KEYS.ARROW_DOWN:
      event.preventDefault();
      newIndex = Math.min(currentIndex + 1, items.length - 1);
      break;
    case KEYS.ARROW_UP:
      event.preventDefault();
      newIndex = Math.max(currentIndex - 1, 0);
      break;
    case KEYS.HOME:
      event.preventDefault();
      newIndex = 0;
      break;
    case KEYS.END:
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    case KEYS.ENTER:
    case KEYS.SPACE:
      event.preventDefault();
      onSelect(items[currentIndex]);
      return currentIndex;
    default:
      return currentIndex;
  }

  // Focus the new item
  if (items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
};

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority); // 'polite' or 'assertive'
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Skip to main content
 */
export const createSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  });
  return skipLink;
};

/**
 * Get accessible label for element
 */
export const getAccessibleLabel = (element, language = 'en') => {
  return element.getAttribute('aria-label') ||
         element.getAttribute('aria-labelledby') ||
         element.textContent ||
         element.alt ||
         element.title ||
         '';
};

export default {
  KEYS,
  handleKeyboardClick,
  handleEscapeKey,
  trapFocus,
  handleArrowNavigation,
  announceToScreenReader,
  createSkipLink,
  getAccessibleLabel
};
