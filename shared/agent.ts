import { z } from 'zod';
import { analyze, decisionFor, type Issue } from './graph';
import { screenSection } from './flow-document';
import { planningOutline } from './planning';
import {
  codeOf,
  ideaStatus,
  isHistory,
  isLeftToAi,
  isPlanned,
  type Idea,
  type Pin,
  type Project,
  type Screen,
  type Transition,
} from './model';

/*
 * Rule (2026-09-26): every view can hand its task to the agent. The names below are the contract:
 * a view id names where the user is, a context names exactly what they are looking at, a skill
 * names one instruction document the agent reads. The prompt and the brief are generated from
 * these, never hand-written, so every view says the same things the same way.
 */

export const viewIds = [
  'board',
  'screen-editor',
  'connection-editor',
  'plan',
  'outline',
  'review',
  'test-flow',
  'library',
  'boards',
] as const;
export type ViewId = (typeof viewIds)[number];

export const skillIds = [
  'talk-to-sketchcoded',
  'read-a-board',
  'build-rules',
  'describe-pins',
  'connect-screens',
  'plan-the-backlog',
  'resolve-findings',
  'walk-the-flow',
] as const;
export type SkillId = (typeof skillIds)[number];

/** Skills are Markdown files in `docs/skills/<id>.md`, served at `/api/skills/<id>.md`. */
export const skills: Record<SkillId, { title: string; summary: string }> = {
  'talk-to-sketchcoded': {
    title: 'Talk to Sketchcoded',
    summary: 'Read the live board and write back through the local API.',
  },
  'read-a-board': {
    title: 'Read a board',
    summary: 'What screens, pins, yarn, ideas and findings mean in project.json and flow.md.',
  },
  'build-rules': {
    title: 'Build rules',
    summary: 'The user’s layout and interaction rules for anything built from a board.',
  },
  'describe-pins': {
    title: 'Describe pins',
    summary: 'Write what each pin does, from the plan, and tie its yarn.',
  },
  'connect-screens': {
    title: 'Connect screens',
    summary: 'Yarn: navigation kinds, conditions, fallbacks and history.',
  },
  'plan-the-backlog': {
    title: 'Plan the backlog',
    summary: 'Ideas: assign, move, answer what belongs on a screen.',
  },
  'resolve-findings': {
    title: 'Resolve findings',
    summary: 'What each review rule means; fix the board or accept with a reason.',
  },
  'walk-the-flow': {
    title: 'Walk the flow',
    summary: 'Follow a Test flow trail and find the first missing step.',
  },
};

export const views: Record<ViewId, { label: string; skills: SkillId[] }> = {
  board: { label: 'Board', skills: ['talk-to-sketchcoded', 'read-a-board', 'build-rules'] },
  'screen-editor': {
    label: 'Screen editor',
    skills: ['talk-to-sketchcoded', 'read-a-board', 'describe-pins', 'build-rules'],
  },
  'connection-editor': {
    label: 'Connection editor',
    skills: ['talk-to-sketchcoded', 'read-a-board', 'connect-screens'],
  },
  plan: { label: 'Plan', skills: ['talk-to-sketchcoded', 'read-a-board', 'plan-the-backlog'] },
  outline: {
    label: 'App outline',
    skills: ['talk-to-sketchcoded', 'read-a-board', 'plan-the-backlog'],
  },
  review: {
    label: 'Review flow',
    skills: ['talk-to-sketchcoded', 'read-a-board', 'resolve-findings'],
  },
  'test-flow': {
    label: 'Test flow',
    skills: ['talk-to-sketchcoded', 'read-a-board', 'walk-the-flow'],
  },
  library: {
    label: 'Sketch library',
    skills: ['talk-to-sketchcoded', 'read-a-board', 'plan-the-backlog'],
  },
  boards: {
    label: 'Boards',
    skills: ['talk-to-sketchcoded', 'read-a-board', 'plan-the-backlog'],
  },
};
/** What the brief route can add that the project itself does not know. */
export type BriefExtras = { boards?: { id: string; name: string; screenCount: number }[] };

