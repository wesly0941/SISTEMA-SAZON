import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" fill="#8B1E3F" stroke="#D4AF37" strokeWidth="4" />
      <circle cx="50" cy="50" r="38" fill="#FFFDF7" />
      <path
        d="M 33 48 C 33 34 67 34 67 48 L 62 57 L 38 57 Z"
        fill="#8B1E3F"
      />
      <rect x="36" y="59" width="28" height="3.5" rx="1.75" fill="#D4AF37" />
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fill="#8B1E3F"
        fontWeight="800"
        fontSize="13"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        HELEM
      </text>
    </svg>
  );
};
