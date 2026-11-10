/**
 * Pilot evaluation commands (Node 24 runs this TypeScript directly):
 *
 *   node test/playwright/evaluation/cli.ts inventory [--markdown FILE]
 *   node test/playwright/evaluation/cli.ts collect-run --runner playwright --mode serial --batch A --pair 1 \
 *     --position 1 --concurrency 1 --exit-code 0 --log timeline.log --report results.json --artifacts DIR --out run.json
 *   node test/playwright/evaluation/cli.ts aggregate DIR --json summary.json --markdown summary.md
 *   node test/playwright/evaluation/cli.ts baseline [--limit 30] --json baseline.json
 *
 * See docs/e2e.md (Pilot evaluation).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import type { BenchmarkRun, Stats } from './benchmark.ts';
import { cypressTests, phasesFromTimeline, playwrightTests, runStatus, summarizeBenchmark } from './benchmark.ts';
import { summarizeCiBaseline } from './ci-baseline.ts';
import { checkInventory, extractCypressTests, listPlaywrightTests } from './inventory.ts';
import { pilotInventory } from './pilot-inventory.ts';

const FRONTEND_DIR = path.resolve(import.meta.dirname, '../../..');
const CYPRESS_PILOTS = ['27-expenses.test.ts', '41-vendor-visibility.test.ts'];

const [command, ...rest] = process.argv.slice(2);
const option = (name: string) => {
  const index = rest.indexOf(`--${name}`);
  if (index === -1) {
    return undefined;
  }
  if (index + 1 >= rest.length) {
    throw new Error(`--${name} requires a value`);
  }
  return rest[index + 1];
};
const required = (name: string) => {
  const value = option(name);
  if (value === undefined) {
    throw new Error(`--${name} is required`);
  }
  return value;
};
const requiredInteger = (name: string) => {
  const value = Number(required(name));
  if (!Number.isInteger(value)) {
    throw new Error(`--${name} must be an integer`);
  }
  return value;
};
const print = (text: string) => process.stdout.write(`${text}\n`);
const writeOrPrint = (file: string | undefined, text: string) => (file ? fs.writeFileSync(file, text) : print(text));

function inventory() {
  const cypress = CYPRESS_PILOTS.flatMap(file =>
    extractCypressTests(file, fs.readFileSync(path.join(FRONTEND_DIR, 'test/cypress/integration', file), 'utf8')),
  );
  const list = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json'], {
    cwd: FRONTEND_DIR,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const playwright = listPlaywrightTests(JSON.parse(list));
  const result = checkInventory({
    cypress,
    playwright,
    entries: pilotInventory,
    isPilotJourney: file => /^(expenses|vendors)\//.test(file),
  });

  const rows = pilotInventory.map(entry => {
    const status = entry.gap ? `**gap**: ${entry.gap}` : (entry.note ?? 'mapped');
    const journeys = entry.journeys.map(journey => `\`${journey.file}\` › ${journey.title}`).join('<br>') || '-';
    return `| ${entry.group} | \`${entry.cypress.file}\` › ${entry.cypress.title} | ${journeys} | ${status} |`;
  });
  const listed = (label: string, items: Array<{ file: string; title: string }>) =>
    items.length ? [`${label}:`, ...items.map(item => `- \`${item.file}\` › ${item.title}`), ''] : [];
  const pilotJourneys = playwright.filter(test => /^(expenses|vendors)\//.test(test.file)).length;
  const markdown = [
    `Cypress pilot \`it(\` blocks: ${cypress.length}; Playwright pilot journeys: ${pilotJourneys}; inventory entries: ${pilotInventory.length}; recorded gaps: ${result.gaps.length}.`,
    `Every test accounted for: ${result.complete ? 'yes' : 'NO'}. Every core flow carried by a journey: ${result.coversAllCoreFlows ? 'yes' : 'NO'}.`,
    '',
    ...listed('Cypress tests missing from the inventory', result.unmappedCypress),
    ...listed(
      'Inventory entries naming a Cypress test that no longer exists',
      result.staleCypress.map(entry => entry.cypress),
    ),
    ...listed('Inventory journeys that no longer exist', result.missingJourneys),
    ...listed('Pilot journeys no entry claims', result.unclaimedJourneys),
    '| Group | Cypress test | Playwright journeys | Status |',
    '| ----- | ------------ | ------------------- | ------ |',
    ...rows,
  ].join('\n');
  writeOrPrint(option('markdown'), markdown);
  if (!result.complete) {
    process.exitCode = 1;
  }
}

function collectRun() {
  const runner = required('runner');
  if (runner !== 'playwright' && runner !== 'cypress') {
    throw new Error(`--runner must be playwright or cypress, got ${runner}`);
  }
  const reportFile = required('report');
  const report = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : null;
  const tests = report ? (runner === 'playwright' ? playwrightTests(report) : cypressTests(report)) : null;
  let browser = null;
  if (report && runner === 'playwright' && report.stats) {
    browser = { startMs: Date.parse(report.stats.startTime), durationMs: report.stats.duration };
  } else if (report && runner === 'cypress' && report.startedTestsAt) {
    const startMs = Date.parse(report.startedTestsAt);
    browser = { startMs, durationMs: Date.parse(report.endedTestsAt) - startMs };
  }
  const artifactBytes = (dir: string): number =>
    !fs.existsSync(dir)
      ? 0
      : fs.readdirSync(dir, { withFileTypes: true }).reduce((total, item) => {
          const full = path.join(dir, item.name);
          return total + (item.isDirectory() ? artifactBytes(full) : fs.statSync(full).size);
        }, 0);
  const exitCode = requiredInteger('exit-code');
  const run: BenchmarkRun = {
    batch: required('batch'),
    pair: requiredInteger('pair'),
    mode: required('mode'),
    runner,
    position: requiredInteger('position'),
    concurrency: requiredInteger('concurrency'),
    status: runStatus(exitCode, tests),
    phases: phasesFromTimeline(fs.readFileSync(required('log'), 'utf8'), browser),
    tests: tests ?? [],
    artifactBytes: rest.includes('--artifacts') ? artifactBytes(required('artifacts')) : 0,
    jobUrl: option('job-url'),
  };
  fs.writeFileSync(required('out'), `${JSON.stringify(run, null, 2)}\n`);
  print(`${run.runner} ${run.mode} batch=${run.batch} pair=${run.pair}: ${run.status}, total ${run.phases.totalS}s`);
}

const cell = (value: Stats | null) =>
  value ? `${value.median} (${value.min}-${value.max}; IQR ${value.p25}-${value.p75}; n=${value.n})` : '-';

function aggregate() {
  const dir = rest[0];
  const files = fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter(file => /(^|\/)run-[^/]*\.json$/.test(file));
  const runs: BenchmarkRun[] = files.map(file => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')));
  runs.sort((x, y) => x.batch.localeCompare(y.batch) || x.pair - y.pair || x.position - y.position);
  const summary = summarizeBenchmark(runs);
  if (option('json')) {
    fs.writeFileSync(option('json'), `${JSON.stringify({ summary, runs }, null, 2)}\n`);
  }
  const metricNames = Object.keys(summary.groups[0]?.metrics ?? {});
  const markdown = [
    '### Per mode and runner (runs whose tests all passed; median (min-max; IQR; n))',
    '',
    `| Metric | ${summary.groups.map(group => `${group.mode} ${group.runner} (concurrency ${group.concurrency.join('/')})`).join(' | ')} |`,
    `| --- | ${summary.groups.map(() => '---').join(' | ')} |`,
    `| outcomes | ${summary.groups.map(group => JSON.stringify(group.statuses)).join(' | ')} |`,
    ...metricNames.map(name => `| ${name} | ${summary.groups.map(group => cell(group.metrics[name])).join(' | ')} |`),
    '',
    '### Paired critical path (Cypress minus Playwright, seconds; positive = Playwright faster)',
    '',
    '| Mode | Complete pairs | Delta s | Cypress/Playwright ratio | Playwright faster | By batch | Excluded pairs |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...summary.paired.map(
      row =>
        `| ${row.mode} | ${row.pairs} | ${cell(row.deltaS)} | ${cell(row.ratio)} | ${row.playwrightFaster}/${row.pairs} | ${JSON.stringify(row.byBatch)} | ${JSON.stringify(row.excluded)} |`,
    ),
    '',
    '### First-attempt reliability (no retries)',
    '',
    '| Mode | Runner | Runs | Tests run | First-attempt failures | Unfinished runs | Failed tests |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...summary.reliability.map(
      row =>
        `| ${row.mode} | ${row.runner} | ${row.runs} | ${row.testsRun} | ${row.firstAttemptFailures} | ${row.unfinishedRuns} | ${row.failedTests.map(test => `${test.batch}#${test.pair} ${test.title}`).join('<br>') || '-'} |`,
    ),
    '',
    '### Raw runs',
    '',
    '| Batch | Pair | Mode | Runner | Position | Concurrency | Status | Total s | Preflight | Reset | Startup | Runner boot | Browser | Teardown | Tests (failed) | Artifacts MB | Job |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...runs.map(run => {
      const p = run.phases;
      const failed = run.tests.filter(test => test.status === 'failed').length;
      return `| ${run.batch} | ${run.pair} | ${run.mode} | ${run.runner} | ${run.position} | ${run.concurrency} | ${run.status} | ${p.totalS} | ${p.preflightS} | ${p.resetS} | ${p.startupS} | ${p.runnerBootS} | ${p.browserS} | ${p.teardownS} | ${run.tests.length} (${failed}) | ${(run.artifactBytes / 1e6).toFixed(1)} | ${run.jobUrl ?? ''} |`;
    }),
  ].join('\n');
  writeOrPrint(option('markdown'), markdown);
}

function baseline() {
  const repo = 'opencollective/opencollective-frontend';
  const limit = option('limit') ?? '30';
  const gh = (args: string[]) =>
    JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const listed = gh([
    'run',
    'list',
    '-R',
    repo,
    '--workflow',
    'ci.yml',
    '--branch',
    'main',
    '--event',
    'push',
    '-L',
    limit,
    '--json',
    'databaseId,url,headSha,createdAt',
  ]);
  const runs = listed.map(run => ({
    id: run.databaseId,
    url: run.url,
    headSha: run.headSha,
    createdAt: run.createdAt,
    jobs: gh(['api', `repos/${repo}/actions/runs/${run.databaseId}/jobs?per_page=100`]).jobs.map(job => ({
      name: job.name,
      conclusion: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    })),
  }));
  writeOrPrint(option('json'), `${JSON.stringify({ summary: summarizeCiBaseline(runs), runs }, null, 2)}\n`);
}

const commands = { inventory, 'collect-run': collectRun, aggregate, baseline };
if (!commands[command]) {
  print(`Usage: node test/playwright/evaluation/cli.ts <${Object.keys(commands).join('|')}> ...`);
  process.exitCode = 2;
} else {
  commands[command]();
}
