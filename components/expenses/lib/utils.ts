import { isEmpty, isNil, round, sumBy, uniq } from 'lodash';

import { FEATURES, isFeatureEnabled } from '../../../lib/allowed-features';
import { CollectiveType } from '../../../lib/constants/collectives';
import { Currency, PayPalSupportedCurrencies } from '../../../lib/constants/currency';
import expenseTypes from '../../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../../lib/constants/payout-method';
import { diffExchangeRates } from '../../../lib/currency-utils';

import { validateTaxInput } from '../../taxes/TaxesFormikFields';
import type { ExpenseItemFormValues } from '../types/FormValues';

// Please adjust the values below based on `prepareItems` from `api/server/graphql/common/expenses.ts`
// ignore unused exports FX_RATE_WARNING_THRESHOLD
export const FX_RATE_WARNING_THRESHOLD = 0.02;
export const FX_RATE_ERROR_THRESHOLD = 0.1;

export const checkRequiresAddress = values => {
  const collectiveTypesRequiringAddress = [CollectiveType.INDIVIDUAL, CollectiveType.USER, CollectiveType.ORGANIZATION];
  const expenseTypesRequiringAddress = [expenseTypes.INVOICE, expenseTypes.GRANT];

  return (
    expenseTypesRequiringAddress.includes(values.type) &&
    (values.payee?.isNewUser ||
      (values.payee &&
        !values.payee.isInvite &&
        (collectiveTypesRequiringAddress.includes(values.payee.type) || values.payee.isHost)))
  );
};

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
        },
        { value: round(referenceExchangeRate.value, 7) },
      ),
    };
  } else if (exchangeRatesDiff > FX_RATE_WARNING_THRESHOLD) {
    return {
      warning: intl.formatMessage(
        {
          defaultMessage:
            'This exchange rate looks very different from the one in our records ({value}) for this date.',
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

export const validateExpenseTaxes = (intl, taxes) => {
  const enabledTaxes = taxes?.filter(tax => !tax.isDisabled) || [];
  if (!enabledTaxes.length) {
    return null;
  } else {
    const taxesErrors = enabledTaxes.map(tax => validateTaxInput(intl, tax));
    const hasErrors = taxesErrors.some(errors => !isEmpty(errors));
    return hasErrors ? taxesErrors : null;
  }
};

/**
 * Returns the list of supported currencies for this expense / payout method.
 * The collective currency always comes first.
 */
export const getSupportedCurrencies = (collective, { payee, payoutMethod, type, currency }) => {
  // We don't allow changing the currency for virtual card charges
  if (type === expenseTypes.CHARGE) {
    return [currency];
  }

  // Multi-currency opt-out
  if (
    !isFeatureEnabled(collective, FEATURES.MULTI_CURRENCY_EXPENSES) ||
    !isFeatureEnabled(collective.host, FEATURES.MULTI_CURRENCY_EXPENSES) ||
    payoutMethod?.type === PayoutMethodType.ACCOUNT_BALANCE
  ) {
    return [collective.currency];
  }

  // Allow any currency for invites
  if (payee?.isInvite && !payoutMethod?.data?.currency) {
    return Currency;
  }

  // Adapt based on payout method type
  const isPayPal = payoutMethod?.type === PayoutMethodType.PAYPAL;
  if (isPayPal) {
    const defaultCurrency = PayPalSupportedCurrencies.includes(collective.currency) ? collective.currency : 'USD';
    return uniq([defaultCurrency, ...PayPalSupportedCurrencies]);
  } else if (payoutMethod?.type === PayoutMethodType.OTHER) {
    return Currency.includes(collective.currency) ? uniq([collective.currency, ...Currency]) : Currency;
  } else {
    return uniq(
      [collective.currency, collective.host?.currency, payoutMethod?.currency, payoutMethod?.data?.currency].filter(
        Boolean,
      ),
    );
  }
};

export const expenseTypeSupportsItemCurrency = expenseType => {
  return expenseType === expenseTypes.RECEIPT;
};
