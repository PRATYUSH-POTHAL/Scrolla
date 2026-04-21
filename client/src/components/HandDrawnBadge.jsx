import React from 'react';
import { colors, radius, borders, typography } from '../styles/designSystem';

/**
 * HandDrawnBadge
 * Small pill-shaped badge with hand-drawn aesthetics
 * 
 * Variants: primary (red), secondary (blue), muted (gray), success, warning, danger
 */
const HandDrawnBadge = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: {
      background: colors.accent,
      color: colors.white,
      border: `2px solid ${colors.accent}`,
    },
    secondary: {
      background: colors.secondary,
      color: colors.white,
      border: `2px solid ${colors.secondary}`,
    },
    muted: {
      background: colors.muted,
      color: colors.fg,
      border: `2px solid ${colors.fg}`,
    },
    success: {
      background: '#d1f4e7',
      color: '#047857',
      border: `2px solid #047857`,
    },
    warning: {
      background: '#fef3c7',
      color: '#d97706',
      border: `2px solid #d97706`,
    },
    danger: {
      background: '#fee2e2',
      color: '#dc2626',
      border: `2px solid #dc2626`,
    },
  };

  const style = {
    borderRadius: radius.wobblyXs,
    padding: '4px 12px',
    fontSize: '0.75rem',
    fontFamily: typography.body.fontFamily,
    fontWeight: 600,
    display: 'inline-block',
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
  };

  return (
    <span style={style} className={`hand-drawn-badge ${variant} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default HandDrawnBadge;
