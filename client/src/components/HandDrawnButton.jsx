import React from 'react';
import { colors, radius, shadows, borders, typography } from '../styles/designSystem';
import './HandDrawnButton.css';

/**
 * HandDrawnButton
 * Primary hand-drawn button with wobbly borders and hard offset shadow
 * 
 * Variants: primary (red), secondary (blue), outline (transparent)
 * Sizes: sm, md, lg
 */
const HandDrawnButton = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyle = {
    borderRadius: radius.wobbly,
    border: borders.thick,
    fontFamily: typography.body.fontFamily,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 100ms ease-out',
    outline: 'none',
    position: 'relative',
  };

  const variantStyles = {
    primary: {
      background: colors.white,
      color: colors.fg,
      boxShadow: shadows.offset,
      '&:hover:not(:disabled)': {
        background: colors.accent,
        color: colors.white,
        boxShadow: shadows.offsetHover,
        transform: 'translate(2px, 2px)',
      },
      '&:active:not(:disabled)': {
        boxShadow: shadows.offsetActive,
        transform: 'translate(4px, 4px)',
      },
    },
    secondary: {
      background: colors.muted,
      color: colors.fg,
      boxShadow: shadows.offset,
      '&:hover:not(:disabled)': {
        background: colors.secondary,
        color: colors.white,
        boxShadow: shadows.offsetHover,
        transform: 'translate(2px, 2px)',
      },
      '&:active:not(:disabled)': {
        boxShadow: shadows.offsetActive,
        transform: 'translate(4px, 4px)',
      },
    },
    outline: {
      background: 'transparent',
      color: colors.fg,
      boxShadow: shadows.offsetSm,
      '&:hover:not(:disabled)': {
        background: colors.muted,
        boxShadow: shadows.offsetHover,
        transform: 'translate(2px, 2px)',
      },
      '&:active:not(:disabled)': {
        boxShadow: shadows.offsetActive,
        transform: 'translate(4px, 4px)',
      },
    },
  };

  const sizeStyles = {
    sm: {
      padding: '6px 12px',
      fontSize: '0.875rem',
    },
    md: {
      padding: '10px 20px',
      fontSize: '1rem',
    },
    lg: {
      padding: '14px 28px',
      fontSize: '1.125rem',
    },
  };

  const disabledStyle = disabled ? {
    opacity: 0.5,
    cursor: 'not-allowed',
  } : {};

  const style = {
    ...baseStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...disabledStyle,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`hand-drawn-button ${variant} ${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default HandDrawnButton;
