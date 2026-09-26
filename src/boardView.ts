import { screenSize, type Project } from '../shared/model';

export type View = { x: number; y: number; zoom: number };
export type Rect = { x: number; y: number; width: number; height: number };

/** How much of a frame must stay on the board, in screen pixels (or the whole frame when smaller). */
export const KEEP = 160;

/** Every frame on the board in board coordinates, including the title tape above it. */
export const frameRects = (p: Project): Rect[] =>
  p.screens.map((s) => {
    const pos = p.layout[s.id] ?? { x: 0, y: 0, width: 300 };
    const size = screenSize(p, s);
    return { x: pos.x, y: pos.y - 35, width: size.width, height: size.height + 55 };
  });

/**
 * Rule (2026-09-26): the board never pans out of sight of its content. There is room to breathe
 * around the frames, but at least one frame keeps `KEEP` pixels on screen in both directions. When
 * a view would leave nothing visible, it is moved by the smallest amount that brings the nearest
 * frame back. Used for drags, wheel pans, zooming and window resizes alike.
 */
export function clampView(
  view: View,
  frames: Rect[],
  size: { width: number; height: number },
): View {
  if (!frames.length || size.width <= 0 || size.height <= 0) return view;
  const z = view.zoom;
  let best = { dx: 0, dy: 0, distance: Infinity };
  for (const frame of frames) {
    const left = frame.x * z + view.x,
      top = frame.y * z + view.y,
      width = frame.width * z,
      height = frame.height * z;
    const keepX = Math.min(KEEP, width),
      keepY = Math.min(KEEP, height);
    const minLeft = keepX - width,
      maxLeft = size.width - keepX,
      minTop = keepY - height,
      maxTop = size.height - keepY;
    const dx = left < minLeft ? minLeft - left : left > maxLeft ? maxLeft - left : 0,
      dy = top < minTop ? minTop - top : top > maxTop ? maxTop - top : 0,
      distance = Math.hypot(dx, dy);
    if (distance < best.distance) best = { dx, dy, distance };
    if (distance === 0) break;
  }
  if (best.distance === 0) return view;
  return { ...view, x: view.x + best.dx, y: view.y + best.dy };
}
