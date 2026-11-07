/**
 * Command-line bridge between `test/playwright/run-local.sh` and the launcher
 * helpers. Runs under plain `node` (type stripping, no build step):
 *
 *   node test/playwright/launcher/cli.ts resolve <api|images|pdf> <frontendDir> [explicitPath]
 *   node test/playwright/launcher/cli.ts describe <dir>
 *   node test/playwright/launcher/cli.ts branch-warning <api|images|pdf> <dir> <frontendBranch>
 *   node test/playwright/launcher/cli.ts install-reason <dir>
 *   node test/playwright/launcher/cli.ts install-record <dir>
 *   node test/playwright/launcher/cli.ts stamp-compute <dir> [KEY=VALUE...]
 *   node test/playwright/launcher/cli.ts stamp-check <dir> <stampFile> <stampJson>
 *   node test/playwright/launcher/cli.ts stamp-save <stampFile> <stampJson> [buildIdFile]
 *   node test/playwright/launcher/cli.ts frontend-owner <buildIdFile> <stampFile>
 *   node test/playwright/launcher/cli.ts port-owner <port>
 *
 * Errors go to stderr with exit code 2; results go to stdout.
 */
import fs from 'node:fs';

import { portOwner } from './ports.ts';
import type { ServiceName } from './services.ts';
import { branchMismatchWarning, describeCheckout, resolveServiceDir, SERVICE_SETTINGS } from './services.ts';
import type { BuildStamp } from './stamps.ts';
import { computeBuildStamp, frontendBuildOwner, installReason, recordInstall, staleReasons } from './stamps.ts';

class CliError extends Error {}

const fail = (message: string): never => {
  throw new CliError(message);
};

const readText = (file: string): string | null => {
  try {
    return fs.readFileSync(file, 'utf8').trim() || null;
  } catch {
    return null;
  }
};

const readStamp = (file: string): BuildStamp | null => {
  const text = readText(file);
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/** A stamp passed on the command line: malformed JSON is a usage error. */
const parseStamp = (json: string): BuildStamp => {
  try {
    return JSON.parse(json);
  } catch {
    return fail(`malformed build stamp JSON: ${json}`);
  }
};

const service = (name: string): ServiceName =>
  Object.hasOwn(SERVICE_SETTINGS, name) ? (name as ServiceName) : fail(`unknown service: ${name}`);

function run(command: string | undefined, args: string[]): void {
  switch (command) {
    case 'resolve': {
      const result = resolveServiceDir({
        service: service(args[0]),
        frontendDir: args[1],
        explicit: args[2] || undefined,
      });
      if (result.ok === false) {
        fail(result.message);
      } else {
        process.stdout.write(`${result.dir}\t${result.source}\n`);
      }
      break;
    }
    case 'describe': {
      const { branch, rev } = describeCheckout(args[0]);
      process.stdout.write(`${branch}\t${rev}\n`);
      break;
    }
    case 'branch-warning': {
      const warning = branchMismatchWarning({ service: service(args[0]), dir: args[1], frontendBranch: args[2] || '' });
      if (warning) {
        process.stdout.write(`${warning}\n`);
      }
      break;
    }
    case 'install-reason': {
      const reason = installReason(args[0]);
      if (reason) {
        process.stdout.write(`${reason}\n`);
      }
      break;
    }
    case 'install-record':
      recordInstall(args[0]);
      break;
    case 'stamp-compute': {
      const buildEnv = Object.fromEntries(
        args.slice(1).map(pair => {
          const index = pair.indexOf('=');
          return index > 0 ? [pair.slice(0, index), pair.slice(index + 1)] : fail(`expected KEY=VALUE, got ${pair}`);
        }),
      );
      process.stdout.write(`${JSON.stringify(computeBuildStamp({ dir: args[0], buildEnv }))}\n`);
      break;
    }
    case 'stamp-check': {
      const reasons = staleReasons({ dir: args[0], recorded: readStamp(args[1]), current: parseStamp(args[2]) });
      if (reasons.length > 0) {
        process.stdout.write(`${reasons.join(', ')}\n`);
      }
      break;
    }
    case 'stamp-save': {
      const stamp = parseStamp(args[1]);
      const buildId = args[2] ? readText(args[2]) : null;
      if (args[2] && !buildId) {
        fail(`build finished without ${args[2]}`);
      }
      if (buildId) {
        stamp.buildId = buildId;
      }
      stamp.builtAt = new Date().toISOString();
      fs.writeFileSync(args[0], `${JSON.stringify(stamp, null, 2)}\n`);
      break;
    }
    case 'frontend-owner':
      process.stdout.write(`${frontendBuildOwner({ buildId: readText(args[0]), stamp: readStamp(args[1]) })}\n`);
      break;
    case 'port-owner': {
      const owner = portOwner(Number(args[0]));
      if (owner) {
        process.stdout.write(`${owner.pid ?? '?'}\t${owner.command}${owner.cwd ? ` (in ${owner.cwd})` : ''}\n`);
      }
      break;
    }
    default:
      fail(`unknown command: ${command ?? '<none>'}`);
  }
}

try {
  const [command, ...args] = process.argv.slice(2);
  run(command, args);
} catch (error) {
  if (!(error instanceof CliError)) {
    throw error;
  }
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
}
