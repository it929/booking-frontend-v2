// src/components/IsaluLogo.tsx
'use client';

import React from 'react';

interface IsaluLogoProps {
  variant?: 'full' | 'icon' | 'badge';
  theme?: 'dark' | 'light';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export default function IsaluLogo({
  variant = 'full',
  theme = 'light',
  className = '',
  size = 'md',
  showSubtitle = true,
}: IsaluLogoProps) {
  // Dimension scale helpers
  const sizeMap = {
    sm: { icon: 28, height: 32, fontSize: 13, subSize: 9, rcSize: 8 },
    md: { icon: 38, height: 42, fontSize: 16, subSize: 11, rcSize: 10 },
    lg: { icon: 50, height: 56, fontSize: 20, subSize: 14, rcSize: 12 },
    xl: { icon: 68, height: 76, fontSize: 26, subSize: 18, rcSize: 15 },
  };

  const currentSize = sizeMap[size];

  // Colors based on theme
  const textColor = theme === 'dark' ? '#FFFFFF' : '#0085D0';
  const rcColor = theme === 'dark' ? '#38BDF8' : '#0085D0';

  // 4-Spheres Emblem SVG
  const emblem = (
    <svg
      viewBox="0 0 100 100"
      width={currentSize.icon}
      height={currentSize.icon}
      className="shrink-0 drop-shadow-xs"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="isaluSphereGrad" cx="36%" cy="30%" r="68%" fx="30%" fy="24%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="16%" stopColor="#A8EAFF" />
          <stop offset="42%" stopColor="#00A3FF" />
          <stop offset="76%" stopColor="#007ACC" />
          <stop offset="100%" stopColor="#005B9C" />
        </radialGradient>
      </defs>

      {/* Top Sphere */}
      <circle cx="50" cy="24" r="17" fill="url(#isaluSphereGrad)" />

      {/* Bottom Sphere */}
      <circle cx="50" cy="76" r="17" fill="url(#isaluSphereGrad)" />

      {/* Left Sphere */}
      <circle cx="24" cy="50" r="17" fill="url(#isaluSphereGrad)" />

      {/* Right Sphere */}
      <circle cx="76" cy="50" r="17" fill="url(#isaluSphereGrad)" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{emblem}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {emblem}

      <div className="flex flex-col justify-center leading-none">
        <span
          className="font-black tracking-tight"
          style={{
            fontSize: `${currentSize.fontSize}px`,
            color: textColor,
            lineHeight: 1.05,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          ISALU
        </span>

        {showSubtitle && (
          <>
            <span
              className="font-black tracking-wider mt-0.5"
              style={{
                fontSize: `${currentSize.subSize}px`,
                color: textColor,
                lineHeight: 1.1,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              HOSPITALS
            </span>

            <span
              className="font-bold tracking-widest mt-0.5"
              style={{
                fontSize: `${currentSize.rcSize}px`,
                color: rcColor,
                lineHeight: 1.1,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              RC502112
            </span>
          </>
        )}
      </div>
    </div>
  );
}
