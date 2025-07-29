import React from 'react';
import { round } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nTaxType } from '../../lib/i18n/taxes';
import { computeExpenseAmounts, getTaxAmount, isTaxRateValid } from './lib/utils';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
import StyledHr from '../StyledHr';
import { Span } from '../Text';

const AmountLine = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: ${props => props.theme.colors.black[900]};
  white-space: nowrap;
  margin: 0;
  margin-bottom: 4px;
  padding-left: 12px;
`;

const TotalAmountLine = styled(AmountLine)`
  font-size: 16px;
  line-height: 24px;
  font-weight: bold;
`;

/**
 * Displays the total amount for all the expense items.
 */
const ExpenseAmountBreakdown = ({ items, currency, taxes, expenseTotalAmount }) => {
  const intl = useIntl();
  const { hasTaxes, totalInvoiced, totalAmount } = computeExpenseAmounts(currency, items, taxes);
  return (
    <Container textAlign="right">
      {hasTaxes && (
        <Flex flexDirection="column" alignItems="flex-end">
          <AmountLine data-cy="expense-invoiced-amount">
            <Span textTransform="capitalize" mr={3}>
              <FormattedMessage defaultMessage="Subtotal" id="L8seEc" />
              {currency && ` (${currency})`}
            </Span>
            &nbsp;
            <FormattedMoneyAmount amount={totalInvoiced} precision={2} currency={currency} showCurrencyCode={false} />
          </AmountLine>
          {taxes.map(tax => (
            <AmountLine key={tax.type} data-cy={`tax-${tax.type}-expense-amount-line`}>
              <Span textTransform="capitalize" mr={3}>
                {i18nTaxType(intl, tax.type, 'short')}
                {isTaxRateValid(tax.rate) && ` (${round(tax.rate * 100, 2)}%)`}
              </Span>
              &nbsp;
              <FormattedMoneyAmount
                amount={!isTaxRateValid(tax.rate) ? null : getTaxAmount(totalInvoiced, tax)}
                precision={2}
                currency={currency}
                showCurrencyCode={false}
              />
            </AmountLine>
          ))}
          <StyledHr width="100%" my="12px" borderColor="black.500" borderStyle="dotted" />
        </Flex>
      )}
      <TotalAmountLine>
        <Span textTransform="capitalize" mr={3}>
          {intl.formatMessage({ id: 'TotalAmount', defaultMessage: 'Total amount' })}
        </Span>
        &nbsp;
        <Span fontSize="16px" letterSpacing={0} data-cy="expense-items-total-amount">
          <FormattedMoneyAmount
            amount={expenseTotalAmount ?? totalAmount}
            precision={2}
            currency={currency}
            showCurrencyCode={true}
          />
        </Span>
      </TotalAmountLine>
    </Container>
  );
};

export default React.memo(ExpenseAmountBreakdown);
