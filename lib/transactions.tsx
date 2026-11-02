import React from 'react';
import { saveAs } from 'file-saver';
import { find, round } from 'lodash-es';
import { defineMessages, FormattedMessage, type IntlShape } from 'react-intl';

import { TransactionKind } from './constants/transactions';
import type { Currency as CurrencyEnum } from './graphql/types/v2/graphql';
import { i18nTaxType } from './i18n/taxes';
import { get as fetch } from './api';
import { formatCurrency } from './currency-utils';
import { toIsoDateStr } from './date-utils';
import { createError, ERROR } from './errors';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from './local-storage';
import { collectiveInvoiceURL, expenseInvoiceUrl, PDF_SERVICE_URL, transactionInvoiceURL } from './url-helpers';

type Amount = { valueInCents: number; currency: CurrencyEnum };

type AccountDetails = {
  name?: string;
  slug?: string;
  hostFeePercent?: number;
  platformFeePercent?: number;
};

type RelatedTransaction = {
  type?: string;
  kind?: string;
  netAmount?: Amount;
  netAmountInPayeeCurrency?: Amount;
};

type RenderDetailsStringParams = {
  amount?: Amount;
  platformFee?: Amount;
  hostFee?: Amount;
  paymentProcessorFee?: Amount;
  netAmount?: Amount;
  taxAmount?: Amount;
  taxInfo?: { id?: string; rate?: number; type?: string; percentage?: number };
  isCredit?: boolean;
  hasOrder?: boolean;
  toAccount?: AccountDetails;
  fromAccount?: AccountDetails;
  intl: IntlShape;
  kind?: string;
  expense?: { feesPayer?: string };
  isRefund?: boolean;
  paymentProcessorCover?: { netAmount: Amount };
  relatedTransactions?: RelatedTransaction[];
};

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
});

const formatFee = (
  amount: Amount,
  totalAmount: Amount,
  name: string,
  feePercent: boolean | number,
  locale: string,
): string => {
  if (!amount?.valueInCents) {
    return '';
  }
  const v =
    amount.valueInCents < 0
      ? ` - ${formatCurrency(Math.abs(amount.valueInCents), amount.currency, { locale })}`
      : ` + ${formatCurrency(Math.abs(amount.valueInCents), amount.currency, { locale })}`;
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
  paymentProcessorFee: _paymentProcessorFee,
  netAmount: _netAmount,
  taxAmount,
  taxInfo,
  isCredit,
  hasOrder,
  toAccount,
  fromAccount,
  intl,
  kind,
  expense,
  isRefund,
  paymentProcessorCover,
  relatedTransactions,
}: RenderDetailsStringParams) => {
  // Swap Amount and Net Amount for DEBITS
  const amount = !isCredit && _netAmount ? _netAmount : _amount;
  const amountString = formatCurrency(Math.abs(amount.valueInCents), amount.currency, { locale: intl.locale });
  const splitPaymentProcessorFee = find(relatedTransactions, {
    type: 'DEBIT',
    kind: 'PAYMENT_PROCESSOR_FEE',
  })?.netAmount;
  const netAmountInPayeeCurrency = find(relatedTransactions, {
    type: 'CREDIT',
    kind: 'EXPENSE',
  })?.netAmountInPayeeCurrency;
  const paymentProcessorFee = splitPaymentProcessorFee || _paymentProcessorFee;
  const platformFeeString = formatFee(
    platformFee,
    amount,
    intl.formatMessage(messages.openCollectiveFee),
    isCredit && !hasOrder ? fromAccount.platformFeePercent : toAccount.platformFeePercent,
    intl.locale,
  );
  const hostFeeString = formatFee(
    hostFee,
    amount,
    intl.formatMessage(messages.hostFee),
    isCredit && !hasOrder ? fromAccount.hostFeePercent : toAccount.hostFeePercent,
    intl.locale,
  );
  const paymentProcessorFeeString = formatFee(
    paymentProcessorFee,
    amount,
    intl.formatMessage(messages.paymentProcessorFee),
    false,
    intl.locale,
  );

  if (kind === TransactionKind.EXPENSE) {
    const expensePaymentProcessorFee = formatCurrency(
      Math.abs(paymentProcessorFee.valueInCents),
      paymentProcessorFee.currency,
      { locale: intl.locale },
    );

    const feesPayer = expense?.feesPayer || 'COLLECTIVE';

    const netValueInCentsForPayer = splitPaymentProcessorFee
      ? Math.abs(_netAmount.valueInCents) + (feesPayer === 'PAYEE' ? 0 : Math.abs(paymentProcessorFee.valueInCents))
      : Math.abs(_netAmount.valueInCents);

    const netValueInCentsForPayee =
      netAmountInPayeeCurrency?.valueInCents ??
      (splitPaymentProcessorFee
        ? Math.abs(_netAmount.valueInCents) + (feesPayer !== 'PAYEE' ? 0 : -Math.abs(paymentProcessorFee.valueInCents))
        : Math.abs(_netAmount.valueInCents));

    const netExpenseAmountForPayer = formatCurrency(netValueInCentsForPayer, _netAmount.currency, {
      locale: intl.locale,
    });
    const netExpenseAmountForPayee = formatCurrency(
      netValueInCentsForPayee,
      netAmountInPayeeCurrency?.currency || _netAmount.currency,
      {
        locale: intl.locale,
      },
    );
    const hasPaymentProcessorCover = paymentProcessorCover !== undefined;
    const netPaymentProcessorCoverAmount = hasPaymentProcessorCover
      ? formatCurrency(
          Math.abs(paymentProcessorCover.netAmount.valueInCents),
          paymentProcessorCover.netAmount.currency,
          {
            locale: intl.locale,
          },
        )
      : null;
    const payee = toAccount.name;
    const payer = fromAccount.name;

    const paymentProcessorFeeString = (paymentProcessorFee, isRefund, feesPayer) => {
      if (paymentProcessorFee.valueInCents === 0 || isRefund) {
        return (
          <FormattedMessage
            defaultMessage="{isRefund, select, true {Refunded} other {}} Payment Processor Fee{hasPaymentProcessorCover, select, true { (covered by the Host)} false {} other {}}: {paymentProcessorFee}"
            id="vwq8lO"
            values={{
              isRefund,
              paymentProcessorFee: hasPaymentProcessorCover
                ? netPaymentProcessorCoverAmount
                : expensePaymentProcessorFee,
              hasPaymentProcessorCover,
            }}
          />
        );
      } else {
        return (
          <FormattedMessage
            defaultMessage="Payment Processor Fee (paid by {collective}): {expensePaymentProcessorFee}"
            id="Yp8Cek"
            values={{ collective: feesPayer === 'PAYEE' ? payee : payer, expensePaymentProcessorFee }}
          />
        );
      }
    };

    return (
      <React.Fragment>
        {expense && (
          <p>
            <FormattedMessage
              defaultMessage="Amount Paid for Expense: {amountString}"
              id="gqiJnQ"
              values={{ amountString }}
            />
          </p>
        )}
        <p>{paymentProcessorFeeString(paymentProcessorFee, isRefund, feesPayer)}</p>
        {taxAmount && taxInfo && (
          <FormattedMessage
            defaultMessage="Includes {rate}% {taxName} ({amount})"
            id="/66Po2"
            values={{
              rate: round(taxInfo.rate * 100, 2),
              taxName: i18nTaxType(intl, taxInfo.type, 'short'),
              amount: formatCurrency(taxAmount.valueInCents, taxAmount.currency, { locale: intl.locale }),
            }}
          />
        )}
        <p>
          <FormattedMessage
            defaultMessage="Net Amount for {collectiveName}: {netExpenseAmount}"
            id="6ZJG0I"
            values={{ collectiveName: payer, netExpenseAmount: netExpenseAmountForPayer }}
          />
        </p>
        {fromAccount.slug !== toAccount.slug && (
          <p>
            <FormattedMessage
              defaultMessage="Net Amount for {collectiveName}: {netExpenseAmount}"
              id="6ZJG0I"
              values={{ collectiveName: payee, netExpenseAmount: netExpenseAmountForPayee }}
            />
          </p>
        )}
      </React.Fragment>
    );
  } else {
    const detailString = [amountString, hostFeeString, platformFeeString, paymentProcessorFeeString];
    if (taxAmount) {
      detailString.push(formatFee(taxAmount, amount, taxInfo?.id || 'Taxes', taxInfo?.percentage, intl.locale));
    }
    return detailString.concat(' ');
  }
};

