import React from 'react';
import { colors, radius, borders, typography } from '../styles/designSystem';
import './HandDrawnInput.css';

/**
 * HandDrawnInput
 * Text input field with wobbly borders and hand-drawn aesthetic
 * 
 * Variants: text, textarea, search
 */
const HandDrawnInput = ({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  disabled = false,
  className = '',
  rows = 4,
  ...props
}) => {
  const baseStyle = {
    borderRadius: radius.wobblySubtle,
    border: borders.thin,
    padding: '12px 16px',
    fontFamily: typography.body.fontFamily,
    fontSize: '1rem',
    color: colors.fg,
    background: colors.white,
    transition: 'all 150ms ease-out',
    outline: 'none',
    '&::placeholder': {
      color: `${colors.fg}66`,
    },
  };

  const style = {
    ...baseStyle,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = colors.secondary;
    e.target.style.boxShadow = `0 0 0 3px rgba(45, 93, 161, 0.15)`;
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = colors.fg;
    e.target.style.boxShadow = 'none';
  };

  if (type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        style={style}
        className={`hand-drawn-input textarea ${className}`}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      style={style}
      className={`hand-drawn-input ${className}`}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
};

export default HandDrawnInput;
