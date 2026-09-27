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
import { emptyProject, leaveToAi, newIdea, withCodes, type Project } from '../shared/model';

const base = 'http://127.0.0.1:5173';
const asset = (id: string) => ({
  id,
  name: `${id}.png`,
  file: `${id.charAt(0).repeat(64)}.webp`,
  width: 100,
  height: 80,
  importedAt: 'now',
});
/** Home (drawn; pin 1 with yarn to Board, pin 2 described but unconnected, pin 3 a link),
 * Board (drawn), Help (planned), Closer (a detail sketch), and one unused sketch. */
function board(): Project {
  const p = emptyProject('Little app', 'little');
  p.assets = [asset('a'), asset('b'), asset('c'), asset('d')];
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
    {
      id: 'closer',
      assetId: 'c',
      title: 'Closer',
      purpose: 'A zoom',
      entry: false,
      role: 'detail',
    },
  ];
  p.layout = {
    home: { x: 0, y: 0, width: 300 },
    board: { x: 400, y: 0, width: 300 },
    help: { x: 800, y: 0, width: 300 },
    closer: { x: 1200, y: 0, width: 300 },
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
    {
      id: 'pin2',
      screenId: 'home',
      x: 0.2,
      y: 0.8,
      title: 'Settings',
      description: 'Opens the settings.',
    },
    {
      id: 'pin3',
      screenId: 'home',
      x: 0.8,
      y: 0.8,
      kind: 'link',
      title: 'GitHub',
      description: 'Opens https://example.com/repo',
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
  return withCodes(p);
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
      'F1 “Home” (home)',
    );
    expect(
      describeSubject(p, { view: 'screen-editor', screen: 'home', layout: 'mobile' }).text,
    ).toBe('F1 “Home”, mobile layout (home)');
    expect(describeSubject(p, { view: 'screen-editor', screen: 'home', pin: 'pin1' }).text).toBe(
      'F1 pin 1 “Open the board” on “Home” (pin1)',
    );
    expect(describeSubject(p, { view: 'connection-editor', transition: 'yarn1' }).text).toContain(
      'yarn “Open” from F1 pin 1 “Open the board” to F2 “Board” (yarn1)',
    );
    expect(describeSubject(p, { view: 'connection-editor' }).text).toBe(
      'a yarn that is no longer on this board',
    );
    expect(describeSubject(p, { view: 'review' }).text).toMatch(/^\d+ open findings?$/);
    expect(describeSubject(p, { view: 'test-flow', screen: 'board', trail: ['yarn1'] }).text).toBe(
      'Test flow at F2 “Board” after 1 step',
    );
    expect(describeSubject(p, { view: 'plan', idea: 'idea-search' }).text).toBe(
      'I1 “Search” on F2 “Board” (idea-search)',
    );
    expect(
      describeSubject(p, { view: 'screen-editor', screen: 'board', idea: 'idea-search' }).text,
    ).toBe('I1 “Search” being placed on F2 “Board” (idea-search)');
    expect(describeSubject(p, { view: 'library' }).text).toBe(
      'the sketch library (4 sketches, 1 unused)',
    );
    expect(describeSubject(p, { view: 'boards' }).text).toBe(
      'a new board for another project on this computer · frames and strings',
    );
    expect(describeSubject(p, { view: 'screen-editor', screen: 'ghost' }).text).toContain(
      'not on this board',
    );
  });
  it('gives each subject a task that fits its state', () => {
    const p = board();
    expect(defaultTask(p, { view: 'screen-editor', screen: 'home', pin: 'pin1' })).toContain(
      'Check this pin’s description and its yarn',
    );
    expect(defaultTask(p, { view: 'screen-editor', screen: 'home', pin: 'pin2' })).toContain(
      'described but has no yarn',
    );
    expect(defaultTask(p, { view: 'screen-editor', screen: 'home', pin: 'pin3' })).toContain(
      'link pin',
    );
    expect(defaultTask(p, { view: 'screen-editor', screen: 'closer' })).toContain('detail sketch');
    expect(defaultTask(p, { view: 'screen-editor', screen: 'help' })).toContain('no drawing yet');
    expect(
      defaultTask(leaveToAi(p, 'help', true), { view: 'screen-editor', screen: 'help' }),
    ).toContain('left to the AI');
    expect(
      defaultTask(p, { view: 'screen-editor', screen: 'board', idea: 'idea-search' }),
    ).toContain('I am placing the idea “Search”');
    expect(defaultTask(p, { view: 'plan', idea: 'idea-search' })).toContain('Look at this idea');
    expect(defaultTask(p, { view: 'library' })).toContain('unused sketch');
    expect(defaultTask(p, { view: 'boards' })).toContain('POST <base>/api/projects');
    expect(agentBrief(p, { view: 'boards' }, base)).toContain(`POST ${base}/api/projects`);
    expect(agentBrief(p, { view: 'boards' }, base)).not.toContain('<base>');
  });
  it('writes a new or empty board at one of three levels', () => {
    const p = board();
    expect(briefUrl(p, { view: 'boards' }, base)).toBe(`${base}/api/brief?view=boards&mode=frames`);
    expect(briefUrl(p, { view: 'boards', mode: 'list' }, base)).toBe(
      `${base}/api/brief?view=boards&mode=list`,
    );
    expect(describeSubject(p, { view: 'boards', mode: 'built' }).text).toContain('built out');
    expect(defaultTask(p, { view: 'boards', mode: 'list' })).toContain('screenId null');
    expect(defaultTask(p, { view: 'boards', mode: 'list' })).toContain(
      'No frames, no pins, no yarn',
    );
    expect(defaultTask(p, { view: 'boards', mode: 'frames' })).toContain('provisional: true');
    expect(defaultTask(p, { view: 'boards', mode: 'built' })).toContain('leftToAi: true');
    expect(defaultTask(p, { view: 'boards' })).toContain('start-a-board');
    const brief = agentBrief(p, { view: 'boards', mode: 'built' }, base);
    expect(brief).toContain('Build: Built out');
    expect(brief).toContain('## How to create and fill a board · Built out');
    expect(brief).toContain('5. Strings: for every idea with a leadsTo');
    expect(brief).toContain('6. Then set leftToAi: true on every screen');
    expect(brief).toContain(`${base}/api/skills/start-a-board.md`);
    const list = agentBrief(p, { view: 'boards', mode: 'list' }, base);
    expect(list).toContain('3. Ideas only');
    expect(list).not.toContain('Strings:');
    // An empty board takes the same levels.
    const empty = emptyProject('Blank', 'blank');
    expect(defaultTask(empty, { view: 'board', mode: 'built' })).toContain('leftToAi: true');
    expect(briefUrl(empty, { view: 'board', mode: 'list' }, base)).toContain('&mode=list');
    expect(agentBrief(empty, { view: 'board', mode: 'list' }, base)).toContain(
      'Build: Just the list',
    );
    expect(() => contextSchema.parse({ view: 'boards', mode: 'everything' })).toThrow();
    expect(contextSchema.parse({ view: 'boards', mode: 'built' }).mode).toBe('built');
  });
  it('writes a prompt with the view, the subject, the brief address, the skills and the task', () => {
    const p = board(),
      ctx = { view: 'screen-editor' as const, screen: 'home', pin: 'pin1', layout: 'web' as const };
    const prompt = agentPrompt(p, ctx, base);
    // Three lines: where the user is, where the brief is, and that what follows is the task.
    expect(prompt.split('\n')).toHaveLength(3);
    expect(prompt).toContain(
      'Sketchcoded task · F1 pin 1 “Open the board” on “Home” (pin1) · Screen editor · board “Little app”',
    );
    expect(prompt).toContain(
      `${base}/api/projects/little/brief?view=screen-editor&screen=home&pin=pin1&layout=web`,
    );
    expect(prompt).toContain('Anything I add below this line is part of the task.');
    // The brief carries what the prompt no longer repeats: the task, the skills and the rules.
    const brief = agentBrief(p, ctx, base);
    expect(brief).toContain('## The task');
    expect(brief).toContain('Check this pin');
    expect(brief).toContain('Stay on this pin');
    expect(brief).toContain(
      'Anything the user typed under the prompt they pasted is part of the task too.',
    );
    expect(brief).toContain(`${base}/api/skills/describe-pins.md`);
    expect(brief).toContain(`${base}/api/skills/build-rules.md`);
    expect(brief).toContain(`${base}/api/checklist.md`);
    expect(brief).not.toContain('<name>');
    expect(brief).not.toContain('<base>');
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
  it('briefs the screen editor with the frame, its pins, ideas, drawings and every finding about them', () => {
    const p = board(),
      brief = agentBrief(p, { view: 'screen-editor', screen: 'home', pin: 'pin2' }, base);
    expect(brief).toContain('# Sketchcoded task brief');
    expect(brief).toContain('Subject: F1 pin 2 “Settings” on “Home” (pin2)');
    expect(brief).toContain('## The frame: F1 Home (home)');
    expect(brief).not.toContain('\n## Home\n');
    expect(brief).toContain(`- Web drawing: ${base}/assets/${'a'.repeat(64)}.webp`);
    expect(brief).toContain('Selected pin: F1 pin 2 “Settings” (pin2)');
    expect(brief).toContain('### Findings about the selected pin');
    expect(brief).toContain('rule unconnected-pin');
    expect(brief).toContain('### Findings about this frame, its pins and its yarn');
    // The pin-level finding sits under the frame heading, not only under the pin.
    const framePart = brief.slice(brief.indexOf('### Findings about this frame'));
    expect(framePart).toContain('unconnected-pin:pin2');
    expect(brief).toContain(`${base}/api/skills/describe-pins.md`);
    const ideas = agentBrief(p, { view: 'screen-editor', screen: 'board' }, base);
    expect(ideas).toContain('- [ ] Search (idea-search)');
    const planned = agentBrief(p, { view: 'screen-editor', screen: 'help' }, base);
    expect(planned).toContain('No drawing yet: this frame is planned');
    const left = agentBrief(
      leaveToAi(p, 'help', true),
      { view: 'screen-editor', screen: 'help' },
      base,
    );
    expect(left).toContain('Leave it up to the AI');
    expect(left).toContain('Propose the standard page');
    const placing = agentBrief(
      p,
      { view: 'screen-editor', screen: 'board', idea: 'idea-search' },
      base,
    );
    expect(placing).toContain('## The idea');
    expect(placing).toContain('- Frame: F2 “Board” (board)');
  });
  it('briefs the yarn, the plan, the outline, the review, the trail and the library', () => {
    const p = board();
    const yarn = agentBrief(p, { view: 'connection-editor', transition: 'yarn1' }, base);
    expect(yarn).toContain('## The yarn');
    expect(yarn).toContain('- Navigation: push · Fallback: no · Color: red');
    expect(yarn).toContain('## The frame: F1 Home (home)');
    expect(yarn).toContain('## Where it goes: F2 Board (board)');
    const fresh = agentBrief(p, { view: 'connection-editor', pin: 'pin1' }, base);
    expect(fresh).toContain('A new yarn from pin 1 “Open the board” (pin1)');
    const plan = agentBrief(p, { view: 'plan' }, base);
    expect(plan).toContain('## The plan');
    expect(plan).toContain('#### F3 Help (modal · no drawing yet)');
    const outline = agentBrief(p, { view: 'outline' }, base);
    expect(outline).toContain('- F1 Home (home) · entry · 3 pins · 1 yarn out');
    const review = agentBrief(p, { view: 'review' }, base);
    expect(review).toContain('## Findings');
    expect(review).toContain('fingerprint');
    const one = agentBrief(p, { view: 'review', finding: 'unconnected-pin:pin2' }, base);
    expect(one).toContain('Subject: finding “');
    expect(one).toContain('## The frame: F1 Home (home)');
    const gone = agentBrief(p, { view: 'review', finding: 'no-such:finding' }, base);
    expect(gone).toContain('is no longer reported');
    const trail = agentBrief(
      p,
      { view: 'test-flow', screen: 'board', trail: ['yarn1', 'gone'] },
      base,
    );
    expect(trail).toContain('1. F1 “Home” → pin 1 “Open the board” → “Open” (push) → F2 “Board”');
    expect(trail).toContain('2. Yarn gone is not on this board any more.');
    const library = agentBrief(p, { view: 'library' }, base);
    expect(library).toContain('## The library');
    expect(library).toContain('- S4 d.png (d) · 100 × 80');
    expect(library).toContain('unused');
    expect(library).toContain('- F3 “Help” (help) · 1 ideas planned');
    const boards = agentBrief(p, { view: 'boards' }, base, {
      boards: [
        { id: 'little', name: 'Little app', screenCount: 4 },
        { id: 'other', name: 'Other', screenCount: 0 },
      ],
    });
    expect(boards).toContain('## Boards on this computer');
    expect(boards).toContain('- “Little app” (little) · 4 screens · open now');
    expect(boards).toContain('- “Other” (other) · 0 screens');
    expect(boards).toContain(`1. POST ${base}/api/projects`);
    expect(boards).not.toContain('<base>');
    const whole = agentBrief(p, { view: 'board' }, base);
    expect(whole).toContain('## The board at a glance');
    expect(whole).toContain('- F3 Help (help) · modal · planned, no drawing · 0 pins');
    expect(whole).toContain('Unused sketches: 1.');
  });
});
