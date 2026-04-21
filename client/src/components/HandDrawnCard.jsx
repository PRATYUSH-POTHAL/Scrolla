import React from 'react';
import { colors, radius, shadows, borders, typography } from '../styles/designSystem';
import './HandDrawnCard.css';

/**
 * HandDrawnCard
 * Container with hand-drawn aesthetic, optional decorations (tape, tack)
 * 
 * Decorations: none, tape, tack, sticky-note
 */
const HandDrawnCard = ({
  children,
  decoration = 'none',
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const cardStyle = {
    background: colors.white,
    border: borders.thin,
    borderRadius: radius.wobblyMd,
    padding: '20px',
    boxShadow: shadows.subtle,
    position: 'relative',
    transition: 'all 200ms ease-out',
    ...style,
  };

  const decorationElement = () => {
    switch (decoration) {
      case 'tape':
        return (
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%) rotate(-2deg)',
              width: '80px',
              height: '24px',
              background: 'rgba(0, 0, 0, 0.08)',
              borderRadius: '2px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          />
        );
      case 'tack':
        return (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              background: colors.accent,
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />
        );
      case 'sticky-note':
        return (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              background: '#fff9c4',
              border: `2px solid ${colors.fg}`,
              borderRadius: '2px',
              transform: 'rotate(-15deg)',
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={cardStyle}
      className={`hand-drawn-card ${decoration} ${className}`}
      onClick={onClick}
      {...props}
    >
      {decorationElement()}
      {children}
    </div>
  );
};

export default HandDrawnCard;
