import * as utils from '../currency-utils.js';

describe('currency utils lib', () => {
  test('getCurrencySymbol', () => {
    expect(utils.getCurrencySymbol('USD')).toEqual('$');
    expect(utils.getCurrencySymbol('EUR')).toEqual('€');
    expect(utils.getCurrencySymbol('JPY')).toEqual('¥');
  });

  describe('getPrecisionForCurrency', () => {
    it('returns known currency precisions', () => {
      expect(utils.getPrecisionForCurrency('USD')).toEqual(2);
      expect(utils.getPrecisionForCurrency('BRL')).toEqual(2);
      expect(utils.getPrecisionForCurrency('KRW')).toEqual(0);
      expect(utils.getPrecisionForCurrency('JPY')).toEqual(0);
    });

    it('returns default precision for unknown currency', () => {
      expect(utils.getPrecisionForCurrency('')).toEqual(2);
      expect(utils.getPrecisionForCurrency('123')).toEqual(2);
      expect(utils.getPrecisionForCurrency('XYZ')).toEqual(2);
    });
  });

  describe('getStepForCurrency', () => {
    it('returns known currency step value', () => {
      expect(utils.getStepForCurrency('USD')).toEqual(0.01);
      expect(utils.getStepForCurrency('BRL')).toEqual(0.01);
      expect(utils.getStepForCurrency('KRW')).toEqual(1);
      expect(utils.getStepForCurrency('JPY')).toEqual(1);
    });

    it('returns default step value for unknown currency', () => {
      expect(utils.getStepForCurrency('')).toEqual(0.01);
      expect(utils.getStepForCurrency('123')).toEqual(0.01);
      expect(utils.getStepForCurrency('XYZ')).toEqual(0.01);
    });
  });
});
