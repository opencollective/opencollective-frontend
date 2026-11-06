import type { BenchmarkRun } from './benchmark';
import { cypressTests, phasesFromTimeline, playwrightTests, runStatus, summarizeBenchmark } from './benchmark';

const attachment = (name: string, value: unknown) => ({
  name,
  contentType: 'application/json',
  body: Buffer.from(JSON.stringify(value)).toString('base64'),
});

describe('playwrightTests', () => {
  it('reads each test of a JSON report with its suite, outcome, duration and fixture/mail waits', () => {
    const report = {
      suites: [
        {
          file: 'expenses/process-expense.spec.ts',
          specs: [
            {
              title: 'approves',
              tests: [
                {
                  results: [
                    {
                      status: 'passed',
                      retry: 0,
                      duration: 4200,
                      attachments: [
                        attachment('fixture-timings', [{ recipe: 'expense-management', requestId: 'a', setupMs: 70 }]),
                        attachment('mail-timings', [{ to: 'x', subject: 'y', waitMs: 20 }]),
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          suites: [
            {
              title: 'with a Project',
              specs: [{ title: 'inherits', tests: [{ results: [{ status: 'failed', retry: 0, duration: 900 }] }] }],
            },
          ],
        },
        {
          file: 'vendors/vendor-scope.spec.ts',
          specs: [{ title: 'scoped', tests: [{ results: [{ status: 'passed', retry: 0, duration: 3000 }] }] }],
        },
        {
          file: 'smoke.spec.ts',
          specs: [{ title: 'home', tests: [{ results: [{ status: 'passed', duration: 1 }] }] }],
        },
      ],
    };
    expect(playwrightTests(report)).toEqual([
      { suite: 'expenses', title: 'approves', status: 'passed', durationMs: 4200, fixtureMs: 70, mailMs: 20 },
      {
        suite: 'expenses',
        title: 'with a Project › inherits',
        status: 'failed',
        durationMs: 900,
        fixtureMs: 0,
        mailMs: 0,
      },
      { suite: 'vendors', title: 'scoped', status: 'passed', durationMs: 3000, fixtureMs: 0, mailMs: 0 },
    ]);
  });
});

describe('cypressTests', () => {
  it('reads each test of a Cypress module API result, by spec file', () => {
    const result = {
      runs: [
        {
          spec: { relative: 'test/cypress/integration/27-expenses.test.ts' },
          tests: [
            { title: ['Expense flow', 'Downloads PDF'], state: 'passed', duration: 2500 },
            {
              title: ['Expense flow', 'Recurring', 'setup'],
              state: 'failed',
              attempts: [{ state: 'failed', duration: 800 }],
            },
          ],
        },
        {
          spec: { relative: 'test/cypress/integration/41-vendor-visibility.test.ts' },
          tests: [{ title: ['vendor visibility', 'edits'], state: 'pending', duration: 0 }],
        },
      ],
    };
    expect(cypressTests(result)).toEqual([
      {
        suite: 'expenses',
        title: 'Expense flow › Downloads PDF',
        status: 'passed',
        durationMs: 2500,
        fixtureMs: null,
        mailMs: null,
      },
      {
        suite: 'expenses',
        title: 'Expense flow › Recurring › setup',
        status: 'failed',
        durationMs: 800,
        fixtureMs: null,
        mailMs: null,
      },
      {
        suite: 'vendors',
        title: 'vendor visibility › edits',
        status: 'skipped',
        durationMs: 0,
        fixtureMs: null,
        mailMs: null,
      },
    ]);
  });
});

describe('phasesFromTimeline', () => {
  it('splits a timestamped launcher log into preflight, reset, startup, runner boot, browser and teardown', () => {
    const log = [
      '1000000\tBENCH start playwright',
      '1002000\t> Restoring disposable database (opencollective_pw_e2e) from API dump',
      '1030000\t> Running API migrations on opencollective_pw_e2e',
      '1040000\t> Starting API (/x)',
      '1080000\t> Running Playwright: specs (workers=3 retries=0)',
      '1200000\tBENCH end playwright exit=0',
    ].join('\n');
    // The browser report says tests ran from 1085 s to 1190 s.
    expect(phasesFromTimeline(log, { startMs: 1085000, durationMs: 105000 })).toEqual({
      preflightS: 2,
      resetS: 38,
      startupS: 40,
      runnerBootS: 5,
      browserS: 105,
      teardownS: 10,
      totalS: 200,
    });
  });

  it('leaves later phases empty when setup never reached the browser', () => {
    const log = [
      '0\tBENCH start cypress',
      '1000\t> Restoring disposable database',
      '9000\tBENCH end cypress exit=1',
    ].join('\n');
    expect(phasesFromTimeline(log, null)).toEqual({
      preflightS: 1,
      resetS: null,
      startupS: null,
      runnerBootS: null,
      browserS: null,
      teardownS: null,
      totalS: 9,
    });
  });
});

describe('summarizeBenchmark', () => {
  const phases = (totalS: number, browserS = totalS / 2) => ({
    preflightS: 1,
    resetS: 30,
    startupS: 20,
    runnerBootS: 3,
    browserS,
    teardownS: 2,
    totalS,
  });
  const test = (suite: 'expenses' | 'vendors', durationMs: number, status: 'passed' | 'failed' = 'passed') => ({
    suite,
    title: `${suite} ${durationMs}`,
    status,
    durationMs,
    fixtureMs: null,
    mailMs: null,
  });
  const run = (over: Partial<BenchmarkRun>): BenchmarkRun => ({
    batch: 'A',
    pair: 1,
    mode: 'serial',
    runner: 'cypress',
    position: 1,
    concurrency: 1,
    status: 'passed',
    phases: phases(600),
    tests: [test('expenses', 4000), test('vendors', 2000)],
    artifactBytes: 2_000_000,
    ...over,
  });
  const runs = [
    run({ pair: 1, runner: 'cypress', phases: phases(600) }),
    run({ pair: 1, runner: 'playwright', position: 2, phases: phases(300) }),
    run({ pair: 2, runner: 'cypress', position: 2, phases: phases(620) }),
    run({ pair: 2, runner: 'playwright', position: 1, phases: phases(280) }),
    run({ batch: 'B', pair: 3, runner: 'cypress', phases: phases(640) }),
    run({ batch: 'B', pair: 3, runner: 'playwright', position: 2, phases: phases(330) }),
    run({
      batch: 'B',
      pair: 4,
      runner: 'cypress',
      status: 'failed',
      phases: phases(700),
      tests: [test('expenses', 9000, 'failed')],
    }),
    run({ batch: 'B', pair: 4, runner: 'playwright', status: 'setup-failed', phases: phases(90, null) }),
  ];
  const summary = summarizeBenchmark(runs);

  it('gives medians and spread per mode and runner over runs whose tests all passed, and counts every outcome', () => {
    const cypress = summary.groups.find(group => group.mode === 'serial' && group.runner === 'cypress');
    expect(cypress.statuses).toEqual({ passed: 3, failed: 1 });
    expect(cypress.metrics.totalS).toEqual({ n: 3, median: 620, min: 600, max: 640, p25: 610, p75: 630 });
    expect(cypress.metrics.expensesTestS.median).toBe(4);
    expect(cypress.metrics.artifactMB.median).toBe(2);
  });

  it('compares the two runners within each pair where both passed, overall and per batch', () => {
    const serial = summary.paired.find(comparison => comparison.mode === 'serial');
    expect(serial.pairs).toBe(3);
    expect(serial.deltaS).toEqual({ n: 3, median: 310, min: 300, max: 340, p25: 305, p75: 325 });
    expect(serial.playwrightFaster).toBe(3);
    expect(serial.byBatch).toEqual({
      A: { pairs: 2, playwrightFaster: 2, medianDeltaS: 320 },
      B: { pairs: 1, playwrightFaster: 1, medianDeltaS: 310 },
    });
    expect(serial.excluded).toEqual([{ batch: 'B', pair: 4, cypress: 'failed', playwright: 'setup-failed' }]);
  });

  it('reports first-attempt test failures and runs that never finished the browser step', () => {
    const cypress = summary.reliability.find(row => row.mode === 'serial' && row.runner === 'cypress');
    expect(cypress).toMatchObject({ runs: 4, testsRun: 7, firstAttemptFailures: 1, unfinishedRuns: 0 });
    expect(cypress.failedTests).toEqual([{ batch: 'B', pair: 4, title: 'expenses 9000' }]);
    const playwright = summary.reliability.find(row => row.mode === 'serial' && row.runner === 'playwright');
    expect(playwright).toMatchObject({ runs: 4, firstAttemptFailures: 0, unfinishedRuns: 1 });
  });
});

describe('runStatus', () => {
  const passed = {
    suite: 'vendors' as const,
    title: 't',
    status: 'passed' as const,
    durationMs: 1,
    fixtureMs: 0,
    mailMs: 0,
  };
  it('passes only when the runner exited cleanly and every pilot test passed', () => {
    expect(runStatus(0, [passed])).toBe('passed');
    expect(runStatus(1, [passed, { ...passed, status: 'failed' }])).toBe('failed');
    // A clean exit with no pilot test is not a pass: the selection ran nothing.
    expect(runStatus(0, [])).toBe('setup-failed');
  });
  it('separates interruptions from setup failures when no report was written', () => {
    expect(runStatus(1, null)).toBe('setup-failed');
    expect(runStatus(143, null)).toBe('interrupted');
    expect(runStatus(130, null)).toBe('interrupted');
  });
});