/** What the user is looking at. Ids refer to the project; unknown ids are reported, not thrown. */
export const contextSchema = z.object({
  view: z.enum(viewIds),
  screen: z.string().max(200).optional(),
  pin: z.string().max(200).optional(),
  layout: z.enum(['web', 'mobile']).optional(),
  transition: z.string().max(200).optional(),
  idea: z.string().max(200).optional(),
  finding: z.string().max(500).optional(),
  trail: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) =>
      value === undefined
        ? undefined
        : (Array.isArray(value) ? value : value.split(',')).filter(Boolean),
    ),
});
export type AgentContext = {
  view: ViewId;
  screen?: string;
  pin?: string;
  layout?: 'web' | 'mobile';
  transition?: string;
  idea?: string;
  finding?: string;
  trail?: string[];
};

const q = (text: string) => `“${text}”`;
const pinNumber = (p: Project, pin: Pin) =>
  p.pins.filter((v) => v.screenId === pin.screenId).indexOf(pin) + 1;
const screenOf = (p: Project, id?: string | null) => p.screens.find((s) => s.id === id);
const pinOf = (p: Project, id?: string | null) => p.pins.find((v) => v.id === id);
const yarnOf = (p: Project, id?: string) => p.transitions.find((t) => t.id === id);
const ideaOf = (p: Project, id?: string) => p.ideas.find((i) => i.id === id);
const destination = (p: Project, t: Transition) =>
  isHistory(t)
    ? t.navigation === 'back'
      ? 'the previous screen'
      : 'the dialog’s caller'
    : screenOf(p, t.target)
      ? `${codeOf(screenOf(p, t.target))} ${q(screenOf(p, t.target)!.title)}`
      : 'a missing screen';
const unusedAssets = (p: Project) =>
  p.assets.filter((a) => !p.screens.some((s) => s.assetId === a.id || s.mobileAssetId === a.id));
const openIssues = (p: Project, issues = analyze(p)) =>
  issues.filter((i) => decisionFor(i, p.reviews).status !== 'accepted');
/** Everything a finding can be about on one frame: the frame, its pins and their yarn. */
const idsOfFrame = (p: Project, screen: Screen) => {
  const pins = p.pins.filter((v) => v.screenId === screen.id).map((v) => v.id);
  const yarn = p.transitions.filter((t) => pins.includes(t.pinId)).map((t) => t.id);
  return new Set([screen.id, ...pins, ...yarn]);
};
const idsOfPin = (p: Project, pin: Pin) =>
  new Set([pin.id, ...p.transitions.filter((t) => t.pinId === pin.id).map((t) => t.id)]);

