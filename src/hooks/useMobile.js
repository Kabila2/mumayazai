// src/hooks/useMobile.js - Enhanced React Hooks for Mobile Optimization
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import MobileUtils from '../utils/mobileUtils';

/* ==================== SCREEN SIZE HOOK ==================== */

/**
 * Enhanced screen size hook with auto-adjustment capabilities
 */
export const useScreenSize = () => {
  const [screenData, setScreenData] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: MobileUtils.DeviceDetector.isMobile(),
    isTablet: MobileUtils.DeviceDetector.isTablet(),
    isDesktop: MobileUtils.DeviceDetector.isDesktop(),
    isSmallScreen: MobileUtils.DeviceDetector.isSmallScreen(),
    orientation: MobileUtils.OrientationUtils.getCurrentOrientation(),
    devicePixelRatio: MobileUtils.DeviceDetector.getPixelRatio(),
    breakpoint: getCurrentBreakpoint(),
    safeArea: MobileUtils.DeviceDetector.getSafeAreaInsets()
  }));

  const updateScreenData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setScreenData({
      width,
      height,
      isMobile: width < MobileUtils.Breakpoints.md,
      isTablet: width >= MobileUtils.Breakpoints.md && width < MobileUtils.Breakpoints.lg,
      isDesktop: width >= MobileUtils.Breakpoints.lg,
      isSmallScreen: width < MobileUtils.Breakpoints.sm,
      orientation: height > width ? 'portrait' : 'landscape',
      devicePixelRatio: window.devicePixelRatio || 1,
      breakpoint: getCurrentBreakpoint(width),
      safeArea: MobileUtils.DeviceDetector.getSafeAreaInsets()
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    updateScreenData();
    
    const debouncedUpdate = MobileUtils.PerformanceUtils.debounce(updateScreenData, 150);
    const throttledUpdate = MobileUtils.PerformanceUtils.rafThrottle(updateScreenData);
    
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScreenData, 100);
    });
    
    // Listen for safe area changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', updateScreenData);
    
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', updateScreenData);
      mediaQuery.removeEventListener('change', updateScreenData);
    };
  }, [updateScreenData]);

  return screenData;
};

// Helper function to get current breakpoint
function getCurrentBreakpoint(width = window?.innerWidth || 0) {
  if (width < MobileUtils.Breakpoints.sm) return 'xs';
  if (width < MobileUtils.Breakpoints.md) return 'sm';
  if (width < MobileUtils.Breakpoints.lg) return 'md';
  if (width < MobileUtils.Breakpoints.xl) return 'lg';
  if (width < MobileUtils.Breakpoints.xxl) return 'xl';
  return 'xxl';
}

/* ==================== VIEWPORT HEIGHT HOOK ==================== */

/**
 * Handles mobile viewport height issues and dynamic viewport units
 */
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return window.innerHeight;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateViewportHeight = () => {
      const vh = window.innerHeight;
      setViewportHeight(vh);
      
      // Update CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
      document.documentElement.style.setProperty('--dvh', `${vh}px`);
    };

    updateViewportHeight();

    const throttledUpdate = MobileUtils.PerformanceUtils.throttle(updateViewportHeight, 100);
    
    window.addEventListener('resize', throttledUpdate);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateViewportHeight, 100);
    });

    return () => {
      window.removeEventListener('resize', throttledUpdate);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return {
    height: viewportHeight,
    vh: viewportHeight * 0.01,
    dvh: viewportHeight
  };
};

/* ==================== TOUCH GESTURES HOOK ==================== */

/**
 * Advanced touch gesture detection hook
 */
