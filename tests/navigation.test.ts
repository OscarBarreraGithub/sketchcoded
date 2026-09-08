import { describe, expect, it } from 'vitest';
import { follow, startPreview } from '../shared/navigation';
import type { Navigation, Transition } from '../shared/model';
const transition = (navigation: Navigation, target: string | null = 'b'): Transition => ({
  id: 'edge',
  pinId: 'pin',
  target,
  summary: 'Test',
  condition: '',
  logic: '',
  context: '',
  fallback: false,
  color: 'red',
  navigation,
});
describe('authored preview navigation', () => {
  it('pushes and goes back through authored history', () => {
    let s = follow(startPreview('a'), transition('push')).state;
    expect(s.stack.map((f) => f.screenId)).toEqual(['a', 'b']);
    s = follow(s, transition('back', null)).state;
    expect(s.stack.map((f) => f.screenId)).toEqual(['a']);
  });
  it('does not invent history after successful login clears it', () => {
    const state = follow(startPreview('login'), transition('reset', 'inbox')).state;
    const result = follow(state, transition('back', null));
    expect(result.error).toContain('no previous screen');
    expect(result.state).toBe(state);
  });
  it('replace removes only the current frame', () => {
    const state = follow(startPreview('a'), transition('push')).state;
    expect(follow(state, transition('replace', 'c')).state.stack.map((f) => f.screenId)).toEqual([
      'a',
      'c',
    ]);
  });
  it('dismiss closes a modal and its nested pages to the actual caller', () => {
    let state = follow(startPreview('a'), transition('modal', 'dialog')).state;
    state = follow(state, transition('push', 'nested')).state;
    expect(follow(state, transition('dismiss', null)).state.stack.map((f) => f.screenId)).toEqual([
      'a',
    ]);
  });
  it('preserves modal context on replace', () => {
    let s = follow(startPreview('a'), transition('modal', 'dialog')).state;
    s = follow(s, transition('replace', 'result')).state;
    expect(s.stack.at(-1)?.kind).toBe('modal');
    expect(follow(s, transition('dismiss', null)).state.stack.map((f) => f.screenId)).toEqual([
      'a',
    ]);
  });
  it('dismisses a nested dialog only to its immediate caller', () => {
    let s = follow(startPreview('a'), transition('modal', 'first')).state;
    s = follow(s, transition('modal', 'second')).state;
    expect(follow(s, transition('dismiss', null)).state.stack.map((f) => f.screenId)).toEqual([
      'a',
      'first',
    ]);
  });
  it('reports absent modal callers and absent destinations', () => {
    expect(follow(startPreview('a'), transition('dismiss', null)).error).toContain(
      'no open dialog',
    );
    expect(follow(startPreview('a'), transition('push', null)).error).toContain('no destination');
  });
  it('records chosen branches without mutating prior snapshots', () => {
    const original = startPreview('a');
    const next = follow(original, transition('push')).state;
    expect(next.trail).toEqual(['edge']);
    expect(original.stack).toHaveLength(1);
    expect(original.trail).toEqual([]);
  });
});
