/**
 * Pilot benchmark data: turns one runner invocation (timestamped log plus the
 * runner's own report) into a run record, and summarizes run records into
 * medians, spread and paired Cypress/Playwright comparisons.
 * See docs/e2e.md (Pilot evaluation).
 */

type Suite = 'expenses' | 'vendors';
type Runner = 'cypress' | 'playwright';
/** `serial`, `parallel`, or a named configuration variant run as its own pairs. */
type Mode = string;

type TestSample = {
  suite: Suite;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  /** Recipe setup inside the test (Playwright `fixture-timings`); null where the runner cannot separate it. */
  fixtureMs: number | null;
  /** Waiting for mail (Playwright `mail-timings`); null where the runner cannot separate it. */
  mailMs: number | null;
};

type Phases = {
  preflightS: number | null;
  resetS: number | null;
  startupS: number | null;
  runnerBootS: number | null;
  browserS: number | null;
  teardownS: number | null;
  totalS: number | null;
};

export type BenchmarkRun = {
  batch: string;
  pair: number;
  mode: Mode;
  runner: Runner;
  /** 1 when this runner went first in its pair. */
  position: number;
  concurrency: number;
  /** passed/failed: the browser ran; setup-failed/interrupted: it did not finish. */
  status: 'passed' | 'failed' | 'setup-failed' | 'interrupted';
  phases: Phases;
  tests: TestSample[];
  artifactBytes: number;
  jobUrl?: string;
};

const suiteOf = (file: string): Suite | null => {
  if (/(^|\/)expenses\/|27-expenses/.test(file)) {
    return 'expenses';
  }
  if (/(^|\/)vendors\/|41-vendor-visibility/.test(file)) {
    return 'vendors';
  }
  return null;
};

type PwAttachment = { name: string; body?: string };
type PwResult = { status: string; duration: number; retry?: number; attachments?: PwAttachment[] };
type PwSuite = {
  title?: string;
  file?: string;
  specs?: Array<{ title: string; tests: Array<{ results: PwResult[] }> }>;
  suites?: PwSuite[];
};

const attachedJson = (result: PwResult, name: string): Array<Record<string, number>> => {
  const found = result.attachments?.find(item => item.name === name && item.body);
  return found ? JSON.parse(Buffer.from(found.body, 'base64').toString('utf8')) : [];
};

const sumOf = (rows: Array<Record<string, number>>, key: string) => rows.reduce((total, row) => total + row[key], 0);

/** Pilot tests of a Playwright JSON report; first attempts only (benchmarks run without retries). */
export function playwrightTests(report: { suites: PwSuite[] }): TestSample[] {
  const samples: TestSample[] = [];
  const walk = (node: PwSuite, suite: Suite, path: string[]) => {
    for (const spec of node.specs ?? []) {
      for (const test of spec.tests) {
        const first = test.results.find(result => !result.retry) ?? test.results[0];
        if (!first) {
          continue;
        }
        samples.push({
          suite,
          title: [...path, spec.title].join(' › '),
          status: first.status === 'passed' ? 'passed' : first.status === 'skipped' ? 'skipped' : 'failed',
          durationMs: first.duration,
          fixtureMs: sumOf(attachedJson(first, 'fixture-timings'), 'setupMs'),
          mailMs: sumOf(attachedJson(first, 'mail-timings'), 'waitMs'),
        });
      }
    }
    for (const child of node.suites ?? []) {
      walk(child, suite, [...path, child.title]);
    }
  };
  for (const fileSuite of report.suites) {
    const suite = suiteOf(fileSuite.file ?? fileSuite.title ?? '');
    if (suite) {
      walk(fileSuite, suite, []);
    }
  }
  return samples;
}

type CyTest = { title: string[]; state: string; duration?: number; attempts?: Array<{ duration?: number }> };
type CyRun = { spec: { relative?: string; name?: string }; tests: CyTest[] };

