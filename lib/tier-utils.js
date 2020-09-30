import { isNil, min, uniq } from 'lodash';

import { CollectiveType } from './constants/collectives';
import { AmountTypes } from './constants/tiers-types';

const DEFAULT_PRESETS = [500, 1000, 2000, 5000];
const DEFAULT_FUNDS_PRESETS = [100000, 200000, 500000, 1000000];
const DEFAULT_MINIMUM_AMOUNT = 100;

/**
 * Get the min authorized amount for order, in cents.
 * ⚠️ Only work with data from GQLV2.
 */
export const getTierMinAmount = tier => {
  if (!tier) {
    // When making a donation, min amount is $1
    return DEFAULT_MINIMUM_AMOUNT;
  } else if (tier.amountType === AmountTypes.FIXED) {
    return tier.amount?.valueInCents || 0;
  } else if (tier.minimumAmount.valueInCents !== null) {
    return tier.minimumAmount.valueInCents;
  } else if (tier.presets?.length && min(tier.presets) === 0) {
    return 0;
  } else {
    return DEFAULT_MINIMUM_AMOUNT;
  }
};

/**
 * Get the presets for a given tier, or the default presets
 * ⚠️ Only work with data from GQLV2.
 */
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

/**
 * Returns the default selected amount from a tier.
 * ⚠️ Only work with data from GQLV2.
 */
export const getDefaultTierAmount = tier => {
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

/** Returns true if the price and interval of the current contribution cannot be changed */
export const isFixedContribution = (tier, fixedAmount, fixedInterval) => {
  const forceInterval = Boolean(tier) || Boolean(fixedInterval);
  const forceAmount = (tier && tier.amountType === AmountTypes.FIXED) || fixedAmount;
  const isFlexible = tier && tier.amountType === AmountTypes.FLEXIBLE;
  return !isFlexible && forceInterval && forceAmount;
};

export const isTierExpired = tier => {
  return tier?.endsAt && new Date(tier.endsAt) < new Date();
};
