import { defineMessages } from 'react-intl';

import { VIRTUAL_CARD_STATUS } from '../constants/virtual-card-status';

const TypesI18n = defineMessages({
  ALL: {
    id: 'VirtualCard.AllTypes',
    defaultMessage: 'All',
  },
  [VIRTUAL_CARD_STATUS.OPEN]: {
    id: 'VirtualCard.Open',
    defaultMessage: 'Open',
  },
  [VIRTUAL_CARD_STATUS.CLOSED]: {
    id: 'VirtualCard.Closed',
    defaultMessage: 'Closed',
  },
  [VIRTUAL_CARD_STATUS.PAUSED]: {
    id: 'VirtualCard.Paused',
    defaultMessage: 'Paused',
  },
  [VIRTUAL_CARD_STATUS.PENDING_ACTIVATION]: {
    id: 'VirtualCard.PendingActivation',
    defaultMessage: 'Pending Activation',
  },
  [VIRTUAL_CARD_STATUS.PENDING_FULFILLMENT]: {
    id: 'VirtualCard.PendingFulfillment',
    defaultMessage: 'Pending Fulfillment',
  },
});

/**
 * Translate the virtual card status
 *
 * @param {object} `intl` - see `injectIntl`
 * @param {string} `type`
 */
export const i18nVirtualCardStatusType = (intl, type) => {
  const i18nMsg = TypesI18n[type];
  return i18nMsg ? intl.formatMessage(i18nMsg) : type;
};
