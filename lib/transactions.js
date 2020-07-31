import { saveAs } from 'file-saver';
import { round } from 'lodash';

import { get as fetch } from './api';
import { formatCurrency } from './currency-utils';
import { toIsoDateStr } from './date-utils';
import { collectiveInvoiceURL, invoiceServiceURL, transactionInvoiceURL } from './url_helpers';

export const formatFee = (value, totalAmount, currency, name, showPercent = true) => {
  if (!value || !totalAmount) {
    return '';
  }
  const v =
    value < 0 ? ` - ${formatCurrency(Math.abs(value), currency)}` : ` + ${formatCurrency(Math.abs(value), currency)}`;
  if (showPercent) {
    const percentage = Math.abs(round((value / totalAmount) * 100, 2));
    return `${v} (${percentage}% ${name})`;
  } else {
    return `${v} (${name})`;
  }
};

export const renderDetailsString = ({
  amount: _amount,
  platformFee,
  hostFee,
  paymentProcessorFee,
  netAmount: _netAmount,
  isCredit,
}) => {
  // Swap Amount and Net Amount for DEBITS
  const [amount, netAmount] = !isCredit && _netAmount ? [_netAmount, _amount] : [_amount, _netAmount];
  const amountString = formatCurrency(Math.abs(amount.valueInCents), amount.currency);
  const netAmountString =
    netAmount &&
    netAmount.valueInCents != amount.valueInCents &&
    formatCurrency(Math.abs(netAmount?.valueInCents), netAmount?.currency);
  const platformFeeString = formatFee(
    platformFee?.valueInCents,
    amount.valueInCents,
    platformFee.currency,
    'Open Collective fee',
  );
  const hostFeeString = formatFee(hostFee?.valueInCents, amount.valueInCents, hostFee?.currency, 'host fee');
  const paymentProcessorFeeString = formatFee(
    paymentProcessorFee.valueInCents,
    amount.valueInCents,
    paymentProcessorFee.currency,
    'payment processor fee',
    false,
  );

  const detailString = [amountString, hostFeeString, platformFeeString, paymentProcessorFeeString];
  if (netAmountString) {
    detailString.push(`= ${netAmountString} (net amount for collective)`);
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
