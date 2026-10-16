import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration: Chromium-only pilot.
 *
 * Chromium only for the pilot. Services are owned and started by
 * test/playwright/run-local.sh (the shared local/CI launcher), not by
 * Playwright `webServer`, so local runs and CI use the same contract.
 *
 * Run-specific evidence (ticket 04): the launcher exports
 * PLAYWRIGHT_REPORT_DIR/PLAYWRIGHT_OUTPUT_DIR pointing into its
 * test/playwright/.artifacts/<run-id>/ directory, so every attempt keeps
 * original traces/screenshots/reports without shared-path overwrite. Local
 * defaults below preserve the documented test/playwright/report/ and
 * test/playwright/test-results/ paths when those variables are unset.
 *
 * Retries (ticket 04): PLAYWRIGHT_RETRIES defaults to 0 (benchmarks run with
 * zero retries). Routine CI permits at most one retry; first-attempt
 * failures, recovered attempts, and final failures stay distinguishable in
 * the per-attempt report. Values above 1 are rejected to keep that contract.
 *
 * See docs/e2e.md (canonical guide) and test/playwright/README.md.
 */
function resolveRetries(): number {
  const raw = process.env.PLAYWRIGHT_RETRIES;
  if (raw === undefined || raw === '') {
    return 0;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`PLAYWRIGHT_RETRIES must be 0 or 1 (got ${JSON.stringify(raw)}).`);
  }
  return parsed;
}

const workers = process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : 1;
const reportDir = process.env.PLAYWRIGHT_REPORT_DIR || 'test/playwright/report';
const resultsDir = process.env.PLAYWRIGHT_OUTPUT_DIR || 'test/playwright/test-results';

export default defineConfig({
  testDir: './test/playwright/specs',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: resolveRetries(),
  workers,
  reporter: [
    ['list'],
    ['html', { outputFolder: `${reportDir}/html`, open: 'never' }],
    ['json', { outputFile: `${reportDir}/results.json` }],
    ['junit', { outputFile: `${reportDir}/results.xml` }],
  ],
  outputDir: resultsDir,
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
