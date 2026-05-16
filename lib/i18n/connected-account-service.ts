import { startCase } from 'lodash';

import { ConnectedAccountService } from '../graphql/types/v2/graphql';

/**
 * Returns a human-readable label for a ConnectedAccountService.
 * Service names are generally proper nouns and not translated.
 */
export const i18nConnectedAccountService = (service: ConnectedAccountService | string): string => {
  switch (service) {
    case ConnectedAccountService.github:
      return 'GitHub';
    case ConnectedAccountService.gocardless:
      return 'GoCardless';
    case ConnectedAccountService.paypal:
      return 'PayPal';
    case ConnectedAccountService.plaid:
      return 'Plaid';
    case ConnectedAccountService.stripe:
      return 'Stripe';
    case ConnectedAccountService.stripe_customer:
      return 'Stripe Customer';
    case ConnectedAccountService.thegivingblock:
      return 'The Giving Block';
    case ConnectedAccountService.transferwise:
      return 'Wise';
    case ConnectedAccountService.twitter:
      return 'Twitter';
    default:
      return startCase(service.toLowerCase());
  }
};
