import { isSuspiciousUserAgent } from '../robots-detector';

describe('Robots detector', () => {
  describe('', () => {
    it('Detects suspicious user agents', () => {
      expect(
        isSuspiciousUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36',
        ),
      ).toBe(true);
    });

    it('Is fine with missing user agents', () => {
      expect(isSuspiciousUserAgent()).toBe(false);
      expect(isSuspiciousUserAgent(null)).toBe(false);
      expect(isSuspiciousUserAgent('')).toBe(false);
      expect(isSuspiciousUserAgent('      ')).toBe(false);
    });

    it('Returns ok for most browsers', () => {
      expect(
        isSuspiciousUserAgent(
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36',
        ),
      ).toBe(false);

      expect(
        isSuspiciousUserAgent('Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:83.0) Gecko/20100101 Firefox/83.0'),
      ).toBe(false);
    });
  });
});
