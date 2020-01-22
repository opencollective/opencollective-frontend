import { assert } from 'chai';
import { memoize } from '../../../../server/lib/cache';

describe('server/lib/cache', () => {
  describe('memoize', () => {
    const random = () => {
      const value = Math.round(Math.random() * 1000000);
      return Promise.resolve(value);
    };

    it('should return the same value when called twice', async () => {
      const fixedRandom = memoize(random, { key: 'fixed_random' });
      fixedRandom.clear();
      const firstValue = await fixedRandom();
      const secondValue = await fixedRandom();
      assert.strictEqual(firstValue, secondValue);
    });

    it('should not return the same value if cleared between calls', async () => {
      const fixedRandom = memoize(random, { key: 'fixed_random' });
      const firstValue = await fixedRandom();
      fixedRandom.clear();
      const secondValue = await fixedRandom();
      assert.notStrictEqual(firstValue, secondValue);
    });
  });
});
