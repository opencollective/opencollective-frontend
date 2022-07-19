import { TaxType } from '@opencollective/taxes';
import { isEmpty, isNil, sumBy } from 'lodash';

import { CollectiveType } from '../../../lib/constants/collectives';
import expenseTypes from '../../../lib/constants/expenseTypes';

import { validateTaxGST } from '../ExpenseGSTFormikFields';
import { validateTaxVAT } from '../ExpenseVATFormikFields';

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

export const computeExpenseAmounts = (items, taxes) => {
  const areAllItemsValid = items.every(item => !isNil(item.amount));
  const activeTaxes = taxes?.filter(tax => !tax.isDisabled) || [];
  const hasTaxes = Boolean(activeTaxes.length);
  const areAllTaxesValid = !hasTaxes || activeTaxes.every(tax => isTaxRateValid(tax.rate));
  const totalInvoiced = areAllItemsValid ? sumBy(items, 'amount') : null;
  const totalAmount =
    areAllItemsValid && areAllTaxesValid
      ? totalInvoiced + sumBy(activeTaxes || [], tax => getTaxAmount(totalInvoiced, tax))
      : null;

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
    const taxesErrors = enabledTaxes.map(tax => {
      switch (tax.type) {
        case TaxType.GST:
          return validateTaxGST(intl, tax);
        case TaxType.VAT:
          return validateTaxVAT(intl, tax);
        default:
          return `Tax type ${tax.type} is not supported`; // No i18n because it's a developer error
      }
    });

    const hasErrors = taxesErrors.some(errors => !isEmpty(errors));
    return hasErrors ? taxesErrors : null;
  }
};
