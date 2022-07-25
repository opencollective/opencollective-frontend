import UrlQueryHelper from '../UrlQueryHelper';

describe('UrlQueryHelper', () => {
  const queryHelper = new UrlQueryHelper({
    amount: { type: 'amount' },
    anotherAmount: { type: 'amount' },
    description: { type: 'string' },
    interval: { type: 'interval' },
    quantity: { type: 'integer' },
    isTest: { type: 'boolean' },
    tags: { type: 'stringArray' },
    color: { type: 'color' },
    data: { type: 'json' },
    anotherAmountAlias: { type: 'alias', on: 'anotherAmount' },
  });

  describe('decode', () => {
    it('should decode a query object as provided by router.query according to `config`', () => {
      expect(
        queryHelper.decode({
          amount: '100',
          description: 'test',
          interval: 'monthly',
          quantity: '1',
          isTest: 'true',
          tags: 'foo,bar',
          color: '#123456',
          data: '{"foo": "bar"}',
          anotherAmountAlias: '200',
        }),
      ).toEqual({
        amount: 10000, // Converted to cents
        description: 'test',
        interval: 'month', // "ly" removed
        quantity: 1,
        isTest: true,
        tags: ['foo', 'bar'],
        color: '#123456',
        data: { foo: 'bar' },
        anotherAmount: 20000, // From anotherAmountAlias
      });
    });

    it('is flexible on the value for color input', () => {
      expect(queryHelper.decode({ color: '#123456' })).toEqual({ color: '#123456' });
      expect(queryHelper.decode({ color: '123456' })).toEqual({ color: '#123456' });
      expect(queryHelper.decode({ color: 'red' })).toEqual({ color: '#f00' });
    });

    it('works with invalid values', () => {
      expect(queryHelper.decode({ amount: 'foo' })).toEqual({ amount: null });
      expect(queryHelper.decode({ interval: 'foo' })).toEqual({ interval: null });
      expect(queryHelper.decode({ quantity: 'foo' })).toEqual({ quantity: null });
      expect(queryHelper.decode({ isTest: 'Not a valid boolean' })).toEqual({ isTest: null });
      expect(queryHelper.decode({ data: 'foo' })).toEqual({ data: null });
      expect(queryHelper.decode({ color: 'xxxxxx' })).toEqual({ color: null });
    });

    it('works with empty values', () => {
      expect(queryHelper.decode({ amount: '' })).toEqual({ amount: null });
      expect(queryHelper.decode({ description: '' })).toEqual({ description: '' });
      expect(queryHelper.decode({ interval: '' })).toEqual({ interval: null });
      expect(queryHelper.decode({ quantity: '' })).toEqual({ quantity: null });
      expect(queryHelper.decode({ isTest: '' })).toEqual({ isTest: null });
      expect(queryHelper.decode({ tags: '' })).toEqual({ tags: null });
      expect(queryHelper.decode({ color: '' })).toEqual({ color: null });
      expect(queryHelper.decode({ data: '' })).toEqual({ data: null });
      expect(queryHelper.decode({ anotherAmountAlias: '' })).toEqual({ anotherAmount: null });
    });
  });

  describe('encode', () => {
    it('should encode the values of `queryObject` to make it safe to pass in router.push', () => {
      expect(
        queryHelper.encode({
          amount: 10000,
          description: 'test',
          interval: 'month',
          quantity: 1,
          isTest: true,
          tags: ['foo', 'bar'],
          color: '#123456',
          data: { foo: 'bar' },
          anotherAmountAlias: 20000,
        }),
      ).toEqual({
        amount: '100',
        description: 'test',
        interval: 'month',
        quantity: '1',
        isTest: 'true',
        tags: 'foo,bar',
        color: '#123456',
        data: '{"foo":"bar"}',
        anotherAmount: '200',
      });
    });
  });
});
