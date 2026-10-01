/**
 * Builds the Sketchcoded logo from the owner's hand-drawn alien in
 * `public/brand/alien-drawing.png`: just the alien, in dark ink, with no tile behind it. The
 * strokes are kept exactly; the script only trims the empty margin, scales the drawing and tints
 * its white ink. It writes two files:
 *
 * - `public/brand/logo.svg`, the logo on the page (the app's header, the site's header).
 * - `public/favicon.svg`, the browser-tab icon: the same alien, in cream ink when the browser is
 *   dark, so it never disappears into a dark tab bar.
 *
 * Copy both to the site repository's `assets/` (`logo.svg`, `favicon.svg`). Run with
 * `npm run logo`.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../public/brand/alien-drawing.png', import.meta.url));
const logo = fileURLToPath(new URL('../public/brand/logo.svg', import.meta.url));
const favicon = fileURLToPath(new URL('../public/favicon.svg', import.meta.url));
const dark = [0x34, 0x48, 0x3d];
const light = [0xf9, 0xf4, 0xe5];
const size = 40,
  padding = 1;

const trimmed = await sharp(source).trim().png().toBuffer();
const { data, info } = await sharp(trimmed)
  .resize(256, 256, { fit: 'inside' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
async function inked(ink) {
  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) [pixels[i], pixels[i + 1], pixels[i + 2]] = ink;
  const png = await sharp(pixels, { raw: info }).png({ compressionLevel: 9 }).toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

const scale = (size - padding * 2) / Math.max(info.width, info.height);
const width = +(info.width * scale).toFixed(2),
  height = +(info.height * scale).toFixed(2);
const x = +((size - width) / 2).toFixed(2),
  y = +((size - height) / 2).toFixed(2);
const image = (href, attrs = '') =>
  `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}"${attrs}/>`;
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${body}</svg>\n`;

const darkInk = await inked(dark);
await writeFile(logo, svg(image(darkInk)));
await writeFile(
  favicon,
  svg(
    '<style>.light{display:none}@media (prefers-color-scheme:dark){.dark{display:none}.light{display:inline}}</style>' +
      image(darkInk, ' class="dark"') +
      image(await inked(light), ' class="light"'),
  ),
);
console.log(`Wrote ${logo} and ${favicon} (${info.width}×${info.height} drawing)`);