/** Pilot tests of a Cypress module API result (`cypress.run()`). */
export function cypressTests(result: { runs: CyRun[] }): TestSample[] {
  return result.runs.flatMap(run => {
    const suite = suiteOf(run.spec.relative ?? run.spec.name ?? '');
    if (!suite) {
      return [];
    }
    return run.tests.map(test => ({
      suite,
      title: test.title.join(' › '),
      status: test.state === 'passed' ? 'passed' : test.state === 'failed' ? 'failed' : 'skipped',
      durationMs: test.duration ?? (test.attempts ?? []).reduce((total, attempt) => total + (attempt.duration ?? 0), 0),
      fixtureMs: null,
      mailMs: null,
    }));
  });
}

const MARKERS = {
  reset: /^> Restoring disposable database/,
  startup: /^> Starting API/,
  runner: /^> Running (Playwright|Cypress)/,
  end: /^BENCH end/,
};

const seconds = (from: number | undefined, to: number | undefined) =>
  from === undefined || to === undefined ? null : Math.round((to - from) / 100) / 10;

/**
 * Phases of one runner invocation from its log (`<epoch ms>\t<line>`, first
 * line = start) and the browser window its report records.
 */
export function phasesFromTimeline(log: string, browser: { startMs: number; durationMs: number } | null): Phases {
  const lines = log
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const tab = line.indexOf('\t');
      return { at: Number(line.slice(0, tab)), text: line.slice(tab + 1) };
    });
  const first = (pattern: RegExp) => lines.find(line => pattern.test(line.text))?.at;
  const start = lines[0]?.at;
  const end = first(MARKERS.end) ?? lines.at(-1)?.at;
  const reset = first(MARKERS.reset);
  const startup = first(MARKERS.startup);
  const runner = first(MARKERS.runner);
  const browserEnd = browser ? browser.startMs + browser.durationMs : undefined;
  return {
    preflightS: seconds(start, reset ?? end),
    resetS: seconds(reset, startup),
    startupS: seconds(startup, runner),
    runnerBootS: seconds(runner, browser?.startMs),
    browserS: browser ? seconds(browser.startMs, browserEnd) : null,
    teardownS: seconds(browserEnd, end),
    totalS: seconds(start, end),
  };
}

export type Stats = { n: number; median: number; min: number; max: number; p25: number; p75: number };

const round = (value: number) => Math.round(value * 10) / 10;

/** Linear-interpolation quantiles (the R/NumPy default). */
export function stats(values: Array<number | null>): Stats | null {
  const sorted = values.filter((value): value is number => value !== null).sort((x, y) => x - y);
  if (!sorted.length) {
    return null;
  }
  const quantile = (q: number) => {
    const position = (sorted.length - 1) * q;
    const low = Math.floor(position);
    const high = Math.ceil(position);
    return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
  };
  return {
    n: sorted.length,
    median: round(quantile(0.5)),
    min: round(sorted[0]),
    max: round(sorted.at(-1)),
    p25: round(quantile(0.25)),
    p75: round(quantile(0.75)),
  };
}

const testSeconds = (run: BenchmarkRun, suite: Suite) =>
  run.tests.filter(test => test.suite === suite).reduce((total, test) => total + test.durationMs, 0) / 1000;

const fixtureSeconds = (run: BenchmarkRun) =>
  run.tests.some(test => test.fixtureMs === null)
    ? null
    : run.tests.reduce((total, test) => total + test.fixtureMs, 0) / 1000;

const countBy = <T>(items: T[], key: (item: T) => string) =>
  items.reduce<Record<string, number>>((counts, item) => {
    counts[key(item)] = (counts[key(item)] ?? 0) + 1;
    return counts;
  }, {});

const RUNNERS: Runner[] = ['cypress', 'playwright'];

/**
 * Wall-time statistics use runs whose tests all passed; every other outcome
 * stays counted and listed. Pairs compare Cypress minus Playwright critical
 * path (seconds saved by Playwright) where both runs of the pair passed.
 */
