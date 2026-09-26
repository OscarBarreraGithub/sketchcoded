import { test, expect, type Page } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const headers = { 'X-Drawcode-Client': 'local' };
async function openFresh(page: Page, demo = true) {
  const response = await page.request.post('/api/projects', {
    headers,
    data: { name: demo ? 'Browser chat' : 'My sketchbook', demo },
  });
  expect(response.ok()).toBeTruthy();
  const project = await response.json();
  await page.addInitScript((id) => localStorage.setItem('drawcode:last-board', id), project.id);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: project.name, exact: true })).toBeVisible();
  await expect(page.getByText('All changes saved', { exact: true })).toBeAttached();
  return project;
}
async function close(page: Page) {
  await page.getByRole('button', { name: 'Close dialog', exact: true }).last().click();
}
async function addPin(page: Page, screen: string, name: string, description: string) {
  await page.getByRole('button', { name: `Edit ${screen}`, exact: true }).click();
  await page.getByRole('button', { name: 'Add a pin', exact: true }).first().click();
  const image = page.locator('.editable-image');
  const box = await image.boundingBox();
  expect(box).not.toBeNull();
  await image.click({ position: { x: box!.width * 0.36, y: box!.height * 0.45 } });
  await page.getByLabel('Pin name', { exact: true }).fill(name);
  await page.getByLabel('The idea', { exact: true }).fill(description);
}

