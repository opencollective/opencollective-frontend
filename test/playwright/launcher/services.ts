/**
 * Where the E2E launcher finds the services it runs next to the frontend
 * (API, images, PDF), and what it reports about their checkouts.
 *
 * Runs under plain `node` (type stripping) from `test/playwright/run-local.sh`
 * through `cli.ts`, so it only uses erasable TypeScript syntax.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export type ServiceName = 'api' | 'images' | 'pdf';

const SERVICE_SETTINGS: Record<ServiceName, { repo: string; variable: string; flag: string }> = {
  api: { repo: 'opencollective-api', variable: 'API_FOLDER', flag: '--api-dir' },
  images: { repo: 'opencollective-images', variable: 'IMAGES_FOLDER', flag: '--images-dir' },
  pdf: { repo: 'opencollective-pdf', variable: 'PDF_FOLDER', flag: '--pdf-dir' },
};

type Resolution =
  | { ok: true; dir: string; source: 'explicit' | 'parent' | 'subfolder' }
  | { ok: false; tried: string[]; message: string };

const isDirectory = (dir: string) => {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
};

const git = (cwd: string, ...args: string[]): string | null => {
  try {
    return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
};

/** The checkout that owns a linked worktree, or null when `dir` is not a linked worktree. */
const worktreeMainCheckout = (dir: string): string | null => {
  const gitDir = git(dir, 'rev-parse', '--path-format=absolute', '--git-dir');
  const commonDir = git(dir, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  if (!gitDir || !commonDir || gitDir === commonDir) {
    return null;
  }
  if (path.basename(commonDir) === '.git') {
    return path.dirname(commonDir);
  }
  // Submodule checkouts keep their repository elsewhere and point back with core.worktree.
  return git(commonDir, `--git-dir=${commonDir}`, 'rev-parse', '--show-toplevel');
};

/**
 * Resolution order: explicit path (variable or flag), then the parent folder of
 * the frontend (monorepo layout), then a subfolder of the frontend (CI layout).
 */
export function resolveServiceDir({
  service,
  frontendDir,
  explicit,
}: {
  service: ServiceName;
  frontendDir: string;
  explicit?: string;
}): Resolution {
  const { repo, variable, flag } = SERVICE_SETTINGS[service];
  const howToSet = `Set ${variable}=<path> or pass ${flag} <path>.`;
  if (explicit) {
    if (isDirectory(explicit)) {
      return { ok: true, dir: path.resolve(explicit), source: 'explicit' };
    }
    return {
      ok: false,
      tried: [explicit],
      message: `${repo} not found at the explicit path ${explicit} (from ${variable} or ${flag}). ${howToSet}`,
    };
  }

  const parent = path.join(path.dirname(path.resolve(frontendDir)), repo);
  const subfolder = path.join(path.resolve(frontendDir), repo);
  if (isDirectory(parent)) {
    return { ok: true, dir: parent, source: 'parent' };
  }
  if (isDirectory(subfolder)) {
    return { ok: true, dir: subfolder, source: 'subfolder' };
  }

  const tried = [parent, subfolder];
  const lines = [`${repo} checkout not found. Tried:`, ...tried.map(dir => `  - ${dir}`), howToSet];
  const mainCheckout = worktreeMainCheckout(frontendDir);
  if (mainCheckout) {
    const branch = git(frontendDir, 'branch', '--show-current') || '<branch>';
    const mainService = path.join(path.dirname(mainCheckout), repo);
    lines.push(
      `This looks like a frontend-only worktree. Create a matching ${repo} worktree next to it:`,
      `  git -C ${mainService} worktree add ${parent} ${branch}`,
      `(add -b to create the branch if ${repo} does not have it), or point ${variable} at an existing checkout.`,
    );
  }
  return { ok: false, tried, message: lines.join('\n') };
}

/** Current branch (or `(detached)`) and HEAD revision of a checkout, for the run header. */
export function describeCheckout(dir: string): { branch: string; rev: string } {
  return {
    branch: git(dir, 'branch', '--show-current') || '(detached)',
    rev: git(dir, 'rev-parse', 'HEAD') || 'unknown',
  };
}

/**
 * Warns when a service checkout has a branch named like the frontend's but
 * another one checked out. Only reads refs: the launcher never switches branches.
 */
export function branchMismatchWarning({
  service,
  dir,
  frontendBranch,
}: {
  service: ServiceName;
  dir: string;
  frontendBranch: string;
}): string | null {
  if (!frontendBranch) {
    return null;
  }
  const current = git(dir, 'branch', '--show-current') || '(detached)';
  if (current === frontendBranch) {
    return null;
  }
  const refs = git(dir, 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes') || '';
  const hasMatchingBranch = refs
    .split('\n')
    .some(
      ref =>
        ref === `refs/heads/${frontendBranch}` ||
        (/^refs\/remotes\/[^/]+\//.test(ref) && ref.replace(/^refs\/remotes\/[^/]+\//, '') === frontendBranch),
    );
  if (!hasMatchingBranch) {
    return null;
  }
  const { repo } = SERVICE_SETTINGS[service];
  return `${repo} has a branch named ${frontendBranch} like the frontend, but ${current} is checked out in ${dir}. The launcher does not switch branches; check it out yourself if the feature needs it.`;
}
