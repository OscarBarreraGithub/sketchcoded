import { describe, expect, it } from 'vitest';
import { frameOf, placeBoardWords, type Point } from '../src/boardNotes';

const frame = (id: string, x: number, y: number) => frameOf(id, { x, y, width: 300, height: 228 });
const straight = (a: Point, b: Point): Point[] => [a, a, b, b];

describe('yarn labels never cover a frame', () => {
  it('keeps a label in the middle of its yarn when that is clear', () => {
    const placed = placeBoardWords(
      [frame('a', 0, 0), frame('b', 900, 0)],
      [{ id: 'y', text: 'Open', curve: straight([300, 100], [900, 100]), wordy: true }],
      1,
    );
    expect(placed.get('y')).toEqual({ x: 600, y: 100, dot: false });
  });

  it('slides a label along its yarn away from a frame in the middle', () => {
    // A third frame sits on the middle of the yarn, so the label moves along it.
    const placed = placeBoardWords(
      [frame('a', 0, 0), frame('b', 1500, 0), frame('c', 650, 0)],
      [{ id: 'y', text: 'Open', curve: straight([300, 100], [1500, 100]), wordy: true }],
      1,
    );
    const at = placed.get('y')!;
    expect(at.dot).toBe(false);
    expect(at.x < 650 - 40 || at.x > 950 + 40).toBe(true);
  });

  it('turns a label into a mark when two frames leave no room for its words', () => {
    const placed = placeBoardWords(
      [frame('a', 0, 0), frame('b', 340, 0)],
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
      [{ id: 'y', text: 'Open', curve: straight([300, 100], [900, 100]), wordy: false }],
      1,
    );
    expect(placed.get('y')!.dot).toBe(true);
  });

  it('keeps two labels clear of each other', () => {
    const placed = placeBoardWords(
      [frame('a', 0, 0), frame('b', 900, 0)],
      [
        { id: 'one', text: 'Open', curve: straight([300, 100], [900, 100]), wordy: true },
        { id: 'two', text: 'Close', curve: straight([300, 100], [900, 100]), wordy: true },
      ],
      1,
    );
    expect(placed.get('one')!.x).not.toBe(placed.get('two')!.x);
  });
});
