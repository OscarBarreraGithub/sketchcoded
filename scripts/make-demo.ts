/**
 * Writes the public demo's data into the companion site: the example board as JSON and its
 * drawings as SVG. The site has no build step, so this runs here, in the app's repository, where
 * the example lives (shared/demo.ts and server/demo-art.ts), and its output is committed there.
 *
 *   npx tsx scripts/make-demo.ts [path to the site]
 *
 * Keeping the one source means the board on sketchcoded.com is the board the app opens with.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { demoArt } from '../server/demo-art';
import { demoProject } from '../shared/demo';
import { withCodes } from '../shared/model';

const site = process.argv[2] ?? path.resolve('../sketchcoded-site');
const out = path.join(site, 'example');
const art = path.join(out, 'art');

/** The drawings are vector, so the demo stays crisp at any zoom and weighs almost nothing. */
const size = (svg: string) => {
  const width = Number(svg.match(/width="(\d+)"/)?.[1] ?? 760);
  const height = Number(svg.match(/height="(\d+)"/)?.[1] ?? 550);
  return { width, height };
};
const assets = Object.entries(demoArt).map(([name, svg], i) => ({
  id: `art-${i + 1}`,
  name,
  file: name,
  ...size(svg),
  importedAt: '2026-09-27T00:00:00.000Z',
}));

const project = withCodes(demoProject(assets, 'demo'));
await rm(out, { recursive: true, force: true });
await mkdir(art, { recursive: true });
for (const [name, svg] of Object.entries(demoArt)) await writeFile(path.join(art, name), svg);
await writeFile(
  path.join(out, 'board.json'),
  `${JSON.stringify(
    {
      name: project.name,
      screens: project.screens,
      assets: project.assets,
      pins: project.pins,
      transitions: project.transitions,
      layout: project.layout,
      colorLabels: project.colorLabels,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `demo written to ${out}: ${project.screens.length} frames, ${project.pins.length} pins, ${project.transitions.length} threads, ${assets.length} drawings`,
);
