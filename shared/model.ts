import { z } from 'zod';

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const prose = z.string().max(30000);
export const assetSchema = z.object({
  id,
  name: z.string().max(500),
  file: z.string().regex(/^[a-f0-9]{64}\.webp$/),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  source: z.string().max(4000).optional(),
  importedAt: z.string(),
});
export const screenSchema = z.object({
  id,
  assetId: id,
  title: z.string().max(200),
  purpose: prose,
  entry: z.boolean(),
  role: z.enum(['screen', 'auth', 'modal', 'terminal']),
});
export const pinSchema = z.object({
  id,
  screenId: id,
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
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
});
export type Asset = z.infer<typeof assetSchema>;
export type Screen = z.infer<typeof screenSchema>;
export type Pin = z.infer<typeof pinSchema>;
export type Transition = z.infer<typeof transitionSchema>;
export type Navigation = Transition['navigation'];
export type Project = z.infer<typeof projectSchema>;
export type Review = z.infer<typeof reviewSchema>;
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
  layout: {},
  viewport: { x: 60, y: 70, zoom: 0.85 },
  folders: [],
  reviews: [],
});
export const colors = { red: '#b95144', olive: '#718060', blue: '#547c91', gold: '#b98c43' };
export const isHistory = (t: Transition) => t.navigation === 'back' || t.navigation === 'dismiss';
export const assetUrl = (asset?: Asset) => (asset ? `/assets/${asset.file}` : '');
export const screenSize = (p: Project, s: Screen) => {
  const a = p.assets.find((a) => a.id === s.assetId);
  const width = p.layout[s.id]?.width ?? 300;
  return { width, height: a ? ((width - 24) * a.height) / a.width + 78 : width + 78 };
};
export function removeScreen(p: Project, screenId: string): Project {
  const pinIds = new Set(p.pins.filter((pin) => pin.screenId === screenId).map((pin) => pin.id));
  const layout = { ...p.layout };
  delete layout[screenId];
  return {
    ...p,
    layout,
    screens: p.screens.filter((s) => s.id !== screenId),
    pins: p.pins.filter((pin) => pin.screenId !== screenId),
    transitions: p.transitions.filter((t) => !pinIds.has(t.pinId) && t.target !== screenId),
  };
}
export function removePin(p: Project, pinId: string): Project {
  return {
    ...p,
    pins: p.pins.filter((pin) => pin.id !== pinId),
    transitions: p.transitions.filter((t) => t.pinId !== pinId),
  };
}
