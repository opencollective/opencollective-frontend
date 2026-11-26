import { expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';

/**
 * The API's Redis as the launcher hands it to the run (`REDIS_URL`). It can be
 * supplied infrastructure shared with a local development API, so a journey
 * only ever reads or deletes keys it names: never scan-and-delete, never flush.
 * The connection lives in the test runner, so nothing reaches browser traces.
 */
export class RedisStore {
  private readonly client: ReturnType<typeof createClient>;

  private constructor(url: string) {
    this.client = createClient({ url });
    // Without a listener, a dropped connection is thrown as an uncaught exception that hides the cause behind a
    // worker failure. Only the error code is logged: the URL can carry credentials.
    this.client.on('error', (error: Error & { code?: string }) => {
      // eslint-disable-next-line no-console
      console.warn(`Redis client error: ${error.code ?? error.name}`);
    });
  }

  static async connect(): Promise<RedisStore> {
    if (!process.env.REDIS_URL) {
      throw new Error('Redis access requires REDIS_URL. Run test/playwright/run-local.sh (or --reuse).');
    }
    const store = new RedisStore(process.env.REDIS_URL);
    await store.client.connect();
    return store;
  }

  /** The integer counter stored at `key`, or 0 when it does not exist (e.g. its window expired). */
  async count(key: string): Promise<number> {
    const value = await this.client.get(key);
    return value === null ? 0 : Number(value);
  }

  /** Stores `value` at `key` for `ttlSeconds`, replacing what was there. */
  async set(key: string, value: string | number, ttlSeconds: number): Promise<void> {
    await this.client.set(key, String(value), { EX: ttlSeconds });
  }

  /** Deletes exactly these keys and returns how many existed. */
  async reset(...keys: string[]): Promise<number> {
    return Number(await this.client.del(keys));
  }

  /** Stores `value` at `key` for `ttlMs` only when `key` does not exist; true when it was stored. */
  async setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    const reply = await this.client.set(key, value, { condition: 'NX', expiration: { type: 'PX', value: ttlMs } });
    return reply === 'OK';
  }

  /** Deletes `key` only while it still holds `value` (one atomic step), so an expired holder never frees a newer one. */
  async deleteIfEquals(key: string, value: string): Promise<void> {
    await this.client.eval("if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end", {
      keys: [key],
      arguments: [value],
    });
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

/**
 * The API buckets each OTP signup step by client IP (`${route}_ip_${req.ip}` in `server/controllers/users.ts`),
 * at most 5 per 15 minutes (`OTP_RATE_LIMIT_*` in `server/lib/auth.ts`), and successful calls are never given back. Every journey signs up from this machine,
 * under whichever form Express gives the loopback address.
 */
const SIGNUP_ROUTES = ['signup', 'verifyEmail', 'resendOTP'] as const;
const OTP_RATE_LIMIT = { max: 5, windowSeconds: 15 * 60 };
type SignupRoute = (typeof SIGNUP_ROUTES)[number];
const LOOPBACK_IPS = ['::1', '127.0.0.1', '::ffff:127.0.0.1'];
const ipKeys = (route: SignupRoute) => LOOPBACK_IPS.map(ip => `${route}_ip_${ip}`);

/**
 * Runs joined to one E2E environment (`--reuse`, `npm run e2e`) share its Redis, so they share this machine's signup
 * budget: one run's rate-limited journey would refuse another run's signup, and its reset would clear the other's
 * counts. Within a run the signup file holds one worker; across runs, each journey that touches the budget holds this
 * lock. Its expiry frees it within `ttlMs` when a run is killed before releasing it; a journey ends well within it
 * (the test timeout is 60 s).
 */
const SIGNUP_LOCK = { key: 'playwright_e2e_signup_lock', ttlMs: 90_000, pollMs: 250 };

/** How long a journey waits for the signup lock: a held lock is released, or expires, within its TTL. */
export const SIGNUP_LOCK_WAIT_MS = SIGNUP_LOCK.ttlMs + 5_000;

/** Waits until this journey holds the signup lock, and returns the function that releases it. */
export async function lockSignupBudget(redis: RedisStore): Promise<() => Promise<void>> {
  const token = randomUUID();
  const deadline = Date.now() + SIGNUP_LOCK_WAIT_MS;
  while (!(await redis.setIfAbsent(SIGNUP_LOCK.key, token, SIGNUP_LOCK.ttlMs))) {
    if (Date.now() > deadline) {
      throw new Error(
        `Signup journeys of another run against this E2E environment kept ${SIGNUP_LOCK.key} for ${SIGNUP_LOCK_WAIT_MS / 1000} s`,
      );
    }
    await new Promise(resolve => setTimeout(resolve, SIGNUP_LOCK.pollMs));
  }
  return () => redis.deleteIfEquals(SIGNUP_LOCK.key, token);
}

/**
 * Gives the next signup from this machine fresh rate-limit windows for requesting, verifying and resending a code, so
 * re-runs and retries against a running E2E environment are not refused. The product limits stay in force.
 */
export async function resetSignupRateLimits(redis: RedisStore): Promise<void> {
  await redis.reset(...SIGNUP_ROUTES.flatMap(ipKeys));
}

/**
 * Checks, after a signup step, that it was counted under a key `resetSignupRateLimits` clears. Fails when the
 * API changes how it names the bucket, instead of letting the reset silently do nothing.
 */
export async function expectSignupStepTracked(redis: RedisStore, route: SignupRoute): Promise<void> {
  const keys = ipKeys(route);
  const counts = await Promise.all(keys.map(key => redis.count(key)));
  expect(
    counts.some(count => count > 0),
    `The ${route} call was not counted under any of ${keys.join(', ')}: update the keys to the API's`,
  ).toBe(true);
}

/**
 * Spends this machine's whole signup budget, so the next signup request is refused as rate limited. Every other
 * signup journey is then refused too until `resetSignupRateLimits`: only use it in a journey that resets afterwards,
 * in the spec file that holds every signup journey (a file runs in one worker).
 */
export async function exhaustSignupRateLimit(redis: RedisStore): Promise<void> {
  for (const key of ipKeys('signup')) {
    await redis.set(key, OTP_RATE_LIMIT.max, OTP_RATE_LIMIT.windowSeconds);
  }
}

/**
 * Ends the open verification session of `email` the way its expiry would (`otp_signup_${email}` in the API's
 * session store). Fails when there was no such session, so a renamed key cannot make it a silent no-op.
 */
export async function expireSignupSession(redis: RedisStore, email: string): Promise<void> {
  const deleted = await redis.reset(`otp_signup_${email.toLowerCase()}`);
  expect(deleted, `No open verification session was stored for ${email}`).toBe(1);
}
