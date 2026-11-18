import { expect } from '@playwright/test';
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
