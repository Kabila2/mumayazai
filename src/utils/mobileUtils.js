// src/utils/mobileUtils.js - Comprehensive Mobile Optimization Utilities
// Ultra-optimized mobile-first utilities for React applications

/* ==================== DEVICE DETECTION ==================== */

/**
 * Comprehensive device detection with enhanced mobile capabilities
 */
export const DeviceDetector = {
  // User Agent Detection
  getUserAgent: () => typeof navigator !== 'undefined' ? navigator.userAgent : '',
  
  // Mobile Detection
  isMobile: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  isTablet: () => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= 768 && width < 1024;
  },
  
  isDesktop: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  },
  
  // Specific Device Detection
  isIOS: () => /iPad|iPhone|iPod/.test(DeviceDetector.getUserAgent()),
  isAndroid: () => /Android/.test(DeviceDetector.getUserAgent()),
  isSafari: () => /Safari/.test(DeviceDetector.getUserAgent()) && !/Chrome/.test(DeviceDetector.getUserAgent()),
  isChrome: () => /Chrome/.test(DeviceDetector.getUserAgent()),
  isFirefox: () => /Firefox/.test(DeviceDetector.getUserAgent()),
  
  // Screen Size Categories
  isSmallScreen: () => typeof window !== 'undefined' && window.innerWidth < 480,
  isMediumScreen: () => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= 480 && width < 768;
  },
  isLargeScreen: () => typeof window !== 'undefined' && window.innerWidth >= 1200,
  
  // Orientation
  isPortrait: () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth,
  isLandscape: () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight,
  
  // Touch Support
  isTouchDevice: () => {
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           navigator.msMaxTouchPoints > 0;
  },
  
  // Network Detection
  isSlowConnection: () => {
    if (typeof navigator === 'undefined' || !navigator.connection) return false;
    const connection = navigator.connection;
    return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
  },
  
  // Battery Status
  isBatterySaving: async () => {
    if (typeof navigator === 'undefined' || !navigator.getBattery) return false;
    try {
      const battery = await navigator.getBattery();
      return battery.level < 0.2 || battery.charging === false;
    } catch {
      return false;
    }
  },
  
  // Performance Detection
  isLowEndDevice: () => {
    if (typeof navigator === 'undefined') return false;
    // Check for low-end device indicators
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = navigator.deviceMemory || 1;
    return hardwareConcurrency <= 2 || deviceMemory <= 2;
  },
  
  // Screen Density
  getPixelRatio: () => typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  isHighDPI: () => DeviceDetector.getPixelRatio() > 1.5,
  
  // Viewport Detection
  getViewportSize: () => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    };
  },
  
  // Safe Area Detection
  getSafeAreaInsets: () => {
    if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
    };
  }
};

/* ==================== RESPONSIVE BREAKPOINTS ==================== */

export const Breakpoints = {
  xs: 320,   // Extra small devices
  sm: 480,   // Small devices  
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (small laptops)
  xl: 1200,  // Extra large devices
  xxl: 1440  // Extra extra large devices
};

export const BreakpointHelpers = {
  above: (breakpoint) => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > Breakpoints[breakpoint];
  },
  
  below: (breakpoint) => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < Breakpoints[breakpoint];
  },
  
  between: (min, max) => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= Breakpoints[min] && width <= Breakpoints[max];
  },
  
  only: (breakpoint) => {
    const breakpointKeys = Object.keys(Breakpoints);
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    if (currentIndex === -1) return false;
    
    const current = Breakpoints[breakpoint];
    const next = Breakpoints[breakpointKeys[currentIndex + 1]] || Infinity;
    
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= current && width < next;
  }
};

/* ==================== TOUCH UTILITIES ==================== */

