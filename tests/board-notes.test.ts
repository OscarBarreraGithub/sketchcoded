import { describe, expect, it } from 'vitest';
import { frameOf, overlapArea, placeBoardWords, type Point } from '../src/boardNotes';
import type { Rect } from '../src/boardView';

const frame = (id: string, x: number, y: number) => frameOf(id, { x, y, width: 300, height: 228 });
const boxOf = (p: { x: number; y: number }, width: number, height: number): Rect => ({
  x: p.x,
  y: p.y,
  width,
  height,
});
const straight = (a: Point, b: Point): Point[] => [a, a, b, b];

describe('words on the board never cover a frame', () => {
  it('puts a way back under its frame when there is room', () => {
    const placed = placeBoardWords(
      [frame('a', 0, 0)],
      [{ id: 'back', frameId: 'a', text: '↶ Close' }],
      [],
      1,
    );
    const at = placed.get('back')!;
    expect(at.y).toBeGreaterThan(228);
    expect(at.x).toBe(15);
  });

  it('moves a way back beside its frame when another frame sits right under it', () => {
    const frames = [frame('a', 0, 0), frame('b', 0, 300)];
    const placed = placeBoardWords(
      frames,
      [{ id: 'back', frameId: 'a', text: '↶ Back to Home' }],
      [],
      1,
    );
    const at = placed.get('back')!;
    const note = boxOf(at, 150, 44);
    for (const f of frames) {
      expect(overlapArea(note, f.paper)).toBe(0);
      expect(overlapArea(note, f.tape)).toBe(0);
    }
  });

  it('stacks two ways back on one frame without overlapping each other', () => {
    const placed = placeBoardWords(
      [frame('a', 0, 0)],
      [
        { id: 'one', frameId: 'a', text: '↶ Close' },
        { id: 'two', frameId: 'a', text: '↶ Back' },
      ],
      [],
      0.5,
    );
    const one = placed.get('one')!,
      two = placed.get('two')!;
    // At 50% a note is 88 board units tall (44 screen pixels).
    expect(Math.abs(two.y - one.y)).toBeGreaterThanOrEqual(88);
  });

  it('slides a yarn label along its yarn to a clear spot', () => {
    const frames = [frame('a', 0, 0), frame('b', 900, 0)];
    // The middle of this yarn is clear, so the label stays there and keeps its words.
    const placed = placeBoardWords(
      frames,
      [],
      [{ id: 'y', text: 'Open', curve: straight([300, 100], [900, 100]), wordy: true }],
      1,
    );
    expect(placed.get('y')).toEqual({ x: 600, y: 100, dot: false });
  });

  it('turns a label into a mark when two frames leave no room for its words', () => {
    const frames = [frame('a', 0, 0), frame('b', 340, 0)];
    const placed = placeBoardWords(
      frames,
      [],
      [
        {
          id: 'y',
          text: 'Example: this website',
          curve: straight([300, 100], [340, 100]),
          wordy: true,
        },
      ],
      1,
    );
    expect(placed.get('y')!.dot).toBe(true);
  });

  it('keeps a quiet label as a mark even when there is room', () => {
    const placed = placeBoardWords(
      [frame('a', 0, 0), frame('b', 900, 0)],
      [],
      [{ id: 'y', text: 'Open', curve: straight([300, 100], [900, 100]), wordy: false }],
      1,
    );
    expect(placed.get('y')!.dot).toBe(true);
  });
});
