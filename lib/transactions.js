import { saveAs } from 'file-saver';
import { round } from 'lodash';
import { defineMessages } from 'react-intl';

import { get as fetch } from './api';
import { formatCurrency } from './currency-utils';
import { toIsoDateStr } from './date-utils';
import { collectiveInvoiceURL, invoiceServiceURL, transactionInvoiceURL } from './url_helpers';

const messages = defineMessages({
  hostFee: {
    id: 'expense.hostFeeInCollectiveCurrency',
    defaultMessage: 'host fee',
  },
  paymentProcessorFee: {
    id: 'expense.paymentProcessorFeeInCollectiveCurrency',
    defaultMessage: 'payment processor fee',
  },
  openCollectiveFee: {
    id: 'transactions.openCollectiveFee',
    defaultMessage: 'Open Collective fee',
  },
  netAmount: {
    id: 'transaction.netAmountInCollectiveCurrency.description',
    defaultMessage: 'net amount for {collective}',
  },
});

export const formatFee = (amount, totalAmount, name, feePercent = true) => {
  if (!amount?.valueInCents) {
    return '';
  }
  const v =
    amount.valueInCents < 0
      ? ` - ${formatCurrency(Math.abs(amount.valueInCents), amount.currency)}`
      : ` + ${formatCurrency(Math.abs(amount.valueInCents), amount.currency)}`;
  // Don't calculate percentual value when dealing with different currencies
  if (feePercent && amount.currency === totalAmount?.currency) {
    const percentage = Math.abs(round((amount.valueInCents / totalAmount.valueInCents) * 100, 2));
    // To avoid misinformation, only return with percentual value if feePercent is true or it matches the predicted feePercent value
    if (feePercent === true || feePercent === percentage) {
      return `${v} (${percentage}% ${name})`;
    }
  }
  return `${v} (${name})`;
};

export const renderDetailsString = ({
  amount: _amount,
  platformFee,
  hostFee,
  paymentProcessorFee,
  netAmount: _netAmount,
  isCredit,
  toAccount,
  fromAccount,
  intl,
}) => {
  // Swap Amount and Net Amount for DEBITS
  const [amount, netAmount] = !isCredit && _netAmount ? [_netAmount, _amount] : [_amount, _netAmount];
  const amountString = formatCurrency(Math.abs(amount.valueInCents), amount.currency);
  const netAmountString =
    netAmount &&
    netAmount.valueInCents != amount.valueInCents &&
    formatCurrency(Math.abs(netAmount?.valueInCents), netAmount?.currency);
  const platformFeeString = formatFee(
    platformFee,
    amount,
    intl.formatMessage(messages.openCollectiveFee),
    isCredit ? fromAccount.platformFeePercent : toAccount.platformFeePercent,
  );
  const hostFeeString = formatFee(
    hostFee,
    amount,
    intl.formatMessage(messages.hostFee),
    isCredit ? fromAccount.hostFeePercent : toAccount.hostFeePercent,
  );
  const paymentProcessorFeeString = formatFee(
    paymentProcessorFee,
    amount,
    intl.formatMessage(messages.paymentProcessorFee),
    false,
  );

  const detailString = [amountString, hostFeeString, platformFeeString, paymentProcessorFeeString];
  if (netAmountString) {
    detailString.push(
      `= ${netAmountString} (${intl.formatMessage(messages.netAmount, { collective: toAccount.name })})`,
    );
  }
  return detailString.concat(' ');
};

export const getInvoiceUrl = ({ fromCollectiveSlug, toCollectiveSlug, transactionUuid, dateFrom, dateTo }) => {
  return transactionUuid
    ? transactionInvoiceURL(transactionUuid)
    : collectiveInvoiceURL(fromCollectiveSlug, toCollectiveSlug, encodeURI(dateFrom), encodeURI(dateTo), 'pdf');
};

export const getFilename = ({ fromCollectiveSlug, transactionUuid, toCollectiveSlug, dateFrom, dateTo, createdAt }) => {
  if (transactionUuid) {
    const createdAtString = toIsoDateStr(createdAt ? new Date(createdAt) : new Date());
    return `${toCollectiveSlug || 'transaction'}_${createdAtString}_${transactionUuid}.pdf`;
  } else {
    const fromString = toIsoDateStr(dateFrom ? new Date(dateFrom) : new Date());
    const toString = toIsoDateStr(dateTo ? new Date(dateTo) : new Date());
    return `${fromCollectiveSlug}_${toCollectiveSlug}_${fromString}_${toString}.pdf`;
  }
};

export const saveInvoice = async ({
  fromCollectiveSlug,
  toCollectiveSlug,
  transactionUuid,
  dateFrom,
  dateTo,
  createdAt,
}) => {
  const invoiceUrl = getInvoiceUrl({
    fromCollectiveSlug,
    toCollectiveSlug,
    transactionUuid,
    dateFrom,
    dateTo,
    createdAt,
  });
  const getParams = { format: 'blob', allowExternal: invoiceServiceURL };
  const file = await fetch(invoiceUrl, getParams);
  return saveAs(
    file,
    getFilename({ fromCollectiveSlug, toCollectiveSlug, transactionUuid, dateFrom, dateTo, createdAt }),
  );
};