export const TouchUtils = {
  // Touch Event Helpers
  getTouchDistance: (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  getTouchCenter: (touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  },
  
  // Gesture Detection
  isSwipe: (startTouch, endTouch, threshold = 50) => {
    const dx = endTouch.clientX - startTouch.clientX;
    const dy = endTouch.clientY - startTouch.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance > threshold;
  },
  
  getSwipeDirection: (startTouch, endTouch) => {
    const dx = endTouch.clientX - startTouch.clientX;
    const dy = endTouch.clientY - startTouch.clientY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  },
  
  // Touch Target Size Validation
  isValidTouchTarget: (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const minSize = 44; // iOS HIG minimum
    return rect.width >= minSize && rect.height >= minSize;
  },
  
  // Prevent Default Touch Behaviors
  preventBounce: (element) => {
    if (!element) return;
    element.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  },
  
  // Enable Touch Scroll
  enableTouchScroll: (element) => {
    if (!element) return;
    element.style.webkitOverflowScrolling = 'touch';
    element.style.overflowScrolling = 'touch';
  }
};

/* ==================== VIEWPORT UTILITIES ==================== */

export const ViewportUtils = {
  // Viewport Height Fix for Mobile
  setViewportHeight: () => {
    if (typeof window === 'undefined') return;
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  },
  
  // Dynamic Viewport Units
  getDynamicViewport: () => {
    if (typeof window === 'undefined') return { dvw: 0, dvh: 0 };
    return {
      dvw: window.innerWidth,
      dvh: window.innerHeight
    };
  },
  
  // Safe Area Support
  applySafeArea: () => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    
    // Set CSS custom properties for safe areas
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
    root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
    root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
  },
  
  // Keyboard Detection for Mobile
  detectKeyboard: () => {
    if (typeof window === 'undefined') return false;
    const initialHeight = window.innerHeight;
    
    return new Promise((resolve) => {
      const checkHeight = () => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialHeight - currentHeight;
        const keyboardVisible = heightDifference > 150; // Threshold for keyboard
        resolve(keyboardVisible);
      };
      
      setTimeout(checkHeight, 300); // Wait for keyboard animation
    });
  },
  
  // Scroll Position Management
  getScrollPosition: () => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  },
  
  scrollToTop: (smooth = true) => {
    if (typeof window === 'undefined') return;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'instant'
    });
  },
  
  // Prevent Body Scroll (useful for modals)
  preventBodyScroll: () => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  },
  
  enableBodyScroll: () => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
};

/* ==================== PERFORMANCE UTILITIES ==================== */

export const PerformanceUtils = {
  // Debounce Function
  debounce: (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },
  
  // Throttle Function
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // RAF-based Animation
  rafThrottle: (func) => {
    let rafId = null;
    return function(...args) {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          func.apply(this, args);
          rafId = null;
        });
      }
    };
  },
  
  // Lazy Loading Helper
  createIntersectionObserver: (callback, options = {}) => {
    const defaultOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for older browsers
      setTimeout(() => callback([{ isIntersecting: true }]), 100);
      return { observe: () => {}, unobserve: () => {}, disconnect: () => {} };
    }
    
    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
  },
  
  // Memory Usage Estimation
  getMemoryUsage: () => {
    if (typeof performance === 'undefined' || !performance.memory) return null;
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    };
  },
  
  // Connection Quality
  getConnectionInfo: () => {
    if (typeof navigator === 'undefined' || !navigator.connection) return null;
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
};

/* ==================== ACCESSIBILITY UTILITIES ==================== */

