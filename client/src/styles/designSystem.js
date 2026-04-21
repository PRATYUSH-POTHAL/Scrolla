/**
 * Hand-Drawn Design System
 * Core tokens, utilities, and constants for the Scrolla hand-drawn aesthetic
 */

export const colors = {
  // Primary palette
  bg: '#fdfbf7',           // Warm Paper
  fg: '#2d2d2d',           // Soft Pencil Black
  muted: '#e5e0d8',        // Old Paper / Erased Pencil
  accent: '#ff4d4d',       // Red Correction Marker
  accentDark: '#e63946',   // Darker red for states
  secondary: '#2d5da1',    // Blue Ballpoint Pen
  secondaryLight: '#4a7ba7', // Lighter blue for hover
  white: '#ffffff',
  black: '#2d2d2d',
  
  // Contextual colors (keep from original for now)
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

/**
 * Wobbly border-radius values
 * Use these to create irregular, hand-drawn edges
 */
export const radius = {
  // Small wobbly (buttons, small elements)
  wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
  wobblyXs: '244px 44px 224px 64px / 84px 244px 64px 44px',
  
  // Medium wobbly (cards, containers)
  wobblyMd: '268px 248px 284px 234px / 242px 300px 264px 276px',
  wobblyLg: '298px 258px 244px 274px / 274px 244px 258px 298px',
  
  // Subtle wobbly (inputs, fields)
  wobblySubtle: '256px 16px 226px 16px / 16px 226px 16px 256px',
  
  // Post-it style (organic square)
  sticky: '216px 234px 256px 248px / 248px 256px 234px 216px',
};

/**
 * Shadow effects
 * Hard offset shadows for cut-paper collage aesthetic
 */
export const shadows = {
  // Standard offset shadow
  offsetSm: '2px 2px 0px 0px rgba(45, 45, 45, 0.15)',
  offset: '4px 4px 0px 0px #2d2d2d',
  offsetLg: '6px 6px 0px 0px #2d2d2d',
  offsetXl: '8px 8px 0px 0px #2d2d2d',
  
  // Hover/active states (reduced offset)
  offsetHover: '2px 2px 0px 0px #2d2d2d',
  offsetActive: '0px 0px 0px 0px transparent',
  
  // Subtle shadows
  subtle: '3px 3px 0px 0px rgba(45, 45, 45, 0.1)',
  subtleLift: '2px 2px 0px 0px rgba(45, 45, 45, 0.08)',
};

/**
 * Typography scale
 * Uses handwritten fonts: Kalam (headings), Patrick Hand (body)
 */
export const typography = {
  heading: {
    fontFamily: 'Kalam, cursive',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  body: {
    fontFamily: 'Patrick Hand, cursive',
    fontWeight: 400,
    letterSpacing: '0.01em',
  },
  caption: {
    fontFamily: 'Patrick Hand, cursive',
    fontWeight: 400,
    fontSize: '0.875rem',
    letterSpacing: '0.02em',
  },
};

/**
 * Animation utilities
 */
export const animations = {
  // Bounce effect
  bounce: '@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }',
  
  // Jiggle effect
  jiggle: '@keyframes jiggle { 0% { transform: rotate(0deg); } 50% { transform: rotate(1deg); } 100% { transform: rotate(-1deg); } }',
};

/**
 * Border styles
 */
export const borders = {
  thick: '3px solid #2d2d2d',
  thickMuted: '3px solid #e5e0d8',
  thin: '2px solid #2d2d2d',
  dashed: '2px dashed #2d2d2d',
  dashedMuted: '2px dashed #e5e0d8',
};

/**
 * Decorative elements
 */
export const decorations = {
  // Tape effect (translucent gray bar)
  tape: {
    background: 'rgba(0, 0, 0, 0.08)',
    width: '80px',
    height: '24px',
    transform: 'rotate(-2deg)',
  },
  
  // Thumbtack (red circle)
  tack: {
    background: '#ff4d4d',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
  },
};

/**
 * Spacing scale (Tailwind-like)
 */
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

/**
 * Helper function to convert design token styles to inline style objects
 */
export const getStyleObject = (token) => {
  if (typeof token === 'string') {
    return { style: token };
  }
  return token;
};

/**
 * Generate utility classes for Tailwind (optional - can be used in globals)
 */
export const tailwindConfig = {
  colors: colors,
  borderRadius: radius,
  boxShadow: shadows,
};
