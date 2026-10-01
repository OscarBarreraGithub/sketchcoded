import { test, expect, type Page } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
const headers = { 'X-Drawcode-Client': 'local' };
async function fresh(page: Page) {
  const response = await page.request.post('/api/projects', {
    headers,
    data: { name: 'Planning check', demo: true },
  });
  expect(response.ok()).toBeTruthy();
  const project = await response.json();
  await page.addInitScript((id) => localStorage.setItem('drawcode:last-board', id), project.id);
  await page.goto(`/board/${project.id}`);
  await expect(page.getByRole('heading', { name: project.name, exact: true })).toBeVisible();
  return project as { id: string; name: string };
}
async function addIdea(page: Page, title: string, detail: string, screen: string, leads: string) {
  await page.getByLabel('New idea').fill(title);
  await page.getByLabel('Details').first().fill(detail);
  await page.getByLabel('Belongs on').first().selectOption({ label: screen });
  await page.getByLabel('Leads to').first().selectOption({ label: leads });
  await page.getByRole('button', { name: 'Add idea', exact: true }).click();
}
const close = (page: Page) =>
  page.getByRole('button', { name: 'Close dialog', exact: true }).last().click();

test('planning: plan a frame, add ideas, place one as a pin with its yarn, and keep it greyed out', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await fresh(page);
  await page.locator('.view-switch').getByRole('button', { name: /^Plan/ }).click();
  await page.getByLabel('Frame title').fill('Settings');
  await page.getByLabel('What is this frame for?').fill('Account and notification preferences.');
  await page.getByRole('button', { name: 'Add planned frame', exact: true }).click();
  await addIdea(page, 'Sign out', 'Ends the session.', 'Settings', 'A warm welcome');
  await addIdea(
    page,
    'Search people',
    'Find a friend by name.',
    'Your people',
    'A little conversation',
  );
  const search = page.locator('.idea-card', { hasText: 'Search people' });
  await expect(search.getByText('Waiting for the drawing')).toBeVisible();
  await expect(page.locator('.view-switch').getByRole('button', { name: /^Plan/ })).toContainText(
    '2',
  );
  // A planned frame opens its editor, where the idea can wait as a pin until the drawing arrives.
  await expect(
    page
      .locator('.idea-card', { hasText: 'Sign out' })
      .getByRole('button', { name: 'Open the frame to place it' }),
  ).toBeVisible();
  // Placing writes the pin's name and intent and ties the planned yarn.
  await search.getByRole('button', { name: 'Place on the drawing', exact: true }).click();
  await expect(
    page.getByText('Click the web drawing where “Search people” belongs.'),
  ).toBeVisible();
  const image = page.locator('.layout-stage.web .editable-image');
  const box = await image.boundingBox();
  await image.click({ position: { x: box!.width * 0.3, y: box!.height * 0.28 } });
  await expect(page.getByLabel('Pin name', { exact: true })).toHaveValue('Search people');
  await expect(page.getByRole('textbox', { name: /^The idea/ })).toHaveValue(
    'Find a friend by name.',
  );
  await expect(page.getByText('Planned as “Search people” in the plan.')).toBeVisible();
  await expect(page.locator('.connection-row', { hasText: 'Search people' })).toContainText(
    'A little conversation',
  );
  await close(page);
  await expect(search).toHaveClass(/placed/);
  await expect(search.getByText('Pinned as pin 2')).toBeVisible();
  await expect(search.getByRole('button', { name: 'Place on the drawing' })).toHaveCount(0);
  // The board shows the empty frame with its idea count. Planned connections are read in the plan
  // and the outline, never drawn as a second kind of line (rule of 2026-09-26).
  await page.getByRole('button', { name: 'Board', exact: true }).click();
  const frame = page.getByRole('article', { name: 'Screen: Settings', exact: true });
  await expect(frame).toHaveClass(/planned/);
  await expect(frame.getByText('1 idea planned')).toBeVisible();
  await expect(page.locator('.planned-thread, .planned-label')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Edit connection: Search people', exact: true }),
  ).toBeVisible();
  // Everything persists and reads as text.
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  await page.reload();
  await page.locator('.view-switch').getByRole('button', { name: /^Plan/ }).click();
  await expect(page.locator('.idea-card', { hasText: 'Sign out' })).toHaveClass(/assigned/);
  await page.getByRole('button', { name: 'Show as text', exact: true }).click();
  const text = page.getByLabel('Planning outline');
  await expect(text).toContainText(/## P\d+ Settings \(no drawing yet\)/);
  await expect(text).toContainText('- [ ] Sign out → A warm welcome');
  await expect(text).toContainText('- [x] Search people → A little conversation (pin 2)');
  expect(errors).toEqual([]);
});

