import { isHistory, type Project, type Transition } from './model';
export type Frame = { screenId: string; kind: 'page' | 'modal' };
export type PreviewState = { stack: Frame[]; trail: string[] };
export const startPreview = (screenId: string): PreviewState => ({
  stack: [{ screenId, kind: 'page' }],
  trail: [],
});

/**
 * Starting a test somewhere other than an entry: arrive the way a visitor would, along the
 * shortest authored route from an entry, so the screen's own Back and Close return where they
 * really lead. The route only sets up history; it is not part of the test's trail, and rewind
 * stops at the start. A screen no entry reaches starts on its own, with no history.
 */
export function arrive(p: Project, screenId: string): { state: PreviewState; via: string[] } {
  const entries = p.screens.filter((s) => s.entry && s.role !== 'detail').map((s) => s.id);
  if (entries.includes(screenId) || !entries.length)
    return { state: startPreview(screenId), via: [] };
  const pins = new Map(p.pins.map((pin) => [pin.id, pin]));
  const screens = new Set(p.screens.filter((s) => s.role !== 'detail').map((s) => s.id));
  const onward = (from: string) =>
    p.transitions.filter((t) => {
      const pin = pins.get(t.pinId);
      return (
        pin?.screenId === from &&
        (pin.kind ?? 'interaction') === 'interaction' &&
        !isHistory(t) &&
        !!t.target &&
        screens.has(t.target)
      );
    });
  const reachedBy = new Map<string, Transition | null>(entries.map((id) => [id, null]));
  const queue = [...entries];
  for (let i = 0; i < queue.length && !reachedBy.has(screenId); i++)
    for (const t of onward(queue[i]))
      if (!reachedBy.has(t.target!)) {
        reachedBy.set(t.target!, t);
        queue.push(t.target!);
      }
  if (!reachedBy.has(screenId)) return { state: startPreview(screenId), via: [] };
  const route: Transition[] = [];
  for (let at = screenId, t = reachedBy.get(at); t; t = reachedBy.get(at)) {
    route.unshift(t);
    at = pins.get(t.pinId)!.screenId;
  }
  let state = startPreview(pins.get(route[0].pinId)!.screenId);
  const via = [state.stack[0].screenId];
  for (const t of route) {
    state = follow(state, t).state;
    via.push(t.target!);
  }
  return { state: { ...state, trail: [] }, via: via.slice(0, -1) };
}
export function follow(
  state: PreviewState,
  t: Transition,
): { state: PreviewState; error?: string } {
  let stack = [...state.stack];
  if (t.navigation === 'back') {
    if (stack.length < 2)
      return {
        state,
        error:
          'There is no previous screen in this app history. Add a fallback connection for this entry path.',
      };
    stack.pop();
  } else if (t.navigation === 'dismiss') {
    const modalIndex = stack.findLastIndex((f) => f.kind === 'modal');
    if (modalIndex < 1)
      return {
        state,
        error:
          'There is no open dialog to dismiss on this path. Add a fallback or open this screen as a dialog.',
      };
    stack = stack.slice(0, modalIndex);
  } else {
    if (!t.target) return { state, error: 'This connection has no destination yet.' };
    const frame: Frame = { screenId: t.target, kind: t.navigation === 'modal' ? 'modal' : 'page' };
    if (t.navigation === 'reset') stack = [frame];
    else if (t.navigation === 'replace') {
      frame.kind = stack.at(-1)?.kind ?? 'page';
      stack[stack.length - 1] = frame;
    } else stack.push(frame);
  }
  return { state: { stack, trail: [...state.trail, t.id] } };
}
