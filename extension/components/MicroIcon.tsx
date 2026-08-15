// ─── Per-Post Micro Icon Component (26px draggable circle) ───

import React, { useRef, useState } from 'react';
import { CHECK_10, CLIPPER_LOGO_10 } from '../lib/constants';

export interface MicroIconProps {
  detectedType: string;
  onClick: (e: React.MouseEvent) => void;
  isSaved?: boolean;
}

export function MicroIcon({ detectedType, onClick, isSaved }: MicroIconProps) {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
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
      setOffset({
        x: dragRef.current.startOffsetX + dx,
        y: dragRef.current.startOffsetY + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;
    const wasMoved = dragRef.current.moved;
    dragRef.current = null;
    setIsDragging(false);

    if (!wasMoved) {
      onClick(e as unknown as React.MouseEvent);
    }
  };

  const style: React.CSSProperties = {
    position: 'relative',
    transform: isDragging
      ? `translate(${offset.x}px, ${offset.y}px)`
      : hovered
      ? `translate(${offset.x}px, ${offset.y}px) scale(1.15)`
      : `translate(${offset.x}px, ${offset.y}px)`,
    width: '20px',
    height: '20px',
    borderRadius: '10px',
    background: isSaved
      ? '#065f46'
      : isDragging
      ? 'rgba(30, 27, 75, 0.95)'
      : hovered
      ? 'rgba(30, 41, 59, 0.95)'
      : 'rgba(15, 23, 42, 0.85)',
    border: isSaved
      ? '1px solid #10b981'
      : isDragging
      ? '1px solid #a78bfa'
      : hovered
      ? '1px solid rgba(167, 139, 250, 0.7)'
      : '1px solid rgba(255, 255, 255, 0.2)',
    opacity: 1.0,
    boxShadow: isDragging
      ? '0 4px 12px rgba(124, 58, 237, 0.6)'
      : hovered
      ? '0 2px 8px rgba(124, 58, 237, 0.4)'
      : '0 2px 5px rgba(0, 0, 0, 0.4)',
    transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.22, 0.68, 0, 1.2)',
    outline: 'none',
    padding: 0,
    margin: 0,
    cursor: isDragging ? 'grabbing' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    pointerEvents: 'auto',
    userSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(6px)',
  };

  return (
    <button
      type="button"
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title={isSaved ? 'Saved to Clipper!' : 'Drag to move anywhere or click to save tweet'}
      aria-label={`Save ${detectedType} with Clipper`}
      dangerouslySetInnerHTML={{
        __html: isSaved ? CHECK_10 : CLIPPER_LOGO_10,
      }}
    />
  );
}
