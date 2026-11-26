import { expect } from '@playwright/test';
import { createClient } from 'redis';

/**
 * The API counts email confirmations per client IP (`individual_confirm_email_ip_${req.ip}` in
 * `server/graphql/v2/mutation/IndividualMutations.ts`), at most `confirmEmailPerIpPerHour` (10), in its Redis
 * cache, which survives `--fresh`. Every journey confirms from this machine, under whichever form Express gives
 * the loopback address, so re-runs against a running environment would be refused within the hour.
 */
const CONFIRM_EMAIL_KEYS = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].map(ip => `individual_confirm_email_ip_${ip}`);

/**
 * The API counts sign-up requests and email verifications per client IP (`signup_ip_${req.ip}` and
 * `verifyEmail_ip_${req.ip}` in `server/controllers/users.ts`), at most `OTP_RATE_LIMIT_MAX_ATTEMPTS` (5) each per
 * 15 minutes, in its Redis cache, which survives `--fresh`. Every journey signs up from this machine, under whichever
 * form Express gives the loopback address, so a few runs in a row against a running environment would be refused.
 */
const SIGNUP_KEYS = ['signup_ip', 'verifyEmail_ip'].flatMap(bucket =>
  ['::1', '127.0.0.1', '::ffff:127.0.0.1'].map(ip => `${bucket}_${ip}`),
);

const newClient = (url: string) => createClient({ url });

/** Runs `run` with the API's Redis (`REDIS_URL`), touching only the keys it names: never scan, never flush. */
async function withRedis<T>(run: (client: ReturnType<typeof newClient>) => Promise<T>): Promise<T> {
  if (!process.env.REDIS_URL) {
    throw new Error('Rate-limit resets require REDIS_URL. Run test/playwright/run-local.sh (or --reuse).');
  }
  const client = newClient(process.env.REDIS_URL);
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.quit();
  }
}

/** Gives the next email confirmation from this machine a fresh window. The product limit stays in force. */
export async function resetConfirmEmailRateLimit(): Promise<void> {
  await withRedis(client => client.del(CONFIRM_EMAIL_KEYS));
}

/**
 * Checks, after a confirmation, that it was counted under a key `resetConfirmEmailRateLimit` clears, so a renamed
 * bucket fails here instead of making the reset a silent no-op.
 */
export async function expectConfirmEmailCounted(): Promise<void> {
  const counts = await withRedis(client => Promise.all(CONFIRM_EMAIL_KEYS.map(key => client.get(key))));
  expect(
    counts.some(count => Number(count) > 0),
    `The confirmation was not counted under any of ${CONFIRM_EMAIL_KEYS.join(', ')}: update the keys to the API's`,
  ).toBe(true);
}

/**
 * Gives the next sign-up and its email verification from this machine a fresh window. The product limits, and the
 * per-email ones, stay in force.
 */
export async function resetSignupRateLimits(): Promise<void> {
  await withRedis(client => client.del(SIGNUP_KEYS));
}