/** The subject line: exactly what the user is looking at, in words. */
export function describeSubject(p: Project, ctx: AgentContext): { noun: string; text: string } {
  const screen = screenOf(p, ctx.screen),
    pin = pinOf(p, ctx.pin),
    yarn = yarnOf(p, ctx.transition),
    idea = ideaOf(p, ctx.idea),
    finding = ctx.finding ? analyze(p).find((i) => i.id === ctx.finding) : undefined,
    mobile = ctx.layout === 'mobile' ? ', mobile layout' : '';
  if (ctx.view === 'boards')
    return { noun: 'board', text: 'a new board for another project on this computer' };
  if (ctx.view === 'library') {
    const unused = unusedAssets(p).length;
    return {
      noun: 'library',
      text: `the sketch library (${p.assets.length} ${p.assets.length === 1 ? 'sketch' : 'sketches'}, ${unused} unused)`,
    };
  }
  if (ctx.view === 'connection-editor') {
    if (yarn) {
      const from = pinOf(p, yarn.pinId),
        source = screenOf(p, from?.screenId);
      return {
        noun: 'yarn',
        text: `yarn ${q(yarn.summary || 'unnamed')} from ${codeOf(source)} pin ${from ? pinNumber(p, from) : '?'} ${q(from?.title || 'untitled')} to ${destination(p, yarn)} (${yarn.id})`,
      };
    }
    if (pin)
      return {
        noun: 'yarn',
        text: `a new yarn from ${codeOf(screenOf(p, pin.screenId))} pin ${pinNumber(p, pin)} ${q(pin.title || 'untitled')}`,
      };
    return { noun: 'yarn', text: 'a yarn that is no longer on this board' };
  }
  if (ctx.view === 'review') {
    if (finding) return { noun: 'finding', text: `finding ${q(finding.title)} (${finding.id})` };
    if (ctx.finding)
      return { noun: 'finding', text: `finding ${ctx.finding} (no longer reported)` };
    const open = openIssues(p).length;
    return { noun: 'review', text: `${open} open ${open === 1 ? 'finding' : 'findings'}` };
  }
  if (ctx.view === 'test-flow' && screen) {
    const steps = ctx.trail?.length ?? 0;
    return {
      noun: 'trail',
      text: `Test flow at ${codeOf(screen)} ${q(screen.title)} after ${steps} ${steps === 1 ? 'step' : 'steps'}${mobile}`,
    };
  }
  if (idea) {
    const home = screenOf(p, idea.screenId);
    const where = screen
      ? ` being placed on ${codeOf(screen)} ${q(screen.title)}`
      : home
        ? ` on ${codeOf(home)} ${q(home.title)}`
        : ', not on a frame yet';
    return { noun: 'idea', text: `${codeOf(idea)} ${q(idea.title)}${where} (${idea.id})` };
  }
  if (ctx.idea) return { noun: 'idea', text: `idea ${ctx.idea} (not on this board)` };
  if (pin && screen)
    return {
      noun: 'pin',
      text: `${codeOf(screen)} pin ${pinNumber(p, pin)} ${q(pin.title || 'untitled')} on ${q(screen.title)}${mobile} (${pin.id})`,
    };
  if (screen)
    return { noun: 'frame', text: `${codeOf(screen)} ${q(screen.title)}${mobile} (${screen.id})` };
  if (ctx.screen) return { noun: 'frame', text: `frame ${ctx.screen} (not on this board)` };
  if (ctx.view === 'plan') return { noun: 'plan', text: 'the whole plan' };
  if (ctx.view === 'outline') return { noun: 'outline', text: 'the whole outline' };
  return { noun: 'board', text: 'the whole board' };
}

/** The default job for each view, aware of the state of what is selected. The user edits it in
 * the dialog when they want something else. */
