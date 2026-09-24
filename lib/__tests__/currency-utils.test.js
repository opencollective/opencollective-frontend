import * as utils from '../currency-utils';

describe('currency utils lib', () => {
  test('getCurrencySymbol', () => {
    expect(utils.getCurrencySymbol('USD')).toEqual('$');
    expect(utils.getCurrencySymbol('EUR')).toEqual('€');
    expect(utils.getCurrencySymbol('JPY')).toEqual('¥');
  });

  describe('roundCentsAmount', () => {
    it('leaves regular currency amounts unchanged', () => {
      expect(utils.roundCentsAmount(150, 'USD')).toBe(150); // $1.50
      expect(utils.roundCentsAmount(1575, 'EUR')).toBe(1575); // €15.75
      expect(utils.roundCentsAmount(750, 'GBP')).toBe(750); // £7.50
    });

    it('rounds zero-decimal currency amounts to the nearest 100', () => {
      // 750 → ¥7.50 is invalid; nearest whole yen is ¥8 → 800
      expect(utils.roundCentsAmount(750, 'JPY')).toBe(800);
      // 749 → rounds down to ¥7 → 700
      expect(utils.roundCentsAmount(749, 'JPY')).toBe(700);
      // Already a multiple of 100 → unchanged
      expect(utils.roundCentsAmount(5000, 'JPY')).toBe(5000);
      // KRW is also zero-decimal
      expect(utils.roundCentsAmount(1250, 'KRW')).toBe(1300);
    });

    it('handles zero amount', () => {
      expect(utils.roundCentsAmount(0, 'JPY')).toBe(0);
      expect(utils.roundCentsAmount(0, 'USD')).toBe(0);
    });
  });
});
