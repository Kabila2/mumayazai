// src/hooks/useResponsive.js - Responsive design hook and utilities

import { useState, useEffect, useCallback } from 'react';

// Breakpoint definitions (mobile-first approach)
export const breakpoints = {
  xs: 0,        // Extra small devices (phones)
  sm: 576,      // Small devices (landscape phones)
  md: 768,      // Medium devices (tablets)
  lg: 1024,     // Large devices (desktops) - increased from 992 to 1024
  xl: 1200,     // Extra large devices (large desktops)
  xxl: 1400     // Extra extra large devices
};

// Screen size categories
export const screenSizes = {
  mobile: 'mobile',      // xs to sm
  tablet: 'tablet',      // md
  desktop: 'desktop',    // lg and above
  compact: 'compact'     // height < 600px or landscape mobile
};

/**
 * Get current screen size category
 */
const getScreenSize = (width, height, orientation) => {
  if (width < breakpoints.md) {
    return screenSizes.mobile;
  } else if (width < breakpoints.lg) {
    return screenSizes.tablet;
  } else {
    return screenSizes.desktop;
  }
};

/**
 * Check if screen is compact (low height or landscape mobile)
 */
const isCompactScreen = (width, height) => {
  return height < 600 || (width < breakpoints.md && width > height);
};

/**
 * Main responsive hook
 */
export const useResponsive = () => {
  // State for screen dimensions and breakpoints
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const [orientation, setOrientation] = useState(
    typeof window !== 'undefined' ?
      (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait') :
      'portrait'
  );

  // Update dimensions and orientation
  const updateDimensions = useCallback(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setDimensions({ width, height });
      setOrientation(width > height ? 'landscape' : 'portrait');
    }
  }, []);

  // Effect to handle resize events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Debounced resize handler
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 150);
    };

    // Initial call
    updateDimensions();

    // Add event listeners
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', () => {
      // Delay orientation change to get correct dimensions
      setTimeout(updateDimensions, 100);
    });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, [updateDimensions]);

  // Derived values
  const { width, height } = dimensions;
  const screenSize = getScreenSize(width, height, orientation);
  const isCompact = isCompactScreen(width, height);

  // Breakpoint checks
  const isMobile = width < breakpoints.md;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg;

  // Navigation breakpoint - hamburger menu appears below this width
  const shouldUseHamburgerMenu = width < 1000;
  const isXs = width < breakpoints.sm;
  const isSm = width >= breakpoints.sm && width < breakpoints.md;
  const isMd = width >= breakpoints.md && width < breakpoints.lg;
  const isLg = width >= breakpoints.lg && width < breakpoints.xl;
  const isXl = width >= breakpoints.xl;

  // Device type detection
  const isTouchDevice = typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Screen orientation
  const isPortrait = orientation === 'portrait';
  const isLandscape = orientation === 'landscape';

  // Utility functions
  const getBreakpoint = () => {
    if (width < breakpoints.sm) return 'xs';
    if (width < breakpoints.md) return 'sm';
    if (width < breakpoints.lg) return 'md';
    if (width < breakpoints.xl) return 'lg';
    return 'xl';
  };

  const isBreakpoint = (bp) => {
    return getBreakpoint() === bp;
  };

  const isBreakpointUp = (bp) => {
    return width >= breakpoints[bp];
  };

  const isBreakpointDown = (bp) => {
    return width < breakpoints[bp];
  };

  // Grid column calculation
  const getGridCols = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };

  // Responsive padding/margin
  const getSpacing = (mobile = 1, tablet = 1.5, desktop = 2) => {
    if (isMobile) return `${mobile}rem`;
    if (isTablet) return `${tablet}rem`;
    return `${desktop}rem`;
  };

  // Font size scaling
  const getFontSize = (base = 1, scale = 0.1) => {
    let multiplier = 1;
    if (isMobile) multiplier = 0.9;
    else if (isTablet) multiplier = 0.95;

    return `${base * multiplier}rem`;
  };

  return {
    // Dimensions
    width,
    height,
    orientation,
    screenSize,
    isCompact,

    // Breakpoint checks
    isMobile,
    isTablet,
    isDesktop,
    shouldUseHamburgerMenu,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,

    // Device info
    isTouchDevice,
    isPortrait,
    isLandscape,

    // Utility functions
    getBreakpoint,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    getGridCols,
    getSpacing,
    getFontSize,

    // Raw breakpoints for custom logic
    breakpoints
  };
};

