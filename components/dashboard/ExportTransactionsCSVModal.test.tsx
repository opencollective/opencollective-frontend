import { makeUrl } from './ExportTransactionsCSVModal';

describe('ExportTransactionsCSVModal makeUrl', () => {
  it.each([false, true])(
    'passes payment method, payout method and virtual card filters (host report: %s)',
    isHostReport => {
      const url = makeUrl({
        account: { slug: 'example' },
        isHostReport,
        queryFilter: {
          variables: {
            paymentMethod: [{ id: 'pm-one' }, { id: 'pm-two' }],
            payoutMethod: { id: 'payout-one' },
            virtualCard: [{ id: 'vc-one' }, { id: 'vc-two' }],
          },
        },
      });

      const { searchParams } = new URL(url);
      expect(searchParams.get('paymentMethod')).toBe('pm-one,pm-two');
      expect(searchParams.get('payoutMethod')).toBe('payout-one');
      expect(searchParams.get('virtualCard')).toBe('vc-one,vc-two');
    },
  );

  it('omits the filters when they are not set', () => {
    const url = makeUrl({
      account: { slug: 'example' },
      queryFilter: { variables: { paymentMethod: [], virtualCard: [] } },
    });

    const { searchParams } = new URL(url);
    expect(searchParams.has('paymentMethod')).toBe(false);
    expect(searchParams.has('payoutMethod')).toBe(false);
    expect(searchParams.has('virtualCard')).toBe(false);
  });
});
