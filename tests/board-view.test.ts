import { describe, expect, it } from 'vitest';
import { emptyProject } from '../shared/model';
import { KEEP, clampView, frameRects, type Rect, type View } from '../src/boardView';

const size = { width: 1000, height: 600 };
/** Two 300×200 frames with their tapes, far apart: top left and bottom right. */
const frames: Rect[] = [
  { x: 0, y: -35, width: 300, height: 255 },
  { x: 800, y: 465, width: 300, height: 255 },
];
const visible = (view: View, frame: Rect) => {
  const left = frame.x * view.zoom + view.x,
    top = frame.y * view.zoom + view.y,
    right = left + frame.width * view.zoom,
    bottom = top + frame.height * view.zoom;
  return {
    x: Math.min(right, size.width) - Math.max(left, 0),
    y: Math.min(bottom, size.height) - Math.max(top, 0),
  };
};
const somethingOnTheBoard = (view: View) =>
  frames.some((f) => {
    const v = visible(view, f);
    return (
      v.x >= Math.min(KEEP, f.width * view.zoom) - 0.01 &&
      v.y >= Math.min(KEEP, f.height * view.zoom) - 0.01
    );
  });

describe('board view clamp: the board never pans out of sight of its content', () => {
  it('leaves a view alone while a frame is on the board', () => {
    const view = { x: 40, y: 60, zoom: 1 };
    expect(clampView(view, frames, size)).toBe(view);
    expect(clampView({ x: 700, y: 400, zoom: 1 }, frames, size)).toEqual({
      x: 700,
      y: 400,
      zoom: 1,
    });
  });
  it('stops a pan past the last frame with KEEP pixels of it still showing', () => {
    const clamped = clampView({ x: 5000, y: 0, zoom: 1 }, frames, size);
    expect(clamped).toEqual({ x: size.width - KEEP, y: 0, zoom: 1 });
    expect(visible(clamped, frames[0]).x).toBe(KEEP);
    expect(somethingOnTheBoard(clamped)).toBe(true);
  });
  it('comes back to the nearest frame by the smallest move', () => {
    const clamped = clampView({ x: -5000, y: -5000, zoom: 1 }, frames, size);
    // The bottom-right frame is closer to a view that went off to the top left.
    expect(visible(clamped, frames[1])).toEqual({ x: KEEP, y: KEEP });
    expect(somethingOnTheBoard(clamped)).toBe(true);
  });
  it('keeps the whole frame when it is smaller than KEEP on screen', () => {
    const clamped = clampView({ x: 950, y: 100, zoom: 0.5 }, frames, size);
    expect(clamped.x).toBe(size.width - 150);
    expect(visible(clamped, frames[0]).x).toBe(150);
    expect(somethingOnTheBoard(clamped)).toBe(true);
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
