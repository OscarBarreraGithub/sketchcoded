import { isHistory, type Project } from './model';
import { analyze, decisionFor } from './graph';
// A companion reading order for humans and future agents; project.json remains authoritative.
export function flowDocument(p: Project): string {
  const lines = [
    `# ${p.name}`,
    '',
    'This is a screenshot-based app specification. Read project.json as the canonical graph; images are visual references. This document organizes the same intent by screen and interaction.',
    '',
    'Branch conditions are natural language, not executable predicates. Reachability describes possible structural paths, not a proof that every state is safe. Preview rewind is not app navigation.',
    '',
    '## Entry points',
    '',
    ...p.screens.filter((s) => s.entry && s.role !== 'detail').map((s) => `- ${s.title} (${s.id})`),
    '',
  ];
  for (const screen of p.screens) {
    const asset = p.assets.find((a) => a.id === screen.assetId);
    lines.push(
      `## ${screen.title}`,
      '',
      `Screen ID: ${screen.id} · Type: ${screen.role} · Entry: ${screen.entry ? 'yes' : 'no'}`,
      '',
    );
    if (asset)
      lines.push(
        `Visual reference: [${asset.name}](assets/${asset.file}) (${asset.width} × ${asset.height})`,
        '',
      );
    lines.push(screen.purpose || '_Screen purpose has not been described._', '');
    if (screen.role === 'detail')
      lines.push('This is an enlarged/supporting illustration, not a navigable app page.', '');
    const pins = p.pins.filter((pin) => pin.screenId === screen.id);
    if (!pins.length) lines.push('_No interaction pins._', '');
    for (const pin of pins) {
      lines.push(
        `### ${pin.title || 'Unnamed interaction'}`,
        '',
        `Pin ID: ${pin.id} · Image coordinate: (${pin.x}, ${pin.y}), normalized from the top-left`,
        '',
        pin.description || '_Interaction intent is missing._',
        '',
      );
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
          : `${p.screens.find((s) => s.id === t.target)?.title ?? 'MISSING SCREEN'} (${t.target})`;
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
  }
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
