import { describe, expect, it } from 'vitest';
import { flowDocument } from '../shared/flow-document';
import { analyze } from '../shared/graph';
import { buildsItsOwnPage, standardPage, standardPageOutline } from '../shared/standard-page';
import {
  emptyProject,
  leaveToAi,
  newIdea,
  setDrawing,
  type Pin,
  type Project,
} from '../shared/model';

const asset = {
  id: 'a',
  name: 'home.png',
  file: `${'a'.repeat(64)}.webp`,
  width: 100,
  height: 80,
  importedAt: 'now',
};
const pin = (id: string, screenId: string, title: string, extra: Partial<Pin> = {}): Pin => ({
  id,
  screenId,
  x: 0.86,
  y: 0.12,
  title,
  description: `What ${title} does.`,
  kind: 'interaction',
  provisional: true,
  ...extra,
});
/** Home (left to the AI, three pins), Chats, a sign-in and a goodbye. */
function site(): Project {
  let p = emptyProject('Field notes', 'notes');
  p.assets = [asset];
  p.screens = [
    {
      id: 'home',
      assetId: null,
      title: 'Home',
      purpose: 'Everything at a glance.',
      entry: true,
      role: 'screen',
    },
    {
      id: 'chats',
      assetId: null,
      title: 'Your conversations',
      purpose: 'One list.',
      entry: false,
      role: 'screen',
    },
    {
      id: 'settings',
      assetId: null,
      title: 'Settings',
      purpose: 'Your choices.',
      entry: false,
      role: 'screen',
    },
    {
      id: 'signin',
      assetId: null,
      title: 'Sign in',
      purpose: 'Unlock this computer.',
      entry: true,
      role: 'auth',
    },
    {
      id: 'bye',
      assetId: null,
      title: 'Signed out',
      purpose: 'You are done.',
      entry: false,
      role: 'terminal',
    },
  ];
  p.layout = Object.fromEntries(p.screens.map((s, i) => [s.id, { x: i * 520, y: 0, width: 360 }]));
  p.pins = [
    pin('p1', 'home', 'Open your conversations'),
    pin('p2', 'home', 'Settings'),
    pin('p3', 'home', 'Read the handbook', {
      kind: 'link',
      description: 'Opens https://example.com/handbook',
    }),
    pin('p4', 'signin', 'Unlock'),
  ];
  p.transitions = [
    {
      id: 't1',
      pinId: 'p1',
      target: 'chats',
      summary: 'Open chats',
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'push',
      color: 'red',
    },
    {
      id: 't2',
      pinId: 'p2',
      target: 'settings',
      summary: 'Open settings',
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'push',
      color: 'red',
    },
    {
      id: 't4',
      pinId: 'p4',
      target: 'home',
      summary: 'Unlocked',
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'reset',
      color: 'red',
    },
  ];
  p.ideas = [
    newIdea(
      { title: 'Remaining, not used', detail: 'Filled meters, on first open.', screenId: 'home' },
      'Agent',
      'i1',
    ),
    newIdea(
      { title: 'Your email', detail: 'The address you signed up with.', screenId: 'signin' },
      'Agent',
      'i2',
    ),
    newIdea({ title: 'Password', detail: 'Or a passkey.', screenId: 'signin' }, 'Agent', 'i3'),
  ];
  for (const id of ['home', 'chats', 'settings', 'signin', 'bye']) p = leaveToAi(p, id, true);
  return p;
}

describe('a frame left to the AI builds its own page', () => {
  it('only when it has no drawing of its own', () => {
    const p = site();
    expect(buildsItsOwnPage(p.screens[0])).toBe(true);
    const drawn = setDrawing(p, 'home', 'web', 'a');
    expect(buildsItsOwnPage(drawn.screens[0])).toBe(false);
    expect(buildsItsOwnPage(leaveToAi(p, 'home', false).screens[0])).toBe(false);
  });
  it('turns pins into the working parts and ideas into the content', () => {
    const p = site();
    const page = standardPage(p, p.screens[0]);
    expect(page.shape).toBe('page');
    expect(page.product).toBe('Field notes');
    expect(page.title).toBe('Home');
    expect(page.lede).toBe('Everything at a glance.');
    // The first way onward leads the page; the rest sit in the top bar.
    expect(page.primary).toMatchObject({
      pinId: 'p1',
      label: 'Open your conversations',
      to: 'Your conversations',
    });
    expect(page.nav.map((a) => a.pinId)).toEqual(['p2']);
    expect(page.nav[0].kind).toBe('nav');
    // A link pin leaves the app, so it sits in the footer with its address.
    expect(page.footer.map((a) => a.pinId)).toEqual(['p3']);
    expect(page.footer[0]).toMatchObject({ kind: 'link', url: 'https://example.com/handbook' });
    // An idea that never became a pin is content, not a button.
    expect(page.blocks).toEqual([
      {
        block: 'card',
        id: 'i1',
        title: 'Remaining, not used',
        body: 'Filled meters, on first open.',
        action: null,
      },
    ]);
  });
  it('makes a form of a sign-in, a dialog of a modal and a quiet end of a terminal', () => {
    const p = site();
    const form = standardPage(
      p,
      p.screens.find((s) => s.id === 'signin')!,
    );
    expect(form.shape).toBe('form');
    expect(form.blocks.filter((b) => b.block === 'field').map((b) => b.label)).toEqual([
      'Your email',
      'Password',
    ]);
    expect(form.blocks.find((b) => b.block === 'field' && b.label === 'Password')).toMatchObject({
      type: 'password',
    });
    expect(form.primary).toMatchObject({ pinId: 'p4', to: 'Home' });
    expect(
      standardPage(
        p,
        p.screens.find((s) => s.id === 'bye')!,
      ).shape,
    ).toBe('ending');
    const dialog = { ...p.screens[2], role: 'modal' as const };
    expect(standardPage(p, dialog).shape).toBe('dialog');
  });
  it('writes the same page into flow.md, so the builder builds what was walked', () => {
    const p = site();
    const outline = standardPageOutline(p, p.screens[0]);
    expect(outline[0]).toContain('Standard page (what Test flow shows): a standard page.');
    expect(outline.join('\n')).toContain(
      'Main action: “Open your conversations” → Your conversations',
    );
    expect(outline.join('\n')).toContain('In the top bar: “Settings” → Settings');
    expect(outline.join('\n')).toContain('Footer link: “Read the handbook”');
    const doc = flowDocument(p);
    expect(doc).toContain('Standard page (what Test flow shows)');
    // A drawn frame keeps its drawing and gets no built page.
    expect(flowDocument(setDrawing(p, 'home', 'web', 'a'))).not.toContain(
      'Standard page (what Test flow shows): a standard page.\n\n### Open your conversations',
    );
  });
  it('holds the one-way review back until a frame is drawn or left to the AI', () => {
    const p = site();
    const rules = (q: Project) => analyze(q).map((i) => i.id);
    // Every frame here is left to the AI, so its page is the specification and the check runs.
    expect(rules(p).some((id) => id.startsWith('one-way'))).toBe(true);
    // Take the post-it off: the frames are backlog again and the check waits.
    let plain = p;
    for (const s of p.screens) plain = leaveToAi(plain, s.id, false);
    expect(rules(plain).some((id) => id.startsWith('one-way'))).toBe(false);
    expect(rules(plain).some((id) => id.startsWith('needs-drawing'))).toBe(true);
  });
});
