import { test, expect } from '@playwright/test';
const headers = { 'X-Drawcode-Client': 'local' };
async function open(page: import('@playwright/test').Page) {
  const name = `Save safety ${Date.now()}`;
  const p = await (
    await page.request.post('/api/projects', { headers, data: { name, demo: true } })
  ).json();
  await page.goto('/');
  await page
    .getByRole('button', { name: new RegExp(`${name}.*4 screens`) })
    .first()
    .click();
  await page.getByRole('button', { name: 'App outline', exact: true }).click();
  await page.getByRole('button', { name: 'Expand screens', exact: true }).click();
  await page.getByRole('button', { name: 'Edit screen', exact: true }).first().click();
  return p;
}
for (const method of ['brand', 'history'] as const) {
  test(`leaving through ${method} saves the last edit before unmounting`, async ({ page }) => {
    const p = await open(page);
    const value = `Saved before ${method}`;
    await page.getByRole('textbox', { name: 'What is this screen for?', exact: true }).fill(value);
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    if (method === 'brand') await page.getByRole('button', { name: 'Back to your boards' }).click();
    else await page.goBack();
    await expect(page.getByRole('heading', { name: 'Your boards', exact: true })).toBeVisible();
    expect(
      (await (await page.request.get(`/api/projects/${p.id}`)).json()).screens[0].purpose,
    ).toBe(value);
  });
}
test('a failed save keeps the board and its recovery controls open', async ({ page }) => {
  const p = await open(page);
  await page.route(`**/api/projects/${p.id}`, (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Another writer saved first.' }),
        })
      : route.continue(),
  );
  await page
    .getByRole('textbox', { name: 'What is this screen for?', exact: true })
    .fill('Keep this unsaved work');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Back to your boards' }).click();
  await expect(page.getByRole('button', { name: 'Export current work' })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/board/${p.id}$`));
});
test('typing during an agent refresh survives the delayed response', async ({ page }) => {
  const p = await open(page);
  const fresh = await (await page.request.get(`/api/projects/${p.id}`)).json();
  await page.request.put(`/api/projects/${p.id}`, {
    headers,
    data: { ...fresh, name: 'Agent update' },
  });
  let release!: () => void, arrived!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const pending = new Promise<void>((r) => {
    arrived = r;
  });
  await page.route(`**/api/projects/${p.id}`, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    arrived();
    await gate;
    await route.fulfill({ response });
  });
  try {
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await pending;
    const field = page.getByRole('textbox', { name: 'What is this screen for?', exact: true });
    await field.fill('Written while the refresh was arriving');
    release();
    await expect(page.getByRole('button', { name: 'Export current work' })).toBeVisible();
    await expect(field).toHaveValue('Written while the refresh was arriving');
  } finally {
    release();
  }
});
