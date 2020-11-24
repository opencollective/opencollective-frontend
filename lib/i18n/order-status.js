import { defineMessages } from 'react-intl';

import { ORDER_STATUS } from '../constants/order-status';

const MESSAGES = defineMessages({
  ALL: {
    id: 'orders.all',
    defaultMessage: 'All',
  },
  [ORDER_STATUS.CANCELLED]: {
    id: 'order.cancelled',
    defaultMessage: 'Cancelled',
  },
  [ORDER_STATUS.ERROR]: {
    id: 'order.error',
    defaultMessage: 'Error',
  },
  [ORDER_STATUS.EXPIRED]: {
    id: 'order.expired',
    defaultMessage: 'Expired',
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
  [ORDER_STATUS.PLEDGED]: {
    id: 'order.pledged',
    defaultMessage: 'Pledged',
  },
  [ORDER_STATUS.ACTIVE]: {
    id: 'order.active',
    defaultMessage: 'Active',
  },
  [ORDER_STATUS.REJECTED]: {
    id: 'order.rejected',
    defaultMessage: 'Rejected',
  },
  [ORDER_STATUS.PAID]: {
    id: 'order.paid',
    defaultMessage: 'Paid',
  },
});

const i18nOrderStatus = (intl, status) => {
  const i18nMsg = MESSAGES[status];
  return i18nMsg ? intl.formatMessage(i18nMsg) : status;
};

export default i18nOrderStatus;
