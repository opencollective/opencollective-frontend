import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration (ticket 02: fresh Linux smoke).
 *
 * Chromium only for the pilot. Services are owned and started by
 * test/playwright/run-local.sh (the shared local/CI launcher), not by
 * Playwright `webServer`, so local runs and CI use the same contract.
 *
 * See docs/e2e.md (canonical guide) and test/playwright/README.md.
 */
const workers = process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : 1;

export default defineConfig({
  testDir: './test/playwright',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test/playwright/report/html', open: 'never' }],
    ['json', { outputFile: 'test/playwright/report/results.json' }],
    ['junit', { outputFile: 'test/playwright/report/results.xml' }],
  ],
  outputDir: 'test/playwright/test-results',
  use: {
    baseURL: process.env.WEBSITE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1200, height: 1660 },
    locale: 'en-US',
    timezoneId: 'UTC',
    // Reuse the existing Cypress selector contract (`data-cy`).
    testIdAttribute: 'data-cy',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
});
