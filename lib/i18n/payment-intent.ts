import { defineMessages } from 'react-intl';

import { PaymentIntentStatus, PaymentIntentType } from '../graphql/types/v2/graphql';

const STATUS_MESSAGES = defineMessages({
  [PaymentIntentStatus.PENDING]: { defaultMessage: 'Pending', id: 'PaymentIntent.Status.Pending' },
  [PaymentIntentStatus.PAID]: { defaultMessage: 'Paid', id: 'PaymentIntent.Status.Paid' },
  [PaymentIntentStatus.REVERSED]: { defaultMessage: 'Reversed', id: 'PaymentIntent.Status.Reversed' },
  [PaymentIntentStatus.ERROR]: { defaultMessage: 'Error', id: 'Error' },
  CANCELED: { defaultMessage: 'Canceled', id: 'PaymentIntent.Status.Canceled' },
});

const TYPE_MESSAGES = defineMessages({
  [PaymentIntentType.PlatformBilling]: { defaultMessage: 'Platform Billing', id: 'beRXFK' },
  [PaymentIntentType.PlatformBillingTipSettlement]: {
    defaultMessage: 'Platform Tip Settlement',
    id: 'PaymentIntent.Type.PlatformBillingTipSettlement',
  },
  [PaymentIntentType.GrantRequest]: { defaultMessage: 'Grant Request', id: 'PaymentIntent.Type.GrantRequest' },
  [PaymentIntentType.PaymentRequest]: { defaultMessage: 'Payment Request', id: 'PaymentIntent.Type.PaymentRequest' },
  [PaymentIntentType.CardCharge]: { defaultMessage: 'Card Charge', id: 'PaymentIntent.Type.CardCharge' },
  [PaymentIntentType.Contribution]: { defaultMessage: 'Contribution', id: '0LK5eg' },
  [PaymentIntentType.AddedMoney]: { defaultMessage: 'Added Money', id: 'PaymentIntent.Type.AddedMoney' },
  [PaymentIntentType.BalanceTransfer]: { defaultMessage: 'Balance Transfer', id: 'PaymentIntent.Type.BalanceTransfer' },
  [PaymentIntentType.InternalTransfer]: {
    defaultMessage: 'Internal Transfer',
    id: 'PaymentIntent.Type.InternalTransfer',
  },
  [PaymentIntentType.Other]: { defaultMessage: 'Other', id: 'PaymentIntent.Type.Other' },
});

export const i18nPaymentIntentStatus = (intl, status) => {
  const message = STATUS_MESSAGES[status];
  return message ? intl.formatMessage(message) : status;
};

export const getPaymentIntentStatusBadgeType = (status: PaymentIntentStatus | string) => {
  switch (status) {
    case PaymentIntentStatus.PAID:
      return 'success';
    case PaymentIntentStatus.PENDING:
      return 'warning';
    case PaymentIntentStatus.ERROR:
      return 'error';
    case PaymentIntentStatus.REVERSED:
    case 'CANCELED':
      return 'neutral';
    default:
      return 'neutral';
  }
};

export const i18nPaymentIntentType = (intl, type) => {
  const message = TYPE_MESSAGES[type];
  return message ? intl.formatMessage(message) : type;
};