export function summarizeBenchmark(runs: BenchmarkRun[]) {
  const modes: Mode[] = [...new Set(runs.map(run => run.mode))];
  const groups = modes
    .flatMap(mode =>
      RUNNERS.map(runner => {
        const all = runs.filter(run => run.mode === mode && run.runner === runner);
        const passed = all.filter(run => run.status === 'passed');
        const metric = (pick: (run: BenchmarkRun) => number | null) => stats(passed.map(pick));
        return {
          mode,
          runner,
          concurrency: [...new Set(all.map(run => run.concurrency))],
          statuses: countBy(all, run => run.status),
          metrics: {
            totalS: metric(run => run.phases.totalS),
            preflightS: metric(run => run.phases.preflightS),
            resetS: metric(run => run.phases.resetS),
            startupS: metric(run => run.phases.startupS),
            runnerBootS: metric(run => run.phases.runnerBootS),
            browserS: metric(run => run.phases.browserS),
            teardownS: metric(run => run.phases.teardownS),
            expensesTestS: metric(run => testSeconds(run, 'expenses')),
            vendorsTestS: metric(run => testSeconds(run, 'vendors')),
            fixtureS: metric(fixtureSeconds),
            artifactMB: metric(run => run.artifactBytes / 1_000_000),
          },
        };
      }),
    )
    .filter(group => Object.keys(group.statuses).length);

  const paired = modes
    .map(mode => {
      const byPair = new Map<string, Partial<Record<Runner, BenchmarkRun>>>();
      for (const run of runs.filter(candidate => candidate.mode === mode)) {
        const key = `${run.batch}#${run.pair}`;
        byPair.set(key, { ...byPair.get(key), [run.runner]: run });
      }
      const complete = [];
      const excluded = [];
      for (const pair of byPair.values()) {
        const { cypress, playwright } = pair;
        if (cypress?.status === 'passed' && playwright?.status === 'passed') {
          complete.push({
            batch: cypress.batch,
            deltaS: cypress.phases.totalS - playwright.phases.totalS,
            cypress,
            playwright,
          });
        } else {
          const any = cypress ?? playwright;
          excluded.push({
            batch: any.batch,
            pair: any.pair,
            cypress: cypress?.status ?? 'missing',
            playwright: playwright?.status ?? 'missing',
          });
        }
      }
      const byBatch = {};
      for (const batch of [...new Set(complete.map(pair => pair.batch))].sort()) {
        const inBatch = complete.filter(pair => pair.batch === batch);
        byBatch[batch] = {
          pairs: inBatch.length,
          playwrightFaster: inBatch.filter(pair => pair.deltaS > 0).length,
          medianDeltaS: stats(inBatch.map(pair => pair.deltaS)).median,
        };
      }
      return {
        mode,
        pairs: complete.length,
        deltaS: stats(complete.map(pair => pair.deltaS)),
        ratio: stats(complete.map(pair => pair.cypress.phases.totalS / pair.playwright.phases.totalS)),
        playwrightFaster: complete.filter(pair => pair.deltaS > 0).length,
        byBatch,
        excluded,
      };
    })
    .filter(comparison => comparison.pairs || comparison.excluded.length);

  const reliability = modes
    .flatMap(mode =>
      RUNNERS.map(runner => {
        const all = runs.filter(run => run.mode === mode && run.runner === runner);
        return {
          mode,
          runner,
          runs: all.length,
          testsRun: all.reduce((total, run) => total + run.tests.filter(test => test.status !== 'skipped').length, 0),
          firstAttemptFailures: all.reduce(
            (total, run) => total + run.tests.filter(test => test.status === 'failed').length,
            0,
          ),
          unfinishedRuns: all.filter(run => run.status === 'setup-failed' || run.status === 'interrupted').length,
          failedTests: all.flatMap(run =>
            run.tests
              .filter(test => test.status === 'failed')
              .map(test => ({ batch: run.batch, pair: run.pair, title: test.title })),
          ),
        };
      }),
    )
    .filter(row => row.runs);

  return { groups, paired, reliability };
}

/** Outcome of one runner invocation from its exit code and the pilot tests its report holds (null: no report). */
export function runStatus(exitCode: number, tests: TestSample[] | null): BenchmarkRun['status'] {
  if (!tests?.length) {
    return exitCode === 130 || exitCode === 143 ? 'interrupted' : 'setup-failed';
  }
  return exitCode === 0 && tests.every(test => test.status !== 'failed') ? 'passed' : 'failed';
}
