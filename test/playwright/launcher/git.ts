/**
 * The one way the launcher helpers call git. Runs under plain `node` (type
 * stripping) through `cli.ts`, so it only uses erasable TypeScript syntax.
 */
import { execFileSync } from 'node:child_process';

/** Raw stdout of a git command run in `cwd`; throws when git fails. */
export const git = (cwd: string, args: string[]): Buffer =>
  execFileSync('git', args, {
    cwd,
    encoding: 'buffer',
    maxBuffer: 512 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

/** Trimmed stdout of a git command, or null when git fails (not a checkout, unknown ref...). */
export const gitText = (cwd: string, args: string[]): string | null => {
  try {
    return git(cwd, args).toString('utf8').trim();
  } catch {
    return null;
  }
};