export function defaultTask(p: Project, ctx: AgentContext): string {
  const screen = screenOf(p, ctx.screen),
    pin = pinOf(p, ctx.pin),
    idea = ideaOf(p, ctx.idea);
  const write =
    'Update the board through the API, once, at the end, and tell me when to expect the refresh.';
  switch (ctx.view) {
    case 'board':
      return 'Read the board and tell me, in a short list, what is drawn, what is planned, what is left to the AI, and what the open findings are. Then wait for my instruction.';
    case 'boards':
      return `Create a new Sketchcoded board for the project I am working in, named after it: POST <base>/api/projects with {"name": "…"} and the header X-Drawcode-Client: local (the skill talk-to-sketchcoded has the details). Then read this project's code, or ask me for two lines about it, and write the first plan into that board: the screens the app needs as planned frames (assetId null, each with a layout position on the cork), the functionality as ideas on those frames, and where each idea leads. Do not draw anything. Finish by telling me the board's name so I can open it from the Boards menu and start drawing.`;
    case 'library':
      return 'For each unused sketch, tell me which frame it belongs to, from the plan and its file name; propose a planned frame when it fits none. Do not attach sketches yourself; I drop them on the board.';
    case 'screen-editor': {
      if (idea && screen)
        return `I am placing the idea ${q(idea.title)} as a pin on this frame. Once it is a pin, write its title and description from the idea and tie the yarn it leads to. ${write}`;
      if (pin) {
        const yarn = p.transitions.filter((t) => t.pinId === pin.id);
        const described = pin.description.trim().length > 0;
        if (pin.kind === 'link')
          return `This is a link pin. Confirm the address in its description and the condition for leaving the app; fix the wording if it is unclear. ${write}`;
        if (pin.kind === 'detail')
          return `This pin opens a closer look. Describe what the detail shows and why the user would open it, from the plan. ${write}`;
        if (!described)
          return `Describe this pin from the plan: a short title, what happens when it is used, and where it leads. Tie the yarn it leads to. ${write}`;
        if (!yarn.length)
          return `This pin is described but has no yarn. From the plan, propose where it leads and tie that yarn with its label and condition. ${write}`;
        return `Check this pin’s description and its ${yarn.length === 1 ? 'yarn' : `${yarn.length} yarns`} against the plan and the drawing; fix what is off, and flag what is ambiguous. ${write}`;
      }
      if (screen && screen.role === 'detail')
        return 'This is a detail sketch: a closer look, not an app page. Check the pins that reference it and describe what it shows, from the plan. Never make it a route.';
      if (screen && isLeftToAi(screen))
        return 'This frame is left to the AI. Propose the standard page for it: sections, controls and the yarn in and out, from its purpose and ideas. Do not draw; write it as a list I can approve.';
      if (screen && isPlanned(screen))
        return 'This frame has no drawing yet. Tell me what should be on it from its ideas, so I can draw it. Do not place pins.';
      return `Work on this frame only: write down what each pin does from the plan (title and description), tie the yarn it leads to, and list what is still open. ${write}`;
    }
    case 'connection-editor':
      return `Fill in this yarn: the short label, when it happens, the behavior, the data it needs, and whether it is the fallback. Keep the navigation kind as drawn. ${write}`;
    case 'plan':
      if (idea)
        return `Look at this idea: is it on the right frame, does it lead somewhere, does it overlap another idea? Tighten its title and detail and fix its frame or lead. ${write}`;
      return screen
        ? `Answer: what should go on this frame? List its ideas, move any that belong elsewhere, and add what is missing. ${write}`
        : `Organize the backlog: give every unassigned idea the frame it belongs on, set where it leads when that is clear, and flag duplicates. ${write}`;
    case 'outline':
      return screen
        ? 'Check this screen in the outline: does it have a purpose, described pins and a way onward? Report gaps and propose the fix.'
        : 'Read the outline and check that every screen has a purpose and a way onward. Report the gaps as a short list.';
    case 'review':
      return ctx.finding
        ? `Resolve this finding: fix the board when it is a real gap, or propose the one-sentence reason to accept it. ${write}`
        : `Go through the open findings: fix the real gaps on the board, and for intentional one-way paths propose the reason to accept, one sentence each. ${write}`;
    case 'test-flow':
      return 'Follow this trail in the specification and check that every step is drawn and connected. Report the first missing step and propose the yarn that would fix it.';
  }
}

const params = (ctx: AgentContext) => {
  const search = new URLSearchParams();
  search.set('view', ctx.view);
  for (const key of ['screen', 'pin', 'layout', 'transition', 'idea', 'finding'] as const)
    if (ctx[key]) search.set(key, ctx[key]!);
  if (ctx.trail?.length) search.set('trail', ctx.trail.join(','));
  return search.toString();
};
export const briefUrl = (p: Project, ctx: AgentContext, base: string) =>
  `${base}/api/projects/${p.id}/brief?${params(ctx)}`;
export const skillUrl = (base: string, skill: SkillId) => `${base}/api/skills/${skill}.md`;
export const skillsIndexUrl = (base: string) => `${base}/api/skills`;
export const checklistUrl = (base: string) => `${base}/api/checklist.md`;