test('play-through branches, authored back, restart and independent test rewind', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openFresh(page);
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await page.getByRole('button', { name: 'Try Let me in', exact: true }).click();
  await expect(page.getByAltText('Preview: Your people', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try Open a recent chat', exact: true }).click();
  await expect(page.getByText('CHOOSE THE SCENARIO', { exact: true })).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^You can message them/ })
    .click();
  await expect(page.getByAltText('Preview: A little conversation', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try Back to your people', exact: true }).click();
  await expect(page.getByAltText('Preview: Your people', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try Open a recent chat', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^This person is blocked/ })
    .click();
  await expect(page.getByAltText('Preview: When a chat is blocked', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try Back to your people', exact: true }).click();
  await page.getByRole('button', { name: 'Rewind test', exact: true }).click();
  await expect(page.getByAltText('Preview: When a chat is blocked', { exact: true })).toBeVisible();
  await page.getByLabel('Preview starting screen').selectOption('conversation');
  await page.getByRole('button', { name: 'Try Back to your people', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'There is no previous screen' }),
  ).toBeVisible();
  await page.getByLabel('Preview starting screen').selectOption('welcome');
  await expect(page.getByRole('button', { name: 'Rewind test', exact: true })).toBeDisabled();
  await close(page);
  expect(errors).toEqual([]);
});

test('connect a local folder, drag sketches, author pins and yarn, save, delete and undo', async ({
  page,
}) => {
  const project = await openFresh(page, false);
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'drawcode-browser-'));
  try {
    for (const [name, color] of [
      ['home', '#e1e8d3'],
      ['details', '#e7dcca'],
    ])
      await fs.writeFile(
        path.join(folder, `${name}.svg`),
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="${color}"/><rect x="40" y="40" width="520" height="320" rx="5" fill="none" stroke="#839179" stroke-width="3"/><text x="80" y="120" font-size="35">${name}</text></svg>`,
      );
    await page.getByRole('button', { name: 'Connect a folder', exact: false }).click();
    await page.getByLabel('Local folder path').fill(folder);
    await page.getByRole('button', { name: 'Connect folder', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const home = page
      .locator('.asset')
      .filter({ has: page.getByRole('button', { name: 'Add home.svg to board', exact: true }) });
    await home.dragTo(page.getByRole('main', { name: 'Design board' }), {
      targetPosition: { x: 240, y: 200 },
    });
    await page.getByLabel('Screen title').fill('Home');
    await page.getByRole('button', { name: 'Pin to board', exact: true }).click();
    await page.getByRole('button', { name: 'Add details.svg to board', exact: true }).click();
    await page.getByLabel('Screen title').fill('Details');
    await page.getByRole('button', { name: 'Pin to board', exact: true }).click();
    await page.getByRole('button', { name: 'Fit board', exact: true }).click();
    await addPin(page, 'Home', 'Open item', 'Open the selected item and pass its itemId.');
    await page.getByRole('button', { name: 'Connect to a screen', exact: true }).click();
    await page
      .getByRole('article', { name: 'Screen: Details', exact: true })
      .click({ position: { x: 25, y: 35 } });
    await page.getByLabel('Short version', { exact: false }).fill('Item is available');
    await page.getByLabel('When does this happen?').fill('When this item can be opened.');
    await page
      .getByRole('textbox', { name: 'The details', exact: true })
      .fill('Load the record. Show a retry option if loading fails.');
    await page.getByLabel('What data or information is needed?').fill('itemId');
    await page.getByRole('button', { name: 'Tie the yarn', exact: true }).click();
    await addPin(page, 'Details', 'Back to Home', 'Return to the item list.');
    await page.getByRole('button', { name: 'Add Back / Dismiss action', exact: true }).click();
    await page.getByRole('button', { name: 'Tie the yarn', exact: true }).click();
    await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
    const saved = await (await page.request.get(`/api/projects/${project.id}`)).json();
    expect(saved.screens).toHaveLength(2);
    expect(saved.pins).toHaveLength(2);
    expect(saved.transitions).toHaveLength(2);
    expect(saved.folders).toEqual([await fs.realpath(folder)]);
    const originalImage = saved.screens.find((s: { title: string }) => s.title === 'Home').assetId;
    await fs.writeFile(
      path.join(folder, 'home.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="teal"/></svg>',
    );
    await page.getByRole('button', { name: 'Refresh folders', exact: true }).click();
    await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
    await expect
      .poll(
        async () =>
          (await (await page.request.get(`/api/projects/${project.id}`)).json()).assets.length,
      )
      .toBe(3);
    const refreshed = await (await page.request.get(`/api/projects/${project.id}`)).json();
    expect(refreshed.screens.find((s: { title: string }) => s.title === 'Home').assetId).toBe(
      originalImage,
    );

    await page.reload();
    await expect(page.getByRole('button', { name: 'Edit Home', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Edit Details', exact: true }).click();
    await page.getByRole('button', { name: 'Remove screen', exact: true }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit Details', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit Details', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Test flow', exact: true }).click();
    await page.getByRole('button', { name: 'Try Open item', exact: true }).click();
    await expect(page.getByAltText('Preview: Details', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Try Back to Home', exact: true }).click();
    await expect(page.getByAltText('Preview: Home', { exact: true })).toBeVisible();
    await close(page);
    await page
      .getByRole('button', { name: `Disconnect ${await fs.realpath(folder)}`, exact: true })
      .click();
    await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  } finally {
    await fs.rm(folder, { recursive: true, force: true });
  }
});

test('review accepts an intentional login reset, keeps the reason and reopens changed evidence', async ({
  page,
}) => {
  const p = await openFresh(page);
  await page.getByRole('button', { name: /Review flow/ }).click();
  await page.getByRole('button', { name: /A warm welcome → Your people is one way/ }).click();
  await page
    .getByLabel('This is intentional because…')
    .fill('A signed-in session must not return to the login form.');
  await page.getByRole('button', { name: 'Accept & keep the reason', exact: true }).click();
  await page.getByRole('button', { name: /Accepted 1/ }).click();
  await expect(
    page
      .locator('.accepted-reason')
      .getByText('A signed-in session must not return to the login form.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close flow review', exact: true }).click();
  await page.getByRole('button', { name: 'Edit connection: Signed in', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'The details', exact: true })
    .fill('Reset history after sign-in. A session can also expire here.');
  await page.getByRole('button', { name: 'Save connection', exact: true }).click();
  await page.getByRole('button', { name: /Review flow/ }).click();
  await page.getByRole('button', { name: /A warm welcome → Your people is one way/ }).click();
  await expect(page.getByText('CHANGED · REVIEW AGAIN', { exact: true })).toBeVisible();
  await expect(page.getByText(/Previously accepted:/)).toBeVisible();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  const saved = await (await page.request.get(`/api/projects/${p.id}`)).json();
  expect(saved.reviews[0].reason).toContain('signed-in session');
});

test('export and import a project from the interface', async ({ page }) => {
  const p = await openFresh(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project', exact: true }).click();
  const downloaded = await download;
  const file = await downloaded.path();
  expect(file).toBeTruthy();
  await page.locator('.project-trigger').click();
  await page.getByRole('button', { name: 'Import a project', exact: true }).click();
  await page.locator('input[type=file][accept=".zip"]').setInputFiles(file!);
  await expect(
    page.getByRole('heading', { name: `${p.name} (imported)`, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(4);
});

test('board movement, zoom, fit, keyboard undo and dialog focus', async ({ page }) => {
  const p = await openFresh(page);
  const card = page.getByRole('article', { name: 'Screen: A warm welcome', exact: true });
  const box = await card.boundingBox();
  await page.mouse.move(box!.x + 35, box!.y + 30);
  await page.mouse.down();
  await page.mouse.move(box!.x + 105, box!.y + 85, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  let saved = await (await page.request.get(`/api/projects/${p.id}`)).json();
  expect(saved.layout.welcome.x).toBeGreaterThan(p.layout.welcome.x);
  await page.keyboard.press('Control+z');
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  saved = await (await page.request.get(`/api/projects/${p.id}`)).json();
  expect(saved.layout.welcome.x).toBe(p.layout.welcome.x);
  const before = await page.locator('.zoom-value').innerText();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.locator('.zoom-value')).not.toHaveText(before);
  await page.getByRole('button', { name: 'Fit board', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Your people', exact: true }).click();
  await page.getByLabel('Paper title').focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('small viewport and reduced motion preserve authoring and preview access', async ({
  page,
}) => {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFresh(page);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Edit Your people', exact: true }).click();
  await expect(page.getByLabel('Paper title')).toBeVisible();
  await close(page);
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await page.getByRole('button', { name: 'Try Let me in', exact: true }).click();
  await expect(page.getByAltText('Preview: Your people', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try Open a recent chat', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^This person is blocked/ })
    .click();
  await expect(page.getByAltText('Preview: When a chat is blocked', { exact: true })).toBeVisible();
});

test('move and describe a pin, reconnect a yarn, remove a pin and undo its branches', async ({
  page,
}) => {
  const p = await openFresh(page);
  await page.getByRole('button', { name: 'Edit Your people', exact: true }).click();
  const pin = page.getByRole('button', { name: 'Pin 1: Open a recent chat', exact: true });
  const box = await pin.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + 65, box!.y + 45, { steps: 6 });
  await page.mouse.up();
  await page
    .getByRole('textbox', { name: 'The idea', exact: true })
    .fill('Open a reusable conversation for the chosen user.');
  await page.locator('.connection-row').filter({ hasText: 'You can message them' }).click();
  await page
    .getByRole('combobox', { name: 'Destination screen', exact: true })
    .selectOption('blocked');
  await page.getByRole('button', { name: 'Save connection', exact: true }).click();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  let saved = await (await page.request.get(`/api/projects/${p.id}`)).json();
  expect(saved.pins.find((v: { id: string }) => v.id === 'open-chat').x).toBeGreaterThan(0.185);
  expect(saved.transitions.find((v: { id: string }) => v.id === 'chat-allowed').target).toBe(
    'blocked',
  );
  await page.getByRole('button', { name: 'Edit Your people', exact: true }).click();
  await page.getByRole('button', { name: 'Pin 1: Open a recent chat', exact: true }).click();
  await page.getByRole('button', { name: 'Remove pin', exact: true }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await close(page);
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  saved = await (await page.request.get(`/api/projects/${p.id}`)).json();
  expect(saved.transitions).toHaveLength(3);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  saved = await (await page.request.get(`/api/projects/${p.id}`)).json();
  expect(saved.transitions).toHaveLength(5);
});

test('individual file import reports invalid images and previews an unconnected pin honestly', async ({
  page,
}) => {
  await openFresh(page, false);
  await page.locator('input[type=file][accept="image/*,.tif,.tiff"]').setInputFiles([
    {
      name: 'a-sketch.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="bisque"/></svg>',
      ),
    },
    { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('This is not an image.') },
  ]);
  await expect(page.getByRole('dialog', { name: 'Import & export notes' })).toBeVisible();
  await expect(page.getByText(/broken.png: this image could not be read/)).toBeVisible();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.getByRole('button', { name: 'Add a-sketch.svg to board', exact: true }).click();
  await page.getByLabel('Screen title').fill('My screen');
  await page.getByRole('button', { name: 'Pin to board', exact: true }).click();
  await page.getByRole('button', { name: 'Fit board', exact: true }).click();
  await addPin(page, 'My screen', 'An unfinished idea', 'I have not decided what this does yet.');
  await close(page);
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await page.getByRole('button', { name: 'Try An unfinished idea', exact: true }).click();
  await expect(page.getByText(/This pin has no yarn yet/)).toBeVisible();
});

test('two-tab conflicts preserve the server version and allow exporting unsaved work', async ({
  page,
  context,
}) => {
  const p = await openFresh(page);
  await page.waitForTimeout(800);
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByRole('heading', { name: p.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rename board', exact: true }).click();
  await page.getByLabel('Board name', { exact: true }).fill('First tab saved');
  await page.getByRole('button', { name: 'Save name', exact: false }).click();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  await second.getByRole('button', { name: 'Rename board', exact: true }).click();
  await second.getByLabel('Board name', { exact: true }).fill('Second tab unsaved');
  await second.getByRole('button', { name: 'Save name', exact: false }).click();
  await expect(second.getByRole('alert')).toContainText('changed in another tab');
  expect((await (await page.request.get(`/api/projects/${p.id}`)).json()).name).toBe(
    'First tab saved',
  );
  const download = second.waitForEvent('download');
  await second.getByRole('button', { name: 'Export current work', exact: true }).click();
  expect((await download).suggestedFilename()).toContain('Second-tab-unsaved');
  second.on('dialog', (dialog) => dialog.accept());
  await second.close();
});

test('looking around the board is not a change: the save indicator stays put while panning', async ({
  page,
}) => {
  const response = await page.request.post('/api/projects', {
    headers: { 'X-Drawcode-Client': 'local' },
    data: { name: 'Quiet viewport', demo: true },
  });
  const project = await response.json();
  await page.addInitScript((id) => localStorage.setItem('drawcode:last-board', id), project.id);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Quiet viewport', exact: true })).toBeVisible();
  const status = page.locator('.save-status');
  await expect(status).toHaveText(/All changes saved/);
  const board = page.getByRole('main', { name: 'Design board' });
  const box = (await board.boundingBox())!;
  const seen = new Set<string>();
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(box.x + 30, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 230, box.y + 130, { steps: 6 });
    await page.mouse.up();
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    seen.add((await status.textContent()) ?? '');
    await page.waitForTimeout(300);
    seen.add((await status.textContent()) ?? '');
  }
  await page.waitForTimeout(900);
  seen.add((await status.textContent()) ?? '');
  expect([...seen].every((text) => /All changes saved/.test(text))).toBe(true);
  // The position is still remembered.
  const before = (await page.request.get(`/api/projects/${project.id}`)).json();
  expect((await before).viewport.zoom).toBeGreaterThan(project.viewport.zoom);
});
