import { isNil, round, sumBy } from 'lodash';

import { diffExchangeRates } from '../../../lib/currency-utils';

import type { ExpenseItemFormValues } from '../types/FormValues';

// Please adjust the values below based on `prepareItems` from `api/server/graphql/common/expenses.ts`
// ts-unused-exports:disable-next-line
export const FX_RATE_WARNING_THRESHOLD = 0.02;
export const FX_RATE_ERROR_THRESHOLD = 0.1;

export const isTaxRateValid = rate => !isNil(rate) && rate >= 0 && rate <= 1;

export const getTaxAmount = (baseAmount, tax) => {
  return Math.round(baseAmount * tax.rate);
};

/**
 * Given an user-provided exchange rate and a reference, if both can safely be compared, this function will return
 * warnings/errors when both values are too different.
 */
export const getExpenseExchangeRateWarningOrError = (intl, exchangeRate, referenceExchangeRate) => {
  const exchangeRatesDiff = diffExchangeRates(exchangeRate, referenceExchangeRate);

  if (exchangeRatesDiff > FX_RATE_ERROR_THRESHOLD) {
    return {
      error: intl.formatMessage(
        {
          defaultMessage:
            "This exchange rate is too different from the one in our records ({value}) for that date and won't be accepted.",
          id: 'cEI/zq',
        },
        { value: round(referenceExchangeRate.value, 7) },
      ),
    };
  } else if (exchangeRatesDiff > FX_RATE_WARNING_THRESHOLD) {
    return {
      warning: intl.formatMessage(
        {
          defaultMessage:
            'This exchange rate is notably different from the one in our records ({value}) for this date.',
          id: 'mLRswr',
        },
        { value: round(referenceExchangeRate.value, 7) },
      ),
    };
  }

  return null;
};

const itemHasValidAmount = (expenseCurrency: string, item: ExpenseItemFormValues): boolean => {
  return Boolean(
    // Either the item has an amount set with the same currency as the expense
    item.amountV2?.valueInCents &&
    (item.amountV2.currency === expenseCurrency ||
      // Or a valid exchange rate was provided
      (item.amountV2.exchangeRate &&
        item.amountV2.exchangeRate.fromCurrency === item.amountV2.currency &&
        item.amountV2.exchangeRate.toCurrency === expenseCurrency &&
        item.amountV2.exchangeRate.value)),
  );
};

const sumItemsAmounts = (expenseCurrency: string, items: ExpenseItemFormValues[]): number => {
  return sumBy(items, item => {
    const amountInCents = item.amountV2.valueInCents;
    return item.amountV2.currency === expenseCurrency
      ? amountInCents
      : Math.round(amountInCents * item.amountV2.exchangeRate.value);
  });
};

export const computeExpenseAmounts = (expenseCurrency: string, items: ExpenseItemFormValues[], taxes) => {
  const areAllItemsValid = items.every(item => itemHasValidAmount(expenseCurrency, item));
  const activeTaxes = taxes?.filter(tax => !tax.isDisabled) || [];
  const hasTaxes = Boolean(activeTaxes.length);
  const areAllTaxesValid = !hasTaxes || activeTaxes.every(tax => isTaxRateValid(tax.rate));
  const totalInvoiced = !areAllItemsValid ? null : sumItemsAmounts(expenseCurrency, items);
  const allTaxes = sumBy(activeTaxes, tax => getTaxAmount(totalInvoiced, tax));
  const totalAmount = areAllItemsValid && areAllTaxesValid ? totalInvoiced + allTaxes : null;
  return { hasTaxes, totalInvoiced, totalAmount };
};

export const getAmountWithoutTaxes = (totalAmount, taxes) => {
  return totalAmount / (1 + sumBy(taxes, 'rate'));
};
