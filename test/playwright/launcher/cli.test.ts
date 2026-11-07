import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CLI = path.join(__dirname, 'cli.ts');

const runCli = (...args: string[]) =>
  spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', CLI, ...args], { encoding: 'utf8' });

describe('launcher cli', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oc-e2e-cli-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects a malformed stamp for stamp-check as a usage error', () => {
    const result = runCli('stamp-check', dir, path.join(dir, 'missing.json'), '{not json');
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/stamp/i);
    expect(result.stderr).not.toMatch(/at JSON\.parse/);
  });

  it('rejects a malformed stamp for stamp-save as a usage error', () => {
    const result = runCli('stamp-save', path.join(dir, 'stamp.json'), '{not json');
    expect(result.status).toBe(2);
    expect(fs.existsSync(path.join(dir, 'stamp.json'))).toBe(false);
  });

  it('rejects an unknown service', () => {
    const result = runCli('resolve', 'frontend', dir);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('unknown service: frontend');
  });
});
