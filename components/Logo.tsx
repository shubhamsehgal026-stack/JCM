import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cardGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="40" y1="35" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Stacked Cards Effect for Depth */}
      <rect x="18" y="14" width="28" height="36" rx="6" fill="#bae6fd" transform="rotate(-10 32 32)" opacity="0.6" />
      <rect x="18" y="14" width="28" height="36" rx="6" fill="#7dd3fc" transform="rotate(-5 32 32)" opacity="0.8" />
      
      {/* Main Card */}
      <rect x="18" y="14" width="28" height="36" rx="6" fill="url(#cardGrad)" filter="url(#dropShadow)" />
      
      {/* J Shape cutout/overlay on main card */}
      <path 
        d="M36 24 V38 C36 41.31 33.31 44 30 44 C26.69 44 24 41.31 24 38" 
        stroke="white" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Financial Accent Coin */}
      <circle cx="46" cy="44" r="7" fill="url(#accentGrad)" stroke="white" strokeWidth="2" filter="url(#dropShadow)" />
      <path d="M46 42 V46 M44 44 H48" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

    </svg>
  );
};

export default Logo;