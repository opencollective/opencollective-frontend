import { startCase } from 'lodash';
import { defineMessages } from 'react-intl';

import { WebsiteName } from '../../components/I18nFormatters';

import { PAYMENT_METHOD_SERVICE } from '../constants/payment-methods';

const i18nPaymentMethodServiceLabels = defineMessages({
  [PAYMENT_METHOD_SERVICE.PREPAID]: {
    id: 'Prepaid',
    defaultMessage: 'Prepaid Card',
  },
});

/**
 * Service names are not meant to be translated (Stripe in Spanish is still Stripe). This helper
 * simply returns the service display name with the right capitalization.
 */
export const i18nPaymentMethodService = (intl, service) => {
  if (i18nPaymentMethodServiceLabels[service]) {
    return intl.formatMessage(i18nPaymentMethodServiceLabels[service]);
  }

  switch (service) {
    case PAYMENT_METHOD_SERVICE.PAYPAL:
      return 'PayPal';
    case PAYMENT_METHOD_SERVICE.THEGIVINGBLOCK:
      return 'The Giving Block';
    case PAYMENT_METHOD_SERVICE.OPENCOLLECTIVE:
      return WebsiteName;
    default:
      return startCase(service.toLowerCase());
  }
};
