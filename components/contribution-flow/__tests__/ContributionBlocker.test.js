import { cloneDeep, set } from 'lodash';

import { GQLV2_PAYMENT_METHOD_LEGACY_TYPES } from '../../../lib/constants/payment-methods';

import { webpackCollective } from '../../../stories/mocks/collectives';
import { getContributionBlocker } from '../ContributionBlocker';

describe('getContributionBlocker', () => {
  it('returns null when everything is fine', () => {
    const loggedInUser = null;
    const account = webpackCollective;
    const tier = null;
    const contributionBlocker = getContributionBlocker(loggedInUser, account, tier);
    expect(contributionBlocker).toBeNull();
  });

  it('returns a blocker if there is no host', () => {
    const loggedInUser = null;
    const account = set(cloneDeep(webpackCollective), 'host', null);
    const tier = null;
    const contributionBlocker = getContributionBlocker(loggedInUser, account, tier);
    expect(contributionBlocker).not.toBeNull();
    expect(contributionBlocker.reason).toBe('NO_HOST');
  });

  it('returns a blocker if no payment provider is available', () => {
    const loggedInUser = null;
    const account = set(cloneDeep(webpackCollective), 'host.supportedPaymentMethods', []);
    const tier = null;
    const contributionBlocker = getContributionBlocker(loggedInUser, account, tier);
    expect(contributionBlocker).not.toBeNull();
    expect(contributionBlocker.reason).toBe('NO_PAYMENT_PROVIDER');
  });

  it('returns a blocker if no payment provider is available for fixed recurring tier', () => {
    const loggedInUser = null;
    const testPaymentMethod = (paymentMethodType, shouldSupportRecurring) => {
      const account = set(cloneDeep(webpackCollective), 'host.supportedPaymentMethods', [paymentMethodType]);
      const tier = { interval: 'month' };
      const contributionBlocker = getContributionBlocker(loggedInUser, account, tier);

      if (shouldSupportRecurring) {
        expect(contributionBlocker).toBeNull();
      } else {
        expect(contributionBlocker).not.toBeNull();
        expect(contributionBlocker.reason).toBe('NO_PAYMENT_PROVIDER');
      }
    };

    // TODO: Must be tested with loggedInUser testPaymentMethod(GQLV2_PAYMENT_METHOD_LEGACY_TYPES.ACCOUNT_BALANCE, false);
    testPaymentMethod(GQLV2_PAYMENT_METHOD_LEGACY_TYPES.BANK_TRANSFER, false);
    testPaymentMethod(GQLV2_PAYMENT_METHOD_LEGACY_TYPES.CRYPTO, false);
    testPaymentMethod(GQLV2_PAYMENT_METHOD_LEGACY_TYPES.ALIPAY, false);

    testPaymentMethod(GQLV2_PAYMENT_METHOD_LEGACY_TYPES.CREDIT_CARD, true);
    testPaymentMethod(GQLV2_PAYMENT_METHOD_LEGACY_TYPES.PAYPAL, true);
  });
});
