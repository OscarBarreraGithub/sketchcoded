/**
 * Builds the Sketchcoded logo, `public/favicon.svg`, from the owner's hand-drawn alien in
 * `public/brand/alien-drawing.png`: the drawing in cream ink on the brand's green tile. The
 * strokes are kept exactly; the script only trims the empty margin, scales the drawing and tints
 * its white ink. The same file is the app's header logo, its favicon and the site's logo (copy it
 * to the site repository's `assets/favicon.svg`). Run with `npm run logo`.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../public/brand/alien-drawing.png', import.meta.url));
const target = fileURLToPath(new URL('../public/favicon.svg', import.meta.url));
const tile = '#34483d';
const ink = [0xf9, 0xf4, 0xe5];
const size = 40,
  padding = 5;

const trimmed = await sharp(source).trim().png().toBuffer();
const { data, info } = await sharp(trimmed)
  .resize(256, 256, { fit: 'inside' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) [data[i], data[i + 1], data[i + 2]] = ink;
const png = await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toBuffer();

const scale = (size - padding * 2) / Math.max(info.width, info.height);
const width = +(info.width * scale).toFixed(2),
  height = +(info.height * scale).toFixed(2);
const x = +((size - width) / 2).toFixed(2),
  y = +((size - height) / 2).toFixed(2);
await writeFile(
  target,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="11" fill="${tile}"/><image href="data:image/png;base64,${png.toString('base64')}" x="${x}" y="${y}" width="${width}" height="${height}"/></svg>\n`,
);
console.log(`Wrote ${target} (${info.width}×${info.height} drawing, ${png.length} bytes)`);