/** The text that goes to the clipboard: where the user is, where the instructions are, the task. */
export function agentPrompt(
  p: Project,
  ctx: AgentContext,
  base: string,
  task: string = defaultTask(p, ctx),
): string {
  const view = views[ctx.view],
    subject = describeSubject(p, ctx);
  return [
    `Sketchcoded task · ${subject.text} · ${view.label} · board ${q(p.name)}`,
    `Sketchcoded is running at ${base}. Read before asking; everything you need is there:`,
    `1. The brief for exactly this task (read first): ${briefUrl(p, ctx, base)}`,
    `2. Skills to follow: ${view.skills.join(', ')} (each linked from ${skillsIndexUrl(base)})`,
    `3. The user’s rules, in their words: ${checklistUrl(base)}`,
    `Task: ${(task.trim() || defaultTask(p, ctx)).replace('<base>', base)}`,
    `Stay on this ${subject.noun}; ask before touching anything else.`,
  ].join('\n');
}

const findingLines = (p: Project, issue: Issue, level = 3) => {
  const decision = decisionFor(issue, p.reviews);
  return [
    `${'#'.repeat(level)} ${issue.title}`,
    '',
    `${issue.severity.toUpperCase()} · ${decision.status.toUpperCase()} · rule ${issue.rule} · id ${issue.id} · fingerprint ${issue.fingerprint} · about ${issue.subjects.join(', ') || 'the project'}`,
    '',
    issue.detail,
    '',
    ...(decision.review
      ? [`Recorded reason (${decision.review.author}): ${decision.review.reason}`, '']
      : []),
  ];
};
const ideaLine = (p: Project, idea: Idea) => {
  const status = ideaStatus(idea),
    marker = status === 'placed' ? '[x]' : '[ ]',
    leads = idea.leadsTo ? ` → ${screenOf(p, idea.leadsTo)?.title ?? idea.leadsTo}` : '',
    detail = idea.detail.trim() ? `\n  ${idea.detail.trim()}` : '';
  return `- ${marker} ${idea.title} (${idea.id})${leads}${status === 'placed' ? ' · pinned' : ''}${detail}`;
};
const ideaLines = (p: Project, screen: Screen) => {
  const ideas = p.ideas.filter((i) => i.screenId === screen.id);
  if (!ideas.length) return ['_No ideas assigned to this frame._', ''];
  return [...ideas.map((idea) => ideaLine(p, idea)), ''];
};
const drawingLines = (p: Project, screen: Screen, base: string) => {
  const web = p.assets.find((a) => a.id === screen.assetId),
    mobile = p.assets.find((a) => a.id === screen.mobileAssetId);
  const lines = [];
  if (web) lines.push(`- Web drawing: ${base}/assets/${web.file} (${web.width} × ${web.height})`);
  if (mobile)
    lines.push(
      `- Mobile drawing: ${base}/assets/${mobile.file} (${mobile.width} × ${mobile.height})`,
    );
  if (!web)
    lines.push(
      isLeftToAi(screen)
        ? '- No drawing: this frame wears the “Leave it up to the AI” post-it. Build a standard page.'
        : '- No drawing yet: this frame is planned. Do not build it; its ideas are the backlog.',
    );
  return [...lines, ''];
};
const yarnLines = (p: Project, t: Transition) => {
  const from = pinOf(p, t.pinId),
    source = screenOf(p, from?.screenId);
  return [
    `- Yarn id: ${t.id}`,
    `- From: ${codeOf(source)} pin ${from ? pinNumber(p, from) : '?'} ${q(from?.title || 'untitled')} (${source?.id ?? '?'}, ${from?.id ?? '?'})`,
    `- To: ${destination(p, t)}${t.target ? ` (${t.target})` : ''}`,
    `- Navigation: ${t.navigation} · Fallback: ${t.fallback ? 'yes' : 'no'} · Color: ${t.color}`,
    `- Label: ${t.summary || '_none yet_'}`,
    `- When: ${t.condition || '_not written_'}`,
    `- Behavior: ${t.logic || '_not written_'}`,
    `- Data or information: ${t.context || '_not written_'}`,
    '',
  ];
};
/** One frame, fully: drawings, the flow.md section (its own heading dropped), ideas, findings. */
const frameLines = (
  p: Project,
  screen: Screen,
  base: string,
  issues: Issue[],
  pin?: Pin,
): string[] => {
  const lines = [
    `## The frame: ${codeOf(screen)} ${screen.title} (${screen.id})`,
    '',
    ...drawingLines(p, screen, base),
  ];
  if (pin)
    lines.push(
      `Selected pin: ${codeOf(screen)} pin ${pinNumber(p, pin)} ${q(pin.title || 'untitled')} (${pin.id}) · kind ${pin.kind ?? 'interaction'} · color ${pin.color ?? 'red'} · web (${pin.x}, ${pin.y})${pin.mobile ? ` · mobile (${pin.mobile.x}, ${pin.mobile.y})` : ' · not placed on mobile'}`,
      '',
    );
  lines.push(...screenSection(p, screen).slice(2));
  lines.push('### Ideas for this frame', '', ...ideaLines(p, screen));
  const ids = idsOfFrame(p, screen);
  const about = issues.filter((i) => i.subjects.some((id) => ids.has(id)));
  if (pin) {
    const pinIds = idsOfPin(p, pin);
    const mine = about.filter((i) => i.subjects.some((id) => pinIds.has(id)));
    lines.push('### Findings about the selected pin', '');
    if (!mine.length) lines.push('_None._', '');
    for (const issue of mine) lines.push(...findingLines(p, issue, 4));
  }
  lines.push('### Findings about this frame, its pins and its yarn', '');
  if (!about.length) lines.push('_None._', '');
  for (const issue of about) lines.push(...findingLines(p, issue, 4));
  return lines;
};

