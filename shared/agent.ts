import { z } from 'zod';
import { analyze, decisionFor, type Issue } from './graph';
import { screenSection } from './flow-document';
import { planningOutline } from './planning';
import {
  ideaStatus,
  isHistory,
  isLeftToAi,
  isPlanned,
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
};

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
const screenOf = (p: Project, id?: string) => p.screens.find((s) => s.id === id);
const pinOf = (p: Project, id?: string) => p.pins.find((v) => v.id === id);
const yarnOf = (p: Project, id?: string) => p.transitions.find((t) => t.id === id);
const destination = (p: Project, t: Transition) =>
  isHistory(t)
    ? t.navigation === 'back'
      ? 'the previous screen'
      : 'the dialog’s caller'
    : (screenOf(p, t.target ?? undefined)?.title ?? 'a missing screen');

/** The subject line: exactly what the user is looking at, in words. */
export function describeSubject(p: Project, ctx: AgentContext): { noun: string; text: string } {
  const screen = screenOf(p, ctx.screen),
    pin = pinOf(p, ctx.pin),
    yarn = yarnOf(p, ctx.transition),
    idea = p.ideas.find((i) => i.id === ctx.idea),
    finding = ctx.finding ? analyze(p).find((i) => i.id === ctx.finding) : undefined;
  if (ctx.view === 'connection-editor') {
    if (yarn) {
      const from = pinOf(p, yarn.pinId),
        source = screenOf(p, from?.screenId);
      return {
        noun: 'yarn',
        text: `yarn ${q(yarn.summary || 'unnamed')} (${yarn.id}) from pin ${q(from?.title || 'untitled')} on ${q(source?.title ?? '?')} to ${destination(p, yarn)}`,
      };
    }
    if (pin)
      return {
        noun: 'yarn',
        text: `a new yarn from pin ${pinNumber(p, pin)} ${q(pin.title || 'untitled')} on ${q(screenOf(p, pin.screenId)?.title ?? '?')}`,
      };
  }
  if (ctx.view === 'review') {
    if (finding) return { noun: 'finding', text: `finding ${q(finding.title)} (${finding.id})` };
    if (ctx.finding)
      return { noun: 'finding', text: `finding ${ctx.finding} (no longer reported)` };
    const open = analyze(p).filter((i) => decisionFor(i, p.reviews).status !== 'accepted');
    return {
      noun: 'review',
      text: `${open.length} open ${open.length === 1 ? 'finding' : 'findings'}`,
    };
  }
  if (ctx.view === 'test-flow' && screen) {
    const steps = ctx.trail?.length ?? 0;
    return {
      noun: 'trail',
      text: `Test flow at ${q(screen.title)} after ${steps} ${steps === 1 ? 'step' : 'steps'}`,
    };
  }
  if (idea) return { noun: 'idea', text: `idea ${q(idea.title)} (${idea.id})` };
  if (pin && screen)
    return {
      noun: 'pin',
      text: `pin ${pinNumber(p, pin)} ${q(pin.title || 'untitled')} on frame ${q(screen.title)} (${screen.id})${ctx.layout === 'mobile' ? ', mobile layout' : ''}`,
    };
  if (screen)
    return {
      noun: 'frame',
      text: `frame ${q(screen.title)} (${screen.id})${ctx.layout === 'mobile' ? ', mobile layout' : ''}`,
    };
  if (ctx.screen) return { noun: 'frame', text: `frame ${ctx.screen} (not on this board)` };
  if (ctx.view === 'plan') return { noun: 'plan', text: 'the whole plan' };
  if (ctx.view === 'outline') return { noun: 'outline', text: 'the whole outline' };
  return { noun: 'board', text: 'the whole board' };
}

