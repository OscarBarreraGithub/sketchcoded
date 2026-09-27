import { test, expect } from '@playwright/test';
const headers = { 'X-Drawcode-Client': 'local' };

/**
 * A board whose frames are left to the AI is not a board of labels: Sketchcoded builds each frame
 * a page from the plan and Test flow walks the whole site. Only the redirects work.
 */
test('a board left to the AI is a site you can walk in Test flow', async ({ page }) => {
  const made = await (
    await page.request.post('/api/projects', { headers, data: { name: `Built ${Date.now()}` } })
  ).json();
  const project = await (await page.request.get(`/api/projects/${made.id}`)).json();
  const screen = (id: string, title: string, purpose: string, extra = {}) => ({
    id,
    assetId: null,
    title,
    purpose,
    entry: false,
    role: 'screen',
    leftToAi: true,
    ...extra,
  });
  project.screens = [
    screen('home', 'Home', 'Everything at a glance.', { entry: true }),
    screen('chats', 'Your conversations', 'Managers, workers and shared editors in one list.'),
    screen('unlock', 'Unlock this computer', 'Sign in to continue.', { role: 'auth' }),
  ];
  project.layout = {
    home: { x: 0, y: 0, width: 360 },
    chats: { x: 520, y: 0, width: 360 },
    unlock: { x: 1040, y: 0, width: 360 },
  };
  project.pins = [
    {
      id: 'p1',
      screenId: 'home',
      x: 0.86,
      y: 0.12,
      title: 'Open your conversations',
      description: 'One shortcut to every chat.',
      kind: 'interaction',
      provisional: true,
    },
    {
      id: 'p2',
      screenId: 'home',
      x: 0.86,
      y: 0.28,
      title: 'Unlock',
      description: 'Sign in again.',
      kind: 'interaction',
      provisional: true,
    },
    {
      id: 'p3',
      screenId: 'chats',
      x: 0.86,
      y: 0.12,
      title: 'Back home',
      description: 'Return.',
      kind: 'interaction',
      provisional: true,
    },
  ];
  project.transitions = [
    {
      id: 't1',
      pinId: 'p1',
      target: 'chats',
      summary: 'Open chats',
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'push',
      color: 'red',
    },
    {
      id: 't2',
      pinId: 'p2',
      target: 'unlock',
      summary: 'Sign in',
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'push',
      color: 'red',
    },
    {
      id: 't3',
      pinId: 'p3',
      target: null,
      summary: 'Back',
      condition: '',
      logic: '',
      context: '',
      fallback: false,
      navigation: 'back',
      color: 'red',
    },
  ];
  const idea = (id: string, title: string, detail: string, screenId: string) => ({
    id,
    title,
    detail,
    screenId,
    pinId: null,
    leadsTo: null,
    author: 'Agent',
    createdAt: new Date().toISOString(),
  });
  project.ideas = [
    idea('i1', 'Remaining, not used', 'Filled meters show what is left, on first open.', 'home'),
    idea('i2', 'Needs your attention', 'A compact count of urgent items.', 'home'),
    idea('i3', 'Computer health', 'Pressure and reservations, clearly labelled.', 'home'),
    idea('i4', 'Your email', 'The address you signed up with.', 'unlock'),
    idea('i5', 'Password', 'Or a passkey.', 'unlock'),
  ];
  project.ideas.push(
    ...Array.from({ length: 8 }, (_, i) =>
      idea(`x${i}`, `Section ${i + 1}`, 'Enough content that the page has to scroll.', 'chats'),
    ),
  );
  expect(
    (await page.request.put(`/api/projects/${made.id}`, { headers, data: project })).ok(),
  ).toBeTruthy();
  await page.goto(`/board/${made.id}`);
  await expect(page.getByRole('heading', { name: made.name, exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Test flow' }).click();
  const testflow = page.getByRole('dialog', { name: /Take your idea for a walk/ });
  await expect(testflow).toBeVisible();
  // The built page, not a list of planned ideas: a product bar, a heading, a lede and real buttons.
  const site = testflow.locator('.std-page');
  await expect(site).toBeVisible();
  await expect(site.locator('.std-product')).toHaveText(made.name);
  await expect(site.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
  await expect(site.getByText('Everything at a glance.')).toBeVisible();
  await expect(site.getByRole('heading', { name: 'Needs your attention', level: 2 })).toBeVisible();
  // Clicking a way onward follows the board's own yarn.
  await site.getByRole('button', { name: /Open your conversations/ }).click();
  await expect(testflow.locator('.preview-screen-title')).toContainText('Your conversations');
  await expect(testflow.getByText('1 steps')).toBeVisible();
  // The page scrolls inside itself; the dialog does not grow.
  const scrolls = await testflow
    .locator('.std-scroll')
    .evaluate((el) => el.scrollHeight > el.clientHeight + 4);
  expect(scrolls).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight),
  ).toBe(true);
  // Going back is a pin like any other.
  await testflow
    .locator('.std-page')
    .getByRole('button', { name: /Back home/ })
    .click();
  await expect(testflow.locator('.preview-screen-title')).toContainText('Home');
  // A sign-in frame becomes a form: its ideas are the fields.
  await site
    .getByRole('button', { name: /Unlock/ })
    .first()
    .click();
  await expect(testflow.locator('.std-page.shape-form')).toBeVisible();
  await expect(testflow.getByLabel('Your email')).toBeVisible();
  await expect(testflow.getByLabel('Password')).toHaveAttribute('type', 'password');
  // flow.md carries the same page for whoever builds it.
  const flow = await (await page.request.get(`/api/projects/${made.id}/flow.md`)).text();
  expect(flow).toContain('Standard page (what Test flow shows)');
  expect(flow).toContain('Main action: “Open your conversations” → Your conversations');
});
