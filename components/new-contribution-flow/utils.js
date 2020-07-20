import * as LibTaxes from '@opencollective/taxes';
import { get } from 'lodash';

import { AmountTypes } from '../../lib/constants/tiers-types';
import { VAT_OPTIONS } from '../../lib/constants/vat';

/** Returns true if the price and interval of the current contribution cannot be changed */
export const isFixedContribution = (tier, fixedAmount, fixedInterval) => {
  const forceInterval = Boolean(tier) || Boolean(fixedInterval);
  const forceAmount = (tier && tier.amountType === AmountTypes.FIXED) || fixedAmount;
  const isFlexible = tier && tier.amountType === AmountTypes.FLEXIBLE;
  return !isFlexible && forceInterval && forceAmount;
};

/** Get the min authorized amount for order, in cents */
export const getTierMinAmount = tier => {
  if (!tier) {
    // When making a donation, min amount is $1
    return 100;
  } else if (tier.amountType === AmountTypes.FIXED) {
    return tier.amount || 0;
  } else {
    return tier.minimumAmount || 0;
  }
};

/** Returns true if taxes may apply with this tier/host */
export const taxesMayApply = (collective, host, tier) => {
  if (!tier) {
    return false;
  }

  // Don't apply VAT if not configured (default)
  const vatType = get(collective, 'settings.VAT.type') || get(collective, 'parentCollective.settings.VAT.type');
  const hostCountry = get(host.location, 'country');
  const collectiveCountry = get(collective.location, 'country');
  const parentCountry = get(collective, 'parentCollective.location.country');
  const country = collectiveCountry || parentCountry || hostCountry;

  if (!vatType) {
    return false;
  } else if (vatType === VAT_OPTIONS.OWN) {
    return LibTaxes.getVatOriginCountry(tier.type, country, country);
  } else {
    return LibTaxes.getVatOriginCountry(tier.type, hostCountry, country);
  }
};