export const AccessibilityUtils = {
  // Reduced Motion Detection
  prefersReducedMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // High Contrast Detection
  prefersHighContrast: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  // Color Scheme Detection
  prefersDarkMode: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  // Font Size Calculation
  calculateOptimalFontSize: (screenWidth, baseSize = 16) => {
    if (screenWidth < Breakpoints.sm) return Math.max(baseSize * 0.875, 14);
    if (screenWidth < Breakpoints.md) return baseSize;
    if (screenWidth < Breakpoints.lg) return baseSize * 1.125;
    return baseSize * 1.25;
  },
  
  // Touch Target Size Calculation
  calculateTouchTargetSize: (screenWidth, baseSize = 44) => {
    const ratio = Math.min(screenWidth / Breakpoints.md, 1.2);
    return Math.max(baseSize * ratio, 44); // Minimum 44px for accessibility
  },
  
  // Focus Management
  trapFocus: (element) => {
    if (!element) return;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    return () => element.removeEventListener('keydown', handleTabKey);
  },
  
  // Screen Reader Announcements
  announceToScreenReader: (message, priority = 'polite') => {
    if (typeof document === 'undefined') return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
};

/* ==================== FORM UTILITIES ==================== */

export const FormUtils = {
  // Input Type Detection for Mobile
  getOptimalInputType: (fieldName) => {
    const field = fieldName.toLowerCase();
    
    if (field.includes('email')) return 'email';
    if (field.includes('phone') || field.includes('tel')) return 'tel';
    if (field.includes('number') || field.includes('age')) return 'number';
    if (field.includes('url') || field.includes('website')) return 'url';
    if (field.includes('search')) return 'search';
    if (field.includes('password')) return 'password';
    if (field.includes('date')) return 'date';
    if (field.includes('time')) return 'time';
    
    return 'text';
  },
  
  // Input Mode for Better Mobile Keyboards
  getOptimalInputMode: (inputType) => {
    switch (inputType) {
      case 'email': return 'email';
      case 'tel': return 'tel';
      case 'number': return 'numeric';
      case 'url': return 'url';
      case 'search': return 'search';
      default: return 'text';
    }
  },
  
  // Auto-capitalize Settings
  getAutoCapitalize: (fieldName) => {
    const field = fieldName.toLowerCase();
    
    if (field.includes('name') || field.includes('title')) return 'words';
    if (field.includes('sentence') || field.includes('description')) return 'sentences';
    if (field.includes('email') || field.includes('username') || field.includes('password')) return 'none';
    
    return 'sentences';
  }
};

/* ==================== STORAGE UTILITIES ==================== */

export const StorageUtils = {
  // Safe Local Storage
  setItem: (key, value) => {
    try {
      if (typeof Storage === 'undefined') return false;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('localStorage setItem failed:', error);
      return false;
    }
  },
  
  getItem: (key, defaultValue = null) => {
    try {
      if (typeof Storage === 'undefined') return defaultValue;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('localStorage getItem failed:', error);
      return defaultValue;
    }
  },
  
  removeItem: (key) => {
    try {
      if (typeof Storage === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
      return false;
    }
  },
  
  // Storage Size Detection
  getStorageSize: () => {
    if (typeof Storage === 'undefined') return 0;
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  },
  
  // Clear Old Data
  clearExpiredData: (expirationKey = '_expiration') => {
    if (typeof Storage === 'undefined') return;
    
    const now = Date.now();
    const keysToRemove = [];
    
    for (let key in localStorage) {
      if (key.endsWith(expirationKey)) {
        const expiration = parseInt(localStorage.getItem(key));
        if (expiration < now) {
          const dataKey = key.replace(expirationKey, '');
          keysToRemove.push(key, dataKey);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

/* ==================== MOBILE-SPECIFIC EVENT HANDLERS ==================== */

export const MobileEventHandlers = {
  // Enhanced Click Handler for Mobile
  createTapHandler: (callback, options = {}) => {
    const { 
      preventDefault = true, 
      stopPropagation = true,
      tapThreshold = 10,
      timeThreshold = 300
    } = options;
    
    let touchStartPos = null;
    let touchStartTime = null;
    
    const handleTouchStart = (e) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      touchStartTime = Date.now();
    };
    
    const handleTouchEnd = (e) => {
      if (!touchStartPos || !touchStartTime) return;
      
      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);
      const deltaTime = Date.now() - touchStartTime;
      
      const isValidTap = deltaX < tapThreshold && 
                        deltaY < tapThreshold && 
                        deltaTime < timeThreshold;
      
      if (isValidTap) {
        callback(e);
      }
      
      touchStartPos = null;
      touchStartTime = null;
    };
    
    const handleClick = (e) => {
      // Fallback for non-touch devices
      if (!DeviceDetector.isTouchDevice()) {
        callback(e);
      }
    };
    
    return {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onClick: handleClick
    };
  },
  
  // Long Press Handler
  createLongPressHandler: (callback, duration = 500) => {
    let pressTimer = null;
    
    const start = (e) => {
      pressTimer = setTimeout(() => {
        callback(e);
      }, duration);
    };
    
    const cancel = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };
    
    return {
      onTouchStart: start,
      onTouchEnd: cancel,
      onTouchMove: cancel,
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel
    };
  }
};

/* ==================== ORIENTATION UTILITIES ==================== */

export const OrientationUtils = {
  // Get Current Orientation
  getCurrentOrientation: () => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  },
  
  // Lock Orientation (if supported)
  lockOrientation: (orientation) => {
    if (typeof screen === 'undefined' || !screen.orientation) return false;
    
    try {
      screen.orientation.lock(orientation);
      return true;
    } catch (error) {
      console.warn('Orientation lock failed:', error);
      return false;
    }
  },
  
  // Unlock Orientation
  unlockOrientation: () => {
    if (typeof screen === 'undefined' || !screen.orientation) return false;
    
    try {
      screen.orientation.unlock();
      return true;
    } catch (error) {
      console.warn('Orientation unlock failed:', error);
      return false;
    }
  },
  
  // Orientation Change Handler
  onOrientationChange: (callback) => {
    if (typeof window === 'undefined') return () => {};
    
    const handler = () => {
      // Use timeout to ensure dimensions are updated
      setTimeout(() => {
        callback(OrientationUtils.getCurrentOrientation());
      }, 100);
    };
    
    window.addEventListener('orientationchange', handler);
    window.addEventListener('resize', handler);
    
    return () => {
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener('resize', handler);
    };
  }
};

/* ==================== EXPORT ALL UTILITIES ==================== */

export default {
  DeviceDetector,
  Breakpoints,
  BreakpointHelpers,
  TouchUtils,
  ViewportUtils,
  PerformanceUtils,
  AccessibilityUtils,
  FormUtils,
  StorageUtils,
  MobileEventHandlers,
  OrientationUtils
};