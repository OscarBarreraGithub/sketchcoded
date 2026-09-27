import {
  codeOf,
  isHistory,
  isLeftToAi,
  isPlanned,
  pinLabel,
  pinUrl,
  type Project,
  type Screen,
} from './model';
import { analyze, decisionFor } from './graph';
import { planningOutline } from './planning';
/** One screen's section of flow.md: drawings, purpose, every pin and its yarn. Also served alone
 * in the agent brief for that screen. */
export function screenSection(p: Project, screen: Screen): string[] {
  const lines: string[] = [];
  const asset = p.assets.find((a) => a.id === screen.assetId),
    mobile = p.assets.find((a) => a.id === screen.mobileAssetId);
  lines.push(
    `## ${codeOf(screen)} ${screen.title}`,
    '',
    `Screen ID: ${screen.id} · Type: ${screen.role} · Entry: ${screen.entry ? 'yes' : 'no'}`,
    '',
  );
  if (isLeftToAi(screen))
    lines.push(
      '**Leave it up to the AI.** This frame wears the post-it: build a standard, conventional page for it from its title, purpose, the ideas in the planning section and the yarn in and out. No drawing is expected; everything else on the board is built as drawn.',
      '',
    );
  else if (isPlanned(screen))
    lines.push(
      p.pins.some((pin) => pin.screenId === screen.id)
        ? '_No drawing yet. This frame is planned. Its pins below are provisional: their positions are placeholders until the drawing arrives and the user places them; their yarn is real._'
        : '_No drawing yet. This frame is planned; its intended interactions are listed in the planning backlog._',
      '',
    );
  if (asset)
    lines.push(
      `Web drawing: [${asset.name}](assets/${asset.file}) (${asset.width} × ${asset.height})`,
      '',
    );
  if (mobile)
    lines.push(
      `Mobile drawing: [${mobile.name}](assets/${mobile.file}) (${mobile.width} × ${mobile.height})`,
      '',
    );
  lines.push(screen.purpose || '_Screen purpose has not been described._', '');
  if (screen.role === 'detail')
    lines.push('This is an enlarged/supporting illustration, not a navigable app page.', '');
  const pins = p.pins.filter((pin) => pin.screenId === screen.id);
  if (!pins.length) lines.push('_No interaction pins._', '');
  for (const pin of pins) {
    const mobilePosition = screen.mobileAssetId
      ? ` · Mobile coordinate: ${pin.mobile ? `(${pin.mobile.x}, ${pin.mobile.y})` : 'not placed yet'}`
      : '';
    lines.push(
      `### ${pin.title || 'Unnamed interaction'}`,
      '',
      `${pinLabel(p, pin)} · Pin ID: ${pin.id} · Web coordinate: (${pin.x}, ${pin.y})${pin.provisional ? ' (provisional: not yet placed on the drawing)' : ''}${mobilePosition}, normalized from the top-left`,
      '',
      pin.description || '_Interaction intent is missing._',
      '',
    );
    const idea = p.ideas.find((idea) => idea.pinId === pin.id);
    if (idea) lines.push(`Planned as idea: ${idea.title} (${idea.id})`, '');
    if (pin.kind === 'link') {
      lines.push(
        `External link: ${pinUrl(pin) ?? 'address not written yet'}`,
        '',
        'This pin leaves the app for a web address. It has no yarn and no destination screen.',
        '',
      );
      continue;
    }
    if (pin.kind === 'detail') {
      lines.push(
        `Detail reference: ${p.screens.find((s) => s.id === pin.detailTarget)?.title ?? 'NOT ATTACHED'} (${pin.detailTarget ?? 'none'})`,
        '',
        'This pin shows a supporting sketch. It does not advance app navigation or satisfy a return path.',
        '',
      );
      continue;
    }
    const branches = p.transitions.filter((t) => t.pinId === pin.id);
    if (!branches.length)
      lines.push('_No outgoing connection. This interaction is unfinished._', '');
    for (const t of branches) {
      const target = isHistory(t)
        ? t.navigation === 'back'
          ? 'Actual previous screen in app history'
          : 'Actual caller of the current dialog'
        : `${codeOf(p.screens.find((s) => s.id === t.target))} ${p.screens.find((s) => s.id === t.target)?.title ?? 'MISSING SCREEN'} (${t.target})`;
      lines.push(
        `#### ${t.summary || 'Unnamed branch'} (${t.id})`,
        '',
        `- Navigation: ${t.navigation}`,
        `- Destination: ${target}`,
        `- Fallback: ${t.fallback ? 'yes' : 'no'}`,
        '',
        `When: ${t.condition || 'No condition specified.'}`,
        '',
        `Behavior: ${t.logic || 'No additional behavior specified.'}`,
        '',
        `Data or information: ${t.context || 'Not specified.'}`,
        '',
      );
    }
  }

  return lines;
}
// A companion reading order for humans and future agents; project.json remains authoritative.
export function flowDocument(p: Project): string {
  const lines = [
    `# ${p.name}`,
    '',
    'This is a screenshot-based app specification. Read project.json as the canonical graph; images are visual references. This document organizes the same intent by screen and interaction.',
    '',
    'Branch conditions are natural language, not executable predicates. Reachability describes possible structural paths, not a proof that every state is safe. Preview rewind is not app navigation.',
    '',
    'A screen may hold two drawings of the same view: a web layout and a mobile layout. Pins list a position on each. A frame without a drawing is planned but not yet drawn; its intended interactions are in the planning backlog at the end.',
    '',
    '## Entry points',
    '',
    ...p.screens
      .filter((s) => s.entry && s.role !== 'detail')
      .map((s) => `- ${codeOf(s)} ${s.title} (${s.id})`),
    '',
  ];
  for (const screen of p.screens) lines.push(...screenSection(p, screen));
  if (p.ideas.length)
    lines.push(
      planningOutline(p, 2),
      'Placed ideas became the pins above. Assigned ideas describe interactions the drawing should include. Pool ideas have no screen yet.',
      '',
    );
  lines.push(
    '## Flow review',
    '',
    'Accepted findings record a decision and its rationale. They are not proofs. A stale decision needs another review.',
    '',
  );
  for (const issue of analyze(p)) {
    const decision = decisionFor(issue, p.reviews);
    lines.push(
      `### ${issue.title}`,
      '',
      `${issue.severity.toUpperCase()} · ${decision.status.toUpperCase()} · ${issue.id}`,
      '',
      issue.detail,
      '',
    );
    if (decision.review)
      lines.push(`Recorded reason (${decision.review.author}): ${decision.review.reason}`, '');
  }
  return lines.join('\n');
}
