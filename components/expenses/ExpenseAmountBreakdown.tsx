import React from 'react';
import { round } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nTaxType } from '../../lib/i18n/taxes';
import { computeExpenseAmounts, getTaxAmount, isTaxRateValid } from './lib/utils';

import FormattedMoneyAmount from '../FormattedMoneyAmount';

/**
 * Displays the total amount for all the expense items.
 */
const ExpenseAmountBreakdown = ({ items, currency = undefined, taxes = undefined, expenseTotalAmount = undefined }) => {
  const intl = useIntl();
  const { hasTaxes, totalInvoiced, totalAmount } = computeExpenseAmounts(currency, items, taxes);
  return (
    <div className="text-right">
      {hasTaxes && (
        <div className="flex flex-col items-end">
          <p className="text-black-900 mb-1 pl-3 text-sm leading-5 sm:whitespace-nowrap">
            <span className="block capitalize sm:mr-3 sm:inline" data-cy="expense-invoiced-amount">
              <FormattedMessage defaultMessage="Subtotal" id="L8seEc" />
              {currency && ` (${currency})`}
            </span>
            <span className="block sm:inline">
              <FormattedMoneyAmount amount={totalInvoiced} precision={2} currency={currency} showCurrencyCode={false} />
            </span>
          </p>
          {taxes.map(tax => (
            <p
              key={tax.type}
              className="text-black-900 mb-1 pl-3 text-sm leading-5 sm:whitespace-nowrap"
              data-cy={`tax-${tax.type}-expense-amount-line`}
            >
              <span className="block capitalize sm:mr-3 sm:inline">
                {i18nTaxType(intl, tax.type, 'short')}
                {isTaxRateValid(tax.rate) && ` (${round(tax.rate * 100, 2)}%)`}
              </span>
              <span className="block sm:inline">
                <FormattedMoneyAmount
                  amount={!isTaxRateValid(tax.rate) ? null : getTaxAmount(totalInvoiced, tax)}
                  precision={2}
                  currency={currency}
                  showCurrencyCode={false}
                />
              </span>
            </p>
          ))}
          <hr className="border-black-500 my-3 w-full border-t border-dotted" />
        </div>
      )}
      <p className="text-black-900 mb-1 pl-3 text-sm leading-6 font-bold sm:whitespace-nowrap">
        <span className="block capitalize sm:mr-3 sm:inline">
          {intl.formatMessage({ id: 'TotalAmount', defaultMessage: 'Total amount' })}
        </span>
        <span className="block text-sm tracking-normal sm:inline" data-cy="expense-items-total-amount">
          <FormattedMoneyAmount
            amount={expenseTotalAmount ?? totalAmount}
            precision={2}
            currency={currency}
            showCurrencyCode={true}
          />
        </span>
      </p>
    </div>
  );
};

export default React.memo(ExpenseAmountBreakdown);
