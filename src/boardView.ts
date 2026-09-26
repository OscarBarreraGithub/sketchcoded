import { screenSize, type Project } from '../shared/model';

export type View = { x: number; y: number; zoom: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Size = { width: number; height: number };
export type Padding = { top: number; right: number; bottom: number; left: number };

/** Breathing room between the outermost frames and the board's edges, in screen pixels. The top
 * keeps clear of the board tagline, the bottom of the board controls. */
export const PAD: Padding = { top: 60, right: 64, bottom: 116, left: 64 };
/** Safety net: how much of a frame must stay on the board when a layout leaves an empty corner. */
export const KEEP = 160;

/** Every frame on the board in board coordinates, including the title tape above it. */
export const frameRects = (p: Project): Rect[] =>
  p.screens.map((s) => {
    const pos = p.layout[s.id] ?? { x: 0, y: 0, width: 300 };
    const size = screenSize(p, s);
    return { x: pos.x, y: pos.y - 35, width: size.width, height: size.height + 55 };
  });

const bounds = (frames: Rect[]): Rect => {
  const x = Math.min(...frames.map((f) => f.x)),
    y = Math.min(...frames.map((f) => f.y)),
    right = Math.max(...frames.map((f) => f.x + f.width)),
    bottom = Math.max(...frames.map((f) => f.y + f.height));
  return { x, y, width: right - x, height: bottom - y };
};

/** Where a span of `length` may start along an axis whose usable part runs from `lo` to `hi`: fully
 * inside it when it fits, covering it when it does not. */
const startRange = (length: number, lo: number, hi: number): [number, number] => {
  const a = lo,
    b = hi - length;
  return [Math.min(a, b), Math.max(a, b)];
};
const shift = (start: number, [min, max]: [number, number]) =>
  start < min ? min - start : start > max ? max - start : 0;

/**
 * Rule (2026-09-26): the board never pans out of sight of its content, and it stops at the last
 * frame plus padding rather than at a frame's inner edge. The content's bounding box stays inside
 * the padded board when it fits, and covers it when it is larger, so the outermost frame in view
 * always keeps `PAD` of cork beside it. A layout with an empty corner could still show nothing, so
 * the nearest frame is brought back by the smallest move as a safety net.
 */
export function clampView(view: View, frames: Rect[], size: Size, pad: Padding = PAD): View {
  if (!frames.length || size.width <= 0 || size.height <= 0) return view;
  const z = view.zoom;
  const box = bounds(frames);
  const dx = shift(box.x * z + view.x, startRange(box.width * z, pad.left, size.width - pad.right)),
    dy = shift(box.y * z + view.y, startRange(box.height * z, pad.top, size.height - pad.bottom));
  const next = dx === 0 && dy === 0 ? view : { ...view, x: view.x + dx, y: view.y + dy };
  return keepAFrame(next, frames, size);
}

/** At least one frame keeps `KEEP` pixels on the board (or all of itself when smaller). */
function keepAFrame(view: View, frames: Rect[], size: Size): View {
  const z = view.zoom;
  let best = { dx: 0, dy: 0, distance: Infinity };
  for (const frame of frames) {
    const left = frame.x * z + view.x,
      top = frame.y * z + view.y,
      width = frame.width * z,
      height = frame.height * z;
    const keepX = Math.min(KEEP, width),
      keepY = Math.min(KEEP, height);
    const dx = shift(left, [keepX - width, size.width - keepX]),
      dy = shift(top, [keepY - height, size.height - keepY]),
      distance = Math.hypot(dx, dy);
    if (distance < best.distance) best = { dx, dy, distance };
    if (distance === 0) break;
  }
  if (best.distance === 0) return view;
  return { ...view, x: view.x + best.dx, y: view.y + best.dy };
}

/** The view that shows every frame, centered inside the padded board, at most at 100%. */
export function fitView(frames: Rect[], size: Size, pad: Padding = PAD): View {
  if (!frames.length) return { x: 70, y: 70, zoom: 0.85 };
  const box = bounds(frames);
  const usableW = Math.max(120, size.width - pad.left - pad.right),
    usableH = Math.max(120, size.height - pad.top - pad.bottom);
  const zoom = Math.max(0.15, Math.min(1, usableW / box.width, usableH / box.height));
  return {
    zoom,
    x: pad.left + (usableW - box.width * zoom) / 2 - box.x * zoom,
    y: pad.top + (usableH - box.height * zoom) / 2 - box.y * zoom,
  };
}