test('layouts: a mobile drawing, pins placed on it, review, preview toggle and export', async ({
  page,
}) => {
  const project = await fresh(page);
  await page.getByRole('button', { name: 'Open Your people', exact: true }).click();
  await page.getByLabel('Mobile drawing').selectOption({ index: 3 });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Mobile/ })
    .click();
  const mobile = page.locator('.layout-stage.mobile');
  await expect(mobile).toBeVisible();
  await expect(page.getByText('Not on mobile yet:')).toBeVisible();
  await close(page);
  await page.getByRole('button', { name: /^Review flow/ }).click();
  await expect(page.getByText('Open a recent chat is not on the mobile layout')).toBeVisible();
  await page.getByRole('button', { name: 'Open Your people', exact: true }).click();
  await page.getByRole('button', { name: 'Pin 1: Open a recent chat', exact: true }).click();
  await page.getByRole('button', { name: 'Place on the mobile drawing', exact: true }).click();
  const phone = page.locator('.mobile-frame');
  const box = await phone.boundingBox();
  await phone.click({ position: { x: box!.width * 0.5, y: box!.height * 0.4 } });
  await expect(
    page.getByRole('button', { name: 'Pin 1: Open a recent chat (mobile)' }),
  ).toBeVisible();
  await expect(page.getByText('Not on mobile yet:')).toHaveCount(0);
  await close(page);
  await expect(page.getByText('Open a recent chat is not on the mobile layout')).toHaveCount(0);
  // Preview follows the same pin on either layout.
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await page.getByRole('button', { name: 'Try Let me in', exact: true }).click();
  await page.getByRole('button', { name: 'Mobile', exact: true }).click();
  await expect(page.getByAltText('Preview: Your people (mobile)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try Open a recent chat', exact: true }).click();
  await expect(page.getByText('CHOOSE THE SCENARIO', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Web', exact: true }).click();
  await expect(page.getByAltText('Preview: Your people', { exact: true })).toBeVisible();
  await close(page);
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  // The export names both drawings and both positions.
  const saved = await (await page.request.get(`/api/projects/${project.id}`)).json();
  const zip = await page.request.post('/api/export', { headers, data: saved });
  expect(zip.ok()).toBeTruthy();
  const files = unzipSync(new Uint8Array(await zip.body()));
  const flow = strFromU8(files['flow.md']);
  expect(flow).toContain('Mobile drawing: [');
  expect(flow).toMatch(/Mobile coordinate: \(0\.\d+, 0\.\d+\)/);
  expect(JSON.parse(strFromU8(files['project.json'])).pins[1].mobile).toBeTruthy();
});

test('a sketch dropped onto a planned frame fills it and its ideas become placeable', async ({
  page,
}) => {
  await fresh(page);
  await page.locator('.view-switch').getByRole('button', { name: /^Plan/ }).click();
  await page.getByLabel('Frame title').fill('Settings');
  await page.getByRole('button', { name: 'Add planned frame', exact: true }).click();
  await addIdea(page, 'Sign out', 'Ends the session.', 'Settings', 'A warm welcome');
  await page.getByRole('button', { name: 'Board', exact: true }).click();
  await page.getByRole('button', { name: 'Fit board', exact: true }).click();
  const frame = page.getByRole('article', { name: 'Screen: Settings', exact: true });
  await expect(frame).toHaveClass(/planned/);
  const sketch = page.locator('.asset').filter({
    has: page.getByRole('button', { name: 'Add 04-blocked.svg to board', exact: true }),
  });
  await sketch.dragTo(frame, { targetPosition: { x: 60, y: 90 } });
  await expect(frame).not.toHaveClass(/planned/);
  await expect(frame.locator('img').first()).toBeVisible();
  await expect(
    page.getByText('Drawing added. Open the frame to place its planned ideas as pins.'),
  ).toBeVisible();
  await page.locator('.view-switch').getByRole('button', { name: /^Plan/ }).click();
  await expect(
    page
      .locator('.idea-card', { hasText: 'Sign out' })
      .getByRole('button', { name: 'Place on the drawing' }),
  ).toBeEnabled();
});

