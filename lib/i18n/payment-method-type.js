import { defineMessages } from 'react-intl';

const i18nTypes = defineMessages({
  virtualcard: {
    id: 'GiftCard',
    defaultMessage: 'Gift card',
  },
  creditcard: {
    id: 'creditcard.label',
    defaultMessage: 'Credit Card',
  },
  prepaid: {
    id: 'Prepaid',
    defaultMessage: 'Prepaid',
  },
  collective: {
    id: 'Collective',
    defaultMessage: 'Collective',
  },
});

/**
 * Get only the (i18n) name of the payment method type.
 *
 * Ex: i18nPaymentMethodType(intl, 'virtualcard') === 'Gift card'
 */
export const i18nPaymentMethodType = (intl, type) => {
  return i18nTypes[type] ? intl.formatMessage(i18nTypes[type]) : type;
};
