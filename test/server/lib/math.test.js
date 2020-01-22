import { expect } from 'chai';
import { toNegative } from '../../../server/lib/math';

describe('server/lib/math', () => {
  describe('#toNegative', () => {
    it('should convert positive numbers to negative', () => {
      expect(toNegative(10)).to.equal(-10);
    });
    it('should not do anything with negative numbers', () => {
      expect(toNegative(-10)).to.equal(-10);
    });
  });
});
