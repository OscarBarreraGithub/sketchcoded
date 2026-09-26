import { test, expect, chromium, type Page } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Project } from '../../shared/model';
const headers = { 'X-Drawcode-Client': 'local' };
async function fresh(page: Page, customize?: (p: Project) => void) {
  const response = await page.request.post('http://127.0.0.1:5174/api/projects', {
    headers,
    data: { name: 'Sketchcoded usability', demo: true },
  });
  expect(response.ok()).toBeTruthy();
  let p: Project = await response.json();
  if (customize) {
    customize(p);
    const saved = await page.request.put(`http://127.0.0.1:5174/api/projects/${p.id}`, {
      headers,
      data: p,
    });
    expect(saved.ok()).toBeTruthy();
    p = await saved.json();
  }
  await page.addInitScript((id) => localStorage.setItem('drawcode:last-board', id), p.id);
  await page.goto('http://127.0.0.1:5174/');
  await expect(page.getByRole('heading', { name: p.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fit board', exact: true }).click();
  return p;
}
async function close(page: Page) {
  await page.getByRole('button', { name: 'Close dialog', exact: true }).last().click();
}
function withDetail(p: Project) {
  p.screens.push({
    id: 'detail',
    assetId: p.screens[1].assetId,
    title: 'Chat row close-up',
    purpose: 'Avatar, name, last message and unread count.',
    entry: false,
    role: 'screen',
  });
  p.layout.detail = { x: 1400, y: 80, width: 320 };
  p.pins.push({
    id: 'detail-context',
    screenId: 'detail',
    kind: 'detail',
    detailTarget: 'inbox',
    x: 0.7,
    y: 0.6,
    title: 'See in context',
    description: 'Show where this row appears in the full screen.',
  });
}

test('outline lists shared destinations once, follows loops, searches pins and returns to a focused board', async ({
  page,
}) => {
  await fresh(page);
  await page.getByRole('button', { name: 'App outline', exact: true }).click();
  await expect(page.locator('.outline-screen')).toHaveCount(4);
  const inbox = page
    .locator('.outline-screen')
    .filter({ has: page.locator('summary strong', { hasText: 'Your people' }) })
    .first();
  await inbox.locator('summary').first().click();
  await inbox.locator('.outline-pin > summary').click();
  await expect(inbox.locator('.outline-route')).toHaveCount(2);
  await inbox.getByRole('button', { name: 'A little conversation', exact: true }).click();
  const target = page.locator('.outline-screen.highlighted');
  await expect(target.locator('summary').first()).toContainText('A little conversation');
  await expect(target).toHaveAttribute('open', '');
  await target.locator('.outline-pin > summary').click();
  await expect(target.getByText('Previous screen', { exact: false })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search app outline' }).fill('blocked');
  await expect(page.locator('.outline-screen')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Search app outline' }).fill('no-such-sketch');
  await expect(page.getByText('No matching screens.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Search app outline' }).fill('');
  await target.getByRole('button', { name: 'Show on board', exact: true }).click();
  await expect(page.getByRole('main', { name: 'Design board' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Edit A little conversation', exact: true }),
  ).toBeInViewport();
  await page.getByRole('slider', { name: 'Board zoom', exact: true }).fill('135');
  const viewport = await page.locator('.board-world').getAttribute('style');
  await page.getByRole('button', { name: 'App outline', exact: true }).click();
  await page.getByRole('button', { name: 'Board', exact: true }).click();
  await expect(page.locator('.board-world')).toHaveAttribute('style', viewport!);
});

test('detail pin intake, board attachment, persistence, export and preview do not advance app navigation', async ({
  page,
}) => {
  const p = await fresh(page, withDetail);
  await page.getByRole('button', { name: 'App outline', exact: true }).click();
  const inbox = page
    .locator('.outline-screen')
    .filter({ has: page.locator('summary strong', { hasText: 'Your people' }) })
    .first();
  await inbox.locator('summary').first().click();
  await inbox.getByRole('button', { name: 'Edit screen', exact: true }).click();
  await page.getByRole('button', { name: 'Add a pin', exact: true }).first().click();
  const box = (await page.locator('.editable-image').boundingBox())!;
  await page
    .locator('.editable-image')
    .click({ position: { x: box.width * 0.7, y: box.height * 0.55 } });
  await page.getByRole('textbox', { name: 'Pin name', exact: true }).fill('Explain the chat row');
  await page
    .getByRole('textbox', { name: 'The idea', exact: true })
    .fill('A closer look at the arrangement inside each row.');
  await page.getByRole('combobox', { name: 'Pin purpose', exact: true }).selectOption('detail');
  await page.getByRole('button', { name: 'Choose detail on board', exact: true }).click();
  await expect(page.getByRole('main', { name: 'Design board' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Chat row close-up', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
  const saved: Project = await (await page.request.get(`/api/projects/${p.id}`)).json();
  const pin = saved.pins.find((pin) => pin.title === 'Explain the chat row')!;
  expect(pin.kind).toBe('detail');
  expect(pin.detailTarget).toBe('detail');
  expect(saved.screens.find((s) => s.id === 'detail')?.role).toBe('detail');
  expect(saved.transitions).toHaveLength(5);
  await page.reload();
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Preview starting screen' }).locator('option[value=detail]'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Try Let me in', exact: true }).click();
  await expect(page.locator('.preview-step')).toHaveText('1 steps');
  await page.getByRole('button', { name: 'Try Explain the chat row', exact: true }).click();
  await expect(page.getByAltText('Detail: Chat row close-up')).toBeVisible();
  await expect(page.getByText('Detail reference · you’re still on Your people')).toBeVisible();
  await page.getByRole('button', { name: 'View detail: See in context', exact: true }).click();
  await expect(page.getByAltText('Detail: Your people', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Chat row close-up', exact: true }).click();
  await expect(page.getByAltText('Detail: Chat row close-up', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Your people', exact: true }).click();
  await expect(page.getByAltText('Preview: Your people')).toBeVisible();
  await expect(page.locator('.preview-step')).toHaveText('1 steps');
  await close(page);
  await page.getByRole('button', { name: 'App outline', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Detail sketches', exact: false })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project', exact: true }).click();
  const zip = await download;
  expect(zip.suggestedFilename()).toMatch(/\.sketchcoded\.zip$/);
  await page.locator('.project-trigger').click();
  await page.getByRole('button', { name: 'Import a project', exact: true }).click();
  await page.locator('input[type=file][accept=".zip"]').setInputFiles((await zip.path())!);
  await expect(
    page.getByRole('heading', { name: 'Sketchcoded usability (imported)', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await page.getByRole('button', { name: 'Try Let me in', exact: true }).click();
  await page.getByRole('button', { name: 'Try Explain the chat row', exact: true }).click();
  await expect(page.getByAltText('Detail: Chat row close-up')).toBeVisible();
});

test('library shows usage, filters unused images and locates an existing placement', async ({
  page,
}) => {
  await fresh(page);
  await expect(page.locator('.asset-usage')).toHaveCount(4);
  await expect(page.locator('.library-group.new .asset')).toHaveCount(0);
  await expect(page.locator('.library-group.used .asset')).toHaveCount(4);
  const used = page.locator('.library-group.used');
  if (!(await used.evaluate((el) => (el as HTMLDetailsElement).open)))
    await used.locator('summary').click();
  await page.locator('.asset-usage').first().click();
  await page.locator('.asset-placements button').first().click();
  await expect(
    page.getByRole('button', { name: 'Edit A warm welcome', exact: true }),
  ).toBeInViewport();
  const slider = page.getByRole('slider', { name: 'Board zoom', exact: true });
  await slider.fill('120');
  await expect(page.locator('.zoom-value')).toHaveText('120%');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('121');
  const board = page.getByRole('main', { name: 'Design board' }),
    box = (await board.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 150);
  await page.mouse.wheel(0, -150);
  await expect.poll(() => slider.inputValue()).not.toBe('121');
  const before = await slider.inputValue();
  await page.keyboard.down('Shift');
  await page.mouse.wheel(0, 80);
  await page.keyboard.up('Shift');
  await expect(slider).toHaveValue(before);
});

test('actual browser zoom retains navigation, large fields, readable long text and dialog controls', async () => {
  test.setTimeout(90000);
  const userDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sketchcoded-zoom-'));
  const extension = path.resolve('tests/fixtures/zoom-extension');
  const context = await chromium.launchPersistentContext(userDir, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const page = await context.newPage();
    await fresh(page);
    for (const factor of [1.25, 1.5, 2, 2.5]) {
      await worker.evaluate(async (factor) => {
        const c = (
          globalThis as unknown as {
            chrome: {
              tabs: {
                query: (query: object) => Promise<{ id: number; url?: string }[]>;
                setZoom: (tab: number, zoom: number) => Promise<void>;
              };
            };
          }
        ).chrome;
        const tabs = await c.tabs.query({});
        const tab = tabs.find((t) => t.url?.startsWith('http://127.0.0.1:5174'))!;
        await c.tabs.setZoom(tab.id, factor);
      }, factor);
      await expect.poll(() => page.evaluate(() => window.devicePixelRatio)).toBeCloseTo(factor, 1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.getByRole('button', { name: 'App outline', exact: true }).click();
      await page.getByRole('button', { name: 'Expand screens', exact: true }).click();
      const first = page.locator('.outline-screen').first();
      await first.getByRole('button', { name: 'Edit screen', exact: true }).click();
      await page
        .getByRole('textbox', { name: 'Paper title', exact: true })
        .fill('Welcome at every zoom');
      const longText = page.getByRole('textbox', { name: 'What is this screen for?', exact: true });
      await longText.fill(
        'A long, useful explanation should stay readable without a tiny inner scrollbar.\n'.repeat(
          35,
        ),
      );
      expect(await longText.evaluate((el) => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
      const select = page.getByRole('combobox', { name: 'Screen type', exact: true });
      await select.scrollIntoViewIfNeeded();
      expect((await select.boundingBox())!.height).toBeCloseTo(48, 1);
      expect(
        await page.locator('.modal-content').evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await expect(
        page.getByRole('button', { name: 'Close dialog', exact: true }),
      ).toBeInViewport();
      await close(page);
      await first.locator('.outline-pin > summary').click();
      await first.getByRole('button', { name: 'Signed in', exact: false }).click();
      const fields = page.getByRole('dialog').locator('select');
      const sizes = await fields.evaluateAll((els) =>
        els.map((el) => ({
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        })),
      );
      expect(sizes).toHaveLength(3);
      for (const size of sizes) {
        expect(size.height).toBeCloseTo(48, 1);
        expect(size.width).toBeGreaterThan(240);
        expect(size.width).toBeCloseTo(sizes[0].width, 1);
      }
      const details = page.getByRole('textbox', { name: 'The details', exact: true });
      await details.fill(
        'Clear rules about the selected person and the current session.\n'.repeat(30),
      );
      expect(await details.evaluate((el) => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
      await page
        .getByRole('textbox', { name: 'What data or information is needed?', exact: true })
        .fill('A session ID and the selected person.');
      await page
        .getByRole('button', { name: 'Save connection', exact: true })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole('button', { name: 'Save connection', exact: true }),
      ).toBeInViewport();
      await page.getByRole('button', { name: 'Save connection', exact: true }).click();
      await page.getByRole('button', { name: 'Review flow', exact: false }).click();
      await expect(
        page.getByRole('button', { name: 'Close flow review', exact: true }),
      ).toBeInViewport();
      await page.getByRole('button', { name: 'Close flow review', exact: true }).click();
      if (factor >= 2) {
        await page.getByRole('button', { name: 'Sketch library', exact: true }).click();
        await expect(page.locator('.library-group.new > summary')).toBeVisible();
        await page.getByRole('button', { name: 'Close sketch library', exact: true }).click();
      } else {
        await expect(page.locator('.library-group.new > summary')).toBeVisible();
        if (factor === 1.5)
          await expect(page.locator('.left-column .scroll-more.below')).toBeVisible();
      }
      await page.getByRole('button', { name: 'Board', exact: true }).click();
      await page.getByRole('slider', { name: 'Board zoom', exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('slider', { name: 'Board zoom', exact: true })).toBeInViewport();
      // Native tab zoom and Playwright's fullPage viewport resizing do not compose.
      // Capture the actual browser viewport directly, without altering device metrics.
      const cdp = await context.newCDPSession(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
      await fs.writeFile(
        `test-results/browser-zoom-${factor}.png`,
        Buffer.from(screenshot.data, 'base64'),
      );
      await cdp.detach();
    }
  } finally {
    await context.close();
    await fs.rm(userDir, { recursive: true, force: true });
  }
});
