import React from 'react';
import { useTheme } from '../context/ThemeContext';
import logoForDarkTheme from '../assets/Scrolla-black.png';
import logoForLightTheme from '../assets/Scrolla-light.png';

const BrandLogo = ({ size = 'md', forceDark = false }) => {
  const { theme } = useTheme();

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
    '2xl': 'h-32',
    '3xl': 'h-48',
    '4xl': 'h-64',
    '5xl': 'h-80'
  };

  // Select logo based on theme (or force dark if specified)
  const logoSrc = forceDark || theme === 'dark' ? logoForDarkTheme : logoForLightTheme;

  return (
    <img 
      src={logoSrc}
      alt="Scrolla Logo"
      className={`${sizeClasses[size]} object-contain opacity-95 hover:opacity-100`}
    />
  );
};

export default BrandLogo;
