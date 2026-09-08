import { describe, expect, it } from 'vitest';
import { analyze, decisionFor, type Issue } from '../shared/graph';
import {
  emptyProject,
  removePin,
  removeScreen,
  type Project,
  type Transition,
} from '../shared/model';
const asset = {
  id: 'art',
  name: 'sketch',
  file: `${'a'.repeat(64)}.webp`,
  width: 100,
  height: 100,
  importedAt: 'now',
};
function graph(names = ['a', 'b', 'c']): Project {
  const p = emptyProject('Test', 'test');
  p.assets = [asset];
  p.screens = names.map((id, i) => ({
    id,
    assetId: 'art',
    title: id,
    purpose: 'A test screen',
    entry: i === 0,
    role: 'screen',
  }));
  p.pins = names.map((id) => ({
    id: `pin-${id}`,
    screenId: id,
    x: 0.5,
    y: 0.5,
    title: `Open ${id}`,
    description: 'An intentional interaction',
  }));
  p.layout = Object.fromEntries(names.map((id, i) => [id, { x: i * 300, y: 0, width: 250 }]));
  return p;
}
function edge(
  id: string,
  source: string,
  target: string | null,
  extra: Partial<Transition> = {},
): Transition {
  return {
    id,
    pinId: `pin-${source}`,
    target,
    summary: id,
    condition: '',
    logic: '',
    context: '',
    fallback: false,
    navigation: 'push',
    color: 'red',
    ...extra,
  };
}
const rules = (p: Project) => analyze(p).map((i) => i.rule);
const find = (p: Project, rule: string) => analyze(p).find((i) => i.rule === rule)!;
function accept(p: Project, i: Issue) {
  p.reviews.push({
    issueId: i.id,
    fingerprint: i.fingerprint,
    reason: 'This is intentional for this scenario.',
    author: 'Tester',
    acceptedAt: '2026-09-08',
  });
}
describe('flow diagnostics', () => {
  it('flags screens outside all entry paths', () => {
    const p = graph();
    p.transitions = [edge('ab', 'a', 'b')];
    expect(find(p, 'unreachable').subjects).toEqual(['c']);
  });
  it('allows separate entry points without assuming all screens share a start', () => {
    const p = graph();
    p.screens[2].entry = true;
    p.transitions = [edge('ab', 'a', 'b')];
    expect(rules(p)).not.toContain('unreachable');
  });
  it('requires an explicit entry and never infers one from a login title', () => {
    const p = graph();
    p.screens.forEach((s) => (s.entry = false));
    p.screens[0].title = 'Login';
    expect(rules(p)).toContain('no-entry');
  });
  it('accepts indirect structural return paths', () => {
    const p = graph();
    p.transitions = [edge('ab', 'a', 'b'), edge('bc', 'b', 'c'), edge('ca', 'c', 'a')];
    expect(rules(p)).not.toContain('one-way');
  });
  it('understands a push followed by an authored Back action', () => {
    const p = graph(['a', 'b']);
    p.transitions = [edge('ab', 'a', 'b'), edge('back', 'b', null, { navigation: 'back' })];
    expect(rules(p)).not.toContain('one-way');
    expect(rules(p)).not.toContain('history-context');
  });
  it('flags a history-reset transition even if the destination has a back button', () => {
    const p = graph(['a', 'b']);
    p.screens[0].role = 'auth';
    p.transitions = [
      edge('login', 'a', 'b', { navigation: 'reset' }),
      edge('back', 'b', null, { navigation: 'back' }),
    ];
    expect(rules(p)).toContain('one-way');
    expect(rules(p)).toContain('history-context');
  });
  it('does not waive login based on a name or role', () => {
    const p = graph(['a', 'b']);
    p.screens[0].title = 'Login';
    p.screens[0].role = 'auth';
    p.transitions = [edge('login', 'a', 'b', { navigation: 'reset' })];
    expect(find(p, 'one-way').severity).toBe('review');
  });
  it('allows a documented terminal ending while requiring a rationale', () => {
    const p = graph(['a', 'b']);
    p.screens[1].role = 'terminal';
    p.transitions = [edge('done', 'a', 'b')];
    expect(rules(p)).not.toContain('dead-end');
    expect(rules(p)).not.toContain('one-way');
    p.screens[1].purpose = '';
    expect(rules(p)).toContain('terminal-reason');
    expect(rules(p)).toContain('dead-end');
  });
  it('models dialogs with dynamic dismissal', () => {
    const p = graph(['a', 'b']);
    p.transitions = [
      edge('dialog', 'a', 'b', { navigation: 'modal' }),
      edge('dismiss', 'b', null, { navigation: 'dismiss' }),
    ];
    expect(rules(p)).not.toContain('one-way');
    expect(rules(p)).not.toContain('history-context');
    p.screens[1].entry = true;
    expect(rules(p)).toContain('history-context');
  });
  it('treats guarded reachability as possible and surfaces semantic review', () => {
    const p = graph(['a', 'b']);
    p.transitions = [
      edge('ab', 'a', 'b', { condition: 'Only if allowed' }),
      edge('back', 'b', 'a'),
    ];
    expect(rules(p)).not.toContain('unreachable');
    expect(find(p, 'branch-conditions').detail).toContain('No fallback');
  });
  it('reviews branching even with a fallback and flags ambiguous summaries', () => {
    const p = graph();
    p.transitions = [
      edge('same', 'a', 'b', { condition: 'Allowed' }),
      edge('other', 'a', 'c', { summary: 'same', fallback: true }),
    ];
    expect(rules(p)).toContain('branch-conditions');
    expect(rules(p)).toContain('ambiguous-branches');
  });
  it('detects duplicate fallbacks', () => {
    const p = graph();
    p.transitions = [
      edge('one', 'a', 'b', { fallback: true }),
      edge('two', 'a', 'c', { fallback: true }),
    ];
    expect(rules(p)).toContain('multiple-fallbacks');
  });
  it('reports broken references as non-waivable errors', () => {
    const p = graph();
    p.transitions = [edge('bad', 'missing', 'gone')];
    const issue = find(p, 'missing-target');
    expect(issue.severity).toBe('error');
    accept(p, issue);
    expect(decisionFor(issue, p.reviews).status).toBe('open');
    expect(rules(p)).toContain('orphan-transition');
  });
  it('detects missing assets, layout, and duplicate identifiers', () => {
    const p = graph();
    p.assets = [];
    delete p.layout.a;
    p.screens.push(p.screens[0]);
    expect(rules(p)).toEqual(
      expect.arrayContaining(['missing-image', 'missing-layout', 'duplicate-id']),
    );
  });
  it('flags empty pin intent and unconnected pins', () => {
    const p = graph();
    p.pins[0].description = '';
    expect(rules(p)).toEqual(expect.arrayContaining(['pin-intent', 'unconnected-pin']));
  });
});
describe('review decisions', () => {
  it('keeps acceptance when layout, pin position or yarn color changes', () => {
    const p = graph(['a', 'b']);
    p.transitions = [edge('ab', 'a', 'b')];
    const issue = find(p, 'one-way');
    accept(p, issue);
    p.layout.a.x = 600;
    p.pins[0].x = 0.8;
    p.transitions[0].color = 'blue';
    expect(decisionFor(find(p, 'one-way'), p.reviews).status).toBe('accepted');
  });
  it('reopens acceptance when its navigation evidence changes', () => {
    const p = graph(['a', 'b']);
    p.transitions = [edge('ab', 'a', 'b')];
    accept(p, find(p, 'one-way'));
    p.transitions[0].navigation = 'reset';
    expect(decisionFor(find(p, 'one-way'), p.reviews).status).toBe('stale');
  });
  it('reopens a branch decision when guard or context changes', () => {
    const p = graph(['a', 'b']);
    p.transitions = [edge('ab', 'a', 'b', { condition: 'Allowed' })];
    accept(p, find(p, 'branch-conditions'));
    p.transitions[0].context = 'userId';
    expect(decisionFor(find(p, 'branch-conditions'), p.reviews).status).toBe('stale');
  });
  it('preserves branch acceptance when another screen title changes', () => {
    const p = graph();
    p.transitions = [edge('ab', 'a', 'b', { condition: 'Allowed' })];
    accept(p, find(p, 'branch-conditions'));
    p.screens[2].title = 'Another name';
    expect(decisionFor(find(p, 'branch-conditions'), p.reviews).status).toBe('accepted');
  });
});
describe('deletion integrity', () => {
  it('removes incident edges and owned pins when removing a screen', () => {
    const p = graph();
    p.transitions = [edge('ab', 'a', 'b'), edge('bc', 'b', 'c'), edge('ca', 'c', 'a')];
    const next = removeScreen(p, 'b');
    expect(next.transitions.map((t) => t.id)).toEqual(['ca']);
    expect(next.pins.map((pin) => pin.id)).not.toContain('pin-b');
    expect(analyze(next).filter((i) => i.severity === 'error')).toEqual([]);
    expect(p.screens).toHaveLength(3);
  });
  it('removes every branch of a deleted pin', () => {
    const p = graph();
    p.transitions = [edge('ab', 'a', 'b'), edge('ac', 'a', 'c')];
    expect(removePin(p, 'pin-a').transitions).toEqual([]);
  });
});
