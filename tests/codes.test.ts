import { describe, expect, it } from 'vitest';
import { codeOf, emptyProject, newIdea, pinLabel, withCodes, type Project } from '../shared/model';

const screen = (id: string, title: string): Project['screens'][number] => ({
  id,
  assetId: null,
  title,
  purpose: '',
  entry: false,
  role: 'screen',
});
const asset = (id: string) => ({
  id,
  name: `${id}.png`,
  file: `${id.charAt(0).repeat(64)}.webp`,
  width: 10,
  height: 10,
  importedAt: 'now',
});

describe('short codes: everything the user and the agent talk about', () => {
  it('gives frames, sketches and ideas a code once, in order of appearance', () => {
    const p = emptyProject('Codes', 'codes');
    p.screens = [screen('a', 'A'), screen('b', 'B')];
    p.assets = [asset('x'), asset('y'), asset('z')];
    p.ideas = [newIdea({ title: 'One' }, 'You', 'i1')];
    const coded = withCodes(p);
    expect(coded.screens.map((s) => s.code)).toEqual(['F1', 'F2']);
    expect(coded.assets.map((a) => a.code)).toEqual(['S1', 'S2', 'S3']);
    expect(coded.ideas.map((i) => i.code)).toEqual(['I1']);
    // Nothing to do: the same object comes back, so React state is untouched.
    expect(withCodes(coded)).toBe(coded);
  });
  it('never reuses a code after a deletion, and keeps codes that exist', () => {
    let p = withCodes({
      ...emptyProject('Codes', 'codes'),
      screens: [screen('a', 'A'), screen('b', 'B'), screen('c', 'C')],
    });
    p = { ...p, screens: p.screens.filter((s) => s.id !== 'b') };
    p = withCodes({ ...p, screens: [...p.screens, screen('d', 'D')] });
    expect(p.screens.map((s) => `${s.id}:${s.code}`)).toEqual(['a:F1', 'c:F3', 'd:F4']);
    expect(codeOf(p.screens[1])).toBe('F3');
    expect(codeOf(undefined)).toBe('?');
  });
  it('names a pin by its frame and its number on that frame', () => {
    const p = withCodes({
      ...emptyProject('Codes', 'codes'),
      screens: [screen('a', 'A'), screen('b', 'B')],
      pins: [
        { id: 'p1', screenId: 'b', x: 0.1, y: 0.1, title: 'One', description: '' },
        { id: 'p2', screenId: 'a', x: 0.1, y: 0.1, title: 'Two', description: '' },
        { id: 'p3', screenId: 'b', x: 0.2, y: 0.2, title: 'Three', description: '' },
      ],
    });
    expect(pinLabel(p, p.pins[2])).toBe('F2 pin 2');
    expect(pinLabel(p, p.pins[1])).toBe('F1 pin 1');
  });
});