export const useTouchGestures = (elementRef, options = {}) => {
  const {
    onSwipe,
    onPinch,
    onTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
    tapThreshold = 10
  } = options;

  const touchStartRef = useRef(null);
  const touchTimeRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchTimeRef.current = Date.now();

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(e);
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e) => {
    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle pinch gestures
    if (e.touches.length === 2 && onPinch) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = MobileUtils.TouchUtils.getTouchDistance(touch1, touch2);
      const center = MobileUtils.TouchUtils.getTouchCenter(touch1, touch2);
      
      onPinch({
        distance,
        center,
        touches: [touch1, touch2]
      });
    }
  }, [onPinch]);

  const handleTouchEnd = useCallback((e) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Detect tap
    if (distance < tapThreshold && deltaTime < 300 && onTap) {
      onTap({
        x: touch.clientX,
        y: touch.clientY,
        deltaTime
      });
    }

    // Detect swipe
    if (distance > swipeThreshold && onSwipe) {
      const direction = MobileUtils.TouchUtils.getSwipeDirection(touchStartRef.current, touch);
      onSwipe({
        direction,
        distance,
        deltaX,
        deltaY,
        deltaTime,
        velocity: distance / deltaTime
      });
    }

    touchStartRef.current = null;
  }, [onSwipe, onTap, swipeThreshold, tapThreshold]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};

/* ==================== DEVICE CAPABILITIES HOOK ==================== */

/**
 * Detects and monitors device capabilities
 */
export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: null,
    batteryLevel: null,
    isCharging: null,
    memoryUsage: null,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1,
    deviceMemory: typeof navigator !== 'undefined' ? navigator.deviceMemory || 1 : 1,
    maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0
  });

  useEffect(() => {
    // Network status
    const updateOnlineStatus = () => {
      setCapabilities(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));
    };

    // Connection info
    const updateConnectionInfo = () => {
      const connectionInfo = MobileUtils.PerformanceUtils.getConnectionInfo();
      if (connectionInfo) {
        setCapabilities(prev => ({
          ...prev,
          connectionType: connectionInfo.effectiveType,
          downlink: connectionInfo.downlink,
          rtt: connectionInfo.rtt,
          saveData: connectionInfo.saveData
        }));
      }
    };

    // Battery info
    const updateBatteryInfo = async () => {
      if (navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          setCapabilities(prev => ({
            ...prev,
            batteryLevel: battery.level,
            isCharging: battery.charging
          }));

          const handleBatteryChange = () => {
            setCapabilities(prev => ({
              ...prev,
              batteryLevel: battery.level,
              isCharging: battery.charging
            }));
          };

          battery.addEventListener('chargingchange', handleBatteryChange);
          battery.addEventListener('levelchange', handleBatteryChange);

          return () => {
            battery.removeEventListener('chargingchange', handleBatteryChange);
            battery.removeEventListener('levelchange', handleBatteryChange);
          };
        } catch (error) {
          console.warn('Battery API not available:', error);
        }
      }
    };

    // Memory usage
    const updateMemoryUsage = () => {
      const memoryInfo = MobileUtils.PerformanceUtils.getMemoryUsage();
      if (memoryInfo) {
        setCapabilities(prev => ({
          ...prev,
          memoryUsage: {
            used: memoryInfo.used,
            total: memoryInfo.total,
            percentage: (memoryInfo.used / memoryInfo.total) * 100
          }
        }));
      }
    };

    // Initial updates
    updateOnlineStatus();
    updateConnectionInfo();
    updateBatteryInfo();
    updateMemoryUsage();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
    }

    // Memory monitoring interval (every 30 seconds)
    const memoryInterval = setInterval(updateMemoryUsage, 30000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateConnectionInfo);
      }
      
      clearInterval(memoryInterval);
    };
  }, []);

  return capabilities;
};

/* ==================== ACCESSIBILITY PREFERENCES HOOK ==================== */

/**
 * Manages and auto-adjusts accessibility preferences
 */
