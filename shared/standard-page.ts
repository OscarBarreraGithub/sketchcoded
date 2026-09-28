/**
 * A frame wearing the “Leave it up to the AI” post-it has no drawing, so Sketchcoded builds the
 * page itself: a conventional layout derived from the frame's title, purpose, ideas and the yarn
 * in and out. Test flow renders it as a real, scrollable page whose buttons follow the real yarn,
 * so a board written by an agent can be walked through before anything is drawn. Nothing here
 * invents behaviour: every button is a pin the board already holds, and the text is the user's.
 */
import {
  isHistory,
  isLeftToAi,
  pinUrl,
  type Idea,
  type Pin,
  type Project,
  type Screen,
  type Transition,
} from './model';

export type ActionKind = 'primary' | 'secondary' | 'nav' | 'link' | 'detail' | 'back';
export type PageAction = {
  /** The pin this came from. Clicking it in Test flow follows that pin's real yarn. */
  pinId: string;
  label: string;
  note: string;
  kind: ActionKind;
  /** The destination's title, when a single yarn leaves this pin. */
  to: string | null;
  url: string | null;
  /** More than one yarn: Test flow asks which branch to take. */
  branches: number;
};
export type PageBlock =
  | { block: 'field'; id: string; label: string; hint: string; type: 'text' | 'password' }
  | { block: 'card'; id: string; title: string; body: string; action: PageAction | null }
  | { block: 'row'; id: string; title: string; body: string; action: PageAction | null };
export type PageSpec = {
  /** page: an app screen. form: sign in or set up. dialog: a modal. ending: a terminal screen. */
  shape: 'page' | 'form' | 'dialog' | 'ending';
  product: string;
  title: string;
  lede: string;
  nav: PageAction[];
  primary: PageAction | null;
  blocks: PageBlock[];
  footer: PageAction[];
};

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);
/** A short button label: the pin's own words, trimmed to something that fits a button. */
const shorten = (text: string, max = 5) => {
  const parts = words(text);
  return parts.length <= max ? text.trim() : `${parts.slice(0, max).join(' ')}…`;
};
const fieldish =
  /\b(email|e-mail|password|passcode|code|search|name|address|phone|key|token|note|message|prompt|goal|query|link|url)\b/i;
const secretish = /\b(password|passcode|secret|key|token|pin)\b/i;

const ideaOfPin = (p: Project, pin: Pin) => p.ideas.find((i) => i.pinId === pin.id);
const outgoing = (p: Project, pin: Pin) => p.transitions.filter((t) => t.pinId === pin.id);
const titleOf = (p: Project, t: Transition | undefined) =>
  !t
    ? null
    : isHistory(t)
      ? t.navigation === 'back'
        ? 'Back'
        : 'Close'
      : (p.screens.find((s) => s.id === t.target)?.title ?? null);

function actionOf(p: Project, pin: Pin, index: number, total: number): PageAction {
  const yarn = outgoing(p, pin);
  const idea = ideaOfPin(p, pin);
  const history = yarn.length === 1 && isHistory(yarn[0]);
  const kind: ActionKind =
    pin.kind === 'link'
      ? 'link'
      : pin.kind === 'detail'
        ? 'detail'
        : history
          ? 'back'
          : index === 0 && total > 1
            ? 'primary'
            : 'secondary';
  return {
    pinId: pin.id,
    label: shorten(pin.title || idea?.title || 'Continue'),
    note: (pin.description || idea?.detail || '').trim(),
    kind,
    to: yarn.length === 1 ? titleOf(p, yarn[0]) : null,
    url: pin.kind === 'link' ? pinUrl(pin) : null,
    branches: yarn.length,
  };
}

/** Does this screen deserve a page of its own making? Only a frame left to the AI without a drawing. */
export const buildsItsOwnPage = (s: Screen | undefined) =>
  !!s && isLeftToAi(s) && s.assetId === null;

/**
 * The page for one frame. Pins become the working parts, in the order the board holds them; ideas
 * that never became pins become the content around them.
 */
