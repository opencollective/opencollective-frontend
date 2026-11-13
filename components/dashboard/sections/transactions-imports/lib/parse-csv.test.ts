import { Currency } from '../../../../../lib/graphql/types/v2/graphql';

import { applyCSVConfig, guessCSVColumnsConfig } from './parse-csv';
import type { CSVConfig } from './types';

const getConfig = (data: Array<Record<string, string>>): CSVConfig => ({
  delimiter: ',',
  columns: guessCSVColumnsConfig(data, Currency.USD),
});

describe('applyCSVConfig', () => {
  it('handles thousands separators with the "1,000.00" format', () => {
    const rows = [
      { 'Total amount': '1,318.52', Description: 'Employment costs', Date: '08/11/2025' },
      { 'Total amount': '-12,345,678.90', Description: 'Refund', Date: '08/12/2025' },
    ];
    const config = getConfig(rows);
    expect(config.columns.credit.format).toBe('1,000.00');
    expect(applyCSVConfig(rows[0], config).amount).toEqual({ valueInCents: 131852, currency: 'USD' });
    expect(applyCSVConfig(rows[1], config).amount).toEqual({ valueInCents: -1234567890, currency: 'USD' });
  });

  it('handles thousands separators with the "1.000,00" format', () => {
    const rows = [{ Amount: '1.318,52', Description: 'Employment costs', Date: '08/11/2025' }];
    const config = getConfig(rows);
    expect(config.columns.credit.format).toBe('1.000,00');
    expect(applyCSVConfig(rows[0], config).amount).toEqual({ valueInCents: 131852, currency: 'USD' });
  });

  it('handles thousands separators in split credit/debit columns', () => {
    const rows = [
      { Credit: '2,448.68', Debit: '', Description: 'Income', Date: '08/11/2025' },
      { Credit: '', Debit: '1,000', Description: 'Expense', Date: '08/11/2025' },
    ];
    const config = getConfig(rows);
    expect(applyCSVConfig(rows[0], config).amount).toEqual({ valueInCents: 244868, currency: 'USD' });
    expect(applyCSVConfig(rows[1], config).amount).toEqual({ valueInCents: -100000, currency: 'USD' });
  });
});