test('a frame left to the AI wears its post-it on the board, in the outline and in the review', async ({
  page,
}) => {
  await fresh(page);
  await page.locator('.view-switch').getByRole('button', { name: /^Plan/ }).click();
  await page.getByLabel('Frame title').fill('Guide');
  await page.getByRole('button', { name: 'Add planned frame', exact: true }).click();
  await page.getByRole('button', { name: 'App outline', exact: true }).click();
  await page.getByRole('button', { name: 'Expand screens', exact: true }).click();
  const guide = page
    .locator('.outline-screen')
    .filter({ has: page.locator('summary strong', { hasText: 'Guide' }) })
    .first();
  await expect(guide.getByText('no drawing yet')).toBeVisible();
  await guide.getByRole('button', { name: 'Edit screen', exact: true }).click();
  await expect(page.getByText('Waiting for a drawing.')).toBeVisible();
  await page.getByRole('checkbox', { name: /Leave it up to the AI/ }).check();
  await expect(page.getByText('Left to the AI: a standard page, no drawing needed.')).toBeVisible();
  await close(page);
  await expect(guide.getByText('left to the AI')).toBeVisible();
  await page.getByRole('button', { name: 'Board', exact: true }).click();
  const frame = page.getByRole('article', { name: 'Screen: Guide', exact: true });
  // On an undrawn frame the post-it is part of the frame's words; the corner one waits for zoom-out.
  await expect(frame.locator('.post-it:visible')).toHaveText('Leave it up to the AI');
  await expect(frame.getByText('A standard page')).toBeVisible();
  // The review no longer asks for a drawing; the plan says the frame is left to the AI.
  await page.locator('.review-button').click();
  await expect(page.getByText('Guide is waiting for a drawing')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close flow review', exact: true }).click();
  await page.locator('.view-switch').getByRole('button', { name: /^Plan/ }).click();
  await page.getByRole('button', { name: 'Show as text', exact: true }).click();
  await expect(page.getByLabel('Planning outline')).toContainText(
    /## P\d+ Guide \(left to the AI\)/,
  );
});

test('strings are tied before the drawing: a provisional pin waits, then is placed when the drawing lands', async ({
  page,
}) => {
  const project = await fresh(page);
  // Two planned frames and an idea on the first that opens the second, written like an agent would.
  const full = await (await page.request.get(`/api/projects/${project.id}`)).json();
  full.screens.push(
    {
      id: 'wait-a',
      assetId: null,
      title: 'Waiting one',
      purpose: 'First',
      entry: false,
      role: 'screen',
    },
    {
      id: 'wait-b',
      assetId: null,
      title: 'Waiting two',
      purpose: 'Second',
      entry: false,
      role: 'screen',
    },
  );
  full.layout['wait-a'] = { x: 1400, y: 900, width: 360 };
  full.layout['wait-b'] = { x: 1900, y: 900, width: 360 };
  full.ideas.push({
    id: 'idea-open-two',
    title: 'Open two',
    detail: 'Goes to the second frame',
    screenId: 'wait-a',
    pinId: null,
    leadsTo: 'wait-b',
    author: 'Agent',
    createdAt: new Date().toISOString(),
  });
  expect(
    (await page.request.put(`/api/projects/${project.id}`, { headers, data: full })).ok(),
  ).toBeTruthy();
  await page.reload();
  await expect(page.getByRole('heading', { name: project.name, exact: true })).toBeVisible();
  const yarnBefore = await page.locator('.yarn').count();
  // Place the idea on the undrawn frame: a provisional pin with its yarn, no drawing needed.
  await page.getByRole('button', { name: 'Open Waiting one', exact: true }).click();
  const editor = page.getByRole('dialog', { name: /Waiting one/ });
  await expect(editor.getByText('Waiting for a drawing.')).toBeVisible();
  await editor.getByRole('button', { name: 'Place', exact: true }).click();
  await expect(editor.getByText(/1 pin waits here with its yarn/)).toBeVisible();
  await close(page);
  await expect(page.locator('.yarn')).toHaveCount(yarnBefore + 1);
  await expect(page.locator('.board-pin.provisional')).toHaveCount(1);
  await expect(page.getByText('All changes saved')).toBeVisible();
  // The drawing lands: the editor asks to place the waiting pin, and the review warns until then.
  await page.getByRole('button', { name: 'Open Waiting one', exact: true }).click();
  await editor.getByLabel('Choose a web drawing').selectOption({ index: 1 });
  const strip = editor.locator('.provisional-strip');
  await expect(strip).toContainText('Place on the drawing:');
  await expect(page.getByText('All changes saved')).toBeVisible();
  const warned = await (
    await page.request.get(`/api/projects/${project.id}/brief?view=review`)
  ).text();
  expect(warned).toContain('rule pin-not-placed');
  // Until it is placed, Test flow lists the pin beside the drawing instead of at its placeholder.
  await close(page);
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await page.getByLabel('Preview starting screen').selectOption('wait-a');
  await expect(page.locator('.preview-pin')).toHaveCount(0);
  const waiting = page.locator('.preview-unplaced');
  await expect(waiting).toContainText('Not placed on the drawing yet:');
  await expect(waiting.getByRole('button', { name: 'Try Open two' })).toBeVisible();
  await close(page);
  await page.getByRole('button', { name: 'Open Waiting one', exact: true }).click();
  await strip.getByRole('button', { name: /Open two/ }).click();
  const image = editor.locator('.editable-image img').first();
  await expect(image).toBeVisible();
  const box = (await image.boundingBox())!;
  await image.click({ position: { x: box.width * 0.3, y: box.height * 0.6 } });
  await expect(strip).toHaveCount(0);
  await expect(editor.locator('.editor-pin.provisional')).toHaveCount(0);
  await expect(editor.locator('.editor-pin')).toHaveCount(1);
  await close(page);
  await expect(page.locator('.board-pin.provisional')).toHaveCount(0);
  await expect(page.locator('.yarn')).toHaveCount(yarnBefore + 1);
  await expect(page.getByText('All changes saved')).toBeVisible();
  const placed = await (
    await page.request.get(`/api/projects/${project.id}/brief?view=review`)
  ).text();
  expect(placed).not.toContain('rule pin-not-placed');
});
