// ─── 28px Right-Edge Docked Floating Save Button ───

import React, { useState } from 'react';
import { CHECK_14, CLIPPER_LOGO_14 } from '../lib/constants';

export interface FloatingButtonProps {
  onSavePage: () => void;
  isSaved?: boolean;
}

export function FloatingButton({ onSavePage, isSaved }: FloatingButtonProps) {
  const [hovered, setHovered] = useState(false);

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    right: '0px',
    top: '50%',
    width: '28px',
    height: '28px',
    borderRadius: '14px 0 0 14px',
    background: isSaved
      ? '#059669'
      : hovered
      ? '#7c3aed'
      : 'rgba(15, 23, 42, 0.92)',
    border: isSaved
      ? '1px solid #10b981'
      : hovered
      ? '1px solid #c084fc'
      : '1px solid rgba(255, 255, 255, 0.25)',
    borderRight: 'none',
    boxShadow: isSaved
      ? '-2px 0 14px rgba(16, 185, 129, 0.6)'
      : hovered
      ? '-2px 0 16px rgba(124, 58, 237, 0.6), 0 4px 12px rgba(0, 0, 0, 0.5)'
      : '0 2px 8px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2147483647,
    // Half hidden behind edge by default (14px hidden), slides out smoothly on hover
    transform: hovered || isSaved ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(14px)',
    transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
    outline: 'none',
    padding: 0,
    margin: 0,
    userSelect: 'none',
    pointerEvents: 'auto',
    backdropFilter: 'blur(8px)',
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onSavePage();
      }}
      title={isSaved ? 'Saved page to Clipper!' : 'Save current page to Clipper'}
      aria-label="Save current page with Clipper"
      dangerouslySetInnerHTML={{
        __html: isSaved ? CHECK_14 : CLIPPER_LOGO_14,
      }}
    />
  );
}
