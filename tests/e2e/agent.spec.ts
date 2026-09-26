import { test, expect, type Page } from '@playwright/test';
const headers = { 'X-Drawcode-Client': 'local' };
async function fresh(page: Page) {
  const response = await page.request.post('/api/projects', {
    headers,
    data: { name: 'Agent handoff', demo: true },
  });
  expect(response.ok()).toBeTruthy();
  const project = (await response.json()) as { id: string; name: string };
  await page.addInitScript((id) => localStorage.setItem('drawcode:last-board', id), project.id);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: project.name, exact: true })).toBeVisible();
  return project;
}
const close = (page: Page) =>
  page.getByRole('button', { name: 'Close dialog', exact: true }).last().click();
/** Click a Tell the agent button, read the prompt, check the clipboard and the brief it points at. */
async function handoff(page: Page, button: ReturnType<Page['getByRole']>, expectations: RegExp[]) {
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Hand this to your agent' });
  await expect(dialog).toBeVisible();
  const text = await dialog.getByRole('textbox', { name: 'Prompt for your agent' }).inputValue();
  for (const e of expectations) expect(text).toMatch(e);
  expect(text).toContain('/api/checklist.md');
  await expect(dialog.getByRole('status')).toContainText('Copied to your clipboard');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  const url = text.match(/https?:\/\/\S+\/brief\?\S+/)![0];
  const brief = await page.request.get(url);
  expect(brief.ok()).toBeTruthy();
  expect(brief.headers()['content-type']).toContain('text/markdown');
  const body = await brief.text();
  expect(body).toContain('# Sketchcoded task brief');
  expect(body).toContain('## The task');
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();
  return { text, body };
}

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('every view hands its task to the agent, and the agent can read everything it points at', async ({
  page,
}) => {
  test.setTimeout(150000);
  const project = await fresh(page);
  // The agent's reading list is served by the running app.
  for (const path of [
    `/api/projects/${project.id}/flow.md`,
    `/api/projects/${project.id}/outline.md`,
    '/api/checklist.md',
    '/api/skills/describe-pins.md',
  ]) {
    const response = await page.request.get(path);
    expect(response.ok(), path).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/markdown');
  }
  const list = await (await page.request.get('/api/skills')).json();
  expect(list.map((s: { id: string }) => s.id)).toContain('talk-to-sketchcoded');
  expect((await page.request.get('/api/skills/nope.md')).status()).toBe(404);

  // Board.
  await page.getByRole('button', { name: 'Fit board', exact: true }).click();
  const board = await handoff(
    page,
    page.locator('.view-toolbar').getByRole('button', { name: 'Tell the agent' }),
    [/Sketchcoded task · Board · the whole board/, /brief\?view=board/],
  );
  expect(board.body).toContain('## The board at a glance');
  // Ideas panel (left column).
  const ideas = page.locator('.ideas-panel');
  if (!(await ideas.getByRole('button', { name: 'Tell the agent' }).isVisible()))
    await ideas.locator('.ideas-heading').click();
  await handoff(page, ideas.getByRole('button', { name: 'Tell the agent' }), [
    /· Plan · the whole plan/,
  ]);
  // Plan: the whole plan and one frame's folder.
  await page.locator('.view-switch').getByRole('button', { name: /^Plan/ }).click();
  await handoff(
    page,
    page.locator('.planning-summary').getByRole('button', { name: 'Tell the agent' }),
    [/· Plan · the whole plan/, /brief\?view=plan$/m],
  );
  const folder = page.locator('.folder-actions').first();
  const folderText = await handoff(page, folder.getByRole('button', { name: 'Tell the agent' }), [
    /· Plan · frame “/,
    /brief\?view=plan&screen=/,
  ]);
  expect(folderText.text).toContain('what should go on this frame');
  // Outline: the whole outline and one screen.
  await page.getByRole('button', { name: 'App outline', exact: true }).click();
  await handoff(
    page,
    page.locator('.outline-actions').getByRole('button', { name: 'Tell the agent' }),
    [/· App outline · the whole outline/],
  );
  await page.getByRole('button', { name: 'Expand screens', exact: true }).click();
  const first = page.locator('.outline-screen').first();
  await handoff(page, first.getByRole('button', { name: 'Tell the agent' }), [
    /· App outline · frame “/,
    /brief\?view=outline&screen=/,
  ]);
  // Screen editor: the frame, then a selected pin.
  await first.getByRole('button', { name: 'Edit screen', exact: true }).click();
  const editor = page.getByRole('dialog').first();
  const title = await editor
    .getByRole('textbox', { name: 'Paper title', exact: true })
    .inputValue();
  const frame = await handoff(
    page,
    editor.locator('.editor-toolbar').getByRole('button', { name: 'Tell the agent' }),
    [/· Screen editor · frame “/, /brief\?view=screen-editor&screen=[^&]+&layout=web/],
  );
  expect(frame.text).toContain(`frame “${title}”`);
  expect(frame.body).toContain(`## ${title}`);
  expect(frame.body).toContain('- Web drawing: http://127.0.0.1:5174/assets/');
  await editor.locator('.pin-row').first().click();
  const pin = await handoff(
    page,
    editor.locator('.editor-toolbar').getByRole('button', { name: 'Tell the agent' }),
    [/· Screen editor · pin 1 “/, /brief\?view=screen-editor&screen=[^&]+&pin=/],
  );
  expect(pin.body).toContain('Selected pin: 1');
  // Connection editor, opened from the pin's yarn list.
  await editor.locator('.connection-row').first().click();
  const edge = page.getByRole('dialog', { name: 'Follow this thread' });
  await expect(edge).toBeVisible();
  const yarn = await handoff(page, edge.getByRole('button', { name: 'Tell the agent' }), [
    /· Connection editor · yarn “/,
    /brief\?view=connection-editor&screen=[^&]+&pin=[^&]+&transition=/,
  ]);
  expect(yarn.body).toContain('## The yarn');
  await edge.getByRole('button', { name: 'Cancel', exact: true }).click();
  // Opening the yarn from the editor replaces the editor; close whatever dialog is left.
  if (await page.getByRole('button', { name: 'Close dialog', exact: true }).count())
    await close(page);
  // Review flow: all open findings, then one finding.
  await page.locator('.review-button').click();
  const review = page.locator('.review-panel');
  await handoff(
    page,
    review.locator('.review-heading').getByRole('button', { name: 'Tell the agent' }),
    [/· Review flow · \d+ open finding/, /brief\?view=review$/m],
  );
  // The first finding is open by default; open one only when none is.
  if (!(await review.locator('.issue-body').count()))
    await review.locator('.issue-heading').first().click();
  const finding = await handoff(
    page,
    review.locator('.issue-body').getByRole('button', { name: 'Tell the agent' }),
    [/· Review flow · finding “/, /brief\?view=review&finding=/],
  );
  expect(finding.body).toContain('fingerprint');
  await page.getByRole('button', { name: 'Close flow review', exact: true }).click();
  // Test flow: the current screen and the trail.
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Take your idea for a walk.' });
  const walk = await handoff(
    page,
    preview.locator('.preview-footer').getByRole('button', { name: 'Tell the agent' }),
    [/· Test flow · Test flow at “/, /brief\?view=test-flow&screen=/],
  );
  expect(walk.body).toContain('## The trail');
});
