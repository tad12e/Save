// ─── Floating 28px Circle Button Component ───

import React, { useState } from 'react';
import { C, CHECK_14, CLIPPER_LOGO_14 } from '../lib/constants';

export interface FloatingButtonProps {
  onSavePage: () => void;
  onOpenPanel: () => void;
  isSaved?: boolean;
}

export function FloatingButton({ onSavePage, onOpenPanel, isSaved }: FloatingButtonProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const selectionText = window.getSelection()?.toString().trim() || '';
    if (selectionText) {
      // CASE B: Text selected -> open panel
      onOpenPanel();
    } else {
      // CASE A: No text selected -> quick save page
      onSavePage();
    }
  };

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    right: hovered ? '0px' : '-14px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: isSaved ? C.successBg : C.bgDark,
    opacity: hovered ? 1.0 : 0.35,
    boxShadow: hovered ? '-2px 0 12px rgba(124, 58, 237, 0.25)' : 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2147483647,
    transition: 'all 0.2s cubic-bezier(0.22, 0.68, 0, 1.2)',
    border: 'none',
    outline: 'none',
    padding: 0,
    margin: 0,
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      aria-label="Save with Clipper"
      dangerouslySetInnerHTML={{
        __html: isSaved ? CHECK_14 : CLIPPER_LOGO_14,
      }}
    />
  );
}
