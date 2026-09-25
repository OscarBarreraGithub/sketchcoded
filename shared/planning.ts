import { ideaStatus, isPlanned, plannedThreads, type Idea, type Project } from './model';

/**
 * A chat-friendly outline of the planning backlog: the same information the board shows as frames,
 * pins and yarn. `level` sets the top heading depth so the outline can nest inside another document.
 */
export function planningOutline(p: Project, level = 1): string {
  const h = (depth: number) => '#'.repeat(level + depth);
  const lines = [
    `${h(0)} Planning: ${p.name}`,
    '',
    'Legend: [x] placed as a pin · [ ] assigned to the screen, waiting for the drawing · ( ) not on a screen yet',
    '',
  ];
  const screenTitle = (screenId: string | null) =>
    p.screens.find((s) => s.id === screenId)?.title ?? 'a missing screen';
  const describe = (idea: Idea) => {
    const status = ideaStatus(idea);
    const box = status === 'placed' ? '[x]' : status === 'assigned' ? '[ ]' : '( )';
    const parts = [`- ${box} ${idea.title || 'Untitled idea'}`];
    if (idea.leadsTo) parts.push(`→ ${screenTitle(idea.leadsTo)}`);
    if (status === 'placed') {
      const pin = p.pins.find((pin) => pin.id === idea.pinId);
      const index = pin ? p.pins.filter((v) => v.screenId === pin.screenId).indexOf(pin) + 1 : 0;
      parts.push(`(pin ${index || '?'})`);
    }
    return [parts.join(' '), ...(idea.detail.trim() ? [`  ${idea.detail.trim()}`] : [])];
  };
  for (const screen of p.screens) {
    const ideas = p.ideas.filter((idea) => idea.screenId === screen.id);
    const flags = [
      screen.entry ? 'entry' : null,
      screen.role !== 'screen' ? screen.role : null,
      isPlanned(screen) ? 'no drawing yet' : null,
      screen.mobileAssetId ? 'web + mobile' : null,
    ].filter(Boolean);
    lines.push(
      `${h(1)} ${screen.title || 'Untitled screen'}${flags.length ? ` (${flags.join(' · ')})` : ''}`,
    );
    if (screen.purpose.trim()) lines.push(screen.purpose.trim());
    lines.push('');
    if (!ideas.length) lines.push('_No ideas assigned yet._', '');
    for (const idea of ideas) lines.push(...describe(idea));
    if (ideas.length) lines.push('');
  }
  const pool = p.ideas.filter((idea) => ideaStatus(idea) === 'pool');
  lines.push(`${h(1)} Not on a screen yet`, '');
  if (!pool.length) lines.push('_Every idea has a home._', '');
  for (const idea of pool) lines.push(...describe(idea));
  if (pool.length) lines.push('');
  const threads = plannedThreads(p);
  if (threads.length) {
    lines.push(`${h(1)} Planned threads`, '');
    for (const { idea, source, target } of threads)
      lines.push(`- ${source.title} → ${target.title} via “${idea.title}”`);
    lines.push('');
  }
  return lines.join('\n');
}
