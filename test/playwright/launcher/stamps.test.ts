import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { computeBuildStamp, frontendBuildOwner, installReason, recordInstall, staleReasons } from './stamps';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.email=a@b.c', '-c', 'user.name=t', ...args], { cwd, stdio: 'pipe' });
const write = (dir: string, file: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
};

describe('build stamps', () => {
  let dir: string;
  const env = { OC_ENV: 'ci', DISABLE_MOCK_UPLOADS: '1' };

  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'oc-e2e-stamps-')));
    git(dir, 'init', '-q', '-b', 'main');
    write(dir, '.gitignore', 'dist\n');
    write(dir, 'package-lock.json', '{"v":1}');
    write(dir, 'src/app.ts', 'export const a = 1;\n');
    write(dir, 'test/app.spec.ts', 'test 1\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'init');
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const stale = (before: ReturnType<typeof computeBuildStamp>) =>
    staleReasons({ dir, recorded: before, current: computeBuildStamp({ dir, buildEnv: env }) });

  it('records HEAD, uncommitted changes, lockfile and build env', () => {
    const stamp = computeBuildStamp({ dir, buildEnv: env });
    expect(stamp.head).toBe(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim());
    expect(stamp.uncommitted).toBe('clean');
    expect(stamp.lockfile).toMatch(/^[0-9a-f]{64}$/);
    expect(stamp.buildEnv).toEqual(env);
  });

  it('is fresh when nothing changed, including ignored build output', () => {
    const before = computeBuildStamp({ dir, buildEnv: env });
    write(dir, 'dist/app.js', 'built');
    expect(stale(before)).toEqual([]);
  });

  it('is stale after an uncommitted edit, a new untracked file, or a new commit', () => {
    const before = computeBuildStamp({ dir, buildEnv: env });
    write(dir, 'src/app.ts', 'export const a = 2;\n');
    expect(stale(before)).toEqual(['uncommitted changes']);
    git(dir, 'commit', '-qam', 'edit');
    expect(stale(before)).toEqual(['revision']);

    const committed = computeBuildStamp({ dir, buildEnv: env });
    write(dir, 'src/new.ts', 'new');
    expect(stale(committed)).toEqual(['uncommitted changes']);
  });

  it('notices a second edit to an already modified file', () => {
    write(dir, 'src/app.ts', 'export const a = 2;\n');
    const before = computeBuildStamp({ dir, buildEnv: env });
    write(dir, 'src/app.ts', 'export const a = 3;\n');
    expect(stale(before)).toEqual(['uncommitted changes']);
  });

  it('ignores tests and docs, committed or not, so editing a spec never asks for a rebuild', () => {
    const before = computeBuildStamp({ dir, buildEnv: env });
    write(dir, 'test/app.spec.ts', 'test 2\n');
    write(dir, 'docs/guide.md', 'doc');
    write(dir, 'README.md', 'readme');
    expect(stale(before)).toEqual([]);
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'spec');
    expect(stale(before)).toEqual([]);
  });

  it('is stale after editing Markdown that the app bundles, such as the static pages', () => {
    write(dir, 'src/static-pages/about.md', 'About\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'about');
    const before = computeBuildStamp({ dir, buildEnv: env });
    write(dir, 'src/static-pages/about.md', 'About us\n');
    expect(stale(before)).toEqual(['uncommitted changes']);
  });

  it('is stale when the lockfile or the build env changes', () => {
    const before = computeBuildStamp({ dir, buildEnv: env });
    write(dir, 'package-lock.json', '{"v":2}');
    expect(stale(before)).toEqual(['uncommitted changes', 'lockfile']);
    const otherEnv = computeBuildStamp({ dir, buildEnv: { ...env, DISABLE_MOCK_UPLOADS: '0' } });
    expect(staleReasons({ dir, recorded: otherEnv, current: computeBuildStamp({ dir, buildEnv: env }) })).toContain(
      'build env (DISABLE_MOCK_UPLOADS)',
    );
  });

  it('is stale when there is no recorded stamp', () => {
    expect(staleReasons({ dir, recorded: null, current: computeBuildStamp({ dir, buildEnv: env }) })).toEqual([
      'no build stamp',
    ]);
  });
});

describe('installReason', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'oc-e2e-install-')));
    write(dir, 'package-lock.json', '{"v":1}');
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const setMtime = (file: string, seconds: number) => fs.utimesSync(path.join(dir, file), seconds, seconds);

  it('installs when node_modules is missing', () => {
    expect(installReason(dir)).toBe('node_modules is missing');
  });

  it('trusts an install npm made after the lockfile last changed', () => {
    write(dir, 'node_modules/.package-lock.json', '{}');
    setMtime('package-lock.json', 1_000);
    setMtime('node_modules/.package-lock.json', 2_000);
    expect(installReason(dir)).toBeNull();
  });

  it('installs when the lockfile is newer than npm own record of the install', () => {
    write(dir, 'node_modules/.package-lock.json', '{}');
    setMtime('package-lock.json', 2_000);
    setMtime('node_modules/.package-lock.json', 1_000);
    expect(installReason(dir)).toBe('package-lock.json changed since the last install');
  });

  it('follows the lockfile hash once the launcher has recorded an install', () => {
    write(dir, 'node_modules/.package-lock.json', '{}');
    recordInstall(dir);
    setMtime('package-lock.json', 3_000);
    setMtime('node_modules/.package-lock.json', 1_000);
    expect(installReason(dir)).toBeNull();
    write(dir, 'package-lock.json', '{"v":2}');
    expect(installReason(dir)).toBe('package-lock.json changed since the last install');
  });
});

describe('frontendBuildOwner', () => {
  const stamp = { head: 'h', uncommitted: 'clean', lockfile: 'l', buildEnv: {}, buildId: 'e2e-build' };

  it('tells an E2E build from a production build made outside the launcher', () => {
    expect(frontendBuildOwner({ buildId: null, stamp: null })).toBe('none');
    expect(frontendBuildOwner({ buildId: 'e2e-build', stamp })).toBe('e2e');
    expect(frontendBuildOwner({ buildId: 'my-own-build', stamp: null })).toBe('other');
    expect(frontendBuildOwner({ buildId: 'my-own-build', stamp })).toBe('other');
  });
});
