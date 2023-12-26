import * as utils from '../currency-utils';

describe('currency utils lib', () => {
  test('getCurrencySymbol', () => {
    expect(utils.getCurrencySymbol('USD')).toEqual('$');
    expect(utils.getCurrencySymbol('EUR')).toEqual('€');
    expect(utils.getCurrencySymbol('JPY')).toEqual('¥');
  });
});
