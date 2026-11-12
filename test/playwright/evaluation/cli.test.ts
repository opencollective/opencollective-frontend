import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CLI = path.join(__dirname, 'cli.ts');

const runCli = (...args: string[]) =>
  spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', CLI, ...args], { encoding: 'utf8' });

describe('evaluation cli', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oc-e2e-eval-cli-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects an option given without its value instead of ignoring it', () => {
    const result = runCli('aggregate', dir, '--markdown');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('--markdown requires a value');
    expect(result.stdout).toBe('');
  });

  const collectRun = (overrides: Record<string, string>) => {
    fs.writeFileSync(path.join(dir, 'timeline.log'), '');
    const options = {
      runner: 'playwright',
      mode: 'serial',
      batch: 'A',
      pair: '1',
      position: '1',
      concurrency: '1',
      'exit-code': '0',
      log: path.join(dir, 'timeline.log'),
      report: path.join(dir, 'missing-report.json'),
      out: path.join(dir, 'run.json'),
      ...overrides,
    };
    return runCli('collect-run', ...Object.entries(options).flatMap(([name, value]) => [`--${name}`, value]));
  };

  it('records a run from valid options', () => {
    const result = collectRun({});
    expect(result.stderr).toBe('');
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'))).toMatchObject({
      runner: 'playwright',
      pair: 1,
      status: 'setup-failed',
    });
  });

  it('rejects a runner other than playwright or cypress', () => {
    const result = collectRun({ runner: 'selenium' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('--runner must be playwright or cypress');
    expect(fs.existsSync(path.join(dir, 'run.json'))).toBe(false);
  });

  it.each(['pair', 'position', 'concurrency', 'exit-code'])('rejects a --%s that is not an integer', name => {
    const result = collectRun({ [name]: 'abc' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(`--${name} must be an integer`);
    expect(fs.existsSync(path.join(dir, 'run.json'))).toBe(false);
  });
});
