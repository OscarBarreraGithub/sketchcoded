import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { Store } from '../server/store';
import { createLittleChatIn } from './fixtures/little-chat';
import { analyze } from '../shared/graph';
import { flowDocument } from '../shared/flow-document';
import { planningOutline } from '../shared/planning';
import {
  assignIdea,
  emptyProject,
  ideaStatus,
  isLeftToAi,
  leaveToAi,
  linkIdea,
  newIdea,
  pinColor,
  pinUrl,
  placeIdea,
  placeOnMobile,
  plannedThreads,
  projectSchema,
  removePin,
  removeScreen,
  setDrawing,
  withCodes,
  type Project,
} from '../shared/model';
const asset = (id: string) => ({
  id,
  name: `${id}.png`,
  file: `${id.charAt(0).repeat(64)}.webp`,
  width: 100,
  height: 80,
  importedAt: 'now',
});
/** Home is drawn, Board is drawn with a mobile layout, Help is only planned. */
function plan(): Project {
  const p = emptyProject('Plan', 'plan');
  p.assets = [asset('a'), asset('b'), asset('c')];
  p.screens = [
    { id: 'home', assetId: 'a', title: 'Home', purpose: 'Landing', entry: true, role: 'screen' },
    {
      id: 'board',
      assetId: 'b',
      mobileAssetId: 'c',
      title: 'Board',
      purpose: 'The studio',
      entry: false,
      role: 'screen',
    },
    {
      id: 'help',
      assetId: null,
      title: 'Help',
      purpose: 'How it works',
      entry: false,
      role: 'modal',
    },
  ];
  p.layout = {
    home: { x: 0, y: 0, width: 300 },
    board: { x: 400, y: 0, width: 300 },
    help: { x: 800, y: 0, width: 300 },
  };
  p.ideas = [
    newIdea(
      {
        title: 'Open the studio',
        detail: 'Primary call to action',
        screenId: 'home',
        leadsTo: 'board',
      },
      'Agent',
      'open',
    ),
    newIdea({ title: 'How it works', screenId: 'home', leadsTo: 'help' }, 'Agent', 'how'),
    newIdea({ title: 'Undo', screenId: 'board' }, 'You', 'undo'),
    newIdea({ title: 'Dark mode' }, 'You', 'dark'),
  ];
  return withCodes(p);
}
const rules = (p: Project) => analyze(p).map((i) => i.rule);
describe('planning backlog', () => {
  it('reads version-1 projects without ideas or layouts and keeps them valid', () => {
    const { ideas, ...legacy } = emptyProject('Old', 'old');
    void ideas;
    const parsed = projectSchema.parse(legacy);
    expect(parsed.ideas).toEqual([]);
    const full = plan();
    expect(projectSchema.parse(full)).toEqual(full);
  });
  it('tracks whether an idea is in the pool, assigned, or placed', () => {
    const p = plan();
    expect(p.ideas.map(ideaStatus)).toEqual(['assigned', 'assigned', 'assigned', 'pool']);
    expect(plannedThreads(p).map((t) => `${t.source.id}>${t.target.id}`)).toEqual([
      'home>board',
      'home>help',
    ]);
  });
  it('places an idea as a pin with its text and ties the planned yarn', () => {
    const p = placeIdea(plan(), 'open', { x: 0.5, y: 0.8 }, { pin: 'pin1', transition: 't1' });
    const pin = p.pins.find((pin) => pin.id === 'pin1')!;
    expect(pin).toMatchObject({ screenId: 'home', x: 0.5, y: 0.8, title: 'Open the studio' });
    expect(pin.description).toBe('Primary call to action');
    expect(p.transitions).toEqual([
      expect.objectContaining({
        id: 't1',
        pinId: 'pin1',
        target: 'board',
        navigation: 'push',
        summary: 'Open the studio',
      }),
    ]);
    expect(ideaStatus(p.ideas.find((i) => i.id === 'open')!)).toBe('placed');
    expect(plannedThreads(p).map((t) => t.idea.id)).toEqual(['how']);
    // Dialog destinations open as dialogs; placing twice is a no-op.
    const dialog = placeIdea(p, 'how', { x: 0.1, y: 0.1 }, { pin: 'pin2', transition: 't2' });
    expect(dialog.transitions.at(-1)).toMatchObject({ target: 'help', navigation: 'modal' });
    expect(placeIdea(dialog, 'how', { x: 0.2, y: 0.2 })).toBe(dialog);
  });
  it('places on a frame without a drawing as a provisional pin, and refuses unassigned ideas', () => {
    let p = plan();
    p = assignIdea(p, 'dark', 'help');
    // The strings can be tied before the drawing: the pin takes a slot and waits to be placed.
    const early = placeIdea(p, 'dark', { x: 0.5, y: 0.5 }, { pin: 'pin-dark', transition: 't' });
    expect(early.pins.at(-1)).toMatchObject({
      id: 'pin-dark',
      screenId: 'help',
      x: 0.86,
      y: 0.12,
      provisional: true,
    });
    expect(early.ideas.find((i) => i.id === 'dark')?.pinId).toBe('pin-dark');
    expect(placeIdea(p, 'missing', { x: 0.5, y: 0.5 })).toBe(p);
    const pool = plan();
    expect(placeIdea(pool, 'dark', { x: 0.5, y: 0.5 })).toBe(pool);
  });
  it('moves ideas between screens and gives up the pin when a placed idea moves', () => {
    let p = placeIdea(plan(), 'open', { x: 0.5, y: 0.8 }, { pin: 'pin1', transition: 't1' });
    p = assignIdea(p, 'open', 'board');
    expect(p.pins).toEqual([]);
    expect(p.transitions).toEqual([]);
    expect(p.ideas.find((i) => i.id === 'open')).toMatchObject({ screenId: 'board', pinId: null });
    expect(assignIdea(p, 'open', 'nowhere')).toBe(p);
    expect(ideaStatus(assignIdea(p, 'open', null).ideas[0])).toBe('pool');
  });
  it('links an existing pin to an idea, one idea per pin', () => {
    let p = plan();
    p.pins = [
      { id: 'manual', screenId: 'board', x: 0.3, y: 0.3, title: 'Undo button', description: '' },
    ];
    p = linkIdea(p, 'dark', 'manual');
    expect(p.ideas.find((i) => i.id === 'dark')).toMatchObject({
      pinId: 'manual',
      screenId: 'board',
    });
    p = linkIdea(p, 'undo', 'manual');
    expect(p.ideas.find((i) => i.id === 'dark')?.pinId).toBeNull();
    expect(p.ideas.find((i) => i.id === 'undo')?.pinId).toBe('manual');
    expect(linkIdea(p, 'undo', 'ghost')).toBe(p);
  });
  it('unlinks ideas when pins or screens are removed', () => {
    let p = placeIdea(plan(), 'open', { x: 0.5, y: 0.8 }, { pin: 'pin1', transition: 't1' });
    expect(ideaStatus(removePin(p, 'pin1').ideas[0])).toBe('assigned');
    p = removeScreen(p, 'board');
    expect(p.ideas.find((i) => i.id === 'open')).toMatchObject({ pinId: 'pin1', leadsTo: null });
    expect(p.ideas.find((i) => i.id === 'undo')).toMatchObject({ screenId: null, pinId: null });
    p = removeScreen(p, 'home');
    expect(p.ideas.find((i) => i.id === 'open')).toMatchObject({ screenId: null, pinId: null });
    expect(analyze(p).filter((i) => i.severity === 'error')).toEqual([]);
  });
  it('writes a chat-friendly outline with status markers and planned threads', () => {
    const p = placeIdea(plan(), 'open', { x: 0.5, y: 0.8 }, { pin: 'pin1', transition: 't1' });
    const text = planningOutline(p);
    expect(text).toContain('## P1 Home (entry)');
    expect(text).toContain('- [x] Open the studio → Board (pin 1) [I1]');
    expect(text).toContain('  Primary call to action');
    expect(text).toContain('- [ ] How it works → Help');
    expect(text).toContain('## P3 Help (modal · no drawing yet)');
    expect(text).toContain('## P2 Board (web + mobile)');
    expect(text).toContain('- ( ) Dark mode');
    expect(text).toContain('- Home → Help via “How it works”');
    expect(planningOutline(p, 2)).toContain('### P1 Home (entry)');
  });
});
describe('web and mobile layouts', () => {
  it('keeps the web drawing while pins exist and clears mobile positions with the mobile drawing', () => {
    let p = placeIdea(plan(), 'undo', { x: 0.2, y: 0.2 }, { pin: 'pin1', transition: 't1' });
    expect(setDrawing(p, 'board', 'web', null)).toBe(p);
    p = placeOnMobile(p, 'pin1', { x: 0.9, y: 0.1 });
    expect(p.pins[0].mobile).toEqual({ x: 0.9, y: 0.1 });
    p = setDrawing(p, 'board', 'mobile', null);
    expect(p.screens[1].mobileAssetId).toBeNull();
    expect(p.pins[0].mobile).toBeNull();
    expect(setDrawing(p, 'board', 'mobile', 'ghost')).toBe(p);
    expect(setDrawing(p, 'help', 'web', 'c').screens[2].assetId).toBe('c');
  });
  it('reviews pins missing from the mobile layout and broken mobile references', () => {
    let p = placeIdea(plan(), 'undo', { x: 0.2, y: 0.2 }, { pin: 'pin1', transition: 't1' });
    expect(rules(p)).toContain('mobile-pin-missing');
    p = placeOnMobile(p, 'pin1', { x: 0.5, y: 0.5 });
    expect(rules(p)).not.toContain('mobile-pin-missing');
    p.screens[1].mobileAssetId = 'ghost';
    expect(analyze(p).find((i) => i.rule === 'missing-mobile-image')?.severity).toBe('error');
  });
});
describe('planned frames', () => {
  it('asks for a drawing instead of reporting dead ends or unreachable planned frames', () => {
    const p = plan();
    const found = rules(p);
    expect(found).toContain('needs-drawing');
    expect(
      analyze(p)
        .filter((i) => i.rule === 'dead-end')
        .map((i) => i.subjects[0]),
    ).not.toContain('help');
    expect(
      analyze(p)
        .filter((i) => i.rule === 'unreachable')
        .map((i) => i.subjects[0]),
    ).not.toContain('help');
    expect(analyze(p).filter((i) => i.severity === 'error')).toEqual([]);
    expect(rules(setDrawing(p, 'help', 'web', 'c'))).not.toContain('needs-drawing');
  });
  it('a frame left to the AI needs no drawing and says so everywhere the builder reads', () => {
    const p = leaveToAi(plan(), 'help', true);
    expect(projectSchema.parse(p).screens[2].leftToAi).toBe(true);
    expect(isLeftToAi(p.screens[2])).toBe(true);
    expect(rules(p)).not.toContain('needs-drawing');
    expect(analyze(p).filter((i) => i.severity === 'error')).toEqual([]);
    expect(flowDocument(p)).toContain('**Leave it up to the AI.**');
    expect(planningOutline(p)).toContain('# P3 Help (modal · left to the AI)');
    const back = leaveToAi(p, 'help', false);
    expect(back.screens[2].leftToAi).toBeUndefined();
    expect(rules(back)).toContain('needs-drawing');
    // Older files without the field still load.
    expect(
      projectSchema.parse(JSON.parse(JSON.stringify(plan()))).screens[2].leftToAi,
    ).toBeUndefined();
  });
  it('describes layouts, planned frames, and the backlog in the export document', () => {
    const p = placeIdea(plan(), 'undo', { x: 0.2, y: 0.2 }, { pin: 'pin1', transition: 't1' });
    const doc = flowDocument(p);
    expect(doc).toContain('Web drawing: [b.png](assets/');
    expect(doc).toContain('Mobile drawing: [c.png](assets/');
    expect(doc).toContain('Mobile coordinate: not placed yet');
    expect(doc).toContain('_No drawing yet.');
    expect(doc).toContain('Planned as idea: Undo (undo)');
    expect(doc).toContain('## Planning: Plan');
    expect(doc).toContain('### P3 Help (modal · no drawing yet)');
  });
});
// Building the Little chat board rasterizes its sketches, which takes a few seconds on slow runners.
describe('planning survives storage', { timeout: 30_000 }, () => {
  let root: string, store: Store;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'drawcode-plan-'));
    store = new Store(path.join(root, 'data'));
    await store.init();
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });
  it('saves, exports and imports ideas, planned frames and mobile layouts', async () => {
    let p = await createLittleChatIn(store);
    const home = p.screens[0];
    p.screens.push({
      id: 'planned',
      assetId: null,
      title: 'Settings',
      purpose: 'Planned only',
      entry: false,
      role: 'screen',
    });
    p.layout.planned = { x: 1500, y: 0, width: 300 };
    p.screens[1].mobileAssetId = p.assets[3].id;
    p.pins[1].mobile = { x: 0.4, y: 0.6 };
    p.ideas = [
      newIdea({ title: 'Sign out', screenId: 'planned', leadsTo: home.id }, 'You', 'signout'),
      newIdea(
        { title: 'Recent chats', screenId: p.screens[1].id, pinId: p.pins[1].id },
        'You',
        'recent',
      ),
    ];
    p = await store.save(p);
    const reloaded = await new Store(store.root).read(p.id);
    expect(reloaded.ideas).toEqual(p.ideas);
    expect(reloaded.screens[1].mobileAssetId).toBe(p.assets[3].id);
    const zip = await store.export(reloaded),
      files = unzipSync(zip);
    const saved = JSON.parse(strFromU8(files['project.json']));
    expect(saved.ideas).toHaveLength(2);
    expect(saved.screens.at(-1).assetId).toBeNull();
    expect(strFromU8(files['flow.md'])).toContain('- [ ] Sign out → A warm welcome');
    expect(strFromU8(files['BUILD-CHECKLIST.md'])).toContain('Nothing grows or shrinks');
    expect(Object.keys(files)).toContain('skills/describe-pins.md');
    expect(Object.keys(files)).toContain('skills/talk-to-sketchcoded.md');
    expect(strFromU8(files['READ-ME.md'])).toContain('BUILD-CHECKLIST.md');
    const imported = await store.importBundle(Buffer.from(zip));
    expect(imported.ideas).toEqual(p.ideas);
    expect(imported.pins[1].mobile).toEqual({ x: 0.4, y: 0.6 });
    expect(imported.screens.at(-1)).toMatchObject({ title: 'Settings', assetId: null });
  });
});
describe('link pins', () => {
  const link = (description: string) => ({
    id: 'gh',
    screenId: 'home',
    x: 0.5,
    y: 0.9,
    title: 'GitHub',
    description,
    kind: 'link' as const,
  });
  it('treats a link pin as an exit that needs no yarn', () => {
    const p = plan();
    p.pins = [link('Opens https://github.com/example/sketchcoded in a new tab.')];
    const found = rules(p);
    expect(found).not.toContain('unconnected-pin');
    expect(found).not.toContain('link-address');
    expect(
      analyze(p)
        .filter((i) => i.rule === 'dead-end')
        .map((i) => i.subjects[0]),
    ).not.toContain('home');
    expect(pinUrl(p.pins[0])).toBe('https://github.com/example/sketchcoded');
    expect(flowDocument(p)).toContain('External link: https://github.com/example/sketchcoded');
    expect(projectSchema.parse(p).pins[0].kind).toBe('link');
  });
  it('asks for an address and rejects yarn from a link pin', () => {
    const p = plan();
    p.pins = [link('Opens the repository.')];
    expect(rules(p)).toContain('link-address');
    p.transitions = [
      {
        id: 'bad',
        pinId: 'gh',
        target: 'board',
        summary: 'x',
        condition: '',
        logic: '',
        context: '',
        fallback: false,
        navigation: 'push',
        color: 'red',
      },
    ];
    expect(analyze(p).find((i) => i.rule === 'link-navigation')?.severity).toBe('error');
    expect(rules(p)).not.toContain('one-way');
  });
  it('places an idea that carries a web address as a link pin', () => {
    let p = plan();
    p.ideas.push(
      newIdea(
        { title: 'GitHub', detail: 'https://github.com/example/x', screenId: 'home' },
        'You',
        'gh',
      ),
    );
    p = placeIdea(p, 'gh', { x: 0.5, y: 0.9 }, { pin: 'pin-gh', transition: 't-gh' });
    expect(p.pins.at(-1)?.kind).toBe('link');
    expect(p.transitions).toEqual([]);
  });
});
describe('pin colors', () => {
  it('stores a color per pin and a meaning per color', () => {
    const p = plan();
    p.colorLabels = { gold: 'needs a decision' };
    p.pins = [
      {
        id: 'g',
        screenId: 'home',
        x: 0.1,
        y: 0.1,
        title: 'Toggle?',
        description: 'x',
        color: 'gold',
      },
    ];
    expect(projectSchema.parse(p)).toEqual(p);
    expect(pinColor(p.pins[0])).toBe('gold');
    expect(pinColor({ ...p.pins[0], color: undefined })).toBe('red');
  });
});