/**
 * Hook for specific breakpoint detection
 */
export const useBreakpoint = (breakpoint) => {
  const { isBreakpointUp } = useResponsive();
  return isBreakpointUp(breakpoint);
};

/**
 * Hook for mobile detection
 */
export const useMobile = () => {
  const { isMobile } = useResponsive();
  return isMobile;
};

/**
 * Hook for touch device detection
 */
export const useTouch = () => {
  const { isTouchDevice } = useResponsive();
  return isTouchDevice;
};

/**
 * Media query utilities
 */
export const mediaQueries = {
  xs: `(max-width: ${breakpoints.sm - 1}px)`,
  sm: `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  md: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lg: `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,

  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,

  compact: `(max-height: 600px), (max-width: ${breakpoints.md - 1}px) and (orientation: landscape)`,
  touch: '(hover: none) and (pointer: coarse)',

  up: {
    xs: `(min-width: ${breakpoints.xs}px)`,
    sm: `(min-width: ${breakpoints.sm}px)`,
    md: `(min-width: ${breakpoints.md}px)`,
    lg: `(min-width: ${breakpoints.lg}px)`,
    xl: `(min-width: ${breakpoints.xl}px)`,
    xxl: `(min-width: ${breakpoints.xxl}px)`
  },

  down: {
    xs: `(max-width: ${breakpoints.sm - 1}px)`,
    sm: `(max-width: ${breakpoints.md - 1}px)`,
    md: `(max-width: ${breakpoints.lg - 1}px)`,
    lg: `(max-width: ${breakpoints.xl - 1}px)`,
    xl: `(max-width: ${breakpoints.xxl - 1}px)`
  }
};

/**
 * CSS-in-JS responsive utilities
 */
export const responsive = {
  // Quick responsive values
  mobile: (styles) => ({
    [`@media ${mediaQueries.mobile}`]: styles
  }),

  tablet: (styles) => ({
    [`@media ${mediaQueries.tablet}`]: styles
  }),

  desktop: (styles) => ({
    [`@media ${mediaQueries.desktop}`]: styles
  }),

  compact: (styles) => ({
    [`@media ${mediaQueries.compact}`]: styles
  }),

  touch: (styles) => ({
    [`@media ${mediaQueries.touch}`]: styles
  }),

  // Breakpoint-specific
  up: (breakpoint, styles) => ({
    [`@media ${mediaQueries.up[breakpoint]}`]: styles
  }),

  down: (breakpoint, styles) => ({
    [`@media ${mediaQueries.down[breakpoint]}`]: styles
  }),

  // Custom media query
  custom: (query, styles) => ({
    [`@media ${query}`]: styles
  })
};

/**
 * Responsive grid system
 */
export const useResponsiveGrid = (columns = { xs: 1, sm: 2, md: 3, lg: 4 }) => {
  const { getBreakpoint } = useResponsive();
  const currentBreakpoint = getBreakpoint();

  // Find the appropriate number of columns for current breakpoint
  const getColumns = () => {
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

    // Start from current breakpoint and work backwards to find defined columns
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (columns[bp] !== undefined) {
        return columns[bp];
      }
    }

    return 1; // fallback
  };

  return {
    columns: getColumns(),
    gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
    gap: getColumns() === 1 ? '1rem' : '1.5rem'
  };
};

export default useResponsive;