import cache from './cache';

export const ONE_HOUR_IN_SECONDS = 60 * 60;

/**
 * A small wrapper arround the cache specialized to handle rate limitings.
 */
export default class RateLimit {
  private cacheKey: string;
  private limit: number;
  private expiryTimeInSeconds: number;

  constructor(cacheKey: string, limit: number, expiryTimeInSeconds: number = ONE_HOUR_IN_SECONDS) {
    this.cacheKey = cacheKey;
    this.limit = limit;
    this.expiryTimeInSeconds = expiryTimeInSeconds;
  }

  /** Load the count from cache if required and check if the limit has been reached */
  public async hasReachedLimit(): Promise<boolean> {
    const count = await this.getCallsCount();
    return count >= this.limit;
  }

  /** Register `nbCalls` in the cache. Returns false if limit has been reached. */
  public async registerCall(): Promise<boolean> {
    const count = await this.getCallsCount();
    if (count >= this.limit) {
      return false;
    } else {
      cache.set(this.cacheKey, count + 1, this.expiryTimeInSeconds);
      return true;
    }
  }

  /** Resets the limit */
  public async reset(): Promise<undefined> {
    return cache.del(this.cacheKey);
  }

  /** Load existing count from cache returns it */
  public async getCallsCount(): Promise<number> {
    return (await cache.get(this.cacheKey)) || 0;
  }
}
