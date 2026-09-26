import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  agentBrief,
  agentPrompt,
  briefUrl,
  contextSchema,
  defaultTask,
  describeSubject,
  skillIds,
  skills,
  viewIds,
  views,
} from '../shared/agent';
import { emptyProject, leaveToAi, newIdea, type Project } from '../shared/model';

const base = 'http://127.0.0.1:5173';
const asset = (id: string) => ({
  id,
  name: `${id}.png`,
  file: `${id.charAt(0).repeat(64)}.webp`,
  width: 100,
  height: 80,
  importedAt: 'now',
});
/** Home (drawn, one pin with yarn to Board), Board (drawn), Help (planned). */
function board(): Project {
  const p = emptyProject('Little app', 'little');
  p.assets = [asset('a'), asset('b')];
  p.screens = [
    { id: 'home', assetId: 'a', title: 'Home', purpose: 'Landing', entry: true, role: 'screen' },
    {
      id: 'board',
      assetId: 'b',
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
  p.pins = [
    {
      id: 'pin1',
      screenId: 'home',
      x: 0.5,
      y: 0.5,
      title: 'Open the board',
      description: 'Goes to the studio.',
    },
  ];
  p.transitions = [
    {
      id: 'yarn1',
      pinId: 'pin1',
      target: 'board',
      summary: 'Open',
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'push',
      color: 'red',
    },
  ];
  p.ideas = [
    newIdea({ title: 'Search', detail: 'Find a frame.', screenId: 'board' }, 'You', 'idea-search'),
    newIdea({ title: 'Shortcuts', screenId: 'help' }, 'You', 'idea-shortcuts'),
  ];
  return p;
}

describe('agent handoff: names, prompts and briefs', () => {
  it('every view has a label, a task and skills, and every skill has a document', async () => {
    const files = (await fs.readdir(path.resolve('docs/skills'))).sort();
    expect(files).toEqual([...skillIds].map((id) => `${id}.md`).sort());
    for (const id of skillIds) {
      const text = await fs.readFile(path.resolve('docs/skills', `${id}.md`), 'utf8');
      expect(text.startsWith(`# ${skills[id].title}`)).toBe(true);
    }
    for (const view of viewIds) {
      expect(views[view].label.length).toBeGreaterThan(0);
      expect(views[view].skills).toContain('talk-to-sketchcoded');
      expect(views[view].skills).toContain('read-a-board');
      expect(defaultTask(board(), { view }).length).toBeGreaterThan(20);
    }
  });
  it('names exactly what the user is looking at', () => {
    const p = board();
    expect(describeSubject(p, { view: 'board' }).text).toBe('the whole board');
    expect(describeSubject(p, { view: 'screen-editor', screen: 'home' }).text).toBe(
      'frame “Home” (home)',
    );
    expect(describeSubject(p, { view: 'screen-editor', screen: 'home', pin: 'pin1' }).text).toBe(
      'pin 1 “Open the board” on frame “Home” (home)',
    );
    expect(describeSubject(p, { view: 'connection-editor', transition: 'yarn1' }).text).toContain(
      'yarn “Open” (yarn1) from pin “Open the board” on “Home” to Board',
    );
    expect(describeSubject(p, { view: 'review' }).text).toMatch(/^\d+ open findings?$/);
    expect(describeSubject(p, { view: 'test-flow', screen: 'board', trail: ['yarn1'] }).text).toBe(
      'Test flow at “Board” after 1 step',
    );
    expect(describeSubject(p, { view: 'screen-editor', screen: 'ghost' }).text).toContain(
      'not on this board',
    );
  });
  it('writes a prompt with the view, the subject, the brief address, the skills and the task', () => {
    const p = board(),
      ctx = { view: 'screen-editor' as const, screen: 'home', pin: 'pin1', layout: 'web' as const };
    const prompt = agentPrompt(p, ctx, base);
    expect(prompt).toContain(
      'Sketchcoded task · Screen editor · pin 1 “Open the board” on frame “Home” (home)',
    );
    expect(prompt).toContain(
      `${base}/api/projects/little/brief?view=screen-editor&screen=home&pin=pin1&layout=web`,
    );
    expect(prompt).toContain('talk-to-sketchcoded, read-a-board, describe-pins, build-rules');
    expect(prompt).toContain(`${base}/api/checklist.md`);
    expect(prompt).toContain('Task: Describe this pin');
    expect(prompt).toContain('Stay on this pin');
    expect(briefUrl(p, { view: 'test-flow', screen: 'board', trail: ['a', 'b'] }, base)).toBe(
      `${base}/api/projects/little/brief?view=test-flow&screen=board&trail=a%2Cb`,
    );
  });
  it('parses the brief address back into a context', () => {
    expect(contextSchema.parse({ view: 'test-flow', screen: 'board', trail: 'a,b' })).toEqual({
      view: 'test-flow',
      screen: 'board',
      trail: ['a', 'b'],
    });
    expect(() => contextSchema.parse({ view: 'nowhere' })).toThrow();
  });
  it('briefs the screen editor with the frame, its pins, ideas, findings and drawings', () => {
    const p = board(),
      brief = agentBrief(p, { view: 'screen-editor', screen: 'board' }, base);
    expect(brief).toContain('# Sketchcoded task brief');
    expect(brief).toContain('Subject: frame “Board” (board)');
    expect(brief).toContain(`- Web drawing: ${base}/assets/${'b'.repeat(64)}.webp`);
    expect(brief).toContain('## Board');
    expect(brief).toContain('- [ ] Search (idea-search)');
    expect(brief).toContain('### Findings about this frame');
    expect(brief).toContain(`${base}/api/skills/describe-pins.md`);
    const planned = agentBrief(p, { view: 'screen-editor', screen: 'help' }, base);
    expect(planned).toContain('No drawing yet: this frame is planned');
    expect(planned).toContain('This frame has no drawing yet. Tell me what should be on it');
    const left = agentBrief(
      leaveToAi(p, 'help', true),
      { view: 'screen-editor', screen: 'help' },
      base,
    );
    expect(left).toContain('Leave it up to the AI');
    expect(left).toContain('Propose the standard page');
  });
  it('briefs the yarn, the plan, the outline, the review and the trail', () => {
    const p = board();
    const yarn = agentBrief(p, { view: 'connection-editor', transition: 'yarn1' }, base);
    expect(yarn).toContain('## The yarn');
    expect(yarn).toContain('- Navigation: push · Fallback: no · Color: red');
    const fresh = agentBrief(p, { view: 'connection-editor', pin: 'pin1' }, base);
    expect(fresh).toContain('A new yarn from pin 1 “Open the board” (pin1)');
    const plan = agentBrief(p, { view: 'plan' }, base);
    expect(plan).toContain('## The plan');
    expect(plan).toContain('### Help (modal · no drawing yet)');
    const outline = agentBrief(p, { view: 'outline' }, base);
    expect(outline).toContain('- Home (home) · entry · 1 pins · 1 yarn out');
    const review = agentBrief(p, { view: 'review' }, base);
    expect(review).toContain('## Findings');
    expect(review).toContain('fingerprint');
    const one = agentBrief(p, { view: 'review', finding: 'no-such:finding' }, base);
    expect(one).toContain('is no longer reported');
    const trail = agentBrief(
      p,
      { view: 'test-flow', screen: 'board', trail: ['yarn1', 'gone'] },
      base,
    );
    expect(trail).toContain('1. “Home” → pin “Open the board” → “Open” (push) → Board');
    expect(trail).toContain('2. Yarn gone is not on this board any more.');
    const whole = agentBrief(p, { view: 'board' }, base);
    expect(whole).toContain('## The board at a glance');
    expect(whole).toContain('- Help (help) · modal · planned, no drawing · 0 pins');
  });
});
