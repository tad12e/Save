import React from 'react';
import { StitchTheme, stitchCard } from './stitchTheme';

// Shared Stitch card shell: 16px radius, hairline border, no heavy shadow.
export const StitchCard: React.FC<{
  theme?: StitchTheme;
  className?: string;
  children: React.ReactNode;
}> = ({ theme = 'light', className = '', children }) => {
  return (
    <div className={`rounded-2xl border p-5 ${stitchCard(theme)} ${className}`}>
      {children}
    </div>
  );
};

export const StitchSectionLabel: React.FC<{
  theme?: StitchTheme;
  children: React.ReactNode;
}> = ({ theme = 'light', children }) => {
  const color = theme === 'light' ? 'text-[#475569]' : 'text-[#A1A1A1]';
  return (
    <div className={`text-[11px] font-sans font-bold tracking-wider uppercase ${color}`}>
      {children}
    </div>
  );
};
