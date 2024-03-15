import React from 'react';
import { i18nTransactionKind } from '../../../../../lib/i18n/transaction';
import { i18nExpenseType } from '../../../../../lib/i18n/expense';

import { DefinitionTooltip } from './DefinitionTooltip';
import { TransactionKind } from '../../../../../lib/constants/transactions';
import { defineMessages, useIntl } from 'react-intl';

const i18nTransactionKindDefinition = defineMessages({
  [TransactionKind.ADDED_FUNDS]: {
    defaultMessage: 'Off platform contributions',
  },
  [TransactionKind.CONTRIBUTION]: {
    defaultMessage: 'On platform contributions',
  },
  // [TransactionKind.EXPENSE]: {
  //   defaultMessage: 'Expense',
  // },
  // [TransactionKind.HOST_FEE]: {
  //   defaultMessage: 'Host fee',
  // },
  // [TransactionKind.HOST_FEE_SHARE]: {
  //   defaultMessage: 'Platform share',
  // },
  // [TransactionKind.PAYMENT_PROCESSOR_COVER]: {
  //   defaultMessage: 'Payment processor cover',
  // },
  [TransactionKind.PAYMENT_PROCESSOR_FEE]: {
    defaultMessage: 'Payment processor fees: Stripe, PayPal, etc.',
  },
  // [TransactionKind.PLATFORM_FEE]: {
  //   defaultMessage: 'Platform fee',
  // },
  // [TransactionKind.PLATFORM_TIP]: {
  //   defaultMessage: 'Platform tip',
  // },
  // [TransactionKind.PREPAID_PAYMENT_METHOD]: {
  //   defaultMessage: 'Prepaid payment method',
  // },
  // [TransactionKind.HOST_FEE_SHARE_DEBT]: {
  //   defaultMessage: 'Platform share (Owed)',
  // },
  // [TransactionKind.PLATFORM_TIP_DEBT]: {
  //   defaultMessage: 'Platform tip (Owed)',
  // },
  [TransactionKind.BALANCE_TRANSFER]: {
    defaultMessage:
      'Balance transfer from a child account to a parent account or from hosted Collective to Fiscal Host account.',
  },
  //   [TransactionKind.PAYMENT_PROCESSOR_DISPUTE_FEE]: {
  //     defaultMessage: 'Payment processor dispute fee',
  //   },
  //   [TransactionKind.TAX]: {
  //     defaultMessage: 'Tax',
  //   },
});

export const TransactionReportRowLabel = ({ filter }) => {
  const intl = useIntl();
  let kind = i18nTransactionKind(intl, filter.kind);
  const transactionKindDefinition = i18nTransactionKindDefinition[filter.kind];
  if (transactionKindDefinition) {
    kind = <DefinitionTooltip definition={intl.formatMessage(transactionKindDefinition)}>{kind}</DefinitionTooltip>;
  }
  if (filter.expenseType) {
    kind = intl.formatMessage(
      { defaultMessage: 'Expense ({expenseType})' },
      { expenseType: i18nExpenseType(intl, filter.expenseType) },
    );
  }
  if (filter.isRefund) {
    return intl.formatMessage({ defaultMessage: 'Refunded {kind}' }, { kind });
  } else {
    return kind;
  }
};
