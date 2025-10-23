// Design Tokens System - Modern Coffee Shop Theme
// Based on 2024/2025 design trends with proper semantic naming

export const colors = {
  // Primary - Coffee Brown palette
  primary: {
    50: '#f9f7f4',
    100: '#f0ebe3',
    200: '#e0d5c7',
    300: '#cbb8a3',
    400: '#b59a7e',
    500: '#9a7e63',
    600: '#6F4E37', // Main brand color
    700: '#5a3e2c',
    800: '#4a3324',
    900: '#3d2b1f',
  },

  // Secondary - Warm Beige palette
  secondary: {
    50: '#fefdfb',
    100: '#fcfaf5',
    200: '#f9f5eb',
    300: '#f5ede0',
    400: '#f0e4d1',
    500: '#F5F5DC', // Main beige
    600: '#d9d4ba',
    700: '#b8af93',
    800: '#8f8872',
    900: '#6e6959',
  },

  // Accent - Fresh Green palette
  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#4CAF50', // Main accent
    600: '#22c55e',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Status colors
  success: '#2a9d8f',
  warning: '#f1c40f',
  error: '#e63946',
  info: '#3498db',

  // Neutrals - Rich grays
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  text: {
    primary: '#22223b',
    secondary: '#4a4e69',
    tertiary: '#777',
    disabled: '#a3a3a3',
    inverse: '#ffffff',
  },

  background: {
    primary: '#f9f9f9',
    secondary: '#ffffff',
    tertiary: '#f2e9e4',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  border: {
    light: '#f0f0f0',
    main: '#dedede',
    dark: '#c0c0c0',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
};

export const typography = {
  fontFamily: {
    primary: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'SF Mono', 'Monaco', 'Courier New', monospace",
  },

  fontSize: {
    xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',      // 12-14px
    sm: 'clamp(0.875rem, 0.8rem + 0.35vw, 1rem)',         // 14-16px
    base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',        // 16-18px
    lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',       // 18-20px
    xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',        // 20-24px
    '2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',       // 24-30px
    '3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',  // 30-36px
    '4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',       // 36-48px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Colored shadows for elevation
  elevated: '0 4px 12px rgba(111, 78, 55, 0.08)',
  elevatedHover: '0 8px 24px rgba(111, 78, 55, 0.12)',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Specific transition properties
  all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'background-color 200ms ease-in-out, border-color 200ms ease-in-out, color 200ms ease-in-out',
  transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 200ms ease-in-out',
};

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 100,
  fixed: 200,
  modalBackdrop: 1000,
  modal: 1001,
  popover: 1010,
  tooltip: 1020,
  notification: 1030,
};

// Utility function to create glassmorphism effect
export const glassmorphism = (opacity = 0.8, blur = 12) => ({
  background: `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
  border: '1px solid rgba(255, 255, 255, 0.3)',
});

// Utility function for gradient backgrounds
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
  accent: `linear-gradient(135deg, ${colors.accent[500]} 0%, ${colors.accent[600]} 100%)`,
  warm: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.accent[400]} 100%)`,
  subtle: `linear-gradient(to bottom, ${colors.gray[50]} 0%, ${colors.background.primary} 100%)`,
};

// Animation keyframes as objects for Framer Motion
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  },

  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },

  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },

  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatDelay: 3,
      },
    },
  },
};

// Export combined theme object
export const theme = {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  transitions,
  breakpoints,
  zIndex,
  glassmorphism,
  gradients,
  animations,
};

export default theme;
