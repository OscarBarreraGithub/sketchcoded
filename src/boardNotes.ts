import type { Rect } from './boardView';

/**
 * Rule: nothing overlaps. The label on each yarn is placed where it covers no frame, no title tape
 * and no other label: it slides along its own yarn from the middle, and a label with no clear spot
 * anywhere waits as a small mark that shows its words on hover or focus. Sizes follow the board's
 * type, which grows as the board zooms out. (Ways back are marks on their frames, not on the cork.)
 */
export type Frame = { id: string; paper: Rect; tape: Rect };
export type Label = { id: string; text: string; curve: Point[]; wordy: boolean };
export type Point = [number, number];
export type Placement = { x: number; y: number; dot: boolean };

export const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

/** A point along a cubic yarn, from 0 at the pin to 1 at the frame it opens. */
export const along = ([a, b, c, d]: Point[], s: number): Point => {
  const r = 1 - s;
  const mix = (i: 0 | 1) =>
    r * r * r * a[i] + 3 * r * r * s * b[i] + 3 * r * s * s * c[i] + s * s * s * d[i];
  return [mix(0), mix(1)];
};

/** The frame's paper, and its title tape, which starts 8% in and may reach 105% of its width. */
export const frameOf = (id: string, { x, y, width, height }: Rect): Frame => ({
  id,
  paper: { x, y, width, height },
  tape: { x: x + width * 0.08, y: y - 35, width: width * 1.05, height: 44 },
});

const SPOTS = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82];

export function placeBoardWords(
  frames: Frame[],
  labels: Label[],
  zoom: number,
): Map<string, Placement> {
  // The board's type: at least 17px, and 16 screen pixels when zoomed out (see the stylesheet).
  const font = Math.max(17, 16 / zoom),
    height = Math.max(44 / zoom, font * 1.3 + 16),
    maxWidth = Math.max(320, 270 / zoom),
    gap = 6 / zoom,
    dot = 9 / zoom + gap * 2;
  // Measured on the board's type, a letter averages 0.45 to 0.51 of the font size; the gap around
  // each box covers the rest.
  const width = (text: string) => Math.min(maxWidth, text.length * font * 0.52 + 30);
  const taken: Rect[] = frames.flatMap((f) => [f.paper, f.tape]);
  const clear = (box: Rect) => !taken.some((t) => overlapArea(box, t) > 0);
  const grow = (box: Rect): Rect => ({
    x: box.x - gap,
    y: box.y - gap,
    width: box.width + gap * 2,
    height: box.height + gap * 2,
  });
  const placed = new Map<string, Placement>();
  for (const label of labels) {
    const find = (w: number, h: number) => {
      for (const s of SPOTS) {
        const [x, y] = along(label.curve, s);
        const box = grow({ x: x - w / 2, y: y - h / 2, width: w, height: h });
        if (clear(box)) return { x, y, box };
      }
      return null;
    };
    let spot = label.wordy ? find(width(label.text), height) : null;
    const asDot = !spot;
    spot ??= find(dot, dot);
    if (!spot) {
      const [x, y] = along(label.curve, 0.5);
      spot = { x, y, box: { x: x - dot / 2, y: y - dot / 2, width: dot, height: dot } };
    }
    placed.set(label.id, { x: spot.x, y: spot.y, dot: asDot });
    taken.push(spot.box);
  }
  return placed;
}
