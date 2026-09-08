import { isHistory, type Project, type Review, type Transition } from './model';

export type Issue = {
  id: string;
  rule: string;
  severity: 'error' | 'warning' | 'review';
  title: string;
  detail: string;
  subjects: string[];
  fingerprint: string;
};
// Deterministic content fingerprint. Sorting callers' inputs avoids layout/order-only invalidation.
export function fingerprint(value: unknown): string {
  const str = JSON.stringify(value);
  let a = 2166136261,
    b = 5381;
  for (let i = 0; i < str.length; i++) {
    a = Math.imul(a ^ str.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ str.charCodeAt(i);
  }
  return `${(a >>> 0).toString(16)}${(b >>> 0).toString(16)}`;
}
const semantics = (t: Transition) => ({
  id: t.id,
  pinId: t.pinId,
  target: t.target,
  summary: t.summary,
  condition: t.condition,
  logic: t.logic,
  context: t.context,
  fallback: t.fallback,
  navigation: t.navigation,
});
const sorted = <T extends { id: string }>(values: T[]) =>
  [...values].sort((a, b) => a.id.localeCompare(b.id));
export function analyze(p: Project): Issue[] {
  const issues: Issue[] = [];
  const add = (
    rule: string,
    severity: Issue['severity'],
    subjects: string[],
    title: string,
    detail: string,
    evidence: unknown,
  ) => {
    issues.push({
      id: `${rule}:${subjects.join(':') || 'project'}`,
      rule,
      severity,
      subjects,
      title,
      detail,
      fingerprint: fingerprint({ rule, evidence }),
    });
  };
  const screenById = new Map(p.screens.map((s) => [s.id, s]));
  const pinById = new Map(p.pins.map((pin) => [pin.id, pin]));
  const assets = new Set(p.assets.map((a) => a.id));
  const byScreen = new Map<string, Transition[]>(),
    byPin = new Map<string, Transition[]>(),
    incomingByScreen = new Map<string, Transition[]>();
  for (const t of p.transitions) {
    byPin.set(t.pinId, [...(byPin.get(t.pinId) ?? []), t]);
    const source = pinById.get(t.pinId)?.screenId;
    if (source) byScreen.set(source, [...(byScreen.get(source) ?? []), t]);
  }
  const outgoing = (s: string) => byScreen.get(s) ?? [];
  const valid = p.transitions.filter(
    (t) => pinById.has(t.pinId) && (isHistory(t) || (t.target && screenById.has(t.target))),
  );
  const adjacency = new Map(p.screens.map((s) => [s.id, [] as string[]]));
  for (const t of valid)
    if (!isHistory(t) && t.target) {
      adjacency.get(pinById.get(t.pinId)!.screenId)?.push(t.target);
      incomingByScreen.set(t.target, [...(incomingByScreen.get(t.target) ?? []), t]);
    }
  const reachCache = new Map<string, Set<string>>();
  const reach = (starts: string[]) => {
    const key = [...starts].sort().join(':');
    if (reachCache.has(key)) return reachCache.get(key)!;
    const seen = new Set(starts),
      queue = [...starts];
    for (let i = 0; i < queue.length; i++)
      for (const next of adjacency.get(queue[i]) ?? [])
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
    reachCache.set(key, seen);
    return seen;
  };
  // Topology evidence omits coordinates, image choice, and cosmetic labels.
  const topology = {
    screens: sorted(p.screens).map((s) => ({
      id: s.id,
      entry: s.entry,
      role: s.role,
      purpose: s.purpose,
    })),
    transitions: sorted(valid).map((t) => ({
      id: t.id,
      source: pinById.get(t.pinId)?.screenId,
      target: t.target,
      navigation: t.navigation,
      condition: t.condition,
      logic: t.logic,
      context: t.context,
      fallback: t.fallback,
    })),
  };
  const topologyStamp = fingerprint(topology);
  for (const [kind, list] of Object.entries({
    screen: p.screens,
    pin: p.pins,
    transition: p.transitions,
    asset: p.assets,
  })) {
    const ids = new Set<string>();
    for (const item of list) {
      if (ids.has(item.id))
        add(
          'duplicate-id',
          'error',
          [kind, item.id],
          'Duplicate identifier',
          `Two ${kind}s share an identifier. Repair the imported project.`,
          item.id,
        );
      ids.add(item.id);
    }
  }
  const entries = p.screens.filter((s) => s.entry).map((s) => s.id);
  if (p.screens.length && !entries.length)
    add(
      'no-entry',
      'warning',
      [],
      'Choose a starting screen',
      'Mark at least one screen as an entry point. Separate signed-in and signed-out entries are allowed.',
      p.screens.map((s) => s.id).sort(),
    );
  const reachable = reach(entries);
  for (const s of p.screens) {
    if (!assets.has(s.assetId))
      add(
        'missing-image',
        'error',
        [s.id],
        `${s.title}: missing image`,
        'This screen references an image that is not in the project.',
        s.assetId,
      );
    if (!p.layout[s.id])
      add(
        'missing-layout',
        'error',
        [s.id],
        `${s.title}: missing position`,
        'This screen has no board position.',
        s.id,
      );
    if (!s.title.trim())
      add(
        'untitled',
        'warning',
        [s.id],
        'A screen needs a title',
        'Name the screen so its purpose is clear.',
        s.title,
      );
    if (entries.length && !reachable.has(s.id))
      add(
        'unreachable',
        'warning',
        [s.id],
        `${s.title} is out of reach`,
        'No authored forward path reaches this screen from any entry. Connect it, make it an alternate entry, or explain why it is intentionally separate. Conditions may further restrict reachable paths.',
        topologyStamp,
      );
    if (s.role === 'terminal' && !s.purpose.trim())
      add(
        'terminal-reason',
        'review',
        [s.id],
        `${s.title}: explain the ending`,
        'Describe why this is a legitimate final screen. A terminal label alone does not explain the intended behavior.',
        s,
      );
    if (!outgoing(s.id).length && !(s.role === 'terminal' && s.purpose.trim()))
      add(
        'dead-end',
        'warning',
        [s.id],
        `${s.title} has no way onward`,
        'Add an exit interaction or document an intentional ending. Preview rewind is a testing tool and does not count as app navigation.',
        { screen: s, outgoing: outgoing(s.id) },
      );
  }
  for (const pin of p.pins) {
    if (!screenById.has(pin.screenId))
      add(
        'orphan-pin',
        'error',
        [pin.id],
        'A pin has no screen',
        'Repair or remove this orphaned pin.',
        pin.screenId,
      );
    if (!pin.title.trim() || !pin.description.trim())
      add(
        'pin-intent',
        'warning',
        [pin.id],
        `${pin.title || 'Untitled pin'} needs intent`,
        'Give the interaction a short name and describe what this part of the sketch should do.',
        { title: pin.title, description: pin.description },
      );
    const branches = byPin.get(pin.id) ?? [];
    if (!branches.length)
      add(
        'unconnected-pin',
        'warning',
        [pin.id],
        `${pin.title || 'A pin'} is not connected`,
        'Draw a yarn to a screen, or add a Back / Dismiss action in the pin editor.',
        { screenId: pin.screenId, title: pin.title, description: pin.description },
      );
    if (branches.length > 1 || branches.some((t) => t.condition.trim())) {
      const fallbackCount = branches.filter((t) => t.fallback).length;
      add(
        'branch-conditions',
        'review',
        [pin.id],
        `Review branches for ${pin.title || 'this pin'}`,
        `These ${branches.length} paths use human-described conditions. Review overlap, coverage, unavailable states, and data passed. ${fallbackCount ? 'A fallback is recorded; verify it is appropriate.' : 'No fallback is recorded; confirm what happens when no condition matches.'} The preview asks you to choose a scenario.`,
        {
          pin: { title: pin.title, description: pin.description },
          branches: sorted(branches).map(semantics),
        },
      );
      if (fallbackCount > 1)
        add(
          'multiple-fallbacks',
          'warning',
          [pin.id],
          'More than one fallback',
          'Choose one default branch, or explain how these fallback outcomes are selected.',
          sorted(branches).map(semantics),
        );
      const summaries = branches.map((t) => t.summary.trim().toLowerCase());
      if (new Set(summaries).size !== summaries.length)
        add(
          'ambiguous-branches',
          'warning',
          [pin.id],
          'Branch labels are ambiguous',
          'Use distinct summaries so each preview option can be understood.',
          summaries.sort(),
        );
    }
  }
  for (const t of p.transitions) {
    const pin = pinById.get(t.pinId),
      source = pin && screenById.get(pin.screenId);
    if (!pin)
      add(
        'orphan-transition',
        'error',
        [t.id],
        'A yarn has no source pin',
        'Repair or remove this connection.',
        t.pinId,
      );
    if (!isHistory(t) && (!t.target || !screenById.has(t.target)))
      add(
        'missing-target',
        'error',
        [t.id],
        'A yarn has no destination',
        'Connect this yarn to an existing screen.',
        t.target,
      );
    if (isHistory(t) && t.target)
      add(
        'history-target',
        'error',
        [t.id],
        'History action has a fixed destination',
        'Back and Dismiss use their actual caller. Remove the fixed destination.',
        { target: t.target, navigation: t.navigation },
      );
    if (!t.summary.trim())
      add(
        'branch-summary',
        'warning',
        [t.id],
        'Name this connection',
        'A short summary makes the flow and preview choices understandable.',
        t.summary,
      );
    if (isHistory(t) && source) {
      const incoming = incomingByScreen.get(source.id) ?? [];
      const supported = incoming.some((edge) =>
        t.navigation === 'dismiss'
          ? edge.navigation === 'modal'
          : edge.navigation === 'push' || edge.navigation === 'modal',
      );
      if (
        !supported ||
        source.entry ||
        incoming.some(
          (edge) =>
            edge.navigation === 'reset' ||
            edge.navigation === 'replace' ||
            (t.navigation === 'dismiss' && edge.navigation !== 'modal'),
        )
      ) {
        add(
          'history-context',
          'review',
          [t.id],
          `${t.summary || 'History action'} needs a caller`,
          'This screen can be reached without the required history or modal caller. Add a fallback route, restrict entry, or explain the assumption. Preview will report an unavailable action instead of inventing a destination.',
          {
            source: source.id,
            entry: source.entry,
            navigation: t.navigation,
            incoming: sorted(incoming).map(semantics),
          },
        );
      }
    }
    if (!source || isHistory(t) || !t.target || !screenById.has(t.target)) continue;
    const target = screenById.get(t.target)!;
    const returning = reach([target.id]).has(source.id);
    const historyReturn = outgoing(target.id).some(
      (edge) =>
        (edge.navigation === 'back' && (t.navigation === 'push' || t.navigation === 'modal')) ||
        (edge.navigation === 'dismiss' && t.navigation === 'modal'),
    );
    if (!returning && !historyReturn && !(target.role === 'terminal' && target.purpose.trim())) {
      add(
        'one-way',
        'review',
        [t.id],
        `${source.title} → ${target.title} is one way`,
        `${t.navigation === 'reset' ? 'This transition intentionally clears history. ' : ''}No structural return path was found. Authentication, onboarding, and deliberate context changes may justify this. Accept with a reason or add a return route. Prose conditions are not evaluated.`,
        { transition: semantics(t), topology: topologyStamp },
      );
    }
  }
  return issues.sort(
    (a, b) =>
      ({ error: 0, warning: 1, review: 2 })[a.severity] -
        { error: 0, warning: 1, review: 2 }[b.severity] || a.id.localeCompare(b.id),
  );
}
export function decisionFor(
  issue: Issue,
  reviews: Review[],
): { status: 'open' | 'accepted' | 'stale'; review?: Review } {
  const matches = reviews.filter((r) => r.issueId === issue.id);
  const review = matches.at(-1);
  if (!review || issue.severity === 'error') return { status: 'open' };
  return { status: review.fingerprint === issue.fingerprint ? 'accepted' : 'stale', review };
}