/** The full Markdown brief served at `/api/projects/:id/brief`. Everything the agent needs for the task. */
export function agentBrief(
  p: Project,
  ctx: AgentContext,
  base: string,
  extras: BriefExtras = {},
): string {
  const view = views[ctx.view],
    subject = describeSubject(p, ctx),
    screen = screenOf(p, ctx.screen),
    pin = pinOf(p, ctx.pin),
    yarn = yarnOf(p, ctx.transition),
    idea = ideaOf(p, ctx.idea),
    issues = analyze(p);
  const lines: string[] = [
    '# Sketchcoded task brief',
    '',
    `Board: ${q(p.name)} (${p.id}) · View: ${view.label} · Subject: ${subject.text}`,
    '',
    `Sketchcoded runs at ${base}. Live data: GET ${base}/api/projects/${p.id} (the whole project, schemaVersion ${p.schemaVersion}). Whole documents: ${base}/api/projects/${p.id}/flow.md and ${base}/api/projects/${p.id}/outline.md. How to write back, and when to warn the user, is in the skill talk-to-sketchcoded.`,
    '',
    '## The task',
    '',
    defaultTask(p, ctx).replace('<base>', base),
    '',
    `Stay on this ${subject.noun}; ask before touching anything else.`,
    '',
    '## Skills to follow (read each)',
    '',
    ...view.skills.map(
      (id) => `- ${skills[id].title}: ${skills[id].summary} → ${skillUrl(base, id)}`,
    ),
    `- The user’s rules, dated, in their words (read first, they win): ${checklistUrl(base)}`,
    '',
  ];
  if (idea) {
    const home = screenOf(p, idea.screenId),
      leads = screenOf(p, idea.leadsTo),
      placed = pinOf(p, idea.pinId);
    lines.push(
      '## The idea',
      '',
      `- ${codeOf(idea)} ${q(idea.title)} (${idea.id}) · status ${ideaStatus(idea)} · by ${idea.author}`,
      `- Frame: ${home ? `${codeOf(home)} ${q(home.title)} (${home.id})` : 'not decided yet'}`,
      `- Leads to: ${leads ? `${codeOf(leads)} ${q(leads.title)} (${leads.id})` : idea.leadsTo ? `${idea.leadsTo} (missing)` : 'nowhere yet'}`,
      `- Pin: ${placed ? `pin ${pinNumber(p, placed)} ${q(placed.title || 'untitled')} (${placed.id})` : 'not placed yet'}`,
      '',
      idea.detail.trim() || '_No details written._',
      '',
    );
  }
  if (screen) lines.push(...frameLines(p, screen, base, issues, pin));
  if (ctx.view === 'connection-editor') {
    lines.push('## The yarn', '');
    if (yarn) {
      lines.push(...yarnLines(p, yarn));
      const siblings = p.transitions.filter((t) => t.pinId === yarn.pinId && t.id !== yarn.id);
      if (siblings.length) {
        lines.push('### Other yarn from the same pin', '');
        for (const t of siblings) lines.push(...yarnLines(p, t));
      }
      const from = pinOf(p, yarn.pinId),
        source = screenOf(p, from?.screenId),
        target = screenOf(p, yarn.target);
      if (!screen && source) lines.push(...frameLines(p, source, base, issues, from));
      if (target)
        lines.push(
          `## Where it goes: ${codeOf(target)} ${target.title} (${target.id})`,
          '',
          ...drawingLines(p, target, base),
          target.purpose || '_Screen purpose has not been described._',
          '',
        );
    } else if (pin) {
      lines.push(
        `A new yarn from pin ${pinNumber(p, pin)} ${q(pin.title || 'untitled')} (${pin.id}). Existing yarn from this pin:`,
        '',
      );
      const existing = p.transitions.filter((t) => t.pinId === pin.id);
      if (!existing.length) lines.push('_None yet._', '');
      for (const t of existing) lines.push(...yarnLines(p, t));
    } else lines.push('_The yarn is not on this board any more._', '');
  }
  if (ctx.view === 'plan' || ctx.view === 'outline') {
    lines.push(`## The ${ctx.view === 'plan' ? 'plan' : 'outline'}`, '');
    if (ctx.view === 'outline')
      lines.push(
        ...p.screens.map((s) => {
          const pins = p.pins.filter((v) => v.screenId === s.id).length,
            exits = p.transitions.filter((t) =>
              p.pins.some((v) => v.id === t.pinId && v.screenId === s.id),
            ).length,
            flags = [
              s.entry ? 'entry' : null,
              s.role !== 'screen' ? s.role : null,
              isLeftToAi(s) ? 'left to the AI' : isPlanned(s) ? 'no drawing yet' : null,
            ].filter(Boolean);
          return `- ${codeOf(s)} ${s.title} (${s.id})${flags.length ? ` · ${flags.join(' · ')}` : ''} · ${pins} pins · ${exits} yarn out`;
        }),
        '',
      );
    lines.push(planningOutline(p, 3));
  }
  if (ctx.view === 'review') {
    const finding = issues.find((i) => i.id === ctx.finding);
    lines.push('## Findings', '');
    if (ctx.finding && !finding)
      lines.push(
        `Finding ${ctx.finding} is no longer reported: the board changed or it was resolved.`,
        '',
      );
    const shown = finding ? [finding] : openIssues(p, issues);
    if (!shown.length) lines.push('_No open findings._', '');
    for (const issue of shown) lines.push(...findingLines(p, issue));
    if (finding) {
      // What the finding is about, so the brief stands on its own.
      const frames = new Set<Screen>();
      for (const id of finding.subjects) {
        const s = screenOf(p, id),
          v = pinOf(p, id),
          t = yarnOf(p, id);
        if (s) frames.add(s);
        else if (v) {
          const home = screenOf(p, v.screenId);
          if (home) frames.add(home);
        } else if (t) {
          lines.push('### The yarn in question', '', ...yarnLines(p, t));
          const home = screenOf(p, pinOf(p, t.pinId)?.screenId);
          if (home) frames.add(home);
        }
      }
      for (const s of frames) lines.push(...frameLines(p, s, base, issues));
    } else {
      const accepted = issues.filter((i) => decisionFor(i, p.reviews).status === 'accepted');
      if (accepted.length) {
        lines.push('### Accepted, with reasons (decisions, not proofs)', '');
        for (const issue of accepted) lines.push(...findingLines(p, issue, 4));
      }
    }
  }
  if (ctx.view === 'test-flow') {
    lines.push('## The trail', '');
    if (!ctx.trail?.length) lines.push('_At the starting screen; no steps taken yet._', '');
    ctx.trail?.forEach((id, i) => {
      const t = yarnOf(p, id);
      if (!t) {
        lines.push(`${i + 1}. Yarn ${id} is not on this board any more.`);
        return;
      }
      const from = pinOf(p, t.pinId),
        source = screenOf(p, from?.screenId);
      lines.push(
        `${i + 1}. ${codeOf(source)} ${q(source?.title ?? '?')} → pin ${from ? pinNumber(p, from) : '?'} ${q(from?.title || 'untitled')} → ${q(t.summary || 'unnamed')} (${t.navigation}) → ${destination(p, t)}`,
      );
    });
    if (ctx.trail?.length) lines.push('');
    lines.push(
      'Rewind in Test flow is a testing control, not app navigation. A way back must be drawn as yarn.',
      '',
    );
  }
  if (ctx.view === 'library') {
    lines.push('## The library', '');
    for (const a of p.assets) {
      const uses = p.screens
        .filter((s) => s.assetId === a.id || s.mobileAssetId === a.id)
        .map((s) => `${codeOf(s)} ${q(s.title)} (${s.assetId === a.id ? 'web' : 'mobile'})`);
      lines.push(
        `- ${codeOf(a)} ${a.name} (${a.id}) · ${a.width} × ${a.height} · ${base}/assets/${a.file} · ${uses.length ? `used on ${uses.join(', ')}` : 'unused'}`,
      );
    }
    if (!p.assets.length) lines.push('_No sketches yet._');
    lines.push('', '### Frames still waiting for a drawing', '');
    const waiting = p.screens.filter((s) => isPlanned(s) && !isLeftToAi(s));
    if (!waiting.length) lines.push('_None._');
    for (const s of waiting)
      lines.push(
        `- ${codeOf(s)} ${q(s.title)} (${s.id}) · ${p.ideas.filter((i) => i.screenId === s.id).length} ideas planned`,
      );
    lines.push('');
  }
  if (ctx.view === 'boards') {
    lines.push(
      '## Boards on this computer',
      '',
      ...(extras.boards ?? [{ id: p.id, name: p.name, screenCount: p.screens.length }]).map(
        (b) =>
          `- ${q(b.name)} (${b.id}) · ${b.screenCount} screens${b.id === p.id ? ' · open now' : ''}`,
      ),
      '',
      '## How to create and fill a board',
      '',
      `1. POST ${base}/api/projects with header X-Drawcode-Client: local and body {"name": "<project name>"}; the answer is the new board (note its id).`,
      `2. GET ${base}/api/projects/<id>, add planned frames (screens with assetId null and a layout entry {x, y, width}) and ideas (screenId, leadsTo), then PUT the whole project back once. Codes are assigned by the server.`,
      '3. Do not add pins or yarn: the user draws first, then places pins. Tell the user the board’s name.',
      '',
    );
  }
  if (ctx.view === 'board') {
    lines.push(
      '## The board at a glance',
      '',
      ...p.screens.map((s) => {
        const state = isLeftToAi(s)
          ? 'left to the AI'
          : isPlanned(s)
            ? 'planned, no drawing'
            : 'drawn';
        const pins = p.pins.filter((v) => v.screenId === s.id).length;
        return `- ${codeOf(s)} ${s.title} (${s.id}) · ${s.role}${s.entry ? ' · entry' : ''} · ${state} · ${pins} pins`;
      }),
      '',
      `Open findings: ${openIssues(p, issues).length}. Ideas waiting: ${p.ideas.filter((i) => ideaStatus(i) !== 'placed').length}. Unused sketches: ${unusedAssets(p).length}.`,
      '',
    );
  }
  return lines.join('\n');
}
