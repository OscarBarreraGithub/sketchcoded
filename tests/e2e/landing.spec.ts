import { test, expect } from '@playwright/test';
const headers = { 'X-Drawcode-Client': 'local' };
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

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
  const box = dialog.getByRole('textbox', { name: 'Prompt for your agent' });
  const text = await box.inputValue();
  // The middle level is the default: frames with the strings already tied.
  expect(text).toMatch(
    /^Sketchcoded task · a new board for another project on this computer · frames and strings · Boards\n/,
  );
  expect(text).toContain('/api/brief?view=boards&mode=frames');
  const brief = await page.request.get(text.match(/https?:\/\/\S+\/brief\?\S+/)![0]);
  expect(brief.ok()).toBeTruthy();
  expect(await brief.text()).toContain('## Boards on this computer');
  // The switch has three levels; choosing one rewrites the prompt and copies it again.
  const levels = dialog.getByRole('radiogroup', { name: 'How much the agent builds' });
  await expect(levels.getByRole('radio')).toHaveCount(3);
  await expect(levels.getByRole('radio', { name: 'Frames and strings' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await levels.getByRole('radio', { name: 'Built out' }).click();
  await expect(box).toHaveValue(/mode=built/);
  await expect(box).toHaveValue(/ · built out · Boards\n/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await box.inputValue());
  const built = await page.request.get(
    (await box.inputValue()).match(/https?:\/\/\S+\/brief\?\S+/)![0],
  );
  const builtText = await built.text();
  expect(builtText).toContain('Build: Built out');
  expect(builtText).toContain('leftToAi: true on every screen');
  await levels.getByRole('radio', { name: 'Just the list' }).click();
  await expect(box).toHaveValue(/mode=list/);
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
  // An empty canvas leads with the agent, at the same three levels; its brief says the board is empty.
  await page.getByRole('button', { name: 'Plan it with your agent' }).click();
  const emptyDialog = page.getByRole('dialog', { name: 'Hand this to your agent' });
  await expect(
    emptyDialog.getByRole('radiogroup', { name: 'How much the agent builds' }).getByRole('radio'),
  ).toHaveCount(3);
  const empty = await emptyDialog
    .getByRole('textbox', { name: 'Prompt for your agent' })
    .inputValue();
  expect(empty).toContain('mode=frames');
  const emptyBrief = await page.request.get(empty.match(/https?:\/\/\S+\/brief\?\S+/)![0]);
  expect(await emptyBrief.text()).toContain('This board is empty.');
});
