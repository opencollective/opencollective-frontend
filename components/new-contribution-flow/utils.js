import React from 'react';
import { find, get, sortBy, uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { GQLV2_PAYMENT_METHOD_TYPES } from '../../lib/constants/payment-methods';
import { getPaymentMethodName } from '../../lib/payment_method_label';
import {
  getPaymentMethodIcon,
  getPaymentMethodMetadata,
  isPaymentMethodDisabled,
} from '../../lib/payment-method-utils';

import CreditCardInactive from '../../components/icons/CreditCardInactive';

export const NEW_CREDIT_CARD_KEY = 'newCreditCard';

export const generatePaymentMethodOptions = (paymentMethods, stepProfile, stepDetails, stepSummary, collective) => {
  const supportedPaymentMethods = get(collective, 'host.supportedPaymentMethods', []);
  const hostHasManual = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.BANK_TRANSFER);
  const hostHasPaypal = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.PAYPAL);
  const hostHasStripe = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD);
  const totalAmount = getTotalAmount(stepDetails, stepSummary);

  const paymentMethodsOptions = paymentMethods.map(pm => ({
    id: pm.id,
    key: `pm-${pm.id}`,
    title: getPaymentMethodName(pm),
    subtitle: getPaymentMethodMetadata(pm, totalAmount),
    icon: getPaymentMethodIcon(pm),
    disabled: isPaymentMethodDisabled(pm, totalAmount),
    paymentMethod: pm,
  }));

  let uniquePMs = uniqBy(paymentMethodsOptions, 'id');

  // if ORG filter out 'collective' type payment
  if (stepProfile.type === CollectiveType.ORGANIZATION) {
    uniquePMs = uniquePMs.filter(
      ({ paymentMethod }) => paymentMethod.providerType !== GQLV2_PAYMENT_METHOD_TYPES.ACCOUNT_BALANCE,
    );
  }

  // prepaid budget: limited to a specific host
  const matchesHostCollectiveIdPrepaid = prepaid => {
    const hostCollectiveLegacyId = get(collective, 'host.legacyId');
    const prepaidLimitedToHostCollectiveIds = get(prepaid, 'limitedToHosts');
    return find(prepaidLimitedToHostCollectiveIds, { legacyId: hostCollectiveLegacyId });
  };

  // gift card: can be limited to a specific host, see limitedToHosts
  const matchesHostCollectiveId = giftcard => {
    const hostCollectiveId = get(collective, 'host.id');
    const giftcardLimitedToHostCollectiveIds = get(giftcard, 'limitedToHosts');
    return find(giftcardLimitedToHostCollectiveIds, { id: hostCollectiveId });
  };

  uniquePMs = uniquePMs.filter(({ paymentMethod }) => {
    const sourceProviderType = paymentMethod.sourcePaymentMethod?.providerType ?? paymentMethod.providerType;

    if (paymentMethod.providerType === GQLV2_PAYMENT_METHOD_TYPES.GIFT_CARD && paymentMethod.limitedToHosts) {
      return matchesHostCollectiveId(paymentMethod);
    } else if (sourceProviderType === GQLV2_PAYMENT_METHOD_TYPES.PREPAID_BUDGET) {
      return matchesHostCollectiveIdPrepaid(paymentMethod);
    } else if (!hostHasStripe && sourceProviderType === GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD) {
      return false;
    } else {
      return true;
    }
  });

  // Put disabled PMs at the end
  uniquePMs = sortBy(uniquePMs, ['disabled', 'paymentMethod.providerType', 'id']);

  // adding payment methods
  if (stepProfile.type !== CollectiveType.COLLECTIVE) {
    if (hostHasStripe) {
      // New credit card
      uniquePMs.push({
        key: NEW_CREDIT_CARD_KEY,
        title: <FormattedMessage id="contribute.newcreditcard" defaultMessage="New credit/debit card" />,
        icon: <CreditCardInactive />,
      });
    }

    // Paypal
    if (hostHasPaypal && !stepDetails.interval) {
      uniquePMs.push({
        key: 'paypal',
        title: 'PayPal',
        paymentMethod: { type: GQLV2_PAYMENT_METHOD_TYPES.PAYPAL },
        icon: getPaymentMethodIcon({ service: 'paypal', type: 'payment' }, collective),
      });
    }

    // Manual (bank transfer)
    const interval = get(stepDetails, 'interval', null);
    if (hostHasManual && !interval) {
      uniquePMs.push({
        key: 'manual',
        title: get(collective, 'host.settings.paymentMethods.manual.title', null) || 'Bank transfer',
        paymentMethod: { type: GQLV2_PAYMENT_METHOD_TYPES.BANK_TRANSFER },
        icon: getPaymentMethodIcon({ type: 'manual' }, collective),
        instructions: (
          <FormattedMessage
            id="NewContributionFlow.bankInstructions"
            defaultMessage="Instructions will be given on the next page to make a transfer."
          />
        ),
      });
    }
  }

  return uniquePMs;
};

export const getTotalAmount = (stepDetails, stepSummary) => {
  const quantity = get(stepDetails, 'quantity') || 1;
  const amount = get(stepDetails, 'amount') || 0;
  const taxAmount = get(stepSummary, 'amount') || 0;
  const platformFeeAmount = get(stepDetails, 'platformContribution') || 0;
  return quantity * (amount + platformFeeAmount) + taxAmount;
};

export const getGQLV2AmountInput = (valueInCents, defaultValue) => {
  if (valueInCents) {
    return { valueInCents };
  } else if (typeof defaultValue === 'number') {
    return { valueInCents: defaultValue };
  } else {
    return defaultValue;
  }
};

export const isAllowedRedirect = host => {
  return ['octobox.io', 'dotnetfoundation.org'].includes(host);
};
