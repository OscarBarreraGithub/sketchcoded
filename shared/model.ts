import { z } from 'zod';

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const prose = z.string().max(30000);
const point = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });
export const assetSchema = z.object({
  id,
  name: z.string().max(500),
  file: z.string().regex(/^[a-f0-9]{64}\.webp$/),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  source: z.string().max(4000).optional(),
  importedAt: z.string(),
});
/** A screen with `assetId: null` is a planned frame waiting for its web drawing. */
export const screenSchema = z.object({
  id,
  assetId: id.nullable(),
  mobileAssetId: id.nullable().optional(),
  title: z.string().max(200),
  purpose: prose,
  entry: z.boolean(),
  role: z.enum(['screen', 'auth', 'modal', 'terminal', 'detail']),
  /** The “Leave it up to the AI” post-it: build a standard page for this screen; no drawing expected. */
  leftToAi: z.boolean().optional(),
});
/** `x`/`y` anchor the pin on the web drawing; `mobile` is its position on the mobile drawing. */
export const pinSchema = z.object({
  kind: z.enum(['interaction', 'detail', 'link']).optional(),
  detailTarget: id.nullable().optional(),
  id,
  screenId: id,
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  mobile: point.nullable().optional(),
  color: z.enum(['red', 'olive', 'blue', 'gold']).optional(),
  title: z.string().max(200),
  description: prose,
});
export const navigationSchema = z.enum(['push', 'replace', 'reset', 'modal', 'back', 'dismiss']);
export const transitionSchema = z.object({
  id,
  pinId: id,
  target: id.nullable(),
  summary: z.string().max(300),
  condition: prose,
  logic: prose,
  context: prose,
  fallback: z.boolean(),
  navigation: navigationSchema,
  color: z.enum(['red', 'olive', 'blue', 'gold']),
});
export const reviewSchema = z.object({
  issueId: z.string().max(500),
  fingerprint: z.string().max(100),
  reason: z.string().trim().min(1).max(10000),
  author: z.string().max(200),
  acceptedAt: z.string(),
});
/** A functionality idea from the planning stage. It may be assigned to a screen and placed as a pin. */
export const ideaSchema = z.object({
  id,
  title: z.string().max(200),
  detail: prose,
  screenId: id.nullable(),
  pinId: id.nullable(),
  leadsTo: id.nullable(),
  author: z.string().max(200),
  createdAt: z.string(),
});
export const projectSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  name: z.string().trim().min(1).max(200),
  revision: z.number().int().nonnegative(),
  updatedAt: z.string(),
  assets: z.array(assetSchema).max(2000),
  screens: z.array(screenSchema).max(500),
  pins: z.array(pinSchema).max(5000),
  transitions: z.array(transitionSchema).max(10000),
  ideas: z.array(ideaSchema).max(5000).default([]),
  layout: z.record(
    id,
    z.object({
      x: z.number().finite(),
      y: z.number().finite(),
      width: z.number().min(160).max(1000),
    }),
  ),
  viewport: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    zoom: z.number().min(0.15).max(3),
  }),
  folders: z.array(z.string().max(4000)).max(20),
  reviews: z.array(reviewSchema).max(10000),
  /** What each pin color means on this board, e.g. gold = "needs a decision". */
  colorLabels: z
    .partialRecord(z.enum(['red', 'olive', 'blue', 'gold']), z.string().max(60))
    .optional(),
});
export type Asset = z.infer<typeof assetSchema>;
export type Screen = z.infer<typeof screenSchema>;
export type Pin = z.infer<typeof pinSchema>;
export type Transition = z.infer<typeof transitionSchema>;
export type Navigation = Transition['navigation'];
export type Idea = z.infer<typeof ideaSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Layout = 'web' | 'mobile';
export const uid = () => crypto.randomUUID();
export const emptyProject = (name = 'Untitled board', projectId: string = uid()): Project => ({
  schemaVersion: 1,
  id: projectId,
  name,
  revision: 0,
  updatedAt: new Date().toISOString(),
  assets: [],
  screens: [],
  pins: [],
  transitions: [],
  ideas: [],
  layout: {},
  viewport: { x: 60, y: 70, zoom: 0.85 },
  folders: [],
  reviews: [],
});
export const colors = { red: '#b95144', olive: '#718060', blue: '#547c91', gold: '#b98c43' };
export type PinColor = keyof typeof colors;
export const colorNames = Object.keys(colors) as PinColor[];
export const pinColor = (pin: Pin): PinColor => pin.color ?? 'red';
/** A link pin leaves the app for a web address written in its description. No yarn, no frame. */
export const urlPattern = /https?:\/\/[^\s)\]}>"']+|\bwww\.[^\s)\]}>"']+/i;
export const pinUrl = (pin: Pin): string | null => pin.description.match(urlPattern)?.[0] ?? null;
export const isHistory = (t: Transition) => t.navigation === 'back' || t.navigation === 'dismiss';
export const assetUrl = (asset?: Asset) => (asset ? `/assets/${asset.file}` : '');
export const isPlanned = (s: Screen) => s.assetId === null;
/** Rule (2026-09-26): a frame wearing the “Leave it up to the AI” post-it needs no drawing; the
 * builder generates a standard, conventional page from its title, purpose, ideas and yarn. */
