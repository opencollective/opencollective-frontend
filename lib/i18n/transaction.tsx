import React from 'react';
import { defineMessages, type IntlShape, type MessageDescriptor } from 'react-intl';

import { TransactionKind, TransactionTypes } from '../constants/transactions';

const i18nTypes: Record<string, MessageDescriptor> = defineMessages({
  ALL: {
    id: 'AllTransactions',
    defaultMessage: 'All transactions',
  },
  [TransactionTypes.CREDIT]: {
    id: 'Transaction.Type.Credit',
    defaultMessage: 'Credit',
  },
  [TransactionTypes.DEBIT]: {
    id: 'Expense.Type.Debit',
    defaultMessage: 'Debit',
  },
});

const i18nKind: Record<string, MessageDescriptor> = defineMessages({
  ALL: {
    id: 'SectionTransactions.All',
    defaultMessage: 'All',
  },
  [TransactionKind.ADDED_FUNDS]: {
    id: 'Transaction.kind.ADDED_FUNDS',
    defaultMessage: 'Added funds',
  },
  [TransactionKind.CONTRIBUTION]: {
    id: '0LK5eg',
    defaultMessage: 'Contribution',
  },
  [TransactionKind.EXPENSE]: {
    id: 'Expense',
    defaultMessage: 'Expense',
  },
  [TransactionKind.HOST_FEE]: {
    id: 'HostFee',
    defaultMessage: 'Host fee',
  },
  [TransactionKind.HOST_FEE_SHARE]: {
    id: 'Transaction.kind.HOST_FEE_SHARE',
    defaultMessage: 'Platform share',
  },
  [TransactionKind.PAYMENT_PROCESSOR_COVER]: {
    id: 'Transaction.kind.PAYMENT_PROCESSOR_COVER',
    defaultMessage: 'Payment processor cover',
  },
  [TransactionKind.PAYMENT_PROCESSOR_FEE]: {
    id: 'contribution.paymentFee',
    defaultMessage: 'Payment processor fee',
  },
  [TransactionKind.PLATFORM_FEE]: {
    id: 'PlatformFee',
    defaultMessage: 'Platform fee',
  },
  [TransactionKind.PLATFORM_TIP]: {
    id: 'Transaction.kind.PLATFORM_TIP',
    defaultMessage: 'Platform tip',
  },
  [TransactionKind.PREPAID_PAYMENT_METHOD]: {
    id: 'Transaction.kind.PREPAID_PAYMENT_METHOD',
    defaultMessage: 'Prepaid payment method',
  },
  [TransactionKind.HOST_FEE_SHARE_DEBT]: {
    id: 'Transaction.kind.HOST_FEE_SHARE_DEBT',
    defaultMessage: 'Platform share (Owed)',
  },
  [TransactionKind.PLATFORM_TIP_DEBT]: {
    id: 'Transaction.kind.PLATFORM_TIP_DEBT',
    defaultMessage: 'Platform tip (Owed)',
  },
  [TransactionKind.BALANCE_TRANSFER]: {
    id: 'Transaction.kind.BALANCE_TRANSFER',
    defaultMessage: 'Balance transfer',
  },
  [TransactionKind.PAYMENT_PROCESSOR_DISPUTE_FEE]: {
    id: 'Transaction.kind.PAYMENT_PROCESSOR_DISPUTE_FEE',
    defaultMessage: 'Payment processor dispute fee',
  },
  [TransactionKind.TAX]: {
    id: 'AwzkSM',
    defaultMessage: 'Tax',
  },
  [TransactionKind.APPLICATION_FEE]: {
    id: 'Transaction.kind.APPLICATION_FEE',
    defaultMessage: 'Application fee',
  },
});

const i18nKindDefinition: Record<string, MessageDescriptor> = defineMessages({
  [TransactionKind.ADDED_FUNDS]: {
    id: 'Transaction.kind.ADDED_FUNDS.definition',
    defaultMessage: 'Off platform contributions',
  },
  [TransactionKind.CONTRIBUTION]: {
    id: 'Transaction.kind.CONTRIBUTION.definition',
    defaultMessage: 'On platform contributions',
  },
  [TransactionKind.HOST_FEE]: {
    id: 'host.hostFee.help',
    defaultMessage:
      'Percentage of incoming contributions that this Fiscal Host retains as an administrative contribution for hosting services, such as holding funds, processing expense payouts, and handling accounting and tax obligations. <LearnMoreLink>Learn more ↗</LearnMoreLink>',
  },

  [TransactionKind.PAYMENT_PROCESSOR_FEE]: {
    id: 'Transaction.kind.PAYMENT_PROCESSOR_FEE.definition',
    defaultMessage: 'Fees to external payment processor',
  },
  [TransactionKind.PLATFORM_FEE]: {
    id: 'host.platformFee.help',
    defaultMessage: 'The Platform fee is what Open Collective charges for use of the software.',
  },
  [TransactionKind.BALANCE_TRANSFER]: {
    id: 'Transaction.kind.BALANCE_TRANSFER.definition',
    defaultMessage:
      'Balance transfer from a child account to a parent account or from Hosted Collective to Fiscal Host account.',
  },
  // TransactionKind.PAYMENT_PROCESSOR_DISPUTE_FEE
  // TransactionKind.TAX
  // TransactionKind.EXPENSE
  // TransactionKind.HOST_FEE_SHARE
  // TransactionKind.PAYMENT_PROCESSOR_COVER
  // TransactionKind.PLATFORM_TIP
  // TransactionKind.PREPAID_PAYMENT_METHOD
  // TransactionKind.HOST_FEE_SHARE_DEBT
  // TransactionKind.PLATFORM_TIP_DEBT
});

const KindDefinitionParams: Record<string, { LearnMoreLink: (chunks: React.ReactNode) => React.ReactNode }> = {
  [TransactionKind.HOST_FEE]: {
    LearnMoreLink: chunks => (
      <a
        href="https://documentation.opencollective.com/collectives/choosing-a-fiscal-host"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {chunks}
      </a>
    ),
  },
};

/**
 * Translate the type of an transaction
 */
export const i18nTransactionType = (intl: IntlShape, type: string, id?: number): string => {
  let formattedType = i18nTypes[type] ? intl.formatMessage(i18nTypes[type]) : type;
  if (id) {
    formattedType = `${formattedType} #${id}`;
  }
  return formattedType;
};

/**
 * Translate the type of an transaction
 */
export const i18nTransactionKind = (intl: IntlShape, type: string): string => {
  return i18nKind[type] ? intl.formatMessage(i18nKind[type]) : type;
};

/**
 * The definition (help text) of a transaction kind, returns null if no definition exists
 */
export const i18nTransactionKindDefinition = (intl: IntlShape, type: string): React.ReactNode => {
  return i18nKindDefinition[type] ? intl.formatMessage(i18nKindDefinition[type], KindDefinitionParams[type]) : null;
};
