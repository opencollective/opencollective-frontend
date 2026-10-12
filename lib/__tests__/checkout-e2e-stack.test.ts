import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const primary = 'api' as const;
const services = [primary, 'images', 'pdf'] as const;
type Service = (typeof services)[number];
type Options = {
  headRef?: string;
  refName?: string;
  pins?: Partial<Record<Service, string>>;
  missing?: Service[];
  fail?: Service;
};
const action = readFileSync(resolve('.github/actions/checkout-e2e-stack/action.yml'), 'utf8');
const resolverId = action.match(/^ {6}id: (.+)$/m)?.[1];
const script = action.match(/ {6}run: \|\n((?: {8}[^\n]*\n|\n)+)/)?.[1].replace(/^ {8}/gm, '');
assert.ok(script, 'Checkout action must expose its shell resolver');
const sha = (service: Service, ref: string) => createHash('sha1').update(`${service}:${ref}`).digest('hex');

function resolveStack({ headRef = '', refName = 'chore/add-turborepo', pins = {}, missing = [], fail }: Options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'oc-e2e-checkout-'));
  try {
    const output = join(directory, 'output');
    const requests = join(directory, 'requests');
    writeFileSync(output, '');
    writeFileSync(requests, '');
    writeFileSync(
      join(directory, 'git'),
      `#!/usr/bin/env node
const fs = require('node:fs');
const crypto = require('node:crypto');
const args = process.argv.slice(2);
if (args[0] !== 'ls-remote' || !args.includes('--heads')) process.exit(99);
const service = args.at(-2).split('/').at(-1).replace('opencollective-', '').slice(0, -4);
const ref = args.at(-1).slice('refs/heads/'.length);
fs.appendFileSync(process.env.CHECKOUT_FIXTURE_REQUESTS, service + ' ' + ref + String.fromCharCode(10));
if (process.env.CHECKOUT_FIXTURE_FAIL === service) process.exit(42);
if (ref !== 'main' && process.env.CHECKOUT_FIXTURE_MISSING.split(',').includes(service)) process.exit(0);
const sha = crypto.createHash('sha1').update(service + ':' + ref).digest('hex');
console.log(sha + String.fromCharCode(9) + 'refs/heads/' + ref);
`,
      { mode: 0o755 },
    );
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
      encoding: 'utf8',
      timeout: 10000,
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        GITHUB_HEAD_REF: headRef,
        GITHUB_REF_NAME: refName,
        GITHUB_OUTPUT: output,
        [`${primary.toUpperCase()}_REF_INPUT`]: pins[primary] || '',
        IMAGES_REF_INPUT: pins.images || '',
        PDF_REF_INPUT: pins.pdf || '',
        CHECKOUT_FIXTURE_REQUESTS: requests,
        CHECKOUT_FIXTURE_MISSING: missing.join(','),
        CHECKOUT_FIXTURE_FAIL: fail || '',
      },
    });
    return {
      ...result,
      refs: Object.fromEntries(
        readFileSync(output, 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map(line => line.split('=')),
      ),
      requests: readFileSync(requests, 'utf8').trim().split('\n').filter(Boolean),
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('E2E stack checkout', () => {
  it('selects matching branches for every companion and wires them into checkout', () => {
    const result = resolveStack();
    assert.equal(result.status, 0, result.stderr);
    for (const service of services) {
      assert.equal(result.refs[`${service}-ref`], sha(service, 'chore/add-turborepo'));
      const checkout = action.split(/^ {4}- name:/m).find(step => step.includes(`path: opencollective-${service}\n`));
      assert.ok(checkout);
      assert.equal(checkout.match(/^ {8}ref: (.+)$/m)?.[1], `\${{ steps.${resolverId}.outputs.${service}-ref }}`);
    }
  });

  it('uses the PR head branch instead of the synthetic merge ref', () => {
    const result = resolveStack({ headRef: 'feature/paired-stack', refName: '123/merge' });
    assert.equal(result.status, 0, result.stderr);
    for (const service of services) {
      assert.equal(result.refs[`${service}-ref`], sha(service, 'feature/paired-stack'));
    }
    assert.ok(result.requests.every(request => request.endsWith('feature/paired-stack')));
  });

  it('falls back only the missing companion to main', () => {
    const result = resolveStack({ missing: ['images'] });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.refs['images-ref'], sha('images', 'main'));
    assert.equal(result.refs['pdf-ref'], sha('pdf', 'chore/add-turborepo'));
    assert.equal(result.refs[`${primary}-ref`], sha(primary, 'chore/add-turborepo'));
    assert.deepEqual(
      result.requests.filter(request => request.endsWith(' main')),
      ['images main'],
    );
  });

  it('honors every explicit artifact SHA without resolving moving branches', () => {
    const pins = Object.fromEntries(services.map(service => [service, sha(service, 'artifact')]));
    const result = resolveStack({ pins });
    assert.equal(result.status, 0, result.stderr);
    for (const service of services) {
      assert.equal(result.refs[`${service}-ref`], pins[service]);
    }
    assert.deepEqual(result.requests, []);
  });

  it('fails on a remote error rather than silently falling back', () => {
    const result = resolveStack({ fail: 'pdf' });
    assert.notEqual(result.status, 0);
    assert.ok(result.requests.includes('pdf chore/add-turborepo'));
    assert.ok(!result.requests.includes('pdf main'));
  });
});
