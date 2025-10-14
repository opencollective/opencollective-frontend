/* eslint-disable prefer-arrow-callback */
import React from 'react';
import { pick } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';
import type { Currency } from '../../../lib/graphql/types/v2/schema';
import { ExpenseType } from '../../../lib/graphql/types/v2/schema';
import { getTaxAmount, isTaxRateValid } from '../../expenses/lib/utils';

import { FormField } from '@/components/FormField';

import CurrencyPicker from '../../CurrencyPicker';
import MessageBox from '../../MessageBox';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';
import { memoWithGetFormProps } from './helper';

type ReferenceCurrencySectionProps = ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    ...pick(form, 'setFieldValue', 'isSubmitting'),
    ...pick(form.values, ['referenceCurrency', 'expenseTypeOption', 'expenseItems', 'hasTax', 'tax']),
    ...pick(form.options, [
      'availableReferenceCurrencies',
      'account',
      'payoutMethod',
      'totalInvoicedInExpenseCurrency',
    ]),
  };
}

export function ReferenceCurrencySection(
  props: ReferenceCurrencySectionProps & {
    inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
  },
) {
  return (
    <FormSectionContainer
      title={<FormattedMessage defaultMessage="Reference currency" id="Ho3XqF" />}
      step={Step.REFERENCE_CURRENCY}
      inViewChange={props.inViewChange}
    >
      <ReferenceCurrencyForm {...props} />
    </FormSectionContainer>
  );
}

export const ReferenceCurrencyForm = memoWithGetFormProps(function ReferenceCurrencySection(
  props: ReferenceCurrencySectionProps,
) {
  const {
    setFieldValue,
    availableReferenceCurrencies,
    expenseTypeOption,
    referenceCurrency,
    totalInvoicedInExpenseCurrency,
    hasTax,
    tax,
  } = props;

  // Only show this section if there are multiple currencies in use
  const hasMultipleCurrencies = availableReferenceCurrencies && availableReferenceCurrencies.length > 1;

  const onCurrencyChange = React.useCallback(
    (currency: Currency) => {
      setFieldValue('referenceCurrency', currency);
    },
    [setFieldValue],
  );

  if (!hasMultipleCurrencies || expenseTypeOption === ExpenseType.GRANT) {
    return null;
  }

  // Calculate total amount including tax if applicable
  const totalAmount =
    totalInvoicedInExpenseCurrency &&
    (hasTax && tax && isTaxRateValid(tax.rate)
      ? getTaxAmount(totalInvoicedInExpenseCurrency, tax) + totalInvoicedInExpenseCurrency
      : totalInvoicedInExpenseCurrency);

  return (
    <React.Fragment>
      <MessageBox type="info" className="mb-4">
        {expenseTypeOption === ExpenseType.RECEIPT ? (
          <FormattedMessage
            defaultMessage="For reimbursements, the exchange rates are locked to each item's date to ensure you receive the exact amount you paid."
            id="ReferenceCurrency.ReceiptInfo"
          />
        ) : (
          <FormattedMessage
            defaultMessage="Multiple currencies are in use. Please choose a reference currency that will serve as the contracted amount for this payment."
            id="ReferenceCurrency.Info"
          />
        )}
      </MessageBox>

      <FormField
        name="referenceCurrency"
        label={
          <FormattedMessage
            defaultMessage="Which currency do you intend to bill/pay from?"
            id="ReferenceCurrency.Question"
          />
        }
      >
        {({ field }) => (
          <div>
            <CurrencyPicker
              {...field}
              inputId="reference-currency"
              data-cy="reference-currency-picker"
              availableCurrencies={availableReferenceCurrencies}
              value={referenceCurrency}
              onChange={onCurrencyChange}
              disabled={props.isSubmitting}
            />
            {referenceCurrency && (
              <div className="mt-2 text-sm text-muted-foreground">
                {totalAmount ? (
                  <FormattedMessage
                    defaultMessage="Selecting {currency} means the collective will pay exactly {amount} {currency}, and any currency conversions will be based on this amount."
                    id="ReferenceCurrency.HintWithAmount"
                    values={{
                      currency: referenceCurrency,
                      amount: formatCurrency(totalAmount, referenceCurrency as Currency, { precision: 2 }),
                    }}
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="Selecting {currency} means the collective will pay in {currency}, and any currency conversions will be based on this amount."
                    id="ReferenceCurrency.Hint"
                    values={{ currency: referenceCurrency }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </FormField>
    </React.Fragment>
  );
}, getFormProps);