/** The default job for each view. The user edits it before pasting if they want something else. */
export function defaultTask(p: Project, ctx: AgentContext): string {
  const screen = screenOf(p, ctx.screen),
    pin = pinOf(p, ctx.pin);
  switch (ctx.view) {
    case 'board':
      return 'Read the board and tell me, in a short list, what is drawn, what is planned, what is left to the AI, and what the open findings are. Then wait for my instruction.';
    case 'screen-editor':
      if (pin)
        return 'Describe this pin from the plan: a short title, what happens when it is used, and where it leads. Update it through the API and tell me to reload.';
      if (screen && isLeftToAi(screen))
        return 'This frame is left to the AI. Propose the standard page for it: sections, controls and the yarn in and out, from its purpose and ideas. Do not draw; write it as a list I can approve.';
      if (screen && isPlanned(screen))
        return 'This frame has no drawing yet. Tell me what should be on it from its ideas, so I can draw it. Do not place pins.';
      return 'Work on this frame only: write down what each pin does from the plan (title and description), tie the yarn it leads to, and update the board through the API. Tell me to reload when done.';
    case 'connection-editor':
      return 'Fill in this yarn: the short label, when it happens, the behavior, the data it needs, and whether it is the fallback. Keep the navigation kind as drawn. Update through the API.';
    case 'plan':
      return screen
        ? 'Answer: what should go on this frame? List its ideas, move any that belong elsewhere, and add what is missing. Update through the API.'
        : 'Organize the backlog: give every unassigned idea the frame it belongs on, set where it leads when that is clear, and flag duplicates. Update through the API.';
    case 'outline':
      return screen
        ? 'Check this screen in the outline: does it have a purpose, described pins and a way onward? Report gaps and propose the fix.'
        : 'Read the outline and check that every screen has a purpose and a way onward. Report the gaps as a short list.';
    case 'review':
      return ctx.finding
        ? 'Resolve this finding: fix the board through the API when it is a real gap, or propose the one-sentence reason to accept it.'
        : 'Go through the open findings: fix the real gaps on the board through the API, and for intentional one-way paths propose the reason to accept, one sentence each.';
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
export const checklistUrl = (base: string) => `${base}/api/checklist.md`;

/** The text that goes to the clipboard: where the user is, where the instructions are, the task. */
export function agentPrompt(p: Project, ctx: AgentContext, base: string): string {
  const view = views[ctx.view],
    subject = describeSubject(p, ctx);
  return [
    `Sketchcoded task · ${view.label} · ${subject.text} · board ${q(p.name)}`,
    `Sketchcoded is running at ${base}. Read before asking; everything you need is there:`,
    `1. The brief for exactly this task (read first): ${briefUrl(p, ctx, base)}`,
    `2. Skills to follow: ${view.skills.join(', ')} → ${base}/api/skills/<name>.md`,
    `3. The user’s rules, in their words: ${checklistUrl(base)}`,
    `Task: ${defaultTask(p, ctx)}`,
    `Stay on this ${subject.noun}; ask before touching anything else.`,
  ].join('\n');
}

const findingLines = (p: Project, issue: Issue) => {
  const decision = decisionFor(issue, p.reviews);
  return [
    `### ${issue.title}`,
    '',
    `${issue.severity.toUpperCase()} · ${decision.status.toUpperCase()} · id ${issue.id} · fingerprint ${issue.fingerprint}`,
    '',
    issue.detail,
    '',
    ...(decision.review
      ? [`Recorded reason (${decision.review.author}): ${decision.review.reason}`, '']
      : []),
  ];
};
const ideaLines = (p: Project, screen: Screen) => {
  const ideas = p.ideas.filter((i) => i.screenId === screen.id);
  if (!ideas.length) return ['_No ideas assigned to this frame._', ''];
  return [
    ...ideas.map((idea) => {
      const status = ideaStatus(idea),
        marker = status === 'placed' ? '[x]' : '[ ]',
        leads = idea.leadsTo ? ` → ${screenOf(p, idea.leadsTo)?.title ?? idea.leadsTo}` : '',
        detail = idea.detail.trim() ? `\n  ${idea.detail.trim()}` : '';
      return `- ${marker} ${idea.title} (${idea.id})${leads}${status === 'placed' ? ' · pinned' : ''}${detail}`;
    }),
    '',
  ];
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
    `- From: pin ${from ? pinNumber(p, from) : '?'} ${q(from?.title || 'untitled')} on ${q(source?.title ?? '?')} (${source?.id ?? '?'})`,
    `- To: ${destination(p, t)}${t.target ? ` (${t.target})` : ''}`,
    `- Navigation: ${t.navigation} · Fallback: ${t.fallback ? 'yes' : 'no'} · Color: ${t.color}`,
    `- Label: ${t.summary || '_none yet_'}`,
    `- When: ${t.condition || '_not written_'}`,
    `- Behavior: ${t.logic || '_not written_'}`,
    `- Data or information: ${t.context || '_not written_'}`,
    '',
  ];
};

/** The full Markdown brief served at `/api/projects/:id/brief`. Everything the agent needs for the task. */
export function agentBrief(p: Project, ctx: AgentContext, base: string): string {
  const view = views[ctx.view],
    subject = describeSubject(p, ctx),
    screen = screenOf(p, ctx.screen),
    pin = pinOf(p, ctx.pin),
    yarn = yarnOf(p, ctx.transition),
    issues = analyze(p);
  const lines: string[] = [
    '# Sketchcoded task brief',
    '',
    `Board: ${q(p.name)} (${p.id}) · View: ${view.label} · Subject: ${subject.text}`,
    '',
    `Sketchcoded runs at ${base}. Live data: GET ${base}/api/projects/${p.id} (the whole project, schemaVersion ${p.schemaVersion}). Whole documents: ${base}/api/projects/${p.id}/flow.md and ${base}/api/projects/${p.id}/outline.md. How to write back is in the skill talk-to-sketchcoded.`,
    '',
    '## The task',
    '',
    defaultTask(p, ctx),
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
  if (screen) {
    lines.push('## The frame', '', ...drawingLines(p, screen, base));
    if (pin)
      lines.push(
        `Selected pin: ${pinNumber(p, pin)} ${q(pin.title || 'untitled')} (${pin.id}) · kind ${pin.kind ?? 'interaction'} · color ${pin.color ?? 'red'} · web (${pin.x}, ${pin.y})${pin.mobile ? ` · mobile (${pin.mobile.x}, ${pin.mobile.y})` : ''}`,
        '',
      );
    lines.push(...screenSection(p, screen));
    lines.push('### Ideas for this frame', '', ...ideaLines(p, screen));
    const about = issues.filter((i) => i.subjects.includes(screen.id));
    lines.push('### Findings about this frame', '');
    if (!about.length) lines.push('_None._', '');
    for (const issue of about) lines.push(...findingLines(p, issue));
  }
  if (ctx.view === 'connection-editor') {
    lines.push('## The yarn', '');
    if (yarn) {
      lines.push(...yarnLines(p, yarn));
      const siblings = p.transitions.filter((t) => t.pinId === yarn.pinId && t.id !== yarn.id);
      if (siblings.length) {
        lines.push('### Other yarn from the same pin', '');
        for (const t of siblings) lines.push(...yarnLines(p, t));
      }
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
    lines.push(
      `## The ${ctx.view === 'plan' ? 'plan' : 'outline'}`,
      '',
      ...(ctx.view === 'outline'
        ? [
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
              return `- ${s.title} (${s.id})${flags.length ? ` · ${flags.join(' · ')}` : ''} · ${pins} pins · ${exits} yarn out`;
            }),
            '',
          ]
        : []),
      planningOutline(p, 2),
    );
  }
  if (ctx.view === 'review') {
    const finding = issues.find((i) => i.id === ctx.finding);
    lines.push('## Findings', '');
    if (ctx.finding && !finding)
      lines.push(
        `Finding ${ctx.finding} is no longer reported: the board changed or it was resolved.`,
        '',
      );
    const shown = finding
      ? [finding]
      : issues.filter((i) => decisionFor(i, p.reviews).status !== 'accepted');
    if (!shown.length) lines.push('_No open findings._', '');
    for (const issue of shown) lines.push(...findingLines(p, issue));
    if (!finding) {
      const accepted = issues.filter((i) => decisionFor(i, p.reviews).status === 'accepted');
      if (accepted.length) {
        lines.push('### Accepted, with reasons (decisions, not proofs)', '');
        for (const issue of accepted) lines.push(...findingLines(p, issue));
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
        `${i + 1}. ${q(source?.title ?? '?')} → pin ${q(from?.title || 'untitled')} → ${q(t.summary || 'unnamed')} (${t.navigation}) → ${destination(p, t)}`,
      );
    });
    if (ctx.trail?.length) lines.push('');
    lines.push(
      'Rewind in Test flow is a testing control, not app navigation. A way back must be drawn as yarn.',
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
        return `- ${s.title} (${s.id}) · ${s.role}${s.entry ? ' · entry' : ''} · ${state} · ${pins} pins`;
      }),
      '',
      `Open findings: ${issues.filter((i) => decisionFor(i, p.reviews).status !== 'accepted').length}. Ideas waiting: ${p.ideas.filter((i) => ideaStatus(i) !== 'placed').length}.`,
      '',
    );
  }
  return lines.join('\n');
}
