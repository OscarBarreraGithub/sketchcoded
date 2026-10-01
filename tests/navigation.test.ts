import { describe, expect, it } from 'vitest';
import { arrive, follow, startPreview } from '../shared/navigation';
import { emptyProject, type Navigation, type Project, type Transition } from '../shared/model';
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

/** Home (entry) opens the Board; the Board pushes an Outline and opens a Dialog; nothing reaches Lost. */
function site(): Project {
  const p = emptyProject('Arrival');
  const screen = (id: string, entry = false) => ({
    id,
    assetId: null,
    title: id,
    purpose: '',
    entry,
    role: 'screen' as const,
  });
  p.screens = [
    screen('home', true),
    screen('board'),
    screen('outline'),
    screen('dialog'),
    screen('lost'),
  ];
  const pin = (id: string, screenId: string) => ({
    id,
    screenId,
    x: 0.5,
    y: 0.5,
    title: id,
    description: '',
  });
  p.pins = [
    pin('open-board', 'home'),
    pin('open-outline', 'board'),
    pin('open-dialog', 'board'),
    pin('back', 'outline'),
    pin('close', 'dialog'),
  ];
  const yarn = (
    id: string,
    pinId: string,
    target: string | null,
    navigation: Navigation,
  ): Transition => ({
    ...transition(navigation, target),
    id,
    pinId,
  });
  p.transitions = [
    yarn('t1', 'open-board', 'board', 'push'),
    yarn('t2', 'open-outline', 'outline', 'push'),
    yarn('t3', 'open-dialog', 'dialog', 'modal'),
    yarn('t4', 'back', null, 'back'),
    yarn('t5', 'close', null, 'dismiss'),
  ];
  return p;
}
describe('starting a test away from an entry', () => {
  it('arrives along the shortest authored route, so Back returns where it leads', () => {
    const p = site();
    const { state, via } = arrive(p, 'outline');
    expect(via).toEqual(['home', 'board']);
    expect(state.stack.map((f) => f.screenId)).toEqual(['home', 'board', 'outline']);
    expect(state.trail).toEqual([]);
    const back = follow(
      state,
      p.transitions.find((t) => t.id === 't4')!,
    );
    expect(back.error).toBeUndefined();
    expect(back.state.stack.at(-1)!.screenId).toBe('board');
  });
  it('opens a dialog over its caller, so Close dismisses to it', () => {
    const p = site();
    const { state } = arrive(p, 'dialog');
    expect(state.stack.at(-1)).toEqual({ screenId: 'dialog', kind: 'modal' });
    const closed = follow(
      state,
      p.transitions.find((t) => t.id === 't5')!,
    );
    expect(closed.error).toBeUndefined();
    expect(closed.state.stack.at(-1)!.screenId).toBe('board');
  });
  it('starts an entry, or a screen no entry reaches, on its own', () => {
    const p = site();
    expect(arrive(p, 'home')).toEqual({ state: startPreview('home'), via: [] });
    expect(arrive(p, 'lost')).toEqual({ state: startPreview('lost'), via: [] });
  });
});
