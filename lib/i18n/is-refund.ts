import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
  IS_REFUND: { defaultMessage: 'Is Refund', id: 'o+jEZR' },
  IS_NOT_REFUND: { defaultMessage: 'Is not Refund', id: 'VX6iYD' },
});

export const i18nIsRefund = (intl, value) => {
  const i18nMsg = value ? MESSAGES.IS_REFUND : MESSAGES.IS_NOT_REFUND;
  return i18nMsg ? intl.formatMessage(i18nMsg) : value;
};
