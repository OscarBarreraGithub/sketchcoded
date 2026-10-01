import { test, expect, type Page } from '@playwright/test';
import { createLittleChat } from './little-chat';
const headers = { 'X-Drawcode-Client': 'local' };
async function fresh(page: Page) {
  const project = await createLittleChat(page.request, 'Agent handoff');
  await page.addInitScript((id) => localStorage.setItem('drawcode:last-board', id), project.id);
  await page.goto(`/board/${project.id}`);
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
  // Three lines: the subject, the brief's address, and that what follows is the task.
  expect(text.split('\n')).toHaveLength(3);
  expect(text).toMatch(/Anything I add below this line is part of the task\.$/);
  await expect(dialog.getByRole('status')).toContainText('Copied to your clipboard');
  // Rule: when the prompt continues off screen, the terminal says so, twice: a pill over the
  // text and a "scrolls" chip in its bar, which turns into "end of prompt" at the bottom.
  const box = dialog.getByRole('textbox', { name: 'Prompt for your agent' });
  const chip = dialog.locator('.agent-terminal-scrolls');
  if (await box.evaluate((el) => el.scrollHeight > el.clientHeight + 4)) {
    await expect(
      dialog.getByRole('button', { name: 'Scroll down for the rest of the prompt', exact: false }),
    ).toBeVisible();
    await expect(chip).toHaveText(/scrolls/);
    await box.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(chip).toHaveText('end of prompt');
    await expect(
      dialog.getByRole('button', { name: 'Scroll up for the start of the prompt', exact: false }),
    ).toBeVisible();
  } else await expect(chip).toHaveText('all of it fits');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  const url = text.match(/https?:\/\/\S+\/brief\?\S+/)![0];
  const brief = await page.request.get(url);
  expect(brief.ok()).toBeTruthy();
  expect(brief.headers()['content-type']).toContain('text/markdown');
  const body = await brief.text();
  expect(body).toContain('# Sketchcoded task brief');
  expect(body).toContain('## The task');
  // The brief carries the rules and the skills the prompt no longer repeats.
  expect(body).toContain('/api/checklist.md');
  expect(body).toContain('/api/skills/');
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
    [/Sketchcoded task · the whole board · Board/, /brief\?view=board/],
  );
  expect(board.body).toContain('## The board at a glance');
  // The board's frames carry no agent button of their own; the screen editor has one per frame.
  await expect(page.locator('.screen-card .tell-agent')).toHaveCount(0);
  const library = await handoff(
    page,
    page
      .locator('.library-heading')
      .getByRole('button', { name: 'Tell the agent about the library' }),
    [/· the sketch library \(\d+ sketches, \d+ unused\) · Sketch library/, /brief\?view=library/],
  );
  expect(library.body).toContain('## The library');
  // Boards menu: a board for another project.
  await page.locator('.project-trigger').click();
  const newBoard = await handoff(
    page,
    page.locator('.project-menu').getByRole('button', { name: 'New board with your agent' }),
    [
      /· a new board for another project on this computer · frames and strings · Boards/,
      /brief\?view=boards/,
    ],
  );
  // The task, with the create step, is in the brief; the prompt only points at it.
  expect(newBoard.body).toContain('POST http://127.0.0.1:5174/api/projects');
  expect(newBoard.body).toContain('## Boards on this computer');
  expect(newBoard.body).toContain('Build: Frames and strings');
  await expect(page.locator('.project-menu')).toHaveCount(0);
  // Ideas panel (left column).
  const ideas = page.locator('.ideas-panel');
  if (!(await ideas.getByRole('button', { name: 'Tell the agent' }).isVisible()))
    await ideas.locator('.ideas-heading').click();
  await handoff(page, ideas.getByRole('button', { name: 'Tell the agent' }), [
    /· the whole plan · Plan/,
  ]);
  // Plan: the whole plan and one frame's folder.
  await page.locator('.view-switch').getByRole('button', { name: /^Plan/ }).click();
  await handoff(
    page,
    page.locator('.planning-summary').getByRole('button', { name: 'Tell the agent' }),
    [/· the whole plan · Plan/, /brief\?view=plan$/m],
  );
  await page.getByLabel('New idea').fill('Nudge me');
  await page.getByRole('button', { name: 'Add idea', exact: true }).click();
  const ideaCard = page.locator('.idea-card', { hasText: 'Nudge me' });
  // The brief is served from the saved board; let the autosave land first.
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  const ideaText = await handoff(page, ideaCard.getByRole('button', { name: 'Tell the agent' }), [
    /· I\d+ “Nudge me”, not on a frame yet \([^)]+\) · Plan/,
    /brief\?view=plan&idea=/,
  ]);
  expect(ideaText.body).toContain('## The idea');
  const folder = page.locator('.folder-actions').first();
  const folderText = await handoff(page, folder.getByRole('button', { name: 'Tell the agent' }), [
    /· P\d+ “[^”]+” \([^)]+\) · Plan/,
    /brief\?view=plan&screen=/,
  ]);
  expect(folderText.body).toContain('what should go on this frame');
  // Outline: the whole outline and one screen.
  await page.getByRole('button', { name: 'App outline', exact: true }).click();
  await handoff(
    page,
    page.locator('.outline-actions').getByRole('button', { name: 'Tell the agent' }),
    [/· the whole outline · App outline/],
  );
  await page.getByRole('button', { name: 'Expand screens', exact: true }).click();
  const first = page.locator('.outline-screen').first();
  await handoff(page, first.getByRole('button', { name: 'Tell the agent' }), [
    /· P\d+ “[^”]+” \([^)]+\) · App outline/,
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
    [
      /· P\d+ “[^”]+” \([^)]+\) · Screen editor/,
      /brief\?view=screen-editor&screen=[^&]+&layout=web/,
    ],
  );
  expect(frame.text).toContain(`“${title}”`);
  expect(frame.body).toMatch(new RegExp(`## The frame: P\\d+ ${title}`));
  expect(frame.body).toContain('- Web drawing: http://127.0.0.1:5174/assets/');
  await editor.locator('.pin-row').first().click();
  const pin = await handoff(
    page,
    editor.locator('.editor-toolbar').getByRole('button', { name: 'Tell the agent' }),
    [/· P\d+ pin 1 “/, /brief\?view=screen-editor&screen=[^&]+&pin=/],
  );
  expect(pin.body).toMatch(/Selected pin: P\d+ pin 1/);
  // Connection editor, opened from the pin's yarn list.
  await editor.locator('.connection-row').first().click();
  const edge = page.getByRole('dialog', { name: 'Follow this thread' });
  await expect(edge).toBeVisible();
  const yarn = await handoff(page, edge.getByRole('button', { name: 'Tell the agent' }), [
    /· yarn “[^”]*” from P\d+ pin \d+ “[^”]*” to P\d+ “[^”]+” \([^)]+\) · Connection editor/,
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
    [/· \d+ open findings? · Review flow/, /brief\?view=review$/m],
  );
  // The first finding is open by default; open one only when none is.
  if (!(await review.locator('.issue-body').count()))
    await review.locator('.issue-heading').first().click();
  const finding = await handoff(
    page,
    review.locator('.issue-body').getByRole('button', { name: 'Tell the agent' }),
    [/· finding “[^”]+” \([^)]+\) · Review flow/, /brief\?view=review&finding=/],
  );
  expect(finding.body).toContain('fingerprint');
  await page.getByRole('button', { name: 'Close flow review', exact: true }).click();
  // Test flow: the current screen and the trail.
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Test the flow' });
  await preview.locator('.preview-pin').first().click();
  const choice = preview.locator('.branch-choice').first();
  if (await choice.count()) await choice.click();
  const walk = await handoff(
    page,
    preview.locator('.preview-footer').getByRole('button', { name: 'Tell the agent' }),
    [
      /· Test flow at P\d+ “[^”]+” after 1 step/,
      /brief\?view=test-flow&screen=[^&]+&layout=web&trail=/,
    ],
  );
  expect(walk.body).toContain('## The trail');
  expect(walk.body).toMatch(/1\. P\d+ “[^”]+” → pin \d+ “/);
});

test('the open board picks up a change the agent wrote, when nothing is unsaved', async ({
  page,
}) => {
  const project = await fresh(page);
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  const current = await (await page.request.get(`/api/projects/${project.id}`)).json();
  const renamed = await page.request.put(`/api/projects/${project.id}`, {
    headers,
    data: { ...current, name: 'Renamed by the agent' },
  });
  expect(renamed.ok()).toBeTruthy();
  await expect(
    page.getByRole('heading', { name: 'Renamed by the agent', exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Updated from your agent', { exact: false })).toBeVisible();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
});
