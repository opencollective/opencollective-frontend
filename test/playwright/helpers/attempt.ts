import type { TestInfo } from '@playwright/test';

/** Short suffix unique to one attempt, for names a journey invents. A retry gets a new one. */
export const attemptTag = (attempt: { nonce: string }) => attempt.nonce.slice(0, 8);

/**
 * Opt-in isolation probe (`PLAYWRIGHT_ISOLATION_PROBE=1`): fails the first
 * attempt at this point, once the journey has really changed something, so
 * that a retry can show it starts from fresh prerequisites. `leftBehind` says
 * what the failed attempt leaves and what the retry has to do without.
 */
export function isolationProbe(testInfo: TestInfo, leftBehind: string) {
  if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
    throw new Error(`Intentional isolation probe: ${leftBehind}`);
  }
}
