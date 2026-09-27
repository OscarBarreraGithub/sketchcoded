import { test, expect } from '@playwright/test';
const headers = { 'X-Drawcode-Client': 'local' };

test('the landing page lists the boards, opens one, comes back from the brand, and starts a new board', async ({
  page,
}) => {
  const name = `Landing check ${Date.now()}`;
  const made = await (
    await page.request.post('/api/projects', { headers, data: { name, demo: true } })
  ).json();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sketchcoded', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your boards' })).toBeVisible();
  const row = page.getByRole('button', { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row).toContainText('4 screens');
  // A new board with your agent is one click, with no board open.
  await page.getByRole('button', { name: 'New board with your agent' }).click();
  const dialog = page.getByRole('dialog', { name: 'Hand this to your agent' });
  const text = await dialog.getByRole('textbox', { name: 'Prompt for your agent' }).inputValue();
  expect(text).toMatch(
    /^Sketchcoded task · a new board for another project on this computer · Boards\n/,
  );
  expect(text).toContain('/api/brief?view=boards');
  const brief = await page.request.get(text.match(/https?:\/\/\S+\/brief\?\S+/)![0]);
  expect(brief.ok()).toBeTruthy();
  expect(await brief.text()).toContain('## Boards on this computer');
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();
  // Open a board, then come back through the brand.
  await row.click();
  await expect(page).toHaveURL(new RegExp(`/board/${made.id}$`));
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to your boards', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Your boards' })).toBeVisible();
  // Start a blank board from the landing page.
  const fresh = `Fresh canvas ${Date.now()}`;
  await page.getByLabel('Board name').fill(fresh);
  await page.getByRole('button', { name: 'New blank board', exact: true }).click();
  await expect(page.getByRole('heading', { name: fresh, exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/board\//);
  // An empty canvas leads with the agent, and its task is the first plan.
  await page.getByRole('button', { name: 'Plan it with your agent' }).click();
  const empty = await page
    .getByRole('dialog', { name: 'Hand this to your agent' })
    .getByRole('textbox', { name: 'Prompt for your agent' })
    .inputValue();
  expect(empty).toContain('This board is empty.');
});
