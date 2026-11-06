/**
 * Which process holds one of the launcher's fixed ports, read from /proc so it
 * works without ss, lsof or fuser (none ship with minimal Linux images).
 *
 * Runs under plain `node` (type stripping) through `cli.ts`.
 */
import fs from 'node:fs';

const LISTEN = '0A';

const readOrNull = <T>(read: () => T): T | null => {
  try {
    return read();
  } catch {
    return null;
  }
};

const listeningInodes = (port: number): Set<string> => {
  const inodes = new Set<string>();
  for (const table of ['/proc/net/tcp', '/proc/net/tcp6']) {
    const lines = readOrNull(() => fs.readFileSync(table, 'utf8').trim().split('\n').slice(1)) || [];
    for (const line of lines) {
      const fields = line.trim().split(/\s+/);
      const localPort = parseInt(fields[1]?.split(':')[1] ?? '', 16);
      if (localPort === port && fields[3] === LISTEN) {
        inodes.add(fields[9]);
      }
    }
  }
  return inodes;
};

/**
 * The process listening on `port`, or null when the port is free. `pid` is null
 * when the socket belongs to a process this user cannot inspect.
 */
export function portOwner(port: number): { pid: number | null; command: string } | null {
  const inodes = listeningInodes(port);
  if (inodes.size === 0) {
    return null;
  }
  const sockets = new Set([...inodes].map(inode => `socket:[${inode}]`));
  for (const entry of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) {
      continue;
    }
    const fds = readOrNull(() => fs.readdirSync(`/proc/${entry}/fd`)) || [];
    for (const fd of fds) {
      const target = readOrNull(() => fs.readlinkSync(`/proc/${entry}/fd/${fd}`));
      if (target && sockets.has(target)) {
        // Empty when the process exited in between.
        const command = (readOrNull(() => fs.readFileSync(`/proc/${entry}/cmdline`, 'utf8')) || '')
          .split('\0')
          .filter(Boolean)
          .join(' ');
        return { pid: Number(entry), command: command || '<unknown command>' };
      }
    }
  }
  return { pid: null, command: 'a process this user cannot inspect (another user, a container, or root)' };
}
