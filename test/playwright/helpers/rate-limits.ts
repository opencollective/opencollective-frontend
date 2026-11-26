import { createClient } from 'redis';

/**
 * The API counts sign-up requests per client IP (`signup_ip_${req.ip}` in `server/controllers/users.ts`), at most
 * `OTP_RATE_LIMIT_MAX_ATTEMPTS` (5) per 15 minutes, in its Redis cache, which survives `--fresh`. Every journey signs
 * up from this machine, under whichever form Express gives the loopback address, so a few runs in a row against a
 * running environment would be refused.
 */
const SIGNUP_KEYS = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].map(ip => `signup_ip_${ip}`);

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

/** Gives the next sign-up from this machine a fresh window. The product limit and the per-email limit stay in force. */
export async function resetSignupRateLimit(): Promise<void> {
  await withRedis(client => client.del(SIGNUP_KEYS));
}