type InvoiceParams = {
  fromCollectiveSlug?: string;
  toCollectiveSlug?: string;
  transactionUuid?: string;
  expenseId?: number | string;
  dateFrom?: string;
  dateTo?: string;
  createdAt?: string;
};

const getInvoiceUrl = ({
  fromCollectiveSlug,
  toCollectiveSlug,
  transactionUuid,
  expenseId,
  dateFrom,
  dateTo,
}: InvoiceParams) => {
  if (expenseId) {
    return expenseInvoiceUrl(expenseId);
  } else {
    return transactionUuid
      ? transactionInvoiceURL(transactionUuid)
      : collectiveInvoiceURL(fromCollectiveSlug, toCollectiveSlug, encodeURI(dateFrom), encodeURI(dateTo), 'pdf');
  }
};

const getFilename = ({
  fromCollectiveSlug,
  transactionUuid,
  toCollectiveSlug,
  dateFrom,
  dateTo,
  createdAt,
}: InvoiceParams) => {
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
  fromCollectiveSlug = undefined,
  toCollectiveSlug = undefined,
  transactionUuid = undefined,
  expenseId = undefined,
  dateFrom = undefined,
  dateTo = undefined,
  createdAt = undefined,
}: InvoiceParams) => {
  const invoiceUrl = getInvoiceUrl({
    fromCollectiveSlug,
    toCollectiveSlug,
    transactionUuid,
    expenseId,
    dateFrom,
    dateTo,
    createdAt,
  });
  const getParams: { format: string; allowExternal: string; headers?: Record<string, string> } = {
    format: 'blob',
    allowExternal: PDF_SERVICE_URL,
  };
  const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  if (accessToken) {
    getParams.headers = { Authorization: `Bearer ${accessToken}` };
  }

  let blob;
  try {
    blob = await fetch(invoiceUrl, getParams);
  } catch {
    throw createError(ERROR.NETWORK);
  }

  if (blob?.type !== 'application/pdf') {
    throw createError(ERROR.UNKNOWN);
  }

  const filename = getFilename({ fromCollectiveSlug, toCollectiveSlug, transactionUuid, dateFrom, dateTo, createdAt });
  return saveAs(blob, filename);
};
