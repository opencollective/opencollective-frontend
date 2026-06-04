import { defineMessage } from 'react-intl';

import { makeAmountFilter } from './index';
import { AmountFilterType } from './schema';

describe('makeAmountFilter', () => {
  const totalContributed = makeAmountFilter(
    'totalContributed',
    defineMessage({ id: 'test', defaultMessage: 'Total Contributed' }),
  );

  it('forwards meta.currency when the filter value has no currency', () => {
    const out = totalContributed.toVariables(
      {
        type: AmountFilterType.IS_EQUAL_TO,
        gte: 1000,
        lte: 1000,
      },
      'totalContributed',
      { currency: 'USD' },
    );

    expect(out).toEqual({
      totalContributed: {
        gte: { valueInCents: 1000, currency: 'USD' },
        lte: { valueInCents: 1000, currency: 'USD' },
      },
    });
  });

  it('prefers currency on the filter value over meta.currency', () => {
    const out = totalContributed.toVariables(
      {
        type: AmountFilterType.IS_EQUAL_TO,
        gte: 1000,
        lte: 1000,
        currency: 'EUR',
      },
      'totalContributed',
      { currency: 'USD' },
    );

    expect(out).toEqual({
      totalContributed: {
        gte: { valueInCents: 1000, currency: 'EUR' },
        lte: { valueInCents: 1000, currency: 'EUR' },
      },
    });
  });
});
