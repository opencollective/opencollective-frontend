import * as LibTaxes from '@opencollective/taxes';
import { get, isNil, uniq } from 'lodash';

import { CollectiveType } from '../../lib/constants/collectives';
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
    return tier.amount?.valueInCents || 0;
  } else if (tier.minimumAmount) {
    return tier.minimumAmount.valueInCents;
  } else {
    return 0;
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

const DEFAULT_PRESETS = [0, 500, 1000, 1500, 5000];
const DEFAULT_FUNDS_PRESETS = [100000, 200000, 500000, 1000000];

export const getTierPresets = (tier, collectiveType) => {
  if (tier?.presets?.length > 0) {
    return tier.presets;
  } else if (collectiveType === CollectiveType.FUND) {
    return DEFAULT_FUNDS_PRESETS;
  } else if (!tier) {
    return DEFAULT_PRESETS;
  }

  const minAmount = getTierMinAmount(tier);
  if (minAmount === 0) {
    return [0, 500, 1500, 5000];
  } else if (minAmount < 1000) {
    return [minAmount, 1000, 2500, 5000];
  } else {
    const roundAmount = amount => {
      const amountSize = amount.toString().length;
      const roundingFactor = Math.pow(10, amountSize - 1);
      return Math.round(Math.round(amount / roundingFactor) * roundingFactor);
    };
    return uniq([minAmount, roundAmount(minAmount * 2), roundAmount(minAmount * 3), roundAmount(minAmount * 5)]);
  }
};

export const getDefaultAmount = tier => {
  if (tier && !isNil(tier.amount?.valueInCents)) {
    return tier.amount.valueInCents;
  } else if (getTierMinAmount(tier) === 0) {
    // Free tiers are free per default, even when user can make a donation
    return 0;
  } else {
    const presets = getTierPresets(tier);
    return presets[Math.floor(presets.length / 2)];
  }
};
