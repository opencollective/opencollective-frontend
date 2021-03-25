import React from 'react';
import { find, get, sortBy, uniqBy } from 'lodash';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { GQLV2_PAYMENT_METHOD_TYPES } from '../../lib/constants/payment-methods';
import { getPaymentMethodName } from '../../lib/payment_method_label';
import {
  getPaymentMethodIcon,
  getPaymentMethodMetadata,
  isPaymentMethodDisabled,
} from '../../lib/payment-method-utils';

import CreditCardInactive from '../icons/CreditCardInactive';

export const NEW_CREDIT_CARD_KEY = 'newCreditCard';
export const BRAINTREE_KEY = 'braintree';

export const generatePaymentMethodOptions = (
  paymentMethods,
  stepProfile,
  stepDetails,
  stepSummary,
  collective,
  isRoot,
  hasNewPaypal,
) => {
  const supportedPaymentMethods = get(collective, 'host.supportedPaymentMethods', []);
  const hostHasManual = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.BANK_TRANSFER);
  const hostHasPaypal = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.PAYPAL);
  const hostHasStripe = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD);
  const hostHasBraintree = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.BRAINTREE_PAYPAL);
  const totalAmount = getTotalAmount(stepDetails, stepSummary);
  const interval = get(stepDetails, 'interval', null);

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

  uniquePMs = uniquePMs.filter(
    ({ paymentMethod }) =>
      paymentMethod.providerType !== GQLV2_PAYMENT_METHOD_TYPES.ACCOUNT_BALANCE ||
      collective.host.legacyId === stepProfile.host?.id,
  );

  // prepaid budget: limited to a specific host
  const matchesHostCollectiveIdPrepaid = prepaid => {
    const hostCollectiveLegacyId = get(collective, 'host.legacyId');
    const prepaidLimitedToHostCollectiveIds = get(prepaid, 'limitedToHosts');
    if (prepaidLimitedToHostCollectiveIds?.length) {
      return find(prepaidLimitedToHostCollectiveIds, { legacyId: hostCollectiveLegacyId });
    } else {
      return prepaid.data?.HostCollectiveId && prepaid.data.HostCollectiveId === hostCollectiveLegacyId;
    }
  };

  // gift card: can be limited to a specific host, see limitedToHosts
  const matchesHostCollectiveId = giftcard => {
    const hostCollectiveId = get(collective, 'host.id');
    const giftcardLimitedToHostCollectiveIds = get(giftcard, 'limitedToHosts');
    return find(giftcardLimitedToHostCollectiveIds, { id: hostCollectiveId });
  };

  uniquePMs = uniquePMs.filter(({ paymentMethod }) => {
    const sourcePaymentMethod = paymentMethod.sourcePaymentMethod || paymentMethod;
    const sourceProviderType = sourcePaymentMethod.providerType;

    if (paymentMethod.providerType === GQLV2_PAYMENT_METHOD_TYPES.GIFT_CARD && paymentMethod.limitedToHosts) {
      return matchesHostCollectiveId(paymentMethod);
    } else if (sourceProviderType === GQLV2_PAYMENT_METHOD_TYPES.PREPAID_BUDGET) {
      return matchesHostCollectiveIdPrepaid(sourcePaymentMethod);
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
    if (hostHasPaypal && (!interval || hasNewPaypal)) {
      uniquePMs.push({
        key: 'paypal',
        title: 'PayPal',
        paymentMethod: { type: GQLV2_PAYMENT_METHOD_TYPES.PAYPAL },
        icon: getPaymentMethodIcon({ service: 'paypal', type: 'payment' }, collective),
      });
    }

    // Manual (bank transfer)
    if (hostHasManual && !interval) {
      uniquePMs.push({
        key: 'manual',
        title: get(collective, 'host.settings.paymentMethods.manual.title', null) || 'Bank transfer',
        paymentMethod: { type: GQLV2_PAYMENT_METHOD_TYPES.BANK_TRANSFER },
        icon: getPaymentMethodIcon({ type: 'manual' }, collective),
        instructions: (
          <FormattedMessage
            id="NewContributionFlow.bankInstructions"
            defaultMessage="Instructions to make a transfer will be given on the next page."
          />
        ),
      });
    }

    if (hostHasBraintree && isRoot) {
      uniquePMs.push({
        key: 'braintree',
        title: 'PayPal (Braintree)', // TODO(Braintree): remove (Braintree) for the beta
        icon: getPaymentMethodIcon({ service: 'paypal', type: 'payment' }, collective),
      });
    }
  }

  return uniquePMs;
};

export const getTotalAmount = (stepDetails, stepSummary = null) => {
  const quantity = get(stepDetails, 'quantity') || 1;
  const amount = get(stepDetails, 'amount') || 0;
  const taxAmount = get(stepSummary, 'amount') || 0;
  const platformFeeAmount = get(stepDetails, 'platformContribution') || 0;
  return quantity * amount + platformFeeAmount + taxAmount;
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
  return ['octobox.io', 'dotnetfoundation.org', 'hopin.com'].includes(host);
};

const getCanonicalURL = (collective, tier) => {
  if (!tier) {
    return `${process.env.WEBSITE_URL}/${collective.slug}/donate`;
  } else if (collective.type === CollectiveType.EVENT) {
    const parentSlug = get(collective.parent, 'slug', collective.slug);
    return `${process.env.WEBSITE_URL}/${parentSlug}/events/${collective.slug}/order/${tier.id}`;
  } else {
    return `${process.env.WEBSITE_URL}/${collective.slug}/contribute/${tier.slug}-${tier.id}/checkout`;
  }
};

const PAGE_META_MSGS = defineMessages({
  collectiveTitle: {
    id: 'CreateOrder.Title',
    defaultMessage: 'Contribute to {collective}',
  },
  eventTitle: {
    id: 'CreateOrder.TitleForEvent',
    defaultMessage: 'Order tickets for {event}',
  },
});

export const getContributionFlowMetadata = (intl, account, tier) => {
  if (!account) {
    return { title: 'Contribute' };
  }

  return {
    canonicalURL: getCanonicalURL(account, tier),
    description: account.description,
    twitterHandle: account.twitterHandle,
    image: account.imageUrl || account.backgroundImageUrl,
    title:
      account.type === CollectiveType.EVENT
        ? intl.formatMessage(PAGE_META_MSGS.eventTitle, { event: account.name })
        : intl.formatMessage(PAGE_META_MSGS.collectiveTitle, { collective: account.name }),
  };
};
