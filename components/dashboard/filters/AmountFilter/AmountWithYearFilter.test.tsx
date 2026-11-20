import { makeAmountWithYearFilter } from './AmountWithYearFilter';
import { AmountFilterType } from './schema';

describe('makeAmountWithYearFilter', () => {
  const filter = makeAmountWithYearFilter('totalContributed', { id: 'test', defaultMessage: 'Total Contributed' });

  it('adds the year to the variables', () => {
    const out = filter.toVariables(
      { type: AmountFilterType.IS_GREATER_THAN, gte: 1000, year: 2025 },
      'totalContributed',
      { currency: 'USD' },
    );

    expect(out).toEqual({
      totalContributed: { gte: { valueInCents: 1000, currency: 'USD' }, lte: undefined, year: 2025 },
    });
  });

  it('leaves the year undefined (all time) when not set', () => {
    const out = filter.toVariables({ type: AmountFilterType.IS_LESS_THAN, lte: 5000 }, 'totalContributed', {
      currency: 'USD',
    });

    expect(out.totalContributed.year).toBeUndefined();
    expect(out.totalContributed.lte).toEqual({ valueInCents: 5000, currency: 'USD' });
  });

  it('parses the year from the URL value', () => {
    const parsed = filter.schema.parse({ type: AmountFilterType.IS_GREATER_THAN, gte: '1000', year: '2024' });
    expect(parsed).toMatchObject({ gte: 1000, year: 2024 });
  });
});
