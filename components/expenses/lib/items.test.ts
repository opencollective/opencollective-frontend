import { getExpenseItemAmountV2FromNewAttrs, newExpenseItem } from './items';
import { computeExpenseAmounts } from './utils';

describe('getExpenseItemAmountV2FromNewAttrs', () => {
  const draftItem = { amount: 1000, currency: 'EUR', expenseCurrencyFxRate: 1.1 };

  it('builds an exchange rate from the item currency to the expense currency', () => {
    const amountV2 = getExpenseItemAmountV2FromNewAttrs(draftItem, 'USD');
    expect(amountV2.exchangeRate.fromCurrency).toBe('EUR');
    expect(amountV2.exchangeRate.toCurrency).toBe('USD');
  });

  it('lets computeExpenseAmounts total a draft item in another currency', () => {
    const item = newExpenseItem(draftItem, 'USD');
    expect(computeExpenseAmounts('USD', [item], []).totalAmount).toBe(1100);
  });
});