export function standardPage(p: Project, screen: Screen): PageSpec {
  const pins = p.pins.filter((v) => v.screenId === screen.id);
  const loose = p.ideas.filter((i) => i.screenId === screen.id && !i.pinId);
  const navigating = pins.filter((pin) => pin.kind !== 'annotation');
  const actions = navigating.map((pin, i) => actionOf(p, pin, i, navigating.length));
  const shape: PageSpec['shape'] =
    screen.role === 'auth'
      ? 'form'
      : screen.role === 'modal'
        ? 'dialog'
        : screen.role === 'terminal'
          ? 'ending'
          : 'page';
  const footer = actions.filter((a) => a.kind === 'back' || a.kind === 'link');
  const working = actions.filter((a) => !footer.includes(a));
  // A page with somewhere to go gets a top bar: the ways onward that are not its main action.
  const navCount = shape === 'page' ? Math.min(4, Math.max(0, working.length - 1)) : 0;
  const nav = working.slice(1, 1 + navCount).map((a) => ({ ...a, kind: 'nav' as const }));
  const primary = working[0] ?? null;
  const rest = working.slice(1 + navCount);
  const blocks: PageBlock[] = pins
    .filter((pin) => pin.kind === 'annotation')
    .map((pin) => ({
      block: 'card',
      id: pin.id,
      title: pin.title,
      body: pin.description,
      action: null,
    }));
  const bodyOf = (a: PageAction) => a.note || 'This part of the screen is described in the plan.';
  if (shape === 'form') {
    // Sign in, unlock, set up: the ideas become the fields, the pins the buttons under them.
    const fields = loose.length ? loose : [];
    for (const idea of fields)
      blocks.push({
        block: 'field',
        id: idea.id,
        label: shorten(idea.title, 6),
        hint: idea.detail,
        type: secretish.test(idea.title) ? 'password' : 'text',
      });
    if (!fields.length && !working.length)
      blocks.push({ block: 'field', id: 'blank', label: 'Your details', hint: '', type: 'text' });
    for (const a of rest)
      blocks.push({ block: 'row', id: a.pinId, title: a.label, body: bodyOf(a), action: a });
  } else {
    for (const a of rest)
      blocks.push({ block: 'card', id: a.pinId, title: a.label, body: bodyOf(a), action: a });
    for (const idea of loose) blocks.push(contentBlock(idea));
  }
  return {
    shape,
    product: p.name,
    title: screen.title || 'Untitled screen',
    lede: screen.purpose || '',
    nav,
    primary,
    blocks,
    footer,
  };
}

/** An idea that never became a pin: content on the page, as a field when it reads like one. */
function contentBlock(idea: Idea): PageBlock {
  if (fieldish.test(idea.title))
    return {
      block: 'field',
      id: idea.id,
      label: shorten(idea.title, 6),
      hint: idea.detail,
      type: secretish.test(idea.title) ? 'password' : 'text',
    };
  return { block: 'card', id: idea.id, title: idea.title, body: idea.detail, action: null };
}

/** The same page in words, for `flow.md` and the agent's brief, so the builder builds what was tested. */
export function standardPageOutline(p: Project, screen: Screen): string[] {
  const page = standardPage(p, screen);
  const shapes = {
    page: 'a standard page',
    form: 'a sign-in style form',
    dialog: 'a dialog over the screen that called it',
    ending: 'a closing screen',
  };
  const line = (a: PageAction, role: string) =>
    `  - ${role}: “${a.label}”${a.to ? ` → ${a.to}` : a.branches > 1 ? ` → ${a.branches} branches` : ''}${a.url ? ` (${a.url})` : ''}`;
  const lines = [`Standard page (what Test flow shows): ${shapes[page.shape]}.`];
  if (page.primary) lines.push(line(page.primary, 'Main action'));
  for (const a of page.nav) lines.push(line(a, 'In the top bar'));
  for (const b of page.blocks)
    lines.push(
      b.block === 'field'
        ? `  - Field: “${b.label}”`
        : `  - ${b.block === 'row' ? 'Row' : 'Card'}: “${b.title}”${b.action ? `, button → ${b.action.to ?? 'a choice'}` : ''}`,
    );
  for (const a of page.footer)
    lines.push(line(a, a.kind === 'back' ? 'Footer, goes back' : 'Footer link'));
  return lines;
}
