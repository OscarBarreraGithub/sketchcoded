import { expect, type APIRequestContext } from '@playwright/test';
import { demoArt, demoProject } from '../fixtures/little-chat';
import type { Project } from '../../shared/model';

const headers = { 'X-Drawcode-Client': 'local' };

/** Builds the Little chat test board through the app's API: a blank board, its sketches, its graph. */
export async function createLittleChat(
  request: APIRequestContext,
  name = 'Little chat',
  base = '',
) {
  const made = await request.post(`${base}/api/projects`, { headers, data: { name } });
  expect(made.ok()).toBeTruthy();
  const blank: Project = await made.json();
  const assets = [];
  for (const [file, svg] of Object.entries(demoArt)) {
    const sent = await request.post(`${base}/api/images`, {
      headers,
      multipart: { images: { name: file, mimeType: 'image/svg+xml', buffer: Buffer.from(svg) } },
    });
    expect(sent.ok()).toBeTruthy();
    assets.push(...(await sent.json()).assets);
  }
  const board = { ...demoProject(assets, blank.id), name, revision: blank.revision };
  const saved = await request.put(`${base}/api/projects/${blank.id}`, { headers, data: board });
  expect(saved.ok()).toBeTruthy();
  return (await saved.json()) as Project;
}
