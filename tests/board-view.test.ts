import { describe, expect, it } from 'vitest';
import { emptyProject } from '../shared/model';
import { KEEP, PAD, clampView, fitView, frameRects, type Rect, type View } from '../src/boardView';

const size = { width: 1000, height: 600 };
/** Two 300×200 frames with their tapes, in a row: the content is 1100 wide and 255 tall. */
const frames: Rect[] = [
  { x: 0, y: -35, width: 300, height: 255 },
  { x: 800, y: -35, width: 300, height: 255 },
];
const onScreen = (view: View, frame: Rect) => ({
  left: frame.x * view.zoom + view.x,
  top: frame.y * view.zoom + view.y,
  right: (frame.x + frame.width) * view.zoom + view.x,
  bottom: (frame.y + frame.height) * view.zoom + view.y,
});
const visible = (view: View, frame: Rect) => {
  const r = onScreen(view, frame);
  return {
    x: Math.min(r.right, size.width) - Math.max(r.left, 0),
    y: Math.min(r.bottom, size.height) - Math.max(r.top, 0),
  };
};
const somethingOnTheBoard = (view: View, all = frames) =>
  all.some((f) => {
    const v = visible(view, f);
    return (
      v.x >= Math.min(KEEP, f.width * view.zoom) - 0.01 &&
      v.y >= Math.min(KEEP, f.height * view.zoom) - 0.01
    );
  });

describe('board view clamp: the board stops at the last frame plus padding', () => {
  it('leaves a view alone while the content sits inside the padded board', () => {
    const view = { x: 40, y: 100, zoom: 1 };
    expect(clampView(view, frames, size)).toBe(view);
  });
  it('panning right stops with the first frame PAD.left from the edge', () => {
    // The content (1100 wide) is wider than the usable board, so it covers the board instead.
    const clamped = clampView({ x: 5000, y: 100, zoom: 1 }, frames, size);
    expect(onScreen(clamped, frames[0]).left).toBe(PAD.left);
    expect(clamped.y).toBe(100);
  });
  it('panning left stops with the last frame fully in view and PAD.right of cork beside it', () => {
    const clamped = clampView({ x: -5000, y: 100, zoom: 1 }, frames, size);
    expect(onScreen(clamped, frames[1]).right).toBe(size.width - PAD.right);
    expect(visible(clamped, frames[1]).x).toBe(300);
  });
  it('keeps content that fits inside the padded board, never clipped at an edge', () => {
    // Zoomed out, the content is 550 wide: it floats between the paddings but cannot leave.
    const right = clampView({ x: 900, y: 100, zoom: 0.5 }, frames, size);
    expect(onScreen(right, frames[1]).right).toBe(size.width - PAD.right);
    const left = clampView({ x: -900, y: 100, zoom: 0.5 }, frames, size);
    expect(onScreen(left, frames[0]).left).toBe(PAD.left);
    const inside = { x: 200, y: 100, zoom: 0.5 };
    expect(clampView(inside, frames, size)).toBe(inside);
  });
  it('keeps the top tape below the tagline and the bottom edge above the board controls', () => {
    // Dragging down moves the content down until its bottom edge rests above the controls;
    // dragging up moves it up until the tape rests under the tagline.
    const down = clampView({ x: 40, y: 5000, zoom: 1 }, frames, size);
    expect(onScreen(down, frames[0]).bottom).toBe(size.height - PAD.bottom);
    const up = clampView({ x: 40, y: -5000, zoom: 1 }, frames, size);
    expect(onScreen(up, frames[0]).top).toBe(PAD.top);
  });
  it('brings the nearest frame back when a layout leaves an empty corner in view', () => {
    const corner: Rect[] = [
      { x: 0, y: -35, width: 300, height: 255 },
      { x: 2000, y: 2000, width: 300, height: 255 },
    ];
    // This view sits inside the content's bounding box but shows neither frame.
    const empty = { x: -1000, y: 0, zoom: 1 };
    expect(somethingOnTheBoard(empty, corner)).toBe(false);
    const clamped = clampView(empty, corner, size);
    expect(somethingOnTheBoard(clamped, corner)).toBe(true);
    expect(visible(clamped, corner[0]).x).toBe(KEEP);
  });
  it('holds at any zoom', () => {
    for (const zoom of [0.15, 0.5, 1, 2, 3])
      for (const [x, y] of [
        [9999, 9999],
        [-9999, 200],
        [300, -9999],
        [0, 0],
      ]) {
        const clamped = clampView({ x, y, zoom }, frames, size);
        expect(clamped.zoom).toBe(zoom);
        expect(somethingOnTheBoard(clamped)).toBe(true);
      }
  });
  it('does nothing without frames or without a board', () => {
    const view = { x: 9999, y: 9999, zoom: 1 };
    expect(clampView(view, [], size)).toBe(view);
    expect(clampView(view, frames, { width: 0, height: 0 })).toBe(view);
  });
  it('fit shows everything inside the padding, and the clamp then has nothing to do', () => {
    const fitted = fitView(frames, size);
    expect(fitted.zoom).toBeLessThanOrEqual(1);
    expect(onScreen(fitted, frames[0]).left).toBeGreaterThanOrEqual(PAD.left - 0.01);
    expect(onScreen(fitted, frames[1]).right).toBeLessThanOrEqual(size.width - PAD.right + 0.01);
    expect(onScreen(fitted, frames[0]).top).toBeGreaterThanOrEqual(PAD.top - 0.01);
    expect(clampView(fitted, frames, size)).toBe(fitted);
    expect(fitView([], size)).toEqual({ x: 70, y: 70, zoom: 0.85 });
  });
  it('measures every frame with its tape, planned frames included', () => {
    const p = emptyProject('Frames', 'frames');
    p.assets = [
      {
        id: 'a',
        name: 'a.png',
        file: `${'a'.repeat(64)}.webp`,
        width: 100,
        height: 80,
        importedAt: 'now',
      },
    ];
    p.screens = [
      { id: 'drawn', assetId: 'a', title: 'Drawn', purpose: '', entry: true, role: 'screen' },
      { id: 'planned', assetId: null, title: 'Planned', purpose: '', entry: false, role: 'screen' },
    ];
    p.layout = { drawn: { x: 100, y: 50, width: 300 }, planned: { x: 500, y: 50, width: 300 } };
    const [drawn, planned] = frameRects(p);
    expect(drawn.x).toBe(100);
    expect(drawn.y).toBe(15);
    expect(drawn.width).toBe(300);
    expect(drawn.height).toBeCloseTo(((300 - 24) * 80) / 100 + 78 + 55);
    expect(planned.height).toBeCloseTo((300 - 24) * 0.5 + 78 + 55);
  });
});
