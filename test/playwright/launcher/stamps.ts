/**
 * Build stamps: what a service build was made from, written next to its build
 * output after each successful build. A missing or mismatched stamp means the
 * build output no longer matches the checkout and must be rebuilt.
 *
 * Runs under plain `node` (type stripping) through `cli.ts`.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { git } from './git.ts';

export type BuildStamp = {
  /** Git HEAD the build was made from. */
  head: string;
  /** Hash of `git diff HEAD` plus untracked, non-ignored files outside IGNORED_PATHSPECS; `clean` when there are none. */
  uncommitted: string;
  /** sha256 of package-lock.json. */
  lockfile: string;
  /** Every build-time env var the launcher passes to the build. */
  buildEnv: Record<string, string>;
  /** Next.js BUILD_ID, frontend only (detects builds made outside the launcher). */
  buildId?: string;
  /** When the build finished (informational, not compared). */
  builtAt?: string;
};

/**
 * Paths that never reach a service build, so editing or committing a spec, a
 * test or docs does not ask for a rebuild during iteration: the top-level
 * `test/` and `docs/` folders, top-level Markdown and READMEs anywhere. Other
 * Markdown stays a build input (the frontend bundles its static pages from
 * `components/static-pages/*.md`). See docs/e2e.md (What the stamps leave out).
 */
const IGNORED_PATHSPECS = [':(exclude)test', ':(exclude)docs', ':(exclude,glob)*.md', ':(exclude,glob)**/README.md'];

const sha256 = (data: string | Buffer) => crypto.createHash('sha256').update(data).digest('hex');

const fileSha = (file: string) => {
  try {
    return sha256(fs.readFileSync(file));
  } catch {
    return 'missing';
  }
};

const uncommittedHash = (dir: string) => {
  const diff = git(dir, ['diff', 'HEAD', '--binary', '--', '.', ...IGNORED_PATHSPECS]);
  const untracked = git(dir, ['ls-files', '--others', '--exclude-standard', '-z', '--', '.', ...IGNORED_PATHSPECS])
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .sort();
  if (diff.length === 0 && untracked.length === 0) {
    return 'clean';
  }
  const hash = crypto.createHash('sha256').update(diff);
  for (const file of untracked) {
    hash.update(`\0${file}\0${fileSha(path.join(dir, file))}`);
  }
  return hash.digest('hex');
};

export function computeBuildStamp({ dir, buildEnv }: { dir: string; buildEnv: Record<string, string> }): BuildStamp {
  return {
    head: git(dir, ['rev-parse', 'HEAD']).toString('utf8').trim(),
    uncommitted: uncommittedHash(dir),
    lockfile: fileSha(path.join(dir, 'package-lock.json')),
    buildEnv: { ...buildEnv },
  };
}

/** True when two revisions only differ in paths that never reach the build. */
const sameBuildInputs = (dir: string, from: string, to: string) =>
  spawnSync('git', ['diff', '--quiet', from, to, '--', '.', ...IGNORED_PATHSPECS], { cwd: dir, stdio: 'ignore' })
    .status === 0;

/** Why a recorded stamp no longer matches the checkout; empty when the build is current. */
export function staleReasons({
  dir,
  recorded,
  current,
}: {
  dir: string;
  recorded: BuildStamp | null;
  current: BuildStamp;
}): string[] {
  if (!recorded) {
    return ['no build stamp'];
  }
  const reasons: string[] = [];
  if (recorded.head !== current.head && !sameBuildInputs(dir, recorded.head, current.head)) {
    reasons.push('revision');
  }
  if (recorded.uncommitted !== current.uncommitted) {
    reasons.push('uncommitted changes');
  }
  if (recorded.lockfile !== current.lockfile) {
    reasons.push('lockfile');
  }
  const keys = [...new Set([...Object.keys(recorded.buildEnv || {}), ...Object.keys(current.buildEnv)])].sort();
  const changedEnv = keys.filter(key => recorded.buildEnv?.[key] !== current.buildEnv[key]);
  if (changedEnv.length > 0) {
    reasons.push(`build env (${changedEnv.join(', ')})`);
  }
  return reasons;
}

/** The launcher's record of the last `npm ci` it ran, inside node_modules so it goes away with it. */
const INSTALL_STAMP = path.join('node_modules', '.oc-e2e-install.json');

/** Why `npm ci` must run in a checkout, or null when its node_modules is current. */
export function installReason(dir: string): string | null {
  if (!fs.existsSync(path.join(dir, 'node_modules'))) {
    return 'node_modules is missing';
  }
  const changed = 'package-lock.json changed since the last install';
  const lockfile = path.join(dir, 'package-lock.json');
  try {
    const recorded = JSON.parse(fs.readFileSync(path.join(dir, INSTALL_STAMP), 'utf8'));
    return recorded.lockfile === fileSha(lockfile) ? null : changed;
  } catch {
    // Installed by the engineer: npm rewrites its hidden lockfile on every install.
    try {
      const installedAt = fs.statSync(path.join(dir, 'node_modules', '.package-lock.json')).mtimeMs;
      return installedAt >= fs.statSync(lockfile).mtimeMs ? null : changed;
    } catch {
      return changed;
    }
  }
}

export function recordInstall(dir: string): void {
  const stamp = { lockfile: fileSha(path.join(dir, 'package-lock.json')), installedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, INSTALL_STAMP), `${JSON.stringify(stamp, null, 2)}\n`);
}

/**
 * Who made the build in `.next`: nobody, the launcher (E2E configuration), or
 * someone else (usually the engineer's own `npm run build`). The two share `.next`.
 */
export function frontendBuildOwner({
  buildId,
  stamp,
}: {
  buildId: string | null;
  stamp: BuildStamp | null;
}): 'none' | 'e2e' | 'other' {
  if (!buildId) {
    return 'none';
  }
  return stamp?.buildId === buildId ? 'e2e' : 'other';
}
