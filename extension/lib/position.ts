// ─── Panel positioning helper ───

export interface Point {
  left: number;
  top: number;
}

export function getPanelPosition(
  rect: DOMRect | { top: number; bottom: number; left: number; right: number; width: number; height: number },
  panelWidth: number = 240,
  panelHeight: number = 260
): Point {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;

  // Horizontal alignment: align with left of selection, bounded by viewport
  let left = rect.left + scrollX;
  if (left + panelWidth > scrollX + viewportWidth - 12) {
    left = scrollX + viewportWidth - panelWidth - 12;
  }
  if (left < scrollX + 12) {
    left = scrollX + 12;
  }

  // Vertical alignment: prefer above selection rect
  let top = rect.top + scrollY - panelHeight - 8;

  // If top goes off-screen, place below selection rect
  if (rect.top - panelHeight - 8 < 12) {
    top = rect.bottom + scrollY + 8;
  }

  return { left: Math.round(left), top: Math.round(top) };
}
