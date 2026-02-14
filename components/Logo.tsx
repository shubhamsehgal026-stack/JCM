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
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Shape - Now Blue */}
      <rect x="5" y="5" width="90" height="90" rx="20" fill="#0ea5e9" fillOpacity="0.1" stroke="#0ea5e9" strokeWidth="4"/>
      
      {/* J Shape - Now Blue */}
      <path 
        d="M65 30V30C65 30 65 30 65 30V60C65 73.8071 53.8071 85 40 85V85C26.1929 85 15 73.8071 15 60V55" 
        stroke="#0ea5e9" 
        strokeWidth="8" 
        strokeLinecap="round"
      />
      
      {/* Accent - The Cash/Service element - Now Rose for contrast */}
      <circle cx="70" cy="35" r="10" fill="#e11d48" />
      <path d="M60 35H80" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <path d="M70 25V45" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
};

export default Logo;