import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { branchMismatchWarning, resolveServiceDir } from './services';

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'pipe' });
const initRepo = (dir: string) => {
  fs.mkdirSync(dir, { recursive: true });
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, '-c', 'user.email=a@b.c', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init');
  return dir;
};

const failureMessage = (result: ReturnType<typeof resolveServiceDir>): string => {
  if ('message' in result) {
    return result.message;
  }
  throw new Error(`expected no checkout, got ${JSON.stringify(result)}`);
};

const makeTmp = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'oc-e2e-services-')));
const mkdir = (...parts: string[]) => {
  const dir = path.join(...parts);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

describe('resolveServiceDir', () => {
  let root: string;
  let frontendDir: string;

  beforeEach(() => {
    root = makeTmp();
    frontendDir = mkdir(root, 'opencollective-frontend');
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('prefers an explicit path over the parent folder and the subfolder', () => {
    const explicit = mkdir(root, 'elsewhere', 'api');
    mkdir(root, 'opencollective-api');
    mkdir(frontendDir, 'opencollective-api');
    const result = resolveServiceDir({ service: 'api', frontendDir, explicit });
    expect(result).toEqual({ ok: true, dir: explicit, source: 'explicit' });
  });

  it('uses the parent folder of the frontend (monorepo layout) before the subfolder (CI layout)', () => {
    mkdir(root, 'opencollective-api');
    mkdir(frontendDir, 'opencollective-api');
    const result = resolveServiceDir({ service: 'api', frontendDir });
    expect(result).toEqual({ ok: true, dir: path.join(root, 'opencollective-api'), source: 'parent' });
  });

  it('falls back to a subfolder of the frontend (CI layout)', () => {
    mkdir(frontendDir, 'opencollective-pdf');
    const result = resolveServiceDir({ service: 'pdf', frontendDir });
    expect(result).toEqual({ ok: true, dir: path.join(frontendDir, 'opencollective-pdf'), source: 'subfolder' });
  });

  it('fails when an explicit path does not exist instead of silently falling back', () => {
    mkdir(root, 'opencollective-images');
    const result = resolveServiceDir({ service: 'images', frontendDir, explicit: path.join(root, 'missing') });
    {
      expect(failureMessage(result)).toContain(path.join(root, 'missing'));
      expect(failureMessage(result)).toContain('IMAGES_FOLDER');
    }
  });

  it('lists every path tried and the variable or flag to set when nothing is found', () => {
    const result = resolveServiceDir({ service: 'api', frontendDir });
    {
      expect(failureMessage(result)).toContain(path.join(root, 'opencollective-api'));
      expect(failureMessage(result)).toContain(path.join(frontendDir, 'opencollective-api'));
      expect(failureMessage(result)).toContain('API_FOLDER');
      expect(failureMessage(result)).toContain('--api-dir');
      expect(failureMessage(result)).not.toContain('worktree');
    }
  });

  it('suggests creating a matching worktree when the frontend is a frontend-only worktree', () => {
    const main = initRepo(path.join(root, 'checkouts', 'opencollective-frontend'));
    const worktree = path.join(root, 'feature', 'opencollective-frontend');
    git(main, 'worktree', 'add', '-q', '-b', 'my-feature', worktree);

    const result = resolveServiceDir({ service: 'api', frontendDir: worktree });
    {
      expect(failureMessage(result)).toContain('frontend-only worktree');
      expect(failureMessage(result)).toContain(
        `git -C ${path.join(root, 'checkouts', 'opencollective-api')} worktree add ${path.join(root, 'feature', 'opencollective-api')} my-feature`,
      );
      expect(failureMessage(result)).toContain('API_FOLDER');
    }
  });
});

describe('resolveServiceDir in a worktree of a submodule checkout', () => {
  it('suggests the worktree command from the submodule working tree', () => {
    const root = makeTmp();
    try {
      const checkout = path.join(root, 'monorepo', 'opencollective-frontend');
      const gitDir = path.join(root, 'monorepo', '.git', 'modules', 'opencollective-frontend');
      fs.mkdirSync(checkout, { recursive: true });
      fs.mkdirSync(path.dirname(gitDir), { recursive: true });
      git(checkout, 'init', '-q', '-b', 'main', `--separate-git-dir=${gitDir}`);
      git(checkout, 'config', 'core.worktree', checkout);
      git(checkout, '-c', 'user.email=a@b.c', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init');
      const worktree = path.join(root, 'feature', 'opencollective-frontend');
      git(checkout, 'worktree', 'add', '-q', '-b', 'my-feature', worktree);

      const result = resolveServiceDir({ service: 'pdf', frontendDir: worktree });
      {
        expect(failureMessage(result)).toContain(
          `git -C ${path.join(root, 'monorepo', 'opencollective-pdf')} worktree add ${path.join(root, 'feature', 'opencollective-pdf')} my-feature`,
        );
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('branchMismatchWarning', () => {
  let api: string;

  beforeEach(() => {
    api = initRepo(path.join(makeTmp(), 'opencollective-api'));
  });

  afterEach(() => fs.rmSync(path.dirname(api), { recursive: true, force: true }));

  it('warns when the service has a branch named like the frontend one but another is checked out', () => {
    git(api, 'branch', 'feat/thing');
    const warning = branchMismatchWarning({ service: 'api', dir: api, frontendBranch: 'feat/thing' });
    expect(warning).toContain('feat/thing');
    expect(warning).toContain('main');
    expect(warning).toContain(api);
  });

  it('also considers remote-tracking branches', () => {
    git(api, 'update-ref', 'refs/remotes/origin/feat/thing', 'HEAD');
    expect(branchMismatchWarning({ service: 'api', dir: api, frontendBranch: 'feat/thing' })).toContain('feat/thing');
  });

  it('stays quiet when the matching branch is checked out or does not exist', () => {
    expect(branchMismatchWarning({ service: 'api', dir: api, frontendBranch: 'feat/other' })).toBeNull();
    git(api, 'checkout', '-q', '-b', 'feat/thing');
    expect(branchMismatchWarning({ service: 'api', dir: api, frontendBranch: 'feat/thing' })).toBeNull();
  });
});