export const useAccessibilityPreferences = (screenSize) => {
  const [preferences, setPreferences] = useState(() => {
    const stored = MobileUtils.StorageUtils.getItem('accessibility_prefs', {});
    return {
      fontSize: stored.fontSize || (screenSize?.isMobile ? 1.0 : 1.1),
      highContrast: stored.highContrast || MobileUtils.AccessibilityUtils.prefersHighContrast(),
      reducedMotion: stored.reducedMotion || MobileUtils.AccessibilityUtils.prefersReducedMotion(),
      largeButtons: stored.largeButtons || screenSize?.isMobile || false,
      autoAdjust: stored.autoAdjust !== false,
      ...stored
    };
  });

  // Auto-adjust based on screen size and capabilities
  const autoAdjust = useCallback(() => {
    if (!preferences.autoAdjust || !screenSize) return;

    const newPrefs = { ...preferences };
    let hasChanges = false;

    // Calculate optimal font size
    const optimalFontSize = MobileUtils.AccessibilityUtils.calculateOptimalFontSize(
      screenSize.width,
      16
    ) / 16; // Convert to rem

    if (Math.abs(newPrefs.fontSize - optimalFontSize) > 0.05) {
      newPrefs.fontSize = optimalFontSize;
      hasChanges = true;
    }

    // Auto-enable large buttons on mobile
    const shouldUseLargeButtons = screenSize.isMobile || screenSize.isSmallScreen;
    if (newPrefs.largeButtons !== shouldUseLargeButtons) {
      newPrefs.largeButtons = shouldUseLargeButtons;
      hasChanges = true;
    }

    // Auto-enable reduced motion based on system preference
    const prefersReducedMotion = MobileUtils.AccessibilityUtils.prefersReducedMotion();
    if (prefersReducedMotion && !newPrefs.reducedMotion) {
      newPrefs.reducedMotion = true;
      hasChanges = true;
    }

    // Auto-adjust for landscape mode on small screens
    if (screenSize.orientation === 'landscape' && screenSize.height < 500) {
      if (newPrefs.fontSize > 0.95) {
        newPrefs.fontSize = 0.95;
        hasChanges = true;
      }
      if (!newPrefs.reducedMotion) {
        newPrefs.reducedMotion = true;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setPreferences(newPrefs);
      MobileUtils.StorageUtils.setItem('accessibility_prefs', newPrefs);
    }
  }, [preferences, screenSize]);

  // Update preference function
  const updatePreference = useCallback((key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    MobileUtils.StorageUtils.setItem('accessibility_prefs', newPrefs);
  }, [preferences]);

  // Auto-adjust when screen size changes
  useEffect(() => {
    autoAdjust();
  }, [screenSize]);

  // Apply preferences to DOM
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--user-font-size', `${preferences.fontSize}rem`);
    root.style.setProperty('--optimal-touch-target', 
      `${MobileUtils.AccessibilityUtils.calculateTouchTargetSize(screenSize?.width || 768)}px`
    );
    
    // Apply CSS classes
    root.classList.toggle('high-contrast', preferences.highContrast);
    root.classList.toggle('reduced-motion', preferences.reducedMotion);
    root.classList.toggle('large-buttons', preferences.largeButtons);
  }, [preferences, screenSize]);

  return {
    preferences,
    updatePreference,
    autoAdjust
  };
};

/* ==================== KEYBOARD DETECTION HOOK ==================== */

/**
 * Detects virtual keyboard presence on mobile devices
 */
