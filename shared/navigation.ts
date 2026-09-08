import type { Transition } from './model';
export type Frame = { screenId: string; kind: 'page' | 'modal' };
export type PreviewState = { stack: Frame[]; trail: string[] };
export const startPreview = (screenId: string): PreviewState => ({
  stack: [{ screenId, kind: 'page' }],
  trail: [],
});
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
