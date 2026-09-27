import { test, expect } from '@playwright/test';
const headers = { 'X-Drawcode-Client': 'local' };

// Rule: text that grows to stay legible must never change the size of the item it sits on. A
// board of thirty planned frames, fitted to the window, is the case that broke: the cards' text
// inflated in board units, rows ran into each other, tape titles spilled out and Fit misjudged
// the extent. Planned cards now keep a fixed 2:1 box and their text steps aside under 40%.
test('thirty planned frames fit the window without overlapping, clipped titles or a hidden last row', async ({
  page,
}) => {
  const made = await (
    await page.request.post('/api/projects', { headers, data: { name: `Scale ${Date.now()}` } })
  ).json();
  const project = await (await page.request.get(`/api/projects/${made.id}`)).json();
  const titles = [
    'Home',
    'Your conversations',
    'Manager conversation',
    'Shared VS Code conversation',
    'Your personal agent',
    'Your projects',
  ];
  for (let i = 0; i < 30; i++) {
    const id = `f${i}`;
    project.screens.push({
      id,
      assetId: null,
      title: `${titles[i % titles.length]} ${i + 1}`,
      purpose: 'A planned page',
      entry: i === 0,
      role: 'screen',
    });
    project.layout[id] = { x: (i % 5) * 450, y: Math.floor(i / 5) * 380, width: 360 };
  }
  const saved = await page.request.put(`/api/projects/${made.id}`, { headers, data: project });
  expect(saved.ok()).toBeTruthy();
  await page.goto(`/board/${made.id}`);
  await expect(page.getByRole('heading', { name: made.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fit board' }).click();
  await page.waitForTimeout(500);
  const report = await page.evaluate(() => {
    const cards = [...document.querySelectorAll<HTMLElement>('.screen-card')];
    const rect = (el: Element) => el.getBoundingClientRect();
    let overlaps = 0;
    for (let i = 0; i < cards.length; i++)
      for (let j = i + 1; j < cards.length; j++) {
        const a = rect(cards[i]),
          b = rect(cards[j]);
        if (
          a.left < b.right - 1 &&
          b.left < a.right - 1 &&
          a.top < b.bottom - 1 &&
          b.top < a.bottom - 1
        )
          overlaps++;
      }
    const spilled = cards.filter((card) => {
      const t = rect(card.querySelector('.paper-title')!),
        c = rect(card);
      return t.left < c.left - 2 || t.right > c.right + 2;
    }).length;
    const lastBottom = Math.max(...cards.map((c) => rect(c).bottom));
    const controls = rect(document.querySelector('.board-controls')!);
    const eyebrow = document.querySelector('.frame-planned .eyebrow');
    return {
      cards: cards.length,
      overlaps,
      spilled,
      lastBottom,
      controlsTop: controls.top,
      zoom: document.querySelector('.board-controls')?.textContent ?? '',
      plannedTextHidden: eyebrow ? getComputedStyle(eyebrow).display === 'none' : null,
    };
  });
  expect(report.cards).toBe(30);
  expect(report.overlaps).toBe(0);
  expect(report.spilled).toBe(0);
  expect(report.lastBottom).toBeLessThanOrEqual(report.controlsTop);
  expect(report.plannedTextHidden).toBe(true);
});

// Rule: nothing overlaps, and when there are more labels than fit, they come on demand. A board
// of many threads rests quietly; clicking a frame picks it out, brings its own threads and labels
// forward, and steps the frames it is tied to a little further apart.
test('a crowded board rests quietly, and clicking a frame picks out its threads', async ({
  page,
}) => {
  const made = await (
    await page.request.post('/api/projects', { headers, data: { name: `Threads ${Date.now()}` } })
  ).json();
  const project = await (await page.request.get(`/api/projects/${made.id}`)).json();
  for (let i = 0; i < 10; i++) {
    const id = `f${i}`;
    project.screens.push({
      id,
      assetId: null,
      title: `Frame ${i + 1}`,
      purpose: 'Planned',
      entry: i === 0,
      role: 'screen',
    });
    project.layout[id] = { x: (i % 5) * 520, y: Math.floor(i / 5) * 440, width: 360 };
  }
  // Twelve threads: more than the board shows labels for at rest.
  for (let i = 0; i < 12; i++) {
    const from = `f${i % 10}`,
      to = `f${(i * 3 + 1) % 10}`;
    if (from === to) continue;
    project.pins.push({
      id: `pin${i}`,
      screenId: from,
      x: 0.86,
      y: 0.12 + (i % 5) * 0.16,
      title: `Way ${i + 1}`,
      description: 'A way onward.',
      kind: 'interaction',
      provisional: true,
    });
    project.transitions.push({
      id: `yarn${i}`,
      pinId: `pin${i}`,
      target: to,
      summary: `Thread ${i + 1}`,
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'push',
      color: 'red',
    });
  }
  expect(
    (await page.request.put(`/api/projects/${made.id}`, { headers, data: project })).ok(),
  ).toBeTruthy();
  await page.goto(`/board/${made.id}`);
  await expect(page.getByRole('heading', { name: made.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fit board' }).click();
  await page.waitForTimeout(400);
  const words = page.locator('.yarn-label-button:not(.as-dot)');
  const dots = page.locator('.yarn-label-button.as-dot');
  // At rest: no label words at all, a mark for each thread, and the legend says what to do.
  await expect(words).toHaveCount(0);
  await expect(dots).toHaveCount(project.transitions.length);
  await expect(page.locator('.legend-note')).toHaveText('Click a frame to follow its threads');
  const card = page.locator('.screen-card').first();
  const before = (await card.boundingBox())!;
  // Pick the first frame out: its own threads get their words, the rest stay quiet.
  const spot = await page.evaluate(() => {
    const board = document.querySelector('.board')!.getBoundingClientRect();
    for (const el of document.querySelectorAll('.screen-card')) {
      const r = el.getBoundingClientRect();
      const x = r.x + r.width / 2,
        y = r.y + r.height * 0.55;
      if (
        x > board.left + 100 &&
        x < board.right - 100 &&
        y > board.top + 100 &&
        y < board.bottom - 150
      )
        return { x, y, id: (el as HTMLElement).dataset.screen };
    }
    return null;
  });
  expect(spot).not.toBeNull();
  await page.mouse.click(spot!.x, spot!.y);
  await expect(page.locator('.screen-card.focused')).toHaveCount(1);
  const picked = await words.count();
  expect(picked).toBeGreaterThan(0);
  expect(picked).toBeLessThan(project.transitions.length);
  await expect(page.locator('.legend-note')).toContainText('click the cork to let go');
  // The frames it is tied to step aside a little; nothing else moves, and no card overlaps another.
  const tied = page.locator('.screen-card.tied').first();
  await expect(tied).toHaveCount(1);
  await page.waitForTimeout(400); // the step aside is animated
  const report = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.screen-card')].map((c) =>
      c.getBoundingClientRect(),
    );
    let overlaps = 0;
    for (let i = 0; i < cards.length; i++)
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i],
          b = cards[j];
        if (
          a.left < b.right - 1 &&
          b.left < a.right - 1 &&
          a.top < b.bottom - 1 &&
          b.top < a.bottom - 1
        )
          overlaps++;
      }
    const nudged = [...document.querySelectorAll<HTMLElement>('.screen-card.tied')].map(
      (c) => getComputedStyle(c).transform,
    );
    return { overlaps, nudged };
  });
  expect(report.overlaps).toBe(0);
  expect(report.nudged.every((t) => t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
  // A frame is never lost: nothing that was not tied to it moved at all.
  const after = (await card.boundingBox())!;
  if (
    !(await card.evaluate(
      (el) => el.classList.contains('tied') || el.classList.contains('focused'),
    ))
  )
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(1);
  // Clicking the cork lets go.
  await page.mouse.click(spot!.x, spot!.y - 200);
  await expect(page.locator('.screen-card.focused')).toHaveCount(0);
  await expect(words).toHaveCount(0);
});
