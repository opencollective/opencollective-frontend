import { defineMessages } from 'react-intl';

import { ORDER_STATUS } from '../constants/order-status';
import { ContributionFrequency } from '../graphql/types/v2/graphql';

const MESSAGES = defineMessages({
  ALL: {
    id: 'orders.all',
    defaultMessage: 'All',
  },
  [ORDER_STATUS.CANCELLED]: {
    id: 'Subscriptions.Cancelled',
    defaultMessage: 'Canceled',
  },
  [ORDER_STATUS.DISPUTED]: {
    id: 'order.disputed',
    defaultMessage: 'Disputed',
  },
  [ORDER_STATUS.ERROR]: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  [ORDER_STATUS.EXPIRED]: {
    id: 'order.expired',
    defaultMessage: 'Expired',
  },
  [ORDER_STATUS.IN_REVIEW]: {
    id: 'order.in_review',
    defaultMessage: 'In Review',
  },
  [ORDER_STATUS.PAUSED]: {
    id: 'order.paused',
    defaultMessage: 'Paused',
  },
  [ORDER_STATUS.PENDING]: {
    id: 'order.pending',
    defaultMessage: 'Pending',
  },
  [ORDER_STATUS.NEW]: {
    id: 'order.new',
    defaultMessage: 'New',
  },
  [ORDER_STATUS.REQUIRE_CLIENT_CONFIRMATION]: {
    id: 'order.require_client_confirmation',
    defaultMessage: 'Require client confirmation',
  },
  [ORDER_STATUS.ACTIVE]: {
    id: 'Subscriptions.Active',
    defaultMessage: 'Active',
  },
  [ORDER_STATUS.REFUNDED]: {
    id: 'Order.Status.Refunded',
    defaultMessage: 'Refunded',
  },
  [ORDER_STATUS.REJECTED]: {
    id: 'order.rejected',
    defaultMessage: 'Rejected',
  },
  [ORDER_STATUS.PAID]: {
    id: 'order.paid',
    defaultMessage: 'Paid',
  },
  [ORDER_STATUS.PROCESSING]: {
    id: 'processing',
    defaultMessage: 'Processing',
  },
});

export const i18nOrderStatus = (intl, status) => {
  const i18nMsg = MESSAGES[status];
  return i18nMsg ? intl.formatMessage(i18nMsg) : status;
};

const I18nFrequencyMessages = defineMessages({
  [ContributionFrequency.ONETIME]: {
    id: 'Frequency.OneTime',
    defaultMessage: 'One time',
  },
  [ContributionFrequency.MONTHLY]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [ContributionFrequency.YEARLY]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
});

export const i18nFrequency = (intl, frequency) => {
  const i18nMsg = I18nFrequencyMessages[frequency];
  return i18nMsg ? intl.formatMessage(i18nMsg) : frequency;
};
