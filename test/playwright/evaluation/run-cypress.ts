/**
 * Benchmark scaffolding: runs Cypress specs through the module API and writes
 * its result (per-spec and per-test durations) as JSON.
 *
 *   node test/playwright/evaluation/run-cypress.ts --spec <spec> --browser <path|name> --out <file>
 */
import cypress from 'cypress';
import fs from 'node:fs';

const args = process.argv.slice(2);
const option = (name: string) => args[args.indexOf(`--${name}`) + 1];

const result = await cypress.run({
  spec: option('spec'),
  browser: option('browser'),
  // The required CI shards record no video (CYPRESS_VIDEO=false in e2e.yml); the benchmark keeps that.
  config: { video: false },
});
fs.writeFileSync(option('out'), JSON.stringify(result, null, 2));
// `failures` is set when Cypress itself could not run; `totalFailed` counts failed tests.
process.exitCode = 'failures' in result ? 2 : result.totalFailed > 0 ? 1 : 0;
