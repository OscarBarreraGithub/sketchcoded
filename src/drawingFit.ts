/**
 * Rule: nothing overlaps, at every zoom. A drawing fits the room its stage has, in both
 * directions, but never shrinks below the size at which its 44px pins start to sit on each other
 * (measured on a drawing of seventeen pins: below 400px wide they pile up). Past that the stage
 * scrolls, with a visible scrollbar and a hint, instead of the pins covering one another.
 */
export const MIN_DRAWING = 420;

export function drawingWidth(
  room: { width: number; height: number },
  aspect: number,
  natural?: number,
): number {
  const fitted = Math.min(room.width, (room.height - 6) * aspect);
  // The long side keeps at least MIN_DRAWING pixels; a drawing is never shown larger than it is.
  const least = Math.min(aspect >= 1 ? MIN_DRAWING : MIN_DRAWING * aspect, natural ?? Infinity);
  return Math.floor(Math.max(120, least, fitted));
}
