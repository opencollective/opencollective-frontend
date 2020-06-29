import React from 'react';
import PropTypes from 'prop-types';
import { round } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { TransactionTypes } from '../../lib/constants/transactions';
import { formatCurrency } from '../../lib/currency-utils';
import { i18nPaymentMethodType } from '../../lib/i18n/payment-method-type';

import InvoiceDownloadLink from '../expenses/InvoiceDownloadLink';
import { Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';

const DetailTitle = styled.p`
  margin: 8px 8px 4px 8px;
  font-size: 10px;
  color: #76777a;
  text-transform: uppercase;
`;

const DetailDescription = styled.p`
  margin: 0 8px 8px 8px;
  font-size: 11px;
  color: #4e5052;
`;

const formatFee = (value, totalAmount, currency, name, showPercent = true) => {
  if (!value || !totalAmount) {
    return '';
  } else if (showPercent) {
    const percentage = round((value / totalAmount) * 100, 2);
    return ` ${formatCurrency(value, currency)} (${percentage}% ${name})`;
  } else {
    return ` ${formatCurrency(value, currency)} (${name})`;
  }
};

const getAmountDetailsStr = (amount, currency, transaction, platformFee) => {
  const totalAmount = formatCurrency(Math.abs(amount), currency);
  const pFee = formatFee(platformFee, amount, currency, 'Open Collective fee');
  const hostFee = formatFee(transaction.hostFeeInHostCurrency, amount, currency, 'host fee');
  const pmFee = formatFee(
    transaction.paymentProcessorFeeInHostCurrency,
    amount,
    currency,
    'payment processor fee',
    false,
  );
  return (
    <React.Fragment>
      <strong>{totalAmount}</strong>
      {hostFee}
      {pFee}
      {pmFee}
    </React.Fragment>
  );
};

const OrderBudgetItemDetails = ({ collective, isInverted, isFeesOnTop, transaction, canDownloadInvoice }) => {
  const intl = useIntl();
  const isCredit = transaction.type === TransactionTypes.CREDIT;
  const hasRefund = Boolean(transaction && transaction.refundTransaction);
  const hasAccessToInvoice = canDownloadInvoice && transaction && transaction.uuid;
  const hasInvoiceBtn = hasAccessToInvoice && !hasRefund && (!isCredit || !isInverted);
  const platformFee = isFeesOnTop ? undefined : transaction.platformFeeInHostCurrency;
  let amount = transaction[isCredit ? 'amount' : 'netAmountInCollectiveCurrency'];
  if (isFeesOnTop) {
    amount = transaction.amount + transaction.platformFeeInHostCurrency;
  }

  return (
    <Flex flexWrap="wrap" justifyContent="space-between" alignItems="center">
      {collective.host && (
        <div>
          <DetailTitle>
            <FormattedMessage id="Member.Role.HOST" defaultMessage="Host" />
          </DetailTitle>
          <DetailDescription>
            <LinkCollective collective={collective.host} />
          </DetailDescription>
        </div>
      )}
      {transaction.paymentMethod && (
        <div>
          <DetailTitle>
            <FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />
          </DetailTitle>
          <DetailDescription>{i18nPaymentMethodType(intl, transaction.paymentMethod.type)}</DetailDescription>
        </div>
      )}
      {transaction && (
        <div>
          <DetailTitle>
            <FormattedMessage id="transaction.details" defaultMessage="transaction details" />
          </DetailTitle>
          <DetailDescription>
            {getAmountDetailsStr(amount, transaction.currency, transaction, platformFee)}
          </DetailDescription>
        </div>
      )}
      {hasInvoiceBtn && (
        <InvoiceDownloadLink type="transaction" transactionUuid={transaction.uuid} toCollectiveSlug={collective.slug}>
          {({ loading, download }) => (
            <StyledButton buttonSize="small" loading={loading} onClick={download} minWidth={140}>
              <FormattedMessage id="DownloadInvoice" defaultMessage="Download invoice" />
            </StyledButton>
          )}
        </InvoiceDownloadLink>
      )}
    </Flex>
  );
};

OrderBudgetItemDetails.propTypes = {
  /** If true, debit and credit will be inverted. Useful to adapt based on who's viewing */
  isInverted: PropTypes.bool,
  isCredit: PropTypes.bool,
  isFeesOnTop: PropTypes.bool,
  /** If true, a button to download invoice will be displayed when possible */
  canDownloadInvoice: PropTypes.bool,
  transaction: PropTypes.shape({
    id: PropTypes.number,
    uuid: PropTypes.string,
    currency: PropTypes.string,
    type: PropTypes.string,
    hostFeeInHostCurrency: PropTypes.number,
    platformFeeInHostCurrency: PropTypes.number,
    paymentProcessorFeeInHostCurrency: PropTypes.number,
    amount: PropTypes.number,
    taxAmount: PropTypes.number,
    refundTransaction: PropTypes.object,
    paymentMethod: PropTypes.object,
  }),
  collective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    host: PropTypes.shape({
      id: PropTypes.number,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  }).isRequired,
};

export default OrderBudgetItemDetails;
