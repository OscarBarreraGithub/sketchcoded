import { test, expect } from '@playwright/test';
const headers = { 'X-Drawcode-Client': 'local' };

/**
 * A color is a category of yarn. Filtering to one shows that journey and lets the rest of the
 * board step back: its yarn fades, and the frames the category never touches shrink and dull
 * without moving, so the shape of the board is never lost.
 */
test('threads filter the board by category, and the categories can be named', async ({ page }) => {
  const made = await (
    await page.request.post('/api/projects', { headers, data: { name: `Threads ${Date.now()}` } })
  ).json();
  const project = await (await page.request.get(`/api/projects/${made.id}`)).json();
  for (let i = 0; i < 6; i++) {
    const id = `f${i}`;
    project.screens.push({
      id,
      assetId: null,
      title: `Frame ${i + 1}`,
      purpose: 'Planned',
      entry: i === 0,
      role: 'screen',
    });
    project.layout[id] = { x: (i % 3) * 520, y: Math.floor(i / 3) * 440, width: 360 };
  }
  // Two on the main path, one branch. Frames 4 and 5 are on neither.
  const thread = (n: number, from: string, to: string, color: string) => {
    project.pins.push({
      id: `pin${n}`,
      screenId: from,
      x: 0.86,
      y: 0.12 + n * 0.16,
      title: `Way ${n}`,
      description: 'A way onward.',
      kind: 'interaction',
      provisional: true,
    });
    project.transitions.push({
      id: `yarn${n}`,
      pinId: `pin${n}`,
      target: to,
      summary: `Thread ${n}`,
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'push',
      color,
    });
  };
  thread(0, 'f0', 'f1', 'red');
  thread(1, 'f1', 'f2', 'red');
  thread(2, 'f0', 'f3', 'gold');
  project.colorLabels = { red: 'Main path', gold: 'Branch' };
  expect(
    (await page.request.put(`/api/projects/${made.id}`, { headers, data: project })).ok(),
  ).toBeTruthy();
  await page.goto(`/board/${made.id}`);
  await expect(page.getByRole('heading', { name: made.name, exact: true })).toBeVisible();
  // The legend names the categories the board actually uses.
  await expect(page.locator('.legend-category')).toHaveCount(2);
  await expect(page.locator('.legend-category').first()).toContainText('Main path');
  // The chrome above the board stays out of the way: the board gets most of the window.
  const room = await page.evaluate(() => {
    const board = document.querySelector('.board')!.getBoundingClientRect();
    return { top: Math.round(board.top), share: board.height / window.innerHeight };
  });
  expect(room.top).toBeLessThan(240);
  expect(room.share).toBeGreaterThan(0.65);

  await page.getByRole('button', { name: /^Threads/ }).click();
  const menu = page.locator('.category-menu');
  await expect(menu.getByRole('button', { name: /All threads/ })).toBeVisible();
  await menu.getByRole('button', { name: /Main path/ }).click();
  // Only the main path stays lit; the frames it never touches shrink in place.
  await expect(page.locator('.board.filtered')).toHaveCount(1);
  await page.waitForTimeout(400);
  const filtered = await page.evaluate(() => {
    const off = [...document.querySelectorAll<HTMLElement>('.screen-card.off-category')];
    const on = [...document.querySelectorAll<HTMLElement>('.screen-card:not(.off-category)')];
    const scale = (el: HTMLElement) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.round(m.a * 100) / 100;
    };
    return {
      off: off.map((el) => el.getAttribute('aria-label')),
      offScale: off.map(scale),
      onScale: on.map(scale),
      offOpacity: off.map((el) => Number(getComputedStyle(el).opacity)),
      litYarn: [...document.querySelectorAll('.yarn-thread:not(.off-category)')].length,
      fadedYarn: [...document.querySelectorAll('.yarn-thread.off-category')].length,
    };
  });
  // Frames 5 and 6 are on no thread of this category; frame 4 is the branch's destination.
  expect(filtered.off).toEqual(['Screen: Frame 4', 'Screen: Frame 5', 'Screen: Frame 6']);
  expect(filtered.offScale.every((s) => s > 0.8 && s < 0.95)).toBe(true);
  expect(filtered.onScale.every((s) => s === 1)).toBe(true);
  expect(filtered.offOpacity.every((o) => o > 0.2 && o < 0.7)).toBe(true);
  expect(filtered.litYarn).toBe(2);
  expect(filtered.fadedYarn).toBe(1);
  await expect(page.locator('.legend-note')).toContainText('2 threads · 3 of 6 frames');
  // Nothing moved: a dulled frame is still where it was.
  const stillThere = await page.evaluate(() => {
    const el = document.querySelector('.screen-card.off-category')!;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  await page.getByRole('button', { name: 'Threads: Main path' }).click();
  await page
    .locator('.category-menu')
    .getByRole('button', { name: /All threads/ })
    .click();
  await expect(page.locator('.board.filtered')).toHaveCount(0);
  await page.waitForTimeout(400);
  const back = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.screen-card')].find(
      (c) => c.getAttribute('aria-label') === 'Screen: Frame 4',
    )!;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  expect(Math.hypot(back.x - stillThere.x, back.y - stillThere.y)).toBeLessThan(2);

  // Naming a category: the legend and the menu follow, and it is saved.
  await page.getByRole('button', { name: /^Threads/ }).click();
  await page
    .locator('.category-menu')
    .getByRole('button', { name: /Name and add categories/ })
    .click();
  const dialog = page.getByRole('dialog', { name: 'What the threads mean.' });
  await dialog.getByLabel('Name for the blue threads').fill('Deep dive');
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.getByRole('button', { name: /^Threads/ }).click();
  await expect(page.locator('.category-menu')).toContainText('Deep dive');
  const saved = await (await page.request.get(`/api/projects/${made.id}`)).json();
  expect(saved.colorLabels.blue).toBe('Deep dive');
});