export const isLeftToAi = (s: Screen) => s.leftToAi === true;
export const leaveToAi = (p: Project, screenId: string, on: boolean): Project => ({
  ...p,
  screens: p.screens.map((s) =>
    s.id === screenId ? (on ? { ...s, leftToAi: true } : { ...s, leftToAi: undefined }) : s,
  ),
});
export const screenSize = (p: Project, s: Screen) => {
  const a = p.assets.find((a) => a.id === s.assetId);
  const width = p.layout[s.id]?.width ?? 300;
  return { width, height: a ? ((width - 24) * a.height) / a.width + 78 : (width - 24) * 0.5 + 78 };
};
export type IdeaStatus = 'pool' | 'assigned' | 'placed';
export const ideaStatus = (idea: Idea): IdeaStatus =>
  idea.pinId ? 'placed' : idea.screenId ? 'assigned' : 'pool';
export function newIdea(
  input: Partial<Idea> & { title: string },
  author = 'You',
  ideaId: string = uid(),
): Idea {
  return {
    id: ideaId,
    title: input.title.trim().slice(0, 200),
    detail: input.detail ?? '',
    screenId: input.screenId ?? null,
    pinId: input.pinId ?? null,
    leadsTo: input.leadsTo ?? null,
    author: input.author ?? author,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
/** Planned threads: assigned ideas that lead somewhere but have not become pins yet. */
export function plannedThreads(p: Project) {
  return p.ideas.flatMap((idea) => {
    if (idea.pinId || !idea.screenId || !idea.leadsTo) return [];
    const source = p.screens.find((s) => s.id === idea.screenId),
      target = p.screens.find((s) => s.id === idea.leadsTo);
    return source && target ? [{ idea, source, target }] : [];
  });
}
export function removeScreen(p: Project, screenId: string): Project {
  const pinIds = new Set(p.pins.filter((pin) => pin.screenId === screenId).map((pin) => pin.id));
  const layout = { ...p.layout };
  delete layout[screenId];
  return {
    ...p,
    layout,
    screens: p.screens.filter((s) => s.id !== screenId),
    pins: p.pins
      .filter((pin) => pin.screenId !== screenId)
      .map((pin) => (pin.detailTarget === screenId ? { ...pin, detailTarget: null } : pin)),
    transitions: p.transitions.filter((t) => !pinIds.has(t.pinId) && t.target !== screenId),
    ideas: p.ideas.map((idea) =>
      idea.screenId === screenId ||
      idea.leadsTo === screenId ||
      (idea.pinId && pinIds.has(idea.pinId))
        ? {
            ...idea,
            screenId: idea.screenId === screenId ? null : idea.screenId,
            pinId: idea.screenId === screenId || pinIds.has(idea.pinId ?? '') ? null : idea.pinId,
            leadsTo: idea.leadsTo === screenId ? null : idea.leadsTo,
          }
        : idea,
    ),
  };
}
export function removePin(p: Project, pinId: string): Project {
  return {
    ...p,
    pins: p.pins.filter((pin) => pin.id !== pinId),
    transitions: p.transitions.filter((t) => t.pinId !== pinId),
    ideas: p.ideas.map((idea) => (idea.pinId === pinId ? { ...idea, pinId: null } : idea)),
  };
}

/** Linking an otherwise unused sketch as a detail declares its illustrative purpose. */
export function attachDetail(p: Project, pinId: string, target: string | null): Project {
  const pin = p.pins.find((pin) => pin.id === pinId);
  if (!pin || target === pin.screenId || p.transitions.some((t) => t.pinId === pinId)) return p;
  const targetScreen = p.screens.find((s) => s.id === target);
  if (target && !targetScreen) return p;
  const usedInFlow =
    targetScreen?.entry ||
    p.transitions.some(
      (t) => t.target === target || p.pins.find((pin) => pin.id === t.pinId)?.screenId === target,
    );
  return {
    ...p,
    pins: p.pins.map((pin) =>
      pin.id === pinId ? { ...pin, kind: 'detail', detailTarget: target } : pin,
    ),
    screens: p.screens.map((s) =>
      s.id === target && s.role === 'screen' && !usedInFlow ? { ...s, role: 'detail' } : s,
    ),
  };
}

/** Move an idea into a screen's folder or back to the pool. A placed idea gives up its pin (undoable). */
export function assignIdea(p: Project, ideaId: string, screenId: string | null): Project {
  const idea = p.ideas.find((idea) => idea.id === ideaId);
  if (!idea || idea.screenId === screenId) return p;
  if (screenId && !p.screens.some((s) => s.id === screenId)) return p;
  const next = idea.pinId ? removePin(p, idea.pinId) : p;
  return {
    ...next,
    ideas: next.ideas.map((idea) =>
      idea.id === ideaId ? { ...idea, screenId, pinId: null } : idea,
    ),
  };
}
/** Place an assigned idea on its screen's web drawing. The idea's text becomes the pin's intent. */
export function placeIdea(
  p: Project,
  ideaId: string,
  pos: { x: number; y: number },
  ids: { pin: string; transition: string } = { pin: uid(), transition: uid() },
): Project {
  const idea = p.ideas.find((idea) => idea.id === ideaId);
  const screen = idea?.screenId ? p.screens.find((s) => s.id === idea.screenId) : undefined;
  if (!idea || !screen || !screen.assetId || idea.pinId) return p;
  const pin: Pin = {
    id: ids.pin,
    screenId: screen.id,
    x: pos.x,
    y: pos.y,
    title: idea.title,
    description: idea.detail,
    kind:
      screen.role === 'detail'
        ? 'detail'
        : !idea.leadsTo && urlPattern.test(idea.detail)
          ? 'link'
          : 'interaction',
  };
  const target = p.screens.find((s) => s.id === idea.leadsTo);
  const thread: Transition | null =
    target && pin.kind === 'interaction' && target.role !== 'detail'
      ? {
          id: ids.transition,
          pinId: pin.id,
          target: target.id,
          summary: idea.title.slice(0, 300),
          condition: '',
          logic: '',
          context: '',
          fallback: false,
          navigation: target.role === 'modal' ? 'modal' : 'push',
          color: 'red',
        }
      : null;
  return {
    ...p,
    pins: [...p.pins, pin],
    transitions: thread ? [...p.transitions, thread] : p.transitions,
    ideas: p.ideas.map((idea) => (idea.id === ideaId ? { ...idea, pinId: pin.id } : idea)),
  };
}
/** Connect an idea to an existing pin (or disconnect with null). One pin belongs to one idea. */
export function linkIdea(p: Project, ideaId: string, pinId: string | null): Project {
  const idea = p.ideas.find((idea) => idea.id === ideaId);
  const pin = pinId ? p.pins.find((pin) => pin.id === pinId) : null;
  if (!idea || (pinId && !pin)) return p;
  return {
    ...p,
    ideas: p.ideas.map((other) =>
      other.id === ideaId
        ? { ...other, pinId, screenId: pin ? pin.screenId : other.screenId }
        : pinId && other.pinId === pinId
          ? { ...other, pinId: null }
          : other,
    ),
  };
}
/** Choose or clear a screen's drawing. The web drawing anchors pins, so it stays while pins exist. */
export function setDrawing(
  p: Project,
  screenId: string,
  layout: Layout,
  assetId: string | null,
): Project {
  const screen = p.screens.find((s) => s.id === screenId);
  if (!screen || (assetId && !p.assets.some((a) => a.id === assetId))) return p;
  if (layout === 'web') {
    if (!assetId && p.pins.some((pin) => pin.screenId === screenId)) return p;
    return { ...p, screens: p.screens.map((s) => (s.id === screenId ? { ...s, assetId } : s)) };
  }
  return {
    ...p,
    screens: p.screens.map((s) => (s.id === screenId ? { ...s, mobileAssetId: assetId } : s)),
    pins: assetId
      ? p.pins
      : p.pins.map((pin) => (pin.screenId === screenId ? { ...pin, mobile: null } : pin)),
  };
}
export function placeOnMobile(
  p: Project,
  pinId: string,
  pos: { x: number; y: number } | null,
): Project {
  return { ...p, pins: p.pins.map((pin) => (pin.id === pinId ? { ...pin, mobile: pos } : pin)) };
}
