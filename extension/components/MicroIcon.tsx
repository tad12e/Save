// ─── Per-Post Micro Icon Component (20px circle) ───

import React, { useState } from 'react';
import { C, CHECK_10, CLIPPER_LOGO_10 } from '../lib/constants';

export interface MicroIconProps {
  detectedType: string;
  onClick: (e: React.MouseEvent) => void;
  isSaved?: boolean;
}

export function MicroIcon({ detectedType, onClick, isSaved }: MicroIconProps) {
  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: isSaved ? C.successBg : C.bgDark,
    opacity: isSaved ? 1.0 : hovered ? 1.0 : 0.5,
    transform: hovered ? 'scale(1.1)' : 'scale(1.0)',
    transition: 'all 0.15s ease',
    border: 'none',
    outline: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  };

  return (
    <button
      type="button"
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      title={`Save ${detectedType} opportunity`}
      aria-label={`Save ${detectedType} opportunity with Clipper`}
      dangerouslySetInnerHTML={{
        __html: isSaved ? CHECK_10 : CLIPPER_LOGO_10,
      }}
    />
  );
}
