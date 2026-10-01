import { test, expect, chromium } from '@playwright/test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createLittleChat } from './little-chat';

test('both laptop sizes retain working room, all tutorial panels and generated pages at actual tab zoom', async () => {
  test.setTimeout(150000);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sketchcoded-acceptance-'));
  const extension = path.resolve('tests/fixtures/zoom-extension');
  const context = await chromium.launchPersistentContext(dir, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 900 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  const results: unknown[] = [];
  try {
    const page = await context.newPage();
    const headers = { 'X-Drawcode-Client': 'local' };
    const name = `Acceptance ${Date.now()}`;
    const p = await createLittleChat(page.request, name, 'http://127.0.0.1:5174');
    const full = await (
      await page.request.get(`http://127.0.0.1:5174/api/projects/${p.id}`)
    ).json();
    full.screens[0].assetId = null;
    full.screens[0].leftToAi = true;
    full.screens[0].purpose =
      'A standard page with a long description that remains readable when the browser is zoomed. '.repeat(
        8,
      );
    await page.request.put(`http://127.0.0.1:5174/api/projects/${p.id}`, { headers, data: full });
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(size);
      for (const factor of [1.25, 1.5, 2, 2.5]) {
        await page.goto('http://127.0.0.1:5174');
        await worker.evaluate(async (factor) => {
          const c = (globalThis as any).chrome;
          const tab = (await c.tabs.query({})).find((t: any) => t.url?.includes(':5174'));
          await c.tabs.setZoom(tab.id, factor);
        }, factor);
        await expect
          .poll(() => page.evaluate(() => window.devicePixelRatio))
          .toBeCloseTo(factor, 1);
        await page.getByRole('button', { name: 'Try the six-step tutorial' }).click();
        const dialog = page.getByRole('dialog', { name: 'Make your first connection' });
        const initial = await dialog.boundingBox();
        for (let i = 1; i <= 6; i++) {
          await page.getByRole('button', { name: new RegExp(`^Step ${i}:`) }).click();
          expect((await dialog.boundingBox())!.height).toBeCloseTo(initial!.height, 1);
          expect(
            await dialog
              .locator('.modal-content')
              .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          ).toBe(true);
          await expect(
            page.getByRole('button', { name: 'Close dialog', exact: true }),
          ).toBeInViewport();
        }
        await page.getByRole('button', { name: 'Finish tutorial', exact: true }).click();
        await page.getByRole('button', { name: new RegExp(`${name}.*4 screens`) }).click();
        const board = page.getByRole('main', { name: 'Design board' });
        const box = await board.boundingBox();
        const view = await page.evaluate(() => ({
          w: innerWidth,
          h: innerHeight,
          sw: document.documentElement.scrollWidth,
          sh: document.documentElement.scrollHeight,
        }));
        expect(box!.height).toBeGreaterThanOrEqual(view.h * 0.48);
        expect(view.sw).toBeLessThanOrEqual(view.w);
        expect(view.sh).toBeLessThanOrEqual(view.h);
        await expect(
          page.getByRole('slider', { name: 'Board zoom', exact: true }),
        ).toBeInViewport();
        await page.getByRole('button', { name: 'Review flow', exact: false }).click();
        await page.getByRole('button', { name: 'Close flow review' }).click();
        await page.getByRole('button', { name: 'Test flow', exact: false }).click();
        await expect(page.locator('.std-page')).toBeVisible();
        const rendered = await page.locator('.std-page').boundingBox();
        const stage = await page.locator('.stage-fit').boundingBox();
        expect(rendered!.y + rendered!.height).toBeLessThanOrEqual(stage!.y + stage!.height + 1);
        expect(
          await page.locator('.std-scroll').evaluate((el) => el.scrollHeight > el.clientHeight),
        ).toBe(true);
        await expect(page.locator('.std-page > .scroll-more.below')).toBeVisible();

        expect((await page.locator('.std-page').boundingBox())!.height).toBeGreaterThanOrEqual(
          view.h * 0.4,
        );
        expect(
          await page.locator('.std-page').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        ).toBe(true);
        await expect(
          page.getByRole('button', { name: 'Close dialog', exact: true }),
        ).toBeInViewport();
        await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
        const cdp = await context.newCDPSession(page);
        const shot = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
        });
        await fs.writeFile(
          `test-results/acceptance-${size.width}-${factor}.png`,
          Buffer.from(shot.data, 'base64'),
        );
        await cdp.detach();
        results.push({ size, factor, board: box, view });
        await page.getByRole('button', { name: 'Back to your boards' }).click();
      }
    }
    await fs.writeFile(
      'test-results/acceptance-measurements.json',
      JSON.stringify(results, null, 2),
    );
  } finally {
    await context.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
