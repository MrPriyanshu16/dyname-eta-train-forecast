import React from 'react';

interface TracklineLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TracklineLogo: React.FC<TracklineLogoProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8.5 h-8.5',
    lg: 'w-10 h-10'
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative shrink-0 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform duration-200 ${dim} ${className}`}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Badge Background Gradient */}
          <linearGradient id="tlBadgeGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>

          {/* Windshield Cockpit Glass Gradient */}
          <linearGradient id="tlGlassGrad" x1="18" y1="8" x2="18" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Locomotive Body Gradient */}
          <linearGradient id="tlBodyGrad" x1="18" y1="6" x2="18" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>

        {/* Outer Emblem Container */}
        <rect width="36" height="36" rx="9" fill="url(#tlBadgeGrad)" />
        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" stroke="white" strokeOpacity="0.2" />

        {/* Railway Tracks (Perspective lines emerging from beneath train) */}
        <path
          d="M8.5 32L12.5 26.5M27.5 32L23.5 26.5"
          stroke="#818CF8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M10.5 30.5H25.5"
          stroke="#818CF8"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Aerodynamic Bullet Train Locomotive Body */}
        <path
          d="M12 7C12 4.8 24 4.8 24 7L25.5 17C25.5 23 23.5 25.8 18 25.8C12.5 25.8 10.5 23 10.5 17L12 7Z"
          fill="url(#tlBodyGrad)"
        />

        {/* Panoramic Cockpit Windshield */}
        <path
          d="M13 8.8C13 7.6 23 7.6 23 8.8L23.8 13.5C23.8 14.8 21.5 15.4 18 15.4C14.5 15.4 12.2 14.8 12.2 13.5L13 8.8Z"
          fill="url(#tlGlassGrad)"
        />

        {/* Windshield Reflection Glare */}
        <path
          d="M14.5 10.2C16 9.8 20 9.8 21.5 10.2"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        {/* Dual High-Beam LED Headlights */}
        <circle cx="13.8" cy="20.5" r="1.4" fill="#FACC15" />
        <circle cx="22.2" cy="20.5" r="1.4" fill="#FACC15" />

        {/* Center Speed Badge / Nose Ribbon */}
        <rect x="17" y="18.5" width="2" height="4" rx="1" fill="#4F46E5" />

        {/* Aerodynamic Front Skirt / Cowcatcher Wedge */}
        <path
          d="M12 25L18 27L24 25"
          stroke="#4F46E5"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
