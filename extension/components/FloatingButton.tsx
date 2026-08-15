// ─── Draggable Floating Save Button Component ───

import React, { useEffect, useRef, useState } from 'react';
import { CHECK_14, CLIPPER_LOGO_14 } from '../lib/constants';

export interface FloatingButtonProps {
  onSavePage: () => void;
  onOpenPanel: () => void;
  isSaved?: boolean;
}

export function FloatingButton({ onSavePage, onOpenPanel, isSaved }: FloatingButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    moved: boolean;
  } | null>(null);

  // Initialize position: calculate near feed column on X/Twitter or screen edge
  useEffect(() => {
    const savedX = localStorage.getItem('clipper_btn_x');
    const savedY = localStorage.getItem('clipper_btn_y');

    if (savedX && savedY) {
      const x = Math.min(Math.max(10, parseInt(savedX, 10)), window.innerWidth - 50);
      const y = Math.min(Math.max(10, parseInt(savedY, 10)), window.innerHeight - 50);
      setPos({ left: x, top: y });
      return;
    }

    // Smart placement: try to find central feed column (e.g. X / Twitter primaryColumn)
    const primaryCol = document.querySelector('[data-testid="primaryColumn"]') || document.querySelector('main');
    if (primaryCol) {
      const rect = primaryCol.getBoundingClientRect();
      if (rect.right > 0 && rect.right + 60 < window.innerWidth) {
        setPos({
          left: Math.round(rect.right + 12),
          top: Math.round(window.innerHeight * 0.45),
        });
        return;
      }
    }

    // Default right edge
    setPos({
      left: Math.max(10, window.innerWidth - 54),
      top: Math.round(window.innerHeight * 0.45),
    });
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const currentLeft = pos?.left ?? (window.innerWidth - 54);
    const currentTop = pos?.top ?? (window.innerHeight * 0.45);

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      moved: false,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.moved && Math.hypot(dx, dy) > 4) {
      dragRef.current.moved = true;
      setIsDragging(true);
    }

    if (dragRef.current.moved) {
      const nextLeft = Math.min(Math.max(8, dragRef.current.startLeft + dx), window.innerWidth - 50);
      const nextTop = Math.min(Math.max(8, dragRef.current.startTop + dy), window.innerHeight - 50);
      setPos({ left: nextLeft, top: nextTop });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;

    const wasMoved = dragRef.current.moved;
    dragRef.current = null;
    setIsDragging(false);

    if (wasMoved) {
      // Save position
      if (pos) {
        localStorage.setItem('clipper_btn_x', String(pos.left));
        localStorage.setItem('clipper_btn_y', String(pos.top));
      }
    } else {
      // It was a click -> perform save or open selection
      e.stopPropagation();
      e.preventDefault();
      const selectionText = window.getSelection()?.toString().trim() || '';
      if (selectionText) {
        onOpenPanel();
      } else {
        onSavePage();
      }
    }
  };

  if (!pos) return null;

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${pos.left}px`,
    top: `${pos.top}px`,
    width: '22px',
    height: '22px',
    borderRadius: '11px',
    background: isSaved
      ? '#065f46'
      : isDragging
      ? 'rgba(30, 27, 75, 0.95)'
      : hovered
      ? 'rgba(30, 41, 59, 0.95)'
      : 'rgba(15, 23, 42, 0.88)',
    border: isSaved
      ? '1px solid #10b981'
      : isDragging
      ? '1px solid #a78bfa'
      : hovered
      ? '1px solid rgba(167, 139, 250, 0.7)'
      : '1px solid rgba(255, 255, 255, 0.22)',
    boxShadow: isDragging
      ? '0 4px 14px rgba(124, 58, 237, 0.6)'
      : hovered
      ? '0 2px 10px rgba(124, 58, 237, 0.4), 0 0 0 1px rgba(167, 139, 250, 0.4)'
      : '0 2px 6px rgba(0, 0, 0, 0.45)',
    cursor: isDragging ? 'grabbing' : 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2147483647,
    transition: isDragging ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
    transform: hovered && !isDragging ? 'scale(1.15)' : 'scale(1.0)',
    outline: 'none',
    padding: 0,
    margin: 0,
    pointerEvents: 'auto',
    opacity: 1.0,
    userSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(6px)',
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title={isSaved ? 'Saved to Clipper!' : 'Drag anywhere or click to save to Clipper'}
      aria-label="Save with Clipper"
      dangerouslySetInnerHTML={{
        __html: isSaved ? CHECK_14 : CLIPPER_LOGO_14,
      }}
    />
  );
}


