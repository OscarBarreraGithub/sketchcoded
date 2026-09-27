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