export const useKeyboardDetection = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const initialHeightRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    initialHeightRef.current = window.innerHeight;

    const detectKeyboard = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeightRef.current - currentHeight;
      const isVisible = heightDifference > 150; // Threshold for keyboard
      
      setIsKeyboardVisible(isVisible);
      setKeyboardHeight(isVisible ? heightDifference : 0);
      
      // Update CSS custom property
      document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`);
    };

    const throttledDetection = MobileUtils.PerformanceUtils.throttle(detectKeyboard, 100);

    window.addEventListener('resize', throttledDetection);
    
    // iOS Safari specific handling
    if (MobileUtils.DeviceDetector.isIOS()) {
      window.addEventListener('focusin', () => {
        setTimeout(detectKeyboard, 300);
      });
      
      window.addEventListener('focusout', () => {
        setTimeout(detectKeyboard, 300);
      });
    }

    return () => {
      window.removeEventListener('resize', throttledDetection);
    };
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight
  };
};

/* ==================== PERFORMANCE MONITORING HOOK ==================== */

/**
 * Monitors app performance and suggests optimizations
 */
export const usePerformanceMonitor = () => {
  const [performanceData, setPerformanceData] = useState({
    fps: 60,
    memoryUsage: null,
    renderTime: null,
    isLowEndDevice: MobileUtils.DeviceDetector.isLowEndDevice(),
    connectionQuality: 'good',
    batteryLevel: null
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderTimesRef = useRef([]);

  useEffect(() => {
    let animationFrameId;

    // FPS monitoring
    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        setPerformanceData(prev => ({ ...prev, fps }));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    // Memory monitoring
    const monitorMemory = () => {
      const memoryInfo = MobileUtils.PerformanceUtils.getMemoryUsage();
      const connectionInfo = MobileUtils.PerformanceUtils.getConnectionInfo();
      
      if (memoryInfo || connectionInfo) {
        setPerformanceData(prev => ({
          ...prev,
          memoryUsage: memoryInfo,
          connectionQuality: connectionInfo?.effectiveType || 'unknown'
        }));
      }
    };

    const memoryInterval = setInterval(monitorMemory, 10000); // Every 10 seconds

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(memoryInterval);
    };
  }, []);

  // Performance suggestions
  const suggestions = useMemo(() => {
    const suggestions = [];

    if (performanceData.fps < 30) {
      suggestions.push({
        type: 'performance',
        message: 'Low frame rate detected. Consider reducing animations.',
        priority: 'high'
      });
    }

    if (performanceData.memoryUsage && performanceData.memoryUsage.percentage > 80) {
      suggestions.push({
        type: 'memory',
        message: 'High memory usage detected.',
        priority: 'medium'
      });
    }

    if (performanceData.connectionQuality === 'slow-2g' || performanceData.connectionQuality === '2g') {
      suggestions.push({
        type: 'network',
        message: 'Slow connection detected. Consider reducing data usage.',
        priority: 'medium'
      });
    }

    return suggestions;
  }, [performanceData]);

  return {
    performanceData,
    suggestions,
    isOptimalPerformance: performanceData.fps >= 30 && 
                         (!performanceData.memoryUsage || performanceData.memoryUsage.percentage < 70)
  };
};

/* ==================== FORM OPTIMIZATION HOOK ==================== */

/**
 * Optimizes forms for mobile devices
 */
export const useMobileForm = (fieldConfigs = {}) => {
  const screenSize = useScreenSize();

  const getOptimizedInputProps = useCallback((fieldName, userProps = {}) => {
    const fieldConfig = fieldConfigs[fieldName] || {};
    
    return {
      type: MobileUtils.FormUtils.getOptimalInputType(fieldName),
      inputMode: MobileUtils.FormUtils.getOptimalInputMode(userProps.type || 'text'),
      autoCapitalize: MobileUtils.FormUtils.getAutoCapitalize(fieldName),
      autoComplete: fieldConfig.autoComplete || 'on',
      autoCorrect: fieldConfig.autoCorrect !== false ? 'on' : 'off',
      spellCheck: fieldConfig.spellCheck !== false,
      enterKeyHint: fieldConfig.enterKeyHint || 'done',
      ...userProps,
      style: {
        fontSize: screenSize.isMobile ? '16px' : '14px', // Prevent zoom on iOS
        minHeight: screenSize.isMobile ? '44px' : '36px',
        ...userProps.style
      }
    };
  }, [fieldConfigs, screenSize]);

  return {
    getOptimizedInputProps,
    isMobile: screenSize.isMobile
  };
};

/* ==================== ORIENTATION CHANGE HOOK ==================== */

/**
 * Handles orientation changes with proper timing
 */
export const useOrientationChange = (callback) => {
  const [orientation, setOrientation] = useState(
    MobileUtils.OrientationUtils.getCurrentOrientation()
  );

  useEffect(() => {
    const handleOrientationChange = MobileUtils.PerformanceUtils.debounce(() => {
      const newOrientation = MobileUtils.OrientationUtils.getCurrentOrientation();
      setOrientation(newOrientation);
      
      if (callback) {
        callback(newOrientation);
      }
    }, 150);

    const cleanup = MobileUtils.OrientationUtils.onOrientationChange(handleOrientationChange);

    return cleanup;
  }, [callback]);

  return orientation;
};

/* ==================== EXPORT ALL HOOKS ==================== */

export {
  useScreenSize,
  useViewportHeight,
  useTouchGestures,
  useDeviceCapabilities,
  useAccessibilityPreferences,
  useKeyboardDetection,
  usePerformanceMonitor,
  useMobileForm,
  useOrientationChange
};