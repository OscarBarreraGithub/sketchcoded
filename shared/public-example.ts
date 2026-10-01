import type { Project } from './model';
import { buildsItsOwnPage, standardPage } from './standard-page';
/** A publishable snapshot: authored content and the same standard pages Test flow renders. */
export function publicExample(p: Project) {
  return {
    name: p.name,
    screens: p.screens,
    pins: p.pins,
    transitions: p.transitions,
    assets: p.assets.map(({ source: _source, ...asset }) => asset),
    ideas: p.ideas.map(({ id, code, title, detail, screenId, pinId }) => ({
      id,
      code,
      title,
      detail,
      screenId,
      pinId,
    })),
    layout: p.layout,
    /** The view the author left the board on; the public example opens on it. */
    viewport: p.viewport,
    colorLabels: p.colorLabels,
    standardPages: Object.fromEntries(
      p.screens.filter(buildsItsOwnPage).map((s) => [s.id, standardPage(p, s)]),
    ),
  };
}
