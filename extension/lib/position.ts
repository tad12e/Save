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

  // Viewport-relative horizontal positioning (host is fixed inset:0)
  let left = rect.left;
  if (left + panelWidth > viewportWidth - 12) {
    left = viewportWidth - panelWidth - 12;
  }
  if (left < 12) {
    left = 12;
  }

  // Viewport-relative vertical positioning: prefer above selection rect
  let top = rect.top - panelHeight - 8;

  // If top goes off top of viewport, place below selection rect
  if (top < 12) {
    top = Math.min(rect.bottom + 8, viewportHeight - panelHeight - 12);
  }

  return { left: Math.round(left), top: Math.round(top) };
}
