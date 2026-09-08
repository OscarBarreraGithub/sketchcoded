import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
    timeout: 30000,
    env: { PORT: '5174', DRAWCODE_DATA_DIR: '.drawcode/ui-tests' },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
